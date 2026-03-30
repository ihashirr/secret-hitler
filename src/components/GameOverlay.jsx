import { useState } from 'react';
import { AnimatePresence, motion, useDragControls } from 'framer-motion';
import { PHASES } from '../lib/constants';
import { triggerHaptic } from '../lib/haptics';
import FactionAccentText from './FactionAccentText';
import StageSpotlight from './StageSpotlight';

const ACTIONABLE_SPOTLIGHT_MS = 10000;
const SHEET_DISMISS_DRAG_OFFSET = 120;
const SHEET_DISMISS_DRAG_VELOCITY = 720;

function getSpotlightSceneId({
  displayPhase,
  gameState,
  currentBallotKey,
  currentAction,
  hasActionContent,
  isPresident,
  isChancellor,
}) {
  if (hasActionContent) {
    if (displayPhase === PHASES.VOTING) {
      return `action:vote:${currentBallotKey}`;
    }

    if (displayPhase === PHASES.LEGISLATIVE_PRESIDENT) {
      return `action:president-hand:${gameState.currentPresident || 'none'}:${gameState.drawPileCount}:${gameState.drawnCards?.length || 0}`;
    }

    if (displayPhase === PHASES.LEGISLATIVE_CHANCELLOR) {
      if (gameState.vetoRequested && isPresident) {
        return `action:veto-response:${gameState.currentPresident || 'none'}:${gameState.currentChancellor || 'none'}`;
      }

      if (isChancellor) {
        return `action:chancellor-hand:${gameState.currentChancellor || 'none'}:${gameState.drawPileCount}:${gameState.drawnCards?.length || 0}:${gameState.vetoRequested ? 'pending-veto' : 'enact'}`;
      }
    }

    if (displayPhase === PHASES.EXECUTIVE_ACTION) {
      return `action:executive:${gameState.currentPresident || 'none'}:${gameState.executivePower || currentAction || 'watch'}`;
    }
  }

  switch (displayPhase) {
    case PHASES.NOMINATION:
      return `phase:nomination:${gameState.currentPresident || 'none'}:${gameState.nominatedChancellor || 'open'}`;
    case PHASES.VOTING:
      return `phase:voting:${currentBallotKey}`;
    case PHASES.LEGISLATIVE_PRESIDENT:
      return `phase:legislative-president:${gameState.currentPresident || 'none'}`;
    case PHASES.LEGISLATIVE_CHANCELLOR:
      return `phase:legislative-chancellor:${gameState.currentChancellor || 'none'}:${gameState.vetoRequested ? 'veto' : 'waiting'}`;
    case PHASES.EXECUTIVE_ACTION:
      return `phase:executive:${gameState.currentPresident || 'none'}:${gameState.executivePower || currentAction || 'watch'}`;
    default:
      return null;
  }
}

export default function GameOverlay({
  gameState,
  playerId,
  directorState,
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
  const sheetDragControls = useDragControls();
  const me = gameState.players.find((player) => player.id === myActualId);
  const currentChancellor = gameState.players.find(
    (player) => player.id === gameState.currentChancellor || player.id === gameState.nominatedChancellor
  );
  const primaryInstruction = directorState?.primaryInstruction;
  const currentBallotKey = `${gameState.phase}:${gameState.currentPresident || 'none'}:${gameState.nominatedChancellor || gameState.currentChancellor || 'none'}`;
  const [pendingVote, setPendingVote] = useState(null);
  const [dismissedSpotlightKey, setDismissedSpotlightKey] = useState(null);
  const [dismissedVoteDeskKey, setDismissedVoteDeskKey] = useState(null);
  const displayPhase = gameState.phase;
  const activePendingVote =
    pendingVote?.ballotKey === currentBallotKey &&
    gameState.phase === PHASES.VOTING &&
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
  let privateAudience = 'You';
  let voteStatusPill = null;

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
        if (me?.isAlive && !me?.hasVoted) {
          title = activePendingVote ? 'Locking Vote' : 'Cast Vote';
          subtext = activePendingVote
            ? `Submitting ${activePendingVote === 'YA' ? 'Ja' : 'Nein'} now.`
            : `Approve or reject ${currentChancellor?.name || 'the proposed government'}.`;
          isActive = true;
          privateAudience = 'Your Ballot';
          actionContent = (
            <div className="mt-5 grid w-full max-w-sm grid-cols-2 gap-4">
              <motion.button
                key="vote-ya"
                type="button"
                initial={{ opacity: 0, x: -20, rotate: -4 }}
                animate={{ opacity: 1, x: 0, rotate: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                onClick={() => handleVoteSelection(true)}
                disabled={Boolean(activePendingVote)}
                aria-pressed={activePendingVote === 'YA'}
                className={`group relative flex min-h-[140px] flex-col items-center justify-center rounded-[28px] border bg-black/40 p-4 shadow-2xl transition-all active:scale-[0.96] ${
                  activePendingVote === 'YA'
                    ? 'border-cyan-400 ring-2 ring-cyan-400/30'
                    : 'border-white/10 hover:border-cyan-400/50 hover:bg-white/[0.03]'
                } ${activePendingVote ? 'cursor-wait opacity-50' : ''}`}
              >
                <div className="absolute inset-0 paper-grain opacity-10 pointer-events-none" />
                <img
                  src="/assets/vote-yes.png"
                  alt="Ja"
                  loading="eager"
                  decoding="async"
                  className={`w-full max-w-[100px] transition-transform duration-500 ${activePendingVote === 'YA' ? 'scale-110' : 'group-hover:scale-105'}`}
                />
                <span className={`mt-3 text-[10px] font-mono font-black uppercase tracking-[0.2em] transition-colors ${activePendingVote === 'YA' ? 'text-cyan-400' : 'text-white/40 group-hover:text-cyan-300'}`}>
                  Approve (Ja)
                </span>
                {activePendingVote === 'YA' && (
                  <motion.div
                    layoutId="vote-glow"
                    className="absolute inset-0 rounded-[28px] bg-cyan-400/5 blur-xl pointer-events-none"
                  />
                )}
              </motion.button>

              <motion.button
                key="vote-nein"
                type="button"
                initial={{ opacity: 0, x: 20, rotate: 4 }}
                animate={{ opacity: 1, x: 0, rotate: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                onClick={() => handleVoteSelection(false)}
                disabled={Boolean(activePendingVote)}
                aria-pressed={activePendingVote === 'NEIN'}
                className={`group relative flex min-h-[140px] flex-col items-center justify-center rounded-[28px] border bg-black/40 p-4 shadow-2xl transition-all active:scale-[0.96] ${
                  activePendingVote === 'NEIN'
                    ? 'border-red-500 ring-2 ring-red-500/30'
                    : 'border-white/10 hover:border-red-500/50 hover:bg-white/[0.03]'
                } ${activePendingVote ? 'cursor-wait opacity-50' : ''}`}
              >
                <div className="absolute inset-0 paper-grain opacity-10 pointer-events-none" />
                <img
                  src="/assets/vote-no.png"
                  alt="Nein"
                  loading="eager"
                  decoding="async"
                  className={`w-full max-w-[100px] transition-transform duration-500 ${activePendingVote === 'NEIN' ? 'scale-110' : 'group-hover:scale-105'}`}
                />
                <span className={`mt-3 text-[10px] font-mono font-black uppercase tracking-[0.2em] transition-colors ${activePendingVote === 'NEIN' ? 'text-red-400' : 'text-white/40 group-hover:text-red-400'}`}>
                  Reject (Nein)
                </span>
                {activePendingVote === 'NEIN' && (
                  <motion.div
                    layoutId="vote-glow"
                    className="absolute inset-0 rounded-[28px] bg-red-400/5 blur-xl pointer-events-none"
                  />
                )}
              </motion.button>

              {activePendingVote && (
                <div className="col-span-2 flex items-center justify-center gap-3 pt-3 text-[9px] font-mono font-black uppercase tracking-[0.24em] text-white/30">
                  <motion.span 
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className={`h-2 w-2 rounded-full ${activePendingVote === 'YA' ? 'bg-cyan-400' : 'bg-red-500'}`} 
                  />
                  Transmitting Ballot...
                </div>
              )}
            </div>
          );
        } else {
          voteStatusPill = me?.isAlive
            ? {
                label: 'Vote Locked',
                description: 'Your ballot is locked in. The table is resolving the rest.',
              }
            : me
              ? {
                  label: 'Observer',
                  description: 'You are watching this vote only.',
                }
              : null;
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
            <div className="mt-4 grid w-full max-w-sm grid-cols-1 gap-3 min-[360px]:grid-cols-2">
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

  const hasActionContent = Boolean(actionContent || pendingSelection);
  const votingDrawerKey =
    displayPhase === PHASES.VOTING && me?.isAlive && !me?.hasVoted && hasActionContent
      ? `vote:${currentBallotKey}`
      : null;

  const waitingForPrivateActionPayload =
    !pendingSelection &&
    ((displayPhase === PHASES.LEGISLATIVE_PRESIDENT && isPresident && !gameState.drawnCards?.length) ||
      (displayPhase === PHASES.LEGISLATIVE_CHANCELLOR &&
        isChancellor &&
        !gameState.vetoRequested &&
        !gameState.drawnCards?.length) ||
      (displayPhase === PHASES.EXECUTIVE_ACTION &&
        isPresident &&
        gameState.executivePower === 'PEEK' &&
        !gameState.peekedPolicies?.length));
  const spotlightTone =
    pendingSelection || displayPhase === PHASES.EXECUTIVE_ACTION
      ? 'red'
      : displayPhase === PHASES.VOTING
        ? 'blue'
        : 'neutral';
  const spotlightVisibility =
    displayPhase === PHASES.VOTING
      ? 'public'
      : primaryInstruction?.visibility || (hasActionContent ? 'private' : 'public');
  const spotlightAudienceLabel = hasActionContent ? privateAudience : spotlightVisibility === 'private' ? 'You' : 'Table';
  const spotlightAutoCloseMs = ACTIONABLE_SPOTLIGHT_MS;
  const spotlightActions =
    !pendingSelection && Array.isArray(primaryInstruction?.actions)
      ? primaryInstruction.actions.map((action) => action.label)
      : [];
  const spotlightKey =
    !isActive || pendingSelection || waitingForPrivateActionPayload || !hasActionContent || displayPhase === PHASES.VOTING
      ? null
      : getSpotlightSceneId({
          displayPhase,
          gameState,
          currentBallotKey,
          currentAction: directorState?.currentAction,
          hasActionContent,
          isPresident,
          isChancellor,
        });
  const spotlightVisible =
    Boolean(spotlightKey) &&
    spotlightKey !== dismissedSpotlightKey;
  const votingDeskDismissible = Boolean(votingDrawerKey);
  const voteDeskHidden = votingDeskDismissible && dismissedVoteDeskKey === votingDrawerKey;
  const deskBadgeLabel = displayPhase === PHASES.VOTING ? 'Vote Desk' : 'Action Desk';
  const deskScopeLabel =
    displayPhase === PHASES.VOTING
      ? 'Board Overlay — Live Ballot'
      : `Private Channel — ${privateAudience}`;
  const reopenChipLabel = 'Open Vote';
  const showActionDesk = hasActionContent && !spotlightVisible && !voteDeskHidden;

  if (!isActive && !voteStatusPill) return null;

  return (
    <AnimatePresence>
      {spotlightVisible && (
        <StageSpotlight
          key={spotlightKey}
          stageLabel={directorState?.stageLabel || 'Live Match'}
          timelineLabel={directorState?.timelinePositionLabel}
          title={title}
          description={subtext}
          audienceLabel={spotlightAudienceLabel}
          visibility={spotlightVisibility}
          actionLabels={spotlightActions}
          tone={spotlightTone}
          autoCloseMs={spotlightAutoCloseMs}
          onDismiss={() => setDismissedSpotlightKey(spotlightKey)}
        />
      )}

      {showActionDesk && (
        <div
          className="fixed inset-x-0 bottom-0 z-[110] flex justify-center px-2 pointer-events-none sm:px-4"
        >
          <motion.div
            key={`desk-${votingDrawerKey || displayPhase}-${pendingSelection?.type || 'base'}`}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 190, damping: 28, mass: 0.9 }}
            drag={votingDeskDismissible ? 'y' : false}
            dragControls={sheetDragControls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.18 }}
            dragMomentum={false}
            onDragEnd={(_, info) => {
              if (!votingDeskDismissible) return;
              if (info.offset.y > SHEET_DISMISS_DRAG_OFFSET || info.velocity.y > SHEET_DISMISS_DRAG_VELOCITY) {
                triggerHaptic('soft');
                setDismissedVoteDeskKey(votingDrawerKey);
              }
            }}
            className={`pointer-events-auto relative flex min-w-0 max-h-[calc(var(--app-vh)-var(--app-header-offset)-16px)] w-full max-w-[760px] flex-col overflow-hidden rounded-t-[32px] border shadow-[0_-32px_80px_rgba(0,0,0,0.65)] px-4 pt-2 pb-[calc(var(--app-safe-bottom)+1.2rem)] sm:px-6 sm:pt-3 sm:pb-[calc(var(--app-safe-bottom)+1.6rem)] transition-all ${
              displayPhase === PHASES.VOTING
                ? 'border-cyan-500/20 bg-[linear-gradient(180deg,#0a1016_0%,#05080b_100%)]'
                : 'border-[#d4c098]/32 bg-[linear-gradient(180deg,#efe5d3_0%,#e5d8c1_100%)]'
            }`}
            style={{
              boxShadow: displayPhase === PHASES.VOTING 
                ? '0 -32px 80px rgba(0,0,0,0.7), 0 0 100px rgba(34,211,238,0.06)' 
                : '0 -24px 60px rgba(0,0,0,0.55)'
            }}
          >
            <div className={`absolute inset-0 paper-grain pointer-events-none ${displayPhase === PHASES.VOTING ? 'opacity-[0.05]' : 'opacity-10'}`} />

            <div className="relative z-10 flex items-center justify-center pt-1">
              <button
                type="button"
                onPointerDown={(event) => {
                  if (!votingDeskDismissible) return;
                  event.stopPropagation();
                  sheetDragControls.start(event);
                }}
                disabled={!votingDeskDismissible}
                className={`flex h-8 w-full max-w-[120px] items-center justify-center rounded-full ${votingDeskDismissible ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}
                aria-label={votingDeskDismissible ? 'Swipe down to close sheet' : 'Sheet handle'}
                style={votingDeskDismissible ? { touchAction: 'none' } : undefined}
              >
                <span className={`h-1.5 w-14 rounded-full ${displayPhase === PHASES.VOTING ? 'bg-cyan-400/20' : 'bg-black/10'}`} />
              </button>
            </div>

            <div className="relative z-10 shrink-0">
              <div className="flex min-w-0 items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex min-w-0 flex-wrap items-center gap-2 text-[8px] font-mono font-black uppercase tracking-[0.22em] sm:text-[9px]">
                    <span className={`rounded-full border px-2.5 py-1 ${
                      displayPhase === PHASES.VOTING
                        ? 'border-cyan-400/25 bg-cyan-400/10 text-cyan-300'
                        : 'border-[#c1272d]/18 bg-[#c1272d]/10 text-[#8a001d]'
                    }`}>
                      {deskBadgeLabel}
                    </span>
                    <span className={displayPhase === PHASES.VOTING ? 'text-white/35' : 'text-[#7a6b57]'}>
                      {deskScopeLabel}
                    </span>
                  </div>

                  <FactionAccentText
                    as="h2"
                    className={`mt-2 text-[15px] font-black uppercase tracking-[0.14em] sm:text-[18px] ${
                      displayPhase === PHASES.VOTING ? 'text-white' : 'text-[#2c2c2c] font-serif'
                    }`}
                  >
                    {title}
                  </FactionAccentText>

                  {subtext && (
                    <FactionAccentText
                      as="p"
                      className={`mt-1 max-w-[44rem] text-[10px] leading-relaxed sm:text-[11px] ${
                        displayPhase === PHASES.VOTING ? 'text-white/55' : 'text-[#5f5449]'
                      }`}
                    >
                      {subtext}
                    </FactionAccentText>
                  )}
                </div>

                {votingDeskDismissible && (
                  <button
                    type="button"
                    onClick={runWithHaptic(() => setDismissedVoteDeskKey(votingDrawerKey), 'soft')}
                    className={`shrink-0 rounded-full border px-3 py-1.5 text-[9px] font-mono font-black uppercase tracking-[0.2em] transition-colors active:scale-[0.98] ${
                      displayPhase === PHASES.VOTING
                        ? 'border-white/10 bg-white/5 text-white/50 hover:bg-white/10'
                        : 'border-black/10 bg-black/5 text-[#5f5449] hover:bg-black/10'
                    }`}
                  >
                    Hide
                  </button>
                )}
              </div>
            </div>

            <div className="relative z-10 mt-5 min-h-0 flex-1 overflow-y-auto pr-1 scrollbar-hide">
              {actionContent && (
                <div className="flex justify-center">
                  {actionContent}
                </div>
              )}

              {pendingSelection && (
                <div className={`grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 ${actionContent ? 'mt-6' : ''}`}>
                  <button
                    type="button"
                    onClick={runWithHaptic(onConfirm, 'confirm')}
                    className="rounded-xl border border-[#8a001d] bg-[#c1272d] px-4 py-3.5 text-[11px] font-serif font-black uppercase tracking-[0.18em] text-white shadow-lg transition-colors hover:bg-[#a01d22] active:scale-[0.98]"
                  >
                    Confirm
                  </button>
                  <button
                    type="button"
                    onClick={runWithHaptic(onCancel, 'soft')}
                    className="rounded-xl border border-[#b09868] bg-[#d4c098] px-4 py-3.5 text-[11px] font-serif font-black uppercase tracking-[0.18em] text-[#2c2c2c] shadow-lg transition-colors hover:bg-[#c4ae7d] active:scale-[0.98]"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {voteStatusPill && !showActionDesk && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="fixed inset-x-0 bottom-[calc(var(--app-safe-bottom)+0.75rem)] z-[108] flex justify-center px-3 pointer-events-none"
        >
          <div className="pointer-events-auto max-w-[320px] rounded-full border border-white/10 bg-[linear-gradient(180deg,rgba(14,22,31,0.96)_0%,rgba(9,15,21,0.94)_100%)] px-4 py-2 shadow-[0_14px_30px_rgba(0,0,0,0.32)] backdrop-blur-sm">
            <div className="flex items-center justify-center gap-2 text-[9px] font-mono font-black uppercase tracking-[0.18em] text-cyan-100">
              <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(103,232,249,0.42)]" />
              <span>{voteStatusPill.label}</span>
            </div>
            <FactionAccentText as="p" className="mt-1 text-center text-[10px] leading-relaxed text-white/62">
              {voteStatusPill.description}
            </FactionAccentText>
          </div>
        </motion.div>
      )}

      {voteDeskHidden && (
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 18 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="fixed inset-x-0 bottom-[calc(var(--app-safe-bottom)+0.75rem)] z-[108] flex justify-center px-3 pointer-events-none"
        >
          <button
            type="button"
            onClick={runWithHaptic(() => setDismissedVoteDeskKey(null), 'selection')}
            className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-cyan-300/18 bg-[linear-gradient(180deg,rgba(14,22,31,0.96)_0%,rgba(9,15,21,0.94)_100%)] px-4 py-2 text-[10px] font-mono font-black uppercase tracking-[0.22em] text-cyan-100 shadow-[0_14px_30px_rgba(0,0,0,0.32)]"
          >
            <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(103,232,249,0.45)]" />
            {reopenChipLabel}
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
