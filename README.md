# What2Watch - Systeme hybride de recommandation de films

## 1) Description du projet

What2Watch est une application web de recommandation de films (PFE) basee sur une approche **hybride** :

- **Filtrage collaboratif (SVD)**
- **Filtrage base contenu (TF-IDF)**

Le projet contient :

- un **backend FastAPI** (auth, films, ratings, recommandations)
- un **frontend React** (onboarding, home, detail film, profil)
- un pipeline simple de preparation / entrainement des modeles

## 2) Technologies utilisees

### Backend
- Python
- FastAPI
- SQLAlchemy
- PostgreSQL
- JWT (python-jose)
- Passlib / bcrypt

### ML
- pandas
- numpy
- scikit-learn
- joblib

### Frontend
- React + Vite
- Tailwind CSS
- Axios
- React Router
- TMDB API (posters, trailer, casting, tendances)

## 3) Structure du projet

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
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   ├── package.json
│   └── .env.example
├── data/
│   ├── raw/
│   ├── processed/
│   └── models/
├── setup.sh
├── create_git_history.sh
├── TEAM_GUIDE.md
└── README.md
```

## 4) Installation pas a pas

### 4.1 Prerequis

- Python 3.12+
- Node.js 18+
- PostgreSQL
- npm

### 4.2 Installation rapide

```bash
chmod +x setup.sh
./setup.sh
```

Ensuite configure :

- `backend/.env`
- `frontend/.env`

### 4.3 Installation manuelle (si besoin)

#### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

#### Frontend

```bash
cd frontend
npm install
cp .env.example .env
```

## 5) Configuration

### backend/.env

```env
DATABASE_URL=postgresql://user:password@localhost/what2watch
SECRET_KEY=your-secret-key-here
```

### frontend/.env

```env
VITE_TMDB_API_KEY=your-api-key-here
VITE_API_URL=http://localhost:8000/api
```

> Note: l'application gere aussi le cas `VITE_API_URL=http://localhost:8000`.

## 6) Lancer localement

### 6.1 Initialiser la base

```bash
cd backend
source venv/bin/activate
python init_db.py
```

### 6.2 Lancer backend

```bash
cd backend
source venv/bin/activate
uvicorn main:app --reload
```

API docs:
- http://localhost:8000/docs

### 6.3 Lancer frontend

```bash
cd frontend
npm run dev
```

App:
- http://localhost:5173

## 7) Dataset utilise

Projet base sur **The Movies Dataset** (Kaggle), principalement :

- `ratings_small.csv`
- `movies_metadata.csv`
- `keywords.csv`

Source:
- https://www.kaggle.com/datasets/rounakbanik/the-movies-dataset

## 8) Deploiement

Pour deploiement Render (backend + frontend), voir :

- `DEPLOY_RENDER.md`

## 9) Historique Git realiste

Un script est fourni pour simuler un historique progressif (25-30 commits):

```bash
chmod +x create_git_history.sh
./create_git_history.sh
```

Ce script :
- ajoute des commits dates entre mi-janv. 2026 et debut mars 2026
- utilise des messages en francais
- suit une progression logique (features, fixes, docs, refactor)

## 10) Auteurs

- Steve
- Mapalo
- Imane
