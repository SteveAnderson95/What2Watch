import { Film, LogIn } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getErrorMessage, register } from '../services/api';
import { getBackdropUrl, getTrendingMovies } from '../services/tmdb';

const FALLBACK_BG = 'https://images.unsplash.com/photo-1489599510532-d2f2f4a3f4b8?auto=format&fit=crop&w=1800&q=80';

export default function Landing() {
  const navigate = useNavigate();

  const [showSignup, setShowSignup] = useState(false);
  const [form, setForm] = useState({ email: '', username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [heroBg, setHeroBg] = useState(FALLBACK_BG);

  useEffect(() => {
    async function loadHeroImage() {
      try {
        const trending = await getTrendingMovies();
        if (trending.length > 0 && trending[0].backdrop_path) {
          setHeroBg(getBackdropUrl(trending[0].backdrop_path));
        }
      } catch {
        // fallback deja defini
      }
    }

    loadHeroImage();
  }, []);

  function onChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function onSignup(event) {
    event.preventDefault();
    setLoading(true);
    setError('');
    let didNavigate = false;

    try {
      await register(form);
      didNavigate = true;
      navigate('/onboarding', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, 'Inscription impossible'));
    } finally {
      if (!didNavigate) {
        setLoading(false);
      }
    }
  }

  return (
    <section className="h-full w-full p-3 md:p-5">
      <div className="mx-auto h-full w-full max-w-[1460px] overflow-hidden rounded-3xl border border-white/10 bg-brand-card/70">
        <div
          className="h-full"
          style={{
            backgroundImage: `linear-gradient(110deg, rgba(2,6,12,.86), rgba(4,8,16,.62)), url(${heroBg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="border-b border-white/10 bg-black/50 px-5 py-4 md:px-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-brand-accent">
                  <Film size={23} />
                  <span className="section-title text-3xl text-white">What2Watch</span>
                </div>
                <Link to="/browse" className="text-sm font-semibold text-slate-100 hover:text-brand-accent">Browse All</Link>
              </div>

              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-slate-200"
              >
                <LogIn size={16} /> Login
              </Link>
            </div>
          </div>

          <div className="grid h-[calc(100%-73px)] gap-8 px-6 py-7 md:grid-cols-[1.15fr_0.85fr] md:px-10 md:py-10">
            <div className="flex flex-col justify-center space-y-6">
              <h1 className="section-title text-[56px] leading-[0.9] md:text-[90px]">
                Movies
                <br />
                recommendations
                <br />
                based on your
                <br />
                taste
              </h1>

              <p className="max-w-xl text-base text-slate-200">
                Trouve ton prochain film prefere en quelques notes. Le systeme hybride combine tes gouts et la similarite des films.
              </p>
            </div>

            <div className="flex items-center">
              <div className="w-full rounded-3xl border border-white/15 bg-black/58 p-6 backdrop-blur-sm md:p-7">
                <h2 className="text-4xl font-bold">Start here</h2>
                <p className="mt-2 text-base text-slate-300">
                  Clique sur Calculate your taste pour demarrer.
                </p>

                {!showSignup && (
                  <>
                    <button
                      onClick={() => setShowSignup(true)}
                      className="mt-5 w-full rounded-xl bg-brand-primary px-5 py-3 text-sm font-bold text-black transition hover:bg-brand-accent"
                    >
                      Calculate your taste
                    </button>

                    <div className="mt-4 rounded-xl border border-white/12 bg-black/35 p-4 text-sm text-slate-300">
                      Tu peux aussi visiter <Link to="/browse" className="font-semibold text-brand-accent">Browse All</Link> sans inscription.
                    </div>
                  </>
                )}

                {showSignup && (
                  <form onSubmit={onSignup} className="mt-5 space-y-3">
                    <input
                      name="email"
                      type="email"
                      placeholder="Email"
                      value={form.email}
                      onChange={onChange}
                      required
                      className="w-full rounded-xl border border-white/10 bg-black/35 px-4 py-3 outline-none focus:border-brand-primary"
                    />
                    <input
                      name="username"
                      type="text"
                      placeholder="Username"
                      value={form.username}
                      onChange={onChange}
                      required
                      className="w-full rounded-xl border border-white/10 bg-black/35 px-4 py-3 outline-none focus:border-brand-primary"
                    />
                    <input
                      name="password"
                      type="password"
                      placeholder="Password"
                      value={form.password}
                      onChange={onChange}
                      required
                      className="w-full rounded-xl border border-white/10 bg-black/35 px-4 py-3 outline-none focus:border-brand-primary"
                    />

                    {error && <p className="rounded-lg bg-red-500/15 px-3 py-2 text-sm text-red-200">{error}</p>}

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full rounded-xl bg-brand-primary px-4 py-3 font-semibold text-black hover:bg-brand-accent disabled:opacity-60"
                    >
                      {loading ? 'Creation...' : 'Create account'}
                    </button>

                    <p className="text-sm text-slate-300">
                      Deja inscrit ? <Link to="/login" className="text-brand-accent">Se connecter</Link>
                    </p>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
