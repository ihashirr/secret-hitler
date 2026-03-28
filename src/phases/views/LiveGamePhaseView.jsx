import GameBoard from '../../components/GameBoard';

export default function LiveGamePhaseView({
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
  return (
    <GameBoard
      gameState={gameState}
      playerId={playerId}
      directorState={directorState}
      onNominate={onNominate}
      onVote={onVote}
      onDiscard={onDiscard}
      onRequestVeto={onRequestVeto}
      onRespondVeto={onRespondVeto}
      onEnact={onEnact}
      onInvestigate={onInvestigate}
      onSpecialElection={onSpecialElection}
      onAcknowledgePeek={onAcknowledgePeek}
      onKill={onKill}
    />
  );
}
