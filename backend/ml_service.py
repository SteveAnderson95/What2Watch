import os
import time
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
# Cache mémoire pour éviter de recalculer la même recommandation
# à chaque rafraîchissement de la page.
RECO_CACHE = {}
SIMILAR_CACHE = {}
RECO_CACHE_TTL = int(os.getenv("RECO_CACHE_TTL", "300"))
SIMILAR_CACHE_TTL = int(os.getenv("SIMILAR_CACHE_TTL", "1800"))


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


def invalidate_user_cache(user_id):
    # On invalide les recommandations de l'utilisateur après une nouvelle note
    # pour éviter de servir une version obsolète.
    keys_to_delete = [key for key in RECO_CACHE if key[0] == int(user_id)]
    for key in keys_to_delete:
        RECO_CACHE.pop(key, None)


def get_recommendations(user_id, n=20):
    load_ml_models()
    cache_key = (int(user_id), int(n))
    cache_entry = RECO_CACHE.get(cache_key)
    now = time.time()
    if cache_entry and (now - cache_entry["ts"]) < RECO_CACHE_TTL:
        return cache_entry["df"].copy()

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
        result = recs[["movieId", "title", "genres", "match_percent"]]
        RECO_CACHE[cache_key] = {"ts": now, "df": result.copy()}
        return result

    seen_movies = set(user_ratings["movieId"].tolist())
    liked_movies = user_ratings[user_ratings["rating"] >= 4]["movieId"].tolist()
    liked_idx = MOVIES_DF[MOVIES_DF["movieId"].isin(liked_movies)].index.tolist()

    if len(liked_idx) > 0:
        user_profile = np.asarray(TFIDF_MATRIX[liked_idx].mean(axis=0))
    else:
        user_profile = None

    candidates = MOVIES_DF[~MOVIES_DF["movieId"].isin(seen_movies)].copy()
    if len(candidates) == 0:
        return pd.DataFrame(columns=["movieId", "title", "genres", "match_percent"])

    if user_profile is None:
        content_scores = np.zeros(len(candidates), dtype=float)
    else:
        # Similarité cosine calculée en une seule opération (plus rapide
        # que de recalculer film par film dans une boucle Python).
        content_scores = cosine_similarity(user_profile, TFIDF_MATRIX[candidates.index])[0]

    if SVD_MODEL is None:
        collab_scores = np.full(len(candidates), 0.5, dtype=float)
    else:
        collab_scores = np.array(
            [_estimate_collab(user_id, int(movie_id)) for movie_id in candidates["movieId"].tolist()],
            dtype=float,
        )

    candidates["genres"] = candidates.apply(_get_genres, axis=1)
    candidates["final_score"] = 0.6 * content_scores + 0.4 * collab_scores
    recs = candidates.sort_values("final_score", ascending=False).head(n).copy()
    recs["match_percent"] = (recs["final_score"] * 100).round(1)
    result = recs[["movieId", "title", "genres", "match_percent"]]
    RECO_CACHE[cache_key] = {"ts": now, "df": result.copy()}
    return result


def get_similar_movies(movie_id, n=10):
    load_ml_models()
    cache_key = (int(movie_id), int(n))
    cache_entry = SIMILAR_CACHE.get(cache_key)
    now = time.time()
    if cache_entry and (now - cache_entry["ts"]) < SIMILAR_CACHE_TTL:
        return cache_entry["df"].copy()

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

    result = pd.DataFrame(rows)
    SIMILAR_CACHE[cache_key] = {"ts": now, "df": result.copy()}
    return result
