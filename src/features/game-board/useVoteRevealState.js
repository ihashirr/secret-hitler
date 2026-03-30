import React from 'react';
import { PHASES } from '../../lib/constants';
import {
  getVoteTempoProfile,
} from './liveTempoProfile';

const clearVoteHighlightTimers = (timersRef) => {
  timersRef.current.forEach(({ startTimer, clearTimer }) => {
    if (startTimer) window.clearTimeout(startTimer);
    if (clearTimer) window.clearTimeout(clearTimer);
  });
  timersRef.current.clear();
};

const createVoteRevealId = (gameState, orderedRevealPlayerIds) => {
  const voteSignature = orderedRevealPlayerIds
    .map((playerId) => `${playerId}:${gameState.lastVotes?.[playerId] || 'NONE'}`)
    .join('|');

  return [
    'vote',
    gameState.currentPresident || 'none',
    gameState.currentChancellor || gameState.nominatedChancellor || 'none',
    voteSignature || 'empty',
  ].join(':');
};

export default function useVoteRevealState(gameState, options = {}) {
  const { suppressTransitionEffects = false } = options;
  const [revealState, setRevealState] = React.useState(null);
  const [revealStage, setRevealStage] = React.useState(0);
  const [recentVoteIds, setRecentVoteIds] = React.useState([]);
  const [revealedVotes, setRevealedVotes] = React.useState([]);
  const prevPhaseRef = React.useRef(gameState.phase);
  const prevVoteStateRef = React.useRef({});
  const voteStateReadyRef = React.useRef(false);
  const voteHighlightTimersRef = React.useRef(new Map());
  const voteTempo = React.useMemo(
    () => getVoteTempoProfile({ players: gameState.players }),
    [gameState.players],
  );

  const revealedVoteMap = React.useMemo(
    () =>
      revealedVotes.reduce((accumulator, voteEntry) => {
        accumulator[voteEntry.playerId] = voteEntry.vote;
        return accumulator;
      }, {}),
    [revealedVotes],
  );

  const revealedVoteTotals = React.useMemo(
    () =>
      revealedVotes.reduce(
        (accumulator, voteEntry) => ({
          ...accumulator,
          [voteEntry.vote]: (accumulator[voteEntry.vote] || 0) + 1,
        }),
        { YA: 0, NEIN: 0 },
      ),
    [revealedVotes],
  );

  React.useEffect(() => () => {
    clearVoteHighlightTimers(voteHighlightTimersRef);
  }, []);

  React.useEffect(() => {
    const nextVoteState = gameState.players.reduce((accumulator, player) => {
      accumulator[player.id] = Boolean(player.hasVoted);
      return accumulator;
    }, {});

    if (!voteStateReadyRef.current) {
      voteStateReadyRef.current = true;
      prevVoteStateRef.current = nextVoteState;
      return undefined;
    }

    if (suppressTransitionEffects) {
      clearVoteHighlightTimers(voteHighlightTimersRef);
      setRecentVoteIds([]);
      prevVoteStateRef.current = nextVoteState;
      return undefined;
    }

    if (gameState.phase !== PHASES.VOTING) {
      clearVoteHighlightTimers(voteHighlightTimersRef);
      setRecentVoteIds([]);
      prevVoteStateRef.current = nextVoteState;
      return undefined;
    }

    const justVotedIds = [...gameState.players]
      .filter((player) => player.isAlive && player.hasVoted && !prevVoteStateRef.current[player.id])
      .sort((left, right) => (left.position || 0) - (right.position || 0))
      .map((player) => player.id);

    prevVoteStateRef.current = nextVoteState;

    if (!justVotedIds.length) return undefined;

    justVotedIds.forEach((id, index) => {
      const existingTimers = voteHighlightTimersRef.current.get(id);
      if (existingTimers?.startTimer) window.clearTimeout(existingTimers.startTimer);
      if (existingTimers?.clearTimer) window.clearTimeout(existingTimers.clearTimer);

      const startTimer = window.setTimeout(() => {
        setRecentVoteIds((current) => (current.includes(id) ? current : [...current, id]));

        const clearTimer = window.setTimeout(() => {
          setRecentVoteIds((current) => current.filter((currentId) => currentId !== id));
          voteHighlightTimersRef.current.delete(id);
        }, voteTempo.voteLockPulseMs);

        voteHighlightTimersRef.current.set(id, { startTimer: null, clearTimer });
      }, index * voteTempo.voteLockStaggerMs);

      voteHighlightTimersRef.current.set(id, { startTimer, clearTimer: null });
    });

    return undefined;
  }, [
    gameState.phase,
    gameState.players,
    voteTempo.voteLockPulseMs,
    voteTempo.voteLockStaggerMs,
    suppressTransitionEffects,
  ]);

  React.useEffect(() => {
    if (suppressTransitionEffects) {
      prevPhaseRef.current = gameState.phase;
      setRevealState(null);
      setRevealStage(0);
      setRevealedVotes([]);
      return;
    }

    if (prevPhaseRef.current === PHASES.VOTING && gameState.phase !== PHASES.VOTING && gameState.lastVotes) {
      let ya = 0;
      let nein = 0;

      Object.values(gameState.lastVotes).forEach((vote) => {
        if (vote === 'YA') ya += 1;
        else if (vote === 'NEIN') nein += 1;
      });

      const orderedRevealPlayerIds = [...gameState.players]
        .filter((player) => player.isAlive && gameState.lastVotes[player.id])
        .sort((left, right) => (left.position || 0) - (right.position || 0))
        .map((player) => player.id);
      const revealTempo = getVoteTempoProfile({
        players: gameState.players,
        revealPlayerCount: orderedRevealPlayerIds.length,
      });

      setRevealState({
        id: createVoteRevealId(gameState, orderedRevealPlayerIds),
        result: ya > nein ? 'APPROVED' : 'REJECTED',
        votes: gameState.lastVotes,
        ya,
        nein,
        orderedRevealPlayerIds,
        tempo: revealTempo,
        expectedTotalDurationMs: revealTempo.expectedTotalDurationMs,
        voteRevealFinalHoldMs: revealTempo.voteRevealFinalHoldMs,
      });
    }

    prevPhaseRef.current = gameState.phase;
  }, [gameState, suppressTransitionEffects]);

  React.useEffect(() => {
    if (!revealState?.id) return undefined;

    setRevealStage(0);

    const revealTimer = window.setTimeout(() => {
      setRevealStage(1);
    }, revealState.tempo?.voteRevealStageDelayMs || voteTempo.voteRevealStageDelayMs);

    const cleanupTimer = window.setTimeout(() => {
      setRevealState((current) => (current?.id === revealState.id ? null : current));
      setRevealStage(0);
    }, revealState.expectedTotalDurationMs);

    return () => {
      window.clearTimeout(revealTimer);
      window.clearTimeout(cleanupTimer);
    };
  }, [
    revealState?.expectedTotalDurationMs,
    revealState?.id,
    revealState?.tempo?.voteRevealStageDelayMs,
    voteTempo.voteRevealStageDelayMs,
  ]);

  React.useEffect(() => {
    if (suppressTransitionEffects || gameState.phase === PHASES.VOTING || !revealState?.votes) {
      setRevealedVotes([]);
      return undefined;
    }

    setRevealedVotes([]);

    const revealStartDelayMs =
      revealState.tempo?.voteRevealStartDelayMs || voteTempo.voteRevealStartDelayMs;
    const revealStepMs = revealState.tempo?.voteRevealStepMs || voteTempo.voteRevealStepMs;

    const timers = (revealState.orderedRevealPlayerIds || []).map((playerId, index) =>
      window.setTimeout(() => {
        const vote = revealState.votes[playerId];
        setRevealedVotes((current) =>
          current.some((entry) => entry.playerId === playerId)
            ? current
            : [...current, { playerId, vote }],
        );
      }, revealStartDelayMs + index * revealStepMs),
    );

    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [
    gameState.phase,
    revealState,
    suppressTransitionEffects,
    voteTempo.voteRevealStartDelayMs,
    voteTempo.voteRevealStepMs,
  ]);

  return {
    recentVoteIds,
    revealId: revealState?.id || null,
    revealStage,
    revealState,
    isResolving: Boolean(revealState),
    isComplete: Boolean(revealState) && revealedVotes.length >= (revealState?.orderedRevealPlayerIds?.length || 0),
    revealedVoteMap,
    revealedVoteTotals,
    orderedRevealPlayerIds: revealState?.orderedRevealPlayerIds || [],
    revealProgressCount: revealedVotes.length,
    expectedTotalDurationMs: revealState?.expectedTotalDurationMs || 0,
    voteRevealFinalHoldMs: revealState?.voteRevealFinalHoldMs || voteTempo.voteRevealFinalHoldMs,
    setRevealState,
  };
}
