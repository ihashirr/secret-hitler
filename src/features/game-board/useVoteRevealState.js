import React from 'react';
import { PHASES } from '../../lib/constants';
import {
  VOTE_REVEAL_DURATION_MS,
  VOTE_REVEAL_STAGE_DELAY_MS,
} from './boardConfig';

export default function useVoteRevealState(gameState) {
  const [revealState, setRevealState] = React.useState(null);
  const [revealStage, setRevealStage] = React.useState(0);
  const [recentVoteIds, setRecentVoteIds] = React.useState([]);
  const [revealedVoteIds, setRevealedVoteIds] = React.useState([]);
  const [revealedVoteTotals, setRevealedVoteTotals] = React.useState({ YA: 0, NEIN: 0 });
  const prevPhaseRef = React.useRef(gameState.phase);
  const prevVoteStateRef = React.useRef({});
  const voteStateReadyRef = React.useRef(false);
  const voteHighlightTimersRef = React.useRef(new Map());

  React.useEffect(() => () => {
    voteHighlightTimersRef.current.forEach((timer) => window.clearTimeout(timer));
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
      prevVoteStateRef.current = nextVoteState;
      return undefined;
    }

    const justVotedIds = gameState.players
      .filter((player) => player.isAlive && player.hasVoted && !prevVoteStateRef.current[player.id])
      .map((player) => player.id);

    prevVoteStateRef.current = nextVoteState;

    if (!justVotedIds.length) return undefined;

    setRecentVoteIds((current) => Array.from(new Set([...current, ...justVotedIds])));

    justVotedIds.forEach((id) => {
      const existingTimer = voteHighlightTimersRef.current.get(id);
      if (existingTimer) {
        window.clearTimeout(existingTimer);
      }

      const timer = window.setTimeout(() => {
        setRecentVoteIds((current) => current.filter((currentId) => currentId !== id));
        voteHighlightTimersRef.current.delete(id);
      }, 650);

      voteHighlightTimersRef.current.set(id, timer);
    });

    return undefined;
  }, [gameState.phase, gameState.players]);

  React.useEffect(() => {
    if (prevPhaseRef.current === PHASES.VOTING && gameState.phase !== PHASES.VOTING && gameState.lastVotes) {
      let ya = 0;
      let nein = 0;

      Object.values(gameState.lastVotes).forEach((vote) => {
        if (vote === 'YA') ya += 1;
        else nein += 1;
      });

      setRevealState({
        id: `${gameState.phase}-${Date.now()}`,
        result: ya > nein ? 'APPROVED' : 'REJECTED',
        votes: gameState.lastVotes,
        ya,
        nein,
      });
    }

    prevPhaseRef.current = gameState.phase;
  }, [gameState.phase, gameState.lastVotes]);

  React.useEffect(() => {
    if (!revealState?.id) return undefined;

    setRevealStage(0);

    const revealTimer = window.setTimeout(() => setRevealStage(1), VOTE_REVEAL_STAGE_DELAY_MS);
    const cleanupTimer = window.setTimeout(() => {
      setRevealState((current) => (current?.id === revealState.id ? null : current));
      setRevealStage(0);
    }, VOTE_REVEAL_DURATION_MS);

    return () => {
      window.clearTimeout(revealTimer);
      window.clearTimeout(cleanupTimer);
    };
  }, [revealState?.id]);

  React.useEffect(() => {
    if (gameState.phase === PHASES.VOTING || !revealState?.votes) {
      setRevealedVoteIds([]);
      setRevealedVoteTotals({ YA: 0, NEIN: 0 });
      return undefined;
    }

    const orderedPlayers = [...gameState.players]
      .filter((player) => player.isAlive && revealState.votes[player.id])
      .sort((left, right) => (left.position || 0) - (right.position || 0));

    setRevealedVoteIds([]);
    setRevealedVoteTotals({ YA: 0, NEIN: 0 });

    const timers = orderedPlayers.map((player, index) =>
      window.setTimeout(() => {
        const vote = revealState.votes[player.id];
        setRevealedVoteIds((current) => (current.includes(player.id) ? current : [...current, player.id]));
        setRevealedVoteTotals((current) => ({
          ...current,
          [vote]: (current[vote] || 0) + 1,
        }));
      }, 220 + index * 120),
    );

    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [gameState.phase, gameState.players, revealState]);

  return {
    recentVoteIds,
    revealStage,
    revealState,
    revealedVoteIds,
    revealedVoteTotals,
    setRevealState,
  };
}
