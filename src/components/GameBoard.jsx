import React from 'react';
import { motion, useDragControls } from 'framer-motion';
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
  getAvatarId,
  getPresidencyQueue,
  getTablePlayers,
  getTableRingSeatClass,
  getTableRingSeatStyle,
  getTrackSlotInsight,
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
    revealedVoteMap,
    revealedVoteTotals,
    orderedRevealPlayerIds,
    revealProgressCount,
  } = useVoteRevealState(gameState);

  React.useEffect(() => {
    setPendingSelection(null);
  }, [gameState.phase]);

  React.useEffect(() => {
    setIsTrackDetailOpen(false);
  }, [gameState.phase]);

  const voteRevealActive = Boolean(revealState);
  const voteFeedbackActive = gameState.phase === PHASES.VOTING || voteRevealActive;
  const displayPhase = gameState.phase;
  const playerCount = gameState.players.length;
  const aliveCount = gameState.players.filter((player) => player.isAlive).length;
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
    return (
      <div className="mx-auto w-full min-w-0 max-w-[860px] shrink-0 transition-all duration-700 opacity-[0.92]">
        <div className="grid min-w-0 gap-3">
          {renderTrack(gameState.liberalPolicies, LIBERAL_TO_WIN, 'LIBERAL')}
          {renderTrack(gameState.fascistPolicies, FASCIST_TO_WIN, 'FASCIST')}
        </div>
      </div>
    );
  };

  const renderVoteRibbon = () => {
    if (!voteRevealActive || !revealState) return null;

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.16, ease: 'easeOut' }}
        className="mx-auto w-full max-w-[860px] shrink-0"
      >
        <div
          className={`rounded-[20px] border px-3 py-2.5 shadow-[0_18px_36px_rgba(0,0,0,0.22)] backdrop-blur-sm sm:px-4 ${
            revealIsApproved
              ? 'border-cyan-300/18 bg-[linear-gradient(180deg,rgba(8,17,24,0.88)_0%,rgba(8,13,19,0.8)_100%)]'
              : 'border-red-400/18 bg-[linear-gradient(180deg,rgba(25,8,10,0.88)_0%,rgba(15,8,9,0.8)_100%)]'
          }`}
        >
          <div className="flex min-w-0 flex-wrap items-center gap-2 text-[8px] font-mono font-black uppercase tracking-[0.2em]">
            <span className={`rounded-full border px-2.5 py-1 ${
              revealIsApproved
                ? 'border-cyan-300/18 bg-cyan-300/10 text-cyan-100'
                : 'border-red-400/18 bg-red-500/10 text-red-100'
            }`}>
              {revealIsApproved ? 'Government Elected' : 'Vote Failed'}
            </span>
            <span className="rounded-full border border-white/10 bg-black/18 px-2.5 py-1 text-white/72">
              {revealedVoteTotals.YA} Ja • {revealedVoteTotals.NEIN} Nein
            </span>
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-white/56">
              {revealProgressCount < aliveCount ? `Resolving ${revealProgressCount}/${aliveCount}` : 'Resolved'}
            </span>
          </div>

          <FactionAccentText as="p" className="mt-2 text-[10px] leading-relaxed text-white/66 sm:text-[11px]">
            {revealProgressCount < orderedRevealPlayerIds.length
              ? 'Votes are resolving on the table.'
              : revealNextStep}
          </FactionAccentText>
        </div>
      </motion.div>
    );
  };

  const renderPlayerDock = () => {
    const isLegislativePhase = displayPhase === PHASES.LEGISLATIVE_PRESIDENT || displayPhase === PHASES.LEGISLATIVE_CHANCELLOR;
    const tablePlayers = getTablePlayers(gameState.players);
    const seatLayouts = tablePlayers.map((player, index) => {
      const seatStyle = getTableRingSeatStyle(index, tablePlayers.length);
      return {
        ...player,
        seatStyle,
        x: Number.parseFloat(seatStyle.left),
        y: Number.parseFloat(seatStyle.top),
      };
    });
    const {
      orderMap: presidencyOrderMap,
      nextPresidentId,
      afterNextPresidentId,
    } = getPresidencyQueue(gameState.players, gameState.currentPresident, gameState.specialElectionCallerId);
    const currentPresidentPlayer = seatLayouts.find((player) => player.id === gameState.currentPresident) || null;
    const currentChancellorPlayer =
      seatLayouts.find((player) => player.id === (gameState.currentChancellor || gameState.nominatedChancellor)) || null;
    const nextPresidentPlayer = seatLayouts.find((player) => player.id === nextPresidentId) || null;
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
    const voteTargets = [
      {
        key: 'YA',
        label: 'JA',
        x: 28,
        y: 69,
        accentClassName: 'border-cyan-300/28 bg-[linear-gradient(180deg,rgba(8,27,40,0.96)_0%,rgba(8,18,28,0.94)_100%)] text-cyan-100 shadow-[0_18px_34px_rgba(0,0,0,0.3)]',
        dotClassName: 'bg-cyan-300 shadow-[0_0_12px_rgba(103,232,249,0.52)]',
        laneColor: 'rgba(103, 232, 249, 0.86)',
      },
      {
        key: 'NEIN',
        label: 'NEIN',
        x: 72,
        y: 69,
        accentClassName: 'border-red-400/28 bg-[linear-gradient(180deg,rgba(33,10,14,0.96)_0%,rgba(24,8,10,0.94)_100%)] text-red-100 shadow-[0_18px_34px_rgba(0,0,0,0.3)]',
        dotClassName: 'bg-red-400 shadow-[0_0_12px_rgba(248,113,113,0.5)]',
        laneColor: 'rgba(248, 113, 113, 0.84)',
      },
    ];
    const voteTargetLookup = new Map(voteTargets.map((target) => [target.key, target]));
    const getVoteLanePath = (seat, target) => {
      const direction = target.key === 'YA' ? -1 : 1;
      const controlX = ((seat.x + target.x) / 2) + direction * 12;
      const controlY = Math.min(seat.y, target.y) - 16;
      return `M ${seat.x} ${seat.y} Q ${controlX} ${controlY} ${target.x} ${target.y}`;
    };
    const ringSeatClass = getTableRingSeatClass(playerCount);
    const ringShellWidth =
      playerCount >= 9
        ? 'min(100%, clamp(272px, calc(var(--app-vh) - var(--app-header-offset) - 288px), 400px))'
        : playerCount >= 7
          ? 'min(100%, clamp(294px, calc(var(--app-vh) - var(--app-header-offset) - 270px), 420px))'
          : 'min(100%, clamp(308px, calc(var(--app-vh) - var(--app-header-offset) - 252px), 440px))';

    return (
      <div className="flex w-full min-w-0 flex-1">
        <div className="relative min-h-[420px] w-full min-w-0 overflow-hidden rounded-[28px] border border-white/8 bg-black/28 p-3 shadow-[0_18px_40px_rgba(0,0,0,0.24)] sm:min-h-[480px] sm:p-4">
          <div className="absolute inset-0 paper-grain opacity-[0.06] pointer-events-none" />

          <div className="relative z-10 flex min-h-full min-w-0 flex-col items-center justify-start gap-4 py-1 sm:gap-5">
            <div className="relative mx-auto w-full" style={{ width: ringShellWidth }}>
              <div className="relative aspect-square w-full">
                <div className="pointer-events-none absolute inset-[12%] rounded-full border border-white/8 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0.02)_55%,rgba(0,0,0,0.16)_100%)] shadow-[0_20px_44px_rgba(0,0,0,0.24)]" />
                <div className="pointer-events-none absolute inset-[17%] rounded-full border border-dashed border-white/8 opacity-55" />
                <div className="pointer-events-none absolute inset-[17%]">
                  <span className={`absolute left-1/2 top-0 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ${
                    gameState.specialElectionCallerId
                      ? 'bg-amber-300 shadow-[0_0_16px_rgba(252,211,77,0.55)]'
                      : 'bg-cyan-300 shadow-[0_0_16px_rgba(103,232,249,0.55)]'
                  }`} />
                </div>
                <div className="pointer-events-none absolute inset-[23%]">
                  <span className="absolute left-1/2 top-0 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#d4af37] shadow-[0_0_14px_rgba(212,175,55,0.45)]" />
                </div>
                <div className="pointer-events-none absolute inset-[27%] rounded-full border border-[#d4c098]/10 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.06)_0%,rgba(10,11,13,0.88)_72%,rgba(6,7,8,0.94)_100%)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.03)]">
                  <div className="absolute inset-[18%] rounded-full border border-white/8" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-16 w-16 rounded-full border border-white/8 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0.01)_70%,rgba(0,0,0,0.16)_100%)] shadow-[0_10px_24px_rgba(0,0,0,0.18)]" />
                  </div>
                </div>

                {voteRevealActive && (
                  <>
                    <svg
                      viewBox="0 0 100 100"
                      className="pointer-events-none absolute inset-0 z-[1] h-full w-full overflow-visible"
                      preserveAspectRatio="none"
                    >
                      {orderedRevealPlayerIds.map((playerId) => {
                        const seat = seatLayouts.find((candidate) => candidate.id === playerId);
                        const vote = revealedVoteMap[playerId];
                        const target = voteTargetLookup.get(vote);

                        if (!seat || !vote || !target) return null;

                        return (
                          <path
                            key={`vote-lane-${playerId}`}
                            d={getVoteLanePath(seat, target)}
                            fill="none"
                            stroke={target.laneColor}
                            strokeWidth="1.2"
                            strokeLinecap="round"
                            opacity="0.7"
                          />
                        );
                      })}
                    </svg>

                    {voteTargets.map((target) => (
                      <div
                        key={target.key}
                        className={`pointer-events-none absolute z-[2] min-w-[74px] rounded-[18px] border px-2.5 py-2 text-center ${target.accentClassName}`}
                        style={{
                          left: `${target.x}%`,
                          top: `${target.y}%`,
                          transform: 'translate(-50%, -50%)',
                        }}
                      >
                        <div className="text-[7px] font-mono font-black uppercase tracking-[0.22em] text-white/62">
                          {target.label}
                        </div>
                        <div className="mt-1 flex items-center justify-center gap-1.5">
                          <span className={`h-2 w-2 rounded-full ${target.dotClassName}`} />
                          <span className="text-[15px] font-black leading-none">
                            {revealedVoteTotals[target.key] || 0}
                          </span>
                        </div>
                      </div>
                    ))}
                  </>
                )}

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

                {seatLayouts.map((player) => {
                        const isSelf = player.id === myActualId;
                        const alreadyInvestigated = gameState.investigatedPlayerIds?.includes(player.id);
                        const selectionMeta = getSeatSelectionMeta(player);
                        const finalVote = revealState?.votes?.[player.id] || null;
                        const revealedVote = revealedVoteMap[player.id] || null;
                        const isVoteRevealed = Boolean(revealedVote);
                        const voteStatus = getVotingStatusMeta(player, isVoteRevealed, revealedVote);
                        const isVotePendingSeal = voteRevealActive && Boolean(finalVote) && !isVoteRevealed;
                        const showSeatVoteStatus = voteFeedbackActive && player.isAlive;
                        const justVoted = recentVoteIds.includes(player.id);
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
                            style={player.seatStyle}
                            className={`group absolute flex flex-col items-center justify-start overflow-hidden rounded-[24px] border px-1.5 py-1.5 text-center shadow-[0_14px_26px_rgba(0,0,0,0.26)] outline-none transition-all duration-300 sm:px-2 sm:py-2 ${ringSeatClass}
                              ${playerIsPresident ? 'border-[#d4af37]/80 bg-[linear-gradient(180deg,#fff2c2_0%,#d7ba67_100%)] text-[#2c2410]' : 'border-white/8 bg-[linear-gradient(180deg,rgba(18,20,24,0.96)_0%,rgba(11,12,14,0.94)_100%)] text-white'}
                              ${playerIsChancellor && !playerIsPresident ? 'ring-2 ring-white/55' : ''}
                              ${isNextPresident ? 'ring-2 ring-cyan-300 shadow-[0_0_0_1px_rgba(103,232,249,0.4),0_16px_30px_rgba(0,0,0,0.3)]' : ''}
                              ${isAfterNextPresident ? 'shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_16px_28px_rgba(0,0,0,0.28)]' : ''}
                              ${showSeatVoteStatus && player.hasVoted && !isVoteRevealed ? 'border-cyan-300/30 shadow-[0_0_0_1px_rgba(103,232,249,0.18),0_18px_34px_rgba(0,0,0,0.32)]' : ''}
                              ${isVotePendingSeal ? 'border-amber-200/32 shadow-[0_0_0_1px_rgba(253,230,138,0.18),0_18px_34px_rgba(0,0,0,0.32)]' : ''}
                              ${isVoteRevealed && revealedVote === 'YA' ? 'ring-2 ring-[#2b5c8f] shadow-[0_0_0_1px_rgba(103,232,249,0.32),0_18px_34px_rgba(0,0,0,0.34)]' : ''}
                              ${isVoteRevealed && revealedVote === 'NEIN' ? 'ring-2 ring-[var(--color-stamp-red)] shadow-[0_0_0_1px_rgba(248,113,113,0.32),0_18px_34px_rgba(0,0,0,0.34)]' : ''}
                              ${selectionPhaseActive && isSelectable ? 'border-[#d4c098]/65 shadow-[0_0_0_1px_rgba(212,192,152,0.25),0_18px_32px_rgba(0,0,0,0.3)]' : ''}
                              ${selectionPhaseActive && !isSelectable ? 'border-red-400/18 bg-[linear-gradient(180deg,rgba(30,14,17,0.96)_0%,rgba(17,10,12,0.96)_100%)]' : ''}
                              ${isSelectable ? 'cursor-pointer hover:scale-[1.04] hover:border-[#d4c098] active:scale-[0.98]' : 'cursor-default'}
                              ${isInactiveLegislator ? 'opacity-35 grayscale-[0.45]' : ''}
                              ${!player.isAlive ? 'opacity-45 brightness-75' : ''}
                              ${displayPhase === PHASES.EXECUTIVE_ACTION && executivePower === EXECUTIVE_POWERS.INVESTIGATE && alreadyInvestigated ? 'opacity-45 grayscale-[0.3]' : ''}
                              ${isPending ? 'z-20 scale-[1.06] !opacity-100 ring-4 ring-[var(--color-stamp-red)] shadow-2xl' : ''}
                              ${justVoted ? 'border-cyan-300/42 shadow-[0_0_0_1px_rgba(103,232,249,0.28),0_0_24px_rgba(103,232,249,0.18)]' : ''}
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
                              <div className="pointer-events-none absolute inset-0 z-0 rounded-[24px] bg-[radial-gradient(circle_at_center,rgba(212,192,152,0.14)_0%,rgba(212,192,152,0.05)_48%,transparent_76%)]" />
                            )}
                            {playerIsPresident && (
                              <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_top,rgba(255,243,194,0.24)_0%,rgba(255,243,194,0.06)_42%,transparent_72%)]" />
                            )}
                            {isNextPresident && !playerIsPresident && (
                              <div className="pointer-events-none absolute inset-0 z-0 rounded-[24px] bg-[radial-gradient(circle_at_top,rgba(103,232,249,0.16)_0%,rgba(103,232,249,0.04)_42%,transparent_72%)]" />
                            )}
                            {isVotePendingSeal && (
                              <div className="pointer-events-none absolute inset-0 z-0 rounded-[24px] bg-[radial-gradient(circle_at_center,rgba(253,230,138,0.12)_0%,rgba(253,230,138,0.03)_56%,transparent_78%)]" />
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

                            {showSeatVoteStatus ? (
                              <span className={`mt-1 inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[6px] font-mono font-black uppercase tracking-[0.16em] ${
                                isVotePendingSeal
                                  ? 'border-amber-200/22 bg-amber-200/12 text-amber-100'
                                  : isVoteRevealed
                                  ? revealedVote === 'YA'
                                    ? 'border-cyan-300/25 bg-cyan-300/12 text-cyan-100'
                                    : 'border-red-400/25 bg-red-500/12 text-red-100'
                                  : player.hasVoted
                                    ? 'border-cyan-300/18 bg-cyan-300/10 text-cyan-100'
                                    : 'border-white/10 bg-white/[0.05] text-white/58'
                              }`}>
                                <span className={`h-1.5 w-1.5 rounded-full ${
                                  isVotePendingSeal
                                    ? 'bg-amber-200 shadow-[0_0_10px_rgba(253,230,138,0.42)]'
                                    : voteStatus.dotClassName
                                }`} />
                                <span>{isVotePendingSeal ? 'Sealed' : voteStatus.label}</span>
                              </span>
                            ) : (
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
                            )}

                            {player.isAlive && isVoteRevealed && (
                              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                {revealedVote === 'YA' && (
                                  <motion.div
                                    initial={{ scale: 1.08, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1, rotate: getVoteStampRotation(player.id, 'YA') }}
                                    transition={{ duration: 0.16, ease: 'easeOut' }}
                                    className="rounded-sm border-2 border-[#2b5c8f] px-1 text-xs font-black uppercase tracking-[0.2em] text-[#2b5c8f] opacity-90 mix-blend-multiply sm:text-sm"
                                  >
                                    JA
                                  </motion.div>
                                )}

                                {revealedVote === 'NEIN' && (
                                  <motion.div
                                    initial={{ scale: 1.08, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1, rotate: getVoteStampRotation(player.id, 'NEIN') }}
                                    transition={{ duration: 0.16, ease: 'easeOut' }}
                                    className="rounded-sm border-2 border-[var(--color-stamp-red)] px-1 text-xs font-black uppercase tracking-[0.2em] text-[var(--color-stamp-red)] opacity-90 mix-blend-multiply sm:text-sm"
                                  >
                                    NEIN
                                  </motion.div>
                                )}
                              </div>
                            )}
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
        </div>
      </div>
    );
  };

  const boardDimmed = Boolean(pendingSelection);
  const boardAuraClass = voteRevealActive
    ? revealIsApproved
      ? 'from-cyan-900/40 via-transparent to-transparent'
      : 'from-red-900/40 via-transparent to-transparent'
    : displayPhase === PHASES.VOTING
      ? 'from-cyan-900/32 via-transparent to-transparent'
      : displayPhase === PHASES.EXECUTIVE_ACTION
        ? 'from-red-900/40 via-transparent to-transparent'
        : 'from-transparent to-transparent';

  return (
    <motion.div
      initial={{ opacity: 0, filter: 'brightness(1.08)' }}
      animate={{
        opacity: 1,
        filter: 'brightness(1)',
      }}
      transition={{
        duration: 0.28,
        ease: 'easeOut',
      }}
      className="relative flex h-full min-h-0 w-full flex-col overflow-hidden bg-obsidian-950 pt-[var(--app-header-offset)]"
    >
      {revealStage === 1 && voteRevealActive && (
        <motion.div
          initial={{ opacity: 0.22 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.34, ease: 'easeOut' }}
          className={`absolute inset-0 z-50 pointer-events-none ${revealState.result === 'APPROVED' ? 'bg-cyan-400' : 'bg-red-500'}`}
        />
      )}

      <div className={`fixed inset-0 z-0 board-grid pointer-events-none transition-all duration-1000 ${displayPhase === PHASES.LEGISLATIVE_PRESIDENT || displayPhase === PHASES.LEGISLATIVE_CHANCELLOR ? 'opacity-[0.03]' : 'opacity-[0.05]'}`} />
      <div className={`absolute inset-0 z-0 pointer-events-none opacity-20 transition-all duration-1000 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] ${boardAuraClass}`} />

      <GameOverlay
        gameState={gameState}
        playerId={playerId}
        directorState={directorState}
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

      <div className={`app-scroll-y scrollbar-hide relative z-10 min-h-0 flex-1 pb-[calc(var(--app-safe-bottom)+0.75rem)] transition-all duration-700 sm:pb-[calc(var(--app-safe-bottom)+1rem)] ${boardDimmed ? 'opacity-45' : 'opacity-100'}`}>
        <div className="mx-auto flex min-h-full w-full min-w-0 max-w-[1120px] flex-col gap-2 px-3 pt-16 sm:gap-3 sm:px-4 sm:pt-20">
          {renderBoardStage()}
          {renderVoteRibbon()}
          {renderPlayerDock()}
        </div>
      </div>
    </motion.div>
  );
}
