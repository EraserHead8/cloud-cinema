import asyncio
from sqlalchemy.orm import Session

from ..database import SessionLocal
from ..models import Business, GoogleConnection, Review
from .google_gbp import fetch_recent_reviews
from .pipeline import process_review_job


async def sync_connected_businesses_once() -> int:
    db: Session = SessionLocal()
    ingested_total = 0
    try:
        connections = db.query(GoogleConnection).filter(GoogleConnection.status == "connected").all()
        for conn in connections:
            business = db.query(Business).filter(Business.id == conn.business_id).first()
            if not business:
                continue

            reviews = await fetch_recent_reviews(
                access_token=conn.access_token or "",
                location_name=conn.location_name or "",
            )

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
                ingested_total += 1

        return ingested_total
    finally:
        db.close()


async def autosync_loop(interval_seconds: int) -> None:
    while True:
        try:
            await sync_connected_businesses_once()
        except asyncio.CancelledError:
            raise
        except Exception as exc:
            print(f"[autosync] error: {exc}")
        await asyncio.sleep(interval_seconds)
