import React from 'react';
import { PHASES } from '../../lib/constants';
import {
  VOTE_LOCK_PULSE_MS,
  VOTE_LOCK_STAGGER_MS,
  VOTE_REVEAL_STAGE_DELAY_MS,
  VOTE_REVEAL_START_DELAY_MS,
  VOTE_REVEAL_STEP_MS,
  VOTE_REVEAL_FINAL_HOLD_MS,
} from './boardConfig';

const getVoteRevealTiming = (players) => {
  const alivePlayers = players.filter((player) => player.isAlive);
  const aliveHumanCount = alivePlayers.filter((player) => !player.isBot).length;

  if (aliveHumanCount === 1) {
    return {
      voteLockPulseMs: 1150,
      voteLockStaggerMs: 420,
      voteRevealStageDelayMs: 240,
      voteRevealStartDelayMs: 620,
      voteRevealStepMs: 520,
      voteRevealFinalHoldMs: 1900,
    };
  }

  return {
    voteLockPulseMs: VOTE_LOCK_PULSE_MS,
    voteLockStaggerMs: VOTE_LOCK_STAGGER_MS,
    voteRevealStageDelayMs: VOTE_REVEAL_STAGE_DELAY_MS,
    voteRevealStartDelayMs: VOTE_REVEAL_START_DELAY_MS,
    voteRevealStepMs: VOTE_REVEAL_STEP_MS,
    voteRevealFinalHoldMs: VOTE_REVEAL_FINAL_HOLD_MS,
  };
};

export default function useVoteRevealState(gameState) {
  const [revealState, setRevealState] = React.useState(null);
  const [revealStage, setRevealStage] = React.useState(0);
  const [recentVoteIds, setRecentVoteIds] = React.useState([]);
  const [revealedVotes, setRevealedVotes] = React.useState([]);
  const prevPhaseRef = React.useRef(gameState.phase);
  const prevVoteStateRef = React.useRef({});
  const voteStateReadyRef = React.useRef(false);
  const voteHighlightTimersRef = React.useRef(new Map());
  const voteRevealTiming = React.useMemo(() => getVoteRevealTiming(gameState.players), [gameState.players]);

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
    voteHighlightTimersRef.current.forEach(({ startTimer, clearTimer }) => {
      if (startTimer) window.clearTimeout(startTimer);
      if (clearTimer) window.clearTimeout(clearTimer);
    });
    voteHighlightTimersRef.current.clear();
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

    if (gameState.phase !== PHASES.VOTING) {
      voteHighlightTimersRef.current.forEach(({ startTimer, clearTimer }) => {
        if (startTimer) window.clearTimeout(startTimer);
        if (clearTimer) window.clearTimeout(clearTimer);
      });
      voteHighlightTimersRef.current.clear();
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
        setRecentVoteIds((current) =>
          current.includes(id) ? current : [...current, id],
        );

        const clearTimer = window.setTimeout(() => {
          setRecentVoteIds((current) => current.filter((currentId) => currentId !== id));
          voteHighlightTimersRef.current.delete(id);
        }, voteRevealTiming.voteLockPulseMs);

        voteHighlightTimersRef.current.set(id, { startTimer: null, clearTimer });
      }, index * voteRevealTiming.voteLockStaggerMs);

      voteHighlightTimersRef.current.set(id, { startTimer, clearTimer: null });
    });

    return undefined;
  }, [gameState.phase, gameState.players, voteRevealTiming.voteLockPulseMs, voteRevealTiming.voteLockStaggerMs]);

  React.useEffect(() => {
    if (prevPhaseRef.current === PHASES.VOTING && gameState.phase !== PHASES.VOTING && gameState.lastVotes) {
      let ya = 0;
      let nein = 0;

      Object.values(gameState.lastVotes).forEach((vote) => {
        if (vote === 'YA') ya += 1;
        else nein += 1;
      });

      const orderedRevealPlayerIds = [...gameState.players]
        .filter((player) => player.isAlive && gameState.lastVotes[player.id])
        .sort((left, right) => (left.position || 0) - (right.position || 0))
        .map((player) => player.id);

      setRevealState({
        id: `${gameState.phase}-${Date.now()}`,
        result: ya > nein ? 'APPROVED' : 'REJECTED',
        votes: gameState.lastVotes,
        ya,
        nein,
        orderedRevealPlayerIds,
      });
    }

    prevPhaseRef.current = gameState.phase;
  }, [gameState.phase, gameState.lastVotes, gameState.players]);

  React.useEffect(() => {
    if (!revealState?.id) return undefined;

    setRevealStage(0);

    const revealSeatCount = revealState.orderedRevealPlayerIds?.length || 0;
    const dynamicRevealDuration =
      voteRevealTiming.voteRevealStartDelayMs +
      Math.max(0, revealSeatCount - 1) * voteRevealTiming.voteRevealStepMs +
      voteRevealTiming.voteRevealFinalHoldMs;

    const revealTimer = window.setTimeout(() => setRevealStage(1), voteRevealTiming.voteRevealStageDelayMs);
    const cleanupTimer = window.setTimeout(() => {
      setRevealState((current) => (current?.id === revealState.id ? null : current));
      setRevealStage(0);
    }, dynamicRevealDuration);

    return () => {
      window.clearTimeout(revealTimer);
      window.clearTimeout(cleanupTimer);
    };
  }, [
    revealState?.id,
    revealState?.orderedRevealPlayerIds?.length,
    voteRevealTiming.voteRevealFinalHoldMs,
    voteRevealTiming.voteRevealStageDelayMs,
    voteRevealTiming.voteRevealStartDelayMs,
    voteRevealTiming.voteRevealStepMs,
  ]);

  React.useEffect(() => {
    if (gameState.phase === PHASES.VOTING || !revealState?.votes) {
      setRevealedVotes([]);
      return undefined;
    }

    setRevealedVotes([]);

    const timers = (revealState.orderedRevealPlayerIds || []).map((playerId, index) =>
      window.setTimeout(() => {
        const vote = revealState.votes[playerId];
        setRevealedVotes((current) =>
          current.some((entry) => entry.playerId === playerId)
            ? current
            : [...current, { playerId, vote }],
        );
      }, voteRevealTiming.voteRevealStartDelayMs + index * voteRevealTiming.voteRevealStepMs),
    );

    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [gameState.phase, revealState, voteRevealTiming.voteRevealStartDelayMs, voteRevealTiming.voteRevealStepMs]);

  return {
    recentVoteIds,
    revealStage,
    revealState,
    revealedVoteMap,
    revealedVoteTotals,
    orderedRevealPlayerIds: revealState?.orderedRevealPlayerIds || [],
    revealProgressCount: revealedVotes.length,
    setRevealState,
  };
}
