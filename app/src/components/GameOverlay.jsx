import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PHASES } from '../lib/constants';

export default function GameOverlay({
  gameState,
  playerId,
  revealState,
  pendingSelection,
  onConfirm,
  onCancel,
  onVote,
  onDiscard,
  onEnact,
}) {
  const myActualId = gameState?.myPlayerId || playerId;
  const isPresident = gameState.amIPresident || myActualId === gameState.currentPresident;
  const isChancellor = gameState.amIChancellor || myActualId === gameState.currentChancellor;
  const me = gameState.players.find((player) => player.id === myActualId);
  const currentPresident = gameState.players.find((player) => player.id === gameState.currentPresident);
  const currentChancellor = gameState.players.find((player) => player.id === gameState.currentChancellor || player.id === gameState.nominatedChancellor);

  let title = '';
  let subtext = '';
  let isActive = false;
  let actionContent = null;

  const displayPhase = revealState ? PHASES.VOTING : gameState.phase;

  if (pendingSelection) {
    title = pendingSelection.type === 'NOMINATE' ? 'Confirm Nomination' : 'Confirm Elimination';
    subtext = pendingSelection.type === 'NOMINATE'
      ? `${pendingSelection.name} will become the proposed chancellor.`
      : `${pendingSelection.name} will be removed from the table.`;
    isActive = true;
  } else {
    switch (displayPhase) {
      case PHASES.NOMINATION:
        if (isPresident) {
          title = 'Nominate a Chancellor';
          subtext = 'Choose one eligible player from the dock below.';
        } else {
          title = 'President Choosing';
          subtext = `${currentPresident?.name || 'The president'} is selecting the next chancellor.`;
        }
        isActive = true;
        break;

      case PHASES.VOTING:
        if (revealState) {
          title = 'Vote Result';
          subtext = `${revealState.ya} Ja • ${revealState.nein} Nein`;
          isActive = true;
        } else if (!me?.hasVoted) {
          title = 'Vote in Private';
          subtext = `Approve or reject ${currentChancellor?.name || 'the proposed government'} on your phone.`;
          isActive = true;
          actionContent = (
            <div className="mt-4 flex items-center justify-center gap-4 sm:gap-6 pointer-events-auto">
              <button
                onClick={() => onVote(true)}
                className="group relative transition-all duration-300 hover:-translate-y-1 hover:scale-[1.04] active:scale-95"
              >
                <img src="/assets/vote-yes.png" alt="Ja" className="w-[72px] sm:w-[90px] drop-shadow-lg transition-all group-hover:drop-shadow-2xl" />
              </button>
              <button
                onClick={() => onVote(false)}
                className="group relative transition-all duration-300 hover:-translate-y-1 hover:scale-[1.04] active:scale-95"
              >
                <img src="/assets/vote-no.png" alt="Nein" className="w-[72px] sm:w-[90px] drop-shadow-lg transition-all group-hover:drop-shadow-2xl" />
              </button>
            </div>
          );
        } else {
          title = 'Awaiting Votes';
          subtext = 'Hold while the rest of the table locks in.';
          isActive = true;
        }
        break;

      case PHASES.LEGISLATIVE_PRESIDENT:
        if (isPresident) {
          title = 'President Decision';
          subtext = 'Discard one policy and pass the remaining two forward.';
          isActive = true;
          if (gameState.drawnCards) {
            actionContent = (
              <div className="mt-4 flex flex-wrap justify-center gap-4 sm:gap-5 pointer-events-auto group/cards">
                {gameState.drawnCards.map((card, index) => (
                  <button
                    key={index}
                    onClick={() => onDiscard(index)}
                    className="group relative transition-all duration-300 hover:-translate-y-2 hover:scale-[1.04] group-hover/cards:opacity-45 hover:!opacity-100"
                  >
                    <img
                      src={card === 'FASCIST' ? '/assets/policy-fascist.png' : '/assets/policy-liberal.png'}
                      className="w-[68px] rounded-sm border border-[#2c2c2c]/10 drop-shadow-md sm:w-[82px]"
                      alt={card}
                    />
                    <div className="absolute inset-x-0 -bottom-6 opacity-0 transition-all text-[8px] font-black uppercase tracking-[0.2em] text-[#c1272d] group-hover:opacity-100 sm:text-[9px]">
                      Discard
                    </div>
                  </button>
                ))}
              </div>
            );
          }
        } else {
          title = 'President Reviewing';
          subtext = `${currentPresident?.name || 'The president'} is handling the first cut.`;
          isActive = true;
        }
        break;

      case PHASES.LEGISLATIVE_CHANCELLOR:
        if (isChancellor) {
          title = 'Chancellor Decision';
          subtext = 'Choose the policy that will take effect this round.';
          isActive = true;
          if (gameState.drawnCards) {
            actionContent = (
              <div className="mt-4 flex flex-wrap justify-center gap-4 sm:gap-5 pointer-events-auto group/cards">
                {gameState.drawnCards.map((card, index) => (
                  <button
                    key={index}
                    onClick={() => onEnact(index)}
                    className="group relative transition-all duration-300 hover:-translate-y-2 hover:scale-[1.04] group-hover/cards:opacity-45 hover:!opacity-100"
                  >
                    <img
                      src={card === 'FASCIST' ? '/assets/policy-fascist.png' : '/assets/policy-liberal.png'}
                      className="w-[72px] rounded-sm border border-[#2c2c2c]/10 drop-shadow-md sm:w-[90px]"
                      alt={card}
                    />
                    <div className="absolute inset-x-0 -bottom-6 opacity-0 transition-all text-[8px] font-black uppercase tracking-[0.2em] text-[#2b5c8f] group-hover:opacity-100 sm:text-[9px]">
                      Enact
                    </div>
                  </button>
                ))}
              </div>
            );
          }
        } else {
          title = 'Chancellor Deciding';
          subtext = `${currentChancellor?.name || 'The chancellor'} is making the final choice.`;
          isActive = true;
        }
        break;

      case PHASES.EXECUTIVE_ACTION:
        if (isPresident) {
          title = 'Executive Order';
          subtext = 'Choose one living player to remove from the table.';
        } else {
          title = 'Order Incoming';
          subtext = `${currentPresident?.name || 'The president'} is deciding who will be eliminated.`;
        }
        isActive = true;
        break;

      default:
        isActive = false;
    }
  }

  const [isDismissed, setIsDismissed] = React.useState(false);

  React.useEffect(() => {
    setIsDismissed(false);
  }, [title, displayPhase, pendingSelection]);

  if (!isActive) return null;

  const hasActionContent = Boolean(actionContent || pendingSelection);
  const toneClass = pendingSelection || displayPhase === PHASES.EXECUTIVE_ACTION
    ? 'bg-[#c1272d]'
    : displayPhase === PHASES.VOTING
      ? 'bg-[#2b5c8f]'
      : 'bg-[#d4c098]';
  const toneBadgeClass = pendingSelection || displayPhase === PHASES.EXECUTIVE_ACTION
    ? 'border-[#c1272d]/25 bg-[#c1272d]/10 text-[#ffb2b5]'
    : displayPhase === PHASES.VOTING
      ? 'border-[#2b5c8f]/25 bg-[#2b5c8f]/10 text-cyan-100'
      : 'border-[#d4c098]/20 bg-white/5 text-[#efe1c4]';

  return (
    <AnimatePresence>
      {!hasActionContent && !isDismissed && (
        <motion.div
          key={`banner-${title}`}
          initial={{ y: -48, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -48, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          className="fixed inset-x-0 top-[44px] z-[100] flex justify-center px-3 pointer-events-none sm:top-[48px] sm:px-4"
        >
          <div className="pointer-events-auto relative w-full max-w-[920px] overflow-hidden rounded-[22px] border border-[#d4c098]/18 bg-[rgba(15,12,11,0.94)] shadow-[0_14px_36px_rgba(0,0,0,0.35)] backdrop-blur-md">
            <div className={`absolute inset-y-0 left-0 w-1 ${toneClass}`} />
            <div className="absolute inset-0 paper-grain opacity-[0.08] pointer-events-none" />

            <button
              onClick={() => setIsDismissed(true)}
              className="absolute top-2.5 right-2.5 rounded-full p-1 text-white/35 transition-colors hover:bg-white/5 hover:text-white/70"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
            </button>

            <div className="relative z-10 px-4 py-3 pr-11 sm:px-5 sm:py-3.5 sm:pr-12">
              <div className="flex flex-wrap items-center gap-2 text-[8px] font-mono font-black uppercase tracking-[0.24em] sm:text-[9px]">
                <span className={`rounded-full border px-2 py-0.5 ${toneBadgeClass}`}>
                  Live Briefing
                </span>
                <span className="text-white/35">Mobile-first private play</span>
              </div>

              <h2 className="mt-2 text-[12px] font-serif font-black uppercase tracking-[0.14em] text-[#f4eee0] sm:text-[14px]">
                {title}
              </h2>

              {subtext && (
                <p className="mt-1 max-w-[44rem] text-[10px] leading-relaxed text-[#d4c8b0] sm:text-[11px]">
                  {subtext}
                </p>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {!hasActionContent && isDismissed && (
        <motion.div
          key="minimized-banner"
          initial={{ y: -24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -24, opacity: 0 }}
          className="fixed inset-x-0 top-[44px] z-[100] flex justify-center px-3 pointer-events-none sm:top-[48px] sm:px-4"
        >
          <button
            onClick={() => setIsDismissed(false)}
            className="pointer-events-auto rounded-full border border-[#d4c098]/20 bg-[rgba(15,12,11,0.92)] px-4 py-2 text-[9px] font-mono font-black uppercase tracking-[0.22em] text-[#efe1c4] shadow-lg transition-colors hover:bg-[rgba(24,20,18,0.98)]"
          >
            Show Briefing
          </button>
        </motion.div>
      )}

      {hasActionContent && !isDismissed && (
        <motion.div
          key={`desk-${displayPhase}`}
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', stiffness: 260, damping: 30 }}
          className="fixed inset-x-0 bottom-0 z-[110] flex justify-center px-2 pointer-events-none sm:px-4"
        >
          <div className="pointer-events-auto relative w-full max-w-[920px] overflow-hidden rounded-t-[28px] border border-[#d4c098]/32 bg-[linear-gradient(180deg,#efe5d3_0%,#e5d8c1_100%)] px-4 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-[0_-24px_60px_rgba(0,0,0,0.55)] sm:px-6 sm:pt-5 sm:pb-[calc(1.4rem+env(safe-area-inset-bottom))]">
            <div className="absolute inset-0 paper-grain opacity-10 pointer-events-none" />

            <button
              onClick={() => setIsDismissed(true)}
              className="absolute top-3 right-3 z-20 rounded-full bg-black/5 p-1.5 text-[#2c2c2c]/55 transition-colors hover:bg-black/10 hover:text-[#2c2c2c]"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
            </button>

            <div className="relative z-10 mx-auto mb-3 h-1.5 w-14 rounded-full bg-black/10" />

            <div className="relative z-10 pr-10">
              <div className="flex flex-wrap items-center gap-2 text-[8px] font-mono font-black uppercase tracking-[0.22em] sm:text-[9px]">
                <span className="rounded-full border border-[#c1272d]/18 bg-[#c1272d]/10 px-2 py-0.5 text-[#8a001d]">
                  Action Desk
                </span>
                <span className="text-[#7a6b57]">Private on this device</span>
              </div>

              <h2 className="mt-2 text-[13px] font-serif font-black uppercase tracking-[0.12em] text-[#2c2c2c] sm:text-[15px]">
                {title}
              </h2>

              {subtext && (
                <p className="mt-1 max-w-[44rem] text-[10px] leading-relaxed text-[#5f5449] sm:text-[11px]">
                  {subtext}
                </p>
              )}
            </div>

            {actionContent && (
              <div className="relative z-10 mt-4 flex justify-center">
                {actionContent}
              </div>
            )}

            {pendingSelection && (
              <div className="relative z-10 mt-5 grid grid-cols-2 gap-3 sm:flex sm:justify-center">
                <button
                  onClick={onConfirm}
                  className="rounded-xl border border-[#8a001d] bg-[#c1272d] px-4 py-3 text-[11px] font-serif font-black uppercase tracking-[0.18em] text-white shadow-lg transition-colors hover:bg-[#a01d22] active:scale-[0.98] sm:min-w-[170px]"
                >
                  Confirm
                </button>
                <button
                  onClick={onCancel}
                  className="rounded-xl border border-[#b09868] bg-[#d4c098] px-4 py-3 text-[11px] font-serif font-black uppercase tracking-[0.18em] text-[#2c2c2c] shadow-lg transition-colors hover:bg-[#c4ae7d] active:scale-[0.98] sm:min-w-[170px]"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {hasActionContent && isDismissed && (
        <motion.div
          key="minimized-desk"
          initial={{ y: 28, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 28, opacity: 0 }}
          className="fixed inset-x-0 bottom-0 z-[110] flex justify-center px-2 pointer-events-none sm:px-4"
        >
          <button
            onClick={() => setIsDismissed(false)}
            className="pointer-events-auto rounded-t-2xl border border-b-0 border-[#4a4a4a] bg-[#161616] px-6 py-2.5 text-[10px] font-mono font-black uppercase tracking-[0.2em] text-white shadow-[0_-10px_24px_rgba(0,0,0,0.4)] transition-colors hover:bg-[#202020]"
          >
            Reopen Desk
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
