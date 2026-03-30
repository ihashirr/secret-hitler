import React from 'react';
import { useConvex, useConvexConnectionState } from 'convex/react';
import { api } from '../../../backend/convex/_generated/api';
import { PHASES } from '../../lib/constants';
import { getLiveTempoProfile } from './liveTempoProfile';

const LIVE_PHASE_SET = new Set([
  PHASES.NOMINATION,
  PHASES.VOTING,
  PHASES.LEGISLATIVE_PRESIDENT,
  PHASES.LEGISLATIVE_CHANCELLOR,
  PHASES.EXECUTIVE_ACTION,
  PHASES.GAME_OVER,
]);

const buildSortedVoteSignature = (votes) =>
  votes
    ? Object.entries(votes)
        .sort(([leftId], [rightId]) => leftId.localeCompare(rightId))
        .map(([playerId, vote]) => `${playerId}:${vote}`)
        .join('|')
    : '';

export const buildLiveStateSignature = (gameState) => {
  if (!gameState) return 'no-live-state';

  const playerSignature = [...(gameState.players || [])]
    .sort((left, right) => (left.position || 0) - (right.position || 0) || left.id.localeCompare(right.id))
    .map((player) =>
      [
        player.id,
        player.isAlive ? 'alive' : 'dead',
        player.hasVoted ? 'locked' : 'open',
        player.lastVote || 'none',
        player.isPresident ? 'pres' : '',
        player.isChancellor ? 'chan' : '',
      ]
        .filter(Boolean)
        .join(':'),
    )
    .join(';');

  return JSON.stringify({
    roomId: gameState.roomId || null,
    phase: gameState.phase || null,
    president: gameState.currentPresident || null,
    chancellor: gameState.currentChancellor || null,
    nominee: gameState.nominatedChancellor || null,
    liberalPolicies: gameState.liberalPolicies || 0,
    fascistPolicies: gameState.fascistPolicies || 0,
    electionTracker: gameState.electionTracker || 0,
    executivePower: gameState.executivePower || null,
    vetoRequested: Boolean(gameState.vetoRequested),
    vetoRejected: Boolean(gameState.vetoRejected),
    chaosTriggered: Boolean(gameState.chaosTriggered),
    chaosPolicy: gameState.chaosPolicy || null,
    winner: gameState.winner || null,
    winReason: gameState.winReason || null,
    specialElectionCallerId: gameState.specialElectionCallerId || null,
    drawPileCount: gameState.drawPileCount || 0,
    discardPileCount: gameState.discardPileCount || 0,
    drawnCardsLength: Array.isArray(gameState.drawnCards) ? gameState.drawnCards.length : 0,
    peekedPoliciesLength: Array.isArray(gameState.peekedPolicies) ? gameState.peekedPolicies.length : 0,
    investigatedPlayerIds: [...(gameState.investigatedPlayerIds || [])].sort().join('|'),
    lastVotes: buildSortedVoteSignature(gameState.lastVotes),
    players: playerSignature,
  });
};

export default function useLiveStateHealth({
  roomId,
  playerId,
  gameState,
  gateState,
  liveViewKey,
  onForceReleaseGate,
}) {
  const convex = useConvex();
  const connectionState = useConvexConnectionState();
  const [overrideGameState, setOverrideGameState] = React.useState(null);
  const [lastSubscriptionChangeAt, setLastSubscriptionChangeAt] = React.useState(() => Date.now());
  const [lastSuccessfulHealthCheckAt, setLastSuccessfulHealthCheckAt] = React.useState(0);

  const rawStateSignature = React.useMemo(() => buildLiveStateSignature(gameState), [gameState]);
  const rawStateSignatureRef = React.useRef(rawStateSignature);
  const overrideSignature = React.useMemo(
    () => (overrideGameState ? buildLiveStateSignature(overrideGameState) : null),
    [overrideGameState],
  );
  const suppressCatchUpTransitions = Boolean(overrideGameState) && overrideSignature !== rawStateSignature;
  const effectiveGameState = suppressCatchUpTransitions ? overrideGameState : gameState;
  const effectiveStateSignature = suppressCatchUpTransitions
    ? overrideSignature || rawStateSignature
    : rawStateSignature;
  const liveTempo = React.useMemo(
    () => getLiveTempoProfile(gameState?.players || []),
    [gameState?.players],
  );
  const lastHealthCheckAttemptRef = React.useRef(0);
  const connectionStateRef = React.useRef(connectionState);
  const lastRenderedSignatureRef = React.useRef(effectiveStateSignature);

  React.useEffect(() => {
    rawStateSignatureRef.current = rawStateSignature;
  }, [rawStateSignature]);

  React.useEffect(() => {
    lastRenderedSignatureRef.current = effectiveStateSignature;
  }, [effectiveStateSignature]);

  React.useEffect(() => {
    if (!gameState) return;
    setLastSubscriptionChangeAt(Date.now());
  }, [gameState, rawStateSignature]);

  React.useEffect(() => {
    if (!overrideGameState || overrideSignature !== rawStateSignature) return;
    setOverrideGameState(null);
  }, [overrideGameState, overrideSignature, rawStateSignature]);

  const runHealthCheck = React.useCallback(async (reason) => {
    if (!roomId || !LIVE_PHASE_SET.has(gameState?.phase) || liveViewKey !== 'LIVE_GAME') return null;

    const now = Date.now();
    if (now - lastHealthCheckAttemptRef.current < liveTempo.healthCheckThrottleMs) {
      return null;
    }

    lastHealthCheckAttemptRef.current = now;

    try {
      const freshState = await convex.query(api.game.getGameState, {
        roomId,
        playerId: playerId ?? null,
      });

      if (!freshState) return null;

      const freshSignature = buildLiveStateSignature(freshState);
      setLastSuccessfulHealthCheckAt(Date.now());

      if (freshSignature !== rawStateSignatureRef.current) {
        setOverrideGameState(freshState);
        onForceReleaseGate?.(`health-check:${reason}`);
      }

      return freshState;
    } catch {
      return null;
    }
  }, [convex, gameState?.phase, liveTempo.healthCheckThrottleMs, liveViewKey, onForceReleaseGate, playerId, roomId]);

  React.useEffect(() => {
    if (liveViewKey !== 'LIVE_GAME') return undefined;

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        void runHealthCheck('visibility');
      }
    };

    const handleFocus = () => {
      void runHealthCheck('focus');
    };

    const handlePageShow = () => {
      void runHealthCheck('pageshow');
    };

    const handleOnline = () => {
      void runHealthCheck('online');
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('pageshow', handlePageShow);
    window.addEventListener('online', handleOnline);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('pageshow', handlePageShow);
      window.removeEventListener('online', handleOnline);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [liveViewKey, runHealthCheck]);

  React.useEffect(() => {
    const previousConnectionState = connectionStateRef.current;
    connectionStateRef.current = connectionState;

    const recoveredConnection =
      (!previousConnectionState.isWebSocketConnected && connectionState.isWebSocketConnected) ||
      (
        connectionState.isWebSocketConnected &&
        connectionState.connectionCount > previousConnectionState.connectionCount
      );

    if (recoveredConnection) {
      void runHealthCheck('convex-recovered');
    }
  }, [connectionState, runHealthCheck]);

  React.useEffect(() => {
    if (!gameState || liveViewKey !== 'LIVE_GAME' || !LIVE_PHASE_SET.has(gameState.phase)) {
      return undefined;
    }

    const watchdog = window.setInterval(() => {
      const now = Date.now();
      const activeBeat = gateState?.activeBeat;

      if (
        activeBeat &&
        activeBeat.startedAt &&
        activeBeat.expectedDurationMs &&
        now - activeBeat.startedAt > activeBeat.expectedDurationMs
      ) {
        onForceReleaseGate?.(`expired:${activeBeat.type}`);
      }

      if (
        rawStateSignatureRef.current !== lastRenderedSignatureRef.current &&
        !activeBeat
      ) {
        onForceReleaseGate?.('render-lag');
      }

      if (
        now - lastSubscriptionChangeAt > liveTempo.liveStateIdleHealthCheckMs &&
        !connectionState.hasInflightRequests
      ) {
        void runHealthCheck('idle-watchdog');
      }
    }, 1000);

    return () => {
      window.clearInterval(watchdog);
    };
  }, [
    connectionState.hasInflightRequests,
    gameState,
    gateState?.activeBeat,
    lastSubscriptionChangeAt,
    liveTempo.liveStateIdleHealthCheckMs,
    liveViewKey,
    onForceReleaseGate,
    runHealthCheck,
  ]);

  return {
    effectiveGameState,
    suppressCatchUpTransitions,
    rawStateSignature,
    effectiveStateSignature,
    lastSubscriptionChangeAt,
    lastSuccessfulHealthCheckAt,
  };
}
