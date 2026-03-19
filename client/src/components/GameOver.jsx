import React from 'react';
import { motion } from 'framer-motion';
import { FACTIONS, ROLES } from '../lib/constants';
import { Shield, Skull, Crown, LogOut } from 'lucide-react';

export default function GameOver({ gameState, playerId, onExit }) {
  const me = gameState.players.find(p => p.id === playerId);
  const isHost = me?.isHost;
  
  const isLiberalWin = gameState.winner === FACTIONS.LIBERAL;
  const themeClass = isLiberalWin ? 'bg-cyan-950/80 shadow-[inset_0_0_100px_rgba(0,240,255,0.2)]' : 'bg-red-950/80 shadow-[inset_0_0_100px_rgba(255,0,60,0.2)]';
  const textColor = isLiberalWin ? 'text-cyan-400 neon-text-cyan' : 'text-red-500 neon-text-crimson';

  return (
    <div className={`min-h-[100dvh] w-full flex flex-col p-6 relative overflow-hidden bg-obsidian-900`}>
      <div className={`absolute inset-0 z-0 ${themeClass} backdrop-blur-sm`} />
      
      <div className="z-10 flex-1 flex flex-col items-center justify-start pt-12">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', bounce: 0.5, duration: 0.8 }}
          className="text-center mb-8 relative z-10"
        >
          {isLiberalWin ? (
             <Shield size={80} className="text-cyan-400 mx-auto mb-6 drop-shadow-[0_0_30px_rgba(0,240,255,1)]" />
          ) : (
             <Skull size={80} className="text-red-500 mx-auto mb-6 drop-shadow-[0_0_30px_rgba(255,0,60,1)]" />
          )}
          <h1 className={`text-5xl font-sans font-black tracking-widest uppercase ${textColor}`}>
            {isLiberalWin ? 'LIBERALS WIN' : 'FASCISTS WIN'}
          </h1>
          <div className="mt-6 inline-block bg-black/60 p-4 border-l-4 border-cyan-500/50 relative">
             <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-white/30" />
             <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-white/30" />
             <p className="text-white/80 font-mono text-sm uppercase tracking-widest text-left">
               {'>'} MISSION_OUTCOME: <br/> <span className={isLiberalWin ? 'text-cyan-300':'text-red-300'}>{gameState.winReason}</span>
             </p>
          </div>
        </motion.div>
        <div className="w-full max-w-md tactical-panel p-6 mb-8 flex-1 overflow-y-auto border border-cyan-500/20 relative">
          {/* Decorative Corner Accents */}
          <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-cyan-500/50" />
          <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-cyan-500/50" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-cyan-500/50" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-cyan-500/50" />
          <h3 className="text-left font-mono text-white/50 mb-6 tracking-[0.2em] text-xs uppercase border-b border-cyan-500/20 pb-2">
            {'>'} FULL_DEBRIEFING_LOG
          </h3>
          <div className="flex flex-col gap-2">
            {gameState.players.map(p => (
              <div key={p.id} className="p-3 flex items-center justify-between border-b border-white/5 bg-black/40">
                <div className="flex items-center gap-3">
                  <div className={`h-8 w-8 flex items-center justify-center border font-mono font-bold
                    ${p.role === ROLES.HITLER ? 'bg-red-950 border-red-500 text-red-500' :
                      p.role === ROLES.FASCIST ? 'bg-red-900/40 border-red-500/50 text-red-400' :
                      'bg-cyan-900/40 border-cyan-500/50 text-cyan-400'}`}
                  >
                    {p.role === ROLES.HITLER ? <Crown size={14} /> : 
                     p.role === ROLES.FASCIST ? <Skull size={14} /> : <Shield size={14} />}
                  </div>
                  <span className={`font-mono text-sm uppercase tracking-widest text-white ${!p.isAlive ? 'line-through opacity-50 text-red-500' : ''}`}>{p.name}</span>
                </div>
                
                <span className={`text-[10px] uppercase font-mono tracking-[0.2em] px-2 py-1 border
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
        
        {isHost && (
          <button 
             onClick={() => window.location.reload()}
             className="w-full max-w-md bg-cyan-600 text-white font-mono font-bold uppercase tracking-[0.2em] p-4 text-sm border border-cyan-400 hover:bg-cyan-500 transition-all shadow-[0_0_15px_rgba(0,240,255,0.3)] hover:shadow-[0_0_25px_rgba(0,240,255,0.5)]"
          >
            {'>'} INITIATE_NEW_MISSION
          </button>
        )}
        
        {!isHost && (
          <div className="text-center text-cyan-500/50 text-xs font-mono uppercase tracking-[0.2em] animate-pulse">
            Awaiting host signal to restart...
          </div>
        )}
      </div>
    </div>
  );
}
