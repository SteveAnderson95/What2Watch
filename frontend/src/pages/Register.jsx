import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { register } from '../services/api';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function onChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function onSubmit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);
    let didNavigate = false;

    try {
      await register(form);
      // Apres inscription, l'utilisateur va noter ses premiers films
      didNavigate = true;
      navigate('/onboarding', { replace: true });
    } catch (err) {
      setError(err?.response?.data?.detail || 'Inscription impossible');
    } finally {
      if (!didNavigate) {
        setLoading(false);
      }
    }
  }

  return (
    <section className="mx-auto mt-10 max-w-md animate-fadeUp rounded-2xl card-surface p-8">
      <h1 className="section-title text-4xl text-brand-accent">Create Account</h1>
      <p className="mt-2 text-sm text-slate-300">Demarre ton profil de recommandations.</p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <input name="email" type="email" placeholder="Email" required value={form.email} onChange={onChange}
          className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 outline-none focus:border-brand-primary" />
        <input name="username" type="text" placeholder="Username (3-20, alphanumerique)" required value={form.username} onChange={onChange}
          className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 outline-none focus:border-brand-primary" />
        <input name="password" type="password" placeholder="Password" required value={form.password} onChange={onChange}
          className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 outline-none focus:border-brand-primary" />

        {error && <p className="rounded-lg bg-red-500/15 px-3 py-2 text-sm text-red-200">{error}</p>}

        <button type="submit" disabled={loading}
          className="w-full rounded-xl bg-brand-primary px-4 py-3 font-semibold text-black transition hover:bg-brand-accent disabled:opacity-60">
          {loading ? 'Creation...' : 'Register'}
        </button>
      </form>

      <p className="mt-5 text-sm text-slate-300">
        Deja un compte ? <Link to="/login" className="text-brand-accent">Login</Link>
      </p>
    </section>
  );
}
