import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Crown, AlertTriangle, Copy, Check, Hash } from 'lucide-react';

export default function Lobby({ gameState, playerId, onStart, onExit }) {
  const me = gameState.players.find(p => p.id === playerId);
  const isHost = me?.isHost;
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const canStart = gameState.players.length >= 5 && gameState.players.length <= 10;

  const handleCopy = async (text, type) => {
    const fallbackCopy = (t) => {
      const textArea = document.createElement("textarea");
      textArea.value = t;
      textArea.style.position = "fixed";
      textArea.style.left = "-9999px";
      textArea.style.top = "0";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try { document.execCommand('copy'); } catch (err) { console.error('Fallback copy failed', err); }
      document.body.removeChild(textArea);
    };

    if (navigator.clipboard) {
      try { await navigator.clipboard.writeText(text); } catch (err) { fallbackCopy(text); }
    } else {
      fallbackCopy(text);
    }

    if (type === 'link') {
      setCopiedLink(true); setTimeout(() => setCopiedLink(false), 2000);
    } else {
      setCopiedCode(true); setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  return (
    // padding-top is big to push content below the fixed header
    <div className="min-h-[100dvh] w-full flex flex-col p-4 sm:p-6 pt-16 sm:pt-14">
      {/* Room Header */}
      <div className="text-center mb-6">
        <p className="text-cyan-500/60 font-mono text-[10px] sm:text-xs tracking-widest uppercase mb-2">Secure Link Established</p>
        <h2 className="text-4xl sm:text-5xl font-mono tracking-[0.2em] text-white font-bold neon-text-cyan mb-4">
          {gameState.roomId}
        </h2>
        <div className="flex flex-col xs:flex-row justify-center items-center gap-2">
          <button
            onClick={() => handleCopy(`${window.location.origin}?room=${gameState.roomId}`, 'link')}
            className="w-full xs:w-auto flex items-center justify-center gap-2 bg-cyan-900/30 hover:bg-cyan-800/50 transition-colors px-4 py-2.5 border border-cyan-500/50 text-xs font-bold tracking-wider uppercase shadow-[0_0_15px_rgba(0,240,255,0.1)]"
          >
            {copiedLink ? <Check size={14} className="text-cyan-400" /> : <Copy size={14} className="text-cyan-400" />}
            {copiedLink ? <span className="text-cyan-400">Link Copied!</span> : <span className="text-cyan-50">Copy Link</span>}
          </button>
          <button
            onClick={() => handleCopy(gameState.roomId, 'code')}
            className="w-full xs:w-auto flex items-center justify-center gap-2 bg-cyan-900/10 hover:bg-cyan-800/30 transition-colors px-4 py-2.5 border border-cyan-500/30 text-xs font-bold tracking-wider uppercase"
          >
            {copiedCode ? <Check size={14} className="text-cyan-400" /> : <Hash size={14} className="text-cyan-400" />}
            {copiedCode ? <span className="text-cyan-400">Code Copied!</span> : <span className="text-cyan-50">Copy Code</span>}
          </button>
        </div>
      </div>

      {/* Player List */}
      <div className="tactical-panel p-4 sm:p-6 flex-1 flex flex-col overflow-hidden relative">
        <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-cyan-500/50" />
        <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-cyan-500/50" />
        <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-cyan-500/50" />
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-cyan-500/50" />

        <div className="flex items-center justify-between mb-4 border-b border-cyan-500/20 pb-3">
          <h3 className="text-sm sm:text-lg font-mono tracking-widest text-cyan-400 uppercase">Active Operatives</h3>
          <span className="text-xs sm:text-sm text-white/60 bg-white/5 px-2 sm:px-3 py-1 flex items-center gap-1.5">
            <Users size={13} /> {gameState.players.length}/10
          </span>
        </div>

        <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2">
          {gameState.players.map((p, i) => (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.07 }}
              key={p.id}
              className={`p-2.5 sm:p-3 flex items-center justify-between border-l-4 ${p.id === playerId ? 'bg-cyan-900/20 border-cyan-400' : 'bg-black/40 border-cyan-900/50'}`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="h-7 w-7 sm:h-8 sm:w-8 shrink-0 bg-cyan-950 flex items-center justify-center border border-cyan-500/30">
                  <span className="text-cyan-400 font-mono font-bold text-xs sm:text-sm">{p.name.charAt(0).toUpperCase()}</span>
                </div>
                <span className="font-mono text-white tracking-wider uppercase text-xs sm:text-sm truncate">{p.name}</span>
                {p.id === playerId && (
                  <span className="shrink-0 text-[9px] text-cyan-400 font-mono uppercase tracking-widest bg-cyan-900/40 px-1.5 py-0.5 border border-cyan-500/30">You</span>
                )}
              </div>
              {p.isHost && <Crown size={14} className="text-cyan-500 drop-shadow-[0_0_8px_rgba(0,240,255,0.8)] shrink-0" />}
            </motion.div>
          ))}
          {gameState.players.length === 0 && (
            <div className="text-center text-white/30 py-8 italic text-sm">Waiting for players...</div>
          )}
        </div>
      </div>

      {/* Start / Waiting */}
      <div className="mt-4">
        {isHost ? (
          <div className="flex flex-col gap-3">
            {!canStart && (
              <div className="flex items-center justify-center gap-2 text-crimson-neon text-xs mb-1 bg-red-900/20 border border-red-500/30 py-2.5 font-mono uppercase tracking-widest">
                <AlertTriangle size={13} /> Requires 5–10 players
              </div>
            )}
            <button
              onClick={onStart}
              disabled={!canStart}
              className="w-full bg-cyan-600 text-white font-mono font-bold uppercase tracking-[0.15em] p-4 border border-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.3)] hover:shadow-[0_0_25px_rgba(0,240,255,0.5)] hover:bg-cyan-500 transition-all disabled:opacity-30 disabled:shadow-none disabled:border-gray-500 disabled:bg-gray-800 disabled:text-gray-500 text-sm"
            >
              Initiate Protocol
            </button>
          </div>
        ) : (
          <div className="w-full bg-cyan-900/10 border border-cyan-500/20 text-center p-4 text-cyan-500/50 animate-pulse uppercase tracking-[0.15em] text-xs sm:text-sm font-mono font-bold">
            Awaiting host signal...
          </div>
        )}
      </div>
    </div>
  );
}
