import React from 'react';
import { EXECUTIVE_POWERS, PHASES } from '../../lib/constants';

const ROUTINE_BOARD_SETTLE_MS = 900;
const VOTE_REVEAL_FINAL_HOLD_MS = 700;
const NOMINATION_LOCKED_MS = 1500;
const VETO_REQUEST_MS = 1800;
const EXECUTION_BEAT_MS = 1800;
const GAME_OVER_BEAT_MS = 2000;

const getPlayerName = (gameState, playerId, fallback = 'Someone') =>
  gameState?.players?.find((player) => player.id === playerId)?.name || fallback;

const createMajorBeat = ({
  key,
  stageLabel,
  title,
  description,
  tone = 'neutral',
  autoCloseMs,
  compact = true,
}) => ({
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

const sameBoardStatus = (left, right) => {
  if (!left && !right) return true;
  if (!left || !right) return false;
  return (
    left.key === right.key &&
    left.label === right.label &&
    left.title === right.title &&
    left.description === right.description &&
    left.tone === right.tone &&
    JSON.stringify(left.chips || []) === JSON.stringify(right.chips || [])
  );
};

const createVoteBeatCandidate = (voteReveal) => ({
  token: `vote:${voteReveal.revealId}`,
  type: 'vote-reveal',
  minDuration: 0,
  voteReveal,
});

const createRoutineBeatCandidate = (boardStatus) => ({
  token: boardStatus.key,
  type: 'routine',
  minDuration: ROUTINE_BOARD_SETTLE_MS,
  boardStatus,
});

const createMajorBeatCandidate = (majorBeat) => ({
  token: majorBeat.key,
  type: 'major',
  minDuration: majorBeat.autoCloseMs,
  majorBeat,
});

function getMajorBeatForExecution(gameState) {
  if (gameState.executivePower !== EXECUTIVE_POWERS.EXECUTION) return null;

  const presidentName = getPlayerName(gameState, gameState.currentPresident, 'The President');

  return createMajorBeat({
    key: `major:executive-execution:${gameState.currentPresident || 'none'}`,
    stageLabel: 'Executive Action',
    title: `${presidentName} Is Choosing An Execution`,
    description: 'The President is eliminating one player from the table.',
    tone: 'red',
    autoCloseMs: EXECUTION_BEAT_MS,
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
      key: `major:nominated:${gameState.currentPresident || 'none'}:${gameState.nominatedChancellor}`,
      stageLabel: 'Nomination Locked',
      title: `${presidentName} Nominated ${nomineeName}`,
      description: 'The ballot is locked. The table is moving into a government vote.',
      tone: 'blue',
      autoCloseMs: NOMINATION_LOCKED_MS,
    });
  }

  if (!previous.vetoRequested && gameState.vetoRequested) {
    return createMajorBeat({
      key: `major:veto-request:${gameState.currentPresident || 'none'}:${gameState.currentChancellor || 'none'}`,
      stageLabel: 'Veto Request',
      title: `${chancellorName} Requested A Veto`,
      description: `${presidentName} must now accept or reject the veto request.`,
      tone: 'red',
      autoCloseMs: VETO_REQUEST_MS,
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
      key: `major:game-over:${gameState.winner || 'none'}:${gameState.winReason || 'unknown'}`,
      stageLabel: isHitlerElectionWin ? 'Hitler Elected' : 'Game Over',
      title: isHitlerElectionWin
        ? 'Hitler Was Elected Chancellor'
        : gameState.winner === 'LIBERAL'
          ? 'Liberal Victory'
          : 'Fascist Victory',
      description: gameState.winReason || 'The match has ended.',
      tone: gameState.winner === 'LIBERAL' ? 'blue' : 'red',
      autoCloseMs: GAME_OVER_BEAT_MS,
    });
  }

  return null;
}

function getInitialMajorBeat(gameState) {
  if (gameState.phase === PHASES.LEGISLATIVE_CHANCELLOR && gameState.vetoRequested) {
    return createMajorBeat({
      key: `major:init-veto-request:${gameState.currentPresident || 'none'}:${gameState.currentChancellor || 'none'}`,
      stageLabel: 'Veto Request',
      title: `${getPlayerName(
        gameState,
        gameState.currentChancellor || gameState.nominatedChancellor,
        'The Chancellor',
      )} Requested A Veto`,
      description: `${getPlayerName(gameState, gameState.currentPresident, 'The President')} must now accept or reject the veto request.`,
      tone: 'red',
      autoCloseMs: VETO_REQUEST_MS,
    });
  }

  if (gameState.phase === PHASES.EXECUTIVE_ACTION) {
    return getMajorBeatForExecution(gameState);
  }

  if (gameState.phase === PHASES.GAME_OVER) {
    return createMajorBeat({
      key: `major:init-game-over:${gameState.winner || 'none'}:${gameState.winReason || 'unknown'}`,
      stageLabel: 'Game Over',
      title: gameState.winner === 'LIBERAL' ? 'Liberal Victory' : 'Fascist Victory',
      description: gameState.winReason || 'The match has ended.',
      tone: gameState.winner === 'LIBERAL' ? 'blue' : 'red',
      autoCloseMs: GAME_OVER_BEAT_MS,
    });
  }

  return null;
}

function isMajorBeatStillRelevant(beat, gameState) {
  if (!beat) return false;

  if (beat.key.includes('nominated')) {
    return (
      gameState.nominatedChancellor &&
      (gameState.phase === PHASES.VOTING || gameState.phase === PHASES.NOMINATION)
    );
  }

  if (beat.key.includes('veto-request')) {
    return Boolean(gameState.vetoRequested);
  }

  if (beat.key.includes('executive-execution')) {
    return gameState.phase === PHASES.EXECUTIVE_ACTION && gameState.executivePower === EXECUTIVE_POWERS.EXECUTION;
  }

  if (beat.key.includes('game-over')) {
    return gameState.phase === PHASES.GAME_OVER;
  }

  return true;
}

export default function useLiveTransitionGate({
  gameState,
  boardStatus,
  voteReveal,
}) {
  const [displayBoardStatus, setDisplayBoardStatus] = React.useState(boardStatus || null);
  const [displayVoteReveal, setDisplayVoteReveal] = React.useState(null);
  const [displayMajorBeat, setDisplayMajorBeat] = React.useState(null);
  const [activeBeat, setActiveBeat] = React.useState(null);
  const [queuedBeat, setQueuedBeat] = React.useState(null);
  const [canShowPrivateDrawer, setCanShowPrivateDrawer] = React.useState(false);
  const activeBeatRef = React.useRef(null);
  const queuedBeatRef = React.useRef(null);
  const displayBoardStatusRef = React.useRef(boardStatus || null);
  const displayVoteRevealRef = React.useRef(null);
  const latestRawRef = React.useRef({ gameState, boardStatus, voteReveal });
  const previousSnapshotRef = React.useRef(null);
  const timerRef = React.useRef(null);
  const consumedVoteRevealIdsRef = React.useRef(new Set());

  React.useEffect(() => {
    latestRawRef.current = { gameState, boardStatus, voteReveal };
  }, [boardStatus, gameState, voteReveal]);

  React.useEffect(() => {
    activeBeatRef.current = activeBeat;
  }, [activeBeat]);

  React.useEffect(() => {
    queuedBeatRef.current = queuedBeat;
  }, [queuedBeat]);

  React.useEffect(() => {
    displayBoardStatusRef.current = displayBoardStatus;
  }, [displayBoardStatus]);

  React.useEffect(() => {
    displayVoteRevealRef.current = displayVoteReveal;
  }, [displayVoteReveal]);

  const clearBeatTimer = React.useCallback(() => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const beginBeat = React.useCallback((token, type, minDuration, payload = {}) => {
    clearBeatTimer();
    setCanShowPrivateDrawer(false);

    const nextBeat = { token, type, minDuration, ...payload };
    setActiveBeat(nextBeat);

    if (type === 'routine' && payload.boardStatus) {
      setDisplayBoardStatus(payload.boardStatus);
    }

    if (type === 'vote-reveal' && payload.voteReveal) {
      setDisplayVoteReveal(payload.voteReveal);
    }

    if (type === 'major' && payload.majorBeat) {
      setDisplayMajorBeat(payload.majorBeat);
    }
  }, [clearBeatTimer]);

  const completeBeat = React.useCallback((token) => {
    if (!activeBeatRef.current || activeBeatRef.current.token !== token) return;

    clearBeatTimer();
    const completedBeat = activeBeatRef.current;

    if (completedBeat.type === 'major') {
      setDisplayMajorBeat(null);
    }

    if (completedBeat.type === 'vote-reveal') {
      if (completedBeat.voteReveal?.revealId) {
        consumedVoteRevealIdsRef.current.add(completedBeat.voteReveal.revealId);
      }
      setDisplayVoteReveal(null);
    }

    setActiveBeat(null);
  }, [clearBeatTimer]);

  const resolveNextBeat = React.useCallback(() => {
    const raw = latestRawRef.current;
    const pendingMajor =
      queuedBeatRef.current && queuedBeatRef.current.type === 'major' && isMajorBeatStillRelevant(queuedBeatRef.current.majorBeat, raw.gameState)
        ? queuedBeatRef.current
        : null;

    if (queuedBeatRef.current && !pendingMajor) {
      setQueuedBeat(null);
    }

    const voteCandidate =
      raw.voteReveal?.isResolving &&
      raw.voteReveal.revealId &&
      !consumedVoteRevealIdsRef.current.has(raw.voteReveal.revealId) &&
      displayVoteRevealRef.current?.revealId !== raw.voteReveal.revealId
        ? createVoteBeatCandidate(raw.voteReveal)
        : null;

    if (voteCandidate) {
      beginBeat(voteCandidate.token, voteCandidate.type, voteCandidate.minDuration, voteCandidate);
      return;
    }

    if (pendingMajor) {
      setQueuedBeat(null);
      beginBeat(pendingMajor.token, pendingMajor.type, pendingMajor.minDuration, pendingMajor);
      return;
    }

    if (
      raw.boardStatus &&
      raw.boardStatus.key &&
      displayBoardStatusRef.current?.key !== raw.boardStatus.key
    ) {
      const routineCandidate = createRoutineBeatCandidate(raw.boardStatus);
      beginBeat(routineCandidate.token, routineCandidate.type, routineCandidate.minDuration, routineCandidate);
      return;
    }

    setCanShowPrivateDrawer(true);
  }, [beginBeat]);

  React.useEffect(() => {
    const snapshot = createSnapshot(gameState);

    if (!previousSnapshotRef.current) {
      previousSnapshotRef.current = snapshot;
      const initialBeat = getInitialMajorBeat(gameState);
      if (initialBeat) {
        const candidate = createMajorBeatCandidate(initialBeat);
        if (activeBeatRef.current) {
          setQueuedBeat(candidate);
        } else {
          beginBeat(candidate.token, candidate.type, candidate.minDuration, candidate);
        }
      }
      return;
    }

    const majorBeat = getMajorBeatFromTransition(previousSnapshotRef.current, gameState);
    previousSnapshotRef.current = snapshot;

    if (!majorBeat) return;

    const candidate = createMajorBeatCandidate(majorBeat);
    if (activeBeatRef.current) {
      setQueuedBeat(candidate);
      return;
    }

    beginBeat(candidate.token, candidate.type, candidate.minDuration, candidate);
  }, [beginBeat, gameState]);

  React.useEffect(() => {
    if (activeBeat?.type !== 'routine') return undefined;

    clearBeatTimer();
    timerRef.current = window.setTimeout(() => {
      completeBeat(activeBeat.token);
    }, activeBeat.minDuration);

    return clearBeatTimer;
  }, [activeBeat, clearBeatTimer, completeBeat]);

  React.useEffect(() => {
    if (activeBeat?.type !== 'vote-reveal') return undefined;
    if (!voteReveal?.isResolving || voteReveal.revealId !== activeBeat.voteReveal?.revealId) return undefined;
    if (!voteReveal.isComplete) return undefined;

    clearBeatTimer();
    timerRef.current = window.setTimeout(() => {
      completeBeat(activeBeat.token);
    }, VOTE_REVEAL_FINAL_HOLD_MS);

    return clearBeatTimer;
  }, [activeBeat, clearBeatTimer, completeBeat, voteReveal]);

  React.useEffect(() => {
    if (activeBeat) return;
    resolveNextBeat();
  }, [activeBeat, boardStatus, resolveNextBeat, voteReveal]);

  React.useEffect(() => {
    if (activeBeat) return;
    if (!boardStatus || displayBoardStatusRef.current?.key !== boardStatus.key) return;
    if (sameBoardStatus(displayBoardStatusRef.current, boardStatus)) return;
    setDisplayBoardStatus(boardStatus);
  }, [activeBeat, boardStatus]);

  React.useEffect(() => {
    if (!displayVoteRevealRef.current?.revealId || !voteReveal?.revealId) return;
    if (displayVoteRevealRef.current.revealId !== voteReveal.revealId) return;

    const currentSignature = `${displayVoteRevealRef.current.revealId}:${displayVoteRevealRef.current.revealStage}:${displayVoteRevealRef.current.revealProgressCount}:${displayVoteRevealRef.current.isComplete ? 'done' : 'live'}`;
    const nextSignature = `${voteReveal.revealId}:${voteReveal.revealStage}:${voteReveal.revealProgressCount}:${voteReveal.isComplete ? 'done' : 'live'}`;

    if (currentSignature === nextSignature) return;
    setDisplayVoteReveal(voteReveal);
  }, [voteReveal]);

  React.useEffect(() => () => {
    clearBeatTimer();
  }, [clearBeatTimer]);

  return {
    activeBeat,
    queuedBeat,
    displayBoardStatus,
    displayVoteReveal,
    majorPublicBeat: displayMajorBeat,
    canShowPrivateDrawer,
    canAdvanceRoutineStatus: !activeBeat,
    beginBeat,
    completeBeat,
  };
}
