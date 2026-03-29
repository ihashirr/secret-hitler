import React from 'react';
import { AnimatePresence, motion, useDragControls } from 'framer-motion';
import {
  EXECUTIVE_POWERS,
  FASCIST_TO_WIN,
  LIBERAL_TO_WIN,
  MAX_ELECTION_TRACKER,
  PHASES,
} from '../lib/constants';
import { Ban, Bot, Skull } from 'lucide-react';
import FactionAccentText from './FactionAccentText';
import GameOverlay from './GameOverlay';
import PolicyTrack from '../features/game-board/PolicyTrack';
import TrackDetailSheet from '../features/game-board/TrackDetailSheet';
import useVoteRevealState from '../features/game-board/useVoteRevealState';
import {
  GOVERNMENT_FORMATION_BANDS,
  GOVERNMENT_FORMATION_SPARKS,
  GOVERNMENT_FRACTURE_LINES,
  GOVERNMENT_FRACTURE_SHARDS,
  getAvatarId,
  getPresidencyQueue,
  getTablePlayers,
  getTableRingSeatClass,
  getTableRingSeatStyle,
  getTrackSlotInsight,
  getVoteRevealGroups,
  getVotingPlayerCardSize,
  getVotingStatusMeta,
  getVoteStampRotation,
} from '../features/game-board/boardConfig';
import { triggerHaptic } from '../lib/haptics';

export default function GameBoard({
  gameState,
  playerId,
  directorState,
  onNominate,
  onVote,
  onDiscard,
  onRequestVeto,
  onRespondVeto,
  onEnact,
  onInvestigate,
  onSpecialElection,
  onAcknowledgePeek,
  onKill,
}) {
  const myActualId = gameState?.myPlayerId || playerId;
  const me = gameState.players.find((player) => player.id === myActualId);
  const isPresident = gameState.amIPresident || myActualId === gameState.currentPresident;
  const isChancellor = gameState.amIChancellor || myActualId === gameState.currentChancellor;
  const executivePower = gameState.executivePower;
  const alivePlayerCount = gameState.players.filter((player) => player.isAlive).length;
  const eligibleChancellorIdSet = React.useMemo(
    () => new Set(gameState.eligibleChancellorIds || []),
    [gameState.eligibleChancellorIds],
  );
  const termLimitedPlayerIdSet = React.useMemo(
    () => new Set(gameState.termLimitedPlayerIds || []),
    [gameState.termLimitedPlayerIds],
  );

  const canNominate = gameState.phase === PHASES.NOMINATION && isPresident;
  const canExecutiveTarget =
    gameState.phase === PHASES.EXECUTIVE_ACTION &&
    isPresident &&
    [
      EXECUTIVE_POWERS.INVESTIGATE,
      EXECUTIVE_POWERS.SPECIAL_ELECTION,
      EXECUTIVE_POWERS.EXECUTION,
    ].includes(executivePower);
  const selectionPhaseActive = canNominate || canExecutiveTarget;
  const selectionPromptLabel = canNominate
    ? 'Choose A Chancellor'
    : executivePower === EXECUTIVE_POWERS.INVESTIGATE
      ? 'Choose Investigation Target'
      : executivePower === EXECUTIVE_POWERS.SPECIAL_ELECTION
        ? 'Choose Next President'
        : executivePower === EXECUTIVE_POWERS.EXECUTION
          ? 'Choose Elimination Target'
          : null;

  const [pendingSelection, setPendingSelection] = React.useState(null);
  const [selectedTrackFocus, setSelectedTrackFocus] = React.useState(null);
  const [isTrackDetailOpen, setIsTrackDetailOpen] = React.useState(false);
  const trackDetailDragControls = useDragControls();
  const {
    recentVoteIds,
    revealStage,
    revealState,
    revealedVoteIds,
    revealedVoteTotals,
  } = useVoteRevealState(gameState);

  React.useEffect(() => {
    setPendingSelection(null);
  }, [gameState.phase]);

  React.useEffect(() => {
    setIsTrackDetailOpen(false);
  }, [gameState.phase]);

  const showVoteReveal = Boolean(revealState) && gameState.phase !== PHASES.VOTING;
  const isVoteRevealPhase = showVoteReveal;
  const displayPhase = showVoteReveal ? PHASES.VOTING : gameState.phase;
  const playerCount = gameState.players.length;
  const aliveCount = gameState.players.filter((player) => player.isAlive).length;
  const revealIsApproved = revealState?.result === 'APPROVED';
  const revealProgressTotal = revealedVoteTotals.YA + revealedVoteTotals.NEIN;
  const revealJaPercent = revealProgressTotal ? (revealedVoteTotals.YA / revealProgressTotal) * 100 : 0;
  const revealNeinPercent = revealProgressTotal ? (revealedVoteTotals.NEIN / revealProgressTotal) * 100 : 0;
  const revealOutcomeTitle = revealIsApproved ? 'Government Elected' : 'Vote Failed';
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
  const selectedTrackType = selectedTrackFocus?.type === 'LIBERAL' ? 'LIBERAL' : selectedTrackFocus?.type === 'FASCIST' ? 'FASCIST' : null;
  const selectedTrackMax =
    selectedTrackType === 'FASCIST' ? FASCIST_TO_WIN : selectedTrackType === 'LIBERAL' ? LIBERAL_TO_WIN : null;
  const selectedTrackProgress =
    selectedTrackType === 'FASCIST'
      ? gameState.fascistPolicies
      : selectedTrackType === 'LIBERAL'
        ? gameState.liberalPolicies
        : null;
  const selectedTrackSlotIndex =
    selectedTrackMax == null ? null : Math.max(0, Math.min(selectedTrackFocus?.slotIndex ?? 0, selectedTrackMax - 1));
  const selectedTrackInsight =
    selectedTrackType && selectedTrackMax != null && selectedTrackProgress != null && selectedTrackSlotIndex != null
      ? getTrackSlotInsight({
          type: selectedTrackType,
          slotIndex: selectedTrackSlotIndex,
          current: selectedTrackProgress,
          max: selectedTrackMax,
          playerCount,
          phase: displayPhase,
          executivePower: gameState.executivePower,
        })
      : null;
  const getSeatSelectionMeta = (player) => {
    const isSelf = player.id === myActualId;
    const alreadyInvestigated = gameState.investigatedPlayerIds?.includes(player.id);
    const playerIsCurrentChancellor =
      player.id === gameState.currentChancellor || player.id === gameState.nominatedChancellor;
    const playerWasLastChancellor = player.id === gameState.lastGovernment?.chancellorId;
    const playerWasLastPresident = player.id === gameState.lastGovernment?.presidentId;

    if (canNominate) {
      const isSelectable =
        eligibleChancellorIdSet.size > 0
          ? eligibleChancellorIdSet.has(player.id)
          : player.isAlive && !isSelf && !termLimitedPlayerIdSet.has(player.id);

      if (isSelectable) {
        return {
          isSelectable: true,
          actionLabel: 'Nominate',
          badgeLabel: 'Choose',
        };
      }

      if (!player.isAlive) {
        return { isSelectable: false, actionLabel: 'Blocked', badgeLabel: 'Dead' };
      }

      if (isSelf) {
        return { isSelectable: false, actionLabel: 'Blocked', badgeLabel: 'You' };
      }

      if (playerWasLastChancellor || termLimitedPlayerIdSet.has(player.id)) {
        return {
          isSelectable: false,
          actionLabel: 'Blocked',
          badgeLabel: playerWasLastChancellor ? 'Last Chan' : playerWasLastPresident && alivePlayerCount > 5 ? 'Last Pres' : 'Term Limit',
        };
      }

      if (playerIsCurrentChancellor) {
        return { isSelectable: false, actionLabel: 'Blocked', badgeLabel: 'Chancellor' };
      }

      return { isSelectable: false, actionLabel: 'Blocked', badgeLabel: 'Not Eligible' };
    }

    if (canExecutiveTarget) {
      const isSelectable =
        player.isAlive &&
        !isSelf &&
        !(executivePower === EXECUTIVE_POWERS.INVESTIGATE && alreadyInvestigated);

      if (isSelectable) {
        return {
          isSelectable: true,
          actionLabel:
            executivePower === EXECUTIVE_POWERS.INVESTIGATE
              ? 'Investigate'
              : executivePower === EXECUTIVE_POWERS.SPECIAL_ELECTION
                ? 'Elect'
                : executivePower === EXECUTIVE_POWERS.EXECUTION
                  ? 'Eliminate'
                  : 'Choose',
          badgeLabel: 'Choose',
        };
      }

      if (!player.isAlive) {
        return { isSelectable: false, actionLabel: 'Blocked', badgeLabel: 'Dead' };
      }

      if (isSelf) {
        return { isSelectable: false, actionLabel: 'Blocked', badgeLabel: 'You' };
      }

      if (executivePower === EXECUTIVE_POWERS.INVESTIGATE && alreadyInvestigated) {
        return { isSelectable: false, actionLabel: 'Blocked', badgeLabel: 'Checked' };
      }

      return { isSelectable: false, actionLabel: 'Blocked', badgeLabel: 'Blocked' };
    }

    return null;
  };

  const handleNominate = (id) => {
    triggerHaptic('selection');
    const player = gameState.players.find((candidate) => candidate.id === id);
    setPendingSelection({ id, name: player?.name, type: 'NOMINATE' });
  };

  const handleKill = (id) => {
    triggerHaptic('warning');
    const player = gameState.players.find((candidate) => candidate.id === id);
    setPendingSelection({ id, name: player?.name, type: 'KILL' });
  };

  const handleInvestigate = (id) => {
    triggerHaptic('selection');
    const player = gameState.players.find((candidate) => candidate.id === id);
    setPendingSelection({ id, name: player?.name, type: 'INVESTIGATE' });
  };

  const handleSpecialElection = (id) => {
    triggerHaptic('selection');
    const player = gameState.players.find((candidate) => candidate.id === id);
    setPendingSelection({ id, name: player?.name, type: 'SPECIAL_ELECTION' });
  };

  const confirmSelection = () => {
    if (!pendingSelection) return;
    triggerHaptic('confirm');
    if (pendingSelection.type === 'NOMINATE') onNominate(pendingSelection.id);
    if (pendingSelection.type === 'KILL') onKill(pendingSelection.id);
    if (pendingSelection.type === 'INVESTIGATE') onInvestigate(pendingSelection.id);
    if (pendingSelection.type === 'SPECIAL_ELECTION') onSpecialElection(pendingSelection.id);
    setPendingSelection(null);
  };

  const cancelSelection = () => {
    triggerHaptic('soft');
    setPendingSelection(null);
  };

  const handleTrackInspect = (type, slotIndex) => {
    triggerHaptic('selection');
    setSelectedTrackFocus({ type, slotIndex });
    setIsTrackDetailOpen(true);
  };

  const closeTrackDetail = () => {
    triggerHaptic('soft');
    setIsTrackDetailOpen(false);
  };

  const renderTrack = (current, max, type) => {
    return (
      <PolicyTrack
        current={current}
        isTrackDetailOpen={isTrackDetailOpen}
        max={max}
        onInspect={handleTrackInspect}
        selectedTrackFocus={selectedTrackFocus}
        type={type}
      />
    );
  };

  const renderTrackDetailOverlay = () => {
    return (
      <TrackDetailSheet
        dragControls={trackDetailDragControls}
        insight={selectedTrackInsight}
        isOpen={isTrackDetailOpen}
        onClose={closeTrackDetail}
      />
    );
  };

  const renderBoardStage = () => {
    if (showVoteReveal) {
      return (
        <div className="mx-auto w-full min-w-0 max-w-[1120px] px-3 sm:px-4">
          <div
            className={`relative min-w-0 overflow-hidden rounded-[30px] border px-4 py-4 shadow-[0_28px_64px_rgba(0,0,0,0.42)] ${
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
                    <React.Fragment key={`formation-band-${top}`}>
                      <motion.div
                        initial={{ opacity: 0, scaleX: 0.2, x: -28 }}
                        animate={{ opacity: [0, 0.5, 0.12], scaleX: [0.2, 1, 1], x: [ -28, 0, 0 ] }}
                        transition={{ duration: 0.9, ease: 'easeOut', delay: index * 0.05 }}
                        className="absolute left-0 h-px origin-right bg-[linear-gradient(90deg,transparent_0%,rgba(103,232,249,0.32)_100%)]"
                        style={{ top: `${top}%`, width: '42%' }}
                      />
                      <motion.div
                        initial={{ opacity: 0, scaleX: 0.2, x: 28 }}
                        animate={{ opacity: [0, 0.5, 0.12], scaleX: [0.2, 1, 1], x: [ 28, 0, 0 ] }}
                        transition={{ duration: 0.9, ease: 'easeOut', delay: index * 0.05 }}
                        className="absolute right-0 h-px origin-left bg-[linear-gradient(90deg,rgba(103,232,249,0.32)_0%,transparent_100%)]"
                        style={{ top: `${top}%`, width: '42%' }}
                      />
                    </React.Fragment>
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

            <div className="relative z-10 text-center">
              <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[8px] font-mono font-black uppercase tracking-[0.26em] text-white/65">
                {revealIsApproved ? 'Government Formed' : 'Government Broken'}
              </span>
              <motion.h2
                initial={{ opacity: 0, scale: 0.94, y: 10 }}
                animate={
                  revealIsApproved
                    ? { opacity: 1, scale: [0.94, 1.03, 1], y: [10, -2, 0] }
                    : { opacity: 1, scale: [0.94, 1.01, 1], y: [10, 0, 0], x: [0, -4, 3, 0] }
                }
                transition={{ duration: revealIsApproved ? 0.7 : 0.58, ease: 'easeOut' }}
                className={`mt-3 text-xl font-black uppercase tracking-[0.14em] sm:text-2xl ${
                  revealIsApproved ? 'text-cyan-100' : 'text-red-100'
                }`}
              >
                {revealOutcomeTitle}
              </motion.h2>
              <FactionAccentText as="p" className="mt-2 text-sm leading-relaxed text-white/62">
                {revealNextStep}
              </FactionAccentText>
            </div>

            <div className="relative z-10 mt-5 rounded-[22px] border border-white/8 bg-black/22 px-4 py-4">
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
                {revealProgressTotal < aliveCount ? `Revealing votes ${revealProgressTotal}/${aliveCount}` : revealNextStep}
              </FactionAccentText>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="mx-auto w-full min-w-0 max-w-[860px] px-3 transition-all duration-700 opacity-[0.92] sm:px-4">
        <div className="grid min-w-0 gap-3">
          {renderTrack(gameState.liberalPolicies, LIBERAL_TO_WIN, 'LIBERAL')}
          {renderTrack(gameState.fascistPolicies, FASCIST_TO_WIN, 'FASCIST')}
        </div>
      </div>
    );
  };

  const renderPlayerDock = () => {
    const isVoteRevealLayout = showVoteReveal;
    const isLegislativePhase = displayPhase === PHASES.LEGISLATIVE_PRESIDENT || displayPhase === PHASES.LEGISLATIVE_CHANCELLOR;
    const playerCardSizeClass = getVotingPlayerCardSize(playerCount);
    const tablePlayers = getTablePlayers(gameState.players);
    const {
      orderMap: presidencyOrderMap,
      nextPresidentId,
      afterNextPresidentId,
    } = getPresidencyQueue(gameState.players, gameState.currentPresident, gameState.specialElectionCallerId);
    const currentPresidentPlayer = tablePlayers.find((player) => player.id === gameState.currentPresident) || null;
    const currentChancellorPlayer =
      tablePlayers.find((player) => player.id === (gameState.currentChancellor || gameState.nominatedChancellor)) || null;
    const nextPresidentPlayer = tablePlayers.find((player) => player.id === nextPresidentId) || null;
    const orbitStatusItems = [
      {
        label: 'President',
        value: currentPresidentPlayer?.name || 'Open',
        accentClassName: 'bg-[#d4af37] shadow-[0_0_10px_rgba(212,175,55,0.32)]',
      },
      {
        label: 'Chancellor',
        value: currentChancellorPlayer?.name || 'Open',
        accentClassName: 'bg-white/70 shadow-[0_0_10px_rgba(255,255,255,0.16)]',
      },
      {
        label: 'Next',
        value: nextPresidentPlayer?.name || 'Open',
        accentClassName: 'bg-cyan-300 shadow-[0_0_10px_rgba(103,232,249,0.3)]',
      },
    ];
    const ringSeatClass = getTableRingSeatClass(playerCount);
    const votingGroups = isVoteRevealLayout ? getVoteRevealGroups(gameState.players, revealState?.votes) : [];
    const dockWrapperClass = isVoteRevealPhase
      ? 'mx-auto w-full min-w-0 max-w-[1120px] px-3 sm:px-4'
      : 'mx-auto flex min-h-0 w-full min-w-0 max-w-[1120px] flex-1 px-3 sm:px-4';
    const dockPanelClass = isVoteRevealPhase
      ? 'relative min-w-0 w-full overflow-hidden rounded-[28px] border border-white/8 bg-black/28 p-3 shadow-[0_18px_40px_rgba(0,0,0,0.24)] sm:p-4'
      : 'relative h-full min-h-0 min-w-0 w-full overflow-hidden rounded-[28px] border border-white/8 bg-black/28 p-3 shadow-[0_18px_40px_rgba(0,0,0,0.24)] sm:p-4';
    const dockBodyClass = isVoteRevealPhase
      ? 'relative z-10 min-w-0 pt-3'
      : 'relative z-10 min-h-0 min-w-0 overflow-y-auto';

    return (
      <div className={dockWrapperClass}>
        <div className={dockPanelClass}>
          <div className="absolute inset-0 paper-grain opacity-[0.06] pointer-events-none" />

          <div className={`relative z-10 ${isVoteRevealLayout ? 'grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)]' : 'h-full min-h-0'}`}>
            {isVoteRevealLayout && (
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[8px] font-mono font-black uppercase tracking-[0.32em] text-cyan-300/75">
                    Players
                  </p>
                </div>
              </div>
            )}
            <div className={dockBodyClass}>
              {isVoteRevealLayout ? (
                <div className="space-y-4">
                  {votingGroups.map((group) => (
                    <div key={group.key}>
                      {(() => {
                        const visibleGroupPlayers = showVoteReveal
                          ? group.key === 'OBSERVERS'
                            ? group.players
                            : group.players.filter((player) => revealedVoteIds.includes(player.id))
                          : group.players;
                        if (showVoteReveal && visibleGroupPlayers.length === 0) {
                          return null;
                        }
                        const groupCount = visibleGroupPlayers.length;
                        const groupToneClass =
                          group.tone === 'ja'
                            ? 'text-cyan-100/78'
                            : group.tone === 'nein'
                              ? 'text-red-100/78'
                              : 'text-white/40';

                        return (
                          <>
                      <div className="mb-2 flex items-center gap-2">
                        <span className={`text-[8px] font-mono font-black uppercase tracking-[0.24em] ${groupToneClass}`}>
                          {group.label}{showVoteReveal && group.key !== 'OBSERVERS' ? ` (${groupCount})` : ''}
                        </span>
                        <span className="h-px flex-1 bg-white/8" />
                      </div>

                      <div className="flex flex-wrap items-start gap-2 sm:gap-3">
                        {visibleGroupPlayers.map((player) => {
                          const isSelf = player.id === myActualId;
                          const isRevealed = showVoteReveal;
                          const finalVote = isRevealed ? revealState.votes[player.id] : null;
                          const voteStatus = getVotingStatusMeta(player, isRevealed, finalVote);
                          const justVoted = recentVoteIds.includes(player.id);

                          return (
                            <motion.div
                              key={player.id}
                              layout
                              initial={showVoteReveal ? { opacity: 0, y: 12, scale: 0.92 } : false}
                              animate={showVoteReveal ? { opacity: 1, y: 0, scale: 1 } : justVoted ? { scale: [1, 1.04, 1] } : { scale: 1 }}
                              transition={{ duration: showVoteReveal ? 0.28 : 0.45, ease: 'easeOut' }}
                              className="relative"
                            >
                              <div
                                className={`relative flex w-full flex-col items-center overflow-hidden rounded-[20px] border bg-[linear-gradient(180deg,rgba(17,19,22,0.98)_0%,rgba(10,11,13,0.96)_100%)] p-2 text-center transition-all duration-300 ${playerCardSizeClass}
                                  ${!player.isAlive ? 'opacity-45' : ''}
                                  ${isRevealed && finalVote === 'YA' ? 'ring-4 ring-[#2b5c8f] shadow-xl' : ''}
                                  ${isRevealed && finalVote === 'NEIN' ? 'ring-4 ring-[var(--color-stamp-red)] shadow-xl' : ''}
                                  ${justVoted ? 'border-cyan-300/40 shadow-[0_0_0_1px_rgba(103,232,249,0.28),0_0_26px_rgba(103,232,249,0.18)]' : ''}
                                  ${isSelf ? 'border-cyan-300/28 shadow-[0_0_0_1px_rgba(103,232,249,0.2),0_16px_32px_rgba(0,0,0,0.25)]' : 'border-white/8 shadow-[0_12px_24px_rgba(0,0,0,0.22)]'}
                                `}
                              >
                                {player.isBot && (
                                  <span className="absolute right-1.5 top-1.5 z-10 inline-flex items-center gap-1 rounded-full border border-amber-300/25 bg-amber-400/12 px-1.5 py-0.5 text-[6px] font-mono font-black uppercase tracking-[0.16em] text-amber-100">
                                    <Bot size={8} />
                                    Bot
                                  </span>
                                )}

                                <div className={`relative mx-auto flex h-14 w-14 items-end justify-center overflow-hidden rounded-[18px] border ${
                                  player.isAlive ? 'border-white/10 bg-white/[0.06]' : 'border-white/8 bg-white/[0.04]'
                                }`}>
                                  {player.isAlive ? (
                                    <img
                                      src={`/assets/avatars/avatar_${getAvatarId(player)}.png`}
                                      alt="Operative Profile"
                                      loading="lazy"
                                      decoding="async"
                                      className="absolute inset-0 h-full w-full object-cover opacity-78"
                                    />
                                  ) : (
                                    <Skull size={18} className="text-white/35" />
                                  )}
                                </div>

                                <span className={`mt-2 w-full truncate text-[10px] font-black uppercase tracking-[0.08em] ${
                                  player.isAlive ? 'text-white' : 'text-white/40 line-through'
                                }`}>
                                  {player.name}
                                </span>

                                <div className="mt-2 flex items-center justify-center gap-1.5 text-[9px] font-mono font-black uppercase tracking-[0.16em]">
                                  <motion.span
                                    animate={!isRevealed && player.isAlive && !player.hasVoted ? { opacity: [0.4, 1, 0.4] } : { opacity: 1 }}
                                    transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                                    className={`h-2 w-2 rounded-full ${voteStatus.dotClassName}`}
                                  />
                                  <span className={voteStatus.className}>{voteStatus.label}</span>
                                </div>

                                {player.isAlive && (
                                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    {isRevealed && finalVote === 'YA' && (
                                      <motion.div
                                        initial={{ scale: 2.5, opacity: 0, rotate: -20 }}
                                        animate={{ scale: 1, opacity: 1, rotate: getVoteStampRotation(player.id, 'YA') }}
                                        transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                                        className="rounded-sm border-2 border-[#2b5c8f] px-1 text-xs font-black uppercase tracking-[0.2em] text-[#2b5c8f] opacity-90 mix-blend-multiply sm:text-sm"
                                      >
                                        JA
                                      </motion.div>
                                    )}

                                    {isRevealed && finalVote === 'NEIN' && (
                                      <motion.div
                                        initial={{ scale: 2.5, opacity: 0, rotate: 20 }}
                                        animate={{ scale: 1, opacity: 1, rotate: getVoteStampRotation(player.id, 'NEIN') }}
                                        transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                                        className="rounded-sm border-2 border-[var(--color-stamp-red)] px-1 text-xs font-black uppercase tracking-[0.2em] text-[var(--color-stamp-red)] opacity-90 mix-blend-multiply sm:text-sm"
                                      >
                                        NEIN
                                      </motion.div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                          </>
                        );
                      })()}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex min-h-0 flex-col items-center justify-center gap-4">
                  <div className="relative mx-auto w-full max-w-[440px]">
                    <div className="relative aspect-square w-full">
                      <div className="pointer-events-none absolute inset-[12%] rounded-full border border-white/8 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0.02)_55%,rgba(0,0,0,0.16)_100%)] shadow-[0_20px_44px_rgba(0,0,0,0.24)]" />
                      <div className="pointer-events-none absolute inset-[17%] rounded-full border border-dashed border-white/8 opacity-55" />
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: gameState.specialElectionCallerId ? 10 : 16, repeat: Infinity, ease: 'linear' }}
                        className="pointer-events-none absolute inset-[17%]"
                      >
                        <span className={`absolute left-1/2 top-0 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ${
                          gameState.specialElectionCallerId
                            ? 'bg-amber-300 shadow-[0_0_16px_rgba(252,211,77,0.55)]'
                            : 'bg-cyan-300 shadow-[0_0_16px_rgba(103,232,249,0.55)]'
                        }`} />
                      </motion.div>
                      <motion.div
                        animate={{ rotate: -360 }}
                        transition={{ duration: 22, repeat: Infinity, ease: 'linear' }}
                        className="pointer-events-none absolute inset-[23%]"
                      >
                        <span className="absolute left-1/2 top-0 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#d4af37] shadow-[0_0_14px_rgba(212,175,55,0.45)]" />
                      </motion.div>
                      <div className="pointer-events-none absolute inset-[27%] rounded-full border border-[#d4c098]/10 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.06)_0%,rgba(10,11,13,0.88)_72%,rgba(6,7,8,0.94)_100%)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.03)]">
                        <div className="absolute inset-[18%] rounded-full border border-white/8" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="h-16 w-16 rounded-full border border-white/8 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0.01)_70%,rgba(0,0,0,0.16)_100%)] shadow-[0_10px_24px_rgba(0,0,0,0.18)]" />
                        </div>
                      </div>
                      {selectionPhaseActive && selectionPromptLabel && (
                        <div className="pointer-events-none absolute inset-[30%] z-10 flex items-center justify-center">
                          <div className="rounded-full border border-white/10 bg-black/34 px-4 py-3 text-center shadow-[0_16px_28px_rgba(0,0,0,0.28)] backdrop-blur-sm">
                            <p className="text-[8px] font-mono font-black uppercase tracking-[0.2em] text-white/82">
                              {selectionPromptLabel}
                            </p>
                            <div className="mt-2 flex items-center justify-center gap-2 text-[6px] font-mono font-black uppercase tracking-[0.16em] text-white/58">
                              <span className="inline-flex items-center gap-1 rounded-full border border-[#d4c098]/25 bg-[#d4c098]/10 px-1.5 py-0.5 text-[#f1e6c4]">
                                <span className="h-1.5 w-1.5 rounded-full bg-[#d4c098]" />
                                Choose
                              </span>
                              <span className="inline-flex items-center gap-1 rounded-full border border-red-300/20 bg-red-500/10 px-1.5 py-0.5 text-red-100">
                                <Ban size={7} />
                                Blocked
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                      {tablePlayers.map((player, index) => {
                        const isSelf = player.id === myActualId;
                        const alreadyInvestigated = gameState.investigatedPlayerIds?.includes(player.id);
                        const selectionMeta = getSeatSelectionMeta(player);
                        const isSelectable =
                          selectionMeta?.isSelectable ||
                          (displayPhase === PHASES.NOMINATION && canNominate && player.isAlive && !isSelf) ||
                          (displayPhase === PHASES.EXECUTIVE_ACTION &&
                            canExecutiveTarget &&
                            player.isAlive &&
                            !isSelf &&
                            !(executivePower === EXECUTIVE_POWERS.INVESTIGATE && alreadyInvestigated));
                        const isPending = pendingSelection?.id === player.id;
                        const playerIsPresident = player.id === gameState.currentPresident;
                        const playerIsChancellor = player.id === gameState.currentChancellor || player.id === gameState.nominatedChancellor;
                        const isInactiveLegislator = isLegislativePhase && !playerIsPresident && !playerIsChancellor;
                        const presidencyOrder = presidencyOrderMap.get(player.id);
                        const isNextPresident = player.id === nextPresidentId;
                        const isAfterNextPresident = player.id === afterNextPresidentId;

                        return (
                          <button
                            key={player.id}
                            type="button"
                            onClick={() => {
                              if (!isSelectable) return;
                              if (displayPhase === PHASES.NOMINATION) handleNominate(player.id);
                              if (displayPhase === PHASES.EXECUTIVE_ACTION && executivePower === EXECUTIVE_POWERS.EXECUTION) handleKill(player.id);
                              if (displayPhase === PHASES.EXECUTIVE_ACTION && executivePower === EXECUTIVE_POWERS.INVESTIGATE) handleInvestigate(player.id);
                              if (displayPhase === PHASES.EXECUTIVE_ACTION && executivePower === EXECUTIVE_POWERS.SPECIAL_ELECTION) handleSpecialElection(player.id);
                            }}
                            style={getTableRingSeatStyle(index, tablePlayers.length)}
                            className={`group absolute flex flex-col items-center justify-start overflow-hidden rounded-[24px] border px-1.5 py-1.5 text-center shadow-[0_14px_26px_rgba(0,0,0,0.26)] outline-none transition-all duration-300 sm:px-2 sm:py-2 ${ringSeatClass}
                              ${playerIsPresident ? 'border-[#d4af37]/80 bg-[linear-gradient(180deg,#fff2c2_0%,#d7ba67_100%)] text-[#2c2410]' : 'border-white/8 bg-[linear-gradient(180deg,rgba(18,20,24,0.96)_0%,rgba(11,12,14,0.94)_100%)] text-white'}
                              ${playerIsChancellor && !playerIsPresident ? 'ring-2 ring-white/55' : ''}
                              ${isNextPresident ? 'ring-2 ring-cyan-300 shadow-[0_0_0_1px_rgba(103,232,249,0.4),0_16px_30px_rgba(0,0,0,0.3)]' : ''}
                              ${isAfterNextPresident ? 'shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_16px_28px_rgba(0,0,0,0.28)]' : ''}
                              ${selectionPhaseActive && isSelectable ? 'border-[#d4c098]/65 shadow-[0_0_0_1px_rgba(212,192,152,0.25),0_18px_32px_rgba(0,0,0,0.3)]' : ''}
                              ${selectionPhaseActive && !isSelectable ? 'border-red-400/18 bg-[linear-gradient(180deg,rgba(30,14,17,0.96)_0%,rgba(17,10,12,0.96)_100%)]' : ''}
                              ${isSelectable ? 'cursor-pointer hover:scale-[1.04] hover:border-[#d4c098] active:scale-[0.98]' : 'cursor-default'}
                              ${isInactiveLegislator ? 'opacity-35 grayscale-[0.45]' : ''}
                              ${!player.isAlive ? 'opacity-45 brightness-75' : ''}
                              ${displayPhase === PHASES.EXECUTIVE_ACTION && executivePower === EXECUTIVE_POWERS.INVESTIGATE && alreadyInvestigated ? 'opacity-45 grayscale-[0.3]' : ''}
                              ${isPending ? 'z-20 scale-[1.06] !opacity-100 ring-4 ring-[var(--color-stamp-red)] shadow-2xl' : ''}
                              ${isSelf ? 'shadow-[0_0_0_1px_rgba(103,232,249,0.24),0_18px_34px_rgba(0,0,0,0.32)]' : ''}
                            `}
                          >
                            {selectionPhaseActive && !isSelectable && player.isAlive && (
                              <>
                                <div className="pointer-events-none absolute inset-0 z-0 bg-red-500/[0.08]" />
                                <span className="pointer-events-none absolute inset-x-2 top-1/2 z-10 h-[2px] -translate-y-1/2 -rotate-[18deg] rounded-full bg-red-300/55 shadow-[0_0_10px_rgba(252,165,165,0.2)]" />
                              </>
                            )}
                            {selectionPhaseActive && isSelectable && !isPending && (
                              <motion.div
                                animate={{ opacity: [0.12, 0.28, 0.12], scale: [0.97, 1.02, 0.97] }}
                                transition={{ duration: 1.7, repeat: Infinity, ease: 'easeInOut' }}
                                className="pointer-events-none absolute inset-0 z-0 rounded-[24px] bg-[radial-gradient(circle_at_center,rgba(212,192,152,0.18)_0%,rgba(212,192,152,0.08)_48%,transparent_76%)]"
                              />
                            )}
                            {playerIsPresident && (
                              <motion.div
                                animate={{ opacity: [0.1, 0.28, 0.1], scale: [0.94, 1.02, 0.94] }}
                                transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                                className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_top,rgba(255,243,194,0.36)_0%,rgba(255,243,194,0.08)_42%,transparent_72%)]"
                              />
                            )}
                            {isNextPresident && !playerIsPresident && (
                              <motion.div
                                animate={{ opacity: [0.14, 0.3, 0.14], scale: [0.96, 1.03, 0.96] }}
                                transition={{ duration: 1.9, repeat: Infinity, ease: 'easeInOut' }}
                                className="pointer-events-none absolute inset-0 z-0 rounded-[24px] bg-[radial-gradient(circle_at_top,rgba(103,232,249,0.24)_0%,rgba(103,232,249,0.06)_42%,transparent_72%)]"
                              />
                            )}

                            <div className="absolute left-1.5 top-1.5 flex items-center gap-1">
                              {player.isBot && (
                                <span className={`inline-flex h-4 w-4 items-center justify-center rounded-full text-[7px] ${
                                  playerIsPresident ? 'bg-[#2c2410]/12 text-[#2c2410]' : 'bg-amber-400/14 text-amber-200'
                                }`}>
                                  <Bot size={8} />
                                </span>
                              )}
                              {isSelf && (
                                <span className={`rounded-full border px-1.5 py-0.5 text-[6px] font-mono font-black uppercase tracking-[0.16em] ${
                                  playerIsPresident ? 'border-[#2c2410]/18 bg-[#2c2410]/10 text-[#2c2410]' : 'border-cyan-300/18 bg-cyan-400/10 text-cyan-100'
                                }`}>
                                  You
                                </span>
                              )}
                            </div>

                            {(playerIsPresident || playerIsChancellor) && (
                              <span className={`absolute left-1.5 bottom-1.5 rounded-full px-1.5 py-0.5 text-[6px] font-mono font-black uppercase tracking-[0.18em] ${
                                playerIsPresident ? 'bg-[#2c2410] text-[#f3df9c]' : 'bg-white/16 text-white'
                              }`}>
                                {playerIsPresident ? 'PRES' : 'CHAN'}
                              </span>
                            )}

                            {player.isAlive && !playerIsPresident && presidencyOrder ? (
                              <span className={`absolute right-1.5 top-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[8px] font-mono font-black ${
                                isNextPresident
                                  ? 'bg-cyan-300 text-black'
                                  : 'bg-white/10 text-white/76'
                              }`}>
                                {presidencyOrder}
                              </span>
                            ) : null}

                            <div className={`relative mt-1 flex h-10 w-10 items-end justify-center overflow-hidden rounded-[14px] border sm:h-12 sm:w-12 ${
                              playerIsPresident
                                ? 'border-[#2c2410]/14 bg-[#f7e7b0]'
                                : !player.isAlive
                                  ? 'border-white/8 bg-white/[0.04]'
                                  : 'border-white/10 bg-white/[0.06]'
                            }`}>
                              {player.isAlive ? (
                                <>
                                  <img
                                    src={`/assets/avatars/avatar_${getAvatarId(player)}.png`}
                                    alt="Operative Profile"
                                    loading="lazy"
                                    decoding="async"
                                    className={`absolute inset-0 h-full w-full object-cover pointer-events-none ${
                                      playerIsPresident
                                        ? 'opacity-85 mix-blend-multiply sepia-[0.08] contrast-110'
                                        : 'opacity-80 mix-blend-multiply sepia-[0.2] contrast-125 brightness-90'
                                    }`}
                                  />
                                  <div className="absolute inset-0 paper-grain pointer-events-none opacity-30 mix-blend-overlay" />
                                </>
                              ) : (
                                <Skull size={16} className={`relative z-10 mb-1 ${playerIsPresident ? 'text-[#2c2410]/60' : 'text-white/35'}`} />
                              )}
                            </div>

                            <span className={`mt-1 w-full truncate font-serif text-[8px] font-black tracking-tight sm:text-[9px] ${
                              playerIsPresident
                                ? 'text-[#2c2410]'
                                : !player.isAlive
                                  ? 'text-white/40 line-through'
                                  : 'text-white'
                            }`}>
                              {player.name}
                            </span>

                            <span className={`mt-1 text-[6px] font-mono font-black uppercase tracking-[0.18em] ${
                              isNextPresident
                                ? 'text-cyan-100'
                                : playerIsPresident
                                  ? 'text-[#2c2410]/72'
                                  : selectionPhaseActive && !isSelectable
                                    ? 'text-red-100'
                                  : isSelectable
                                    ? 'text-[#d4c098]'
                                    : 'text-white/42'
                            }`}>
                              {isNextPresident
                                ? 'Next Up'
                                : selectionPhaseActive
                                  ? isSelectable
                                    ? selectionMeta?.actionLabel || 'Choose'
                                    : selectionMeta?.badgeLabel || 'Blocked'
                                  : isSelectable
                                    ? displayPhase === PHASES.NOMINATION
                                      ? 'Nominate'
                                      : executivePower === EXECUTIVE_POWERS.INVESTIGATE
                                        ? 'Investigate'
                                        : executivePower === EXECUTIVE_POWERS.SPECIAL_ELECTION
                                          ? 'Elect'
                                          : executivePower === EXECUTIVE_POWERS.EXECUTION
                                            ? 'Eliminate'
                                            : 'Selectable'
                                  : player.isAlive
                                    ? 'In Rotation'
                                    : 'Eliminated'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="w-full max-w-[420px]">
                    <div className="grid grid-cols-3 gap-2">
                      {orbitStatusItems.map((item) => (
                        <div
                          key={item.label}
                          className="min-w-0 rounded-[18px] border border-white/8 bg-black/24 px-3 py-2 shadow-[0_12px_24px_rgba(0,0,0,0.18)] backdrop-blur-sm"
                        >
                          <div className="flex items-center gap-1.5 text-[8px] font-mono font-black uppercase tracking-[0.18em] text-white/45">
                            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${item.accentClassName}`} />
                            <span className="truncate">{item.label}</span>
                          </div>
                          <p className="mt-1 truncate text-[10px] font-black uppercase tracking-[0.04em] text-white/78 sm:text-[11px]">
                            {item.value}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const boardDimmed = Boolean(pendingSelection);
  const boardContentTopClass = isVoteRevealPhase ? 'pt-4 sm:pt-5' : 'pt-16 sm:pt-20';

  return (
    <motion.div
      key={`viewport-${displayPhase}`}
      initial={{ opacity: 0, scale: 0.98, filter: 'brightness(1.3)' }}
      animate={{
        opacity: 1,
        scale: revealStage === 1 && revealIsApproved ? [1.016, 1] : 1,
        filter: 'brightness(1)',
        x: revealStage === 1 && !revealIsApproved ? [-8, 8, -4, 4, 0] : 0,
        y: revealStage === 1 && !revealIsApproved ? [-4, 4, -2, 2, 0] : 0,
      }}
      transition={{
        duration: revealStage === 1 ? 0.4 : 0.55,
        ease: 'easeOut',
      }}
      className="relative h-full min-h-0 w-full overflow-hidden bg-obsidian-950 pt-[var(--app-header-offset)]"
    >
      <div className={`absolute inset-0 z-50 pointer-events-none transition-all duration-300 ${revealStage === 0 && showVoteReveal ? 'bg-black/80' : 'bg-transparent'}`} />

      {revealStage === 1 && showVoteReveal && (
        <motion.div
          initial={{ opacity: 0.8 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={`absolute inset-0 z-50 pointer-events-none ${revealState.result === 'APPROVED' ? 'bg-cyan-400' : 'bg-red-500'}`}
        />
      )}

      <div className={`fixed inset-0 z-0 board-grid pointer-events-none transition-all duration-1000 ${displayPhase === PHASES.LEGISLATIVE_PRESIDENT || displayPhase === PHASES.LEGISLATIVE_CHANCELLOR ? 'opacity-[0.03]' : 'opacity-[0.05]'}`} />
      <div className={`absolute inset-0 z-0 pointer-events-none opacity-20 transition-all duration-1000 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] ${displayPhase === PHASES.VOTING ? 'from-cyan-900/40 via-transparent to-transparent' : displayPhase === PHASES.EXECUTIVE_ACTION ? 'from-red-900/40 via-transparent to-transparent' : 'from-transparent to-transparent'}`} />

      <GameOverlay
        gameState={gameState}
        playerId={playerId}
        directorState={directorState}
        revealState={showVoteReveal ? revealState : null}
        pendingSelection={pendingSelection}
        onConfirm={confirmSelection}
        onCancel={cancelSelection}
        onVote={onVote}
        onDiscard={onDiscard}
        onRequestVeto={onRequestVeto}
        onRespondVeto={onRespondVeto}
        onEnact={onEnact}
        onAcknowledgePeek={onAcknowledgePeek}
      />
      {renderTrackDetailOverlay()}

      <div className={`relative z-10 grid h-full min-h-0 min-w-0 grid-rows-[auto_minmax(0,1fr)] gap-2 pb-[calc(var(--app-safe-bottom)+0.75rem)] transition-all duration-700 sm:gap-3 sm:pb-[calc(var(--app-safe-bottom)+1rem)] ${boardContentTopClass} ${boardDimmed ? 'opacity-45' : 'opacity-100'}`}>
        {renderBoardStage()}
        {renderPlayerDock()}
      </div>
    </motion.div>
  );
}
