import RoleReveal from '../../components/RoleReveal';

export default function RoleRevealPhaseView({ gameState, playerId, onReady }) {
  return (
    <RoleReveal
      gameState={gameState}
      playerId={playerId}
      onReady={onReady}
    />
  );
}
