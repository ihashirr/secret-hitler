import { PHASES } from '../lib/constants';
import ConnectPhaseView from './views/ConnectPhaseView';
import GameOverPhaseView from './views/GameOverPhaseView';
import LiveGamePhaseView from './views/LiveGamePhaseView';
import LoadingPhaseView from './views/LoadingPhaseView';
import LobbyPhaseView from './views/LobbyPhaseView';
import RoleRevealPhaseView from './views/RoleRevealPhaseView';

export default function PhaseRouter({ viewKey, gameState, playerId, directorState, mobileAccess, actions }) {
  switch (viewKey) {
    case 'LOADING':
      return <LoadingPhaseView />;

    case PHASES.LOBBY:
      return (
        <LobbyPhaseView
          gameState={gameState}
          playerId={playerId}
          onStart={actions.onStart}
          onAddBot={actions.onAddBot}
        />
      );

    case PHASES.ROLE_REVEAL:
      return (
        <RoleRevealPhaseView
          gameState={gameState}
          playerId={playerId}
          onReady={actions.onReady}
        />
      );

    case 'LIVE_GAME':
      return (
        <LiveGamePhaseView
          gameState={gameState}
          playerId={playerId}
          directorState={directorState}
          onNominate={actions.onNominate}
          onVote={actions.onVote}
          onDiscard={actions.onDiscard}
          onRequestVeto={actions.onRequestVeto}
          onRespondVeto={actions.onRespondVeto}
          onEnact={actions.onEnact}
          onInvestigate={actions.onInvestigate}
          onSpecialElection={actions.onSpecialElection}
          onAcknowledgePeek={actions.onAcknowledgePeek}
          onKill={actions.onKill}
        />
      );

    case PHASES.GAME_OVER:
      return <GameOverPhaseView gameState={gameState} playerId={playerId} onReplay={actions.onReplay} />;

    case 'CONNECT':
    default:
      return <ConnectPhaseView onConnect={actions.onConnect} mobileAccess={mobileAccess} />;
  }
}
