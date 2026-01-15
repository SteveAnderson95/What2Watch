import joblib
import numpy as np
import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity


# Fonction principale demandée : recommandations hybrides pour un user
def recommend_for_user(user_id, svd_model, tfidf_matrix, movies, n=20):
    ratings = pd.read_csv("data/processed/ratings_clean.csv")

    # Films déjà notés par l'utilisateur
    user_ratings = ratings[ratings["userId"] == user_id]
    seen_movies = set(user_ratings["movieId"].tolist())

    # Profil user = moyenne TF-IDF des films aimés (rating >= 4)
    liked_movies = user_ratings[user_ratings["rating"] >= 4]["movieId"].tolist()
    liked_idx = movies[movies["movieId"].isin(liked_movies)].index.tolist()

    if len(liked_idx) > 0:
        user_profile = np.asarray(tfidf_matrix[liked_idx].mean(axis=0))
    else:
        user_profile = None

    # Calcul du score pour chaque film candidat (non vu)
    rows = []
    for idx, row in movies.iterrows():
        movie_id = int(row["movieId"])
        if movie_id in seen_movies:
            continue

        # Score content
        if user_profile is None:
            content_score = 0.0
        else:
            content_score = float(cosine_similarity(user_profile, tfidf_matrix[idx])[0][0])

        # Score collaborative (SVD)
        collab_score = float(svd_model.predict(user_id, movie_id).est / 5.0)

        # Score final hybride
        final_score = 0.6 * content_score + 0.4 * collab_score

        rows.append(
            {
                "movieId": movie_id,
                "title": row["title"],
                "genres": row.get("genres_clean", ""),
                "content_score": content_score,
                "collab_score": collab_score,
                "final_score": final_score,
            }
        )

    recs = pd.DataFrame(rows)
    if len(recs) == 0:
        return recs

    recs = recs.sort_values("final_score", ascending=False).head(n).copy()
    recs["match_percent"] = (recs["final_score"] * 100).round(1)
    return recs.reset_index(drop=True)


if __name__ == "__main__":
    svd = joblib.load("data/models/svd_model.pkl")
    tfidf_matrix = joblib.load("data/models/tfidf_matrix.pkl")
    movies = pd.read_csv("data/models/movies.csv")

    recommendations = recommend_for_user(user_id=42, svd_model=svd, tfidf_matrix=tfidf_matrix, movies=movies, n=20)
    print(recommendations[["title", "match_percent", "genres"]].head(20).to_string(index=False))

