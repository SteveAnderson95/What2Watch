# What2Watch

![Python](https://img.shields.io/badge/Python-3.12+-3776AB?style=flat-square&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-Backend-009688?style=flat-square&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-18-20232A?style=flat-square&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-Frontend-646CFF?style=flat-square&logo=vite&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![scikit-learn](https://img.shields.io/badge/scikit--learn-ML-F7931E?style=flat-square&logo=scikitlearn&logoColor=white)
![TMDB](https://img.shields.io/badge/TMDB-API-01D277?style=flat-square)

Intelligent movie recommendation web application based on machine learning, using user preferences and movie metadata.

## Tech stack

- Backend: FastAPI, SQLAlchemy, PostgreSQL, JWT, bcrypt
- Frontend: React 18, Vite, TailwindCSS, Axios
- Machine Learning: pandas, numpy, scikit-learn, scikit-surprise, joblib
- External API: TMDB API

## Application preview

### Landing page

![Landing page](assets/screenshots/landingPage.png)

### User onboarding

![Onboarding](assets/screenshots/onboardingPage.png)

### Recommendations

![Recommendations](assets/screenshots/recommendationsPage.png)

### Movie details

![Detail film](assets/screenshots/movieDetails.png)

## Local installation

### Requirements

- Python 3.12 or later
- Node.js 18 or later
- PostgreSQL

### Quick setup

```bash
bash setup.sh
```

## Configuration

### Backend

In `backend/.env`:

```env
DATABASE_URL=postgresql://user:password@localhost/what2watch
SECRET_KEY=your-secret-key-here
```

### Frontend

In `frontend/.env`:

```env
VITE_TMDB_API_KEY=your-api-key-here
VITE_API_URL=http://localhost:8000/api
```

## Run the project

### 1. Initialize the database

```bash
cd backend
source venv/bin/activate
python init_db.py
```

### 2. Start the backend

```bash
cd backend
source venv/bin/activate
uvicorn main:app --reload
```

API:
- `http://localhost:8000`
- `http://localhost:8000/docs`

### 3. Start the frontend

```bash
cd frontend
npm run dev
```

Application:
- `http://localhost:5173`

## Author

**Steve Anderson H.**
- GitHub: [@SteveAnderson95](https://github.com/SteveAnderson95)
- LinkedIn: [Steve Anderson HAKIZIMANA](https://www.linkedin.com/in/steve-anderson-hakizimana/)

---

⭐ Feel free to leave a star if you liked this project!
