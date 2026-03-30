import { PHASES } from '../../lib/constants';

const TABLE_MODES = {
  ALL_BOTS: 'all-bots',
  SOLO_HUMAN: 'solo-human',
  MIXED: 'mixed',
};

const LIVE_TEMPO_PROFILES = {
  [TABLE_MODES.MIXED]: {
    voteLockPulseMs: 620,
    voteLockStaggerMs: 170,
    voteRevealStageDelayMs: 120,
    voteRevealStartDelayMs: 260,
    voteRevealStepMs: 240,
    voteRevealFinalHoldMs: 560,
    nominationLockedMs: 1250,
    vetoRequestMs: 1550,
    executionMs: 1600,
    gameOverMs: 1850,
    majorBeatGraceMs: 900,
    voteRevealGraceMs: 1200,
    liveStateIdleHealthCheckMs: 5200,
    healthCheckThrottleMs: 2200,
  },
  [TABLE_MODES.SOLO_HUMAN]: {
    voteLockPulseMs: 760,
    voteLockStaggerMs: 220,
    voteRevealStageDelayMs: 150,
    voteRevealStartDelayMs: 320,
    voteRevealStepMs: 270,
    voteRevealFinalHoldMs: 680,
    nominationLockedMs: 1400,
    vetoRequestMs: 1700,
    executionMs: 1750,
    gameOverMs: 1950,
    majorBeatGraceMs: 1000,
    voteRevealGraceMs: 1300,
    liveStateIdleHealthCheckMs: 4800,
    healthCheckThrottleMs: 2000,
  },
  [TABLE_MODES.ALL_BOTS]: {
    voteLockPulseMs: 500,
    voteLockStaggerMs: 120,
    voteRevealStageDelayMs: 90,
    voteRevealStartDelayMs: 210,
    voteRevealStepMs: 170,
    voteRevealFinalHoldMs: 420,
    nominationLockedMs: 900,
    vetoRequestMs: 1200,
    executionMs: 1300,
    gameOverMs: 1500,
    majorBeatGraceMs: 750,
    voteRevealGraceMs: 900,
    liveStateIdleHealthCheckMs: 5600,
    healthCheckThrottleMs: 2200,
  },
};

const BOT_PHASE_DELAY_RANGES = {
  DEFAULT: { min: 900, max: 1500 },
  [PHASES.ROLE_REVEAL]: { min: 520, max: 840 },
  [PHASES.VOTING]: { min: 780, max: 1180 },
  [PHASES.NOMINATION]: { min: 1250, max: 1920 },
  [PHASES.LEGISLATIVE_PRESIDENT]: { min: 1320, max: 2050 },
  [PHASES.LEGISLATIVE_CHANCELLOR]: { min: 1380, max: 2140 },
  [PHASES.EXECUTIVE_ACTION]: { min: 1450, max: 2280 },
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
    DEFAULT: { min: 180, max: 360 },
    [PHASES.ROLE_REVEAL]: { min: 160, max: 300 },
    [PHASES.VOTING]: { min: 220, max: 420 },
    [PHASES.NOMINATION]: { min: 320, max: 620 },
    [PHASES.LEGISLATIVE_PRESIDENT]: { min: 320, max: 620 },
    [PHASES.LEGISLATIVE_CHANCELLOR]: { min: 360, max: 680 },
    [PHASES.EXECUTIVE_ACTION]: { min: 360, max: 720 },
  },
  [TABLE_MODES.ALL_BOTS]: {
    DEFAULT: { min: 120, max: 240 },
    [PHASES.ROLE_REVEAL]: { min: 80, max: 180 },
    [PHASES.VOTING]: { min: 180, max: 320 },
    [PHASES.NOMINATION]: { min: 260, max: 440 },
    [PHASES.LEGISLATIVE_PRESIDENT]: { min: 280, max: 460 },
    [PHASES.LEGISLATIVE_CHANCELLOR]: { min: 280, max: 480 },
    [PHASES.EXECUTIVE_ACTION]: { min: 320, max: 540 },
  },
};

const getAlivePlayers = (players = []) => players.filter((player) => player.isAlive !== false);

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

export function getExpectedVoteRevealDurationMs({
  players = [],
  revealPlayerCount,
}) {
  const tempo = getLiveTempoProfile(players);
  const alivePlayerCount = getAlivePlayers(players).length;
  const seatCount = Math.max(0, revealPlayerCount ?? alivePlayerCount);

  return (
    tempo.voteRevealStageDelayMs +
    tempo.voteRevealStartDelayMs +
    Math.max(0, seatCount - 1) * tempo.voteRevealStepMs +
    tempo.voteRevealFinalHoldMs
  );
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
