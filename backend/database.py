import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker


# URL PostgreSQL (tu peux la surcharger avec la variable DATABASE_URL)
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost/what2watch")

# Render peut parfois donner une URL en "postgres://", on la normalise
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Engine SQLAlchemy (connexion à PostgreSQL)
# pool_pre_ping évite des erreurs de connexions inactives en production.
engine = create_engine(DATABASE_URL, pool_pre_ping=True)

# Session locale pour faire les requêtes SQL
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base commune pour les modèles SQLAlchemy
Base = declarative_base()


# Dépendance FastAPI: ouvre puis ferme la session DB
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
