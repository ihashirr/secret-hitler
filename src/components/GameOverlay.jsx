import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { PHASES } from '../lib/constants';
import { triggerHaptic } from '../lib/haptics';

export default function GameOverlay({
  gameState,
  playerId,
  directorState,
  revealState,
  pendingSelection,
  onConfirm,
  onCancel,
  onVote,
  onDiscard,
  onRequestVeto,
  onRespondVeto,
  onEnact,
  onAcknowledgePeek,
}) {
  const myActualId = gameState?.myPlayerId || playerId;
  const isPresident = gameState.amIPresident || myActualId === gameState.currentPresident;
  const isChancellor = gameState.amIChancellor || myActualId === gameState.currentChancellor;
  const me = gameState.players.find((player) => player.id === myActualId);
  const currentChancellor = gameState.players.find(
    (player) => player.id === gameState.currentChancellor || player.id === gameState.nominatedChancellor
  );
  const primaryInstruction = directorState?.primaryInstruction;
  const currentBallotKey = `${gameState.phase}:${gameState.currentPresident || 'none'}:${gameState.nominatedChancellor || gameState.currentChancellor || 'none'}`;
  const [pendingVote, setPendingVote] = useState(null);
  const activePendingVote =
    pendingVote?.ballotKey === currentBallotKey &&
    gameState.phase === PHASES.VOTING &&
    !revealState &&
    !me?.hasVoted
      ? pendingVote.vote
      : null;

  const handleVoteSelection = async (approve) => {
    if (activePendingVote || me?.hasVoted) return;

    const vote = approve ? 'YA' : 'NEIN';
    triggerHaptic('selection');
    setPendingVote({ ballotKey: currentBallotKey, vote });

    try {
      await onVote(approve);
    } catch {
      setPendingVote(null);
    }
  };

  const runWithHaptic = (action, kind = 'selection') => () => {
    triggerHaptic(kind);
    return action();
  };

  let title = primaryInstruction?.title || '';
  let subtext = primaryInstruction?.description || '';
  let isActive = false;
  let actionContent = null;
  let privateAudience = 'This Device';

  const displayPhase = revealState ? PHASES.VOTING : gameState.phase;

  if (pendingSelection) {
    const pendingMeta = {
      NOMINATE: {
        title: 'Confirm Nomination',
        description: `${pendingSelection.name} will become the proposed chancellor.`,
      },
      KILL: {
        title: 'Confirm Elimination',
        description: `${pendingSelection.name} will be removed from the table.`,
      },
      INVESTIGATE: {
        title: 'Confirm Investigation',
        description: `You will privately learn ${pendingSelection.name}'s party loyalty.`,
      },
      SPECIAL_ELECTION: {
        title: 'Confirm Special Election',
        description: `${pendingSelection.name} will take the presidency for the next round only.`,
      },
    };
    title = pendingMeta[pendingSelection.type]?.title || 'Confirm Action';
    subtext = pendingMeta[pendingSelection.type]?.description || '';
    isActive = true;
  } else {
    switch (displayPhase) {
      case PHASES.NOMINATION:
        isActive = true;
        break;

      case PHASES.VOTING:
        if (revealState) {
          title = 'Vote Result';
          subtext = `${revealState.ya} Ja • ${revealState.nein} Nein`;
          isActive = true;
        } else if (me?.isAlive && !me?.hasVoted) {
          title = activePendingVote ? 'Locking Vote' : 'Vote in Private';
          subtext = activePendingVote
            ? `Submitting your ${activePendingVote === 'YA' ? 'Ja' : 'Nein'} vote now.`
            : `Approve or reject ${currentChancellor?.name || 'the proposed government'} on this phone.`;
          isActive = true;
          actionContent = (
            <div className="mt-4 grid w-full max-w-xs grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleVoteSelection(true)}
                disabled={Boolean(activePendingVote)}
                aria-pressed={activePendingVote === 'YA'}
                className={`touch-manipulation flex min-h-[112px] items-center justify-center rounded-[24px] border bg-white/70 p-3 shadow-sm transition-all active:scale-[0.98] ${
                  activePendingVote === 'YA'
                    ? 'border-[#2b5c8f]/45 ring-2 ring-[#2b5c8f]/35'
                    : 'border-[#2b5c8f]/15'
                } ${activePendingVote ? 'cursor-wait opacity-85' : ''}`}
              >
                <img
                  src="/assets/vote-yes.png"
                  alt="Ja"
                  loading="eager"
                  decoding="async"
                  className="w-full max-w-[96px]"
                />
              </button>
              <button
                type="button"
                onClick={() => handleVoteSelection(false)}
                disabled={Boolean(activePendingVote)}
                aria-pressed={activePendingVote === 'NEIN'}
                className={`touch-manipulation flex min-h-[112px] items-center justify-center rounded-[24px] border bg-white/70 p-3 shadow-sm transition-all active:scale-[0.98] ${
                  activePendingVote === 'NEIN'
                    ? 'border-[#c1272d]/45 ring-2 ring-[#c1272d]/35'
                    : 'border-[#c1272d]/15'
                } ${activePendingVote ? 'cursor-wait opacity-85' : ''}`}
              >
                <img
                  src="/assets/vote-no.png"
                  alt="Nein"
                  loading="eager"
                  decoding="async"
                  className="w-full max-w-[96px]"
                />
              </button>

              {activePendingVote && (
                <div className="col-span-2 flex items-center justify-center gap-2 pt-1 text-[10px] font-mono font-black uppercase tracking-[0.18em] text-[#5f5449]">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-[#2c2c2c]/50" />
                  Vote sending...
                </div>
              )}
            </div>
          );
        } else {
          if (me && !me.isAlive) {
            title = 'Observer Only';
            subtext = 'You have been eliminated. Watch the table, but you do not vote anymore.';
          }
          isActive = true;
        }
        break;

      case PHASES.LEGISLATIVE_PRESIDENT:
        if (isPresident) {
          title = 'Discard One Policy';
          subtext = 'Select one policy to discard. The remaining two go to the Chancellor.';
          isActive = true;
          privateAudience = 'President Only';

          if (gameState.drawnCards) {
          actionContent = (
            <motion.div
              key={`president-hand-${(gameState.drawnCards || []).join('-')}-${gameState.drawPileCount}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 flex flex-wrap justify-center gap-3"
            >
              {gameState.drawnCards.map((card, index) => (
                  <motion.button
                    key={index}
                    type="button"
                    onClick={runWithHaptic(() => onDiscard(index))}
                    initial={{ opacity: 0, y: 48, rotate: -10 + index * 6, scale: 0.86 }}
                    animate={{ opacity: 1, y: 0, rotate: 0, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 220, damping: 18, delay: 0.08 * index }}
                    className="group flex flex-col items-center transition-transform active:scale-[0.98]"
                  >
                    <img
                      src={card === 'FASCIST' ? '/assets/policy-fascist.png' : '/assets/policy-liberal.png'}
                      alt={card}
                      loading="eager"
                      decoding="async"
                      className="w-[78px] rounded-2xl border border-[#2c2c2c]/10 shadow-md sm:w-[90px]"
                    />
                    <span className="mt-2 text-[10px] font-mono font-black uppercase tracking-[0.18em] text-[#8a001d]">
                      Discard
                    </span>
                  </motion.button>
                ))}
              </motion.div>
            );
          }
        } else {
          isActive = true;
        }
        break;

      case PHASES.LEGISLATIVE_CHANCELLOR:
        if (isPresident && gameState.vetoRequested) {
          title = 'Respond To Veto';
          subtext = 'Accept to discard both policies and advance the tracker, or reject and force the Chancellor to enact one.';
          isActive = true;
          privateAudience = 'President Only';
          actionContent = (
            <div className="mt-4 grid w-full max-w-sm grid-cols-2 gap-3">
              <button
                type="button"
                onClick={runWithHaptic(() => onRespondVeto(true), 'confirm')}
                className="rounded-2xl border border-[#2b5c8f]/20 bg-[#2b5c8f] px-4 py-4 text-[11px] font-mono font-black uppercase tracking-[0.18em] text-white transition-colors hover:bg-[#21476d] active:scale-[0.98]"
              >
                Accept Veto
              </button>
              <button
                type="button"
                onClick={runWithHaptic(() => onRespondVeto(false), 'warning')}
                className="rounded-2xl border border-[#c1272d]/20 bg-[#c1272d] px-4 py-4 text-[11px] font-mono font-black uppercase tracking-[0.18em] text-white transition-colors hover:bg-[#9f1d22] active:scale-[0.98]"
              >
                Reject
              </button>
            </div>
          );
        } else if (isChancellor) {
          title = gameState.vetoRequested ? 'Veto Requested' : 'Enact One Policy';
          subtext = gameState.vetoRequested
            ? 'Your veto request is pending the President response.'
            : 'Select the one policy that will be enacted.';
          isActive = true;
          privateAudience = 'Chancellor Only';

          if (gameState.drawnCards && !gameState.vetoRequested) {
            actionContent = (
              <div className="mt-4 flex w-full max-w-md flex-col items-center gap-4">
                <motion.div
                  key={`chancellor-hand-${(gameState.drawnCards || []).join('-')}-${gameState.drawPileCount}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-wrap justify-center gap-3"
                >
                  {gameState.drawnCards.map((card, index) => (
                    <motion.button
                      key={index}
                      type="button"
                      onClick={runWithHaptic(() => onEnact(index), 'confirm')}
                      initial={{ opacity: 0, y: 52, rotate: -8 + index * 5, scale: 0.88 }}
                      animate={{ opacity: 1, y: 0, rotate: 0, scale: 1 }}
                      transition={{ type: 'spring', stiffness: 220, damping: 18, delay: 0.08 * index }}
                      className="group flex flex-col items-center transition-transform active:scale-[0.98]"
                    >
                      <img
                        src={card === 'FASCIST' ? '/assets/policy-fascist.png' : '/assets/policy-liberal.png'}
                        alt={card}
                        loading="eager"
                        decoding="async"
                        className="w-[82px] rounded-2xl border border-[#2c2c2c]/10 shadow-md sm:w-[96px]"
                      />
                      <span className="mt-2 text-[10px] font-mono font-black uppercase tracking-[0.18em] text-[#2b5c8f]">
                        Enact
                      </span>
                    </motion.button>
                  ))}
                </motion.div>

                {gameState.vetoAvailable && !gameState.vetoRequested && (
                  <button
                    type="button"
                    onClick={runWithHaptic(onRequestVeto, 'warning')}
                    className="rounded-2xl border border-[#8a001d]/20 bg-[#c1272d] px-5 py-3 text-[11px] font-mono font-black uppercase tracking-[0.18em] text-white transition-colors hover:bg-[#9f1d22] active:scale-[0.98]"
                  >
                    Request Veto
                  </button>
                )}
              </div>
            );
          }
        } else {
          isActive = true;
        }
        break;

      case PHASES.EXECUTIVE_ACTION:
        isActive = true;
        privateAudience = isPresident ? 'President Only' : 'Observers';
        if (isPresident && gameState.executivePower === 'PEEK' && gameState.peekedPolicies?.length) {
          title = 'Review Top Policies';
          subtext = 'These are the next three policies in order. They stay in the deck.';
          actionContent = (
            <div className="mt-4 flex w-full max-w-md flex-col items-center gap-4">
              <motion.div
                key={`peek-hand-${(gameState.peekedPolicies || []).join('-')}-${gameState.drawPileCount}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-wrap justify-center gap-3"
              >
                {gameState.peekedPolicies.map((card, index) => (
                  <motion.div
                    key={`${card}-${index}`}
                    initial={{ opacity: 0, y: 44, rotate: -8 + index * 5, scale: 0.88 }}
                    animate={{ opacity: 1, y: 0, rotate: 0, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 220, damping: 18, delay: 0.08 * index }}
                    className="flex flex-col items-center"
                  >
                    <img
                      src={card === 'FASCIST' ? '/assets/policy-fascist.png' : '/assets/policy-liberal.png'}
                      alt={card}
                      loading="eager"
                      decoding="async"
                      className="w-[82px] rounded-2xl border border-[#2c2c2c]/10 shadow-md sm:w-[96px]"
                    />
                    <span className="mt-2 text-[10px] font-mono font-black uppercase tracking-[0.18em] text-[#2b5c8f]">
                      Top {index + 1}
                    </span>
                  </motion.div>
                ))}
              </motion.div>
              <button
                type="button"
                onClick={runWithHaptic(onAcknowledgePeek, 'selection')}
                className="rounded-2xl border border-[#2b5c8f]/20 bg-[#2b5c8f] px-5 py-3 text-[11px] font-mono font-black uppercase tracking-[0.18em] text-white transition-colors hover:bg-[#21476d] active:scale-[0.98]"
              >
                Continue
              </button>
            </div>
          );
        }
        break;

      default:
        isActive = false;
    }
  }

  if (!isActive) return null;

  const hasActionContent = Boolean(actionContent || pendingSelection);
  const suppressRevealBanner = Boolean(revealState) && !pendingSelection && !actionContent;
  const suppressPassiveVotingBanner =
    displayPhase === PHASES.VOTING &&
    !revealState &&
    !pendingSelection &&
    !actionContent;
  const toneClass =
    pendingSelection || displayPhase === PHASES.EXECUTIVE_ACTION
      ? 'bg-[#c1272d]'
      : displayPhase === PHASES.VOTING
        ? 'bg-[#2b5c8f]'
        : 'bg-[#d4c098]';
  const toneBadgeClass =
    pendingSelection || displayPhase === PHASES.EXECUTIVE_ACTION
      ? 'border-[#c1272d]/25 bg-[#c1272d]/10 text-[#ffb2b5]'
      : displayPhase === PHASES.VOTING
        ? 'border-[#2b5c8f]/25 bg-[#2b5c8f]/10 text-cyan-100'
        : 'border-[#d4c098]/20 bg-white/5 text-[#efe1c4]';

  return (
    <AnimatePresence>
      {!hasActionContent && !suppressPassiveVotingBanner && !suppressRevealBanner && (
        <motion.div
          key={`banner-${title}`}
          initial={{ y: -24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -24, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          className="fixed inset-x-0 top-[calc(var(--app-header-offset)+10px)] z-[100] flex justify-center px-3 pointer-events-none"
        >
          <div className="relative w-full max-w-[520px] overflow-hidden rounded-[18px] border border-[#d4c098]/18 bg-[rgba(15,12,11,0.94)] shadow-[0_14px_36px_rgba(0,0,0,0.35)] backdrop-blur-md">
            <div className={`absolute inset-y-0 left-0 w-1 ${toneClass}`} />
            <div className="absolute inset-0 paper-grain opacity-[0.08] pointer-events-none" />

            <div className="relative z-10 px-4 py-2.5 sm:px-5 sm:py-3">
              <div className="flex flex-wrap items-center gap-2 text-[8px] font-mono font-black uppercase tracking-[0.24em] sm:text-[9px]">
                <motion.span
                  animate={displayPhase === PHASES.VOTING ? { opacity: [0.6, 1, 0.6] } : { opacity: 1 }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                  className={`rounded-full border px-2 py-0.5 ${toneBadgeClass}`}
                >
                  Live Briefing
                </motion.span>
              </div>

              <h2 className="mt-1.5 text-[12px] font-serif font-black uppercase tracking-[0.14em] text-[#f4eee0] sm:text-[14px]">
                {title}
              </h2>

              {subtext && (
                <p className="mt-1 text-[10px] leading-relaxed text-[#d4c8b0] sm:text-[11px]">
                  {subtext}
                </p>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {hasActionContent && (
        <motion.div
          key={`desk-${displayPhase}`}
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', stiffness: 260, damping: 30 }}
          className="fixed inset-x-0 bottom-0 z-[110] flex justify-center px-2 pointer-events-none sm:px-4"
        >
          <div className="pointer-events-auto relative w-full max-w-[760px] overflow-hidden rounded-t-[28px] border border-[#d4c098]/32 bg-[linear-gradient(180deg,#efe5d3_0%,#e5d8c1_100%)] px-4 pt-4 pb-[calc(var(--app-safe-bottom)+1rem)] shadow-[0_-24px_60px_rgba(0,0,0,0.55)] sm:px-6 sm:pt-5 sm:pb-[calc(var(--app-safe-bottom)+1.4rem)]">
            <div className="absolute inset-0 paper-grain opacity-10 pointer-events-none" />
            <div className="relative z-10 mx-auto mb-3 h-1.5 w-14 rounded-full bg-black/10" />

            <div className="relative z-10">
              <div className="flex flex-wrap items-center gap-2 text-[8px] font-mono font-black uppercase tracking-[0.22em] sm:text-[9px]">
                <span className="rounded-full border border-[#c1272d]/18 bg-[#c1272d]/10 px-2 py-0.5 text-[#8a001d]">
                  Action Desk
                </span>
                <span className="text-[#7a6b57]">Private Channel — {privateAudience}</span>
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
              <div className="relative z-10 mt-5 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={runWithHaptic(onConfirm, 'confirm')}
                  className="rounded-xl border border-[#8a001d] bg-[#c1272d] px-4 py-3 text-[11px] font-serif font-black uppercase tracking-[0.18em] text-white shadow-lg transition-colors hover:bg-[#a01d22] active:scale-[0.98]"
                >
                  Confirm
                </button>
                <button
                  type="button"
                  onClick={runWithHaptic(onCancel, 'soft')}
                  className="rounded-xl border border-[#b09868] bg-[#d4c098] px-4 py-3 text-[11px] font-serif font-black uppercase tracking-[0.18em] text-[#2c2c2c] shadow-lg transition-colors hover:bg-[#c4ae7d] active:scale-[0.98]"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
