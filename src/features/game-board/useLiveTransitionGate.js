import React from 'react';
import { EXECUTIVE_POWERS, PHASES } from '../../lib/constants';
import {
  getExpectedVoteRevealDurationMs,
  getLiveTempoProfile,
  getStoryBeatDurationMs,
} from './liveTempoProfile';

const getPlayerName = (gameState, playerId, fallback = 'Someone') =>
  gameState?.players?.find((player) => player.id === playerId)?.name || fallback;

const createStoryBeat = ({
  kind,
  key,
  stageLabel,
  title,
  description,
  tone = 'neutral',
  autoCloseMs,
  compact = false,
  actorId = null,
  subjectId = null,
  policyType = null,
}) => ({
  kind,
  key,
  stageLabel,
  title,
  description,
  tone,
  autoCloseMs,
  compact,
  actorId,
  subjectId,
  policyType,
});

const createAutoTimedStoryBeat = (config, players = []) => {
  const beat = createStoryBeat(config);
  return {
    ...beat,
    autoCloseMs: getStoryBeatDurationMs({
      kind: beat.kind,
      title: beat.title,
      description: beat.description,
      players,
    }),
  };
};

const createSnapshot = (gameState) => ({
  phase: gameState.phase,
  currentPresident: gameState.currentPresident || null,
  nominatedChancellor: gameState.nominatedChancellor || null,
  currentChancellor: gameState.currentChancellor || null,
  executivePower: gameState.executivePower || null,
  vetoRequested: Boolean(gameState.vetoRequested),
  winner: gameState.winner || null,
  winReason: gameState.winReason || null,
  liberalPolicies: gameState.liberalPolicies || 0,
  fascistPolicies: gameState.fascistPolicies || 0,
  electionTracker: gameState.electionTracker || 0,
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

const createStoryBeatCandidate = (majorBeat, players = []) => ({
  token: majorBeat.key,
  type: 'major',
  expectedDurationMs: majorBeat.autoCloseMs + getLiveTempoProfile(players).majorBeatGraceMs,
  majorBeat,
});

function getExecutionBeat(gameState) {
  if (gameState.executivePower !== EXECUTIVE_POWERS.EXECUTION) return null;

  const presidentName = getPlayerName(gameState, gameState.currentPresident, 'The President');

  return createAutoTimedStoryBeat({
    kind: 'execution',
    key: `major:executive-execution:${gameState.currentPresident || 'none'}`,
    stageLabel: 'Executive Action',
    title: `${presidentName} Is Choosing An Execution`,
    description: 'One player will be eliminated from the table.',
    tone: 'red',
    actorId: gameState.currentPresident || null,
  }, gameState.players);
}

function getPolicyBeat(gameState, policyType) {
  if (!policyType) return null;

  const isLiberal = policyType === 'LIBERAL';
  const executiveCopy =
    !isLiberal && gameState.phase === PHASES.EXECUTIVE_ACTION
      ? gameState.executivePower === EXECUTIVE_POWERS.EXECUTION
        ? 'An execution power is now live.'
        : gameState.executivePower === EXECUTIVE_POWERS.PEEK
          ? 'The President now reviews the top three policies.'
          : gameState.executivePower === EXECUTIVE_POWERS.INVESTIGATE
            ? 'The President now investigates one player.'
            : gameState.executivePower === EXECUTIVE_POWERS.SPECIAL_ELECTION
              ? 'A special election must now be called.'
              : 'The fascist track advances.'
      : gameState.phase === PHASES.GAME_OVER
        ? 'The match has reached its ending state.'
        : isLiberal
          ? 'The liberal track advances by one.'
          : 'The fascist track advances by one.';

  return createAutoTimedStoryBeat({
    kind: 'policy-enacted',
    key: `major:policy-enacted:${policyType}:${gameState.liberalPolicies}:${gameState.fascistPolicies}:${gameState.phase}`,
    stageLabel: 'Policy Enacted',
    title: isLiberal ? 'Liberal Policy Enacted' : 'Fascist Policy Enacted',
    description: executiveCopy,
    tone: isLiberal ? 'blue' : 'red',
    policyType,
  }, gameState.players);
}

function getStoryBeatsFromTransition(previous, gameState) {
  if (!previous) return [];

  const beats = [];
  const presidentName = getPlayerName(gameState, gameState.currentPresident, 'The President');
  const nomineeName = getPlayerName(gameState, gameState.nominatedChancellor, 'the nominee');
  const chancellorId = gameState.currentChancellor || gameState.nominatedChancellor || null;
  const chancellorName = getPlayerName(gameState, chancellorId, 'The Chancellor');
  const liberalAdvanced = previous.liberalPolicies !== gameState.liberalPolicies;
  const fascistAdvanced = previous.fascistPolicies !== gameState.fascistPolicies;

  if (previous.nominatedChancellor !== gameState.nominatedChancellor && gameState.nominatedChancellor) {
    beats.push(createAutoTimedStoryBeat({
      kind: 'nomination-locked',
      key: `major:nominated:${gameState.currentPresident || 'none'}:${gameState.nominatedChancellor}`,
      stageLabel: 'Nomination Locked',
      title: `${presidentName} Nominated ${nomineeName}`,
      description: 'The table is moving into a government vote.',
      tone: 'blue',
      actorId: gameState.currentPresident || null,
      subjectId: gameState.nominatedChancellor || null,
    }, gameState.players));
  }

  if (previous.phase !== gameState.phase && gameState.phase === PHASES.LEGISLATIVE_PRESIDENT) {
    beats.push(createAutoTimedStoryBeat({
      kind: 'policy-president',
      key: `major:policy-president:${gameState.currentPresident || 'none'}:${chancellorId || 'none'}:${gameState.liberalPolicies}:${gameState.fascistPolicies}`,
      stageLabel: 'Policy Review',
      title: `${presidentName} Is Reviewing Three Policies`,
      description: `Two policies will be passed to ${chancellorName}.`,
      tone: 'neutral',
      actorId: gameState.currentPresident || null,
      subjectId: chancellorId,
    }, gameState.players));
  }

  if (
    previous.phase !== gameState.phase &&
    gameState.phase === PHASES.LEGISLATIVE_CHANCELLOR &&
    !gameState.vetoRequested
  ) {
    beats.push(createAutoTimedStoryBeat({
      kind: 'policy-chancellor',
      key: `major:policy-chancellor:${gameState.currentPresident || 'none'}:${chancellorId || 'none'}:${gameState.liberalPolicies}:${gameState.fascistPolicies}`,
      stageLabel: 'Final Decision',
      title: `${chancellorName} Is Choosing The Final Policy`,
      description: 'One of the remaining policies will be enacted.',
      tone: 'neutral',
      actorId: chancellorId,
      subjectId: gameState.currentPresident || null,
    }, gameState.players));
  }

  if (liberalAdvanced || fascistAdvanced) {
    beats.push(getPolicyBeat(gameState, liberalAdvanced ? 'LIBERAL' : 'FASCIST'));
  }

  if (!previous.vetoRequested && gameState.vetoRequested) {
    beats.push(createAutoTimedStoryBeat({
      kind: 'veto-request',
      key: `major:veto-request:${gameState.currentPresident || 'none'}:${chancellorId || 'none'}`,
      stageLabel: 'Veto Request',
      title: `${chancellorName} Requested A Veto`,
      description: `${presidentName} must now accept or reject the request.`,
      tone: 'red',
      actorId: chancellorId,
      subjectId: gameState.currentPresident || null,
    }, gameState.players));
  }

  if (previous.phase !== gameState.phase && gameState.phase === PHASES.EXECUTIVE_ACTION) {
    const executionBeat = getExecutionBeat(gameState);
    if (executionBeat) {
      beats.push(executionBeat);
    }
  }

  if (previous.phase !== PHASES.GAME_OVER && gameState.phase === PHASES.GAME_OVER) {
    const isHitlerElectionWin =
      typeof gameState.winReason === 'string' &&
      gameState.winReason.toLowerCase().includes('hitler was elected chancellor');

    beats.push(createAutoTimedStoryBeat({
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
    }, gameState.players));
  }

  return beats.filter(Boolean);
}

function getInitialStoryBeats(gameState) {
  if (gameState.phase === PHASES.LEGISLATIVE_CHANCELLOR && gameState.vetoRequested) {
    return [
      createAutoTimedStoryBeat({
        kind: 'veto-request',
        key: `major:init-veto-request:${gameState.currentPresident || 'none'}:${gameState.currentChancellor || 'none'}`,
        stageLabel: 'Veto Request',
        title: `${getPlayerName(
          gameState,
          gameState.currentChancellor || gameState.nominatedChancellor,
          'The Chancellor',
        )} Requested A Veto`,
        description: `${getPlayerName(gameState, gameState.currentPresident, 'The President')} must now accept or reject the request.`,
        tone: 'red',
        actorId: gameState.currentChancellor || gameState.nominatedChancellor || null,
        subjectId: gameState.currentPresident || null,
      }, gameState.players),
    ];
  }

  if (gameState.phase === PHASES.EXECUTIVE_ACTION) {
    const executionBeat = getExecutionBeat(gameState);
    return executionBeat ? [executionBeat] : [];
  }

  if (gameState.phase === PHASES.GAME_OVER) {
    return [
      createAutoTimedStoryBeat({
        kind: 'game-over',
        key: `major:init-game-over:${gameState.winner || 'none'}:${gameState.winReason || 'unknown'}`,
        stageLabel: 'Game Over',
        title: gameState.winner === 'LIBERAL' ? 'Liberal Victory' : 'Fascist Victory',
        description: gameState.winReason || 'The match has ended.',
        tone: gameState.winner === 'LIBERAL' ? 'blue' : 'red',
      }, gameState.players),
    ];
  }

  return [];
}

function isQueuedBeatStillRelevant(beat, rawState, consumedVoteRevealIds) {
  if (!beat) return false;

  if (beat.type === 'major') {
    return true;
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
  const [queuedBeats, setQueuedBeats] = React.useState([]);
  const [canShowPrivateDrawer, setCanShowPrivateDrawer] = React.useState(true);

  const activeBeatRef = React.useRef(null);
  const queuedBeatsRef = React.useRef([]);
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
    queuedBeatsRef.current = queuedBeats;
  }, [queuedBeats]);

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
      setQueuedBeats([]);
      setCanShowPrivateDrawer(true);
      return;
    }

    const pendingQueuedBeats = (queuedBeatsRef.current || []).filter((beat) =>
      isQueuedBeatStillRelevant(beat, raw, consumedVoteRevealIdsRef.current),
    );

    if (pendingQueuedBeats.length !== queuedBeatsRef.current.length) {
      setQueuedBeats(pendingQueuedBeats);
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

    if (pendingQueuedBeats.length) {
      const [nextBeat, ...remainingBeats] = pendingQueuedBeats;
      setQueuedBeats(remainingBeats);
      beginBeat(nextBeat);
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
      setQueuedBeats([]);
      setDisplayMajorBeat(null);
      setDisplayVoteReveal(null);
      setCanShowPrivateDrawer(true);
      previousSnapshotRef.current = createSnapshot(gameState);
      return;
    }

    const snapshot = createSnapshot(gameState);

    if (!previousSnapshotRef.current) {
      previousSnapshotRef.current = snapshot;
      const initialCandidates = getInitialStoryBeats(gameState).map((beat) =>
        createStoryBeatCandidate(beat, gameState.players),
      );

      if (!initialCandidates.length) return;

      if (activeBeatRef.current) {
        setQueuedBeats(initialCandidates);
      } else {
        const [firstBeat, ...remainingBeats] = initialCandidates;
        beginBeat(firstBeat);
        setQueuedBeats(remainingBeats);
      }
      return;
    }

    const transitionCandidates = getStoryBeatsFromTransition(previousSnapshotRef.current, gameState)
      .map((beat) => createStoryBeatCandidate(beat, gameState.players));
    previousSnapshotRef.current = snapshot;

    if (!transitionCandidates.length) return;

    if (activeBeatRef.current) {
      setQueuedBeats((current) => [...current, ...transitionCandidates]);
      return;
    }

    const [firstBeat, ...remainingBeats] = transitionCandidates;
    beginBeat(firstBeat);
    if (remainingBeats.length) {
      setQueuedBeats((current) => [...current, ...remainingBeats]);
    }
  }, [
    beginBeat,
    clearCompletionTimer,
    clearWatchdogTimer,
    gameState,
    suppressCatchUpTransitions,
  ]);

  React.useEffect(() => {
    if (activeBeat?.type !== 'major') return undefined;
    if (!activeBeat.majorBeat?.autoCloseMs) return undefined;

    clearCompletionTimer();
    completionTimerRef.current = window.setTimeout(() => {
      completeBeat(activeBeat.token);
    }, activeBeat.majorBeat.autoCloseMs);

    return clearCompletionTimer;
  }, [activeBeat, clearCompletionTimer, completeBeat]);

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
    queuedBeat: queuedBeats[0] || null,
    displayVoteReveal,
    majorPublicBeat: displayMajorBeat,
    canShowPrivateDrawer,
    beginBeat,
    completeBeat,
    forceReleaseActiveBeat,
  };
}
