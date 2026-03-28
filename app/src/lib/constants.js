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

export const EXECUTIVE_POWERS = {
  INVESTIGATE: 'INVESTIGATE',
  SPECIAL_ELECTION: 'SPECIAL_ELECTION',
  PEEK: 'PEEK',
  EXECUTION: 'EXECUTION',
};

// Tracks needed to win
export const FASCIST_TO_WIN = 6;
export const LIBERAL_TO_WIN = 5;

// Election Tracker Limit
export const MAX_ELECTION_TRACKER = 3;
