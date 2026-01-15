from datetime import datetime
from pydantic import BaseModel, ConfigDict, field_validator


# Création de compte
class UserCreate(BaseModel):
    email: str
    username: str
    password: str

    @field_validator("username")
    @classmethod
    def validate_username(cls, value):
        # Username simple: 3-20 caractères alphanumériques
        username = value.strip().lower()
        if len(username) < 3 or len(username) > 20:
            raise ValueError("Username doit faire entre 3 et 20 caractères")
        if not username.isalnum():
            raise ValueError("Username doit être alphanumérique (a-z, 0-9)")
        return username


# Connexion
class UserLogin(BaseModel):
    email: str
    password: str


# Réponse user simple
class UserResponse(BaseModel):
    user_id: int
    email: str
    username: str


# Réponse auth (register/login)
class AuthResponse(BaseModel):
    user_id: int
    email: str
    username: str
    token: str


# Réponse film
class MovieResponse(BaseModel):
    movie_id: int
    title: str
    genres: str

    model_config = ConfigDict(from_attributes=True)


# Input note utilisateur
class RatingCreate(BaseModel):
    movie_id: int
    rating: float


# Réponse note
class RatingResponse(BaseModel):
    movie_id: int
    rating: float
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Réponse recommandation
class RecommendationResponse(BaseModel):
    movieId: int
    title: str
    genres: str
    match_percent: float
