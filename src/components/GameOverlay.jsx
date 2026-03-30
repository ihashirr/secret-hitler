import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useDragControls } from 'framer-motion';
import { EXECUTIVE_POWERS, PHASES } from '../lib/constants';
import { triggerHaptic } from '../lib/haptics';
import FactionAccentText from './FactionAccentText';
import StageSpotlight from './StageSpotlight';

const NOMINATION_LOCKED_MS = 1500;
const VETO_REQUEST_MS = 1700;
const EXECUTION_BEAT_MS = 1800;
const SHEET_DISMISS_DRAG_OFFSET = 120;
const SHEET_DISMISS_DRAG_VELOCITY = 720;
const SHEET_ENTER_Y = 64;
const SHEET_EXIT_Y = 84;
const SHEET_MOTION_EASE = [0.22, 1, 0.36, 1];
const SHEET_MOTION_TRANSITION = {
  type: 'tween',
  duration: 0.26,
  ease: SHEET_MOTION_EASE,
};

const getPlayerName = (gameState, playerId, fallback = 'Someone') =>
  gameState?.players?.find((player) => player.id === playerId)?.name || fallback;

const createStoryBeat = ({ key, stageLabel, title, description, tone = 'neutral', autoCloseMs, compact = true }) => ({
  key,
  stageLabel,
  title,
  description,
  tone,
  autoCloseMs,
  compact,
});

function getExecutiveBeat(gameState) {
  if (gameState.executivePower !== EXECUTIVE_POWERS.EXECUTION) {
    return null;
  }

  const presidentName = getPlayerName(gameState, gameState.currentPresident, 'The President');

  switch (gameState.executivePower) {
    case EXECUTIVE_POWERS.EXECUTION:
      return createStoryBeat({
        key: `story:executive-execution:${gameState.currentPresident || 'none'}`,
        stageLabel: 'Executive Action',
        title: `${presidentName} Is Choosing An Execution`,
        description: 'The President is eliminating one player from the table.',
        tone: 'red',
        autoCloseMs: EXECUTION_BEAT_MS,
      });
    default:
      return null;
  }
}

function getStoryBeatFromTransition(previous, gameState) {
  if (!previous) return null;

  const presidentName = getPlayerName(gameState, gameState.currentPresident, 'The President');
  const nomineeName = getPlayerName(gameState, gameState.nominatedChancellor, 'the nominee');
  const chancellorName = getPlayerName(gameState, gameState.currentChancellor || gameState.nominatedChancellor, 'the Chancellor');

  if (previous.nominatedChancellor !== gameState.nominatedChancellor && gameState.nominatedChancellor) {
    return createStoryBeat({
      key: `story:nominated:${gameState.currentPresident || 'none'}:${gameState.nominatedChancellor}`,
      stageLabel: 'Nomination Locked',
      title: `${presidentName} Nominated ${nomineeName}`,
      description: 'The ballot is locked. The table is moving into a government vote.',
      tone: 'blue',
      autoCloseMs: NOMINATION_LOCKED_MS,
    });
  }

  if (!previous.vetoRequested && gameState.vetoRequested) {
    return createStoryBeat({
      key: `story:veto-request:${gameState.currentPresident || 'none'}:${gameState.currentChancellor || 'none'}`,
      stageLabel: 'Veto Request',
      title: `${chancellorName} Requested A Veto`,
      description: `${presidentName} must now accept or reject the veto request.`,
      tone: 'red',
      autoCloseMs: VETO_REQUEST_MS,
    });
  }

  if (previous.phase !== gameState.phase && gameState.phase === PHASES.EXECUTIVE_ACTION) {
    return getExecutiveBeat(gameState);
  }

  return null;
}

function getInitialStoryBeat(gameState) {
  switch (gameState.phase) {
    case PHASES.LEGISLATIVE_CHANCELLOR:
      return gameState.vetoRequested
        ? createStoryBeat({
            key: `story:init-veto-request:${gameState.currentPresident || 'none'}:${gameState.currentChancellor || 'none'}`,
            stageLabel: 'Veto Request',
            title: `${getPlayerName(gameState, gameState.currentChancellor || gameState.nominatedChancellor, 'The Chancellor')} Requested A Veto`,
            description: `${getPlayerName(gameState, gameState.currentPresident, 'The President')} must now accept or reject the veto request.`,
            tone: 'red',
            autoCloseMs: VETO_REQUEST_MS,
          })
        : null;
    case PHASES.EXECUTIVE_ACTION:
      return getExecutiveBeat(gameState);
    default:
      return null;
  }
}

export default function GameOverlay({
  gameState,
  playerId,
  directorState,
  voteRevealActive = false,
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
  const [dismissedVoteDeskKey, setDismissedVoteDeskKey] = useState(null);
  const [storyBeatQueue, setStoryBeatQueue] = useState([]);
  const [activeStoryBeat, setActiveStoryBeat] = useState(null);
  const activeStoryBeatRef = useRef(null);
  const storySnapshotRef = useRef(null);
  const displayPhase = gameState.phase;
  const activePendingVote =
    pendingVote?.ballotKey === currentBallotKey &&
    gameState.phase === PHASES.VOTING &&
    !me?.hasVoted
      ? pendingVote.vote
      : null;

  useEffect(() => {
    activeStoryBeatRef.current = activeStoryBeat;
  }, [activeStoryBeat]);

  useEffect(() => {
    const snapshot = {
      phase: gameState.phase,
      currentPresident: gameState.currentPresident || null,
      nominatedChancellor: gameState.nominatedChancellor || null,
      currentChancellor: gameState.currentChancellor || null,
      executivePower: gameState.executivePower || null,
      vetoRequested: Boolean(gameState.vetoRequested),
      drawPileCount: gameState.drawPileCount,
      roomId: gameState.roomId || null,
    };

    if (!storySnapshotRef.current) {
      storySnapshotRef.current = snapshot;
      const initialBeat = getInitialStoryBeat(gameState);
      if (initialBeat) {
        const timer = window.setTimeout(() => {
          setStoryBeatQueue((current) => (current.length ? current : [initialBeat]));
        }, 0);

        return () => window.clearTimeout(timer);
      }
      return;
    }

    const beat = getStoryBeatFromTransition(storySnapshotRef.current, gameState);
    storySnapshotRef.current = snapshot;

    if (!beat) return;

    const timer = window.setTimeout(() => {
      setStoryBeatQueue((current) => {
        if (activeStoryBeatRef.current?.key === beat.key || current.some((entry) => entry.key === beat.key)) {
          return current;
        }

        return [...current, beat];
      });
    }, 0);

    return () => window.clearTimeout(timer);
  }, [
    gameState,
    gameState.currentChancellor,
    gameState.currentPresident,
    gameState.drawPileCount,
    gameState.executivePower,
    gameState.nominatedChancellor,
    gameState.phase,
    gameState.roomId,
    gameState.vetoRequested,
  ]);

  const visibleActiveStoryBeat = activeStoryBeat;

  useEffect(() => {
    if (visibleActiveStoryBeat || !storyBeatQueue.length || voteRevealActive || (displayPhase === PHASES.VOTING && me?.hasVoted)) return;

    const [nextBeat] = storyBeatQueue;
    const timer = window.setTimeout(() => {
      setActiveStoryBeat(nextBeat);
      setStoryBeatQueue((current) => current.filter((entry) => entry.key !== nextBeat.key));
    }, 0);

    return () => window.clearTimeout(timer);
  }, [displayPhase, me?.hasVoted, storyBeatQueue, visibleActiveStoryBeat, voteRevealActive]);

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
  let actionContent = null;
  let privateAudience = 'You';

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
  } else {
    switch (displayPhase) {
      case PHASES.NOMINATION:
        break;

      case PHASES.VOTING:
        if (me?.isAlive && !me?.hasVoted) {
          title = activePendingVote ? 'Locking Vote' : 'Cast Vote';
          subtext = activePendingVote
            ? `Submitting ${activePendingVote === 'YA' ? 'Ja' : 'Nein'} now.`
            : `Approve or reject ${currentChancellor?.name || 'the proposed government'}.`;
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
                  Transmitting Ballot... Wallah, stay calm.
                </div>
              )}
            </div>
          );
        }
        break;

      case PHASES.LEGISLATIVE_PRESIDENT:
        if (isPresident) {
          title = 'Discard One Policy';
          subtext = 'Select one policy to discard. The remaining two go to the Chancellor.';
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
        }
        break;

      case PHASES.LEGISLATIVE_CHANCELLOR:
        if (isPresident && gameState.vetoRequested) {
          title = 'Respond To Veto';
          subtext = 'Accept to discard both policies and advance the tracker, or reject and force the Chancellor to enact one.';
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
          title = gameState.vetoRequested ? 'Veto Requested' : gameState.vetoRejected ? 'Veto Rejected' : 'Enact One Policy';
          subtext = gameState.vetoRequested
            ? 'Your veto request is pending the President response.'
            : gameState.vetoRejected
              ? 'The President rejected the veto. You must enact one of the remaining policies now.'
            : 'Select the one policy that will be enacted.';
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

                {gameState.vetoAvailable && !gameState.vetoRequested && !gameState.vetoRejected && (
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
        }
        break;

      case PHASES.EXECUTIVE_ACTION:
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
    }
  }

  const hasActionContent = Boolean(actionContent || pendingSelection);
  const votingDrawerKey =
    displayPhase === PHASES.VOTING && me?.isAlive && !me?.hasVoted && hasActionContent
      ? `vote:${currentBallotKey}`
      : null;
  const spotlightVisible = Boolean(visibleActiveStoryBeat);
  const votingDeskDismissible = Boolean(votingDrawerKey);
  const voteDeskHidden = votingDeskDismissible && dismissedVoteDeskKey === votingDrawerKey;
  const deskBadgeLabel = displayPhase === PHASES.VOTING ? 'Vote Desk' : 'Action Desk';
  const deskScopeLabel =
    displayPhase === PHASES.VOTING
      ? 'Board Overlay — Live Ballot'
      : `Private Channel — ${privateAudience}`;
  const reopenChipLabel = 'Open Vote';
  const showActionDesk = hasActionContent && !spotlightVisible && !voteDeskHidden;
  const showVoteDeskReopenChip = voteDeskHidden && !spotlightVisible;

  if (!visibleActiveStoryBeat && !showActionDesk && !showVoteDeskReopenChip) return null;

  return (
    <AnimatePresence>
      {visibleActiveStoryBeat && (
        <StageSpotlight
          key={visibleActiveStoryBeat.key}
          stageLabel={visibleActiveStoryBeat.stageLabel}
          title={visibleActiveStoryBeat.title}
          description={visibleActiveStoryBeat.description}
          audienceLabel="Table"
          visibility="public"
          tone={visibleActiveStoryBeat.tone}
          autoCloseMs={visibleActiveStoryBeat.autoCloseMs}
          compact={visibleActiveStoryBeat.compact}
          enforceMinimum={false}
          onDismiss={() => setActiveStoryBeat(null)}
        />
      )}

      {showActionDesk && (
        <div
          className="fixed inset-x-0 bottom-0 z-[110] flex justify-center px-2 pointer-events-none sm:px-4"
        >
          <motion.div
            key={`desk-${votingDrawerKey || displayPhase}-${pendingSelection?.type || 'base'}`}
            initial={{ opacity: 0, y: SHEET_ENTER_Y }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: SHEET_EXIT_Y }}
            transition={SHEET_MOTION_TRANSITION}
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
            className={`pointer-events-auto relative flex min-w-0 w-full max-w-[760px] transform-gpu will-change-transform flex-col overflow-hidden rounded-t-[32px] border shadow-[0_-32px_80px_rgba(0,0,0,0.65)] px-4 pt-2 ${
              displayPhase === PHASES.VOTING
                ? 'border-cyan-500/20 bg-[linear-gradient(180deg,#0a1016_0%,#05080b_100%)]'
                : 'border-[#d4c098]/32 bg-[linear-gradient(180deg,#efe5d3_0%,#e5d8c1_100%)]'
            }`}
            style={{
              maxHeight: 'calc(var(--app-vh) - var(--app-header-offset) - 10px)',
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

            <div 
              className="app-scroll-y relative z-10 mt-5 min-h-0 flex-1 pr-1 pb-[calc(var(--app-safe-bottom)+2rem)]"
              style={{ touchAction: 'pan-y' }}
            >
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

      {showVoteDeskReopenChip && (
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
