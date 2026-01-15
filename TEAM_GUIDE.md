# Guide Equipe - What2Watch

Ce fichier sert de reference rapide pour comprendre le projet sans perdre de temps.

## 1) Structure utile

- `backend/` : API FastAPI + auth + recommandations
- `frontend/` : interface React
- `data/models/` : fichiers ML deja entraines (`svd_model.pkl`, `tfidf_matrix.pkl`, `movies.csv`)
- `backend/init_db.py` : creation tables + import catalogue films

## 2) Comment lancer en local

### Backend

```bash
cd backend
export DATABASE_URL="postgresql://..."
../.venv/bin/python init_db.py
../.venv/bin/uvicorn main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## 3) Flux fonctionnel

1. Un utilisateur cree un compte / se connecte.
2. Il note des films (`/api/ratings`).
3. L'API genere des recommandations hybrides (`/api/recommendations`):
- 60% contenu (TF-IDF)
- 40% collaboratif (SVD)

## 4) Fichiers coeur (a connaitre)

- `backend/main.py` : routes API
- `backend/ml_service.py` : logique recommandations
- `frontend/src/pages/Home.jsx` : ecran principal
- `frontend/src/pages/MovieDetail.jsx` : detail film + trailer + casting + meta TMDB
- `frontend/src/services/tmdb.js` : appels TMDB
- `frontend/src/services/api.js` : appels backend
- `frontend/src/utils/movieMapping.js` : mapping TMDB -> catalogue interne

## 5) Bonnes pratiques d'equipe

- Eviter de dupliquer les fonctions utilitaires: placer dans `frontend/src/utils/`.
- Ajouter des commentaires FR uniquement quand la logique n'est pas evidente.
- Faire des commits courts et explicites (un sujet = un commit).
- Toujours lancer un build frontend avant push:

```bash
cd frontend && npm run build
```

## 6) Deploiement

Le guide complet Render est dans `DEPLOY_RENDER.md`.
