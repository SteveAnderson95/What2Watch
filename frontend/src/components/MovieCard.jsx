import { Star } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMovieVisualData, getPosterUrl } from '../services/tmdb';

function buildQuickVisual(movie) {
  const posterPath = movie?.poster_path || movie?.posterPath || null;
  const posterUrl = movie?.posterUrl || (posterPath ? getPosterUrl(posterPath) : '');
  const voteAverage = movie?.tmdb_vote_average ?? movie?.vote_average ?? null;

  return {
    tmdbId: movie?.tmdbId || movie?.tmdb_id || null,
    posterPath,
    posterUrl,
    overview: movie?.overview || '',
    voteAverage: voteAverage !== null ? Number(voteAverage) : null,
    releaseDate: movie?.release_date || '',
    runtime: null,
    budget: 0,
    revenue: 0,
  };
}

export default function MovieCard({ movie, showMatch = false }) {
  const quickVisual = useMemo(() => buildQuickVisual(movie), [movie]);
  const [visual, setVisual] = useState(quickVisual);

  const movieId = movie.movie_id ?? movie.movieId;
  const title = movie.title || 'Untitled movie';
  const genres = movie.genres || movie.genres_clean || '';
  const match = movie.match_percent ?? movie.matchPercent;
  const userRating = movie.userRating ?? movie.user_rating;

  useEffect(() => {
    let active = true;

    // Si on a déjà les infos visuelles de base (poster + note TMDB),
    // on évite un appel réseau supplémentaire.
    if (quickVisual.posterUrl && quickVisual.voteAverage !== null) {
      setVisual(quickVisual);
      return () => {
        active = false;
      };
    }

    async function loadVisual() {
      const data = await getMovieVisualData(movie);
      if (active) {
        setVisual(data || quickVisual);
      }
    }

    loadVisual();
    return () => {
      active = false;
    };
  }, [movie, quickVisual]);

  const content = (
    <>
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-brand-soft">
        {visual?.posterUrl ? (
          <img
            src={visual.posterUrl}
            alt={title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center px-4 text-center text-slate-400">
            Poster indisponible
          </div>
        )}
      </div>

      <div className="space-y-2 p-4">
        <h3 className="line-clamp-2 text-base font-semibold">{title}</h3>

        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-300">
          <span className="inline-flex items-center gap-1">
            <Star size={14} className="text-brand-accent" />
            {visual?.voteAverage ? visual.voteAverage.toFixed(1) : 'N/A'}
          </span>

          {showMatch && match !== undefined && (
            <span className="rounded-full bg-brand-primary/15 px-2 py-0.5 text-xs font-semibold text-brand-accent">
              {Math.round(match)}% match
            </span>
          )}

          {userRating !== undefined && (
            <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-semibold text-emerald-300">
              Ma note: {Number(userRating).toFixed(1)}
            </span>
          )}
        </div>

        <p className="line-clamp-2 text-xs text-slate-400">{genres || 'Genres non disponibles'}</p>
      </div>
    </>
  );

  if (!movieId) {
    return <article className="card-surface overflow-hidden rounded-2xl">{content}</article>;
  }

  return (
    <Link
      to={`/movies/${movieId}`}
      className="group block overflow-hidden rounded-2xl card-surface shadow-glow transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(0,0,0,.45)]"
    >
      {content}
    </Link>
  );
}
