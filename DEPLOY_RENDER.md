# Deployer What2Watch (Guide complet debutant)

Ce guide met ton app en ligne avec **Render**:
- PostgreSQL
- Backend FastAPI
- Frontend React (Vite)

## 1) Preparer ton repo GitHub

Depuis la racine du projet:

```bash
cd /home/steve-hn/Documents/Projects/pfe/pfe/what2watch
git add .
git commit -m "prep deploy render"
git push origin main
```

## 2) Creer la base PostgreSQL sur Render

1. Va sur `https://dashboard.render.com`
2. Clique **New +** -> **PostgreSQL**
3. Nom: `what2watch-db`
4. Plan: Free (ou Starter)
5. Clique **Create Database**

Quand c'est cree, ouvre la DB et copie:
- **Internal Database URL** (important)

## 3) Deployer le backend (FastAPI)

1. **New +** -> **Web Service**
2. Connecte ton repo GitHub
3. Choisis:
- Name: `what2watch-api`
- Root Directory: `backend`
- Runtime: `Python 3`
- Build Command: `pip install -r requirements.txt`
- Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

Important:
- Le backend force Python `3.12.8` via `backend/.python-version`
- Si Render prend quand meme 3.14, ajoute aussi la variable `PYTHON_VERSION=3.12.8`

4. Variables d'environnement du backend:
- `DATABASE_URL` = Internal Database URL de Render (postgresql://...)
- `SECRET_KEY` = une cle secrete longue
- `CORS_ORIGINS` = `http://localhost:5173` (temporaire, on ajoutera URL frontend apres)

Pour generer une cle locale rapide:

```bash
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

## 4) Initialiser la base (tables + films)

Quand le backend est deploye, va dans:
- Service backend -> **Shell**

Puis execute:

```bash
python init_db.py
```

Tu dois voir:
- `Tables créées`
- `Films importés: ...`

## 5) Deployer le frontend (Vite)

1. **New +** -> **Static Site**
2. Connecte le meme repo
3. Choisis:
- Name: `what2watch-web`
- Root Directory: `frontend`
- Build Command: `npm ci && npm run build`
- Publish Directory: `dist`

4. Variables d'environnement frontend:
- `VITE_API_URL` = URL publique backend (ex: `https://what2watch-api.onrender.com`)
- `VITE_TMDB_API_KEY` = ta clé TMDB

## 6) Mettre a jour CORS du backend

Quand tu as l'URL frontend (ex: `https://what2watch-web.onrender.com`):

1. Ouvre backend -> Environment
2. Edite `CORS_ORIGINS`:

```text
http://localhost:5173,https://what2watch-web.onrender.com
```

3. Sauvegarde -> redeploy backend

## 7) Verifier que tout marche

Teste dans cet ordre:

1. Backend health:
- `https://what2watch-api.onrender.com/health`

2. Docs Swagger:
- `https://what2watch-api.onrender.com/docs`

3. Frontend:
- `https://what2watch-web.onrender.com`

4. Flow complet:
- Register
- Login
- Ajouter des ratings
- Ouvrir recommandations

## 8) Problemes courants

1. `CORS error`:
- Verifie `CORS_ORIGINS` contient exactement l'URL frontend

2. `500 login/register`:
- Verifie `DATABASE_URL` et `SECRET_KEY`

3. Pas de films:
- Relance `python init_db.py` dans Shell backend

4. Recos vides:
- Ajoute quelques ratings utilisateur

## 9) Re-deploiement apres modifications

Chaque fois que tu modifies le code:

```bash
git add .
git commit -m "update app"
git push origin main
```

Render redeploie automatiquement.
