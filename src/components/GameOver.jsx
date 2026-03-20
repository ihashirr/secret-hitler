import React from 'react';
import { motion } from 'framer-motion';
import { FACTIONS, ROLES } from '../lib/constants';
import { Shield, Skull, Crown, LogOut } from 'lucide-react';

export default function GameOver({ gameState, playerId, onExit }) {
  const me = gameState.players.find(p => p.id === playerId);
  const isHost = me?.isHost;

  const isLiberalWin = gameState.winner === FACTIONS.LIBERAL;
  const themeClass = isLiberalWin
    ? 'bg-cyan-950/80 shadow-[inset_0_0_100px_rgba(0,240,255,0.2)]'
    : 'bg-red-950/80 shadow-[inset_0_0_100px_rgba(255,0,60,0.2)]';
  const textColor = isLiberalWin ? 'text-cyan-400 neon-text-cyan' : 'text-red-500 neon-text-crimson';

  return (
    <div className="min-h-[100dvh] w-full flex flex-col p-4 sm:p-6 pt-16 sm:pt-14 relative overflow-hidden bg-obsidian-900">
      <div className={`absolute inset-0 z-0 ${themeClass} backdrop-blur-sm`} />

      <div className="z-10 flex flex-col items-center w-full max-w-md mx-auto flex-1">
        {/* Win Banner */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', bounce: 0.5, duration: 0.8 }}
          className="text-center mb-6 w-full"
        >
          {isLiberalWin ? (
            <Shield size={64} className="text-cyan-400 mx-auto mb-4 drop-shadow-[0_0_30px_rgba(0,240,255,1)]" />
          ) : (
            <Skull size={64} className="text-red-500 mx-auto mb-4 drop-shadow-[0_0_30px_rgba(255,0,60,1)]" />
          )}
          <h1 className={`text-3xl sm:text-5xl font-sans font-black tracking-widest uppercase ${textColor}`}>
            {isLiberalWin ? 'LIBERALS WIN' : 'FASCISTS WIN'}
          </h1>
          <div className="mt-4 inline-block bg-black/60 p-3 sm:p-4 border-l-4 border-cyan-500/50 relative">
            <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-white/30" />
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-white/30" />
            <p className="text-white/80 font-mono text-xs sm:text-sm uppercase tracking-widest text-left">
              {'>'} MISSION_OUTCOME: <br />
              <span className={isLiberalWin ? 'text-cyan-300' : 'text-red-300'}>{gameState.winReason}</span>
            </p>
          </div>
        </motion.div>

        {/* Player Debriefing */}
        <div className="w-full tactical-panel p-4 sm:p-6 mb-6 flex-1 overflow-y-auto border border-cyan-500/20 relative min-h-0">
          <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-cyan-500/50" />
          <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-cyan-500/50" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-cyan-500/50" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-cyan-500/50" />

          <h3 className="text-left font-mono text-white/50 mb-4 tracking-[0.2em] text-[10px] sm:text-xs uppercase border-b border-cyan-500/20 pb-2">
            {'>'} FULL_DEBRIEFING_LOG
          </h3>
          <div className="flex flex-col gap-2">
            {gameState.players.map(p => (
              <div key={p.id} className="p-2.5 sm:p-3 flex items-center justify-between border-b border-white/5 bg-black/40">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`h-7 w-7 sm:h-8 sm:w-8 shrink-0 flex items-center justify-center border font-mono font-bold
                    ${p.role === ROLES.HITLER ? 'bg-red-950 border-red-500 text-red-500' :
                      p.role === ROLES.FASCIST ? 'bg-red-900/40 border-red-500/50 text-red-400' :
                      'bg-cyan-900/40 border-cyan-500/50 text-cyan-400'}`}
                  >
                    {p.role === ROLES.HITLER ? <Crown size={13} /> :
                     p.role === ROLES.FASCIST ? <Skull size={13} /> : <Shield size={13} />}
                  </div>
                  <span className={`font-mono text-xs sm:text-sm uppercase tracking-wider truncate text-white ${!p.isAlive ? 'line-through opacity-50 text-red-500' : ''}`}>
                    {p.name}
                  </span>
                </div>
                <span className={`shrink-0 ml-2 text-[9px] sm:text-[10px] uppercase font-mono tracking-widest px-1.5 py-0.5 border
                    ${p.role === ROLES.HITLER ? 'text-red-500 border-red-500/40 bg-red-950' :
                      p.role === ROLES.FASCIST ? 'text-red-400 border-red-500/20 bg-red-900/20' :
                      'text-cyan-400 border-cyan-500/20 bg-cyan-900/20'}`}
                >
                  [{p.role === ROLES.HITLER ? 'Hitler' : p.role === ROLES.FASCIST ? 'Fascist' : 'Liberal'}]
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        {isHost ? (
          <motion.button
            whileTap={{ scale: 0.985 }}
            onClick={() => window.location.reload()}
            className="w-full h-[64px] bg-cyan-400 text-black font-mono font-black uppercase tracking-[0.3em] text-xs sm:text-sm shadow-[0_0_20px_rgba(0,240,255,0.3)] flex items-center justify-center"
          >
            {'>'} INITIATE_NEW_MISSION
          </motion.button>
        ) : (
          <div className="text-center text-cyan-500/50 text-xs font-mono uppercase tracking-[0.2em] animate-pulse">
            Awaiting host signal to restart...
          </div>
        )}
      </div>
    </div>
  );
}
