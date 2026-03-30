import React from 'react';
import dynamic from 'next/dynamic';
import { PHASES } from '../lib/constants';
import ConnectPhaseView from './views/ConnectPhaseView';
import LoadingPhaseView from './views/LoadingPhaseView';
const LobbyPhaseView = dynamic(() => import('./views/LobbyPhaseView'));
const RoleRevealPhaseView = dynamic(() => import('./views/RoleRevealPhaseView'));
const LiveGamePhaseView = dynamic(() => import('./views/LiveGamePhaseView'));
const GameOverPhaseView = dynamic(() => import('./views/GameOverPhaseView'));

function PhaseRouter({ viewKey, gameState, playerId, directorState, actions }) {
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
      return <ConnectPhaseView onConnect={actions.onConnect} />;
  }
}

export default React.memo(PhaseRouter);
