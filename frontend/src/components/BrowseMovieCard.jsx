import { Star } from 'lucide-react';
import { getPosterUrl } from '../services/tmdb';

export default function BrowseMovieCard({ movie }) {
  const title = movie.title || movie.name || 'Untitled';
  const posterUrl = movie.poster_path ? getPosterUrl(movie.poster_path) : '';
  const tmdbScore = movie.vote_average ? Number(movie.vote_average).toFixed(1) : 'N/A';

  return (
    <a
      href={`https://www.themoviedb.org/movie/${movie.id}`}
      target="_blank"
      rel="noreferrer"
      className="group block overflow-hidden rounded-2xl card-surface transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(0,0,0,.45)]"
    >
      <div className="aspect-[2/3] overflow-hidden bg-brand-soft">
        {posterUrl ? (
          <img
            src={posterUrl}
            alt={title}
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center px-3 text-center text-xs text-slate-400">
            Poster indisponible
          </div>
        )}
      </div>

      <div className="space-y-1 p-3">
        <h3 className="line-clamp-2 text-sm font-semibold text-white">{title}</h3>
        <p className="flex items-center gap-1 text-xs text-slate-300">
          <Star size={13} className="text-brand-accent" /> TMDB {tmdbScore}
        </p>
      </div>
    </a>
  );
}
