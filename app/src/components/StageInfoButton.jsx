import { Info } from 'lucide-react';

export default function StageInfoButton({ onClick, floating = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/80 transition-colors hover:bg-white/10 ${
        floating
          ? 'fixed right-4 top-[calc(env(safe-area-inset-top)+16px)] z-[125] backdrop-blur-xl'
          : ''
      }`}
      aria-label="Open stage information"
    >
      <Info size={18} />
    </button>
  );
}
