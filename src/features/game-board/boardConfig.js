import {
  EXECUTIVE_POWERS,
  FASCIST_TO_WIN,
  LIBERAL_TO_WIN,
  PHASES,
} from '../../lib/constants';

const getStableNumber = (seed, min, max) => {
  let hash = 0;
  for (const char of seed) {
    hash = (hash * 31 + char.charCodeAt(0)) % 100000;
  }

  return min + (hash % (max - min + 1));
};

export const getAvatarId = (player) => {
  if (player.avatarId) return player.avatarId;
  return getStableNumber(player.id || player.name || 'operative', 1, 10);
};

export const getVoteStampRotation = (playerId, vote) =>
  getStableNumber(`${playerId}-${vote}`, -10, 10);

export const getTrackSlotMeta = (type, index) => {
  if (type === 'LIBERAL') {
    return index === LIBERAL_TO_WIN - 1 ? 'SECURE' : `0${index + 1}`;
  }

  if (index >= 2 && index <= 4) return 'ORDER';
  if (index === FASCIST_TO_WIN - 1) return 'WIN';
  return `0${index + 1}`;
};

export const getVotingPlayerCardSize = (count) => {
  if (count >= 9) return 'min-h-[104px] max-w-[72px] sm:min-h-[112px] sm:max-w-[78px]';
  if (count >= 7) return 'min-h-[110px] max-w-[78px] sm:min-h-[118px] sm:max-w-[86px]';
  return 'min-h-[116px] max-w-[84px] sm:min-h-[126px] sm:max-w-[92px]';
};

export const getProgressPercent = (count, max) =>
  `${Math.max(0, Math.min(100, (count / Math.max(1, max)) * 100))}%`;

export const getTablePlayers = (players) =>
  [...players].sort((left, right) => (left.position || 0) - (right.position || 0));

export const getTableRingSeatClass = (count) => {
  if (count >= 9) return 'h-[82px] w-[68px] sm:h-[90px] sm:w-[76px]';
  if (count >= 7) return 'h-[88px] w-[74px] sm:h-[98px] sm:w-[82px]';
  return 'h-[96px] w-[80px] sm:h-[108px] sm:w-[90px]';
};

export const getTableRingSeatStyle = (index, total) => {
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

export const getPresidencyQueue = (players, currentPresidentId, specialElectionCallerId) => {
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

export const getVotingStatusMeta = (player, isRevealed, finalVote) => {
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

export const getVoteRevealGroups = (players, votes = {}) => {
  const jaPlayers = players.filter((player) => player.isAlive && votes[player.id] === 'YA');
  const neinPlayers = players.filter((player) => player.isAlive && votes[player.id] === 'NEIN');
  const observers = players.filter((player) => !player.isAlive);

  return [
    { key: 'YA', label: 'Ja', players: jaPlayers, tone: 'ja' },
    { key: 'NEIN', label: 'Nein', players: neinPlayers, tone: 'nein' },
    { key: 'OBSERVERS', label: 'Observers', players: observers, tone: 'observer' },
  ].filter((group) => group.players.length);
};

export const VOTE_REVEAL_STAGE_DELAY_MS = 180;
export const VOTE_REVEAL_DURATION_MS = 3000;
export const GOVERNMENT_FORMATION_BANDS = [18, 32, 46, 60, 74];
export const GOVERNMENT_FORMATION_SPARKS = [
  { left: '18%', top: '28%', delay: 0.08 },
  { left: '29%', top: '64%', delay: 0.2 },
  { left: '50%', top: '22%', delay: 0.32 },
  { left: '68%', top: '58%', delay: 0.16 },
  { left: '82%', top: '34%', delay: 0.28 },
];
export const GOVERNMENT_FRACTURE_LINES = [
  { top: '24%', left: '18%', width: '64%', rotate: -18, delay: 0.04 },
  { top: '40%', left: '10%', width: '78%', rotate: 7, delay: 0.12 },
  { top: '58%', left: '16%', width: '62%', rotate: -6, delay: 0.2 },
  { top: '72%', left: '28%', width: '42%', rotate: 14, delay: 0.28 },
];
export const GOVERNMENT_FRACTURE_SHARDS = [
  { left: '16%', top: '22%', width: 34, height: 8, rotate: -28, x: -26, y: -18, delay: 0.08 },
  { left: '26%', top: '68%', width: 40, height: 9, rotate: 18, x: -18, y: 24, delay: 0.18 },
  { left: '48%', top: '18%', width: 30, height: 7, rotate: -8, x: 0, y: -22, delay: 0.12 },
  { left: '62%', top: '60%', width: 42, height: 9, rotate: -16, x: 20, y: 20, delay: 0.22 },
  { left: '78%', top: '30%', width: 36, height: 8, rotate: 26, x: 28, y: -14, delay: 0.16 },
];
export const TRACK_DETAIL_DISMISS_DRAG_OFFSET = 120;
export const TRACK_DETAIL_DISMISS_DRAG_VELOCITY = 720;
export const POLICY_CARD_ASSETS = {
  LIBERAL: '/assets/policy-liberal.png',
  FASCIST: '/assets/policy-fascist.png',
};
export const EXECUTIVE_POWER_COPY = {
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

export const getFascistExecutivePowerForSlot = (playerCount, slotNumber) => {
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

export const getTrackSlotInsight = ({ type, slotIndex, current, max, playerCount, phase, executivePower }) => {
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
        outcomeLabel: 'Immediate Liberal Victory',
        outcomeDescription: 'Placing a Liberal policy in this slot ends the match on the spot.',
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
      outcomeLabel: `Liberal Progress ${slotNumber}/${max}`,
      outcomeDescription: 'No executive power unlocks here. A Liberal card in this space is pure progress toward victory.',
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
      outcomeLabel: 'Immediate Fascist Victory',
      outcomeDescription: 'Placing a Fascist policy in this slot ends the match immediately.',
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
      outcomeLabel: 'No Immediate Power',
      outcomeDescription: 'A Fascist card here advances the regime but does not unlock an executive power on this table size.',
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
    outcomeLabel: activePowerCopy.label,
    outcomeDescription: activePowerCopy.description,
  };
};
