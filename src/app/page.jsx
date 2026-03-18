"use client";

import React, { useState, useEffect } from 'react';
import { socket } from '../lib/socket.js';
import { PHASES } from '../lib/constants.js';
import Splash from '../components/Splash';
import Lobby from '../components/Lobby';
import RoleReveal from '../components/RoleReveal';
import GameBoard from '../components/GameBoard';
import GameOver from '../components/GameOver';

export default function App() {
  const [gameState, setGameState] = useState(null);
  const [playerId, setPlayerId] = useState(null);
  const [error, setError] = useState('');
  const [isReconnecting, setIsReconnecting] = useState(true);

  useEffect(() => {
    const savedRoomId = sessionStorage.getItem('eclipse_roomId');
    const savedPlayerName = sessionStorage.getItem('eclipse_playerName');

    if (savedRoomId && savedPlayerName) {
      handleConnect(savedPlayerName, savedRoomId).catch(() => {
        sessionStorage.removeItem('eclipse_roomId');
        sessionStorage.removeItem('eclipse_playerName');
      }).finally(() => {
        setIsReconnecting(false);
      });
    } else {
      setIsReconnecting(false);
    }
    socket.on('connect', () => {
      console.log('Connected to server');
    });

    socket.on('game_state_update', (newState) => {
      setGameState(newState);
      console.log('State updated:', newState);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    return () => {
      socket.off('connect');
      socket.off('game_state_update');
      socket.off('disconnect');
    };
  }, []);

  const handleConnect = (playerName, roomId) => {
    return new Promise((resolve, reject) => {
      const joinRoom = () => {
        socket.emit('join_room', { roomId, playerName }, (response) => {
          if (response.success) {
            setPlayerId(response.playerId);
            sessionStorage.setItem('eclipse_roomId', roomId);
            sessionStorage.setItem('eclipse_playerName', playerName);
            resolve();
          } else {
            socket.disconnect();
            reject(new Error(response.error));
          }
        });
      };

      if (socket.connected) {
        joinRoom();
      } else {
        socket.connect();
        socket.once('connect', joinRoom);
      }
      
      // Timeout if cannot connect
      setTimeout(() => {
        if (!socket.connected) {
          reject(new Error('Connection timeout'));
        }
      }, 5000);
    });
  };

  const handleStartGame = () => {
    socket.emit('start_game');
  };

  const handleExit = () => {
    sessionStorage.removeItem('eclipse_roomId');
    sessionStorage.removeItem('eclipse_playerName');
    socket.disconnect();
    setGameState(null);
    setPlayerId(null);
    setError('');
    window.location.search = ''; // Clear URL params if any
  };

  // Routing Logic
  if (isReconnecting) {
    return (
      <div className="min-h-[100dvh] w-full flex items-center justify-center p-6 bg-obsidian-900 border-cyan-500/30">
        <div className="tactical-panel p-8 text-center text-cyan-400 font-mono tracking-[0.2em] uppercase">
           <div className="w-8 h-8 mx-auto mb-4 border-2 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin" />
           REESTABLISHING CONNECTION...
        </div>
      </div>
    );
  }

  if (!gameState || !playerId) {
    return <Splash onConnect={handleConnect} />;
  }

  if (gameState.phase === PHASES.LOBBY) {
    return <Lobby gameState={gameState} playerId={playerId} onStart={handleStartGame} onExit={handleExit} />;
  }

  if (gameState.phase === PHASES.ROLE_REVEAL) {
    return (
      <RoleReveal 
        gameState={gameState} 
        playerId={playerId} 
        onReady={() => socket.emit('player_ready')} 
      />
    );
  }

  if (gameState.phase !== PHASES.GAME_OVER) {
    return (
      <GameBoard 
        gameState={gameState} 
        playerId={playerId}
        onNominate={(id) => socket.emit('nominate_chancellor', id)}
        onVote={(approve) => socket.emit('submit_vote', approve)}
        onDiscard={(i) => socket.emit('president_discard', i)}
        onEnact={(i) => socket.emit('chancellor_enact', i)}
        onExit={handleExit}
      />
    );
  }

  // Fallback or GameOver
  return <GameOver gameState={gameState} playerId={playerId} onExit={handleExit} />;
}
