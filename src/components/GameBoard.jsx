import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  EXECUTIVE_POWERS,
  FASCIST_TO_WIN,
  LIBERAL_TO_WIN,
  MAX_ELECTION_TRACKER,
  PHASES,
} from '../lib/constants';
import { Bot, Shield, Skull } from 'lucide-react';
import FactionAccentText from './FactionAccentText';
import GameOverlay from './GameOverlay';
import { triggerHaptic } from '../lib/haptics';

const getStableNumber = (seed, min, max) => {
  let hash = 0;
  for (const char of seed) {
    hash = (hash * 31 + char.charCodeAt(0)) % 100000;
  }

  return min + (hash % (max - min + 1));
};

const getAvatarId = (player) => {
  if (player.avatarId) return player.avatarId;
  return getStableNumber(player.id || player.name || 'operative', 1, 10);
};

const getVoteStampRotation = (playerId, vote) => getStableNumber(`${playerId}-${vote}`, -10, 10);

const getTrackSlotMeta = (type, index) => {
  if (type === 'LIBERAL') {
    return index === LIBERAL_TO_WIN - 1 ? 'SECURE' : `0${index + 1}`;
  }

  if (index >= 2 && index <= 4) return 'ORDER';
  if (index === FASCIST_TO_WIN - 1) return 'WIN';
  return `0${index + 1}`;
};

const getVotingPlayerCardSize = (count) => {
  if (count >= 9) return 'min-h-[104px] max-w-[72px] sm:min-h-[112px] sm:max-w-[78px]';
  if (count >= 7) return 'min-h-[110px] max-w-[78px] sm:min-h-[118px] sm:max-w-[86px]';
  return 'min-h-[116px] max-w-[84px] sm:min-h-[126px] sm:max-w-[92px]';
};

const getTablePlayers = (players) =>
  [...players].sort((left, right) => (left.position || 0) - (right.position || 0));

const getTableRingSeatClass = (count) => {
  if (count >= 9) return 'h-[82px] w-[68px] sm:h-[90px] sm:w-[76px]';
  if (count >= 7) return 'h-[88px] w-[74px] sm:h-[98px] sm:w-[82px]';
  return 'h-[96px] w-[80px] sm:h-[108px] sm:w-[90px]';
};

const getTableRingSeatStyle = (index, total) => {
  if (total <= 1) {
    return {
      left: '50%',
      top: '50%',
      transform: 'translate(-50%, -50%)',
    };
  }

  const angle = ((index / total) * Math.PI * 2) - Math.PI / 2;
  const radius = total >= 9 ? 40 : total >= 7 ? 38 : 35;
  const left = 50 + Math.cos(angle) * radius;
  const top = 50 + Math.sin(angle) * radius;

  return {
    left: `${left}%`,
    top: `${top}%`,
    transform: 'translate(-50%, -50%)',
  };
};

const getPresidencyQueue = (players, currentPresidentId, specialElectionCallerId) => {
  const orderedAlivePlayers = getTablePlayers(players).filter((player) => player.isAlive);
  if (!orderedAlivePlayers.length) {
    return {
      orderMap: new Map(),
      nextPresidentId: null,
      afterNextPresidentId: null,
      originPresidentId: null,
    };
  }

  const originPresidentId = specialElectionCallerId || currentPresidentId || orderedAlivePlayers[0].id;
  const originIndex = orderedAlivePlayers.findIndex((player) => player.id === originPresidentId);
  const safeOriginIndex = originIndex >= 0 ? originIndex : 0;
  const orderMap = new Map();

  for (let offset = 1; offset <= orderedAlivePlayers.length; offset += 1) {
    const player = orderedAlivePlayers[(safeOriginIndex + offset) % orderedAlivePlayers.length];
    orderMap.set(player.id, offset);
  }

  return {
    orderMap,
    nextPresidentId: orderedAlivePlayers[(safeOriginIndex + 1) % orderedAlivePlayers.length]?.id || null,
    afterNextPresidentId: orderedAlivePlayers[(safeOriginIndex + 2) % orderedAlivePlayers.length]?.id || null,
    originPresidentId,
  };
};

const getVotingStatusMeta = (player, isRevealed, finalVote) => {
  if (!player.isAlive) {
    return {
      label: 'Observer',
      className: 'text-white/40',
      dotClassName: 'bg-white/20',
    };
  }

  if (isRevealed) {
    if (finalVote === 'YA') {
      return {
        label: 'Ja',
        className: 'text-cyan-100',
        dotClassName: 'bg-cyan-300 shadow-[0_0_10px_rgba(103,232,249,0.45)]',
      };
    }

    if (finalVote === 'NEIN') {
      return {
        label: 'Nein',
        className: 'text-red-100',
        dotClassName: 'bg-red-400 shadow-[0_0_10px_rgba(248,113,113,0.45)]',
      };
    }
  }

  if (player.hasVoted) {
    return {
      label: 'Voted',
      className: 'text-cyan-100',
      dotClassName: 'bg-cyan-300 shadow-[0_0_10px_rgba(103,232,249,0.35)]',
    };
  }

  return {
    label: 'Waiting',
    className: 'text-white/55',
    dotClassName: 'bg-white/25',
  };
};

const getVotingGroups = (players) => {
  const voted = players.filter((player) => player.isAlive && player.hasVoted);
  const waiting = players.filter((player) => player.isAlive && !player.hasVoted);
  const observers = players.filter((player) => !player.isAlive);

  return [
    { key: 'voted', label: 'Voted', players: voted },
    { key: 'waiting', label: 'Waiting', players: waiting },
    { key: 'observers', label: 'Observers', players: observers },
  ].filter((group) => group.players.length);
};

const getVoteRevealGroups = (players, votes = {}) => {
  const jaPlayers = players.filter((player) => player.isAlive && votes[player.id] === 'YA');
  const neinPlayers = players.filter((player) => player.isAlive && votes[player.id] === 'NEIN');
  const observers = players.filter((player) => !player.isAlive);

  return [
    { key: 'YA', label: 'Ja', players: jaPlayers, tone: 'ja' },
    { key: 'NEIN', label: 'Nein', players: neinPlayers, tone: 'nein' },
    { key: 'OBSERVERS', label: 'Observers', players: observers, tone: 'observer' },
  ].filter((group) => group.players.length);
};

const VOTE_REVEAL_STAGE_DELAY_MS = 180;
const VOTE_REVEAL_DURATION_MS = 3000;
const GOVERNMENT_FORMATION_BANDS = [18, 32, 46, 60, 74];
const GOVERNMENT_FORMATION_SPARKS = [
  { left: '18%', top: '28%', delay: 0.08 },
  { left: '29%', top: '64%', delay: 0.2 },
  { left: '50%', top: '22%', delay: 0.32 },
  { left: '68%', top: '58%', delay: 0.16 },
  { left: '82%', top: '34%', delay: 0.28 },
];
const GOVERNMENT_FRACTURE_LINES = [
  { top: '24%', left: '18%', width: '64%', rotate: -18, delay: 0.04 },
  { top: '40%', left: '10%', width: '78%', rotate: 7, delay: 0.12 },
  { top: '58%', left: '16%', width: '62%', rotate: -6, delay: 0.2 },
  { top: '72%', left: '28%', width: '42%', rotate: 14, delay: 0.28 },
];
const GOVERNMENT_FRACTURE_SHARDS = [
  { left: '16%', top: '22%', width: 34, height: 8, rotate: -28, x: -26, y: -18, delay: 0.08 },
  { left: '26%', top: '68%', width: 40, height: 9, rotate: 18, x: -18, y: 24, delay: 0.18 },
  { left: '48%', top: '18%', width: 30, height: 7, rotate: -8, x: 0, y: -22, delay: 0.12 },
  { left: '62%', top: '60%', width: 42, height: 9, rotate: -16, x: 20, y: 20, delay: 0.22 },
  { left: '78%', top: '30%', width: 36, height: 8, rotate: 26, x: 28, y: -14, delay: 0.16 },
];
const POLICY_CARD_ASSETS = {
  LIBERAL: '/assets/policy-liberal.png',
  FASCIST: '/assets/policy-fascist.png',
};
const EXECUTIVE_POWER_COPY = {
  [EXECUTIVE_POWERS.INVESTIGATE]: {
    label: 'Investigate Loyalty',
    shortLabel: 'Investigation',
    description: 'The President privately learns one player’s faction, but not their exact role.',
  },
  [EXECUTIVE_POWERS.SPECIAL_ELECTION]: {
    label: 'Call A Special Election',
    shortLabel: 'Special Election',
    description: 'The President chooses who takes the presidency for the next round only.',
  },
  [EXECUTIVE_POWERS.PEEK]: {
    label: 'Review The Top Three Policies',
    shortLabel: 'Policy Peek',
    description: 'The President privately sees the next three policies without changing the deck.',
  },
  [EXECUTIVE_POWERS.EXECUTION]: {
    label: 'Execute A Player',
    shortLabel: 'Execution',
    description: 'The President eliminates one living player. If Hitler dies, the liberals win immediately.',
  },
};

const getFascistExecutivePowerForSlot = (playerCount, slotNumber) => {
  if (playerCount <= 6) {
    if (slotNumber === 3) return EXECUTIVE_POWERS.PEEK;
    if (slotNumber === 4 || slotNumber === 5) return EXECUTIVE_POWERS.EXECUTION;
    return null;
  }

  if (playerCount <= 8) {
    if (slotNumber === 2) return EXECUTIVE_POWERS.INVESTIGATE;
    if (slotNumber === 3) return EXECUTIVE_POWERS.SPECIAL_ELECTION;
    if (slotNumber === 4 || slotNumber === 5) return EXECUTIVE_POWERS.EXECUTION;
    return null;
  }

  if (slotNumber === 1 || slotNumber === 2) return EXECUTIVE_POWERS.INVESTIGATE;
  if (slotNumber === 3) return EXECUTIVE_POWERS.SPECIAL_ELECTION;
  if (slotNumber === 4 || slotNumber === 5) return EXECUTIVE_POWERS.EXECUTION;
  return null;
};

const getTrackSlotInsight = ({ type, slotIndex, current, max, playerCount, phase, executivePower }) => {
  const slotNumber = slotIndex + 1;
  const isFilled = slotNumber <= current;
  const isCurrentEdge = current > 0 && slotNumber === current;
  const isNext = current < max && slotNumber === current + 1;
  const isVictorySlot = slotNumber === max;
  const fascistPower = type === 'FASCIST' ? getFascistExecutivePowerForSlot(playerCount, slotNumber) : null;
  const activePowerCopy = fascistPower ? EXECUTIVE_POWER_COPY[fascistPower] : null;
  const isResolvingNow =
    type === 'FASCIST' &&
    phase === PHASES.EXECUTIVE_ACTION &&
    isCurrentEdge &&
    fascistPower &&
    executivePower === fascistPower;

  let statusLabel = 'Future Slot';
  let statusDescription = 'Nothing has landed here yet. This shows what that board position will mean if play reaches it.';

  if (isResolvingNow) {
    statusLabel = 'Resolving Now';
    statusDescription = 'This is the fascist slot that just landed, and its executive power is currently being resolved.';
  } else if (isNext) {
    statusLabel = 'Next Card Here';
    statusDescription = 'If the next enacted policy matches this track, it lands in this exact slot.';
  } else if (isCurrentEdge) {
    statusLabel = 'Current Board Edge';
    statusDescription = 'This is the latest policy already locked onto the board.';
  } else if (isFilled) {
    statusLabel = 'Already Locked';
    statusDescription = 'This slot is already part of the permanent board state.';
  }

  if (type === 'LIBERAL') {
    if (isVictorySlot) {
      return {
        type,
        slotNumber,
        max,
        isFilled,
        isNext,
        isCurrentEdge,
        isResolvingNow: false,
        trackLabel: 'Liberal Track',
        cardLabel: 'Liberal policy',
        cardSrc: POLICY_CARD_ASSETS.LIBERAL,
        accentClassName: 'text-cyan-100',
        accentSurfaceClassName: 'border-cyan-300/18 bg-cyan-300/10',
        accentSoftClassName: 'border-cyan-300/14 bg-cyan-300/[0.08]',
        statusLabel,
        statusDescription,
        outcomeLabel: 'Immediate Liberal Victory',
        outcomeDescription: 'Placing a Liberal policy in this slot ends the match on the spot.',
        summaryLine: isNext
          ? 'One more Liberal policy wins the table immediately.'
          : 'This is the victory space at the end of the Liberal track.',
      };
    }

    return {
      type,
      slotNumber,
      max,
      isFilled,
      isNext,
      isCurrentEdge,
      isResolvingNow: false,
      trackLabel: 'Liberal Track',
      cardLabel: 'Liberal policy',
      cardSrc: POLICY_CARD_ASSETS.LIBERAL,
      accentClassName: 'text-cyan-100',
      accentSurfaceClassName: 'border-cyan-300/18 bg-cyan-300/10',
      accentSoftClassName: 'border-cyan-300/14 bg-cyan-300/[0.08]',
      statusLabel,
      statusDescription,
      outcomeLabel: `Board Advances To ${slotNumber}/${max}`,
      outcomeDescription: 'No executive power unlocks here. A Liberal card in this space is pure progress toward victory.',
      summaryLine: isNext
        ? `The next Liberal policy would move the republic to ${slotNumber}/${max}.`
        : `This slot marks Liberal progress ${slotNumber} of ${max}.`,
    };
  }

  if (isVictorySlot) {
    return {
      type,
      slotNumber,
      max,
      isFilled,
      isNext,
      isCurrentEdge,
      isResolvingNow,
      trackLabel: 'Fascist Track',
      cardLabel: 'Fascist policy',
      cardSrc: POLICY_CARD_ASSETS.FASCIST,
      accentClassName: 'text-red-100',
      accentSurfaceClassName: 'border-red-400/18 bg-red-500/10',
      accentSoftClassName: 'border-red-400/14 bg-red-500/[0.08]',
      statusLabel,
      statusDescription,
      outcomeLabel: 'Immediate Fascist Victory',
      outcomeDescription: 'Placing a Fascist policy in this slot ends the match immediately.',
      summaryLine: isNext
        ? 'The next Fascist policy would end the game instantly.'
        : 'This is the final victory space on the Fascist track.',
    };
  }

  if (!activePowerCopy) {
    return {
      type,
      slotNumber,
      max,
      isFilled,
      isNext,
      isCurrentEdge,
      isResolvingNow,
      trackLabel: 'Fascist Track',
      cardLabel: 'Fascist policy',
      cardSrc: POLICY_CARD_ASSETS.FASCIST,
      accentClassName: 'text-red-100',
      accentSurfaceClassName: 'border-red-400/18 bg-red-500/10',
      accentSoftClassName: 'border-red-400/14 bg-red-500/[0.08]',
      statusLabel,
      statusDescription,
      outcomeLabel: 'Board Pressure Only',
      outcomeDescription: 'A Fascist card here advances the regime but does not unlock an executive power on this table size.',
      summaryLine: isNext
        ? 'The next Fascist policy would only add pressure here.'
        : `This slot is plain Fascist progress ${slotNumber} of ${max}.`,
    };
  }

  return {
    type,
    slotNumber,
    max,
    isFilled,
    isNext,
    isCurrentEdge,
    isResolvingNow,
    trackLabel: 'Fascist Track',
    cardLabel: 'Fascist policy',
    cardSrc: POLICY_CARD_ASSETS.FASCIST,
    accentClassName: 'text-red-100',
    accentSurfaceClassName: 'border-red-400/18 bg-red-500/10',
    accentSoftClassName: 'border-red-400/14 bg-red-500/[0.08]',
    statusLabel,
    statusDescription,
    outcomeLabel: activePowerCopy.label,
    outcomeDescription: activePowerCopy.description,
    summaryLine: isNext
      ? `The next Fascist policy would unlock ${activePowerCopy.shortLabel.toLowerCase()}.`
      : `This slot carries ${activePowerCopy.shortLabel.toLowerCase()} on this table size.`,
  };
};

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

  const canNominate = gameState.phase === PHASES.NOMINATION && isPresident;
  const canExecutiveTarget =
    gameState.phase === PHASES.EXECUTIVE_ACTION &&
    isPresident &&
    [
      EXECUTIVE_POWERS.INVESTIGATE,
      EXECUTIVE_POWERS.SPECIAL_ELECTION,
      EXECUTIVE_POWERS.EXECUTION,
    ].includes(executivePower);

  const [revealState, setRevealState] = React.useState(null);
  const [revealStage, setRevealStage] = React.useState(0);
  const [pendingSelection, setPendingSelection] = React.useState(null);
  const [recentVoteIds, setRecentVoteIds] = React.useState([]);
  const [revealedVoteIds, setRevealedVoteIds] = React.useState([]);
  const [revealedVoteTotals, setRevealedVoteTotals] = React.useState({ YA: 0, NEIN: 0 });
  const [deckAnimation, setDeckAnimation] = React.useState(null);
  const [selectedTrackFocus, setSelectedTrackFocus] = React.useState(() => {
    const defaultType =
      gameState.phase === PHASES.EXECUTIVE_ACTION || gameState.fascistPolicies >= gameState.liberalPolicies
        ? 'FASCIST'
        : 'LIBERAL';
    const defaultMax = defaultType === 'FASCIST' ? FASCIST_TO_WIN : LIBERAL_TO_WIN;
    const defaultCurrent = defaultType === 'FASCIST' ? gameState.fascistPolicies : gameState.liberalPolicies;

    return {
      type: defaultType,
      slotIndex: Math.min(defaultCurrent, defaultMax - 1),
    };
  });
  const prevPhaseRef = React.useRef(gameState.phase);
  const prevVoteStateRef = React.useRef({});
  const previousDeckCountRef = React.useRef(gameState.drawPileCount);
  const voteStateReadyRef = React.useRef(false);

  React.useEffect(() => {
    setPendingSelection(null);
  }, [gameState.phase]);

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

    const timer = window.setTimeout(() => {
      setRecentVoteIds((current) => current.filter((id) => !justVotedIds.includes(id)));
    }, 650);

    return () => window.clearTimeout(timer);
  }, [gameState.phase, gameState.players]);

  React.useEffect(() => {
    let revealTimer;
    let cleanupTimer;

    if (prevPhaseRef.current === PHASES.VOTING && gameState.phase !== PHASES.VOTING && gameState.lastVotes) {
      let ya = 0;
      let nein = 0;

      Object.values(gameState.lastVotes).forEach((vote) => {
        if (vote === 'YA') ya += 1;
        else nein += 1;
      });

      setRevealState({
        result: ya > nein ? 'APPROVED' : 'REJECTED',
        votes: gameState.lastVotes,
        ya,
        nein,
      });

      setRevealStage(0);
      revealTimer = setTimeout(() => setRevealStage(1), VOTE_REVEAL_STAGE_DELAY_MS);
      cleanupTimer = setTimeout(() => {
        setRevealState(null);
        setRevealStage(0);
      }, VOTE_REVEAL_DURATION_MS);
    }

    prevPhaseRef.current = gameState.phase;

    return () => {
      clearTimeout(revealTimer);
      clearTimeout(cleanupTimer);
    };
  }, [gameState.phase, gameState.lastVotes]);

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

  React.useEffect(() => {
    const previousDeckCount = previousDeckCountRef.current;
    const currentDeckCount = gameState.drawPileCount;
    const visibleCardCount = Math.max(gameState.drawnCards?.length || 0, gameState.peekedPolicies?.length || 0);

    if (typeof previousDeckCount === 'number' && currentDeckCount < previousDeckCount && visibleCardCount > 0) {
      const nextAnimation = {
        id: Date.now(),
        count: Math.min(3, Math.max(1, previousDeckCount - currentDeckCount, visibleCardCount)),
      };
      setDeckAnimation(nextAnimation);

      const timer = window.setTimeout(() => {
        setDeckAnimation((active) => (active?.id === nextAnimation.id ? null : active));
      }, 900);

      previousDeckCountRef.current = currentDeckCount;
      return () => window.clearTimeout(timer);
    }

    previousDeckCountRef.current = currentDeckCount;
    return undefined;
  }, [gameState.drawPileCount, gameState.drawnCards?.length, gameState.peekedPolicies?.length]);

  const showVoteReveal = Boolean(revealState) && gameState.phase !== PHASES.VOTING;
  const isVoteRevealPhase = showVoteReveal;
  const displayPhase = showVoteReveal ? PHASES.VOTING : gameState.phase;
  const playerCount = gameState.players.length;
  const aliveCount = gameState.players.filter((player) => player.isAlive).length;
  const votedCount = gameState.players.filter((player) => player.isAlive && player.hasVoted).length;
  const voteResponsesRemaining = Math.max(0, aliveCount - votedCount);
  const voteMajority = Math.floor(aliveCount / 2) + 1;
  const voteProgressPercent = aliveCount ? (votedCount / aliveCount) * 100 : 0;
  const waitingPlayersLabel =
    voteResponsesRemaining === 0
      ? 'All responses received'
      : `${voteResponsesRemaining} player${voteResponsesRemaining === 1 ? '' : 's'} remaining`;
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
  const voteStatusTitle = showVoteReveal
    ? 'Vote Result'
    : directorState?.primaryInstruction?.title ||
      (me?.isAlive === false ? 'Observer Only' : me?.hasVoted ? 'Vote Locked' : 'Cast Vote');
  const voteStatusCopy = showVoteReveal
    ? `${revealState?.ya || 0} Ja • ${revealState?.nein || 0} Nein`
    : directorState?.primaryInstruction?.description ||
      (me?.isAlive === false
        ? 'You have been eliminated. Watch the table, but you do not vote anymore.'
        : me?.hasVoted
          ? 'Your vote is in. Waiting for the rest of the table.'
          : 'Cast your vote now.');
  const selectedTrackType = selectedTrackFocus?.type === 'LIBERAL' ? 'LIBERAL' : 'FASCIST';
  const selectedTrackMax = selectedTrackType === 'FASCIST' ? FASCIST_TO_WIN : LIBERAL_TO_WIN;
  const selectedTrackProgress = selectedTrackType === 'FASCIST' ? gameState.fascistPolicies : gameState.liberalPolicies;
  const selectedTrackSlotIndex = Math.max(0, Math.min(selectedTrackFocus?.slotIndex ?? 0, selectedTrackMax - 1));
  const selectedTrackInsight = getTrackSlotInsight({
    type: selectedTrackType,
    slotIndex: selectedTrackSlotIndex,
    current: selectedTrackProgress,
    max: selectedTrackMax,
    playerCount,
    phase: displayPhase,
    executivePower: gameState.executivePower,
  });

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
  };

  const renderDeckMetric = (className = 'text-white/72') => (
    <span className={`relative inline-flex items-center ${className}`}>
      <AnimatePresence>
        {deckAnimation && (
          <span className="pointer-events-none absolute left-1/2 top-1/2">
            {Array.from({ length: deckAnimation.count }).map((_, index) => (
              <motion.span
                key={`${deckAnimation.id}-${index}`}
                initial={{ opacity: 0, x: -8, y: 6, scale: 0.72, rotate: -14 + index * 7 }}
                animate={{ opacity: [0, 0.95, 0], x: 12 + index * 10, y: -18 - index * 5, scale: 1, rotate: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.72, delay: index * 0.05, ease: 'easeOut' }}
                className="absolute h-9 w-7 rounded-[8px] border border-[#d4c098]/18 bg-[linear-gradient(180deg,rgba(239,229,211,0.92)_0%,rgba(207,189,155,0.84)_100%)] shadow-[0_10px_24px_rgba(0,0,0,0.28)] paper-grain"
              />
            ))}
          </span>
        )}
      </AnimatePresence>

      <motion.span
        animate={
          deckAnimation
            ? {
                color: ['rgba(255,255,255,0.72)', 'rgba(244,238,224,1)', 'rgba(255,255,255,0.72)'],
                textShadow: ['0 0 0 rgba(0,0,0,0)', '0 0 18px rgba(212,192,152,0.18)', '0 0 0 rgba(0,0,0,0)'],
              }
            : undefined
        }
        transition={{ duration: 0.7, ease: 'easeOut' }}
      >
        DECK {gameState.drawPileCount}
      </motion.span>
    </span>
  );

  const renderTrack = (current, max, type) => {
    const isFascist = type === 'FASCIST';
    const cardSrc = POLICY_CARD_ASSETS[type];
    const fillClass = isFascist
      ? 'border-red-400/35 bg-[linear-gradient(180deg,#c1272d_0%,#701118_100%)] text-red-50'
      : 'border-cyan-300/30 bg-[linear-gradient(180deg,#4b88c4_0%,#234a72_100%)] text-cyan-50';
    const inactiveClass = isFascist
      ? 'border-red-950 bg-[#15080a] text-red-200/18'
      : 'border-cyan-950 bg-[#0b141d] text-cyan-100/18';
    const accentTextClass = isFascist ? 'text-red-100/82' : 'text-cyan-100/82';
    const Icon = isFascist ? Skull : Shield;
    const trackIsFocused = selectedTrackFocus?.type === type;
    const nextSlotIndex = current < max ? current : max - 1;
    const previewSlotIndex = trackIsFocused ? selectedTrackFocus.slotIndex : nextSlotIndex;
    const previewInsight = getTrackSlotInsight({
      type,
      slotIndex: previewSlotIndex,
      current,
      max,
      playerCount,
      phase: displayPhase,
      executivePower: gameState.executivePower,
    });

    return (
      <motion.div
        layout
        className={`min-w-0 rounded-[18px] border px-3 py-2 transition-colors ${
          trackIsFocused
            ? isFascist
              ? 'border-red-400/22 bg-red-500/[0.06] shadow-[0_0_0_1px_rgba(248,113,113,0.1),0_18px_30px_rgba(0,0,0,0.18)]'
              : 'border-cyan-300/20 bg-cyan-300/[0.06] shadow-[0_0_0_1px_rgba(103,232,249,0.08),0_18px_30px_rgba(0,0,0,0.18)]'
            : 'border-white/6 bg-black/18'
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <motion.div
              animate={
                trackIsFocused
                  ? { y: [0, -4, 0], rotate: [-3, 3, -3], scale: [1, 1.03, 1] }
                  : { y: [0, -2, 0], rotate: [-2, 2, -2] }
              }
              transition={{ duration: trackIsFocused ? 2.6 : 4.2, repeat: Infinity, ease: 'easeInOut' }}
              className={`relative hidden shrink-0 rounded-[14px] border p-1 min-[380px]:block ${
                isFascist ? 'border-red-400/18 bg-red-500/[0.08]' : 'border-cyan-300/18 bg-cyan-300/[0.08]'
              }`}
            >
              <img
                src={cardSrc}
                alt=""
                aria-hidden="true"
                loading="eager"
                decoding="async"
                className="h-14 w-10 rounded-[10px] object-cover shadow-[0_10px_18px_rgba(0,0,0,0.24)]"
              />
              <div className="pointer-events-none absolute inset-0 rounded-[14px] paper-grain opacity-10" />
            </motion.div>

            <div className="min-w-0">
              <FactionAccentText
                as="p"
                className={`text-[8px] font-mono font-black uppercase tracking-[0.28em] ${accentTextClass}`}
              >
                {type === 'LIBERAL' ? 'Liberal Track' : 'Fascist Track'}
              </FactionAccentText>
              <FactionAccentText
                as="p"
                className="mt-1 text-[9px] font-mono uppercase tracking-[0.16em] text-white/34"
              >
                {previewInsight.summaryLine}
              </FactionAccentText>
              <p className="mt-1 text-[8px] font-mono uppercase tracking-[0.18em] text-white/22">
                Tap any slot to inspect the breakpoint.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Icon size={12} className={accentTextClass} />
            <span className={`text-[11px] font-mono font-black uppercase tracking-[0.18em] ${accentTextClass}`}>
              {current}/{max}
            </span>
          </div>
        </div>

        <div className="mt-2 grid min-w-0 gap-1.5" style={{ gridTemplateColumns: `repeat(${max}, minmax(0, 1fr))` }}>
          {Array.from({ length: max }).map((_, index) => {
            const isActive = index < current;
            const slotMeta = getTrackSlotMeta(type, index);
            const isNextSlot = current < max && index === current;
            const isCurrentEdge = current > 0 && index === current - 1;
            const isSelectedSlot = trackIsFocused && selectedTrackFocus.slotIndex === index;

            return (
              <motion.button
                key={index}
                type="button"
                onClick={() => handleTrackInspect(type, index)}
                whileTap={{ scale: 0.96 }}
                className={`relative min-h-[30px] overflow-hidden border px-1 py-1 transition-all duration-500 sm:min-h-[34px] ${
                  isActive ? `${fillClass} shadow-[0_8px_18px_rgba(0,0,0,0.18)]` : inactiveClass
                } ${isSelectedSlot ? 'ring-2 ring-white/50 shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_12px_26px_rgba(0,0,0,0.28)]' : ''} ${
                  isNextSlot && !isActive
                    ? isFascist
                      ? 'border-red-300/42 shadow-[0_0_0_1px_rgba(248,113,113,0.12)]'
                      : 'border-cyan-200/38 shadow-[0_0_0_1px_rgba(103,232,249,0.1)]'
                    : ''
                }`}
              >
                {isNextSlot && !isActive && (
                  <>
                    <motion.div
                      animate={
                        isFascist
                          ? { opacity: [0.12, 0.28, 0.12], scale: [0.94, 1.02, 0.94] }
                          : { opacity: [0.1, 0.24, 0.1], scale: [0.94, 1.03, 0.94] }
                      }
                      transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                      className={`absolute inset-0 ${
                        isFascist ? 'bg-red-400/18' : 'bg-cyan-300/16'
                      }`}
                    />
                    <motion.img
                      src={cardSrc}
                      alt=""
                      aria-hidden="true"
                      animate={{ y: [8, 2, 8], rotate: [-4, 0, -4], opacity: [0.14, 0.26, 0.14] }}
                      transition={{ duration: 2.1, repeat: Infinity, ease: 'easeInOut' }}
                      className="pointer-events-none absolute bottom-0 left-1/2 h-8 w-6 -translate-x-1/2 rounded-[6px] object-cover"
                    />
                  </>
                )}

                <div className="relative z-10 flex h-full flex-col items-center justify-between text-center">
                  <span className="text-[6px] font-mono font-black uppercase tracking-[0.22em] opacity-80">
                    {slotMeta}
                  </span>

                  {isActive ? (
                    <motion.span
                      animate={isCurrentEdge ? { scale: [1, 1.12, 1] } : { scale: 1 }}
                      transition={isCurrentEdge ? { duration: 1.4, repeat: Infinity, ease: 'easeInOut' } : undefined}
                    >
                      <Icon size={9} />
                    </motion.span>
                  ) : (
                    <span className="text-[9px] font-mono font-black opacity-38">
                      {isNextSlot ? 'NEXT' : index + 1}
                    </span>
                  )}
                </div>

                {index === current - 1 && (
                  <motion.div
                    initial={{ scale: 1.15, opacity: 0.55 }}
                    animate={{ scale: 1, opacity: 0 }}
                    transition={{ duration: 0.75, ease: 'easeOut' }}
                    className={`absolute inset-0 pointer-events-none ${isFascist ? 'bg-red-400/40' : 'bg-cyan-300/40'}`}
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </motion.div>
    );
  };

  const renderTrackBriefing = () => (
    <AnimatePresence mode="wait">
      <motion.div
        key={`${selectedTrackInsight.type}-${selectedTrackInsight.slotNumber}-${selectedTrackProgress}-${displayPhase}-${gameState.executivePower || 'idle'}`}
        initial={{ opacity: 0, y: 14, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.98 }}
        transition={{ duration: 0.28, ease: 'easeOut' }}
        className="relative mt-3 overflow-hidden rounded-[24px] border border-white/8 bg-[linear-gradient(180deg,rgba(10,11,13,0.92)_0%,rgba(7,8,10,0.94)_100%)] px-4 py-4 shadow-[0_18px_40px_rgba(0,0,0,0.24)]"
      >
        <div className="pointer-events-none absolute inset-0 paper-grain opacity-10" />
        <div className="grid min-w-0 gap-4 min-[520px]:grid-cols-[116px,minmax(0,1fr)]">
          <div className="flex items-center justify-center">
            <div className={`relative flex h-[132px] w-[100px] items-center justify-center overflow-hidden rounded-[24px] border ${selectedTrackInsight.accentSurfaceClassName}`}>
              <motion.div
                animate={
                  selectedTrackInsight.isNext || selectedTrackInsight.isResolvingNow
                    ? { y: [6, -2, 6], rotate: [-4, 2, -4], scale: [0.98, 1.03, 0.98] }
                    : { y: [2, -2, 2], rotate: [-2, 2, -2] }
                }
                transition={{ duration: selectedTrackInsight.isNext || selectedTrackInsight.isResolvingNow ? 2.2 : 3.8, repeat: Infinity, ease: 'easeInOut' }}
                className="relative z-10"
              >
                <img
                  src={selectedTrackInsight.cardSrc}
                  alt={`${selectedTrackInsight.cardLabel} reference`}
                  loading="eager"
                  decoding="async"
                  className="h-[112px] w-[76px] rounded-[14px] object-cover shadow-[0_20px_34px_rgba(0,0,0,0.32)]"
                />
              </motion.div>

              <motion.div
                animate={
                  selectedTrackInsight.type === 'FASCIST'
                    ? { opacity: [0.12, 0.22, 0.12], scale: [0.94, 1.02, 0.94] }
                    : { opacity: [0.1, 0.2, 0.1], scale: [0.94, 1.03, 0.94] }
                }
                transition={{ duration: 2.1, repeat: Infinity, ease: 'easeInOut' }}
                className={`absolute inset-3 rounded-[20px] ${selectedTrackInsight.type === 'FASCIST' ? 'bg-red-400/18' : 'bg-cyan-300/16'}`}
              />

              <div className="absolute bottom-2 left-1/2 z-20 -translate-x-1/2 rounded-full border border-white/10 bg-black/28 px-2 py-1 text-[8px] font-mono font-black uppercase tracking-[0.18em] text-white/78">
                Slot {selectedTrackInsight.slotNumber}
              </div>
            </div>
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-[9px] font-mono font-black uppercase tracking-[0.18em]">
              <span className={`rounded-full border px-3 py-1 ${selectedTrackInsight.accentSurfaceClassName} ${selectedTrackInsight.accentClassName}`}>
                {selectedTrackInsight.trackLabel}
              </span>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-white/70">
                {selectedTrackProgress}/{selectedTrackMax} On Board
              </span>
              <span className={`rounded-full border px-3 py-1 ${selectedTrackInsight.accentSoftClassName} ${selectedTrackInsight.accentClassName}`}>
                {selectedTrackInsight.statusLabel}
              </span>
            </div>

            <FactionAccentText
              as="h3"
              className="mt-3 text-lg font-black uppercase tracking-[0.12em] text-white sm:text-xl"
            >
              {selectedTrackInsight.outcomeLabel}
            </FactionAccentText>
            <FactionAccentText as="p" className="mt-2 max-w-[44rem] text-sm leading-relaxed text-white/68">
              {selectedTrackInsight.outcomeDescription}
            </FactionAccentText>
            <p className="mt-2 max-w-[42rem] text-[11px] leading-relaxed text-white/44">
              {selectedTrackInsight.statusDescription}
            </p>

            <div className="mt-4 grid gap-2 min-[420px]:grid-cols-3">
              <div className="rounded-[18px] border border-white/8 bg-white/[0.03] px-3 py-3">
                <p className="text-[9px] font-mono font-black uppercase tracking-[0.18em] text-white/38">
                  Board Position
                </p>
                <p className="mt-2 text-sm font-black uppercase tracking-[0.08em] text-white/88">
                  {selectedTrackProgress}/{selectedTrackMax}
                </p>
              </div>
              <div className={`rounded-[18px] border px-3 py-3 ${selectedTrackInsight.accentSoftClassName}`}>
                <p className="text-[9px] font-mono font-black uppercase tracking-[0.18em] text-white/38">
                  Selected Slot
                </p>
                <p className={`mt-2 text-sm font-black uppercase tracking-[0.08em] ${selectedTrackInsight.accentClassName}`}>
                  {selectedTrackInsight.slotNumber}/{selectedTrackInsight.max}
                </p>
              </div>
              <div className="rounded-[18px] border border-white/8 bg-white/[0.03] px-3 py-3">
                <p className="text-[9px] font-mono font-black uppercase tracking-[0.18em] text-white/38">
                  If A Card Lands Here
                </p>
                <FactionAccentText as="p" className="mt-2 text-sm font-black uppercase tracking-[0.08em] text-white/88">
                  {selectedTrackInsight.isResolvingNow ? 'Trigger Live Now' : selectedTrackInsight.outcomeLabel}
                </FactionAccentText>
              </div>
            </div>

            <p className="mt-4 text-[10px] font-mono font-black uppercase tracking-[0.18em] text-white/32">
              Tap another slot above to inspect a different breakpoint on the board.
            </p>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );

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

    if (displayPhase === PHASES.VOTING && !showVoteReveal) {
      return (
        <div className="mx-auto w-full min-w-0 max-w-[1120px] px-3 sm:px-4">
          <div className="min-w-0 rounded-[28px] border border-cyan-300/18 bg-[linear-gradient(180deg,rgba(10,15,21,0.98)_0%,rgba(11,17,23,0.94)_100%)] px-4 py-4 shadow-[0_24px_56px_rgba(0,0,0,0.34)]">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <motion.span
                  animate={{ opacity: [0.55, 1, 0.55] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                  className="inline-flex rounded-full border border-cyan-300/18 bg-cyan-300/10 px-2.5 py-1 text-[8px] font-mono font-black uppercase tracking-[0.26em] text-cyan-100"
                >
                  Live Briefing
                </motion.span>
                <FactionAccentText
                  as="h2"
                  className="mt-2 text-lg font-black uppercase tracking-[0.12em] text-white sm:text-xl"
                >
                  {voteStatusTitle}
                </FactionAccentText>
                <FactionAccentText as="p" className="mt-1 max-w-[40rem] text-sm leading-relaxed text-white/62">
                  {voteStatusCopy}
                </FactionAccentText>

                {!showVoteReveal && (
                  <div className="mt-3 flex items-center gap-2 text-[10px] font-mono font-black uppercase tracking-[0.18em] text-white/52">
                    <span>{waitingPlayersLabel}</span>
                    {voteResponsesRemaining > 0 && (
                      <div className="flex items-center gap-1">
                        {[0, 1, 2].map((index) => (
                          <motion.span
                            key={index}
                            animate={{ opacity: [0.25, 1, 0.25] }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut', delay: index * 0.18 }}
                            className="h-1.5 w-1.5 rounded-full bg-cyan-200/75"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

            </div>

            <div className="mt-4">
              <div className="text-[10px] font-mono font-black uppercase tracking-[0.18em] text-white/48">
                Vote Progress
              </div>
              <div className="relative mt-2 h-2.5 overflow-hidden rounded-full bg-white/8">
                <motion.div
                  initial={false}
                  animate={{ width: `${voteProgressPercent}%` }}
                  transition={{ type: 'spring', stiffness: 200, damping: 28 }}
                  className="relative h-full rounded-full bg-[linear-gradient(90deg,#36d7ff_0%,#87bfff_100%)]"
                >
                  {voteResponsesRemaining > 0 && (
                    <motion.div
                      animate={{ opacity: [0.35, 0.9, 0.35] }}
                      transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                      className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0)_0%,rgba(255,255,255,0.35)_50%,rgba(255,255,255,0)_100%)]"
                    />
                  )}
                </motion.div>
                <div
                  className="absolute inset-y-0 w-px bg-white/20"
                  style={{ left: `${Math.min(100, Math.max(0, (voteMajority / Math.max(1, aliveCount)) * 100))}%` }}
                />
              </div>
              <div className="mt-2 flex items-center justify-between gap-3">
                <span className="text-[10px] font-mono font-black uppercase tracking-[0.16em] text-white/65">
                  {waitingPlayersLabel}
                </span>
                <span className="text-[10px] font-mono font-black uppercase tracking-[0.16em] text-white/38">
                  Pass threshold: {voteMajority} JA
                </span>
              </div>
            </div>
          </div>

          <div className="mt-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="inline-flex min-w-max items-center gap-2 rounded-[18px] border border-white/8 bg-black/28 px-3 py-2 shadow-[0_12px_28px_rgba(0,0,0,0.18)] whitespace-nowrap text-[10px] font-mono font-black uppercase tracking-[0.16em] sm:gap-3 sm:text-[11px]">
              <span className="text-cyan-100">LIB {gameState.liberalPolicies}/{LIBERAL_TO_WIN}</span>
              <span className="text-white/18">|</span>
              <span className="text-red-100">FAS {gameState.fascistPolicies}/{FASCIST_TO_WIN}</span>
              <span className="text-white/18">|</span>
              {renderDeckMetric()}
              <span className="text-white/18">|</span>
              <span className="text-white/72">DISC {gameState.discardPileCount}</span>
              <span className="text-white/18">|</span>
              <span className="flex items-center gap-1.5 text-white/72">
                <span>CHAOS</span>
                <span className="flex items-center gap-1">
                  {Array.from({ length: MAX_ELECTION_TRACKER }).map((_, index) => (
                    <span
                      key={index}
                      className={`h-2 w-2 rounded-full ${
                        index < gameState.electionTracker
                          ? 'bg-red-400 shadow-[0_0_10px_rgba(248,113,113,0.35)]'
                          : 'bg-white/18'
                      }`}
                    />
                  ))}
                </span>
              </span>
            </div>
          </div>
        </div>
      );
    }

    const isDimmed = displayPhase === PHASES.VOTING;

    return (
      <div className={`mx-auto w-full min-w-0 max-w-[1120px] px-3 sm:px-4 transition-all duration-700 ${isDimmed ? 'scale-[0.99] opacity-45' : 'opacity-[0.84]'}`}>
        <div className="overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="inline-flex min-w-max items-center gap-2 border border-white/6 bg-black/22 px-3 py-2 text-[10px] font-mono font-black uppercase tracking-[0.16em] text-white/68 shadow-[0_12px_24px_rgba(0,0,0,0.16)] sm:gap-3 sm:text-[11px]">
            <span className="text-cyan-100">LIB {gameState.liberalPolicies}/{LIBERAL_TO_WIN}</span>
            <span className="text-white/16">|</span>
            <span className="text-red-100">FAS {gameState.fascistPolicies}/{FASCIST_TO_WIN}</span>
            <span className="text-white/16">|</span>
            {renderDeckMetric('text-white/68')}
            <span className="text-white/16">|</span>
            <span>DISC {gameState.discardPileCount}</span>
            <span className="text-white/16">|</span>
            <span className="flex items-center gap-1.5">
              <span>CHAOS</span>
              <span className="flex items-center gap-1">
                {Array.from({ length: MAX_ELECTION_TRACKER }).map((_, index) => (
                  <span
                    key={index}
                    className={`h-2 w-2 ${
                      index < gameState.electionTracker
                        ? 'bg-red-400 shadow-[0_0_10px_rgba(248,113,113,0.35)]'
                        : 'bg-white/16'
                    }`}
                  />
                ))}
              </span>
            </span>
          </div>
        </div>

        <div className="mt-3 grid min-w-0 gap-2 md:grid-cols-2">
          {renderTrack(gameState.liberalPolicies, LIBERAL_TO_WIN, 'LIBERAL')}
          {renderTrack(gameState.fascistPolicies, FASCIST_TO_WIN, 'FASCIST')}
        </div>

        {renderTrackBriefing()}
      </div>
    );
  };

  const renderPlayerDock = () => {
    const isVotingPhase = displayPhase === PHASES.VOTING;
    const isLegislativePhase = displayPhase === PHASES.LEGISLATIVE_PRESIDENT || displayPhase === PHASES.LEGISLATIVE_CHANCELLOR;
    const playerCardSizeClass = getVotingPlayerCardSize(playerCount);
    const tablePlayers = getTablePlayers(gameState.players);
    const {
      orderMap: presidencyOrderMap,
      nextPresidentId,
      afterNextPresidentId,
      originPresidentId,
    } = getPresidencyQueue(gameState.players, gameState.currentPresident, gameState.specialElectionCallerId);
    const currentPresidentPlayer = tablePlayers.find((player) => player.id === gameState.currentPresident);
    const presidencyOriginPlayer = tablePlayers.find((player) => player.id === originPresidentId);
    const nextPresidentPlayer = tablePlayers.find((player) => player.id === nextPresidentId);
    const afterNextPresidentPlayer = tablePlayers.find((player) => player.id === afterNextPresidentId);
    const ringSeatClass = getTableRingSeatClass(playerCount);
    const votingGroups = isVotingPhase
      ? showVoteReveal
        ? getVoteRevealGroups(gameState.players, revealState?.votes)
        : getVotingGroups(gameState.players)
      : [];
    const executiveLabel =
      executivePower === EXECUTIVE_POWERS.INVESTIGATE
        ? 'Select one player to investigate'
        : executivePower === EXECUTIVE_POWERS.SPECIAL_ELECTION
          ? 'Choose the next president'
          : executivePower === EXECUTIVE_POWERS.EXECUTION
            ? 'Choose one target from the dock'
            : 'Executive action in progress';
    const dockHint = canNominate
      ? 'Nominate from the dock below'
      : canExecutiveTarget
        ? executiveLabel
        : isVotingPhase
          ? null
          : isLegislativePhase
            ? 'Policy handoff in progress'
            : 'Seat order drives the presidency';
    const dockTitle = 'Players';
    const dockBadgeLabel = isVotingPhase ? null : `${aliveCount}/${playerCount} Live`;
    const dockWrapperClass = isVoteRevealPhase
      ? 'mx-auto w-full min-w-0 max-w-[1120px] px-3 sm:px-4'
      : 'mx-auto flex min-h-0 w-full min-w-0 max-w-[1120px] flex-1 px-3 sm:px-4';
    const dockPanelClass = isVoteRevealPhase
      ? 'relative min-w-0 w-full overflow-hidden rounded-[28px] border border-white/8 bg-black/28 p-3 shadow-[0_18px_40px_rgba(0,0,0,0.24)] sm:p-4'
      : 'relative h-full min-h-0 min-w-0 w-full overflow-hidden rounded-[28px] border border-white/8 bg-black/28 p-3 shadow-[0_18px_40px_rgba(0,0,0,0.24)] sm:p-4';
    const dockBodyClass = isVoteRevealPhase
      ? 'relative z-10 min-w-0 pt-3'
      : 'relative z-10 min-h-0 min-w-0 overflow-y-auto pt-3';

    return (
      <div className={dockWrapperClass}>
        <div className={dockPanelClass}>
          <div className="absolute inset-0 paper-grain opacity-[0.06] pointer-events-none" />

          <div className="relative z-10 grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)]">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[8px] font-mono font-black uppercase tracking-[0.32em] text-cyan-300/75">
                  {dockTitle}
                </p>
                {dockHint && (
                  <p className="mt-1 text-[9px] leading-relaxed text-white/55 sm:text-[10px]">
                    {dockHint}
                  </p>
                )}
              </div>

              {dockBadgeLabel && (
                <div className="shrink-0 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[8px] font-mono font-black uppercase tracking-[0.22em] text-white/70">
                  {dockBadgeLabel}
                </div>
              )}
            </div>

            <div className={dockBodyClass}>
              {isVotingPhase ? (
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
                <div className="flex min-h-0 flex-col items-center gap-4">
                  <div className="relative mx-auto w-full max-w-[390px]">
                    <div className="relative aspect-square w-full">
                      <div className="absolute inset-[12%] rounded-full border border-white/8 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0.02)_55%,rgba(0,0,0,0.16)_100%)] shadow-[0_20px_44px_rgba(0,0,0,0.24)]" />
                      <div className="absolute inset-[22%] flex flex-col items-center justify-center rounded-full border border-[#d4c098]/18 bg-[linear-gradient(180deg,rgba(10,11,13,0.92)_0%,rgba(6,7,8,0.92)_100%)] px-4 text-center shadow-[inset_0_0_0_1px_rgba(255,255,255,0.03)]">
                        <p className="text-[8px] font-mono font-black uppercase tracking-[0.32em] text-[#d4c098]/72">
                          Presidency Order
                        </p>
                        <p className="mt-3 text-sm font-black uppercase tracking-[0.14em] text-white sm:text-base">
                          {gameState.specialElectionCallerId ? 'Special Election' : 'Clockwise Rotation'}
                        </p>
                        <p className="mt-2 max-w-[15rem] text-[10px] leading-relaxed text-white/55 sm:text-[11px]">
                          {gameState.specialElectionCallerId
                            ? `Order resumes after ${presidencyOriginPlayer?.name || 'the calling president'}.`
                            : 'Seat numbers show who becomes president next.'}
                        </p>
                        <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[9px] font-mono font-black uppercase tracking-[0.2em] text-white/62">
                          <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-cyan-400 text-[8px] text-black">
                            1
                          </span>
                          Next President
                        </div>
                      </div>

                      {tablePlayers.map((player, index) => {
                        const isSelf = player.id === myActualId;
                        const alreadyInvestigated = gameState.investigatedPlayerIds?.includes(player.id);
                        const isSelectable =
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
                              ${isSelectable ? 'cursor-pointer hover:scale-[1.04] hover:border-[#d4c098] active:scale-[0.98]' : 'cursor-default'}
                              ${isInactiveLegislator ? 'opacity-35 grayscale-[0.45]' : ''}
                              ${!player.isAlive ? 'opacity-45 brightness-75' : ''}
                              ${displayPhase === PHASES.EXECUTIVE_ACTION && executivePower === EXECUTIVE_POWERS.INVESTIGATE && alreadyInvestigated ? 'opacity-45 grayscale-[0.3]' : ''}
                              ${isPending ? 'z-20 scale-[1.06] !opacity-100 ring-4 ring-[var(--color-stamp-red)] shadow-2xl' : ''}
                              ${isSelf ? 'shadow-[0_0_0_1px_rgba(103,232,249,0.24),0_18px_34px_rgba(0,0,0,0.32)]' : ''}
                            `}
                          >
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
                                  : isSelectable
                                    ? 'text-[#d4c098]'
                                    : 'text-white/42'
                            }`}>
                              {isNextPresident
                                ? 'Next Up'
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

                  <div className="grid w-full max-w-[680px] grid-cols-1 gap-2 text-[9px] font-mono font-black uppercase tracking-[0.18em] text-white/62 sm:grid-cols-3 sm:gap-3 sm:text-[10px]">
                    <div className="rounded-[18px] border border-[#d4af37]/22 bg-[#d4af37]/10 px-3 py-2">
                      <span className="block text-[#f3df9c]">Current President</span>
                      <span className="mt-1 block truncate text-white">{currentPresidentPlayer?.name || 'Unknown'}</span>
                    </div>
                    <div className="rounded-[18px] border border-cyan-300/18 bg-cyan-400/10 px-3 py-2">
                      <span className="block text-cyan-100">Next President</span>
                      <span className="mt-1 block truncate text-white">{nextPresidentPlayer?.name || 'Unknown'}</span>
                    </div>
                    <div className="rounded-[18px] border border-white/10 bg-white/[0.04] px-3 py-2">
                      <span className="block text-white/55">{gameState.specialElectionCallerId ? 'Order Resumes After' : 'Then'}</span>
                      <span className="mt-1 block truncate text-white">
                        {gameState.specialElectionCallerId
                          ? (presidencyOriginPlayer?.name || 'Current Rotation')
                          : (afterNextPresidentPlayer?.name || 'Rotation Continues')}
                      </span>
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

      <div className={`relative z-10 grid h-full min-h-0 min-w-0 grid-rows-[auto_minmax(0,1fr)] gap-2 pb-[calc(var(--app-safe-bottom)+0.75rem)] transition-all duration-700 sm:gap-3 sm:pb-[calc(var(--app-safe-bottom)+1rem)] ${boardContentTopClass} ${boardDimmed ? 'opacity-45' : 'opacity-100'}`}>
        {renderBoardStage()}
        {renderPlayerDock()}
      </div>
    </motion.div>
  );
}
