import React from 'react';
import { EXECUTIVE_POWERS, PHASES } from '../../lib/constants';
import {
  getExpectedVoteRevealDurationMs,
  getLiveTempoProfile,
  getMajorBeatDurationMs,
} from './liveTempoProfile';

const getPlayerName = (gameState, playerId, fallback = 'Someone') =>
  gameState?.players?.find((player) => player.id === playerId)?.name || fallback;

const createMajorBeat = ({
  kind,
  key,
  stageLabel,
  title,
  description,
  tone = 'neutral',
  autoCloseMs,
  compact = true,
}) => ({
  kind,
  key,
  stageLabel,
  title,
  description,
  tone,
  autoCloseMs,
  compact,
});

const createSnapshot = (gameState) => ({
  phase: gameState.phase,
  currentPresident: gameState.currentPresident || null,
  nominatedChancellor: gameState.nominatedChancellor || null,
  currentChancellor: gameState.currentChancellor || null,
  executivePower: gameState.executivePower || null,
  vetoRequested: Boolean(gameState.vetoRequested),
  winner: gameState.winner || null,
  winReason: gameState.winReason || null,
});

const createVoteBeatCandidate = (voteReveal, players = []) => ({
  token: `vote:${voteReveal.revealId}`,
  type: 'vote-reveal',
  expectedDurationMs:
    (voteReveal.expectedTotalDurationMs ||
      getExpectedVoteRevealDurationMs({
        players,
        revealPlayerCount: voteReveal.orderedRevealPlayerIds?.length,
      })) +
    getLiveTempoProfile(players).voteRevealGraceMs,
  voteReveal,
});

const createMajorBeatCandidate = (majorBeat, players = []) => ({
  token: majorBeat.key,
  type: 'major',
  minDuration: majorBeat.autoCloseMs,
  expectedDurationMs: majorBeat.autoCloseMs + getLiveTempoProfile(players).majorBeatGraceMs,
  majorBeat,
});

function getMajorBeatForExecution(gameState) {
  if (gameState.executivePower !== EXECUTIVE_POWERS.EXECUTION) return null;

  const presidentName = getPlayerName(gameState, gameState.currentPresident, 'The President');

  return createMajorBeat({
    kind: 'execution',
    key: `major:executive-execution:${gameState.currentPresident || 'none'}`,
    stageLabel: 'Executive Action',
    title: `${presidentName} Is Choosing An Execution`,
    description: 'The President is eliminating one player from the table.',
    tone: 'red',
    autoCloseMs: getMajorBeatDurationMs('execution', gameState.players),
  });
}

function getMajorBeatFromTransition(previous, gameState) {
  if (!previous) return null;

  const presidentName = getPlayerName(gameState, gameState.currentPresident, 'The President');
  const nomineeName = getPlayerName(gameState, gameState.nominatedChancellor, 'the nominee');
  const chancellorName = getPlayerName(
    gameState,
    gameState.currentChancellor || gameState.nominatedChancellor,
    'The Chancellor',
  );

  if (previous.nominatedChancellor !== gameState.nominatedChancellor && gameState.nominatedChancellor) {
    return createMajorBeat({
      kind: 'nomination-locked',
      key: `major:nominated:${gameState.currentPresident || 'none'}:${gameState.nominatedChancellor}`,
      stageLabel: 'Nomination Locked',
      title: `${presidentName} Nominated ${nomineeName}`,
      description: 'The ballot is locked. The table is moving into a government vote.',
      tone: 'blue',
      autoCloseMs: getMajorBeatDurationMs('nomination-locked', gameState.players),
    });
  }

  if (!previous.vetoRequested && gameState.vetoRequested) {
    return createMajorBeat({
      kind: 'veto-request',
      key: `major:veto-request:${gameState.currentPresident || 'none'}:${gameState.currentChancellor || 'none'}`,
      stageLabel: 'Veto Request',
      title: `${chancellorName} Requested A Veto`,
      description: `${presidentName} must now accept or reject the veto request.`,
      tone: 'red',
      autoCloseMs: getMajorBeatDurationMs('veto-request', gameState.players),
    });
  }

  if (previous.phase !== gameState.phase && gameState.phase === PHASES.EXECUTIVE_ACTION) {
    return getMajorBeatForExecution(gameState);
  }

  if (previous.phase !== PHASES.GAME_OVER && gameState.phase === PHASES.GAME_OVER) {
    const isHitlerElectionWin =
      typeof gameState.winReason === 'string' &&
      gameState.winReason.toLowerCase().includes('hitler was elected chancellor');

    return createMajorBeat({
      kind: isHitlerElectionWin ? 'hitler-elected' : 'game-over',
      key: `major:game-over:${gameState.winner || 'none'}:${gameState.winReason || 'unknown'}`,
      stageLabel: isHitlerElectionWin ? 'Hitler Elected' : 'Game Over',
      title: isHitlerElectionWin
        ? 'Hitler Was Elected Chancellor'
        : gameState.winner === 'LIBERAL'
          ? 'Liberal Victory'
          : 'Fascist Victory',
      description: gameState.winReason || 'The match has ended.',
      tone: gameState.winner === 'LIBERAL' ? 'blue' : 'red',
      autoCloseMs: getMajorBeatDurationMs(
        isHitlerElectionWin ? 'hitler-elected' : 'game-over',
        gameState.players,
      ),
    });
  }

  return null;
}

function getInitialMajorBeat(gameState) {
  if (gameState.phase === PHASES.LEGISLATIVE_CHANCELLOR && gameState.vetoRequested) {
    return createMajorBeat({
      kind: 'veto-request',
      key: `major:init-veto-request:${gameState.currentPresident || 'none'}:${gameState.currentChancellor || 'none'}`,
      stageLabel: 'Veto Request',
      title: `${getPlayerName(
        gameState,
        gameState.currentChancellor || gameState.nominatedChancellor,
        'The Chancellor',
      )} Requested A Veto`,
      description: `${getPlayerName(gameState, gameState.currentPresident, 'The President')} must now accept or reject the veto request.`,
      tone: 'red',
      autoCloseMs: getMajorBeatDurationMs('veto-request', gameState.players),
    });
  }

  if (gameState.phase === PHASES.EXECUTIVE_ACTION) {
    return getMajorBeatForExecution(gameState);
  }

  if (gameState.phase === PHASES.GAME_OVER) {
    return createMajorBeat({
      kind: 'game-over',
      key: `major:init-game-over:${gameState.winner || 'none'}:${gameState.winReason || 'unknown'}`,
      stageLabel: 'Game Over',
      title: gameState.winner === 'LIBERAL' ? 'Liberal Victory' : 'Fascist Victory',
      description: gameState.winReason || 'The match has ended.',
      tone: gameState.winner === 'LIBERAL' ? 'blue' : 'red',
      autoCloseMs: getMajorBeatDurationMs('game-over', gameState.players),
    });
  }

  return null;
}

function isMajorBeatStillRelevant(beat, gameState) {
  if (!beat) return false;

  if (beat.kind === 'nomination-locked') {
    return (
      gameState.nominatedChancellor &&
      (gameState.phase === PHASES.VOTING || gameState.phase === PHASES.NOMINATION)
    );
  }

  if (beat.kind === 'veto-request') {
    return Boolean(gameState.vetoRequested);
  }

  if (beat.kind === 'execution') {
    return (
      gameState.phase === PHASES.EXECUTIVE_ACTION &&
      gameState.executivePower === EXECUTIVE_POWERS.EXECUTION
    );
  }

  if (beat.kind === 'game-over' || beat.kind === 'hitler-elected') {
    return gameState.phase === PHASES.GAME_OVER;
  }

  return true;
}

function isQueuedBeatStillRelevant(beat, rawState, consumedVoteRevealIds) {
  if (!beat) return false;

  if (beat.type === 'major') {
    return isMajorBeatStillRelevant(beat.majorBeat, rawState.gameState);
  }

  if (beat.type === 'vote-reveal') {
    return (
      rawState.voteReveal?.isResolving &&
      rawState.voteReveal?.revealId === beat.voteReveal?.revealId &&
      !consumedVoteRevealIds.has(beat.voteReveal?.revealId)
    );
  }

  return false;
}

export default function useLiveTransitionGate({
  gameState,
  voteReveal,
  suppressCatchUpTransitions = false,
}) {
  const [displayVoteReveal, setDisplayVoteReveal] = React.useState(null);
  const [displayMajorBeat, setDisplayMajorBeat] = React.useState(null);
  const [activeBeat, setActiveBeat] = React.useState(null);
  const [queuedBeat, setQueuedBeat] = React.useState(null);
  const [canShowPrivateDrawer, setCanShowPrivateDrawer] = React.useState(true);

  const activeBeatRef = React.useRef(null);
  const queuedBeatRef = React.useRef(null);
  const displayVoteRevealRef = React.useRef(null);
  const latestRawRef = React.useRef({ gameState, voteReveal, suppressCatchUpTransitions });
  const previousSnapshotRef = React.useRef(null);
  const completionTimerRef = React.useRef(null);
  const watchdogTimerRef = React.useRef(null);
  const consumedVoteRevealIdsRef = React.useRef(new Set());

  const clearCompletionTimer = React.useCallback(() => {
    if (completionTimerRef.current) {
      window.clearTimeout(completionTimerRef.current);
      completionTimerRef.current = null;
    }
  }, []);

  const clearWatchdogTimer = React.useCallback(() => {
    if (watchdogTimerRef.current) {
      window.clearTimeout(watchdogTimerRef.current);
      watchdogTimerRef.current = null;
    }
  }, []);

  React.useEffect(() => {
    latestRawRef.current = { gameState, voteReveal, suppressCatchUpTransitions };
  }, [gameState, suppressCatchUpTransitions, voteReveal]);

  React.useEffect(() => {
    activeBeatRef.current = activeBeat;
  }, [activeBeat]);

  React.useEffect(() => {
    queuedBeatRef.current = queuedBeat;
  }, [queuedBeat]);

  React.useEffect(() => {
    displayVoteRevealRef.current = displayVoteReveal;
  }, [displayVoteReveal]);

  const completeBeat = React.useCallback((token, options = {}) => {
    const { consumeVoteReveal = true } = options;
    if (!activeBeatRef.current || activeBeatRef.current.token !== token) return;

    clearCompletionTimer();
    clearWatchdogTimer();

    const completedBeat = activeBeatRef.current;

    if (completedBeat.type === 'major') {
      setDisplayMajorBeat(null);
    }

    if (completedBeat.type === 'vote-reveal') {
      if (consumeVoteReveal && completedBeat.voteReveal?.revealId) {
        consumedVoteRevealIdsRef.current.add(completedBeat.voteReveal.revealId);
      }
      setDisplayVoteReveal(null);
    }

    setActiveBeat(null);
  }, [clearCompletionTimer, clearWatchdogTimer]);

  const beginBeat = React.useCallback((candidate) => {
    clearCompletionTimer();
    clearWatchdogTimer();
    setCanShowPrivateDrawer(false);

    const nextBeat = {
      ...candidate,
      startedAt: Date.now(),
    };

    setActiveBeat(nextBeat);

    if (candidate.type === 'major') {
      setDisplayMajorBeat(candidate.majorBeat);
    }

    if (candidate.type === 'vote-reveal') {
      setDisplayVoteReveal(candidate.voteReveal);
    }
  }, [clearCompletionTimer, clearWatchdogTimer]);

  const forceReleaseActiveBeat = React.useCallback((_reason = 'manual') => {
    if (!activeBeatRef.current) return;
    completeBeat(activeBeatRef.current.token);
  }, [completeBeat]);

  const resolveNextBeat = React.useCallback(() => {
    const raw = latestRawRef.current;

    if (raw.suppressCatchUpTransitions) {
      setQueuedBeat(null);
      setCanShowPrivateDrawer(true);
      return;
    }

    const pendingQueuedBeat = isQueuedBeatStillRelevant(
      queuedBeatRef.current,
      raw,
      consumedVoteRevealIdsRef.current,
    )
      ? queuedBeatRef.current
      : null;

    if (queuedBeatRef.current && !pendingQueuedBeat) {
      setQueuedBeat(null);
    }

    const voteCandidate =
      raw.voteReveal?.isResolving &&
      raw.voteReveal?.revealId &&
      !consumedVoteRevealIdsRef.current.has(raw.voteReveal.revealId) &&
      displayVoteRevealRef.current?.revealId !== raw.voteReveal.revealId
        ? createVoteBeatCandidate(raw.voteReveal, raw.gameState.players)
        : null;

    if (voteCandidate) {
      beginBeat(voteCandidate);
      return;
    }

    if (pendingQueuedBeat) {
      setQueuedBeat(null);
      beginBeat(pendingQueuedBeat);
      return;
    }

    setCanShowPrivateDrawer(true);
  }, [beginBeat]);

  React.useEffect(() => {
    if (!gameState) return;

    if (suppressCatchUpTransitions) {
      clearCompletionTimer();
      clearWatchdogTimer();
      setActiveBeat(null);
      setQueuedBeat(null);
      setDisplayMajorBeat(null);
      setDisplayVoteReveal(null);
      setCanShowPrivateDrawer(true);
      previousSnapshotRef.current = createSnapshot(gameState);
      return;
    }

    const snapshot = createSnapshot(gameState);

    if (!previousSnapshotRef.current) {
      previousSnapshotRef.current = snapshot;
      const initialBeat = getInitialMajorBeat(gameState);
      if (initialBeat) {
        const candidate = createMajorBeatCandidate(initialBeat, gameState.players);
        if (activeBeatRef.current) {
          setQueuedBeat(candidate);
        } else {
          beginBeat(candidate);
        }
      }
      return;
    }

    const majorBeat = getMajorBeatFromTransition(previousSnapshotRef.current, gameState);
    previousSnapshotRef.current = snapshot;

    if (!majorBeat) return;

    const candidate = createMajorBeatCandidate(majorBeat, gameState.players);
    if (activeBeatRef.current) {
      setQueuedBeat(candidate);
      return;
    }

    beginBeat(candidate);
  }, [
    beginBeat,
    clearCompletionTimer,
    clearWatchdogTimer,
    gameState,
    suppressCatchUpTransitions,
  ]);

  React.useEffect(() => {
    if (activeBeat?.type !== 'vote-reveal') return undefined;
    if (!voteReveal?.isResolving || voteReveal.revealId !== activeBeat.voteReveal?.revealId) return undefined;
    if (!voteReveal.isComplete) return undefined;

    clearCompletionTimer();
    completionTimerRef.current = window.setTimeout(() => {
      completeBeat(activeBeat.token);
    }, voteReveal.voteRevealFinalHoldMs || 0);

    return clearCompletionTimer;
  }, [activeBeat, clearCompletionTimer, completeBeat, voteReveal]);

  React.useEffect(() => {
    if (!activeBeat?.expectedDurationMs) return undefined;

    clearWatchdogTimer();
    watchdogTimerRef.current = window.setTimeout(() => {
      completeBeat(activeBeat.token);
    }, activeBeat.expectedDurationMs);

    return clearWatchdogTimer;
  }, [activeBeat, clearWatchdogTimer, completeBeat]);

  React.useEffect(() => {
    if (activeBeat) return;
    resolveNextBeat();
  }, [activeBeat, resolveNextBeat, voteReveal]);

  React.useEffect(() => {
    if (!displayVoteRevealRef.current?.revealId || !voteReveal?.revealId) return;
    if (displayVoteRevealRef.current.revealId !== voteReveal.revealId) return;

    const currentSignature = `${displayVoteRevealRef.current.revealId}:${displayVoteRevealRef.current.revealStage}:${displayVoteRevealRef.current.revealProgressCount}:${displayVoteRevealRef.current.isComplete ? 'done' : 'live'}`;
    const nextSignature = `${voteReveal.revealId}:${voteReveal.revealStage}:${voteReveal.revealProgressCount}:${voteReveal.isComplete ? 'done' : 'live'}`;

    if (currentSignature === nextSignature) return;
    setDisplayVoteReveal(voteReveal);
  }, [voteReveal]);

  React.useEffect(() => () => {
    clearCompletionTimer();
    clearWatchdogTimer();
  }, [clearCompletionTimer, clearWatchdogTimer]);

  return {
    activeBeat,
    queuedBeat,
    displayVoteReveal,
    majorPublicBeat: displayMajorBeat,
    canShowPrivateDrawer,
    beginBeat,
    completeBeat,
    forceReleaseActiveBeat,
  };
}
