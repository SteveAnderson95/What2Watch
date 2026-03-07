import { Component } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Footer from './components/Footer';
import Navbar from './components/Navbar';
import Browse from './pages/Browse';
import Home from './pages/Home';
import Landing from './pages/Landing';
import Login from './pages/Login';
import MovieDetail from './pages/MovieDetail';
import Onboarding from './pages/Onboarding';
import Profile from './pages/Profile';
import Register from './pages/Register';
import { clearAuth, getStoredUser, getToken } from './services/api';
import { clearTmdbCache } from './services/tmdb';

function hasValidSession() {
  const token = getToken();
  if (!token) {
    return false;
  }

  const user = getStoredUser();
  if (!user) {
    // Token sans profil local: on nettoie pour eviter les redirections cassées
    clearAuth();
    return false;
  }

  return true;
}

function RequireAuth({ children }) {
  if (!hasValidSession()) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function PublicOnly({ children }) {
  if (hasValidSession()) {
    return <Navigate to="/home" replace />;
  }
  return children;
}

function RootPage() {
  if (hasValidSession()) {
    return <Navigate to="/home" replace />;
  }
  return <Landing />;
}

class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    // Log minimal pour debug en prod (console navigateur).
    // Cela évite l'écran noir silencieux.
    // eslint-disable-next-line no-console
    console.error('Erreur React non geree:', error);
  }

  handleReset = () => {
    clearAuth();
    clearTmdbCache();
    window.location.href = '/login';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-brand-bg px-4 py-10 text-white">
          <div className="mx-auto max-w-xl rounded-2xl card-surface p-6">
            <h1 className="section-title text-4xl text-brand-accent">Une erreur est survenue</h1>
            <p className="mt-3 text-sm text-slate-300">
              L'application a rencontre un probleme inattendu. Tu peux relancer la session.
            </p>
            <button
              onClick={this.handleReset}
              className="mt-5 rounded-xl bg-brand-primary px-4 py-2 font-semibold text-black hover:bg-brand-accent"
            >
              Revenir a la connexion
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function AppLayout() {
  const location = useLocation();
  const isLanding = location.pathname === '/';
  const hideNavbar =
    location.pathname === '/login' ||
    location.pathname === '/register' ||
    isLanding ||
    location.pathname === '/browse';
  const hideFooter =
    location.pathname === '/login' ||
    location.pathname === '/register' ||
    isLanding ||
    location.pathname === '/browse';

  const mainClass = isLanding
    ? 'h-screen overflow-hidden'
    : 'mx-auto max-w-7xl px-4 pb-14 pt-6 md:px-8';

  return (
    <div className="min-h-screen bg-brand-bg text-white">
      {!hideNavbar && <Navbar />}
      <main className={mainClass}>
        <Routes>
          <Route path="/" element={<RootPage />} />
          <Route path="/browse" element={<Browse />} />
          <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
          <Route path="/register" element={<PublicOnly><Register /></PublicOnly>} />
          <Route path="/onboarding" element={<RequireAuth><Onboarding /></RequireAuth>} />
          <Route path="/home" element={<RequireAuth><Home /></RequireAuth>} />
          <Route path="/movies/:movieId" element={<RequireAuth><MovieDetail /></RequireAuth>} />
          <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {!hideFooter && <Footer />}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppErrorBoundary>
        <AppLayout />
      </AppErrorBoundary>
    </BrowserRouter>
  );
}
