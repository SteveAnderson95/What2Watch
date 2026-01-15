import axios from 'axios';

const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY || 'aef7ddd7ac401d68a00f53e1a64d037a';
const TMDB_BASE = 'https://api.themoviedb.org/3';
const IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';
const CACHE_KEY = 'w2w_tmdb_cache_v1';

let cache = {};

try {
  const raw = localStorage.getItem(CACHE_KEY);
  cache = raw ? JSON.parse(raw) : {};
} catch {
  cache = {};
}

function saveCache() {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Rien: cache best-effort
  }
}

function movieKey(movie) {
  return String(movie.movie_id ?? movie.movieId ?? movie.id ?? 'unknown');
}

async function fetchTmdbById(tmdbId) {
  const { data } = await axios.get(`${TMDB_BASE}/movie/${tmdbId}`, {
    params: { api_key: TMDB_API_KEY, language: 'en-US' },
  });
  return data;
}

async function searchTmdbByTitle(title) {
  const { data } = await axios.get(`${TMDB_BASE}/search/movie`, {
    params: {
      api_key: TMDB_API_KEY,
      query: title,
      include_adult: false,
      language: 'en-US',
    },
  });
  if (!data.results || data.results.length === 0) {
    return null;
  }
  return data.results[0];
}

export function getPosterUrl(posterPath) {
  if (!posterPath) {
    return '';
  }
  return `${IMAGE_BASE}${posterPath}`;
}

export function getBackdropUrl(backdropPath, size = 'original') {
  if (!backdropPath) {
    return '';
  }
  return `https://image.tmdb.org/t/p/${size}${backdropPath}`;
}

export async function getMovieVisualData(movie) {
  if (!movie) {
    return null;
  }

  const key = movieKey(movie);
  if (cache[key]) {
    return cache[key];
  }

  try {
    const tmdbId = movie.tmdbId || movie.tmdb_id;
    let tmdb = null;

    // Priorite: tmdbId backend, sinon fallback recherche par titre
    if (tmdbId) {
      tmdb = await fetchTmdbById(tmdbId);
    } else if (movie.title) {
      tmdb = await searchTmdbByTitle(movie.title);
    }

    const data = {
      tmdbId: tmdb?.id || tmdbId || null,
      posterPath: tmdb?.poster_path || null,
      posterUrl: tmdb?.poster_path ? getPosterUrl(tmdb.poster_path) : '',
      overview: tmdb?.overview || '',
      voteAverage: tmdb?.vote_average || null,
      releaseDate: tmdb?.release_date || '',
      runtime: tmdb?.runtime || null,
      budget: tmdb?.budget || 0,
      revenue: tmdb?.revenue || 0,
    };

    cache[key] = data;
    saveCache();
    return data;
  } catch {
    return {
      tmdbId: null,
      posterPath: null,
      posterUrl: '',
      overview: '',
      voteAverage: null,
      releaseDate: '',
      runtime: null,
      budget: 0,
      revenue: 0,
    };
  }
}

export async function getTmdbSimilar(tmdbId) {
  if (!tmdbId) {
    return [];
  }
  const { data } = await axios.get(`${TMDB_BASE}/movie/${tmdbId}/similar`, {
    params: { api_key: TMDB_API_KEY, language: 'en-US' },
  });
  return data.results || [];
}

function pickBestYoutubeVideo(videos) {
  if (!videos || videos.length === 0) {
    return null;
  }

  const youtube = videos.filter((item) => item.site === 'YouTube' && item.key);
  if (youtube.length === 0) {
    return null;
  }

  // Priorite: Trailer officiel, puis Trailer, puis Teaser, puis premiere video YouTube
  const officialTrailer = youtube.find((item) => item.type === 'Trailer' && item.official);
  if (officialTrailer) {
    return officialTrailer;
  }

  const trailer = youtube.find((item) => item.type === 'Trailer');
  if (trailer) {
    return trailer;
  }

  const teaser = youtube.find((item) => item.type === 'Teaser');
  if (teaser) {
    return teaser;
  }

  return youtube[0];
}

export async function getMovieTrailer(tmdbId) {
  if (!tmdbId) {
    return null;
  }

  try {
    const { data } = await axios.get(`${TMDB_BASE}/movie/${tmdbId}/videos`, {
      params: { api_key: TMDB_API_KEY, language: 'en-US' },
    });

    const best = pickBestYoutubeVideo(data.results || []);
    if (!best) {
      return null;
    }

    return {
      key: best.key,
      name: best.name || 'Trailer',
      url: `https://www.youtube.com/watch?v=${best.key}`,
      embedUrl: `https://www.youtube-nocookie.com/embed/${best.key}`,
    };
  } catch {
    return null;
  }
}

export async function getMovieCredits(tmdbId) {
  if (!tmdbId) {
    return { director: '', cast: [] };
  }

  try {
    const { data } = await axios.get(`${TMDB_BASE}/movie/${tmdbId}/credits`, {
      params: { api_key: TMDB_API_KEY, language: 'en-US' },
    });

    const crew = data.crew || [];
    const cast = data.cast || [];
    const director = crew.find((item) => item.job === 'Director')?.name || '';

    return {
      director,
      cast: cast.slice(0, 8).map((item) => item.name).filter(Boolean),
    };
  } catch {
    return { director: '', cast: [] };
  }
}

export async function getTrendingMovies() {
  const { data } = await axios.get(`${TMDB_BASE}/trending/movie/week`, {
    params: { api_key: TMDB_API_KEY, language: 'en-US' },
  });
  return data.results || [];
}

export async function getTopRatedMovies() {
  const { data } = await axios.get(`${TMDB_BASE}/movie/top_rated`, {
    params: { api_key: TMDB_API_KEY, language: 'en-US', page: 1 },
  });
  return data.results || [];
}

export async function getMoviesByGenre(genreId, page = 1) {
  const { data } = await axios.get(`${TMDB_BASE}/discover/movie`, {
    params: {
      api_key: TMDB_API_KEY,
      language: 'en-US',
      sort_by: 'popularity.desc',
      include_adult: false,
      with_genres: genreId,
      page,
    },
  });
  return data.results || [];
}

export async function getTrendingAndTopRatedMix() {
  const [trending, topRated] = await Promise.all([getTrendingMovies(), getTopRatedMovies()]);
  const merged = [...trending, ...topRated];
  const unique = [];
  const seen = new Set();

  for (const movie of merged) {
    if (!movie || !movie.id || seen.has(movie.id)) {
      continue;
    }
    seen.add(movie.id);
    unique.push(movie);
  }

  return unique;
}
