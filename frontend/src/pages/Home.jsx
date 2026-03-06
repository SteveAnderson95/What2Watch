import { BarChart3, Flame, Search, Star } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import MovieCard from '../components/MovieCard';
import { getMovies, getRatings, getRecommendations, searchMovies } from '../services/api';
import { getTrendingAndTopRatedMix } from '../services/tmdb';
import { mapTmdbMoviesToBackend } from '../utils/movieMapping';

export default function Home() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const searchQuery = (searchParams.get('q') || '').trim();

  const [recommendations, setRecommendations] = useState([]);
  const [topMatches, setTopMatches] = useState([]);
  const [trendingNow, setTrendingNow] = useState([]);
  const [exploreMovies, setExploreMovies] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [ratingsCount, setRatingsCount] = useState(0);
  const [visibleReco, setVisibleReco] = useState(10);
  const [visibleExplore, setVisibleExplore] = useState(10);
  const [visibleTrending, setVisibleTrending] = useState(10);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError('');

      try {
        // Chargement parallèle pour garder la page fluide.
        const [recoData, backendMovies, tmdbMix, ratings] = await Promise.all([
          getRecommendations(20),
          getMovies(0, 1000),
          getTrendingAndTopRatedMix(),
          getRatings(),
        ]);

        setRecommendations(recoData);
        setTopMatches(recoData.slice(0, 5));
        setRatingsCount(ratings.length);

        // On rattache les films TMDB à notre catalogue interne (movie_id).
        // On réutilise la même base pour "Tendances" et "Explorer" pour
        // éviter des appels réseau supplémentaires.
        const mappedExplore = mapTmdbMoviesToBackend(tmdbMix, backendMovies);
        const explore = mappedExplore.length > 0 ? mappedExplore : backendMovies;
        setExploreMovies(explore);
        setTrendingNow(explore.slice(0, 30));
      } catch (err) {
        setError(err?.response?.data?.detail || 'Erreur de chargement Home');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  useEffect(() => {
    async function runSearch() {
      if (!searchQuery) {
        setSearchResults([]);
        return;
      }

      setSearchLoading(true);
      try {
        const data = await searchMovies(searchQuery);
        if (data.length > 0) {
          setSearchResults(data);
        } else {
          // Fallback local si l'API ne trouve rien.
          const local = exploreMovies.filter((movie) => movie.title?.toLowerCase().includes(searchQuery.toLowerCase()));
          setSearchResults(local);
        }
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }

    runSearch();
  }, [searchQuery, exploreMovies]);

  const shownReco = useMemo(() => recommendations.slice(0, visibleReco), [recommendations, visibleReco]);
  const shownTrending = useMemo(() => trendingNow.slice(0, visibleTrending), [trendingNow, visibleTrending]);
  const shownExplore = useMemo(() => exploreMovies.slice(0, visibleExplore), [exploreMovies, visibleExplore]);

  const profileStrength = Math.min(100, Math.round((ratingsCount / 20) * 100));

  return (
    <section className="space-y-8">
      <div className="rounded-3xl border border-white/10 bg-gradient-to-r from-brand-card to-[#131b28] p-6 md:p-8">
        <p className="text-sm uppercase tracking-[0.2em] text-brand-accent">What2Watch</p>
        <h1 className="section-title mt-2 text-5xl leading-none md:text-6xl">Your personal movie radar</h1>
        <p className="mt-3 max-w-2xl text-sm text-slate-300 md:text-base">
          Top matches, tendances TMDB et recommandations hybrides en un seul endroit.
        </p>
      </div>

      {loading && <div className="rounded-2xl card-surface p-6">Chargement...</div>}
      {error && <div className="rounded-2xl bg-red-500/15 p-4 text-red-200">{error}</div>}

      {searchQuery && (
        <div>
          <h2 className="section-title flex items-center gap-2 text-3xl text-brand-accent">
            <Search size={20} /> Resultats pour "{searchQuery}"
          </h2>
          {searchLoading && <p className="mt-2 text-sm text-slate-400">Recherche...</p>}
          {!searchLoading && searchResults.length === 0 && <p className="mt-2 text-sm text-slate-400">Aucun resultat trouve.</p>}
          <div className="grid-fade mt-4 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
            {searchResults.map((movie) => (
              <MovieCard key={movie.movieId || movie.movie_id} movie={movie} />
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="section-title flex items-center gap-2 text-3xl text-brand-accent">
          <Star size={20} /> Top Matches
        </h2>
        <div className="grid-fade mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
          {topMatches.map((movie) => (
            <MovieCard key={movie.movieId || movie.movie_id} movie={movie} showMatch />
          ))}
        </div>
      </div>

      {trendingNow.length > 0 && (
        <div>
          <h2 className="section-title flex items-center gap-2 text-3xl text-brand-accent">
            <Flame size={20} /> Tendances du moment
          </h2>
          <div className="grid-fade mt-4 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
            {shownTrending.map((movie) => (
              <MovieCard key={movie.movieId || movie.movie_id} movie={movie} />
            ))}
          </div>
          {visibleTrending < trendingNow.length && (
            <button
              onClick={() => setVisibleTrending((prev) => prev + 10)}
              className="mt-4 rounded-xl border border-brand-primary/40 bg-brand-primary/10 px-5 py-2 text-sm font-semibold text-brand-accent hover:bg-brand-primary/20"
            >
              Afficher plus
            </button>
          )}
        </div>
      )}

      <div className="rounded-2xl border border-white/10 bg-[#1b2533]/90 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-3xl font-semibold">Profile Strength</h3>
            <p className="mt-1 text-slate-300">Rate more movies to grow your taste profile.</p>
          </div>
          <button
            onClick={() => navigate('/onboarding')}
            className="rounded-xl bg-brand-primary px-5 py-3 text-sm font-bold text-black hover:bg-brand-accent"
          >
            Keep Rating
          </button>
        </div>

        <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/12">
          <div className="h-full bg-gradient-to-r from-brand-primary to-brand-accent" style={{ width: `${profileStrength}%` }} />
        </div>
        <p className="mt-2 text-sm text-slate-300">{profileStrength}% complete</p>
      </div>

      <div>
        <h2 className="section-title flex items-center gap-2 text-3xl text-brand-accent">
          <BarChart3 size={20} /> Recommandations
        </h2>
        <div className="grid-fade mt-4 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          {shownReco.map((movie) => (
            <MovieCard key={movie.movieId || movie.movie_id} movie={movie} showMatch />
          ))}
        </div>
        {visibleReco < recommendations.length && (
          <button
            onClick={() => setVisibleReco((prev) => prev + 10)}
            className="mt-4 rounded-xl border border-brand-primary/40 bg-brand-primary/10 px-5 py-2 text-sm font-semibold text-brand-accent hover:bg-brand-primary/20"
          >
            Afficher plus
          </button>
        )}
      </div>

      <div>
        <h2 className="section-title flex items-center gap-2 text-3xl text-brand-accent">
          <Flame size={20} /> Explorer (Trending + Top rated)
        </h2>
        <div className="grid-fade mt-4 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          {shownExplore.map((movie) => (
            <MovieCard key={movie.movieId || movie.movie_id} movie={movie} />
          ))}
        </div>
        {visibleExplore < exploreMovies.length && (
          <button
            onClick={() => setVisibleExplore((prev) => prev + 10)}
            className="mt-4 rounded-xl border border-brand-primary/40 bg-brand-primary/10 px-5 py-2 text-sm font-semibold text-brand-accent hover:bg-brand-primary/20"
          >
            Afficher plus
          </button>
        )}
      </div>
    </section>
  );
}
