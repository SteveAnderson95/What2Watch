import os
import joblib
import numpy as np
import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity
from database import SessionLocal
from models import Rating


# Variables globales: chargées une fois au démarrage
SVD_MODEL = None
TFIDF_MATRIX = None
MOVIES_DF = None
MODELS_LOADED = False


def load_ml_models():
    global SVD_MODEL, TFIDF_MATRIX, MOVIES_DF, MODELS_LOADED
    if MODELS_LOADED:
        return

    project_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    models_dir = os.path.join(project_dir, "data", "models")

    # Le modèle SVD peut échouer à charger si "surprise" n'est pas installé
    # Dans ce cas, on garde un fallback simple (score collaboratif neutre)
    try:
        SVD_MODEL = joblib.load(os.path.join(models_dir, "svd_model.pkl"))
    except Exception:
        SVD_MODEL = None
    TFIDF_MATRIX = joblib.load(os.path.join(models_dir, "tfidf_matrix.pkl"))
    MOVIES_DF = pd.read_csv(os.path.join(models_dir, "movies.csv"))

    MODELS_LOADED = True


def _get_user_ratings_df(user_id):
    db = SessionLocal()
    try:
        rows = db.query(Rating).filter(Rating.user_id == user_id).all()
        data = [{"movieId": r.movie_id, "rating": r.rating} for r in rows]
        return pd.DataFrame(data)
    finally:
        db.close()


def _get_genres(row):
    if "genres_clean" in row and pd.notna(row["genres_clean"]):
        return str(row["genres_clean"])
    if "genres" in row and pd.notna(row["genres"]):
        return str(row["genres"])
    return ""


def _estimate_collab(user_id, movie_id):
    # Si SVD indisponible: score neutre (milieu de l'échelle)
    if SVD_MODEL is None:
        return 0.5
    return float(SVD_MODEL.predict(user_id, movie_id).est / 5.0)


def get_recommendations(user_id, n=20):
    load_ml_models()
    user_ratings = _get_user_ratings_df(user_id)

    # Cas simple: nouveau user sans note => fallback films populaires
    if len(user_ratings) == 0:
        recs = MOVIES_DF.copy()
        if "vote_count" in recs.columns and "vote_average" in recs.columns:
            recs["score"] = recs["vote_count"].fillna(0) * recs["vote_average"].fillna(0)
            recs = recs.sort_values("score", ascending=False)
        recs = recs.head(n).copy()
        recs["genres"] = recs.apply(_get_genres, axis=1)
        recs["match_percent"] = 50.0
        return recs[["movieId", "title", "genres", "match_percent"]]

    seen_movies = set(user_ratings["movieId"].tolist())
    liked_movies = user_ratings[user_ratings["rating"] >= 4]["movieId"].tolist()
    liked_idx = MOVIES_DF[MOVIES_DF["movieId"].isin(liked_movies)].index.tolist()

    if len(liked_idx) > 0:
        user_profile = np.asarray(TFIDF_MATRIX[liked_idx].mean(axis=0))
    else:
        user_profile = None

    rows = []
    for idx, row in MOVIES_DF.iterrows():
        movie_id = int(row["movieId"])
        if movie_id in seen_movies:
            continue

        if user_profile is None:
            content_score = 0.0
        else:
            content_score = float(cosine_similarity(user_profile, TFIDF_MATRIX[idx])[0][0])

        collab_score = _estimate_collab(user_id, movie_id)
        final_score = 0.6 * content_score + 0.4 * collab_score

        rows.append(
            {
                "movieId": movie_id,
                "title": row["title"],
                "genres": _get_genres(row),
                "final_score": final_score,
            }
        )

    if len(rows) == 0:
        return pd.DataFrame(columns=["movieId", "title", "genres", "match_percent"])

    recs = pd.DataFrame(rows)
    recs = recs.sort_values("final_score", ascending=False).head(n).copy()
    recs["match_percent"] = (recs["final_score"] * 100).round(1)
    return recs[["movieId", "title", "genres", "match_percent"]]


def get_similar_movies(movie_id, n=10):
    load_ml_models()
    idx_list = MOVIES_DF[MOVIES_DF["movieId"] == movie_id].index.tolist()
    if len(idx_list) == 0:
        return pd.DataFrame(columns=["movieId", "title", "genres", "match_percent"])

    movie_idx = idx_list[0]
    sims = cosine_similarity(TFIDF_MATRIX[movie_idx], TFIDF_MATRIX)[0]
    top_idx = sims.argsort()[::-1]

    rows = []
    for idx in top_idx:
        if idx == movie_idx:
            continue
        row = MOVIES_DF.iloc[idx]
        rows.append(
            {
                "movieId": int(row["movieId"]),
                "title": row["title"],
                "genres": _get_genres(row),
                "match_percent": round(float(sims[idx]) * 100, 1),
            }
        )
        if len(rows) >= n:
            break

    return pd.DataFrame(rows)
