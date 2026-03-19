import React, { useState } from 'react';
import { AlertTriangle, ShieldAlert, LogOut, Terminal, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function GlobalControls({ gameState, playerId, onReset, onWipe, onExit }) {
  const me = gameState?.players?.find(p => p.id === playerId);
  const isHost = me?.isHost;
  const [expanded, setExpanded] = useState(false);

  if (!me) return null;

  return (
    <motion.div
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={`fixed top-0 left-0 right-0 z-[200] bg-black/90 backdrop-blur-md shadow-lg border-b ${isHost ? 'border-red-500/30' : 'border-cyan-500/10'}`}
    >
      {/* Main bar */}
      <div className="flex items-center justify-between px-3 py-2 gap-2">
        {/* Left: Identity */}
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          {isHost ? <ShieldAlert size={12} className="text-red-500 shrink-0" /> : <Terminal size={12} className="text-cyan-500/50 shrink-0" />}
          <span className={`text-[9px] font-mono font-bold uppercase tracking-widest truncate ${isHost ? 'text-red-400' : 'text-cyan-500/50'}`}>
            {me.name}<span className="text-white/20">@</span>{gameState.roomId}
          </span>
          <span className={`hidden sm:inline text-[9px] font-mono px-1.5 py-0.5 border shrink-0 ${isHost ? 'text-red-500/70 border-red-500/20 bg-red-950/30' : 'text-cyan-500/40 border-cyan-500/10 bg-cyan-900/10'}`}>
            {isHost ? 'HOST' : 'OPERATIVE'}
          </span>
        </div>

        {/* Right: Action Buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* On md+ screens show all buttons inline */}
          {isHost && (
            <>
              <button
                onClick={() => {
                  const password = prompt("NUCLEAR OPTION: Enter the override password to WIPE ALL DATA:");
                  if (password === "ECLIPSE") { onWipe(); }
                  else if (password !== null) { alert("INCORRECT AUTHENTICATION. ACCESS DENIED."); }
                }}
                className="hidden sm:flex items-center gap-1.5 px-2 py-1 bg-red-950/80 border border-red-600/70 text-red-400 hover:bg-red-600 hover:text-white transition-all text-[9px] font-mono font-bold uppercase tracking-widest"
              >
                <AlertTriangle size={11} />
                WIPE
              </button>

              <button
                onClick={() => {
                  if (confirm("CRITICAL: This will PERMANENTLY DELETE this session and kick all players. Proceed?")) { onReset(); }
                }}
                className="hidden sm:flex items-center gap-1.5 px-2 py-1 bg-red-900/20 border border-red-500/40 text-red-500 hover:bg-red-500 hover:text-white transition-all text-[9px] font-mono font-bold uppercase tracking-widest"
              >
                <ShieldAlert size={11} />
                DESTROY
              </button>
            </>
          )}

          <button
            onClick={onExit}
            className="flex items-center gap-1.5 px-2 py-1 bg-black/40 border border-white/10 text-white/40 hover:text-red-500 hover:border-red-500/30 transition-all text-[9px] font-mono font-bold uppercase tracking-widest"
          >
            <LogOut size={11} />
            <span className="hidden xs:inline">ABORT</span>
          </button>

          {/* Mobile expand button for host */}
          {isHost && (
            <button
              onClick={() => setExpanded(v => !v)}
              className="sm:hidden flex items-center justify-center w-7 h-7 border border-red-500/40 bg-red-950/30 text-red-400"
            >
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          )}
        </div>
      </div>

      {/* Mobile expanded host controls */}
      <AnimatePresence>
        {expanded && isHost && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden sm:hidden border-t border-red-500/20"
          >
            <div className="flex gap-2 p-3">
              <button
                onClick={() => {
                  setExpanded(false);
                  const password = prompt("NUCLEAR OPTION: Enter override password to WIPE ALL DATA:");
                  if (password === "ECLIPSE") { onWipe(); }
                  else if (password !== null) { alert("INCORRECT AUTHENTICATION. ACCESS DENIED."); }
                }}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-red-950/80 border border-red-600/70 text-red-400 hover:bg-red-600 hover:text-white transition-all text-[10px] font-mono font-bold uppercase tracking-widest"
              >
                <AlertTriangle size={13} /> WIPE_SYSTEM
              </button>

              <button
                onClick={() => {
                  setExpanded(false);
                  if (confirm("CRITICAL: This will PERMANENTLY DELETE this session. Proceed?")) { onReset(); }
                }}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-red-900/20 border border-red-500/40 text-red-500 hover:bg-red-500 hover:text-white transition-all text-[10px] font-mono font-bold uppercase tracking-widest"
              >
                <ShieldAlert size={13} /> DESTROY
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
