import { Star } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import MovieCard from '../components/MovieCard';
import { addRating, getMovie, getMovies, getSimilarMovies } from '../services/api';
import { getMovieCredits, getMovieTrailer, getMovieVisualData, getTmdbSimilar } from '../services/tmdb';
import { formatMoney, formatRuntime } from '../utils/formatters';
import { mapTmdbMoviesToBackend } from '../utils/movieMapping';

export default function MovieDetail() {
  const { movieId } = useParams();
  const feedbackTimeoutRef = useRef(null);

  const [movie, setMovie] = useState(null);
  const [visual, setVisual] = useState(null);
  const [similarAlgo, setSimilarAlgo] = useState([]);
  const [similarTmdb, setSimilarTmdb] = useState([]);
  const [credits, setCredits] = useState({ director: '', cast: [] });
  const [trailer, setTrailer] = useState(null);
  const [rating, setRating] = useState(4.0);
  const [feedback, setFeedback] = useState('');
  const [feedbackType, setFeedbackType] = useState('success');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setFeedback('');
      setRating(4.0);

      try {
        // 1) Récupération des données backend (fiche + similaires algo + catalogue local).
        const [movieData, similarData, backendMovies] = await Promise.all([
          getMovie(movieId),
          getSimilarMovies(movieId, 10),
          getMovies(0, 500),
        ]);
        const safeSimilarData = Array.isArray(similarData) ? similarData : [];
        const safeBackendMovies = Array.isArray(backendMovies) ? backendMovies : [];

        setMovie(movieData);
        setSimilarAlgo(
          safeSimilarData.map((item) => ({
            movie_id: item.movieId,
            title: item.title,
            genres: item.genres,
            match_percent: item.match_percent,
          }))
        );

        const visualData = await getMovieVisualData(movieData);
        setVisual(visualData);

        // 2) Enrichissement TMDB (trailer, casting, similaires TMDB).
        const [trailerData, creditsData, tmdbSimilarRaw] = await Promise.all([
          getMovieTrailer(visualData?.tmdbId),
          getMovieCredits(visualData?.tmdbId),
          getTmdbSimilar(visualData?.tmdbId),
        ]);

        setTrailer(trailerData);
        setCredits(creditsData);
        setSimilarTmdb(mapTmdbMoviesToBackend(Array.isArray(tmdbSimilarRaw) ? tmdbSimilarRaw : [], safeBackendMovies).slice(0, 10));
      } catch {
        setMovie(null);
      } finally {
        setLoading(false);
      }
    }

    loadData();

    return () => {
      if (feedbackTimeoutRef.current) {
        clearTimeout(feedbackTimeoutRef.current);
      }
    };
  }, [movieId]);

  async function submitRating() {
    if (!movie || saving) {
      return;
    }

    setSaving(true);
    setFeedback('');

    try {
      await addRating({ movie_id: movie.movie_id, rating: Number(rating) });
      setFeedbackType('success');
      setFeedback('Note enregistree');

      // Le message se cache automatiquement apres 2 secondes
      if (feedbackTimeoutRef.current) {
        clearTimeout(feedbackTimeoutRef.current);
      }
      feedbackTimeoutRef.current = setTimeout(() => setFeedback(''), 2000);
    } catch {
      setFeedbackType('error');
      setFeedback('Erreur lors de la sauvegarde de la note.');
    } finally {
      setSaving(false);
    }
  }

  function onRatingChange(event) {
    setRating(event.target.value);
    if (feedback) {
      setFeedback('');
    }
  }

  if (loading) {
    return <div className="rounded-2xl card-surface p-8">Chargement...</div>;
  }

  if (!movie) {
    return <div className="rounded-2xl card-surface p-8">Film introuvable.</div>;
  }

  return (
    <section className="space-y-8">
      <Link to="/home" className="text-sm text-brand-accent hover:underline">&lt; Retour Home</Link>

      <div className="grid gap-6 rounded-2xl card-surface p-6 md:grid-cols-[260px_1fr]">
        <div className="aspect-[2/3] overflow-hidden rounded-xl bg-brand-soft">
          {visual?.posterUrl ? <img src={visual.posterUrl} alt={movie.title} className="h-full w-full object-cover" /> : null}
        </div>

        <div>
          <h1 className="text-3xl font-bold md:text-4xl">{movie.title}</h1>
          <p className="mt-2 text-sm text-slate-300">{movie.genres || 'Genres non disponibles'}</p>
          <p className="mt-4 text-sm text-slate-300">{visual?.overview || 'Synopsis non disponible.'}</p>

          <div className="mt-4 flex items-center gap-2 text-sm text-slate-200">
            <Star size={16} className="text-brand-accent" />
            TMDB: {visual?.voteAverage ? visual.voteAverage.toFixed(1) : 'N/A'}
          </div>

          <div className="mt-4 grid gap-2 text-sm text-slate-200 md:grid-cols-2">
            <p>Date de sortie: <span className="text-slate-100">{visual?.releaseDate || 'N/A'}</span></p>
            <p>Duree: <span className="text-slate-100">{formatRuntime(visual?.runtime)}</span></p>
            <p>Budget: <span className="text-slate-100">{formatMoney(visual?.budget)}</span></p>
            <p>Revenu: <span className="text-slate-100">{formatMoney(visual?.revenue)}</span></p>
            <p>Realisateur: <span className="text-slate-100">{credits.director || 'N/A'}</span></p>
          </div>

          <div className="mt-4">
            <p className="text-sm text-slate-300">Casting principal</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {credits.cast.length > 0 ? credits.cast.map((name) => (
                <span key={name} className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-slate-200">
                  {name}
                </span>
              )) : <span className="text-xs text-slate-400">Casting indisponible</span>}
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-white/10 bg-black/20 p-4">
            <p className="mb-2 text-sm text-slate-300">Noter ce film</p>
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="range"
                min="0.5"
                max="5"
                step="0.5"
                value={rating}
                onChange={onRatingChange}
                className="w-48"
              />
              <span className="rounded-lg bg-white/10 px-3 py-1 text-sm">{rating}</span>
              <button
                onClick={submitRating}
                disabled={saving}
                className="rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-black hover:bg-brand-accent disabled:opacity-60"
              >
                {saving ? 'Envoi...' : 'Enregistrer'}
              </button>
            </div>

            {feedback && (
              <p className={`mt-2 text-sm ${feedbackType === 'error' ? 'text-red-300' : 'text-brand-accent'}`}>
                {feedback}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl card-surface p-6">
        <h2 className="section-title text-3xl text-brand-accent">Trailer</h2>
        {trailer ? (
          <div className="mt-4 overflow-hidden rounded-xl border border-white/10">
            <div className="aspect-video">
              <iframe
                src={trailer.embedUrl}
                title={trailer.name}
                className="h-full w-full"
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-300">Trailer YouTube non disponible pour ce film.</p>
        )}
      </div>

      <div>
        <h2 className="section-title text-3xl text-brand-accent">Films similaires (Notre algo)</h2>
        {similarAlgo.length === 0 ? (
          <p className="mt-3 text-sm text-slate-300">Aucun film similaire trouve.</p>
        ) : (
          <div className="grid-fade mt-4 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
            {similarAlgo.map((item) => (
              <MovieCard key={item.movie_id} movie={item} showMatch />
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="section-title text-3xl text-brand-accent">Films similaires (TMDB)</h2>
        {similarTmdb.length === 0 ? (
          <p className="mt-3 text-sm text-slate-300">Aucun film similaire TMDB trouve.</p>
        ) : (
          <div className="grid-fade mt-4 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
            {similarTmdb.map((item) => (
              <MovieCard key={item.movie_id} movie={item} showMatch />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
