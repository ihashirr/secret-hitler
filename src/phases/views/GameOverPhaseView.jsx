import GameOver from '../../components/GameOver';

export default function GameOverPhaseView({ gameState, playerId, onReplay }) {
  return <GameOver gameState={gameState} playerId={playerId} onReplay={onReplay} />;
}
