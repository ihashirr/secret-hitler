import { useEffect, useState } from 'react';
import { AlertTriangle, LogOut, Settings, ShieldAlert, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import StageInfoButton from './StageInfoButton';
import StageTimeline from './StageTimeline';

export default function GlobalControls({
  gameState,
  playerId,
  directorState,
  infoOpen,
  onOpenInfo,
  onReset,
  onWipe,
  onExit,
}) {
  const me = directorState?.player || gameState?.players?.find((player) => player.id === (gameState?.myPlayerId || playerId));
  const [showHostMenu, setShowHostMenu] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  const [modalInput, setModalInput] = useState('');

  const closeModal = () => {
    setActiveModal(null);
    setModalInput('');
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key !== 'Escape') return;

      setShowHostMenu(false);
      closeModal();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!me) return null;

  return (
    <>
      <AnimatePresence>
        {showHostMenu && (
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowHostMenu(false)}
            className="fixed inset-0 z-[118] bg-black/20 backdrop-blur-[1px]"
          />
        )}
      </AnimatePresence>

      <motion.header
        initial={{ y: -12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed inset-x-0 top-0 z-[120] border-b border-white/10 bg-[rgba(6,7,8,0.82)] pt-[var(--app-safe-top)] backdrop-blur-xl"
      >
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-3 px-4">
          <div className="min-w-0">
            <p className="text-[10px] font-mono font-black uppercase tracking-[0.28em] text-cyan-300/75">
              Room {gameState.roomId}
            </p>
            <p className="truncate text-sm font-black uppercase tracking-[0.12em] text-white">
              {me.name}
            </p>
          </div>

          <div className="min-w-0 flex-1 px-1">
            {directorState?.timelineVisible ? (
              <StageTimeline timeline={directorState?.timeline} compact />
            ) : (
              <div className="hidden min-w-0 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-mono font-black uppercase tracking-[0.18em] text-white/55 sm:block">
                {directorState?.stageLabel || 'Live Match'}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {me.isHost && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowHostMenu((open) => !open)}
                  className={`flex h-10 w-10 items-center justify-center rounded-2xl border transition-colors ${
                    showHostMenu
                      ? 'border-red-400/40 bg-red-500/10 text-red-200'
                      : 'border-white/10 bg-white/5 text-white/75 hover:bg-white/10'
                  }`}
                >
                  {showHostMenu ? <X size={18} /> : <Settings size={18} />}
                </button>

                <AnimatePresence>
                  {showHostMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.98 }}
                      className="absolute right-0 top-[calc(100%+8px)] z-[121] w-48 overflow-hidden rounded-2xl border border-white/10 bg-[#101112] p-1 shadow-[0_20px_40px_rgba(0,0,0,0.45)]"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setShowHostMenu(false);
                          setActiveModal('reset');
                        }}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-3 text-left text-[11px] font-mono font-black uppercase tracking-[0.18em] text-white/75 transition-colors hover:bg-white/5"
                      >
                        <ShieldAlert size={14} />
                        Reset Room
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowHostMenu(false);
                          setActiveModal('wipe');
                        }}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-3 text-left text-[11px] font-mono font-black uppercase tracking-[0.18em] text-red-200 transition-colors hover:bg-red-500/10"
                      >
                        <AlertTriangle size={14} />
                        Wipe Storage
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            <StageInfoButton onClick={onOpenInfo} active={infoOpen} />

            <button
              type="button"
              onClick={onExit}
              className="flex h-10 items-center justify-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 text-[11px] font-mono font-black uppercase tracking-[0.18em] text-red-100 transition-colors hover:bg-red-500/15"
            >
              <LogOut size={16} />
              Exit
            </button>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {activeModal && (
          <div className="fixed inset-0 z-[140] flex items-center justify-center p-4">
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="absolute inset-0 bg-black/55 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              className="relative z-[141] w-full max-w-sm rounded-[28px] border border-white/10 bg-[#0f1011] p-5 shadow-[0_28px_80px_rgba(0,0,0,0.55)]"
            >
              <h2 className={`text-[11px] font-mono font-black uppercase tracking-[0.28em] ${activeModal === 'wipe' ? 'text-red-200' : 'text-white/80'}`}>
                {activeModal === 'wipe' ? 'Wipe Storage' : 'Reset Room'}
              </h2>

              <p className="mt-3 text-sm leading-relaxed text-white/55">
                {activeModal === 'wipe'
                  ? 'This erases every saved room, player, and match log from storage.'
                  : 'This closes the current room and sends everyone back to the join screen.'}
              </p>

              {activeModal === 'wipe' && (
                <div className="mt-4">
                  <label
                    htmlFor="wipe-code"
                    className="text-[10px] font-mono font-black uppercase tracking-[0.2em] text-red-200/70"
                  >
                    Type ECLIPSE to confirm
                  </label>
                  <input
                    id="wipe-code"
                    type="text"
                    value={modalInput}
                    onChange={(event) => setModalInput(event.target.value.toUpperCase())}
                    autoComplete="off"
                    className="mt-2 h-12 w-full rounded-2xl border border-red-500/20 bg-red-500/5 px-4 font-mono text-sm font-black uppercase tracking-[0.18em] text-red-100 outline-none focus:border-red-400/45"
                  />
                </div>
              )}

              <div className="mt-5 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex h-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-[11px] font-mono font-black uppercase tracking-[0.18em] text-white/75 transition-colors hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (activeModal === 'wipe') {
                      onWipe();
                    } else {
                      onReset();
                    }

                    closeModal();
                  }}
                  disabled={activeModal === 'wipe' && modalInput !== 'ECLIPSE'}
                  className={`flex h-12 items-center justify-center rounded-2xl text-[11px] font-mono font-black uppercase tracking-[0.18em] transition-colors ${
                    activeModal === 'wipe'
                      ? modalInput === 'ECLIPSE'
                        ? 'bg-red-500 text-black'
                        : 'border border-red-500/20 bg-red-500/10 text-red-100/35'
                      : 'bg-cyan-400 text-black'
                  }`}
                >
                  {activeModal === 'wipe' ? 'Wipe' : 'Reset'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
