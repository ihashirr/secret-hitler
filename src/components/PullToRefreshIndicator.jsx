import { ArrowDown, LoaderCircle } from 'lucide-react';

export default function PullToRefreshIndicator({
  isRefreshing,
  isThresholdReached,
  pullDistance,
  threshold,
}) {
  if (!isRefreshing && pullDistance <= 0) return null;

  const progress = Math.min(1, pullDistance / threshold);
  const translateY = Math.round(-42 + progress * 42);
  const scale = 0.92 + progress * 0.08;
  const label = isRefreshing ? 'Refreshing' : isThresholdReached ? 'Release' : 'Refresh';

  return (
    <div className="pointer-events-none fixed inset-x-0 top-[calc(var(--app-safe-top)+8px)] z-[190] flex justify-center px-4">
      <div
        className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-[rgba(7,10,13,0.9)] px-4 py-2 text-[10px] font-mono font-black uppercase tracking-[0.2em] text-cyan-100 shadow-[0_18px_40px_rgba(0,0,0,0.38)] backdrop-blur-xl transition-transform duration-150"
        style={{ transform: `translateY(${translateY}px) scale(${scale})` }}
      >
        {isRefreshing ? (
          <LoaderCircle size={14} className="animate-spin" />
        ) : (
          <ArrowDown
            size={14}
            style={{ transform: `rotate(${progress * 180}deg)` }}
          />
        )}
        <span>{label}</span>
      </div>
    </div>
  );
}
