import { AnimatePresence, motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { Info, Lock, Unlock, X } from 'lucide-react';
import StageTimeline from './StageTimeline';

const urgencyStyles = {
  high: 'border-red-400/25 bg-red-500/10 text-red-100',
  medium: 'border-cyan-400/20 bg-cyan-400/10 text-cyan-100',
  low: 'border-white/10 bg-white/5 text-white/75',
};

export default function StageInfoOverlay({ open, onClose, directorState }) {
  const {
    stageLabel,
    stageTitle,
    stageDescription,
    publicInstructions,
    privateInstructions,
    facts,
    intel,
    timeline,
    timelineVisible,
  } = directorState || {};
  const [activeTab, setActiveTab] = useState('guide');
  const allInstructions = useMemo(
    () => [...(privateInstructions || []), ...(publicInstructions || [])],
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
        <div className="fixed inset-0 z-[150] flex items-end justify-center p-3 sm:items-center sm:p-6">
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            className="relative z-[151] flex max-h-[88svh] w-full max-w-2xl flex-col overflow-hidden rounded-[30px] border border-white/10 bg-[#0c0d0f] shadow-[0_32px_90px_rgba(0,0,0,0.65)]"
          >
            <div className="border-b border-white/10 px-5 py-4 sm:px-6">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-[10px] font-mono font-black uppercase tracking-[0.26em] text-cyan-200/75">
                    <Info size={14} />
                    {timelineVisible ? 'Match Progress' : stageLabel}
                  </p>
                  {timelineVisible && (
                    <div className="mt-3">
                      <StageTimeline timeline={timeline} />
                    </div>
                  )}
                  <h2 className="mt-2 text-xl font-serif font-black uppercase tracking-[0.08em] text-white sm:text-2xl">
                    {stageTitle}
                  </h2>
                  <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/60">{stageDescription}</p>
                </div>

                <button
                  type="button"
                  onClick={handleClose}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/75 transition-colors hover:bg-white/10"
                  aria-label="Close stage information"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto px-5 py-4 sm:px-6">
              <div className="flex flex-wrap gap-2 border-b border-white/10 pb-3">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={`rounded-full border px-3 py-2 text-[10px] font-mono font-black uppercase tracking-[0.18em] transition-colors ${
                      activeTab === tab.key
                        ? 'border-cyan-400/25 bg-cyan-400/10 text-cyan-100'
                        : 'border-white/10 bg-white/[0.03] text-white/55 hover:bg-white/5'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {activeTab === 'guide' && (
                <section className="pt-4">
                  {primaryInstruction ? (
                    <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
                      <div className="flex flex-wrap items-center gap-2 text-[9px] font-mono font-black uppercase tracking-[0.18em]">
                        <span className={`rounded-full border px-2 py-1 ${urgencyStyles[primaryInstruction.urgency]}`}>
                          {primaryInstruction.urgency}
                        </span>
                        <span className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-1 text-white/65">
                          {primaryInstruction.visibility === 'private' ? <Lock size={12} /> : <Unlock size={12} />}
                          {primaryInstruction.visibility}
                        </span>
                      </div>

                      <h3 className="mt-3 text-base font-black uppercase tracking-[0.08em] text-white">
                        {primaryInstruction.title}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-white/60">
                        {primaryInstruction.description}
                      </p>

                      {primaryInstruction.actions?.length ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {primaryInstruction.actions.map((action) => (
                            <span
                              key={action.action}
                              className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[10px] font-mono font-black uppercase tracking-[0.18em] text-cyan-100"
                            >
                              {action.label}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
                      <p className="text-sm leading-relaxed text-white/60">
                        No extra instruction is needed right now. Follow the live board and wait for the next action.
                      </p>
                    </div>
                  )}

                  {secondaryInstructions.length > 0 && (
                    <div className="mt-4 grid gap-2">
                      {secondaryInstructions.map((instruction, index) => (
                        <div
                          key={`${instruction.title}-${index}`}
                          className="rounded-[18px] border border-white/10 bg-white/[0.02] px-4 py-3"
                        >
                          <p className="text-[10px] font-mono font-black uppercase tracking-[0.18em] text-white/75">
                            {instruction.title}
                          </p>
                          <p className="mt-2 text-sm leading-relaxed text-white/50">{instruction.description}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              )}

              {activeTab === 'board' && (
                <section className="pt-4">
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {facts.map((fact) => (
                      <div key={fact.label} className="rounded-[18px] border border-white/10 bg-white/[0.03] px-3 py-3">
                        <p className="text-[9px] font-mono font-black uppercase tracking-[0.18em] text-white/40">
                          {fact.label}
                        </p>
                        <p className="mt-2 text-sm font-black uppercase tracking-[0.06em] text-white/85">
                          {fact.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {activeTab === 'intel' && intel.length > 0 && (
                <section className="pt-4">
                  <div className="grid gap-2">
                    {intel.map((item) => (
                      <div key={item.label} className="rounded-[18px] border border-cyan-400/14 bg-cyan-400/[0.06] px-4 py-3">
                        <p className="text-[9px] font-mono font-black uppercase tracking-[0.18em] text-cyan-200/55">
                          {item.label}
                        </p>
                        <p className="mt-2 text-sm leading-relaxed text-cyan-50">{item.value}</p>
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
