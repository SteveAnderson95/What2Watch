import { Compass, Flame, Sparkles, Trophy } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import BrowseMovieCard from '../components/BrowseMovieCard';
import {
  getBackdropUrl,
  getMoviesByGenre,
  getTopRatedMovies,
  getTrendingMovies,
} from '../services/tmdb';

const FALLBACK_BG = 'https://images.unsplash.com/photo-1489599510532-d2f2f4a3f4b8?auto=format&fit=crop&w=1600&q=80';

function Section({ id, title, icon, movies, visible, onShowMore }) {
  const Icon = icon;

  return (
    <section id={id} className="space-y-3">
      <h2 className="flex items-center gap-2 text-2xl font-semibold text-white">
        <Icon size={20} className="text-brand-accent" /> {title}
      </h2>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        {movies.slice(0, visible).map((movie) => (
          <BrowseMovieCard key={`${id}-${movie.id}`} movie={movie} />
        ))}
      </div>

      {visible < movies.length && (
        <button
          onClick={onShowMore}
          className="rounded-xl border border-brand-primary/40 bg-brand-primary/10 px-4 py-2 text-sm font-semibold text-brand-accent hover:bg-brand-primary/20"
        >
          Afficher plus
        </button>
      )}
    </section>
  );
}

export default function Browse() {
  const [heroBg, setHeroBg] = useState(FALLBACK_BG);
  const [sections, setSections] = useState({
    trending: [],
    topRated: [],
    action: [],
    comedy: [],
    scifi: [],
    animation: [],
  });
  const [visible, setVisible] = useState({
    trending: 10,
    topRated: 10,
    action: 10,
    comedy: 10,
    scifi: 10,
    animation: 10,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBrowseData() {
      setLoading(true);

      try {
        const [trending, topRated, action, comedy, scifi, animation] = await Promise.all([
          getTrendingMovies(),
          getTopRatedMovies(),
          getMoviesByGenre(28),
          getMoviesByGenre(35),
          getMoviesByGenre(878),
          getMoviesByGenre(16),
        ]);

        const nextSections = {
          trending: Array.isArray(trending) ? trending : [],
          topRated: Array.isArray(topRated) ? topRated : [],
          action: Array.isArray(action) ? action : [],
          comedy: Array.isArray(comedy) ? comedy : [],
          scifi: Array.isArray(scifi) ? scifi : [],
          animation: Array.isArray(animation) ? animation : [],
        };

        setSections(nextSections);

        if (nextSections.trending.length > 0 && nextSections.trending[0].backdrop_path) {
          setHeroBg(getBackdropUrl(nextSections.trending[0].backdrop_path));
        }
      } finally {
        setLoading(false);
      }
    }

    loadBrowseData();
  }, []);

  function showMore(key) {
    setVisible((prev) => ({ ...prev, [key]: prev[key] + 10 }));
  }

  return (
    <section className="space-y-8">
      <div className="rounded-3xl border border-white/10 bg-brand-card/70 p-4 md:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link to="/" className="section-title text-3xl text-white">What2Watch</Link>
            <Link to="/browse" className="text-sm font-semibold text-brand-accent">Browse All</Link>
          </div>

          <div className="flex items-center gap-2">
            <Link to="/" className="rounded-full border border-brand-primary/40 bg-brand-primary/10 px-4 py-2 text-sm font-semibold text-brand-accent hover:bg-brand-primary/20">
              Calculate Your Taste
            </Link>
            <Link to="/login" className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-slate-200">
              Login
            </Link>
          </div>
        </div>

        <div
          className="relative overflow-hidden rounded-2xl border border-white/10"
          style={{
            backgroundImage: `linear-gradient(110deg, rgba(0,0,0,.75), rgba(0,0,0,.45)), url(${heroBg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="px-6 py-12 md:px-10 md:py-16">
            <h1 className="section-title max-w-3xl text-5xl leading-none text-white md:text-6xl">
              Browse all movies by category
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-slate-200 md:text-base">
              Decouvre les tendances, les films mieux notes et des categories populaires avant meme de creer un compte.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-[220px_1fr]">
        <aside className="h-fit rounded-2xl border border-white/10 bg-brand-card/60 p-4">
          <p className="mb-3 text-sm font-semibold text-slate-200">Categories</p>
          <nav className="space-y-2 text-sm">
            <a href="#trending" className="block rounded-lg px-2 py-1 text-slate-300 hover:bg-white/10">Trending</a>
            <a href="#top-rated" className="block rounded-lg px-2 py-1 text-slate-300 hover:bg-white/10">Top Rated</a>
            <a href="#action" className="block rounded-lg px-2 py-1 text-slate-300 hover:bg-white/10">Action Picks</a>
            <a href="#comedy" className="block rounded-lg px-2 py-1 text-slate-300 hover:bg-white/10">Comedy Picks</a>
            <a href="#scifi" className="block rounded-lg px-2 py-1 text-slate-300 hover:bg-white/10">Sci-Fi Picks</a>
            <a href="#animation" className="block rounded-lg px-2 py-1 text-slate-300 hover:bg-white/10">Animation Picks</a>
          </nav>

          <div className="mt-5 rounded-xl border border-brand-primary/30 bg-brand-primary/10 p-3">
            <p className="text-xs text-slate-200">Picked for you</p>
            <p className="mt-1 text-xs text-slate-300">Cree un compte pour debloquer les recommendations personnalisees.</p>
            <Link
              to="/"
              className="mt-3 inline-block rounded-lg bg-brand-primary px-3 py-2 text-xs font-semibold text-black hover:bg-brand-accent"
            >
              Calculate your taste
            </Link>
          </div>
        </aside>

        <div className="space-y-10">
          {loading ? (
            <div className="rounded-2xl card-surface p-6">Chargement des films...</div>
          ) : (
            <>
              <Section id="trending" title="Trending" icon={Flame} movies={sections.trending} visible={visible.trending} onShowMore={() => showMore('trending')} />
              <Section id="top-rated" title="Highest Rated" icon={Trophy} movies={sections.topRated} visible={visible.topRated} onShowMore={() => showMore('topRated')} />
              <Section id="action" title="Action Picks" icon={Compass} movies={sections.action} visible={visible.action} onShowMore={() => showMore('action')} />
              <Section id="comedy" title="Comedy Picks" icon={Sparkles} movies={sections.comedy} visible={visible.comedy} onShowMore={() => showMore('comedy')} />
              <Section id="scifi" title="Sci-Fi Picks" icon={Sparkles} movies={sections.scifi} visible={visible.scifi} onShowMore={() => showMore('scifi')} />
              <Section id="animation" title="Animation Picks" icon={Sparkles} movies={sections.animation} visible={visible.animation} onShowMore={() => showMore('animation')} />
            </>
          )}
        </div>
      </div>
    </section>
  );
}
