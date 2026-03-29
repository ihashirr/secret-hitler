import { AnimatePresence, motion } from 'framer-motion';
import { Lock, Unlock, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const AUTO_CLOSE_MS = 3000;

const TONE_MAP = {
  red: {
    accentBar: 'from-red-400 via-red-500 to-red-700',
    badge: 'border-red-300/20 bg-red-500/10 text-red-100',
    chip: 'border-red-300/16 bg-red-500/10 text-red-100/85',
    glow: 'rgba(239,68,68,0.32)',
  },
  blue: {
    accentBar: 'from-cyan-300 via-cyan-400 to-blue-500',
    badge: 'border-cyan-300/18 bg-cyan-400/10 text-cyan-100',
    chip: 'border-cyan-300/16 bg-cyan-400/10 text-cyan-100/85',
    glow: 'rgba(34,211,238,0.28)',
  },
  neutral: {
    accentBar: 'from-[#d4c098] via-[#efe1c4] to-[#b09868]',
    badge: 'border-[#d4c098]/18 bg-[#d4c098]/10 text-[#efe1c4]',
    chip: 'border-white/10 bg-white/[0.04] text-white/78',
    glow: 'rgba(212,192,152,0.2)',
  },
};

export default function StageSpotlight({
  stageLabel,
  timelineLabel,
  title,
  description,
  audienceLabel,
  visibility = 'public',
  actionLabels = [],
  tone = 'neutral',
}) {
  const [isVisible, setIsVisible] = useState(true);
  const [isHolding, setIsHolding] = useState(false);
  const [remainingMs, setRemainingMs] = useState(AUTO_CLOSE_MS);
  const remainingRef = useRef(AUTO_CLOSE_MS);

  const toneTheme = TONE_MAP[tone] || TONE_MAP.neutral;

  useEffect(() => {
    if (!isVisible || isHolding) return undefined;

    const startedAt = window.Date.now();
    const startingRemaining = remainingRef.current;
    const timer = window.setInterval(() => {
      const elapsed = window.Date.now() - startedAt;
      const nextRemaining = Math.max(0, startingRemaining - elapsed);

      remainingRef.current = nextRemaining;
      setRemainingMs(nextRemaining);

      if (nextRemaining <= 0) {
        window.clearInterval(timer);
        setIsVisible(false);
      }
    }, 40);

    return () => {
      window.clearInterval(timer);
    };
  }, [isVisible, isHolding]);

  const progressPercent = Math.max(0, Math.min(100, (remainingMs / AUTO_CLOSE_MS) * 100));
  const modeLabel = visibility === 'private' ? 'Private Briefing' : 'Table Briefing';

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[130] flex items-center justify-center p-4 sm:p-6"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[rgba(3,4,6,0.76)] backdrop-blur-[18px]"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 16 }}
            transition={{ type: 'spring', stiffness: 220, damping: 24 }}
            onPointerDown={() => {
              setIsHolding(true);
            }}
            onPointerUp={() => {
              setIsHolding(false);
            }}
            onPointerLeave={() => {
              setIsHolding(false);
            }}
            onPointerCancel={() => {
              setIsHolding(false);
            }}
            className="relative w-full max-w-2xl overflow-hidden rounded-[34px] border border-white/10 bg-[linear-gradient(180deg,rgba(8,10,14,0.96)_0%,rgba(8,10,12,0.92)_100%)] shadow-[0_40px_120px_rgba(0,0,0,0.62)]"
            style={{ boxShadow: `0 40px 120px rgba(0,0,0,0.62), 0 0 70px ${toneTheme.glow}` }}
          >
            <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${toneTheme.accentBar}`} />
            <div className="absolute inset-0 paper-grain opacity-[0.08] pointer-events-none" />

            <div className="relative z-10 px-5 pb-5 pt-4 sm:px-7 sm:pb-7 sm:pt-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono font-black uppercase tracking-[0.22em]">
                  <span className={`rounded-full border px-3 py-1 ${toneTheme.badge}`}>
                    {timelineLabel ? `${timelineLabel} · ${stageLabel}` : stageLabel}
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-white/70">
                    {modeLabel}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-white/58">
                    {visibility === 'private' ? <Lock size={12} /> : <Unlock size={12} />}
                    {audienceLabel}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    remainingRef.current = AUTO_CLOSE_MS;
                    setRemainingMs(AUTO_CLOSE_MS);
                    setIsHolding(false);
                    setIsVisible(false);
                  }}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-white/72 transition-colors hover:bg-white/[0.08]"
                  aria-label="Close stage spotlight"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="mx-auto mt-8 max-w-xl text-center sm:mt-10">
                <p className="text-[11px] font-mono font-black uppercase tracking-[0.42em] text-white/42">
                  Current Stage
                </p>
                <h2 className="mt-4 text-3xl font-black uppercase tracking-[0.14em] text-white sm:text-5xl sm:tracking-[0.16em]">
                  {title}
                </h2>
                {description && (
                  <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-white/68 sm:text-base">
                    {description}
                  </p>
                )}

                {actionLabels.length > 0 && (
                  <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                    {actionLabels.map((actionLabel) => (
                      <span
                        key={actionLabel}
                        className={`rounded-full border px-3 py-1.5 text-[10px] font-mono font-black uppercase tracking-[0.18em] ${toneTheme.chip}`}
                      >
                        {actionLabel}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-8 sm:mt-10">
                <div className="flex items-center justify-between gap-3 text-[10px] font-mono font-black uppercase tracking-[0.18em] text-white/48">
                  <span>{isHolding ? 'Holding spotlight' : 'Auto closing in 3s'}</span>
                  <span>{isHolding ? 'Release to resume' : 'Press and hold to keep open'}</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/[0.06]">
                  <motion.div
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ ease: 'linear', duration: 0.08 }}
                    className={`h-full rounded-full bg-gradient-to-r ${toneTheme.accentBar}`}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
