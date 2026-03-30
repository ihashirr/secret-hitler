import { useState } from 'react';
import { AnimatePresence, motion, useDragControls } from 'framer-motion';
import { MAX_ELECTION_TRACKER, PHASES } from '../lib/constants';
import { triggerHaptic } from '../lib/haptics';
import FactionAccentText from './FactionAccentText';
import StageSpotlight from './StageSpotlight';
import {
  GOVERNMENT_FORMATION_BANDS,
  GOVERNMENT_FORMATION_SPARKS,
  GOVERNMENT_FRACTURE_LINES,
  GOVERNMENT_FRACTURE_SHARDS,
} from '../features/game-board/boardConfig';

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
  revealState,
  revealedVoteIds,
  revealedVoteTotals,
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
  const aliveCount = gameState.players.filter((player) => player.isAlive).length;
  const revealProgressTotal = revealedVoteTotals.YA + revealedVoteTotals.NEIN;
  const revealJaPercent = revealProgressTotal ? (revealedVoteTotals.YA / revealProgressTotal) * 100 : 0;
  const revealNeinPercent = revealProgressTotal ? (revealedVoteTotals.NEIN / revealProgressTotal) * 100 : 0;
  const revealIsApproved = revealState?.result === 'APPROVED';
  const revealNextStep =
    revealIsApproved
      ? gameState.phase === PHASES.GAME_OVER
        ? 'Hitler took office. The match ends here.'
        : gameState.phase === PHASES.LEGISLATIVE_PRESIDENT
          ? 'President is selecting which policies move forward.'
          : gameState.phase === PHASES.LEGISLATIVE_CHANCELLOR
            ? 'Chancellor is deciding the final policy.'
            : 'The government moves into the legislative session.'
      : gameState.chaosTriggered && gameState.chaosPolicy
        ? `Chaos auto-enacted a ${gameState.chaosPolicy.toLowerCase()} policy.`
        : `Election tracker advances to ${gameState.electionTracker}/${MAX_ELECTION_TRACKER}.`;
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
    isActive = true;
  } else if (revealState) {
    title = revealIsApproved ? 'Government Elected' : 'Vote Failed';
    subtext = revealNextStep;
    isActive = true;
    privateAudience = 'Table';
    actionContent = (
      <div className="w-full max-w-2xl">
        <div
          className={`relative overflow-hidden rounded-[26px] border px-4 py-4 shadow-[0_24px_60px_rgba(0,0,0,0.22)] sm:px-5 sm:py-5 ${
            revealIsApproved
              ? 'border-cyan-300/22 bg-[linear-gradient(180deg,rgba(8,17,24,0.98)_0%,rgba(8,13,19,0.96)_100%)]'
              : 'border-red-400/22 bg-[linear-gradient(180deg,rgba(25,8,10,0.98)_0%,rgba(15,8,9,0.96)_100%)]'
          }`}
        >
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {revealIsApproved ? (
              <>
                <motion.div
                  initial={{ opacity: 0, scale: 0.72 }}
                  animate={{ opacity: [0, 0.42, 0.12], scale: [0.72, 1.14, 1.28] }}
                  transition={{ duration: 1.3, ease: 'easeOut' }}
                  className="absolute left-1/2 top-[36%] h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-300/18"
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: [0, 0.24, 0], scale: [0.8, 1.05, 1.2] }}
                  transition={{ duration: 1.45, ease: 'easeOut', delay: 0.08 }}
                  className="absolute left-1/2 top-[36%] h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-300/10"
                />
                {GOVERNMENT_FORMATION_BANDS.map((top, index) => (
                  <div key={`formation-band-${top}`} className="contents">
                    <motion.div
                      initial={{ opacity: 0, scaleX: 0.2, x: -28 }}
                      animate={{ opacity: [0, 0.5, 0.12], scaleX: [0.2, 1, 1], x: [-28, 0, 0] }}
                      transition={{ duration: 0.9, ease: 'easeOut', delay: index * 0.05 }}
                      className="absolute left-0 h-px origin-right bg-[linear-gradient(90deg,transparent_0%,rgba(103,232,249,0.32)_100%)]"
                      style={{ top: `${top}%`, width: '42%' }}
                    />
                    <motion.div
                      initial={{ opacity: 0, scaleX: 0.2, x: 28 }}
                      animate={{ opacity: [0, 0.5, 0.12], scaleX: [0.2, 1, 1], x: [28, 0, 0] }}
                      transition={{ duration: 0.9, ease: 'easeOut', delay: index * 0.05 }}
                      className="absolute right-0 h-px origin-left bg-[linear-gradient(90deg,rgba(103,232,249,0.32)_0%,transparent_100%)]"
                      style={{ top: `${top}%`, width: '42%' }}
                    />
                  </div>
                ))}
                {GOVERNMENT_FORMATION_SPARKS.map((spark, index) => (
                  <motion.span
                    key={`formation-spark-${index}`}
                    initial={{ opacity: 0, scale: 0.4, y: 10 }}
                    animate={{ opacity: [0, 0.8, 0], scale: [0.4, 1, 0.7], y: [10, -8, -18] }}
                    transition={{ duration: 1.05, ease: 'easeOut', delay: spark.delay }}
                    className="absolute h-2 w-2 rounded-full bg-cyan-200 shadow-[0_0_18px_rgba(103,232,249,0.6)]"
                    style={{ left: spark.left, top: spark.top }}
                  />
                ))}
              </>
            ) : (
              <>
                <motion.div
                  initial={{ opacity: 0, scale: 0.82 }}
                  animate={{ opacity: [0, 0.22, 0], scale: [0.82, 1.18, 1.28] }}
                  transition={{ duration: 0.9, ease: 'easeOut' }}
                  className="absolute left-1/2 top-[38%] h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full border border-red-300/10"
                />
                {GOVERNMENT_FRACTURE_LINES.map((line, index) => (
                  <motion.div
                    key={`fracture-line-${index}`}
                    initial={{ opacity: 0, scaleX: 0.25 }}
                    animate={{ opacity: [0, 0.5, 0.18], scaleX: [0.25, 1, 1.04] }}
                    transition={{ duration: 0.75, ease: 'easeOut', delay: line.delay }}
                    className="absolute h-px origin-center bg-[linear-gradient(90deg,transparent_0%,rgba(248,113,113,0.82)_20%,rgba(255,255,255,0.22)_50%,rgba(248,113,113,0.82)_80%,transparent_100%)]"
                    style={{ top: line.top, left: line.left, width: line.width, rotate: `${line.rotate}deg` }}
                  />
                ))}
                {GOVERNMENT_FRACTURE_SHARDS.map((shard, index) => (
                  <motion.span
                    key={`fracture-shard-${index}`}
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{
                      opacity: [0, 0.55, 0],
                      scale: [0.7, 1, 0.9],
                      x: [0, shard.x],
                      y: [0, shard.y],
                      rotate: [shard.rotate, shard.rotate + (index % 2 === 0 ? -12 : 12)],
                    }}
                    transition={{ duration: 0.82, ease: 'easeOut', delay: shard.delay }}
                    className="absolute rounded-full border border-red-200/12 bg-red-300/18 shadow-[0_0_20px_rgba(248,113,113,0.22)]"
                    style={{
                      left: shard.left,
                      top: shard.top,
                      width: `${shard.width}px`,
                      height: `${shard.height}px`,
                    }}
                  />
                ))}
              </>
            )}
          </div>

          <div className="relative z-10">
            <div className="flex flex-wrap items-center gap-2 text-[8px] font-mono font-black uppercase tracking-[0.22em]">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white/68">
                {revealIsApproved ? 'Government Formed' : 'Government Broken'}
              </span>
              <span className="rounded-full border border-white/10 bg-black/16 px-3 py-1 text-white/52">
                {revealState.ya} Ja • {revealState.nein} Nein
              </span>
            </div>

            <div className="mt-4 rounded-[22px] border border-white/8 bg-black/22 px-4 py-4">
              <div className="relative h-4 overflow-hidden rounded-full bg-white/8">
                <motion.div
                  initial={false}
                  animate={{ width: `${revealJaPercent}%` }}
                  transition={{ type: 'spring', stiffness: 160, damping: 24 }}
                  className="absolute inset-y-0 left-0 bg-[linear-gradient(90deg,#36d7ff_0%,#87bfff_100%)]"
                />
                <motion.div
                  initial={false}
                  animate={{ width: `${revealNeinPercent}%` }}
                  transition={{ type: 'spring', stiffness: 160, damping: 24 }}
                  className="absolute inset-y-0 right-0 bg-[linear-gradient(90deg,#f87171_0%,#c1272d_100%)]"
                />
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3 text-sm font-mono font-black uppercase tracking-[0.16em]">
                <div className="rounded-2xl border border-cyan-300/16 bg-cyan-300/8 px-3 py-2 text-cyan-100">
                  <span className="block text-[9px] tracking-[0.22em] text-cyan-100/60">Ja</span>
                  <span className="mt-1 block text-lg">{revealedVoteTotals.YA}</span>
                </div>
                <div className="rounded-2xl border border-red-400/16 bg-red-500/8 px-3 py-2 text-red-100">
                  <span className="block text-[9px] tracking-[0.22em] text-red-100/60">Nein</span>
                  <span className="mt-1 block text-lg">{revealedVoteTotals.NEIN}</span>
                </div>
              </div>

              <FactionAccentText
                as="p"
                className="mt-3 text-center text-[10px] font-mono font-black uppercase tracking-[0.18em] text-white/45"
              >
                {revealProgressTotal < aliveCount
                  ? `Revealing votes ${revealedVoteIds.length}/${aliveCount}`
                  : revealNextStep}
              </FactionAccentText>
            </div>
          </div>
        </div>
      </div>
    );
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
                  Sending vote...
                </div>
              )}
            </div>
          );
        } else {
          title = me?.isAlive ? 'Vote Locked' : 'Observer Only';
          if (me && !me.isAlive) {
            subtext = 'You have been eliminated. Watch the table, but you do not vote anymore.';
          } else {
            subtext = 'Your ballot is locked in. The board stays live while the rest of the table votes.';
          }
          isActive = true;
          privateAudience = me?.isAlive ? 'Vote Desk' : 'Observer View';
          actionContent = (
            <div className="w-full max-w-md">
              <div className="rounded-[24px] border border-black/8 bg-black/[0.04] px-4 py-4 text-center shadow-[inset_0_0_0_1px_rgba(0,0,0,0.03)]">
                <p className="text-[10px] font-mono font-black uppercase tracking-[0.2em] text-[#5f5449]">
                  {me?.isAlive ? 'Ballot Submitted' : 'Observer Mode'}
                </p>
                <FactionAccentText as="p" className="mt-3 text-sm leading-relaxed text-[#5f5449]">
                  {subtext}
                </FactionAccentText>
              </div>
            </div>
          );
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
    displayPhase === PHASES.VOTING && !revealState && hasActionContent
      ? `vote:${currentBallotKey}`
      : null;
  const voteResultDrawerKey = revealState ? `vote-result:${revealState.id}` : null;
  const dismissibleDeskKey = voteResultDrawerKey || votingDrawerKey;

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
    revealState || displayPhase === PHASES.VOTING
      ? 'public'
      : primaryInstruction?.visibility || (hasActionContent ? 'private' : 'public');
  const spotlightAudienceLabel = hasActionContent ? privateAudience : spotlightVisibility === 'private' ? 'You' : 'Table';
  const spotlightAutoCloseMs = ACTIONABLE_SPOTLIGHT_MS;
  const spotlightActions =
    !pendingSelection && Array.isArray(primaryInstruction?.actions)
      ? primaryInstruction.actions.map((action) => action.label)
      : [];
  const spotlightKey =
    !isActive || pendingSelection || revealState || waitingForPrivateActionPayload || !hasActionContent || displayPhase === PHASES.VOTING
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
  const votingDeskDismissible = Boolean(dismissibleDeskKey);
  const voteDeskHidden = votingDeskDismissible && dismissedVoteDeskKey === dismissibleDeskKey;
  const deskBadgeLabel = revealState ? 'Vote Result' : displayPhase === PHASES.VOTING ? 'Vote Desk' : 'Action Desk';
  const deskScopeLabel =
    revealState
      ? 'Board Overlay — Table Summary'
      : displayPhase === PHASES.VOTING
        ? me?.isAlive
          ? 'Board Overlay — Live Ballot'
          : 'Board Overlay — Observer View'
        : `Private Channel — ${privateAudience}`;
  const reopenChipLabel = revealState ? 'Open Result' : 'Open Vote';
  const showActionDesk = hasActionContent && !spotlightVisible && !voteDeskHidden;

  if (!isActive) return null;

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
            key={`desk-${dismissibleDeskKey || displayPhase}-${pendingSelection?.type || 'base'}`}
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
                setDismissedVoteDeskKey(dismissibleDeskKey);
              }
            }}
            className="pointer-events-auto relative flex min-w-0 max-h-[calc(var(--app-vh)-var(--app-header-offset)-16px)] w-full max-w-[760px] flex-col overflow-hidden rounded-t-[28px] border border-[#d4c098]/32 bg-[linear-gradient(180deg,#efe5d3_0%,#e5d8c1_100%)] px-4 pt-2 pb-[calc(var(--app-safe-bottom)+1rem)] shadow-[0_-24px_60px_rgba(0,0,0,0.55)] sm:px-6 sm:pt-3 sm:pb-[calc(var(--app-safe-bottom)+1.4rem)]"
          >
            <div className="absolute inset-0 paper-grain opacity-10 pointer-events-none" />

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
                <span className="h-1.5 w-14 rounded-full bg-black/10" />
              </button>
            </div>

            <div className="relative z-10 shrink-0">
              <div className="flex min-w-0 items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex min-w-0 flex-wrap items-center gap-2 text-[8px] font-mono font-black uppercase tracking-[0.22em] sm:text-[9px]">
                    <span className="rounded-full border border-[#c1272d]/18 bg-[#c1272d]/10 px-2 py-0.5 text-[#8a001d]">
                      {deskBadgeLabel}
                    </span>
                    <span className="text-[#7a6b57]">{deskScopeLabel}</span>
                  </div>

                  <FactionAccentText
                    as="h2"
                    className="mt-2 text-[13px] font-serif font-black uppercase tracking-[0.12em] text-[#2c2c2c] sm:text-[15px]"
                  >
                    {title}
                  </FactionAccentText>

                  {subtext && (
                    <FactionAccentText
                      as="p"
                      className="mt-1 max-w-[44rem] text-[10px] leading-relaxed text-[#5f5449] sm:text-[11px]"
                    >
                      {subtext}
                    </FactionAccentText>
                  )}
                </div>

                {votingDeskDismissible && (
                  <button
                    type="button"
                    onClick={runWithHaptic(() => setDismissedVoteDeskKey(dismissibleDeskKey), 'soft')}
                    className="shrink-0 rounded-full border border-black/10 bg-black/5 px-3 py-1.5 text-[9px] font-mono font-black uppercase tracking-[0.2em] text-[#5f5449] transition-colors hover:bg-black/10 active:scale-[0.98]"
                  >
                    Hide
                  </button>
                )}
              </div>
            </div>

            <div className="relative z-10 mt-4 min-h-0 flex-1 overflow-y-auto pr-1 scrollbar-hide">
              {actionContent && (
                <div className="flex justify-center">
                  {actionContent}
                </div>
              )}

              {pendingSelection && (
                <div className={`grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 ${actionContent ? 'mt-5' : ''}`}>
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
        </div>
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
