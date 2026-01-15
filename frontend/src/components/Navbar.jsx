import { Film, LogOut, Search, User } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { clearAuth, getStoredUser, searchMovies } from '../services/api';

function linkClass({ isActive }) {
  return isActive
    ? 'rounded-full bg-brand-primary/20 px-4 py-2 text-brand-accent text-sm font-semibold'
    : 'rounded-full px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-white/5';
}

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const menuRef = useRef(null);
  const searchRef = useRef(null);

  const user = getStoredUser();
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  useEffect(() => {
    function handleOutsideClick(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    }

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  useEffect(() => {
    // Reset du champ quand on change de page (plus clair UX)
    if (!location.pathname.startsWith('/home')) {
      setQuery('');
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [location.pathname]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoadingSuggestions(true);
      try {
        const data = await searchMovies(q);
        setSuggestions(data.slice(0, 7));
        setShowSuggestions(true);
      } catch {
        setSuggestions([]);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 220);

    return () => clearTimeout(timer);
  }, [query]);

  function logout() {
    clearAuth();
    navigate('/');
  }

  function submitSearch(event) {
    event.preventDefault();
    const q = query.trim();
    if (!q) {
      navigate('/home');
      return;
    }
    navigate(`/home?q=${encodeURIComponent(q)}`);
    setShowSuggestions(false);
  }

  function chooseSuggestion(movie) {
    const id = movie.movie_id ?? movie.movieId;
    setQuery(movie.title || '');
    setShowSuggestions(false);
    if (id) {
      navigate(`/movies/${id}`);
      return;
    }
    navigate(`/home?q=${encodeURIComponent(movie.title || '')}`);
  }

  const initial = (user?.username || user?.email || 'U').charAt(0).toUpperCase();
  const usernameLabel = user?.username || 'Profile';

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0d131d]/96 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 md:px-8">
        <div className="flex items-center gap-2 text-brand-accent">
          <Film size={23} />
          <span className="section-title text-2xl leading-none text-white">What2Watch</span>
        </div>

        <nav className="hidden items-center gap-1 md:flex">
          <NavLink to="/home" className={linkClass}>Match of the Day</NavLink>
          <NavLink to="/profile" className={linkClass}>My Library</NavLink>
        </nav>

        <div className="ml-auto hidden md:block md:w-full md:max-w-2xl" ref={searchRef}>
          <form onSubmit={submitSearch} className="relative flex items-center gap-2 rounded-xl border border-white/12 bg-white/5 px-3">
            <Search size={16} className="text-slate-300" />
            <input
              value={query}
              onFocus={() => {
                if (suggestions.length > 0) {
                  setShowSuggestions(true);
                }
              }}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search..."
              className="w-full bg-transparent py-2.5 text-sm text-white outline-none"
            />

            {showSuggestions && (query.trim().length >= 2) && (
              <div className="absolute left-0 top-full z-40 mt-2 w-full overflow-hidden rounded-xl border border-white/10 bg-[#1a2330] shadow-2xl">
                {loadingSuggestions && (
                  <p className="px-3 py-2 text-sm text-slate-300">Recherche...</p>
                )}

                {!loadingSuggestions && suggestions.length === 0 && (
                  <p className="px-3 py-2 text-sm text-slate-400">Aucune suggestion</p>
                )}

                {!loadingSuggestions && suggestions.map((movie) => (
                  <button
                    key={movie.movie_id ?? movie.movieId}
                    type="button"
                    onClick={() => chooseSuggestion(movie)}
                    className="w-full px-3 py-2 text-left text-sm text-slate-100 hover:bg-white/10"
                  >
                    {movie.title}
                    <span className="ml-2 text-xs text-slate-400">{movie.genres || ''}</span>
                  </button>
                ))}
              </div>
            )}
          </form>
        </div>

        <div className="relative ml-4 flex items-center gap-2" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((prev) => !prev)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/10 text-sm font-bold text-white hover:bg-white/15"
            aria-label="Open profile menu"
          >
            {initial}
          </button>
          <span className="hidden max-w-[120px] truncate text-sm font-semibold text-slate-200 md:inline">
            {usernameLabel}
          </span>

          {menuOpen && (
            <div className="absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-xl border border-white/10 bg-[#1a2330] shadow-2xl">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  navigate('/profile');
                }}
                className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-slate-100 hover:bg-white/10"
              >
                <User size={15} /> Profile
              </button>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  navigate('/onboarding');
                }}
                className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-slate-100 hover:bg-white/10"
              >
                Keep Rating
              </button>
              <button
                onClick={logout}
                className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-red-200 hover:bg-red-500/10"
              >
                <LogOut size={15} /> Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
