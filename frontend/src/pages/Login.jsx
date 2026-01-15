import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login, register } from '../services/api';

export default function Login() {
  const navigate = useNavigate();

  const [mode, setMode] = useState('login');
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [signupForm, setSignupForm] = useState({ email: '', username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function onLoginChange(event) {
    const { name, value } = event.target;
    setLoginForm((prev) => ({ ...prev, [name]: value }));
  }

  function onSignupChange(event) {
    const { name, value } = event.target;
    setSignupForm((prev) => ({ ...prev, [name]: value }));
  }

  async function onLoginSubmit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(loginForm);
      navigate('/home');
    } catch (err) {
      setError(err?.response?.data?.detail || 'Connexion impossible');
    } finally {
      setLoading(false);
    }
  }

  async function onSignupSubmit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register(signupForm);
      navigate('/onboarding');
    } catch (err) {
      setError(err?.response?.data?.detail || 'Inscription impossible');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mx-auto mt-10 max-w-md animate-fadeUp rounded-2xl card-surface p-8">
      <h1 className="section-title text-4xl text-brand-accent">{mode === 'login' ? 'Log In' : 'Sign Up'}</h1>
      <p className="mt-2 text-sm text-slate-300">
        {mode === 'login' ? 'Connecte-toi pour retrouver tes recommandations.' : 'Creer un compte puis lance l onboarding.'}
      </p>

      <div className="mt-5 grid grid-cols-2 gap-2 rounded-xl bg-black/20 p-1">
        <button
          onClick={() => setMode('login')}
          className={`rounded-lg px-3 py-2 text-sm ${mode === 'login' ? 'bg-brand-primary text-black font-semibold' : 'text-slate-300'}`}
        >
          Login
        </button>
        <button
          onClick={() => setMode('signup')}
          className={`rounded-lg px-3 py-2 text-sm ${mode === 'signup' ? 'bg-brand-primary text-black font-semibold' : 'text-slate-300'}`}
        >
          Sign Up
        </button>
      </div>

      {mode === 'login' ? (
        <form onSubmit={onLoginSubmit} className="mt-6 space-y-4">
          <input name="email" type="email" placeholder="Email" required value={loginForm.email} onChange={onLoginChange}
            className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 outline-none focus:border-brand-primary" />
          <input name="password" type="password" placeholder="Password" required value={loginForm.password} onChange={onLoginChange}
            className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 outline-none focus:border-brand-primary" />

          {error && <p className="rounded-lg bg-red-500/15 px-3 py-2 text-sm text-red-200">{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full rounded-xl bg-brand-primary px-4 py-3 font-semibold text-black transition hover:bg-brand-accent disabled:opacity-60">
            {loading ? 'Connexion...' : 'Login'}
          </button>
        </form>
      ) : (
        <form onSubmit={onSignupSubmit} className="mt-6 space-y-4">
          <input name="email" type="email" placeholder="Email" required value={signupForm.email} onChange={onSignupChange}
            className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 outline-none focus:border-brand-primary" />
          <input name="username" type="text" placeholder="Username" required value={signupForm.username} onChange={onSignupChange}
            className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 outline-none focus:border-brand-primary" />
          <input name="password" type="password" placeholder="Password" required value={signupForm.password} onChange={onSignupChange}
            className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 outline-none focus:border-brand-primary" />

          {error && <p className="rounded-lg bg-red-500/15 px-3 py-2 text-sm text-red-200">{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full rounded-xl bg-brand-primary px-4 py-3 font-semibold text-black transition hover:bg-brand-accent disabled:opacity-60">
            {loading ? 'Creation...' : 'Create Account'}
          </button>
        </form>
      )}

      <p className="mt-5 text-sm text-slate-300">
        Retour a la landing ? <Link to="/" className="text-brand-accent">Home</Link>
      </p>
    </section>
  );
}
