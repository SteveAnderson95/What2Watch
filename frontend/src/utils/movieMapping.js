// Normalise un titre pour comparer des films venant de sources différentes.
export function normalizeTitle(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/\([^)]*\)/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Associe des films TMDB à nos films backend (MovieLens) par titre normalisé.
export function mapTmdbMoviesToBackend(tmdbMovies, backendMovies) {
  const normalizedMap = new Map();
  for (const movie of backendMovies) {
    const key = normalizeTitle(movie.title);
    if (key && !normalizedMap.has(key)) {
      normalizedMap.set(key, movie);
    }
  }

  const mapped = [];
  const used = new Set();

  for (const tmdb of tmdbMovies) {
    const tmdbTitle = tmdb.title || tmdb.name;
    const tmdbKey = normalizeTitle(tmdbTitle);

    let match = normalizedMap.get(tmdbKey);
    if (!match) {
      match = backendMovies.find((movie) => {
        const key = normalizeTitle(movie.title);
        return key && tmdbKey && (key.includes(tmdbKey) || tmdbKey.includes(key));
      });
    }

    if (!match) {
      continue;
    }

    const mlId = match.movie_id ?? match.movieId;
    if (!mlId || used.has(mlId)) {
      continue;
    }

    used.add(mlId);
    mapped.push({
      ...match,
      tmdbId: tmdb.id,
      tmdb_id: tmdb.id,
      tmdb_vote_average: tmdb.vote_average,
    });
  }

  return mapped;
}
