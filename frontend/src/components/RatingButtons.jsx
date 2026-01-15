import { Frown, Meh, Smile, Sparkles } from 'lucide-react';

const OPTIONS = [
  { label: 'Awful', value: 1.0, color: 'bg-red-500/90 hover:bg-red-400', icon: Frown },
  { label: 'Meh', value: 2.5, color: 'bg-slate-500/90 hover:bg-slate-400', icon: Meh },
  { label: 'Good', value: 4.0, color: 'bg-emerald-500/90 hover:bg-emerald-400', icon: Smile },
  { label: 'Amazing', value: 5.0, color: 'bg-brand-primary hover:bg-brand-accent text-black', icon: Sparkles },
];

export default function RatingButtons({ onRate, onSkip, disabled = false }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {OPTIONS.map((option) => {
          const Icon = option.icon;
          return (
            <button
              key={option.label}
              type="button"
              disabled={disabled}
              onClick={() => onRate(option.value)}
              className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${option.color} ${disabled ? 'opacity-50' : ''}`}
            >
              <span className="flex items-center justify-center gap-2"><Icon size={16} /> {option.label}</span>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={onSkip}
        disabled={disabled}
        className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/10"
      >
        Haven't Seen
      </button>
    </div>
  );
}
