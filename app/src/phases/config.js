import { PHASES } from '../lib/constants';

export const PHASE_LABELS = {
  [PHASES.LOBBY]: 'Lobby',
  [PHASES.ROLE_REVEAL]: 'Role Briefing',
  [PHASES.NOMINATION]: 'Nomination',
  [PHASES.VOTING]: 'Voting',
  [PHASES.LEGISLATIVE_PRESIDENT]: 'President Desk',
  [PHASES.LEGISLATIVE_CHANCELLOR]: 'Chancellor Desk',
  [PHASES.EXECUTIVE_ACTION]: 'Executive Action',
  [PHASES.GAME_OVER]: 'Game Over',
};

export const isLiveGamePhase = (phase) =>
  phase === PHASES.NOMINATION ||
  phase === PHASES.VOTING ||
  phase === PHASES.LEGISLATIVE_PRESIDENT ||
  phase === PHASES.LEGISLATIVE_CHANCELLOR ||
  phase === PHASES.EXECUTIVE_ACTION;

export const getPhaseViewKey = ({ roomId, gameState, playerId }) => {
  if (roomId && gameState === undefined) return 'LOADING';

  const isParticipant = gameState?.players?.some((player) => player.id === playerId);

  if (!roomId || !gameState || !isParticipant) return 'CONNECT';
  if (gameState.phase === PHASES.LOBBY) return PHASES.LOBBY;
  if (gameState.phase === PHASES.ROLE_REVEAL) return PHASES.ROLE_REVEAL;
  if (gameState.phase === PHASES.GAME_OVER) return PHASES.GAME_OVER;
  if (isLiveGamePhase(gameState.phase)) return 'LIVE_GAME';

  return 'CONNECT';
};
