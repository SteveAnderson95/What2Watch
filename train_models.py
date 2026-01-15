import os
import joblib
import pandas as pd
from surprise import Dataset, Reader, SVD, accuracy
from surprise.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer


def main():
    processed_dir = "data/processed"
    models_dir = "data/models"
    os.makedirs(models_dir, exist_ok=True)

    print("1) Chargement des données préparées...")
    ratings = pd.read_csv(processed_dir + "/ratings_clean.csv")
    movies = pd.read_csv(processed_dir + "/movies_enriched.csv")

    print("2) Nettoyage rapide...")
    ratings = ratings.dropna(subset=["userId", "movieId", "rating"]).copy()
    movies = movies.dropna(subset=["movieId", "title", "metadata"]).copy()
    movies = movies.drop_duplicates(subset=["movieId"]).copy()
    ratings = ratings[ratings["movieId"].isin(movies["movieId"])].copy()

    print("3) Entraînement du modèle SVD...")
    reader = Reader(rating_scale=(0.5, 5.0))
    data = Dataset.load_from_df(ratings[["userId", "movieId", "rating"]], reader)
    trainset, testset = train_test_split(data, test_size=0.2, random_state=42)

    svd_model = SVD(
        n_factors=100,
        n_epochs=20,
        lr_all=0.005,
        reg_all=0.02,
        random_state=42,
    )
    svd_model.fit(trainset)

    predictions = svd_model.test(testset)
    rmse = accuracy.rmse(predictions, verbose=False)
    mae = accuracy.mae(predictions, verbose=False)

    print("4) Entraînement du TF-IDF...")
    tfidf = TfidfVectorizer(
        max_features=5000,
        stop_words="english",
        ngram_range=(1, 2),
        min_df=2,
        max_df=0.8,
    )
    tfidf_matrix = tfidf.fit_transform(movies["metadata"].fillna(""))

    print("5) Sauvegarde des modèles...")
    joblib.dump(svd_model, models_dir + "/svd_model.pkl")
    joblib.dump(tfidf, models_dir + "/tfidf_vectorizer.pkl")
    joblib.dump(tfidf_matrix, models_dir + "/tfidf_matrix.pkl")
    movies.to_csv(models_dir + "/movies.csv", index=False)

    print("\n✅ Terminé")
    print("Ratings:", len(ratings), " | Films:", len(movies))
    print("RMSE:", round(rmse, 4), " | MAE:", round(mae, 4))
    print("Fichiers créés dans:", models_dir)


if __name__ == "__main__":
    main()

