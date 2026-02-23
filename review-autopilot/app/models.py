from datetime import datetime
from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    businesses = relationship("Business", back_populates="owner")


class Business(Base):
    __tablename__ = "businesses"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    tone = Column(String(100), default="friendly")
    locale = Column(String(10), default="en")
    google_location_id = Column(String(128), unique=True, nullable=True)
    autopublish_enabled = Column(Integer, default=1, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    owner = relationship("User", back_populates="businesses")
    subscription = relationship("Subscription", uselist=False, back_populates="business")
    reviews = relationship("Review", back_populates="business")
    google_connection = relationship("GoogleConnection", uselist=False, back_populates="business")
    stripe_customer = relationship("StripeCustomer", uselist=False, back_populates="business")


class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(Integer, primary_key=True)
    business_id = Column(Integer, ForeignKey("businesses.id"), nullable=False, unique=True)
    plan = Column(String(50), default="starter", nullable=False)
    amount_usd = Column(Float, default=79.0, nullable=False)
    status = Column(String(20), default="active", nullable=False)
    billing_cycle = Column(String(20), default="monthly", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    business = relationship("Business", back_populates="subscription")


class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True)
    business_id = Column(Integer, ForeignKey("businesses.id"), nullable=False, index=True)
    external_review_id = Column(String(128), nullable=False)
    author_name = Column(String(255), nullable=False)
    rating = Column(Integer, nullable=False)
    text = Column(Text, default="")
    source = Column(String(30), default="google", nullable=False)
    status = Column(String(20), default="received", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    business = relationship("Business", back_populates="reviews")
    response_job = relationship("ResponseJob", uselist=False, back_populates="review")

    __table_args__ = (
        UniqueConstraint("business_id", "external_review_id", name="uq_business_review"),
    )


class ResponseJob(Base):
    __tablename__ = "response_jobs"

    id = Column(Integer, primary_key=True)
    review_id = Column(Integer, ForeignKey("reviews.id"), nullable=False, unique=True)
    generated_text = Column(Text, nullable=True)
    provider = Column(String(50), default="openai", nullable=False)
    status = Column(String(30), default="queued", nullable=False)
    error = Column(Text, nullable=True)
    published_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    review = relationship("Review", back_populates="response_job")


class GoogleConnection(Base):
    __tablename__ = "google_connections"

    id = Column(Integer, primary_key=True)
    business_id = Column(Integer, ForeignKey("businesses.id"), nullable=False, unique=True, index=True)
    account_name = Column(String(255), nullable=True)
    location_name = Column(String(255), nullable=True)
    access_token = Column(Text, nullable=True)
    refresh_token = Column(Text, nullable=True)
    token_expires_at = Column(DateTime, nullable=True)
    status = Column(String(20), default="disconnected", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    business = relationship("Business", back_populates="google_connection")


class StripeCustomer(Base):
    __tablename__ = "stripe_customers"

    id = Column(Integer, primary_key=True)
    business_id = Column(Integer, ForeignKey("businesses.id"), nullable=False, unique=True, index=True)
    customer_id = Column(String(128), nullable=True)
    subscription_id = Column(String(128), nullable=True)
    checkout_session_id = Column(String(128), nullable=True)
    status = Column(String(30), default="pending", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    business = relationship("Business", back_populates="stripe_customer")
