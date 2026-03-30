import { PHASES } from '../../lib/constants';

const TABLE_MODES = {
  ALL_BOTS: 'all-bots',
  SOLO_HUMAN: 'solo-human',
  MIXED: 'mixed',
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const LIVE_TEMPO_PROFILES = {
  [TABLE_MODES.MIXED]: {
    voteLockPulseMs: 540,
    voteLockStaggerMs: 160,
    voteLockStaggerMinMs: 120,
    voteRevealStageDelayMs: 90,
    voteRevealStartDelayMs: 180,
    voteRevealStepMs: 210,
    voteRevealStepMinMs: 145,
    voteRevealFinalHoldMs: 430,
    voteRevealFinalHoldMinMs: 340,
    nominationLockedMs: 950,
    vetoRequestMs: 1250,
    executionMs: 1350,
    gameOverMs: 1650,
    majorBeatGraceMs: 650,
    voteRevealGraceMs: 700,
    liveStateIdleHealthCheckMs: 5200,
    healthCheckThrottleMs: 2200,
  },
  [TABLE_MODES.SOLO_HUMAN]: {
    voteLockPulseMs: 620,
    voteLockStaggerMs: 190,
    voteLockStaggerMinMs: 135,
    voteRevealStageDelayMs: 110,
    voteRevealStartDelayMs: 220,
    voteRevealStepMs: 225,
    voteRevealStepMinMs: 165,
    voteRevealFinalHoldMs: 520,
    voteRevealFinalHoldMinMs: 430,
    nominationLockedMs: 1100,
    vetoRequestMs: 1400,
    executionMs: 1500,
    gameOverMs: 1750,
    majorBeatGraceMs: 700,
    voteRevealGraceMs: 800,
    liveStateIdleHealthCheckMs: 4800,
    healthCheckThrottleMs: 2000,
  },
  [TABLE_MODES.ALL_BOTS]: {
    voteLockPulseMs: 420,
    voteLockStaggerMs: 120,
    voteLockStaggerMinMs: 90,
    voteRevealStageDelayMs: 70,
    voteRevealStartDelayMs: 160,
    voteRevealStepMs: 175,
    voteRevealStepMinMs: 125,
    voteRevealFinalHoldMs: 330,
    voteRevealFinalHoldMinMs: 270,
    nominationLockedMs: 800,
    vetoRequestMs: 1000,
    executionMs: 1150,
    gameOverMs: 1350,
    majorBeatGraceMs: 550,
    voteRevealGraceMs: 650,
    liveStateIdleHealthCheckMs: 5600,
    healthCheckThrottleMs: 2200,
  },
};

const BOT_PHASE_DELAY_RANGES = {
  DEFAULT: { min: 760, max: 1260 },
  [PHASES.ROLE_REVEAL]: { min: 460, max: 760 },
  [PHASES.VOTING]: { min: 620, max: 940 },
  [PHASES.NOMINATION]: { min: 980, max: 1540 },
  [PHASES.LEGISLATIVE_PRESIDENT]: { min: 1050, max: 1660 },
  [PHASES.LEGISLATIVE_CHANCELLOR]: { min: 1120, max: 1720 },
  [PHASES.EXECUTIVE_ACTION]: { min: 1180, max: 1820 },
};

const BOT_TABLE_MODE_BONUSES = {
  [TABLE_MODES.MIXED]: {
    DEFAULT: { min: 0, max: 0 },
    [PHASES.ROLE_REVEAL]: { min: 0, max: 0 },
    [PHASES.VOTING]: { min: 0, max: 0 },
    [PHASES.NOMINATION]: { min: 0, max: 0 },
    [PHASES.LEGISLATIVE_PRESIDENT]: { min: 0, max: 0 },
    [PHASES.LEGISLATIVE_CHANCELLOR]: { min: 0, max: 0 },
    [PHASES.EXECUTIVE_ACTION]: { min: 0, max: 0 },
  },
  [TABLE_MODES.SOLO_HUMAN]: {
    DEFAULT: { min: 80, max: 180 },
    [PHASES.ROLE_REVEAL]: { min: 80, max: 160 },
    [PHASES.VOTING]: { min: 120, max: 220 },
    [PHASES.NOMINATION]: { min: 180, max: 320 },
    [PHASES.LEGISLATIVE_PRESIDENT]: { min: 200, max: 340 },
    [PHASES.LEGISLATIVE_CHANCELLOR]: { min: 220, max: 360 },
    [PHASES.EXECUTIVE_ACTION]: { min: 220, max: 420 },
  },
  [TABLE_MODES.ALL_BOTS]: {
    DEFAULT: { min: 0, max: 90 },
    [PHASES.ROLE_REVEAL]: { min: 0, max: 60 },
    [PHASES.VOTING]: { min: 50, max: 140 },
    [PHASES.NOMINATION]: { min: 90, max: 190 },
    [PHASES.LEGISLATIVE_PRESIDENT]: { min: 110, max: 220 },
    [PHASES.LEGISLATIVE_CHANCELLOR]: { min: 120, max: 230 },
    [PHASES.EXECUTIVE_ACTION]: { min: 150, max: 260 },
  },
};

const getAlivePlayers = (players = []) => players.filter((player) => player.isAlive !== false);
const getAlivePlayerCount = (players = []) => getAlivePlayers(players).length;
const getRevealSeatCount = (players = [], revealPlayerCount) =>
  clamp(Math.max(0, revealPlayerCount ?? getAlivePlayerCount(players)), 0, 10);
const getSeatDensity = (seatCount) => clamp((seatCount - 5) / 5, 0, 1);
const getCompressedTiming = ({ base, min, density }) =>
  Math.max(min, Math.round(base - (base - min) * density));

export function getLiveTableMode(players = []) {
  const alivePlayers = getAlivePlayers(players);
  const aliveHumans = alivePlayers.filter((player) => !player.isBot).length;
  const aliveBots = alivePlayers.filter((player) => player.isBot).length;

  if (alivePlayers.length > 0 && aliveBots === alivePlayers.length) {
    return TABLE_MODES.ALL_BOTS;
  }

  if (aliveHumans === 1 && aliveBots >= 1) {
    return TABLE_MODES.SOLO_HUMAN;
  }

  return TABLE_MODES.MIXED;
}

export function getLiveTempoProfile(players = []) {
  const tableMode = getLiveTableMode(players);
  return {
    tableMode,
    ...LIVE_TEMPO_PROFILES[tableMode],
  };
}

export function getVoteTempoProfile({
  players = [],
  revealPlayerCount,
} = {}) {
  const tempo = getLiveTempoProfile(players);
  const seatCount = getRevealSeatCount(players, revealPlayerCount);
  const density = getSeatDensity(seatCount);
  const voteLockStaggerMs = getCompressedTiming({
    base: tempo.voteLockStaggerMs,
    min: tempo.voteLockStaggerMinMs,
    density,
  });
  const voteRevealStepMs = getCompressedTiming({
    base: tempo.voteRevealStepMs,
    min: tempo.voteRevealStepMinMs,
    density,
  });
  const voteRevealFinalHoldMs = getCompressedTiming({
    base: tempo.voteRevealFinalHoldMs,
    min: tempo.voteRevealFinalHoldMinMs,
    density,
  });
  const expectedTotalDurationMs =
    tempo.voteRevealStageDelayMs +
    tempo.voteRevealStartDelayMs +
    Math.max(0, seatCount - 1) * voteRevealStepMs +
    voteRevealFinalHoldMs;

  return {
    tableMode: tempo.tableMode,
    seatCount,
    voteLockPulseMs: tempo.voteLockPulseMs,
    voteLockStaggerMs,
    voteRevealStageDelayMs: tempo.voteRevealStageDelayMs,
    voteRevealStartDelayMs: tempo.voteRevealStartDelayMs,
    voteRevealStepMs,
    voteRevealFinalHoldMs,
    expectedTotalDurationMs,
  };
}

export function getExpectedVoteRevealDurationMs({
  players = [],
  revealPlayerCount,
}) {
  return getVoteTempoProfile({ players, revealPlayerCount }).expectedTotalDurationMs;
}

export function getMajorBeatDurationMs(kind, players = []) {
  const tempo = getLiveTempoProfile(players);

  switch (kind) {
    case 'nomination-locked':
      return tempo.nominationLockedMs;
    case 'veto-request':
      return tempo.vetoRequestMs;
    case 'execution':
      return tempo.executionMs;
    case 'game-over':
    case 'hitler-elected':
      return tempo.gameOverMs;
    default:
      return tempo.nominationLockedMs;
  }
}

export function getBotThinkDelayRange({ phase, players = [] }) {
  const tableMode = getLiveTableMode(players);
  const baseRange = BOT_PHASE_DELAY_RANGES[phase] || BOT_PHASE_DELAY_RANGES.DEFAULT;
  const tableBonus =
    BOT_TABLE_MODE_BONUSES[tableMode][phase] || BOT_TABLE_MODE_BONUSES[tableMode].DEFAULT;

  return {
    tableMode,
    min: baseRange.min + tableBonus.min,
    max: baseRange.max + tableBonus.max,
  };
}
