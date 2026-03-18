// Constants shared between Client and Server

export const PHASES = {
  LOBBY: 'LOBBY',
  ROLE_REVEAL: 'ROLE_REVEAL',
  NOMINATION: 'NOMINATION', 
  VOTING: 'VOTING',
  LEGISLATIVE_PRESIDENT: 'LEGISLATIVE_PRESIDENT', // Sun-Caller discards 1
  LEGISLATIVE_CHANCELLOR: 'LEGISLATIVE_CHANCELLOR', // Moon-Weaver enacts 1
  EXECUTIVE_ACTION: 'EXECUTIVE_ACTION',
  GAME_OVER: 'GAME_OVER'
};

export const FACTIONS = {
  LIBERAL: 'LIBERAL',
  FASCIST: 'FASCIST'
};

export const ROLES = {
  LIBERAL: 'LIBERAL',
  FASCIST: 'FASCIST',
  HITLER: 'HITLER'
};

export const CARD_TYPES = {
  LIBERAL: 'LIBERAL', 
  FASCIST: 'FASCIST'
};

export const MAX_PLAYERS = 10;
export const MIN_PLAYERS = 5;

// Tracks needed to win
export const FASCIST_TO_WIN = 6;
export const LIBERAL_TO_WIN = 5;

// Election Tracker Limit
export const MAX_ELECTION_TRACKER = 3;

// Role distribution table [Total Players] -> { LIBERAL, FASCIST, HITLER }
export const ROLE_COUNTS = {
  5: { [ROLES.LIBERAL]: 3, [ROLES.FASCIST]: 1, [ROLES.HITLER]: 1 },
  6: { [ROLES.LIBERAL]: 4, [ROLES.FASCIST]: 1, [ROLES.HITLER]: 1 },
  7: { [ROLES.LIBERAL]: 4, [ROLES.FASCIST]: 2, [ROLES.HITLER]: 1 },
  8: { [ROLES.LIBERAL]: 5, [ROLES.FASCIST]: 2, [ROLES.HITLER]: 1 },
  9: { [ROLES.LIBERAL]: 5, [ROLES.FASCIST]: 3, [ROLES.HITLER]: 1 },
  10: { [ROLES.LIBERAL]: 6, [ROLES.FASCIST]: 3, [ROLES.HITLER]: 1 },
};
