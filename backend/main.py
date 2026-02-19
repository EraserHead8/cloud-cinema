
import asyncio
import httpx
from fastapi import FastAPI, BackgroundTasks, HTTPException, Depends
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from typing import List, Dict
from . import models, schemas, database, auth
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# CORS config
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)



# Initialize DB
models.Base.metadata.create_all(bind=database.engine)

# --- KINOPOISK API ---
KP_TOKEN = "8c8e1a50-6322-4135-8875-5d40a5420d86"

# Per-user search results (keyed by user_id)
USER_SEARCH_RESULTS: Dict[int, list] = {}


async def search_kinopoisk(query: str):
    headers = {"X-API-KEY": KP_TOKEN, "Content-Type": "application/json"}
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"https://kinopoiskapiunofficial.tech/api/v2.1/films/search-by-keyword?keyword={query}",
            headers=headers
        )
        data = resp.json()
        results = []
        for film in data.get("films", [])[:5]:
            title = film.get("nameRu") or film.get("nameEn") or "Без названия"
            year = film.get("year", "")
            poster = film.get("posterUrl", "")
            rating = film.get("rating", "")
            results.append({
                "title": f"{title} ({year})" if year else title,
                "poster_url": poster,
                "video_url": f"KP:{film.get('filmId')}",
                "rating": str(rating) if rating else "",
                "year": str(year),
                "status": "ready"
            })
        return results


# ========================
# AUTH ENDPOINTS (public)
# ========================

@app.post("/api/register", response_model=schemas.AuthResponse)
def register(req: schemas.AuthRequest, db: Session = Depends(auth.get_db)):
    # Check if email already taken
    existing = db.query(models.User).filter(models.User.email == req.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Этот email уже зарегистрирован")

    user = models.User(
        email=req.email,
        hashed_password=auth.hash_password(req.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = auth.create_access_token(user.id)
    return {"access_token": token, "token_type": "bearer"}


@app.post("/api/login", response_model=schemas.AuthResponse)
def login(req: schemas.AuthRequest, db: Session = Depends(auth.get_db)):
    user = db.query(models.User).filter(models.User.email == req.email).first()
    if not user or not auth.verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Неверный email или пароль")

    token = auth.create_access_token(user.id)
    return {"access_token": token, "token_type": "bearer"}


# ========================
# PROTECTED ENDPOINTS
# ========================

@app.post("/command")
async def process_command(
    command: schemas.Command,
    db: Session = Depends(auth.get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    cmd = command.text.strip()
    cmd_lower = cmd.lower()

    # --- SELECT COMMAND ---
    if cmd_lower.startswith("select ") or cmd_lower.startswith("выбери "):
        try:
            parts = cmd.split()
            index = int(parts[1]) - 1  # User types 1-based
            user_results = USER_SEARCH_RESULTS.get(current_user.id, [])
            if 0 <= index < len(user_results):
                selected = user_results[index]
                # Check duplicates for THIS user
                existing = db.query(models.Movie).filter(
                    models.Movie.video_url == selected["video_url"],
                    models.Movie.user_id == current_user.id,
                ).first()
                if existing:
                    return {"status": "error", "message": f"«{selected['title']}» уже в библиотеке."}

                movie = models.Movie(
                    title=selected["title"],
                    poster_url=selected["poster_url"],
                    rating=selected["rating"],
                    year=selected["year"],
                    video_url=selected["video_url"],
                    status="ready",
                    user_id=current_user.id,
                )
                db.add(movie)
                db.commit()
                USER_SEARCH_RESULTS.pop(current_user.id, None)
                return {"status": "success", "message": f"✅ Добавлено: {selected['title']}"}
            else:
                return {"status": "error", "message": f"Неверный номер. Введите от 1 до {len(user_results)}."}
        except (ValueError, IndexError):
            return {"status": "error", "message": "Формат: select 1 (или select 2, select 3...)"}

    # --- SEARCH / ADD MOVIE ---
    add_triggers = ["добавь фильм", "добавь", "найди", "хочу посмотреть", "add movie", "add", "search"]

    target_title = cmd
    for trigger in add_triggers:
        if cmd_lower.startswith(trigger):
            target_title = cmd[len(trigger):].strip()
            break

    if not target_title:
        return {"status": "error", "message": "Введите название фильма."}

    # Search Kinopoisk
    try:
        results = await search_kinopoisk(target_title)
    except Exception as e:
        print(f"Kinopoisk Search Error: {e}")
        return {"status": "error", "message": f"Ошибка поиска: {str(e)}"}

    if not results:
        return {"status": "error", "message": f"Ничего не найдено по запросу «{target_title}»."}

    USER_SEARCH_RESULTS[current_user.id] = results
    return {
        "status": "selection_needed",
        "message": "Выберите фильм:",
        "data": results
    }


@app.get("/library", response_model=List[schemas.Movie])
def get_library(
    db: Session = Depends(auth.get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    return db.query(models.Movie).filter(models.Movie.user_id == current_user.id).all()


@app.delete("/api/movies/clear-all")
def clear_all_movies(
    db: Session = Depends(auth.get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    """Delete all movies from user's library."""
    db.query(models.Movie).filter(models.Movie.user_id == current_user.id).delete()
    db.commit()
    # Cancel any pending search tasks for this user (conceptually, though we don't have a background task manager for searches explicitly exposed here)
    if current_user.id in USER_SEARCH_RESULTS:
        del USER_SEARCH_RESULTS[current_user.id]
    if current_user.id in USER_SEARCH_RESULTS:
        del USER_SEARCH_RESULTS[current_user.id]
    return []


@app.delete("/api/movies/{movie_id}")
def delete_movie(
    movie_id: int,
    db: Session = Depends(auth.get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    """Delete a specific movie."""
    movie = db.query(models.Movie).filter(
        models.Movie.id == movie_id,
        models.Movie.user_id == current_user.id
    ).first()
    
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")
        
    db.delete(movie)
    db.commit()
    return {"status": "success", "message": "Movie deleted"}


# --- PLAYER URL PROXY (bypasses CORS) ---
KODIK_TOKEN = "b46255e5d48348259441113580456181"
VCDN_TOKEN = "3i40G5TVIWKtBMGEHG9RiuKCJXv0F799"

@app.get("/api/player-url")
async def get_player_url(kp: str):
    """Fetch raw player iframe URL from Kodik / VideoCDN APIs (server-side, no CORS issues)."""
    async with httpx.AsyncClient(timeout=10.0) as client:
        # 1. Try Kodik
        try:
            resp = await client.get(
                f"https://kodikapi.com/search?token={KODIK_TOKEN}&kinopoisk_id={kp}"
            )
            data = resp.json()
            if data.get("results") and len(data["results"]) > 0:
                link = data["results"][0]["link"]
                if link.startswith("//"):
                    link = "https:" + link
                return {"src": link, "provider": "kodik"}
        except Exception as e:
            print(f"Kodik API error: {e}")

        # 2. Try VideoCDN
        try:
            resp = await client.get(
                f"https://videocdn.tv/api/short?api_token={VCDN_TOKEN}&kinopoisk_id={kp}"
            )
            data = resp.json()
            if data.get("data") and len(data["data"]) > 0:
                link = data["data"][0]["iframe_src"]
                if link.startswith("//"):
                    link = "https:" + link
                return {"src": link, "provider": "videocdn"}
        except Exception as e:
            print(f"VideoCDN API error: {e}")

# End of file. Proxy endpoints removed for stability.
