import os
import pandas as pd
import psycopg2
from database import SessionLocal, engine
from models import Base, Movie


def create_database_if_needed():
    # Connexion à la base postgres système pour créer what2watch
    admin_url = os.getenv("DATABASE_ADMIN_URL", "").strip()
    db_name = "what2watch"

    # En hébergement, la base existe déjà souvent: on saute cette étape si URL admin absente
    if not admin_url:
        print("DATABASE_ADMIN_URL non défini: création de base ignorée")
        return

    try:
        conn = psycopg2.connect(admin_url)
        conn.autocommit = True
        cur = conn.cursor()

        cur.execute("SELECT 1 FROM pg_database WHERE datname = %s", (db_name,))
        exists = cur.fetchone()

        if not exists:
            cur.execute(f"CREATE DATABASE {db_name}")
            print("Base what2watch créée")
        else:
            print("Base what2watch existe déjà")

        cur.close()
        conn.close()
    except Exception as e:
        # Si la connexion admin échoue, on continue quand même la création des tables
        print(f"Création base ignorée ({e})")


def import_movies():
    # Lit les films depuis les modèles préparés
    csv_path = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "..", "data", "models", "movies.csv")
    )

    movies_df = pd.read_csv(csv_path)
    db = SessionLocal()

    try:
        count_added = 0
        for _, row in movies_df.iterrows():
            movie_id = int(row["movieId"])
            exists = db.query(Movie).filter(Movie.movie_id == movie_id).first()
            if exists:
                continue

            genres = ""
            if "genres_clean" in movies_df.columns and pd.notna(row.get("genres_clean")):
                genres = str(row.get("genres_clean"))
            elif "genres" in movies_df.columns and pd.notna(row.get("genres")):
                genres = str(row.get("genres"))

            db.add(Movie(movie_id=movie_id, title=str(row["title"]), genres=genres))
            count_added += 1

        db.commit()
        print(f"Films importés: {count_added}")
    finally:
        db.close()


def main():
    create_database_if_needed()

    # Crée les tables SQLAlchemy
    Base.metadata.create_all(bind=engine)
    print("Tables créées")

    # Remplit la table movies
    import_movies()
    print("Initialisation terminée")


if __name__ == "__main__":
    main()
