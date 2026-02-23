import asyncio
from datetime import datetime, timedelta
from pathlib import Path
from fastapi import Depends, FastAPI, Header, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from sqlalchemy import func
from sqlalchemy.orm import Session

from . import auth, schemas
from .database import Base, engine, get_db
from .models import (
    Business,
    GoogleConnection,
    ResponseJob,
    Review,
    StripeCustomer,
    Subscription,
    User,
)
from .services.google_gbp import build_auth_url, exchange_code, fetch_recent_reviews
from .services.pipeline import process_review_job
from .services.scheduler import autosync_loop, sync_connected_businesses_once
from .services.stripe_gateway import create_checkout_session, parse_event, verify_webhook_signature
from .settings import AUTO_SYNC_ENABLED, SYNC_INTERVAL_SECONDS

app = FastAPI(title="AI Review Autopilot")
WEB_DIR = Path(__file__).resolve().parent.parent / "web"
AUTOSYNC_TASK: asyncio.Task | None = None

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    global AUTOSYNC_TASK
    Base.metadata.create_all(bind=engine)
    if AUTO_SYNC_ENABLED:
        AUTOSYNC_TASK = asyncio.create_task(autosync_loop(SYNC_INTERVAL_SECONDS))


@app.on_event("shutdown")
async def on_shutdown() -> None:
    global AUTOSYNC_TASK
    if AUTOSYNC_TASK:
        AUTOSYNC_TASK.cancel()
        try:
            await AUTOSYNC_TASK
        except asyncio.CancelledError:
            pass
        AUTOSYNC_TASK = None


@app.get("/health")
def health() -> dict:
    return {
        "status": "ok",
        "autosync_enabled": AUTO_SYNC_ENABLED,
        "sync_interval_seconds": SYNC_INTERVAL_SECONDS,
    }


@app.get("/")
def dashboard() -> FileResponse:
    return FileResponse(WEB_DIR / "index.html")


@app.post("/api/auth/register", response_model=schemas.AuthResponse)
def register(req: schemas.AuthRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == req.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(email=req.email, hashed_password=auth.hash_password(req.password))
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"access_token": auth.create_token(user.id), "token_type": "bearer"}


@app.post("/api/auth/login", response_model=schemas.AuthResponse)
def login(req: schemas.AuthRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if not user or not auth.verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return {"access_token": auth.create_token(user.id), "token_type": "bearer"}


@app.post("/api/businesses", response_model=schemas.BusinessOut)
def create_business(
    payload: schemas.BusinessCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_user),
):
    business = Business(
        user_id=current_user.id,
        name=payload.name,
        tone=payload.tone,
        locale=payload.locale,
    )
    db.add(business)
    db.commit()
    db.refresh(business)

    amount = 79.0 if payload.plan == "starter" else 149.0
    sub = Subscription(business_id=business.id, plan=payload.plan, amount_usd=amount, status="active")
    db.add(sub)
    db.commit()

    return business


@app.get("/api/businesses")
def list_businesses(
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_user),
):
    businesses = db.query(Business).filter(Business.user_id == current_user.id).order_by(Business.id.desc()).all()
    return [
        {
            "id": b.id,
            "name": b.name,
            "tone": b.tone,
            "locale": b.locale,
            "autopublish_enabled": b.autopublish_enabled,
        }
        for b in businesses
    ]


@app.post("/api/reviews/ingest", response_model=schemas.ReviewOut)
async def ingest_review(
    payload: schemas.ReviewIngest,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_user),
):
    business = db.query(Business).filter(Business.id == payload.business_id, Business.user_id == current_user.id).first()
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")

    existing = db.query(Review).filter(
        Review.business_id == payload.business_id,
        Review.external_review_id == payload.external_review_id,
    ).first()
    if existing:
        job = db.query(ResponseJob).filter(ResponseJob.review_id == existing.id).first()
        return schemas.ReviewOut(
            id=existing.id,
            business_id=existing.business_id,
            external_review_id=existing.external_review_id,
            author_name=existing.author_name,
            rating=existing.rating,
            text=existing.text,
            source=existing.source,
            status=existing.status,
            created_at=existing.created_at,
            response_text=job.generated_text if job else None,
            response_status=job.status if job else None,
        )

    review = Review(
        business_id=payload.business_id,
        external_review_id=payload.external_review_id,
        author_name=payload.author_name,
        rating=payload.rating,
        text=payload.text,
        source=payload.source,
    )
    db.add(review)
    db.commit()
    db.refresh(review)

    await process_review_job(db, review.id)

    db.refresh(review)
    job = db.query(ResponseJob).filter(ResponseJob.review_id == review.id).first()

    return schemas.ReviewOut(
        id=review.id,
        business_id=review.business_id,
        external_review_id=review.external_review_id,
        author_name=review.author_name,
        rating=review.rating,
        text=review.text,
        source=review.source,
        status=review.status,
        created_at=review.created_at,
        response_text=job.generated_text if job else None,
        response_status=job.status if job else None,
    )


@app.get("/api/reviews", response_model=list[schemas.ReviewOut])
def list_reviews(
    business_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_user),
):
    business = db.query(Business).filter(Business.id == business_id, Business.user_id == current_user.id).first()
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")

    reviews = db.query(Review).filter(Review.business_id == business_id).order_by(Review.id.desc()).all()
    out = []
    for r in reviews:
        job = db.query(ResponseJob).filter(ResponseJob.review_id == r.id).first()
        out.append(
            schemas.ReviewOut(
                id=r.id,
                business_id=r.business_id,
                external_review_id=r.external_review_id,
                author_name=r.author_name,
                rating=r.rating,
                text=r.text,
                source=r.source,
                status=r.status,
                created_at=r.created_at,
                response_text=job.generated_text if job else None,
                response_status=job.status if job else None,
            )
        )
    return out


@app.get("/api/metrics", response_model=schemas.MetricsOut)
def get_metrics(
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_user),
):
    businesses = db.query(Business).filter(Business.user_id == current_user.id).all()
    business_ids = [b.id for b in businesses]

    if not business_ids:
        return schemas.MetricsOut(
            active_businesses=0,
            active_subscriptions=0,
            monthly_revenue_usd=0,
            weekly_revenue_usd=0,
            reviews_processed=0,
            autopublished=0,
        )

    active_subscriptions = db.query(Subscription).filter(
        Subscription.business_id.in_(business_ids),
        Subscription.status == "active",
    ).all()
    mrr = float(sum(s.amount_usd for s in active_subscriptions))

    reviews_processed = db.query(func.count(Review.id)).filter(Review.business_id.in_(business_ids)).scalar() or 0
    autopublished = db.query(func.count(ResponseJob.id)).join(Review, Review.id == ResponseJob.review_id).filter(
        Review.business_id.in_(business_ids),
        ResponseJob.status == "published",
    ).scalar() or 0

    return schemas.MetricsOut(
        active_businesses=len(businesses),
        active_subscriptions=len(active_subscriptions),
        monthly_revenue_usd=round(mrr, 2),
        weekly_revenue_usd=round(mrr / 4.0, 2),
        reviews_processed=reviews_processed,
        autopublished=autopublished,
    )


@app.post("/api/integrations/stripe/checkout-session", response_model=schemas.StripeCheckoutOut)
async def create_stripe_checkout(
    payload: schemas.StripeCheckoutIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_user),
):
    business = db.query(Business).filter(Business.id == payload.business_id, Business.user_id == current_user.id).first()
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")

    sub = db.query(Subscription).filter(Subscription.business_id == business.id).first()
    if not sub:
        raise HTTPException(status_code=400, detail="Subscription is missing")

    session = await create_checkout_session(
        plan=sub.plan,
        customer_email=current_user.email,
        success_url=payload.success_url,
        cancel_url=payload.cancel_url,
    )

    stripe_customer = db.query(StripeCustomer).filter(StripeCustomer.business_id == business.id).first()
    if not stripe_customer:
        stripe_customer = StripeCustomer(business_id=business.id)
        db.add(stripe_customer)

    stripe_customer.checkout_session_id = session["id"]
    stripe_customer.status = "checkout_created"
    stripe_customer.updated_at = datetime.utcnow()
    db.commit()

    return schemas.StripeCheckoutOut(
        checkout_url=session["url"],
        session_id=session["id"],
        mode=session.get("mode", "live"),
    )


@app.post("/api/integrations/stripe/webhook")
async def stripe_webhook(
    request: Request,
    stripe_signature: str | None = Header(default=None, alias="Stripe-Signature"),
    db: Session = Depends(get_db),
):
    payload = await request.body()
    if not verify_webhook_signature(payload, stripe_signature):
        raise HTTPException(status_code=400, detail="Invalid Stripe signature")

    event = parse_event(payload)
    event_type = event.get("type", "")
    obj = event.get("data", {}).get("object", {})

    if event_type == "checkout.session.completed":
        session_id = obj.get("id")
        stripe_customer = db.query(StripeCustomer).filter(StripeCustomer.checkout_session_id == session_id).first()
        if stripe_customer:
            stripe_customer.customer_id = obj.get("customer")
            stripe_customer.subscription_id = obj.get("subscription")
            stripe_customer.status = "active"
            stripe_customer.updated_at = datetime.utcnow()

            sub = db.query(Subscription).filter(Subscription.business_id == stripe_customer.business_id).first()
            if sub:
                sub.status = "active"
            db.commit()

    return {"received": True}


@app.get("/api/integrations/google/auth-url", response_model=schemas.GoogleAuthUrlOut)
def google_auth_url(
    business_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_user),
):
    business = db.query(Business).filter(Business.id == business_id, Business.user_id == current_user.id).first()
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    url = build_auth_url(state=str(business.id))
    mode = "mock" if "mock.google" in url else "live"
    return schemas.GoogleAuthUrlOut(auth_url=url, mode=mode)


@app.post("/api/integrations/google/callback")
async def google_callback(
    payload: schemas.GoogleCallbackIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_user),
):
    business = db.query(Business).filter(Business.id == payload.business_id, Business.user_id == current_user.id).first()
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")

    token_data = await exchange_code(payload.code)

    connection = db.query(GoogleConnection).filter(GoogleConnection.business_id == business.id).first()
    if not connection:
        connection = GoogleConnection(business_id=business.id)
        db.add(connection)

    connection.account_name = token_data.get("account_name")
    connection.location_name = token_data.get("location_name")
    connection.access_token = token_data.get("access_token")
    connection.refresh_token = token_data.get("refresh_token")
    connection.token_expires_at = datetime.utcnow() + timedelta(seconds=int(token_data.get("expires_in", 3600)))
    connection.status = "connected"
    connection.updated_at = datetime.utcnow()
    db.commit()

    return {"status": "connected", "mode": token_data.get("mode", "live")}


@app.post("/api/integrations/google/sync-reviews")
async def google_sync_reviews(
    business_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_user),
):
    business = db.query(Business).filter(Business.id == business_id, Business.user_id == current_user.id).first()
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")

    connection = db.query(GoogleConnection).filter(GoogleConnection.business_id == business.id).first()
    if not connection or connection.status != "connected":
        raise HTTPException(status_code=400, detail="Google is not connected")

    reviews = await fetch_recent_reviews(
        access_token=connection.access_token or "",
        location_name=connection.location_name or "",
    )

    ingested = 0
    for item in reviews:
        existing = db.query(Review).filter(
            Review.business_id == business.id,
            Review.external_review_id == item["external_review_id"],
        ).first()
        if existing:
            continue

        review = Review(
            business_id=business.id,
            external_review_id=item["external_review_id"],
            author_name=item["author_name"],
            rating=item["rating"],
            text=item["text"],
            source=item.get("source", "google"),
        )
        db.add(review)
        db.commit()
        db.refresh(review)
        await process_review_job(db, review.id)
        ingested += 1

    return {"status": "ok", "ingested": ingested}


@app.get("/api/integrations/status", response_model=schemas.IntegrationStatusOut)
def integration_status(
    business_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_user),
):
    business = db.query(Business).filter(Business.id == business_id, Business.user_id == current_user.id).first()
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")

    google_conn = db.query(GoogleConnection).filter(GoogleConnection.business_id == business.id).first()
    stripe_conn = db.query(StripeCustomer).filter(StripeCustomer.business_id == business.id).first()

    return schemas.IntegrationStatusOut(
        business_id=business.id,
        google_status=google_conn.status if google_conn else "disconnected",
        stripe_status=stripe_conn.status if stripe_conn else "disconnected",
    )


@app.post("/api/system/run-autosync-now")
async def run_autosync_now(
    current_user: User = Depends(auth.get_current_user),
):
    ingested = await sync_connected_businesses_once()
    return {"status": "ok", "ingested": ingested}
