import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ROLES, FACTIONS } from '../constants';
import { Shield, Skull, Eye } from 'lucide-react';

export default function RoleReveal({ gameState, playerId, onReady }) {
  const [isRevealing, setIsRevealing] = useState(false);
  
  const me = gameState.players.find(p => p.id === playerId);
  
  // Who else can this player see?
  const visibleTeammates = gameState.players.filter(p => 
    p.id !== playerId && p.role !== null
  );

  const getRoleTheme = () => {
    if (me?.role === ROLES.LIBERAL) return 'bg-cyan-950/80 border-cyan-400 shadow-[0_0_40px_rgba(0,240,255,0.4)] text-cyan-100';
    if (me?.role === ROLES.FASCIST) return 'bg-red-950/80 border-red-500 shadow-[0_0_40px_rgba(255,0,60,0.4)] text-red-100';
    if (me?.role === ROLES.HITLER) return 'bg-red-950/90 border-t-4 border-b-4 border-red-500 shadow-[inset_0_0_30px_rgba(255,0,60,0.5),0_0_50px_rgba(255,0,60,0.6)] text-red-100';
    return 'bg-obsidian-800 border-white/10';
  };

  const getRoleIcon = () => {
    if (me?.role === ROLES.LIBERAL) return <Shield size={56} className="text-cyan-400 mb-6 drop-shadow-[0_0_15px_rgba(0,240,255,0.8)]" />;
    if (me?.faction === FACTIONS.FASCIST) return <Skull size={56} className="text-red-500 mb-6 drop-shadow-[0_0_15px_rgba(255,0,60,0.8)]" />;
    return null;
  };

  const getRoleTitle = () => {
    if (me?.role === ROLES.LIBERAL) return 'Liberal';
    if (me?.role === ROLES.FASCIST) return 'Fascist';
    if (me?.role === ROLES.HITLER) return 'Hitler';
    return 'Unknown';
  };

  const getObjective = () => {
    if (me?.faction === FACTIONS.LIBERAL) {
      return 'Find your fellow Liberals. Pass 5 Liberal policies or assassinate Hitler.';
    } else {
      return 'Stay hidden. Pass 6 Fascist policies or elect Hitler as Chancellor after 3 Fascist policies are passed.';
    }
  };

  if (me?.isReady) {
    return (
      <div className="min-h-[100dvh] w-full flex items-center justify-center p-6 text-center">
        <div className="tactical-panel p-8 text-center border-cyan-500/30">
          <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-400 animate-spin mx-auto mb-6 transform rotate-45" />
          <h2 className="text-xl font-mono text-cyan-400 mb-2 uppercase tracking-[0.2em]">Awaiting Operatives</h2>
          <p className="text-cyan-500/50 text-xs font-mono tracking-widest uppercase animate-pulse">Synchronizing Identities...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] w-full flex flex-col p-6 relative select-none bg-obsidian-900">
      <div className="text-center mb-6 pt-8">
        <h2 className="text-2xl font-mono text-cyan-400 tracking-[0.3em] font-bold neon-text-cyan uppercase">Identity_Verify</h2>
        <p className="text-cyan-500/60 text-xs mt-2 font-mono uppercase tracking-[0.4em]">// LEVEL 5 CLEARANCE ONLY</p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center -mt-10">
        <AnimatePresence mode="wait">
          {!isRevealing ? (
            <motion.div
              key="hidden"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, rotateY: 90 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-sm aspect-[2/3] tactical-panel flex flex-col items-center justify-center border-cyan-500/30 hover:border-cyan-400 shadow-[0_0_20px_rgba(0,240,255,0.1)] hover:shadow-[0_0_30px_rgba(0,240,255,0.2)] cursor-pointer group transition-all"
              onPointerDown={() => setIsRevealing(true)}
            >
              <div className="w-20 h-20 mb-8 border border-cyan-500/30 flex items-center justify-center group-hover:border-cyan-400 transition-colors transform rotate-45">
                <Eye size={40} className="text-cyan-500/50 group-hover:text-cyan-400 -rotate-45 transition-colors" />
              </div>
              <p className="text-cyan-500/50 group-hover:text-cyan-400 text-xs uppercase tracking-[0.3em] font-mono">Scan Retinal Pattern</p>
              <p className="text-white/20 text-[10px] mt-4 font-mono uppercase tracking-widest">Hold to Authenticate</p>
            </motion.div>
          ) : (
            <motion.div
              key="revealed"
              initial={{ opacity: 0, rotateY: -90 }}
              animate={{ opacity: 1, rotateY: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.4, type: 'spring' }}
              className={`w-full max-w-sm aspect-[2/3] border ${getRoleTheme()} p-8 flex flex-col items-center text-center overflow-y-auto relative`}
              onPointerUp={() => setIsRevealing(false)}
              onPointerLeave={() => setIsRevealing(false)}
            >
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDEiLz4KPC9zdmc+')] opacity-20" />
              
              <div className="flex-1 flex flex-col items-center justify-center w-full relative z-10">
                {getRoleIcon()}
                <p className="text-white/50 text-[10px] font-mono uppercase tracking-[0.2em] mb-1">Authenticated As:</p>
                <h1 className="text-4xl font-sans font-black tracking-widest mb-6 uppercase">
                  {getRoleTitle()}
                </h1>
                
                <div className="bg-black/40 w-full p-5 border border-white/10 mb-6 font-mono text-xs leading-relaxed text-white/80 tracking-wide text-left">
                  {'>'} DIRECTIVE: <br/><span className="text-white/60">{getObjective()}</span>
                </div>

                {visibleTeammates.length > 0 && (
                  <div className="w-full text-left">
                    <p className="text-[10px] text-white/40 font-mono uppercase tracking-[0.2em] mb-3 border-b border-white/10 pb-2">Known Operatives</p>
                    <div className="flex flex-col gap-2">
                      {visibleTeammates.map(t => (
                        <div key={t.id} className="flex justify-between items-center bg-black/30 px-3 py-2 border border-red-500/20 text-xs font-mono">
                          <span className="text-red-100">{t.name}</span>
                          <span className={t.role === ROLES.HITLER ? 'text-red-500 font-bold neon-text-crimson' : 'text-red-400 font-bold'}>
                            [{t.role === ROLES.HITLER ? 'Hitler' : 'Fascist'}]
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-auto pt-6 w-full max-w-sm mx-auto">
        <button
          onClick={onReady}
          className="w-full bg-cyan-900/20 text-cyan-400 hover:text-cyan-300 font-mono font-bold uppercase tracking-[0.2em] p-4 border border-cyan-500/50 hover:bg-cyan-900/40 hover:border-cyan-400 transition-all shadow-[0_0_15px_rgba(0,240,255,0.1)] hover:shadow-[0_0_20px_rgba(0,240,255,0.3)] text-sm"
        >
          {'>'} ACKNOWLEDGE_DIRECTIVE
        </button>
      </div>
    </div>
  );
}
