import Lobby from '../../components/Lobby';

export default function LobbyPhaseView({ gameState, playerId, onStart, onAddBot }) {
  return (
    <Lobby
      gameState={gameState}
      playerId={playerId}
      onStart={onStart}
      onAddBot={onAddBot}
    />
  );
}
