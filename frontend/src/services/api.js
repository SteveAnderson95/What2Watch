import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const API_PREFIX = API_BASE.endsWith('/api') ? '' : '/api';
const TOKEN_KEY = 'w2w_token';
const USER_KEY = 'w2w_user';
// Petit cache mémoire du catalogue films pour éviter de refaire
// la même requête quand on change de page.
const MOVIES_CACHE_TTL = 5 * 60 * 1000;
const moviesCache = {};

function safeGetItem(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetItem(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // En navigation privée stricte ou stockage bloqué, on évite le crash UI.
  }
}

function safeRemoveItem(key) {
  try {
    localStorage.removeItem(key);
  } catch {
    // Rien: le but est surtout d'éviter une exception fatale.
  }
}

const api = axios.create({
  baseURL: API_BASE,
});

api.interceptors.request.use((config) => {
  const token = safeGetItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function setAuth(authData) {
  safeSetItem(TOKEN_KEY, authData?.token || '');
  safeSetItem(USER_KEY, JSON.stringify({
    user_id: authData.user_id,
    email: authData.email,
    username: authData.username,
  }));
}

export function clearAuth() {
  safeRemoveItem(TOKEN_KEY);
  safeRemoveItem(USER_KEY);
}

export function getToken() {
  return safeGetItem(TOKEN_KEY);
}

export function getStoredUser() {
  const raw = safeGetItem(USER_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    // Si le JSON est corrompu, on nettoie pour éviter le crash UI
    safeRemoveItem(USER_KEY);
    return null;
  }
}

export function getErrorMessage(err, fallback = 'Erreur inattendue') {
  const detail = err?.response?.data?.detail;

  if (typeof detail === 'string' && detail.trim()) {
    return detail;
  }

  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => {
        if (typeof item === 'string') {
          return item;
        }
        if (item && typeof item.msg === 'string') {
          return item.msg;
        }
        return '';
      })
      .filter(Boolean);

    if (messages.length > 0) {
      return messages.join(' | ');
    }
  }

  if (detail && typeof detail === 'object' && typeof detail.msg === 'string') {
    return detail.msg;
  }

  if (typeof err?.message === 'string' && err.message.trim()) {
    return err.message;
  }

  return fallback;
}

export async function register(payload) {
  const { data } = await api.post(`${API_PREFIX}/auth/register`, payload);
  setAuth(data);
  return data;
}

export async function login(payload) {
  const { data } = await api.post(`${API_PREFIX}/auth/login`, payload);
  setAuth(data);
  return data;
}

export async function getMe() {
  const { data } = await api.get(`${API_PREFIX}/auth/me`);
  return data;
}

export async function deleteMe() {
  const { data } = await api.delete(`${API_PREFIX}/auth/me`);
  return data;
}

export async function getMovies(skip = 0, limit = 20) {
  const cacheKey = `${skip}-${limit}`;
  const now = Date.now();
  const cacheEntry = moviesCache[cacheKey];
  if (cacheEntry && now - cacheEntry.ts < MOVIES_CACHE_TTL) {
    return cacheEntry.data;
  }

  const { data } = await api.get(`${API_PREFIX}/movies`, { params: { skip, limit } });
  moviesCache[cacheKey] = { ts: now, data };
  return data;
}

export async function searchMovies(query) {
  const { data } = await api.get(`${API_PREFIX}/movies/search`, { params: { q: query } });
  return data;
}

export async function getMovie(movieId) {
  const { data } = await api.get(`${API_PREFIX}/movies/${movieId}`);
  return data;
}

export async function getSimilarMovies(movieId, n = 10) {
  const { data } = await api.get(`${API_PREFIX}/movies/${movieId}/similar`, { params: { n } });
  return data;
}

export async function addRating(payload) {
  const { data } = await api.post(`${API_PREFIX}/ratings`, payload);
  return data;
}

export async function getRatings() {
  const { data } = await api.get(`${API_PREFIX}/ratings`);
  return data;
}

export async function getRecommendations(n = 20) {
  const { data } = await api.get(`${API_PREFIX}/recommendations`, { params: { n } });
  return data;
}

export default api;
