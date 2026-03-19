import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ROLES, FACTIONS } from '../lib/constants';
import { Shield, Skull, Eye, EyeOff } from 'lucide-react';

export default function RoleReveal({ gameState, playerId, onReady }) {
  const [isRevealing, setIsRevealing] = useState(false);
  const me = gameState.players.find(p => p.id === playerId);

  const visibleTeammates = gameState.players.filter(p =>
    p.id !== playerId && p.role !== null
  );

  const getRoleTheme = () => {
    if (me?.role === ROLES.LIBERAL) return 'border-cyan-400 shadow-[0_0_30px_rgba(0,240,255,0.3)] bg-cyan-950/60';
    if (me?.role === ROLES.FASCIST) return 'border-red-500 shadow-[0_0_30px_rgba(255,0,60,0.3)] bg-red-950/60';
    if (me?.role === ROLES.HITLER) return 'border-red-500 shadow-[inset_0_0_30px_rgba(255,0,60,0.3),0_0_40px_rgba(255,0,60,0.5)] bg-red-950/80';
    return 'bg-obsidian-800 border-white/10';
  };

  const getRoleIcon = () => {
    if (me?.role === ROLES.LIBERAL) return <Shield size={44} className="text-cyan-400 mb-3 drop-shadow-[0_0_15px_rgba(0,240,255,0.8)]" />;
    if (me?.faction === FACTIONS.FASCIST || me?.role === ROLES.FASCIST || me?.role === ROLES.HITLER)
      return <Skull size={44} className="text-red-500 mb-3 drop-shadow-[0_0_15px_rgba(255,0,60,0.8)]" />;
    return null;
  };

  const getRoleTitle = () => {
    if (me?.role === ROLES.LIBERAL) return 'Liberal';
    if (me?.role === ROLES.FASCIST) return 'Fascist';
    if (me?.role === ROLES.HITLER) return 'Hitler';
    return 'Unknown';
  };

  const getObjective = () => {
    if (me?.faction === FACTIONS.LIBERAL || me?.role === ROLES.LIBERAL) {
      return 'Find your fellow Liberals. Pass 5 Liberal policies or assassinate Hitler.';
    }
    return 'Stay hidden. Pass 6 Fascist policies or elect Hitler as Chancellor after 3 Fascist policies.';
  };

  if (me?.isReady) {
    return (
      <div className="min-h-[100dvh] w-full flex items-center justify-center p-4 pt-14 text-center">
        <div className="tactical-panel p-6 sm:p-8 text-center border-cyan-500/30 w-full max-w-sm">
          <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-400 animate-spin mx-auto mb-6 transform rotate-45" />
          <h2 className="text-lg sm:text-xl font-mono text-cyan-400 mb-2 uppercase tracking-[0.2em]">Awaiting Operatives</h2>
          <p className="text-cyan-500/50 text-xs font-mono tracking-widest uppercase animate-pulse">Synchronizing Identities...</p>
          <div className="mt-4 flex flex-col gap-1">
            {gameState.players.filter(p => !p.isReady).map(p => (
              <div key={p.id} className="text-[10px] text-cyan-500/30 uppercase font-mono">
                {'>'} WAITING_FOR: {p.name}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] w-full flex flex-col p-4 sm:p-6 pt-14 bg-obsidian-900 overflow-y-auto">
      {/* Header */}
      <div className="text-center mb-4 sm:mb-5 shrink-0">
        <h2 className="text-xl sm:text-2xl font-mono text-cyan-400 tracking-[0.25em] font-bold neon-text-cyan uppercase">Identity_Verify</h2>
        <p className="text-cyan-500/60 text-[10px] mt-1 font-mono uppercase tracking-[0.4em]">// LEVEL 5 CLEARANCE ONLY</p>
      </div>

      {/* Card Area — centred, always visible, no fixed aspect ratio */}
      <div className="flex justify-center mb-4">
        <div className="w-full max-w-[280px] sm:max-w-xs">
          <AnimatePresence mode="wait">
            {!isRevealing ? (
              /* ── HIDDEN SIDE ── */
              <motion.div
                key="hidden"
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, rotateY: 90 }}
                transition={{ duration: 0.25 }}
                onClick={() => setIsRevealing(true)}
                className="tactical-panel flex flex-col items-center justify-center border-cyan-500/30 hover:border-cyan-400 shadow-[0_0_20px_rgba(0,240,255,0.1)] hover:shadow-[0_0_30px_rgba(0,240,255,0.2)] cursor-pointer group transition-all py-16"
              >
                <div className="w-16 h-16 mb-6 border border-cyan-500/30 flex items-center justify-center group-hover:border-cyan-400 transition-colors transform rotate-45">
                  <Eye size={30} className="text-cyan-500/50 group-hover:text-cyan-400 -rotate-45 transition-colors" />
                </div>
                <p className="text-cyan-500/50 group-hover:text-cyan-400 text-[11px] uppercase tracking-[0.25em] font-mono">Tap to Authenticate</p>
              </motion.div>
            ) : (
              /* ── REVEALED SIDE ── */
              <motion.div
                key="revealed"
                initial={{ opacity: 0, rotateY: -90 }}
                animate={{ opacity: 1, rotateY: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.35, type: 'spring' }}
                className={`border-2 ${getRoleTheme()} p-5 sm:p-6 flex flex-col items-center text-center relative`}
              >
                {/* Hide toggle */}
                <button
                  onClick={() => setIsRevealing(false)}
                  className="absolute top-2 right-2 text-white/30 hover:text-white/70 transition-colors"
                >
                  <EyeOff size={14} />
                </button>

                {/* Role info */}
                <div className="flex flex-col items-center w-full">
                  {getRoleIcon()}
                  <p className="text-white/50 text-[9px] sm:text-[10px] font-mono uppercase tracking-[0.2em] mb-1">Authenticated As:</p>
                  <h1 className="text-3xl sm:text-4xl font-sans font-black tracking-widest mb-4 uppercase text-white">
                    {getRoleTitle()}
                  </h1>

                  <div className="bg-black/40 w-full p-3 sm:p-4 border border-white/10 mb-4 font-mono text-[10px] sm:text-xs leading-relaxed text-white/80 tracking-wide text-left">
                    {'>'} DIRECTIVE:<br />
                    <span className="text-white/60">{getObjective()}</span>
                  </div>

                  {visibleTeammates.length > 0 && (
                    <div className="w-full text-left">
                      <p className="text-[9px] text-white/40 font-mono uppercase tracking-[0.2em] mb-2 border-b border-white/10 pb-1">Known Operatives</p>
                      <div className="flex flex-col gap-1.5">
                        {visibleTeammates.map(t => (
                          <div key={t.id} className="flex justify-between items-center bg-black/30 px-3 py-2 border border-red-500/20 text-xs font-mono">
                            <span className="text-red-100 truncate">{t.name}</span>
                            <span className={`shrink-0 ml-2 font-bold ${t.role === ROLES.HITLER ? 'text-red-500' : 'text-red-400'}`}>
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
      </div>

      {/* Acknowledge button — always at the bottom, accessible even when card is tall */}
      <div className="flex justify-center mt-auto pt-2">
        <button
          onClick={onReady}
          className="w-full max-w-[280px] sm:max-w-xs bg-cyan-900/20 text-cyan-400 hover:text-cyan-300 font-mono font-bold uppercase tracking-[0.15em] p-3.5 sm:p-4 border border-cyan-500/50 hover:bg-cyan-900/40 hover:border-cyan-400 transition-all shadow-[0_0_15px_rgba(0,240,255,0.1)] hover:shadow-[0_0_20px_rgba(0,240,255,0.3)] text-xs sm:text-sm"
        >
          {'>'} ACKNOWLEDGE_DIRECTIVE
        </button>
      </div>
    </div>
  );
}
