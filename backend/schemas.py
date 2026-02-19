from pydantic import BaseModel
from typing import Optional, List, Any


# --- Auth Schemas ---
class AuthRequest(BaseModel):
    email: str
    password: str


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


# --- Movie Schemas ---
class MovieBase(BaseModel):
    title: str
    poster_url: Optional[str] = None
    video_url: Optional[str] = None
    rating: Optional[str] = None
    year: Optional[str] = ""
    status: str = "pending"


class MovieCreate(MovieBase):
    pass


class Movie(MovieBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True


class Command(BaseModel):
    text: str


class SearchResult(BaseModel):
    title: str
    poster_url: Optional[str] = None
    video_url: Optional[str] = None
    rating: Optional[str] = None
    year: Optional[str] = ""
    status: Optional[str] = "ready"


class CommandResponse(BaseModel):
    status: str  # "success", "error", "selection_needed"
    message: str
    data: Optional[List[Any]] = None
