import { Info } from 'lucide-react';

export default function StageInfoButton({
  onClick,
  floating = false,
  active = false,
  label = 'Guide',
}) {
  const baseClassName = floating
    ? `fixed right-4 top-[calc(var(--app-safe-top)+14px)] z-[125] h-11 rounded-full px-4 shadow-[0_18px_36px_rgba(0,0,0,0.32)] backdrop-blur-xl ${
        active
          ? 'border-cyan-300/35 bg-cyan-400/12 text-cyan-100'
          : 'border-white/10 bg-[rgba(8,10,12,0.78)] text-white/82 hover:bg-[rgba(12,14,18,0.92)]'
      }`
    : `h-10 rounded-2xl px-3 ${
        active
          ? 'border-cyan-300/28 bg-cyan-400/10 text-cyan-100'
          : 'border-white/10 bg-white/5 text-white/80 hover:bg-white/10'
      }`;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 border transition-all ${baseClassName}`}
      aria-label="Open stage information"
      aria-expanded={active}
      title={label}
    >
      <Info size={18} />

      {floating && (
        <span className="text-[11px] font-mono font-black uppercase tracking-[0.18em]">
          {label}
        </span>
      )}
    </button>
  );
}
