import { motion } from 'framer-motion';
import FactionAccentText from './FactionAccentText';

const CARD_MOTION_EASE = [0.2, 0.88, 0.28, 1];

const TONE_MAP = {
  red: {
    overlay: 'bg-[rgba(12,4,5,0.56)]',
    accentBar: 'from-[#e76a46] via-[#d54d2a] to-[#9f2916]',
    badge: 'border-[#f3a186]/24 bg-[#d54d2a]/12 text-[#ffe0d5]',
    chip: 'border-[#f3a186]/18 bg-[#d54d2a]/10 text-[#ffd8cb]',
    cardBorder: 'border-[#f3a186]/12',
    title: 'text-[#f8efe2]',
    body: 'text-[#d7c9ba]',
    glow: 'rgba(213,77,42,0.18)',
  },
  blue: {
    overlay: 'bg-[rgba(4,8,10,0.54)]',
    accentBar: 'from-[#9be9f8] via-[#53c1d8] to-[#2b5c8f]',
    badge: 'border-cyan-200/22 bg-cyan-300/10 text-cyan-100',
    chip: 'border-cyan-200/18 bg-cyan-300/10 text-cyan-100/90',
    cardBorder: 'border-cyan-200/10',
    title: 'text-[#f8efe2]',
    body: 'text-[#d7c9ba]',
    glow: 'rgba(83,193,216,0.16)',
  },
  neutral: {
    overlay: 'bg-[rgba(4,4,5,0.5)]',
    accentBar: 'from-[#e8d6a4] via-[#d6b678] to-[#a17b47]',
    badge: 'border-[#e8d6a4]/22 bg-[#e8d6a4]/10 text-[#f6ecd3]',
    chip: 'border-white/10 bg-white/[0.04] text-white/76',
    cardBorder: 'border-white/10',
    title: 'text-[#f8efe2]',
    body: 'text-[#d7c9ba]',
    glow: 'rgba(232,214,164,0.13)',
  },
};

const MOTION_PRESETS = {
  standard: {
    initialY: 32,
    initialScale: 0.95,
    exitY: -18,
    exitScale: 0.985,
    visualInitial: { opacity: 0, y: 18, scale: 0.92, rotate: -1.6 },
  },
  directional: {
    initialY: 40,
    initialScale: 0.94,
    exitY: -20,
    exitScale: 0.985,
    visualInitial: { opacity: 0, x: -18, y: 16, scale: 0.9, rotate: -2.4 },
  },
  decision: {
    initialY: 38,
    initialScale: 0.94,
    exitY: -18,
    exitScale: 0.985,
    visualInitial: { opacity: 0, y: 24, scale: 0.88, rotate: -1.4 },
  },
  verdict: {
    initialY: 34,
    initialScale: 0.95,
    exitY: -18,
    exitScale: 0.985,
    visualInitial: { opacity: 0, y: 20, scale: 0.88, rotate: -2.8 },
  },
  policy: {
    initialY: 34,
    initialScale: 0.945,
    exitY: -18,
    exitScale: 0.985,
    visualInitial: { opacity: 0, y: 14, scale: 0.84, rotate: -3.6 },
  },
  major: {
    initialY: 42,
    initialScale: 0.93,
    exitY: -22,
    exitScale: 0.982,
    visualInitial: { opacity: 0, y: 18, scale: 0.9, rotate: -3.2 },
  },
};

export default function StoryBeatCard({
  cardKey,
  stageLabel,
  title,
  description,
  tone = 'neutral',
  chips = [],
  visual = null,
  actions = null,
  footer = null,
  motionPreset = 'standard',
}) {
  const theme = TONE_MAP[tone] || TONE_MAP.neutral;
  const preset = MOTION_PRESETS[motionPreset] || MOTION_PRESETS.standard;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      data-beat-key={cardKey}
      className="fixed inset-0 z-[118] flex items-center justify-center px-4 pb-[calc(var(--app-safe-bottom)+16px)] pt-[calc(var(--app-header-offset)+16px)] pointer-events-none"
    >
      <motion.div
        initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
        animate={{ opacity: 1, backdropFilter: 'blur(10px)' }}
        exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
        transition={{ duration: 0.34, ease: 'easeOut' }}
        className={`absolute inset-0 ${theme.overlay}`}
      />

      <motion.div
        initial={{ opacity: 0, y: preset.initialY, scale: preset.initialScale }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: preset.exitY, scale: preset.exitScale }}
        transition={{
          opacity: { duration: 0.28, ease: 'easeOut' },
          y: { duration: 0.46, ease: CARD_MOTION_EASE },
          scale: { duration: 0.46, ease: CARD_MOTION_EASE },
        }}
        className={`pointer-events-auto relative flex w-full max-w-[min(92vw,32rem)] min-w-0 flex-col overflow-hidden rounded-[28px] border ${theme.cardBorder} bg-[linear-gradient(180deg,rgba(12,12,14,0.97)_0%,rgba(10,10,12,0.95)_100%)] shadow-[0_36px_120px_rgba(0,0,0,0.52)]`}
        style={{ boxShadow: `0 36px 120px rgba(0,0,0,0.52), 0 0 56px ${theme.glow}` }}
      >
        <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${theme.accentBar}`} />
        <div className="absolute inset-0 paper-grain pointer-events-none opacity-[0.08]" />

        <div className="relative z-10 flex flex-col gap-5 px-5 pb-5 pt-5 sm:px-6 sm:pb-6 sm:pt-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.26, delay: 0.08, ease: 'easeOut' }}
            className="flex flex-wrap items-center gap-2 text-[9px] font-mono font-black uppercase tracking-[0.22em]"
          >
            <span className={`rounded-full border px-3 py-1 ${theme.badge}`}>
              {stageLabel}
            </span>
            {chips.map((chip) => (
              <span key={chip} className={`rounded-full border px-3 py-1 ${theme.chip}`}>
                {chip}
              </span>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, delay: 0.14, ease: 'easeOut' }}
            className="text-center"
          >
            <FactionAccentText
              as="h2"
              className={`text-3xl font-black uppercase tracking-[0.1em] sm:text-[2.2rem] ${theme.title}`}
            >
              {title}
            </FactionAccentText>
            {description && (
              <FactionAccentText
                as="p"
                className={`mx-auto mt-3 max-w-[28rem] text-sm leading-relaxed sm:text-[15px] ${theme.body}`}
              >
                {description}
              </FactionAccentText>
            )}
          </motion.div>

          {visual && (
            <motion.div
              initial={preset.visualInitial}
              animate={{ opacity: 1, x: 0, y: 0, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, y: -10, scale: 0.96, rotate: 1.6 }}
              transition={{ duration: 0.42, delay: 0.22, ease: CARD_MOTION_EASE }}
              className="flex items-center justify-center"
            >
              {visual}
            </motion.div>
          )}

          {actions && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28, delay: 0.28, ease: 'easeOut' }}
              className="flex items-center justify-center"
            >
              {actions}
            </motion.div>
          )}

          {footer && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.24, delay: 0.34, ease: 'easeOut' }}
              className="text-center text-[10px] font-mono font-black uppercase tracking-[0.18em] text-white/42"
            >
              {footer}
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
