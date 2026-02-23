from datetime import datetime
from sqlalchemy.orm import Session
from ..models import Business, ResponseJob, Review
from .ai_writer import generate_review_reply
from .publisher import publish_reply_google_mock


async def process_review_job(db: Session, review_id: int) -> None:
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        return

    business = db.query(Business).filter(Business.id == review.business_id).first()
    if not business:
        review.status = "failed"
        db.commit()
        return

    job = db.query(ResponseJob).filter(ResponseJob.review_id == review.id).first()
    if not job:
        job = ResponseJob(review_id=review.id, status="queued")
        db.add(job)
        db.commit()
        db.refresh(job)

    try:
        job.status = "generating"
        review.status = "processing"
        db.commit()

        reply_text = await generate_review_reply(
            business_name=business.name,
            tone=business.tone,
            rating=review.rating,
            review_text=review.text,
        )
        job.generated_text = reply_text

        if business.autopublish_enabled:
            job.status = "publishing"
            db.commit()
            ok = await publish_reply_google_mock(review.external_review_id, reply_text)
            if not ok:
                raise RuntimeError("publish failed")
            job.status = "published"
            job.published_at = datetime.utcnow()
            review.status = "responded"
        else:
            job.status = "draft_ready"
            review.status = "draft_ready"

        db.commit()
    except Exception as exc:
        job.status = "error"
        job.error = str(exc)
        review.status = "failed"
        db.commit()
