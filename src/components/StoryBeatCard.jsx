import { motion } from 'framer-motion';
import FactionAccentText from './FactionAccentText';

const CARD_MOTION_EASE = [0.22, 1, 0.36, 1];

const TONE_MAP = {
  red: {
    overlay: 'bg-[rgba(9,4,5,0.52)]',
    accentBar: 'from-[#e76a46] via-[#d54d2a] to-[#9f2916]',
    badge: 'border-[#f3a186]/24 bg-[#d54d2a]/12 text-[#ffe0d5]',
    chip: 'border-[#f3a186]/18 bg-[#d54d2a]/10 text-[#ffd8cb]',
    cardBorder: 'border-[#f3a186]/12',
    title: 'text-[#f8efe2]',
    body: 'text-[#d7c9ba]',
  },
  blue: {
    overlay: 'bg-[rgba(4,8,10,0.5)]',
    accentBar: 'from-[#9be9f8] via-[#53c1d8] to-[#2b5c8f]',
    badge: 'border-cyan-200/22 bg-cyan-300/10 text-cyan-100',
    chip: 'border-cyan-200/18 bg-cyan-300/10 text-cyan-100/90',
    cardBorder: 'border-cyan-200/10',
    title: 'text-[#f8efe2]',
    body: 'text-[#d7c9ba]',
  },
  neutral: {
    overlay: 'bg-[rgba(4,4,5,0.48)]',
    accentBar: 'from-[#e8d6a4] via-[#d6b678] to-[#a17b47]',
    badge: 'border-[#e8d6a4]/22 bg-[#e8d6a4]/10 text-[#f6ecd3]',
    chip: 'border-white/10 bg-white/[0.04] text-white/76',
    cardBorder: 'border-white/10',
    title: 'text-[#f8efe2]',
    body: 'text-[#d7c9ba]',
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
}) {
  const theme = TONE_MAP[tone] || TONE_MAP.neutral;

  return (
    <motion.div
      key={cardKey}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[118] flex items-center justify-center px-4 pb-[calc(var(--app-safe-bottom)+16px)] pt-[calc(var(--app-header-offset)+16px)] pointer-events-none"
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        className={`absolute inset-0 backdrop-blur-[7px] ${theme.overlay}`}
      />

      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.985 }}
        transition={{
          opacity: { duration: 0.18, ease: 'easeOut' },
          y: { duration: 0.24, ease: CARD_MOTION_EASE },
          scale: { duration: 0.24, ease: CARD_MOTION_EASE },
        }}
        className={`pointer-events-auto relative flex w-full max-w-[min(92vw,32rem)] min-w-0 flex-col overflow-hidden rounded-[28px] border ${theme.cardBorder} bg-[linear-gradient(180deg,rgba(12,12,14,0.97)_0%,rgba(10,10,12,0.95)_100%)] shadow-[0_36px_120px_rgba(0,0,0,0.52)]`}
      >
        <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${theme.accentBar}`} />
        <div className="absolute inset-0 paper-grain pointer-events-none opacity-[0.08]" />

        <div className="relative z-10 flex flex-col gap-5 px-5 pb-5 pt-5 sm:px-6 sm:pb-6 sm:pt-6">
          <div className="flex flex-wrap items-center gap-2 text-[9px] font-mono font-black uppercase tracking-[0.22em]">
            <span className={`rounded-full border px-3 py-1 ${theme.badge}`}>
              {stageLabel}
            </span>
            {chips.map((chip) => (
              <span key={chip} className={`rounded-full border px-3 py-1 ${theme.chip}`}>
                {chip}
              </span>
            ))}
          </div>

          <div className="text-center">
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
          </div>

          {visual && (
            <div className="flex items-center justify-center">
              {visual}
            </div>
          )}

          {actions && (
            <div className="flex items-center justify-center">
              {actions}
            </div>
          )}

          {footer && (
            <div className="text-center text-[10px] font-mono font-black uppercase tracking-[0.18em] text-white/42">
              {footer}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
