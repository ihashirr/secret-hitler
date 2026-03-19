import React from 'react';
import { AlertTriangle, ShieldAlert, LogOut, Terminal } from 'lucide-react';
import { motion } from 'framer-motion';

export default function GlobalControls({ gameState, playerId, onReset, onWipe, onExit }) {
  const me = gameState?.players?.find(p => p.id === playerId);
  const isHost = me?.isHost;

  if (!me) return null;

  return (
    <motion.div 
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={`fixed top-0 left-0 right-0 z-[100] bg-black/80 backdrop-blur-md px-6 py-2 flex items-center justify-between shadow-lg border-b ${isHost ? 'border-red-500/30' : 'border-cyan-500/10'}`}
    >
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          {isHost ? <ShieldAlert size={14} className="text-red-500" /> : <Terminal size={14} className="text-cyan-500/50" />}
          <span className={`text-[10px] font-mono font-bold uppercase tracking-[0.2em] ${isHost ? 'text-red-500' : 'text-cyan-500/50'}`}>
            {isHost ? 'HOST_AUTH_ACTIVE:' : 'OPERATIVE_LOGGED:'}
          </span>
          <span className={`text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 border ${isHost ? 'text-white/80 bg-red-950/40 border-red-500/20' : 'text-cyan-400/60 bg-cyan-900/10 border-cyan-500/10'}`}>
            {me.name}@{gameState.roomId}
          </span>
        </div>
        
        <div className="h-4 w-px bg-red-500/20" />
        
        <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">PHASE:</span>
            <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest">
               {gameState.phase}
            </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {isHost && (
          <>
            <button 
              onClick={() => {
                const password = prompt("NUCLEAR OPTION: This will delete ALL rooms, ALL players, and ALL logs. Enter the override password to proceed:");
                if (password === "ECLIPSE") {
                  onWipe();
                } else if (password !== null) {
                  alert("INCORRECT AUTHENTICATION. ACCESS DENIED.");
                }
              }}
              className="flex items-center gap-2 px-3 py-1 bg-red-950/80 border border-red-600 text-red-400 hover:bg-red-600 hover:text-white transition-all text-[9px] font-mono font-bold uppercase tracking-[0.2em]"
            >
              <AlertTriangle size={14} /> 
              WIPE_SYSTEM
            </button>

            <button 
              onClick={() => {
                if (confirm("CRITICAL: This will PERMANENTLY DELETE this session and kick all players. Proceed?")) {
                  onReset();
                }
              }}
              className="flex items-center gap-2 px-3 py-1 bg-red-900/20 border border-red-500/40 text-red-500 hover:bg-red-500 hover:text-white transition-all text-[9px] font-mono font-bold uppercase tracking-[0.2em]"
            >
              <ShieldAlert size={14} /> 
              DESTROY_SESSION
            </button>
          </>
        )}

        <button 
          onClick={onExit}
          className="flex items-center gap-2 px-3 py-1 bg-black/40 border border-white/10 text-white/40 hover:text-red-500 transition-all text-[9px] font-mono font-bold uppercase tracking-[0.2em]"
        >
          <LogOut size={12} />
          {isHost ? 'ABORT_ALL' : 'ABORT_MISSION'}
        </button>
      </div>
    </motion.div>
  );
}
