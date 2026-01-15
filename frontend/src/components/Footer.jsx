import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-white/10 bg-black/20">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 text-sm text-slate-400 md:flex-row md:items-center md:justify-between md:px-8">
        <p>© {new Date().getFullYear()} What2Watch. All rights reserved.</p>
        <div className="flex items-center gap-2 text-slate-300">
          <span className="font-semibold">Steve</span>
          <span className="h-1.5 w-1.5 rounded-full bg-brand-primary/90" />
          <span className="font-semibold">Mapalo</span>
          <span className="h-1.5 w-1.5 rounded-full bg-brand-primary/90" />
          <span className="font-semibold">Imane</span>
        </div>
        <div className="flex flex-wrap gap-4">
          <Link to="/browse" className="hover:text-white">Browse All</Link>
          <span className="hover:text-white">About</span>
          <span className="hover:text-white">FAQ</span>
          <span className="hover:text-white">Privacy</span>
          <span className="hover:text-white">Terms</span>
        </div>
      </div>
    </footer>
  );
}
