"use client";

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { PHASES } from '../lib/constants.js'; // Using local constants or shared
import Splash from '../components/Splash';
import Lobby from '../components/Lobby';
import RoleReveal from '../components/RoleReveal';
import GameBoard from '../components/GameBoard';
import GameOver from '../components/GameOver';
import GlobalControls from '../components/GlobalControls';

export default function App() {
  const [mounted, setMounted] = useState(false);
  const [roomId, setRoomId] = useState('');
  const [playerId, setPlayerId] = useState(null);

  useEffect(() => {
    setMounted(true);
    const savedRoom = sessionStorage.getItem('eclipse_roomId') || '';
    const savedPlayer = localStorage.getItem('eclipse_playerId') || null;
    console.log("[App] Mounted. Storage:", { savedRoom, savedPlayer });
    if (savedRoom) setRoomId(savedRoom);
    if (savedPlayer) setPlayerId(savedPlayer);
  }, []);

  const gameState = useQuery(api.game.getGameState, roomId ? { roomId, playerId } : "skip");
  console.log("[App] Render. State:", { roomId, playerId, phase: gameState?.phase });
  
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

  const [error, setError] = useState('');

  // Prevent hydration mismatch: render nothing until client-side state is ready
  if (!mounted) return null;

  const handleConnect = async (playerName, rId) => {
    try {
      const result = await joinRoom({ roomId: rId, name: playerName });
      if (result.success) {
        setRoomId(rId);
        setPlayerId(result.playerId);
        sessionStorage.setItem('eclipse_roomId', rId);
        localStorage.setItem('eclipse_playerId', result.playerId);
        localStorage.setItem('eclipse_playerName', playerName);
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const handleExit = async () => {
    if (roomId && playerId) {
      await leaveRoom({ roomId, playerId });
    }
    sessionStorage.removeItem('eclipse_roomId');
    localStorage.removeItem('eclipse_playerId');
    setRoomId('');
    setPlayerId(null);
    setError('');
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
    return (
      <Splash 
        onConnect={handleConnect} 
        onReset={(rId) => resetRoom({ roomId: rId })}
      />
    );
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
          localStorage.clear();
          sessionStorage.clear();
          window.location.href = '/';
        }}
        onExit={handleExit}
      />
      
      <div>
        {gameState.phase === PHASES.LOBBY && (
          <Lobby gameState={gameState} playerId={playerId} onStart={() => startGame({ roomId })} onExit={handleExit} />
        )}
        
        {gameState.phase === PHASES.ROLE_REVEAL && (
          <RoleReveal 
            gameState={gameState} 
            playerId={playerId} 
            onReady={() => toggleReady({ roomId, playerId })} 
            onReset={() => resetRoom({ roomId })}
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
            onExit={handleExit}
            onReset={() => resetRoom({ roomId })}
          />
        )}
        
        {gameState.phase === PHASES.GAME_OVER && (
          <GameOver gameState={gameState} playerId={playerId} onExit={handleExit} />
        )}
      </div>
    </div>
  );
}
