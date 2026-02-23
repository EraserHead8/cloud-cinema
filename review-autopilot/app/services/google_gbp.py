import time
from urllib.parse import urlencode
import httpx

from ..settings import (
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI,
    MOCK_MODE,
)


def build_auth_url(state: str) -> str:
    if MOCK_MODE or not GOOGLE_CLIENT_ID or not GOOGLE_REDIRECT_URI:
        return f"https://mock.google/connect?state={state}"

    params = {
        "client_id": GOOGLE_CLIENT_ID,
        "redirect_uri": GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": "https://www.googleapis.com/auth/business.manage",
        "access_type": "offline",
        "prompt": "consent",
        "state": state,
    }
    return f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode(params)}"


async def exchange_code(code: str) -> dict:
    if MOCK_MODE or not GOOGLE_CLIENT_ID:
        now = int(time.time())
        return {
            "access_token": f"mock_access_{now}",
            "refresh_token": f"mock_refresh_{now}",
            "expires_in": 3600,
            "account_name": "accounts/mock-account",
            "location_name": "accounts/mock-account/locations/mock-location",
            "mode": "mock",
        }

    payload = {
        "code": code,
        "client_id": GOOGLE_CLIENT_ID,
        "client_secret": GOOGLE_CLIENT_SECRET,
        "redirect_uri": GOOGLE_REDIRECT_URI,
        "grant_type": "authorization_code",
    }
    async with httpx.AsyncClient(timeout=20.0) as client:
        token_resp = await client.post("https://oauth2.googleapis.com/token", data=payload)
        token_resp.raise_for_status()
        token_data = token_resp.json()

    # Account/location fetch can be added here when real creds are wired.
    token_data["account_name"] = "accounts/real-account"
    token_data["location_name"] = "accounts/real-account/locations/real-location"
    token_data["mode"] = "live"
    return token_data


async def fetch_recent_reviews(access_token: str, location_name: str) -> list[dict]:
    if MOCK_MODE:
        now = int(time.time())
        return [
            {
                "external_review_id": f"google-{now}",
                "author_name": "Alice",
                "rating": 5,
                "text": "Excellent staff and quick support.",
                "source": "google",
            }
        ]

    url = f"https://mybusiness.googleapis.com/v4/{location_name}/reviews"
    headers = {"Authorization": f"Bearer {access_token}"}
    async with httpx.AsyncClient(timeout=20.0) as client:
        resp = await client.get(url, headers=headers)
        resp.raise_for_status()
        data = resp.json()

    out = []
    star_map = {"ONE": 1, "TWO": 2, "THREE": 3, "FOUR": 4, "FIVE": 5}
    for item in data.get("reviews", []):
        star = item.get("starRating", "FIVE")
        out.append(
            {
                "external_review_id": item.get("reviewId", ""),
                "author_name": item.get("reviewer", {}).get("displayName", "Anonymous"),
                "rating": star_map.get(star, 5),
                "text": item.get("comment", ""),
                "source": "google",
            }
        )
    return out
