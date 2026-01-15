import os
from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import models
import schemas
from auth import create_access_token, get_current_user, hash_password, verify_password
from database import engine, get_db
from ml_service import get_recommendations, get_similar_movies, load_ml_models
from models import Movie, Rating, User


app = FastAPI(title="What2Watch API")

# CORS: local + domaines définis en production
cors_origins = ["http://localhost:5173", "http://127.0.0.1:5173"]
extra_origins = os.getenv("CORS_ORIGINS", "").strip()
if extra_origins:
    for origin in extra_origins.split(","):
        clean_origin = origin.strip()
        if clean_origin and clean_origin not in cors_origins:
            cors_origins.append(clean_origin)

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Création simple des tables (sans Alembic)
models.Base.metadata.create_all(bind=engine)


def serialize_movie(movie):
    return {"movie_id": movie.movie_id, "title": movie.title, "genres": movie.genres or ""}


def serialize_rating(row):
    return {"movie_id": row.movie_id, "rating": row.rating, "created_at": row.created_at}


@app.on_event("startup")
def startup_event():
    # Charge les modèles ML une seule fois
    try:
        load_ml_models()
    except Exception as e:
        print("Erreur chargement ML:", e)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/")
def root():
    # Route d'accueil simple pour éviter le 404 sur la racine
    return {
        "message": "What2Watch API active",
        "docs": "/docs",
        "health": "/health",
    }


# --------------------
# Authentification
# --------------------
@app.post("/api/auth/register", response_model=schemas.AuthResponse)
def register(payload: schemas.UserCreate, db: Session = Depends(get_db)):
    # Vérifier unicité email
    existing_email = db.query(User).filter(User.email == payload.email).first()
    if existing_email:
        raise HTTPException(status_code=400, detail="Email déjà utilisé")

    # Vérifier unicité username
    existing_username = db.query(User).filter(User.username == payload.username).first()
    if existing_username:
        raise HTTPException(status_code=400, detail="Username déjà pris")

    user = User(
        email=payload.email,
        username=payload.username,
        password_hash=hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(user.id)
    return {"user_id": user.id, "email": user.email, "username": user.username, "token": token}


@app.post("/api/auth/login", response_model=schemas.AuthResponse)
def login(payload: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Email ou mot de passe invalide")

    token = create_access_token(user.id)
    return {"user_id": user.id, "email": user.email, "username": user.username, "token": token}


@app.get("/api/auth/me", response_model=schemas.UserResponse)
def me(current_user: User = Depends(get_current_user)):
    return {"user_id": current_user.id, "email": current_user.email, "username": current_user.username}


@app.delete("/api/auth/me")
def delete_my_account(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Supprime le compte connecté (et ses ratings via cascade)
    db.delete(current_user)
    db.commit()
    return {"success": True}


# --------------------
# Catalogue de films
# --------------------
@app.get("/api/movies", response_model=list[schemas.MovieResponse])
def list_movies(skip: int = 0, limit: int = 20, db: Session = Depends(get_db)):
    movies = db.query(Movie).offset(skip).limit(limit).all()
    return [serialize_movie(movie) for movie in movies]


@app.get("/api/movies/search", response_model=list[schemas.MovieResponse])
def search_movies(q: str = Query(..., min_length=1), db: Session = Depends(get_db)):
    movies = db.query(Movie).filter(Movie.title.ilike(f"%{q}%")).limit(50).all()
    return [serialize_movie(movie) for movie in movies]


@app.get("/api/movies/{movie_id}", response_model=schemas.MovieResponse)
def movie_detail(movie_id: int, db: Session = Depends(get_db)):
    movie = db.query(Movie).filter(Movie.movie_id == movie_id).first()
    if not movie:
        raise HTTPException(status_code=404, detail="Film introuvable")
    return serialize_movie(movie)


@app.get("/api/movies/{movie_id}/similar", response_model=list[schemas.RecommendationResponse])
def similar_movies(movie_id: int, n: int = 10):
    df = get_similar_movies(movie_id, n=n)
    return df.to_dict(orient="records")


# --------------------
# Notes utilisateur
# --------------------
@app.post("/api/ratings")
def add_rating(payload: schemas.RatingCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if payload.rating < 0.5 or payload.rating > 5.0:
        raise HTTPException(status_code=400, detail="La note doit être entre 0.5 et 5.0")

    existing = db.query(Rating).filter(Rating.user_id == current_user.id, Rating.movie_id == payload.movie_id).first()
    if existing:
        existing.rating = payload.rating
    else:
        db.add(Rating(user_id=current_user.id, movie_id=payload.movie_id, rating=payload.rating))

    db.commit()
    return {"success": True}


@app.get("/api/ratings", response_model=list[schemas.RatingResponse])
def get_my_ratings(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = db.query(Rating).filter(Rating.user_id == current_user.id).order_by(Rating.created_at.desc()).all()
    return [serialize_rating(row) for row in rows]


# --------------------
# Recommandations
# --------------------
@app.get("/api/recommendations", response_model=list[schemas.RecommendationResponse])
def recommendations(current_user: User = Depends(get_current_user), n: int = 20):
    try:
        df = get_recommendations(current_user.id, n=n)
        return df.to_dict(orient="records")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur recommandations: {str(e)}")
