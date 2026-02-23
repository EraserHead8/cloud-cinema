from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field


class AuthRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class BusinessCreate(BaseModel):
    name: str
    tone: str = "friendly"
    locale: str = "en"
    plan: str = "starter"


class BusinessOut(BaseModel):
    id: int
    name: str
    tone: str
    locale: str
    autopublish_enabled: int

    class Config:
        from_attributes = True


class ReviewIngest(BaseModel):
    business_id: int
    external_review_id: str
    author_name: str
    rating: int = Field(ge=1, le=5)
    text: str = ""
    source: str = "google"


class ReviewOut(BaseModel):
    id: int
    business_id: int
    external_review_id: str
    author_name: str
    rating: int
    text: str
    source: str
    status: str
    created_at: datetime
    response_text: Optional[str] = None
    response_status: Optional[str] = None


class MetricsOut(BaseModel):
    active_businesses: int
    active_subscriptions: int
    monthly_revenue_usd: float
    weekly_revenue_usd: float
    reviews_processed: int
    autopublished: int


class StripeCheckoutIn(BaseModel):
    business_id: int
    success_url: str
    cancel_url: str


class StripeCheckoutOut(BaseModel):
    checkout_url: str
    session_id: str
    mode: str


class GoogleAuthUrlOut(BaseModel):
    auth_url: str
    mode: str


class GoogleCallbackIn(BaseModel):
    business_id: int
    code: str


class IntegrationStatusOut(BaseModel):
    business_id: int
    google_status: str
    stripe_status: str
