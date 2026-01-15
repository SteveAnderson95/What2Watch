import { Star } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMovieVisualData } from '../services/tmdb';

export default function MovieCard({ movie, showMatch = false }) {
  const [visual, setVisual] = useState(null);

  const movieId = movie.movie_id ?? movie.movieId;
  const title = movie.title || 'Untitled movie';
  const genres = movie.genres || movie.genres_clean || '';
  const match = movie.match_percent ?? movie.matchPercent;
  const userRating = movie.userRating ?? movie.user_rating;

  useEffect(() => {
    let active = true;

    async function loadVisual() {
      const data = await getMovieVisualData(movie);
      if (active) {
        setVisual(data);
      }
    }

    loadVisual();
    return () => {
      active = false;
    };
  }, [movie]);

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
