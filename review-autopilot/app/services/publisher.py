import asyncio


async def publish_reply_google_mock(external_review_id: str, reply_text: str) -> bool:
    # Placeholder for Google Business Profile API publish call.
    # Kept async to match real provider integration.
    await asyncio.sleep(0.05)
    return bool(external_review_id and reply_text)
