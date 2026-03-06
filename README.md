# What2Watch

Application web de recommandation de films pour PFE, basee sur un systeme hybride :
- filtrage collaboratif (SVD)
- filtrage base contenu (TF-IDF)

## Stack technique

- Backend: FastAPI, SQLAlchemy, PostgreSQL, JWT
- ML: pandas, numpy, scikit-learn, joblib
- Frontend: React + Vite, Tailwind, Axios, TMDB API

## Structure utile

```bash
what2watch/
├── backend/
│   ├── main.py
│   ├── auth.py
│   ├── database.py
│   ├── models.py
│   ├── schemas.py
│   ├── ml_service.py
│   ├── init_db.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   ├── package.json
│   └── .env.example
├── data/
│   └── models/
├── prepare_data.py
├── train_models.py
└── recommend.py
```

## Installation locale

Prerequis:
- Python 3.12+
- Node.js 18+
- PostgreSQL

### 1) Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

`backend/.env`:

```env
DATABASE_URL=postgresql://user:password@localhost/what2watch
SECRET_KEY=your-secret-key-here
```

Initialisation DB:

```bash
python init_db.py
```

Lancement API:

```bash
uvicorn main:app --reload
```

Docs API:
- http://localhost:8000/docs

### 2) Frontend

```bash
cd ../frontend
npm install
cp .env.example .env
npm run dev
```

`frontend/.env`:

```env
VITE_TMDB_API_KEY=your-api-key-here
VITE_API_URL=http://localhost:8000/api
```

App:
- http://localhost:5173

## Dataset

The Movies Dataset (Kaggle):
- `ratings_small.csv`
- `movies_metadata.csv`
- `keywords.csv`

Source:
- https://www.kaggle.com/datasets/rounakbanik/the-movies-dataset

## Auteurs

- Steve
- Mapalo
- Imane
