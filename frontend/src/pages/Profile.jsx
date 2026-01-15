import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MovieCard from '../components/MovieCard';
import { clearAuth, deleteMe, getMe, getMovie, getRatings } from '../services/api';

export default function Profile() {
  const navigate = useNavigate();
  const [me, setMe] = useState(null);
  const [ratings, setRatings] = useState([]);
  const [ratedMovies, setRatedMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    async function loadProfile() {
      try {
        const [meData, ratingsData] = await Promise.all([getMe(), getRatings()]);
        setMe(meData);
        setRatings(ratingsData);

        // On transforme les ratings en cartes films (comme la page reco)
        const topRatings = ratingsData.slice(0, 20);
        const movieCards = await Promise.all(
          topRatings.map(async (item) => {
            try {
              const movie = await getMovie(item.movie_id);
              return {
                ...movie,
                userRating: item.rating,
                ratedAt: item.created_at,
              };
            } catch {
              return null;
            }
          })
        );

        setRatedMovies(movieCards.filter(Boolean));
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  if (loading) {
    return <div className="rounded-2xl card-surface p-8">Chargement du profil...</div>;
  }

  async function handleDeleteAccount() {
    const ok = window.confirm('Supprimer votre compte ? Cette action est definitive.');
    if (!ok) {
      return;
    }

    setDeleteError('');
    setDeleting(true);
    try {
      await deleteMe();
      clearAuth();
      navigate('/');
    } catch (err) {
      setDeleteError(err?.response?.data?.detail || 'Suppression impossible');
      setDeleting(false);
    }
  }

  return (
    <section className="space-y-6">
      <div className="rounded-2xl card-surface p-6">
        <h1 className="section-title text-4xl text-brand-accent">Profile</h1>
        <p className="mt-2 text-sm text-slate-300">Email: {me?.email}</p>
        <p className="text-sm text-slate-300">Username: {me?.username}</p>
        <p className="mt-2 text-sm text-slate-400">Films notes: {ratings.length}</p>
        {deleteError && <p className="mt-3 text-sm text-red-300">{deleteError}</p>}
        <button
          onClick={handleDeleteAccount}
          disabled={deleting}
          className="mt-4 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-200 hover:bg-red-500/20 disabled:opacity-60"
        >
          {deleting ? 'Suppression...' : 'Supprimer mon compte'}
        </button>
      </div>

      <div className="rounded-2xl card-surface p-6">
        <h2 className="section-title text-3xl text-brand-accent">Mes ratings</h2>
        {ratedMovies.length === 0 && <p className="mt-4 text-sm text-slate-400">Aucune note pour le moment.</p>}

        <div className="grid-fade mt-4 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          {ratedMovies.map((movie) => (
            <MovieCard key={movie.movie_id} movie={movie} />
          ))}
        </div>
      </div>
    </section>
  );
}
