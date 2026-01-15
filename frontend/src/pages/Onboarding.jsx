import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import RatingButtons from '../components/RatingButtons';
import { addRating, getMovies } from '../services/api';
import { getMovieVisualData } from '../services/tmdb';

const TARGET_RATINGS = 12;
const INITIAL_QUEUE_SIZE = 15;
const MAX_POOL_SIZE = 120;

const PREFERRED_GENRES = [
  'Action', 'Adventure', 'Animation', 'Comedy', 'Crime', 'Drama', 'Family',
  'Fantasy', 'Horror', 'Mystery', 'Romance', 'Sci-Fi', 'Thriller'
];

const FAMOUS_HINTS = [
  'star', 'matrix', 'lord', 'batman', 'spider', 'harry', 'ring', 'godfather',
  'avenger', 'terminator', 'mission', 'toy story', 'shrek', 'titanic', 'alien'
];

function shuffleMovies(list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = copy[i];
    copy[i] = copy[j];
    copy[j] = temp;
  }
  return copy;
}

function hasGenre(movie, genre) {
  const text = String(movie.genres || movie.genres_clean || '').toLowerCase();
  return text.includes(genre.toLowerCase());
}

function isFamousTitle(movie) {
  const title = String(movie.title || '').toLowerCase();
  return FAMOUS_HINTS.some((word) => title.includes(word));
}

function pickOnboardingPool(allMovies) {
  const cleanMovies = allMovies.filter((m) => m && (m.movie_id || m.movieId) && m.title);
  const uniqueMap = new Map();

  cleanMovies.forEach((movie) => {
    const id = movie.movie_id ?? movie.movieId;
    if (!uniqueMap.has(id)) {
      uniqueMap.set(id, movie);
    }
  });

  const uniqueMovies = Array.from(uniqueMap.values());
  const selected = [];
  const usedIds = new Set();

  function addMovie(movie) {
    if (!movie) {
      return;
    }
    const id = movie.movie_id ?? movie.movieId;
    if (usedIds.has(id)) {
      return;
    }
    selected.push(movie);
    usedIds.add(id);
  }

  // 1) Plusieurs genres + titres connus
  for (const genre of PREFERRED_GENRES) {
    const candidates = shuffleMovies(uniqueMovies).filter((movie) => hasGenre(movie, genre) && isFamousTitle(movie));
    for (const candidate of candidates.slice(0, 2)) {
      addMovie(candidate);
    }
  }

  // 2) Diversite de genres
  for (const genre of PREFERRED_GENRES) {
    const candidates = shuffleMovies(uniqueMovies).filter((movie) => hasGenre(movie, genre));
    for (const candidate of candidates.slice(0, 2)) {
      addMovie(candidate);
    }
  }

  // 3) Completer aleatoirement
  for (const movie of shuffleMovies(uniqueMovies)) {
    addMovie(movie);
    if (selected.length >= MAX_POOL_SIZE) {
      break;
    }
  }

  return selected;
}

export default function Onboarding() {
  const navigate = useNavigate();

  const [queue, setQueue] = useState([]);
  const [reserve, setReserve] = useState([]);
  const [index, setIndex] = useState(0);
  const [ratedCount, setRatedCount] = useState(0);
  const [skippedCount, setSkippedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [visual, setVisual] = useState(null);

  useEffect(() => {
    async function loadMovies() {
      try {
        const allMovies = await getMovies(0, 600);
        const pool = pickOnboardingPool(allMovies);

        setQueue(pool.slice(0, INITIAL_QUEUE_SIZE));
        setReserve(pool.slice(INITIAL_QUEUE_SIZE));
      } catch (err) {
        setError(err?.response?.data?.detail || 'Impossible de charger les films');
      } finally {
        setLoading(false);
      }
    }

    loadMovies();
  }, []);

  const currentMovie = useMemo(() => queue[index], [queue, index]);

  useEffect(() => {
    async function loadVisual() {
      if (!currentMovie) {
        setVisual(null);
        return;
      }
      const data = await getMovieVisualData(currentMovie);
      setVisual(data);
    }

    loadVisual();
  }, [currentMovie]);

  function pullOneFromReserve() {
    if (reserve.length === 0) {
      return false;
    }
    const [nextMovie, ...rest] = reserve;
    setQueue((prev) => [...prev, nextMovie]);
    setReserve(rest);
    return true;
  }

  function goNext(options = {}) {
    const reserveAdded = Boolean(options.reserveAdded);
    const nextIndex = index + 1;

    if (nextIndex < queue.length || reserveAdded) {
      setIndex(nextIndex);
      return;
    }

    if (pullOneFromReserve()) {
      setIndex(nextIndex);
      return;
    }

    navigate('/home');
  }

  async function handleRate(value) {
    if (!currentMovie || saving) {
      return;
    }

    const movieMlId = currentMovie.movie_id ?? currentMovie.movieId;
    if (!movieMlId) {
      goNext();
      return;
    }

    setSaving(true);
    setError('');

    try {
      await addRating({ movie_id: movieMlId, rating: value });

      const nextRated = ratedCount + 1;
      setRatedCount(nextRated);

      if (nextRated >= TARGET_RATINGS) {
        navigate('/home');
        return;
      }

      goNext();
    } catch (err) {
      setError(err?.response?.data?.detail || 'Erreur lors de lenvoi de la note');
    } finally {
      setSaving(false);
    }
  }

  function handleSkip() {
    if (saving) {
      return;
    }

    setSkippedCount((prev) => prev + 1);

    // Si l'utilisateur skip, on ajoute un film en plus pour garder assez de signal
    const reserveAdded = pullOneFromReserve();
    goNext({ reserveAdded });
  }

  if (loading) {
    return <div className="rounded-2xl card-surface p-8 text-center">Chargement des films...</div>;
  }

  if (!currentMovie) {
    return (
      <div className="rounded-2xl card-surface p-8 text-center">
        <p className="text-lg">Onboarding termine.</p>
        <button
          onClick={() => navigate('/home')}
          className="mt-4 rounded-xl bg-brand-primary px-4 py-2 font-semibold text-black"
        >
          Voir mes recommandations
        </button>
      </div>
    );
  }

  const progress = Math.round((ratedCount / TARGET_RATINGS) * 100);

  return (
    <section className="mx-auto max-w-3xl animate-fadeUp rounded-2xl card-surface p-6 md:p-8">
      <h1 className="section-title text-4xl text-brand-accent">Onboarding</h1>
      <p className="mt-1 text-sm text-slate-300">Note au moins {TARGET_RATINGS} films pour bien apprendre tes gouts.</p>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between text-sm text-slate-300">
          <span>{ratedCount}/{TARGET_RATINGS} notes utiles</span>
          <span>{skippedCount} skips</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/10">
          <div className="h-full bg-gradient-to-r from-brand-primary to-brand-accent" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-[210px_1fr]">
        <div className="aspect-[2/3] overflow-hidden rounded-xl bg-brand-soft">
          {visual?.posterUrl ? (
            <img src={visual.posterUrl} alt={currentMovie.title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center px-4 text-center text-slate-400">Poster indisponible</div>
          )}
        </div>

        <div>
          <h2 className="text-2xl font-bold">{currentMovie.title}</h2>
          <p className="mt-2 text-sm text-slate-300">{currentMovie.genres || 'Genres non disponibles'}</p>
          <p className="mt-3 text-sm text-slate-400 line-clamp-5">{visual?.overview || 'Pas de synopsis TMDB disponible pour ce film.'}</p>

          <div className="mt-6">
            <RatingButtons onRate={handleRate} onSkip={handleSkip} disabled={saving} />
          </div>

          {error && <p className="mt-4 rounded-lg bg-red-500/15 px-3 py-2 text-sm text-red-200">{error}</p>}
        </div>
      </div>
    </section>
  );
}
