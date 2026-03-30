import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import FactionAccentText from '../../components/FactionAccentText';
import {
  TRACK_DETAIL_DISMISS_DRAG_OFFSET,
  TRACK_DETAIL_DISMISS_DRAG_VELOCITY,
} from './boardConfig';

const SHEET_ENTER_Y = 64;
const SHEET_EXIT_Y = 84;
const SHEET_MOTION_EASE = [0.22, 1, 0.36, 1];

export default function TrackDetailSheet({
  dragControls,
  insight,
  isOpen,
  onClose,
}) {
  if (!isOpen || !insight) {
    return null;
  }

  const impactLabel =
    insight.type === 'FASCIST'
      ? 'If a Fascist policy lands here'
      : 'If a Liberal policy lands here';

  return (
    <AnimatePresence>
      <motion.div
        key={`${insight.type}-${insight.slotNumber}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-145 flex items-end justify-center p-1.5 pb-[calc(var(--app-safe-bottom)+6px)] sm:p-3 sm:pb-[calc(var(--app-safe-bottom)+12px)]"
      >
        <motion.button
          type="button"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-[rgba(3,4,6,0.72)] backdrop-blur-lg"
        />

        <motion.div
          initial={{ opacity: 0, y: SHEET_ENTER_Y }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: SHEET_EXIT_Y }}
          transition={{ type: 'tween', duration: 0.26, ease: SHEET_MOTION_EASE }}
          drag="y"
          dragControls={dragControls}
          dragListener={false}
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={{ top: 0, bottom: 0.18 }}
          dragMomentum={false}
          onDragEnd={(_, info) => {
            if (info.offset.y > TRACK_DETAIL_DISMISS_DRAG_OFFSET || info.velocity.y > TRACK_DETAIL_DISMISS_DRAG_VELOCITY) {
              onClose();
            }
          }}
          className="relative z-146 flex min-h-0 w-full min-w-0 max-h-[calc(var(--app-vh)-var(--app-header-offset)-var(--app-safe-bottom)-8px)] max-w-2xl transform-gpu will-change-transform flex-col overflow-hidden rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(10,11,13,0.96)_0%,rgba(7,8,10,0.96)_100%)] shadow-[0_32px_90px_rgba(0,0,0,0.65)]"
        >
          <div className="flex items-center justify-center px-4 pt-2.5 sm:px-6 sm:pt-4">
            <button
              type="button"
              onPointerDown={(event) => {
                event.stopPropagation();
                dragControls.start(event);
              }}
              className="flex h-8 w-full max-w-30 items-center justify-center rounded-full"
              aria-label="Swipe down to close track detail"
              style={{ touchAction: 'none' }}
            >
              <span className="h-1.5 w-14 rounded-full bg-white/16" />
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-2.5 z-10 flex h-9 w-9 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/75 transition-colors hover:bg-white/10 sm:right-5 sm:top-4 sm:h-10 sm:w-10"
            aria-label="Close track detail"
          >
            <X size={18} />
          </button>

          <div className="pointer-events-none absolute inset-0 paper-grain opacity-10" />

          <div className="app-scroll-y min-h-0 flex-1 px-3.5 pb-4 pt-2.5 sm:px-5 sm:pb-6 sm:pt-3">
            <div className={`pointer-events-none absolute inset-x-0 top-0 h-1 bg-linear-to-r ${
              insight.type === 'FASCIST'
                ? 'from-red-400/85 via-red-500/75 to-red-700/85'
                : 'from-cyan-300/85 via-cyan-400/72 to-blue-500/82'
            }`} />

            <div className="flex flex-wrap items-center gap-2 text-[9px] font-mono font-black uppercase tracking-[0.18em]">
              <span className={`rounded-full border px-3 py-1 ${insight.accentSurfaceClassName} ${insight.accentClassName}`}>
                {insight.trackLabel}
              </span>
              <span className="rounded-full border border-white/10 bg-white/4 px-3 py-1 text-white/70">
                Slot {insight.slotNumber}
              </span>
            </div>

            <div className="mt-3 grid min-w-0 gap-3 sm:mt-4 sm:gap-4 min-[560px]:grid-cols-[120px,minmax(0,1fr)]">
              <div className="flex items-center justify-center">
                <div className={`relative flex h-[clamp(7.4rem,23vh,8.875rem)] w-[clamp(5.7rem,18vw,6.75rem)] items-center justify-center overflow-hidden rounded-[26px] border ${insight.accentSurfaceClassName}`}>
                  <motion.div
                    animate={
                      insight.isNext || insight.isResolvingNow
                        ? { y: [6, -2, 6], rotate: [-4, 2, -4], scale: [0.98, 1.03, 0.98] }
                        : { y: [2, -2, 2], rotate: [-2, 2, -2] }
                    }
                    transition={{ duration: insight.isNext || insight.isResolvingNow ? 2.2 : 3.8, repeat: Infinity, ease: 'easeInOut' }}
                    className="relative z-10"
                  >
                    <img
                      src={insight.cardSrc}
                      alt={`${insight.cardLabel} reference`}
                      loading="eager"
                      decoding="async"
                      className="h-[clamp(6.3rem,20vh,7.5rem)] w-[clamp(4.25rem,13.5vw,5.125rem)] rounded-[15px] object-cover shadow-[0_20px_34px_rgba(0,0,0,0.32)]"
                    />
                  </motion.div>

                  <motion.div
                    animate={
                      insight.type === 'FASCIST'
                        ? { opacity: [0.12, 0.22, 0.12], scale: [0.94, 1.02, 0.94] }
                        : { opacity: [0.1, 0.2, 0.1], scale: [0.94, 1.03, 0.94] }
                    }
                    transition={{ duration: 2.1, repeat: Infinity, ease: 'easeInOut' }}
                    className={`absolute inset-3 rounded-[22px] ${insight.type === 'FASCIST' ? 'bg-red-400/18' : 'bg-cyan-300/16'}`}
                  />

                  <div className="absolute bottom-2 left-1/2 z-20 -translate-x-1/2 rounded-full border border-white/10 bg-black/28 px-2 py-1 text-[8px] font-mono font-black uppercase tracking-[0.18em] text-white/78">
                    Slot {insight.slotNumber}
                  </div>
                </div>
              </div>

              <div className="min-w-0">
                <p className="text-[clamp(0.5rem,2.2vw,0.625rem)] font-mono font-black uppercase tracking-[0.18em] text-white/42 sm:tracking-[0.2em]">
                  {impactLabel}
                </p>
                <FactionAccentText
                  as="h3"
                  className="mt-2 text-[clamp(1rem,4.8vw,1.25rem)] font-black uppercase tracking-widest text-white sm:tracking-[0.12em]"
                >
                  {insight.outcomeLabel}
                </FactionAccentText>
                <FactionAccentText as="p" className="mt-2 text-[clamp(0.75rem,3.2vw,0.9rem)] leading-relaxed text-white/68">
                  {insight.outcomeDescription}
                </FactionAccentText>
                <p className={`mt-3 inline-flex rounded-full border px-2.5 py-1 text-[clamp(0.45rem,2vw,0.563rem)] font-mono font-black uppercase tracking-[0.14em] sm:mt-4 sm:px-3 sm:text-[9px] sm:tracking-[0.18em] ${insight.accentSoftClassName} ${insight.accentClassName}`}>
                  Policy consequence only
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
