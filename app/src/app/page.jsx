"use client";

import { useEffect, useState } from 'react';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../backend/convex/_generated/api";
import { PHASES } from '../lib/constants.js';
import Splash from '../components/Splash';
import Lobby from '../components/Lobby';
import RoleReveal from '../components/RoleReveal';
import GameBoard from '../components/GameBoard';
import GameOver from '../components/GameOver';
import GlobalControls from '../components/GlobalControls';

const STORAGE_KEYS = {
  roomId: 'eclipse_roomId',
  playerId: 'eclipse_playerId',
  playerName: 'eclipse_playerName',
};

export default function App() {
  const [mounted, setMounted] = useState(false);
  const [roomId, setRoomId] = useState('');
  const [playerId, setPlayerId] = useState(null);

  useEffect(() => {
    setMounted(true);
    const savedRoom = sessionStorage.getItem(STORAGE_KEYS.roomId) || '';
    const savedPlayer = sessionStorage.getItem(STORAGE_KEYS.playerId) || null;
    if (savedRoom) setRoomId(savedRoom);
    if (savedPlayer) setPlayerId(savedPlayer);
  }, []);

  const gameState = useQuery(api.game.getGameState, roomId ? { roomId, playerId } : "skip");

  const joinRoom = useMutation(api.game.joinRoom);
  const startGame = useMutation(api.game.startGame);
  const toggleReady = useMutation(api.game.toggleReady);
  const nominateChancellor = useMutation(api.game.nominateChancellor);
  const submitVote = useMutation(api.game.castVote);
  const presidentDiscard = useMutation(api.game.presidentDrawPolicies);
  const chancellorEnact = useMutation(api.game.chancellorEnactPolicy);
  const leaveRoom = useMutation(api.game.leaveRoom);
  const resetRoom = useMutation(api.game.resetRoom);
  const wipeAllData = useMutation(api.game.wipeAllData);
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
  }, [roomId, gameState?.phase, playerId, gameState?.players]);

  // Prevent hydration mismatch: render nothing until client-side state is ready
  if (!mounted) return null;

  const handleConnect = async (playerName, rId, avatarId) => {
    try {
      const result = await joinRoom({ roomId: rId, name: playerName, avatarId });
      if (result.success) {
        setRoomId(rId);
        setPlayerId(result.playerId);
        sessionStorage.setItem(STORAGE_KEYS.roomId, rId);
        sessionStorage.setItem(STORAGE_KEYS.playerId, result.playerId);
        sessionStorage.setItem(STORAGE_KEYS.playerName, playerName);
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      throw err;
    }
  };

  const handleExit = async () => {
    if (roomId && playerId) {
      await leaveRoom({ roomId, playerId });
    }
    sessionStorage.removeItem(STORAGE_KEYS.roomId);
    sessionStorage.removeItem(STORAGE_KEYS.playerId);
    sessionStorage.removeItem(STORAGE_KEYS.playerName);
    setRoomId('');
    setPlayerId(null);
    window.location.search = '';
  };

  // 0. Loading State
  if (roomId && gameState === undefined) {
    return (
      <div className="min-h-[100dvh] w-full flex items-center justify-center bg-obsidian-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-400 animate-spin transform rotate-45" />
          <p className="text-cyan-400 font-mono text-xs tracking-widest uppercase animate-pulse">Establishing_ Uplink...</p>
        </div>
      </div>
    );
  }

  // 1. Splash Screen / Join Phase
  const isParticipant = gameState?.players?.some(p => p.id === playerId);
  
  if (!roomId || !gameState || !isParticipant) {
    return <Splash onConnect={handleConnect} />;
  }

  // 2. Main Game Wrapper (with Admin Controls)
  return (
    <div className="min-h-[100dvh] bg-obsidian-950 text-white relative">
      <GlobalControls 
        gameState={gameState} 
        playerId={playerId} 
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
      
      <div>
        {gameState.phase === PHASES.LOBBY && (
          <Lobby 
            gameState={gameState} 
            playerId={playerId} 
            onStart={() => startGame({ roomId })} 
            onAddBot={() => addBot({ roomId })}
          />
        )}
        
        {gameState.phase === PHASES.ROLE_REVEAL && (
          <RoleReveal 
            gameState={gameState} 
            playerId={playerId} 
            onReady={() => toggleReady({ roomId, playerId })}
          />
        )}
        
        {gameState.phase !== PHASES.LOBBY && gameState.phase !== PHASES.ROLE_REVEAL && gameState.phase !== PHASES.GAME_OVER && (
          <GameBoard 
            gameState={gameState} 
            playerId={playerId}
            onNominate={(id) => nominateChancellor({ roomId, presidentId: playerId, chancellorId: id })}
            onVote={(approve) => submitVote({ roomId, playerId, vote: approve ? "YA" : "NEIN" })}
            onDiscard={(i) => presidentDiscard({ roomId, discardedIndex: i })}
            onEnact={(idx) => chancellorEnact({ roomId, enactedIndex: idx })}
            onKill={(targetId) => killPlayer({ roomId, targetPlayerId: targetId })}
          />
        )}
        
        {gameState.phase === PHASES.GAME_OVER && (
          <GameOver gameState={gameState} playerId={playerId} />
        )}
      </div>
    </div>
  );
}
