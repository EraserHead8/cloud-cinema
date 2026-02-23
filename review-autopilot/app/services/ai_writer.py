import os
import httpx

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")


async def generate_review_reply(business_name: str, tone: str, rating: int, review_text: str) -> str:
    if not OPENAI_API_KEY:
        return fallback_reply(business_name, tone, rating)

    prompt = (
        "You are a support assistant for local business review replies. "
        "Write one concise, polite response in the same language as the review. "
        f"Business: {business_name}. Tone: {tone}. Rating: {rating}/5. "
        f"Review: {review_text}"
    )

    headers = {
        "Authorization": f"Bearer {OPENAI_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": OPENAI_MODEL,
        "input": prompt,
    }

    async with httpx.AsyncClient(timeout=20.0) as client:
        resp = await client.post("https://api.openai.com/v1/responses", headers=headers, json=payload)
        resp.raise_for_status()
        data = resp.json()

    text = data.get("output_text", "").strip()
    return text or fallback_reply(business_name, tone, rating)


def fallback_reply(business_name: str, tone: str, rating: int) -> str:
    if rating >= 4:
        return f"Спасибо за отзыв о {business_name}! Очень рады, что вам понравилось. Будем ждать вас снова."
    return (
        f"Спасибо, что поделились обратной связью о {business_name}. "
        "Нам жаль, что впечатление было неидеальным. Мы уже работаем над улучшениями."
    )
