import os
import ast
import pandas as pd


# Parse la colonne genres (JSON-like string) en texte simple
def parse_genres(genres_str):
    try:
        genres = ast.literal_eval(genres_str)
        return " ".join([g["name"] for g in genres if "name" in g])
    except:
        return ""


# Parse la colonne keywords (JSON-like string) en texte simple
def parse_keywords(keywords_str):
    try:
        keywords = ast.literal_eval(keywords_str)
        return " ".join([k["name"] for k in keywords[:20] if "name" in k])
    except:
        return ""


def main():
    raw_dir = "data/raw"
    processed_dir = "data/processed"
    os.makedirs(processed_dir, exist_ok=True)

    print("1) Chargement des CSV...")
    ratings = pd.read_csv(raw_dir + "/ratings_small.csv")
    movies = pd.read_csv(raw_dir + "/movies_metadata.csv", low_memory=False)
    keywords = pd.read_csv(raw_dir + "/keywords.csv")

    print("2) Nettoyage des colonnes id...")
    movies["id"] = pd.to_numeric(movies["id"], errors="coerce")
    movies = movies.dropna(subset=["id", "title"])
    movies["id"] = movies["id"].astype(int)

    keywords["id"] = pd.to_numeric(keywords["id"], errors="coerce")
    keywords = keywords.dropna(subset=["id"])
    keywords["id"] = keywords["id"].astype(int)

    print("3) Parsing genres + keywords...")
    movies["genres_clean"] = movies["genres"].apply(parse_genres)
    keywords["keywords_clean"] = keywords["keywords"].apply(parse_keywords)

    print("4) Fusion movies + keywords...")
    movies = movies.merge(keywords[["id", "keywords_clean"]], on="id", how="left")

    print("5) Création de metadata...")
    movies["overview"] = movies["overview"].fillna("")
    movies["keywords_clean"] = movies["keywords_clean"].fillna("")
    movies["metadata"] = (
        movies["genres_clean"].fillna("")
        + " "
        + movies["overview"]
        + " "
        + movies["keywords_clean"]
    )
    movies["metadata"] = movies["metadata"].str.replace(r"\s+", " ", regex=True).str.strip()

    print("6) Garder seulement les films qui ont des ratings...")
    movies = movies[movies["id"].isin(ratings["movieId"])].copy()
    movies = movies.drop_duplicates(subset=["id"])
    movies = movies[movies["metadata"] != ""]

    print("7) Colonnes finales...")
    movies = movies.rename(columns={"id": "movieId"})
    movies_enriched = movies[
        [
            "movieId",
            "title",
            "genres_clean",
            "overview",
            "keywords_clean",
            "metadata",
            "vote_average",
            "vote_count",
            "release_date",
        ]
    ].copy()

    ratings_clean = ratings[["userId", "movieId", "rating", "timestamp"]].copy()
    ratings_clean = ratings_clean[ratings_clean["movieId"].isin(movies_enriched["movieId"])].copy()

    print("8) Sauvegarde...")
    movies_enriched.to_csv(processed_dir + "/movies_enriched.csv", index=False)
    ratings_clean.to_csv(processed_dir + "/ratings_clean.csv", index=False)

    print("\n✅ Terminé")
    print("movies_enriched:", len(movies_enriched), "films")
    print("ratings_clean:", len(ratings_clean), "ratings")
    print("Fichiers créés dans:", processed_dir)


if __name__ == "__main__":
    main()

