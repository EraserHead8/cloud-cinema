import hashlib
import hmac
import json
import time
from typing import Optional
import httpx

from ..settings import (
    MOCK_MODE,
    STRIPE_PRICE_PRO,
    STRIPE_PRICE_STARTER,
    STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET,
)


def _resolve_price_id(plan: str) -> str:
    if plan == "pro":
        return STRIPE_PRICE_PRO
    return STRIPE_PRICE_STARTER


async def create_checkout_session(plan: str, customer_email: str, success_url: str, cancel_url: str) -> dict:
    if MOCK_MODE or not STRIPE_SECRET_KEY:
        fake_session = f"cs_test_{int(time.time())}"
        return {
            "id": fake_session,
            "url": f"{success_url}?session_id={fake_session}",
            "mode": "mock",
        }

    price_id = _resolve_price_id(plan)
    if not price_id:
        raise RuntimeError("Stripe price id is not configured")

    data = {
        "mode": "subscription",
        "success_url": success_url,
        "cancel_url": cancel_url,
        "line_items[0][price]": price_id,
        "line_items[0][quantity]": "1",
        "customer_email": customer_email,
    }

    async with httpx.AsyncClient(timeout=20.0) as client:
        resp = await client.post(
            "https://api.stripe.com/v1/checkout/sessions",
            data=data,
            auth=(STRIPE_SECRET_KEY, ""),
        )
        resp.raise_for_status()
        return resp.json()


def verify_webhook_signature(payload: bytes, stripe_signature: Optional[str]) -> bool:
    if MOCK_MODE or not STRIPE_WEBHOOK_SECRET:
        return True
    if not stripe_signature:
        return False

    try:
        parts = dict(item.split("=", 1) for item in stripe_signature.split(","))
        timestamp = parts.get("t", "")
        signature = parts.get("v1", "")
    except Exception:
        return False

    signed_payload = f"{timestamp}.{payload.decode('utf-8')}".encode("utf-8")
    expected = hmac.new(
        STRIPE_WEBHOOK_SECRET.encode("utf-8"),
        signed_payload,
        hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(expected, signature)


def parse_event(payload: bytes) -> dict:
    return json.loads(payload.decode("utf-8"))
