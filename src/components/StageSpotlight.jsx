import { AnimatePresence, motion, useDragControls } from 'framer-motion';
import { Lock, Unlock, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import FactionAccentText from './FactionAccentText';
import { triggerHaptic } from '../lib/haptics';

const DEFAULT_AUTO_CLOSE_MS = 10000;
const DISMISS_DRAG_OFFSET = 120;
const DISMISS_DRAG_VELOCITY = 720;

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
  autoCloseMs = DEFAULT_AUTO_CLOSE_MS,
  onDismiss,
}) {
  const effectiveAutoCloseMs = Math.max(DEFAULT_AUTO_CLOSE_MS, autoCloseMs);
  const [isVisible, setIsVisible] = useState(true);
  const [isHolding, setIsHolding] = useState(false);
  const [remainingMs, setRemainingMs] = useState(effectiveAutoCloseMs);
  const remainingRef = useRef(effectiveAutoCloseMs);
  const isHoldingRef = useRef(false);
  const pressStartedAtRef = useRef(0);
  const dragControls = useDragControls();

  const toneTheme = TONE_MAP[tone] || TONE_MAP.neutral;

  useEffect(() => {
    if (!isVisible) return undefined;

    let lastTick = window.Date.now();
    const timer = window.setInterval(() => {
      const now = window.Date.now();
      const elapsed = now - lastTick;
      lastTick = now;

      if (isHoldingRef.current) {
        return;
      }

      const nextRemaining = Math.max(0, remainingRef.current - elapsed);

      remainingRef.current = nextRemaining;
      setRemainingMs(nextRemaining);

      if (nextRemaining <= 0) {
        window.clearInterval(timer);
        isHoldingRef.current = false;
        setIsHolding(false);
        setIsVisible(false);
      }
    }, 40);

    return () => {
      window.clearInterval(timer);
    };
  }, [isVisible]);

  const progressPercent = Math.max(0, Math.min(100, (remainingMs / Math.max(1, effectiveAutoCloseMs)) * 100));
  const modeLabel = visibility === 'private' ? 'Private' : 'Public';
  const autoCloseLabel = `${(effectiveAutoCloseMs / 1000).toFixed(effectiveAutoCloseMs % 1000 === 0 ? 0 : 1)}s`;
  const closeSpotlight = () => {
    isHoldingRef.current = false;
    setIsHolding(false);
    setIsVisible(false);
  };
  const resetTimer = () => {
    remainingRef.current = effectiveAutoCloseMs;
    setRemainingMs(effectiveAutoCloseMs);
  };
  const handleHoldStart = (event) => {
    event.preventDefault();
    event.stopPropagation();
    pressStartedAtRef.current = window.Date.now();

    if (!isHolding) {
      triggerHaptic('soft');
    }

    isHoldingRef.current = true;
    setIsHolding(true);
  };
  const handleHoldEnd = (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (isHolding) {
      triggerHaptic('light');
    }

    isHoldingRef.current = false;
    setIsHolding(false);
  };
  const handleSurfaceTap = (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (window.Date.now() - pressStartedAtRef.current > 250) {
      return;
    }

    triggerHaptic('light');
    resetTimer();
  };

  return (
    <AnimatePresence onExitComplete={onDismiss}>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[130] flex items-end justify-center p-2 pb-[calc(var(--app-safe-bottom)+8px)] sm:p-3 sm:pb-[calc(var(--app-safe-bottom)+12px)]"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[rgba(3,4,6,0.76)] backdrop-blur-[18px]"
          />

          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0, scale: isHolding ? 1.01 : 1 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', stiffness: 220, damping: 24 }}
            drag="y"
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.18 }}
            dragMomentum={false}
            onDragEnd={(_, info) => {
              if (info.offset.y > DISMISS_DRAG_OFFSET || info.velocity.y > DISMISS_DRAG_VELOCITY) {
                closeSpotlight();
              }
            }}
            onContextMenu={(event) => event.preventDefault()}
            className={`relative flex min-h-0 w-full min-w-0 max-h-[calc(var(--app-vh)-var(--app-header-offset)-12px)] max-w-2xl select-none flex-col overflow-hidden rounded-[30px] border bg-[linear-gradient(180deg,rgba(8,10,14,0.96)_0%,rgba(8,10,12,0.92)_100%)] shadow-[0_40px_120px_rgba(0,0,0,0.62)] ${isHolding ? 'border-white/22' : 'border-white/10'} sm:rounded-[34px]`}
            style={{
              boxShadow: isHolding
                ? `0 44px 130px rgba(0,0,0,0.68), 0 0 110px ${toneTheme.glow}`
                : `0 40px 120px rgba(0,0,0,0.62), 0 0 70px ${toneTheme.glow}`,
              userSelect: 'none',
              WebkitTouchCallout: 'none',
              WebkitUserSelect: 'none',
            }}
          >
            <div className="relative z-40 flex shrink-0 items-center justify-center px-5 pt-3 sm:px-7 sm:pt-4">
              <button
                type="button"
                onPointerDown={(event) => {
                  event.stopPropagation();
                  dragControls.start(event);
                }}
                className="flex h-8 w-full max-w-[120px] items-center justify-center rounded-full"
                aria-label="Swipe down to close spotlight"
                style={{ touchAction: 'none' }}
              >
                <span className="h-1.5 w-14 rounded-full bg-white/18" />
              </button>
            </div>

            <button
              type="button"
              data-spotlight-close="true"
              onClick={(event) => {
                event.stopPropagation();
                closeSpotlight();
              }}
              className="pointer-events-auto absolute right-4 top-3 z-40 flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-white/72 transition-colors hover:bg-white/[0.08] sm:right-6 sm:top-4"
              aria-label="Close stage spotlight"
            >
              <X size={18} />
            </button>

            <div
              aria-hidden="true"
              onTouchStart={handleHoldStart}
              onTouchEnd={handleHoldEnd}
              onTouchCancel={handleHoldEnd}
              onPointerDown={handleHoldStart}
              onPointerUp={handleHoldEnd}
              onPointerLeave={handleHoldEnd}
              onPointerCancel={handleHoldEnd}
              onMouseDown={handleHoldStart}
              onMouseUp={handleHoldEnd}
              onMouseLeave={handleHoldEnd}
              onClick={handleSurfaceTap}
              onContextMenu={(event) => event.preventDefault()}
              className="absolute inset-x-0 bottom-0 top-12 z-30 sm:top-14"
              style={{
                touchAction: 'none',
                userSelect: 'none',
                WebkitTouchCallout: 'none',
                WebkitUserSelect: 'none',
              }}
            />
            <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${toneTheme.accentBar}`} />
            <div className="absolute inset-0 paper-grain pointer-events-none opacity-[0.08]" />
            {isHolding && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-20 bg-white/[0.03] pointer-events-none"
              />
            )}

            <div className="pointer-events-none relative z-10 flex min-h-0 flex-1 flex-col overflow-hidden px-4 pb-5 pt-3 sm:px-7 sm:pb-7 sm:pt-4">
              <div className="flex shrink-0 flex-wrap items-center gap-2 text-[10px] font-mono font-black uppercase tracking-[0.22em]">
                <span className={`rounded-full border px-3 py-1 ${toneTheme.badge}`}>
                  <FactionAccentText>
                    {timelineLabel ? `${timelineLabel} · ${stageLabel}` : stageLabel}
                  </FactionAccentText>
                </span>
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-white/70">
                  {modeLabel}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-white/58">
                  {visibility === 'private' ? <Lock size={12} /> : <Unlock size={12} />}
                  {audienceLabel}
                </span>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto pt-6 scrollbar-hide sm:pt-8">
                <div className="mx-auto max-w-xl text-center">
                  <p className="text-[11px] font-mono font-black uppercase tracking-[0.42em] text-white/42">
                    Current Stage
                  </p>
                  <FactionAccentText
                    as="h2"
                    className="mt-4 break-words text-3xl font-black uppercase tracking-[0.14em] text-white sm:text-5xl sm:tracking-[0.16em]"
                  >
                    {title}
                  </FactionAccentText>
                  {description && (
                    <FactionAccentText
                      as="p"
                      className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-white/68 sm:text-base"
                    >
                      {description}
                    </FactionAccentText>
                  )}

                  {actionLabels.length > 0 && (
                    <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                      {actionLabels.map((actionLabel, index) => (
                        <span
                          key={`${actionLabel}-${index}`}
                          className={`rounded-full border px-3 py-1.5 text-[10px] font-mono font-black uppercase tracking-[0.18em] ${toneTheme.chip}`}
                        >
                          <FactionAccentText>{actionLabel}</FactionAccentText>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-8 sm:mt-10">
                  <div className="flex flex-col gap-1 text-[10px] font-mono font-black uppercase tracking-[0.18em] text-white/48 min-[360px]:flex-row min-[360px]:items-center min-[360px]:justify-between">
                    <span>{isHolding ? 'Holding spotlight' : `Auto closing in ${autoCloseLabel}`}</span>
                    <span>{isHolding ? 'Release to resume' : 'Tap to reset • hold to pause'}</span>
                  </div>
                  <div className={`relative mt-2 h-2.5 overflow-hidden rounded-full ${isHolding ? 'bg-white/[0.12]' : 'bg-white/[0.06]'}`}>
                    <motion.div
                      animate={isHolding ? { width: '100%', opacity: [0.45, 0.9, 0.45] } : { width: `${progressPercent}%`, opacity: 1 }}
                      transition={isHolding ? { duration: 1.05, repeat: Infinity, ease: 'easeInOut' } : { ease: 'linear', duration: 0.08 }}
                      className={`h-full rounded-full bg-gradient-to-r ${toneTheme.accentBar}`}
                    />
                    {isHolding && (
                      <motion.div
                        animate={{ opacity: [0.18, 0.42, 0.18] }}
                        transition={{ duration: 0.95, repeat: Infinity, ease: 'easeInOut' }}
                        className="absolute inset-0 bg-[repeating-linear-gradient(90deg,rgba(255,255,255,0.18)_0_10px,transparent_10px_20px)]"
                      />
                    )}
                  </div>
                  <div className={`mt-4 rounded-[24px] border px-4 py-4 text-left transition-all ${
                    isHolding
                      ? 'border-white/20 bg-white/[0.1] shadow-[0_0_0_1px_rgba(255,255,255,0.08)]'
                      : 'border-white/10 bg-white/[0.04]'
                  }`}>
                    <div className="flex flex-col gap-3 min-[360px]:flex-row min-[360px]:items-center min-[360px]:justify-between">
                      <div className="min-w-0">
                        <div className="text-[11px] font-mono font-black uppercase tracking-[0.18em] text-white">
                          {isHolding ? 'Pinned While Pressed' : 'Whole Card Hold Surface'}
                        </div>
                        <p className="mt-1 text-xs leading-relaxed text-white/58">
                          {isHolding
                            ? 'The transparent overlay is keeping the spotlight pinned until you release.'
                            : 'You can press and hold anywhere on this card. The overlay blocks text selection and long-press highlighting.'}
                        </p>
                      </div>

                      <span
                        className={`self-start rounded-full border px-3 py-1 text-[10px] font-mono font-black uppercase tracking-[0.18em] min-[360px]:shrink-0 ${
                          isHolding
                            ? 'border-white/18 bg-white/[0.12] text-white'
                            : 'border-white/10 bg-white/[0.04] text-white/70'
                        }`}
                      >
                        {isHolding ? 'Pinned' : 'Hold'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
