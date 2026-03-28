"use client";

import { useEffect, useState } from 'react';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../backend/convex/_generated/api";
import { PHASES } from '../lib/constants.js';
import GlobalControls from '../components/GlobalControls';
import StageInfoButton from '../components/StageInfoButton';
import StageInfoOverlay from '../components/StageInfoOverlay';
import { buildDirectorState } from '../engine/gameEngine';
import PhaseRouter from '../phases/PhaseRouter';
import { getPhaseViewKey } from '../phases/config';

const STORAGE_KEYS = {
  roomId: 'eclipse_roomId',
  playerId: 'eclipse_playerId',
};

export default function App() {
  const [mounted, setMounted] = useState(false);
  const [roomId, setRoomId] = useState('');
  const [playerId, setPlayerId] = useState(null);
  const [showStageInfo, setShowStageInfo] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const savedRoom = sessionStorage.getItem(STORAGE_KEYS.roomId) || '';
      const savedPlayer = sessionStorage.getItem(STORAGE_KEYS.playerId) || null;

      setMounted(true);
      setRoomId(savedRoom);
      setPlayerId(savedPlayer);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const gameState = useQuery(api.game.getGameState, roomId ? { roomId, playerId } : "skip");

  const joinRoom = useMutation(api.game.joinRoom);
  const startGame = useMutation(api.game.startGame);
  const toggleReady = useMutation(api.game.toggleReady);
  const nominateChancellor = useMutation(api.game.nominateChancellor);
  const submitVote = useMutation(api.game.castVote);
  const presidentDiscard = useMutation(api.game.presidentDrawPolicies);
  const requestVeto = useMutation(api.game.requestVeto);
  const respondVeto = useMutation(api.game.respondVeto);
  const chancellorEnact = useMutation(api.game.chancellorEnactPolicy);
  const leaveRoom = useMutation(api.game.leaveRoom);
  const resetRoom = useMutation(api.game.resetRoom);
  const wipeAllData = useMutation(api.game.wipeAllData);
  const investigateLoyalty = useMutation(api.game.investigateLoyalty);
  const callSpecialElection = useMutation(api.game.callSpecialElection);
  const completePolicyPeek = useMutation(api.game.completePolicyPeek);
  const killPlayer = useMutation(api.game.killPlayer);
  const addBot = useMutation(api.game.addBot);
  const processBots = useMutation(api.game.processBots);

  // Bot Automation Loop (Host only)
  useEffect(() => {
    if (!roomId || !gameState || gameState.phase === PHASES.LOBBY || gameState.phase === PHASES.GAME_OVER) return;
    
    const me = gameState.players.find(p => p.id === playerId);
    if (!me?.isHost) return;

    const interval = setInterval(() => {
      processBots({ roomId });
    }, 3000); // Check every 3 seconds

    return () => clearInterval(interval);
  }, [roomId, gameState, playerId, processBots]);

  // Prevent hydration mismatch: render nothing until client-side state is ready
  if (!mounted) return null;

  const handleConnect = async (name, rId, avatarId) => {
    const result = await joinRoom({ roomId: rId, name, avatarId });

    if (result.success) {
      setRoomId(rId);
      setPlayerId(result.playerId);
      sessionStorage.setItem(STORAGE_KEYS.roomId, rId);
      sessionStorage.setItem(STORAGE_KEYS.playerId, result.playerId);
      return;
    }

    throw new Error(result.error);
  };

  const handleExit = async () => {
    if (roomId && playerId) {
      await leaveRoom({ roomId, playerId });
    }
    setShowStageInfo(false);
    sessionStorage.removeItem(STORAGE_KEYS.roomId);
    sessionStorage.removeItem(STORAGE_KEYS.playerId);
    setRoomId('');
    setPlayerId(null);
    if (window.location.search) {
      window.history.replaceState(null, '', '/');
    }
  };

  const viewKey = getPhaseViewKey({ roomId, gameState, playerId });
  const directorState = buildDirectorState({ roomId, playerId, gameState, viewKey });
  const showGlobalControls = viewKey !== 'CONNECT' && viewKey !== 'LOADING';

  return (
    <div className="min-h-[100svh] bg-obsidian-950 text-white relative">
      {showGlobalControls && (
        <GlobalControls 
          gameState={gameState} 
          playerId={playerId} 
          directorState={directorState}
          onOpenInfo={() => setShowStageInfo(true)}
          onReset={async () => {
            await resetRoom({ roomId });
            handleExit();
          }}
          onWipe={async () => {
            await wipeAllData();
            sessionStorage.clear();
            window.location.href = '/';
          }}
          onExit={handleExit}
        />
      )}

      {!showGlobalControls && (
        <StageInfoButton floating onClick={() => setShowStageInfo(true)} />
      )}

      <StageInfoOverlay
        open={showStageInfo}
        onClose={() => setShowStageInfo(false)}
        directorState={directorState}
      />

      <PhaseRouter
        viewKey={viewKey}
        gameState={gameState}
        playerId={playerId}
        directorState={directorState}
        actions={{
          onConnect: handleConnect,
          onStart: () => startGame({ roomId }),
          onAddBot: () => addBot({ roomId }),
          onReplay: handleExit,
          onReady: () => toggleReady({ roomId, playerId }),
          onNominate: (id) => nominateChancellor({ roomId, presidentId: playerId, chancellorId: id }),
          onVote: (approve) => submitVote({ roomId, playerId, vote: approve ? "YA" : "NEIN" }),
          onDiscard: (index) => presidentDiscard({ roomId, presidentId: playerId, discardedIndex: index }),
          onRequestVeto: () => requestVeto({ roomId, chancellorId: playerId }),
          onRespondVeto: (accept) => respondVeto({ roomId, presidentId: playerId, accept }),
          onEnact: (index) => chancellorEnact({ roomId, chancellorId: playerId, enactedIndex: index }),
          onInvestigate: (targetPlayerId) => investigateLoyalty({ roomId, presidentId: playerId, targetPlayerId }),
          onSpecialElection: (targetPlayerId) => callSpecialElection({ roomId, presidentId: playerId, targetPlayerId }),
          onAcknowledgePeek: () => completePolicyPeek({ roomId, presidentId: playerId }),
          onKill: (targetPlayerId) => killPlayer({ roomId, presidentId: playerId, targetPlayerId }),
        }}
      />
    </div>
  );
}
