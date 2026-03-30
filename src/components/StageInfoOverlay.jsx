import { AnimatePresence, motion, useDragControls } from 'framer-motion';
import { useMemo, useState } from 'react';
import { Info, Lock, Unlock, X } from 'lucide-react';
import FactionAccentText from './FactionAccentText';
import StageTimeline from './StageTimeline';

const DISMISS_DRAG_OFFSET = 120;
const DISMISS_DRAG_VELOCITY = 720;
const SHEET_ENTER_Y = 64;
const SHEET_EXIT_Y = 84;
const SHEET_MOTION_EASE = [0.22, 1, 0.36, 1];

const urgencyStyles = {
  high: 'border-red-400/25 bg-red-500/10 text-red-100',
  medium: 'border-cyan-400/20 bg-cyan-400/10 text-cyan-100',
  low: 'border-white/10 bg-white/5 text-white/75',
};

export default function StageInfoOverlay({ open, onClose, directorState }) {
  const {
    stageLabel = 'Live Match',
    stageTitle = 'Match Guide',
    stageDescription = '',
    publicInstructions = [],
    privateInstructions = [],
    facts = [],
    intel = [],
    timeline = [],
    timelineVisible = false,
  } = directorState || {};
  const [activeTab, setActiveTab] = useState('guide');
  const dragControls = useDragControls();
  const allInstructions = useMemo(
    () => [...privateInstructions, ...publicInstructions],
    [privateInstructions, publicInstructions],
  );
  const primaryInstruction = allInstructions[0] || null;
  const secondaryInstructions = allInstructions.slice(1);
  const tabs = [
    { key: 'guide', label: 'Guide' },
    { key: 'board', label: 'Board' },
    ...(intel.length ? [{ key: 'intel', label: 'Intel' }] : []),
  ];
  const handleClose = () => {
    setActiveTab('guide');
    onClose();
  };

  if (!directorState) return null;

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-150 flex items-end justify-center p-1.5 pb-[calc(var(--app-safe-bottom)+6px)] sm:p-3 sm:pb-[calc(var(--app-safe-bottom)+12px)]">
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
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
              if (info.offset.y > DISMISS_DRAG_OFFSET || info.velocity.y > DISMISS_DRAG_VELOCITY) {
                handleClose();
              }
            }}
            className="relative z-151 flex min-h-0 min-w-0 max-h-[calc(var(--app-vh)-var(--app-header-offset)-var(--app-safe-bottom)-8px)] w-full max-w-2xl transform-gpu will-change-transform flex-col overflow-hidden rounded-[30px] border border-white/10 bg-[#0c0d0f] shadow-[0_32px_90px_rgba(0,0,0,0.65)]"
          >
            <div className="flex items-center justify-center px-4 pt-2.5 sm:px-6 sm:pt-4">
              <button
                type="button"
                onPointerDown={(event) => {
                  event.stopPropagation();
                  dragControls.start(event);
                }}
                className="flex h-8 w-full max-w-30 items-center justify-center rounded-full"
                aria-label="Swipe down to close stage information"
                style={{ touchAction: 'none' }}
              >
                <span className="h-1.5 w-14 rounded-full bg-white/16" />
              </button>
            </div>

            <button
              type="button"
              onClick={handleClose}
              className="absolute right-3 top-2.5 z-10 flex h-9 w-9 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/75 transition-colors hover:bg-white/10 sm:right-5 sm:top-4 sm:h-10 sm:w-10"
              aria-label="Close stage information"
            >
              <X size={18} />
            </button>

            <div className="shrink-0 border-b border-white/10 px-4 py-3 pr-14 sm:px-6 sm:py-4 sm:pr-20">
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-[clamp(0.5rem,2.3vw,0.625rem)] font-mono font-black uppercase tracking-[0.22em] text-cyan-200/75 sm:tracking-[0.26em]">
                  <Info size={14} />
                  <FactionAccentText>{timelineVisible ? 'Match Progress' : stageLabel}</FactionAccentText>
                </p>
                {timelineVisible && (
                  <div className="mt-3">
                    <StageTimeline timeline={timeline} />
                  </div>
                )}
                <FactionAccentText
                  as="h2"
                  className="mt-2 text-[clamp(1.05rem,5.5vw,1.5rem)] font-serif font-black uppercase tracking-[0.06em] text-white sm:tracking-[0.08em]"
                >
                  {stageTitle}
                </FactionAccentText>
                <FactionAccentText as="p" className="mt-2 max-w-xl text-[clamp(0.7rem,3.2vw,0.9rem)] leading-relaxed text-white/60">
                  {stageDescription}
                </FactionAccentText>
              </div>
            </div>

            <div className="app-scroll-y min-h-0 min-w-0 flex-1 px-4 py-3 sm:px-6 sm:py-4">
              <div className="flex flex-wrap gap-2 border-b border-white/10 pb-3">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={`rounded-full border px-2.5 py-1.5 text-[clamp(0.5rem,2.3vw,0.625rem)] font-mono font-black uppercase tracking-[0.16em] transition-colors sm:px-3 sm:py-2 sm:tracking-[0.18em] ${
                      activeTab === tab.key
                        ? 'border-cyan-400/25 bg-cyan-400/10 text-cyan-100'
                        : 'border-white/10 bg-white/3 text-white/55 hover:bg-white/5'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {activeTab === 'guide' && (
                <section className="pt-4">
                  {primaryInstruction ? (
                    <div className="rounded-[22px] border border-white/10 bg-white/3 p-4">
                      <div className="flex flex-wrap items-center gap-2 text-[9px] font-mono font-black uppercase tracking-[0.18em]">
                        <span className={`rounded-full border px-2 py-1 ${urgencyStyles[primaryInstruction.urgency]}`}>
                          {primaryInstruction.urgency}
                        </span>
                        <span className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-1 text-white/65">
                          {primaryInstruction.visibility === 'private' ? <Lock size={12} /> : <Unlock size={12} />}
                          {primaryInstruction.visibility}
                        </span>
                      </div>

                      <FactionAccentText as="h3" className="mt-3 text-base font-black uppercase tracking-[0.08em] text-white">
                        {primaryInstruction.title}
                      </FactionAccentText>
                      <FactionAccentText as="p" className="mt-2 text-sm leading-relaxed text-white/60">
                        {primaryInstruction.description}
                      </FactionAccentText>

                      {primaryInstruction.actions?.length ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {primaryInstruction.actions.map((action) => (
                            <span
                              key={action.action}
                              className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[10px] font-mono font-black uppercase tracking-[0.18em] text-cyan-100"
                            >
                              <FactionAccentText>{action.label}</FactionAccentText>
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <div className="rounded-[22px] border border-white/10 bg-white/3 p-4">
                      <p className="text-sm leading-relaxed text-white/60">
                        No action right now. Watch the board.
                      </p>
                    </div>
                  )}

                  {secondaryInstructions.length > 0 && (
                    <div className="mt-4 grid gap-2">
                      {secondaryInstructions.map((instruction, index) => (
                        <div
                          key={`${instruction.title}-${index}`}
                          className="rounded-[18px] border border-white/10 bg-white/2 px-4 py-3"
                        >
                          <FactionAccentText
                            as="p"
                            className="text-[10px] font-mono font-black uppercase tracking-[0.18em] text-white/75"
                          >
                            {instruction.title}
                          </FactionAccentText>
                          <FactionAccentText as="p" className="mt-2 text-sm leading-relaxed text-white/50">
                            {instruction.description}
                          </FactionAccentText>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              )}

              {activeTab === 'board' && (
                <section className="pt-4">
                  <div className="grid grid-cols-1 gap-2 min-[360px]:grid-cols-2 sm:grid-cols-3">
                    {facts.map((fact) => (
                      <div key={fact.label} className="rounded-[18px] border border-white/10 bg-white/3 px-3 py-3">
                        <FactionAccentText
                          as="p"
                          className="text-[9px] font-mono font-black uppercase tracking-[0.18em] text-white/40"
                        >
                          {fact.label}
                        </FactionAccentText>
                        <FactionAccentText
                          as="p"
                          className="mt-2 text-sm font-black uppercase tracking-[0.06em] text-white/85"
                        >
                          {fact.value}
                        </FactionAccentText>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {activeTab === 'intel' && intel.length > 0 && (
                <section className="pt-4">
                  <div className="grid gap-2">
                    {intel.map((item) => (
                      <div key={item.label} className="rounded-[18px] border border-cyan-400/14 bg-cyan-400/6 px-4 py-3">
                        <FactionAccentText
                          as="p"
                          className="text-[9px] font-mono font-black uppercase tracking-[0.18em] text-cyan-200/55"
                        >
                          {item.label}
                        </FactionAccentText>
                        <FactionAccentText as="p" className="mt-2 text-sm leading-relaxed text-cyan-50">
                          {item.value}
                        </FactionAccentText>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
