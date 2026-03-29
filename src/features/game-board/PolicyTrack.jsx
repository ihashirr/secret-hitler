import { motion } from 'framer-motion';
import { Shield, Skull } from 'lucide-react';
import FactionAccentText from '../../components/FactionAccentText';
import {
  POLICY_CARD_ASSETS,
  getProgressPercent,
  getTrackSlotMeta,
} from './boardConfig';

export default function PolicyTrack({
  current,
  isTrackDetailOpen,
  onInspect,
  selectedTrackFocus,
  type,
  max,
}) {
  const isFascist = type === 'FASCIST';
  const cardSrc = POLICY_CARD_ASSETS[type];
  const fillClass = isFascist
    ? 'border-red-400/35 bg-[linear-gradient(180deg,#c1272d_0%,#701118_100%)] text-red-50'
    : 'border-cyan-300/30 bg-[linear-gradient(180deg,#4b88c4_0%,#234a72_100%)] text-cyan-50';
  const inactiveClass = isFascist
    ? 'border-red-950 bg-[#15080a] text-red-200/18'
    : 'border-cyan-950 bg-[#0b141d] text-cyan-100/18';
  const accentTextClass = isFascist ? 'text-red-100/82' : 'text-cyan-100/82';
  const accentBarClass = isFascist ? 'from-red-400/85 via-red-500/75 to-red-700/85' : 'from-cyan-300/85 via-cyan-400/72 to-blue-500/82';
  const railGlowClass = isFascist ? 'bg-red-500/8' : 'bg-cyan-300/8';
  const progressGlowClass = isFascist ? 'bg-[linear-gradient(90deg,rgba(239,68,68,0.1)_0%,rgba(193,39,45,0.45)_100%)]' : 'bg-[linear-gradient(90deg,rgba(103,232,249,0.08)_0%,rgba(75,136,196,0.42)_100%)]';
  const Icon = isFascist ? Skull : Shield;
  const trackIsFocused = isTrackDetailOpen && selectedTrackFocus?.type === type;
  const trackProgressPercent = getProgressPercent(current, max);

  return (
    <motion.div
      layout
      className={`relative min-w-0 overflow-hidden rounded-[22px] border px-3 py-3 transition-colors sm:px-4 ${
        trackIsFocused
          ? isFascist
            ? 'border-red-400/22 bg-red-500/[0.06] shadow-[0_0_0_1px_rgba(248,113,113,0.1),0_18px_30px_rgba(0,0,0,0.18)]'
            : 'border-cyan-300/20 bg-cyan-300/[0.06] shadow-[0_0_0_1px_rgba(103,232,249,0.08),0_18px_30px_rgba(0,0,0,0.18)]'
          : 'border-white/6 bg-black/18'
      }`}
    >
      <div className={`pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${accentBarClass}`} />
      <div className="pointer-events-none absolute inset-0 paper-grain opacity-[0.06]" />

      <div className="flex items-center justify-between gap-3">
        <FactionAccentText
          as="p"
          className={`text-[8px] font-mono font-black uppercase tracking-[0.28em] ${accentTextClass}`}
        >
          {type === 'LIBERAL' ? 'Liberal Track' : 'Fascist Track'}
        </FactionAccentText>

        <div className="flex items-center gap-2">
          <Icon size={12} className={accentTextClass} />
          <span className={`text-[11px] font-mono font-black uppercase tracking-[0.18em] ${accentTextClass}`}>
            {current}/{max}
          </span>
        </div>
      </div>

      <div className="mt-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="relative inline-grid min-w-max gap-1.5 px-0.5 py-1" style={{ gridTemplateColumns: `repeat(${max}, minmax(44px, 1fr))` }}>
          <div className={`pointer-events-none absolute inset-x-2 top-1/2 h-[2px] -translate-y-1/2 rounded-full ${railGlowClass}`} />
          {current > 0 && (
            <motion.div
              initial={false}
              animate={{ width: trackProgressPercent }}
              transition={{ type: 'spring', stiffness: 170, damping: 26 }}
              className={`pointer-events-none absolute left-2 top-1/2 h-[2px] -translate-y-1/2 rounded-full ${progressGlowClass}`}
            />
          )}

          {Array.from({ length: max }).map((_, index) => {
            const isActive = index < current;
            const slotMeta = getTrackSlotMeta(type, index);
            const isNextSlot = current < max && index === current;
            const isCurrentEdge = current > 0 && index === current - 1;
            const isSelectedSlot = trackIsFocused && selectedTrackFocus.slotIndex === index;

            return (
              <motion.button
                key={index}
                type="button"
                onClick={() => onInspect(type, index)}
                whileTap={{ scale: 0.96 }}
                className={`relative min-h-[34px] min-w-[44px] overflow-hidden rounded-[14px] border px-1 py-1 transition-all duration-500 sm:min-h-[38px] sm:min-w-[48px] ${
                  isActive ? `${fillClass} shadow-[0_8px_18px_rgba(0,0,0,0.18)]` : inactiveClass
                } ${isSelectedSlot ? 'ring-2 ring-white/50 shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_12px_26px_rgba(0,0,0,0.28)]' : ''} ${
                  isNextSlot && !isActive
                    ? isFascist
                      ? 'border-red-300/42 shadow-[0_0_0_1px_rgba(248,113,113,0.12)]'
                      : 'border-cyan-200/38 shadow-[0_0_0_1px_rgba(103,232,249,0.1)]'
                    : ''
                }`}
              >
                {isNextSlot && !isActive && (
                  <>
                    <motion.div
                      animate={
                        isFascist
                          ? { opacity: [0.12, 0.28, 0.12], scale: [0.94, 1.02, 0.94] }
                          : { opacity: [0.1, 0.24, 0.1], scale: [0.94, 1.03, 0.94] }
                      }
                      transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                      className={`absolute inset-0 ${isFascist ? 'bg-red-400/18' : 'bg-cyan-300/16'}`}
                    />
                    <motion.img
                      src={cardSrc}
                      alt=""
                      aria-hidden="true"
                      animate={{ y: [8, 2, 8], rotate: [-4, 0, -4], opacity: [0.14, 0.26, 0.14] }}
                      transition={{ duration: 2.1, repeat: Infinity, ease: 'easeInOut' }}
                      className="pointer-events-none absolute bottom-0 left-1/2 h-8 w-6 -translate-x-1/2 rounded-[6px] object-cover"
                    />
                  </>
                )}

                <div className="relative z-10 flex h-full flex-col items-center justify-between text-center">
                  <span className="text-[6px] font-mono font-black uppercase tracking-[0.22em] opacity-80">
                    {slotMeta}
                  </span>

                  {isActive ? (
                    <motion.span
                      animate={isCurrentEdge ? { scale: [1, 1.12, 1] } : { scale: 1 }}
                      transition={isCurrentEdge ? { duration: 1.4, repeat: Infinity, ease: 'easeInOut' } : undefined}
                    >
                      <Icon size={9} />
                    </motion.span>
                  ) : (
                    <span className="text-[9px] font-mono font-black opacity-38">
                      {isNextSlot ? 'NEXT' : index + 1}
                    </span>
                  )}
                </div>

                {index === current - 1 && (
                  <motion.div
                    initial={{ scale: 1.15, opacity: 0.55 }}
                    animate={{ scale: 1, opacity: 0 }}
                    transition={{ duration: 0.75, ease: 'easeOut' }}
                    className={`absolute inset-0 pointer-events-none ${isFascist ? 'bg-red-400/40' : 'bg-cyan-300/40'}`}
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
