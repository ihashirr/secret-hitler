import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Crown, Check, Share, Copy } from 'lucide-react';

export default function Lobby({ gameState, playerId, onStart, onExit }) {
  const me = gameState.players.find(p => p.id === playerId);
  const isHost = me?.isHost;
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const canStart = gameState.players.length >= 5 && gameState.players.length <= 10;
  const neededPlayers = Math.max(0, 5 - gameState.players.length);
  
  // Heuristic: Show enough ghost slots to reach minimum 5, or show 2 if above 5 but not full.
  const ghostSlotCount = Math.max(
    5 - gameState.players.length,
    Math.min(2, 10 - gameState.players.length)
  );

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
    <div className="h-[100dvh] w-full flex flex-col p-4 sm:p-6 pt-16 sm:pt-14 relative overflow-hidden">
      
      {/* 1. Structural Top Area (Compact Code Container) */}
      <motion.div 
        className="text-center mb-4 cursor-pointer group relative overflow-hidden py-2"
        onClick={() => handleCopy(gameState.roomId, 'code')}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.96 }}
      >
        <h2 className="text-6xl sm:text-7xl font-mono tracking-[0.2em] text-white font-bold neon-text-cyan mb-1 select-none transition-colors group-hover:text-cyan-300 drop-shadow-[0_0_15px_rgba(0,240,255,0.4)] relative z-10">
          <AnimatePresence mode="popLayout">
            {copiedCode ? (
               <motion.span key="copied-code" initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="text-cyan-300 inline-block drop-shadow-[0_0_20px_rgba(0,240,255,1)]">
                 COPIED
               </motion.span>
            ) : (
               <motion.span key="room-code" initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="inline-block">
                 {gameState.roomId}
               </motion.span>
            )}
          </AnimatePresence>
        </h2>
        
        {/* System Flash Overlay */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileTap={{ opacity: [0, 0.6, 0] }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 bg-cyan-300/40 blur-2xl pointer-events-none z-0"
        />

        <div className="text-cyan-500/60 font-mono text-[10px] sm:text-xs tracking-widest uppercase flex items-center justify-center h-4 transition-colors group-hover:text-cyan-400 relative z-10">
          <AnimatePresence mode="wait">
            {copiedCode ? (
               <motion.span key="copied" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="text-cyan-400 flex items-center gap-1 font-bold">
                 <Check size={12} /> CODE COPIED
               </motion.span>
            ) : (
               <motion.span key="copy" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1.5 opacity-60 group-hover:opacity-100">
                 <Copy size={10} className="hidden sm:inline" /> TAP TO COPY
               </motion.span>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* 2. Primary Interaction Area (Player Roster) - FIXED Scroll Zone */}
      <div className="flex-1 flex flex-col w-full max-w-sm mx-auto overflow-hidden min-h-0">
        {/* Roster Header */}
        <div className="flex items-center justify-between mb-3 border-b border-cyan-500/20 pb-2 overflow-hidden shrink-0">
          <h3 className="text-xs sm:text-sm font-mono tracking-widest text-cyan-400 uppercase flex items-center gap-2">
            <Users size={14} /> 
            <span className="flex items-center">
              <div className="relative w-4 h-5 flex items-center justify-center">
                <AnimatePresence mode="popLayout">
                  <motion.span
                    key={gameState.players.length}
                    initial={{ y: 15, opacity: 0, filter: 'blur(4px)' }}
                    animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
                    exit={{ y: -15, opacity: 0, filter: 'blur(4px)' }}
                    className="absolute text-cyan-300 font-bold drop-shadow-[0_0_8px_rgba(0,240,255,0.8)]"
                  >
                    {gameState.players.length}
                  </motion.span>
                </AnimatePresence>
              </div>
              <span className="ml-1"> / 10 PLAYERS</span>
            </span>
          </h3>
        </div>

        {/* Dynamic Roster Container - INTERNAL SCROLL BAR */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden pr-1.5 flex flex-col gap-1.5 scrollbar-thin scrollbar-thumb-cyan-900/40 scrollbar-track-transparent pb-44">
          <AnimatePresence>
            {/* Connected Players */}
            {gameState.players.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, x: -30, backgroundColor: 'rgba(0, 240, 255, 0.8)' }}
                animate={{ opacity: 1, x: 0, backgroundColor: p.id === playerId ? 'rgba(8, 51, 68, 0.3)' : 'rgba(0, 0, 0, 0.4)' }}
                transition={{ 
                  delay: i * 0.05, 
                  x: { type: 'spring', stiffness: 400, damping: 30 },
                  backgroundColor: { duration: 0.6, ease: 'easeOut' }
                }}
                className={`p-3 sm:p-4 flex items-center justify-between border-l-4 ${p.id === playerId ? 'border-cyan-400' : 'border-cyan-900/50'}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`font-mono tracking-widest uppercase text-xs sm:text-sm truncate flex items-center gap-2 ${p.id === playerId ? 'text-white font-bold' : 'text-white/80'}`}>
                    {p.name} 
                    {p.id === playerId && <span className="text-cyan-400 opacity-60 text-[9px] border border-cyan-500/30 bg-cyan-900/40 px-1 py-0.5">(YOU)</span>}
                  </span>
                </div>
                {p.isHost && (
                  <motion.div
                    animate={{ 
                      scale: [1, 1.2, 1],
                      filter: [
                        'drop-shadow(0 0 4px rgba(0, 240, 255, 0.3))',
                        'drop-shadow(0 0 12px rgba(0, 240, 255, 0.8))',
                        'drop-shadow(0 0 4px rgba(0, 240, 255, 0.3))'
                      ]
                    }}
                    transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                  >
                    <Crown size={14} className="text-cyan-400 shrink-0" />
                  </motion.div>
                )}
              </motion.div>
            ))}

            {/* Ghost Slots (To make room feel alive and anticipating) */}
            {Array.from({ length: ghostSlotCount }).map((_, i) => (
              <motion.div
                key={`ghost-${i}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + (i * 0.05) }}
                className="p-3 flex items-center justify-between border-l-4 bg-transparent border-dashed border-cyan-900/20"
              >
                <motion.div 
                  animate={{ opacity: [0.3, 0.6, 0.3] }}
                  transition={{ repeat: Infinity, duration: 2.5 + i * 0.2, ease: "easeInOut" }}
                  className="flex items-center gap-3 w-full"
                >
                  <div className="w-5 h-5 flex items-center justify-center border border-dashed border-cyan-500/20 text-[10px] text-cyan-500/40">
                     <span className="font-mono">+</span>
                  </div>
                  <div className="flex items-baseline gap-1 font-mono tracking-widest uppercase text-[9px] text-cyan-500/40 italic">
                    SCANNING FOR OPERATIVES
                    <motion.span
                      animate={{ opacity: [0, 1, 0] }}
                      transition={{ repeat: Infinity, duration: 1, times: [0, 0.5, 1] }}
                    >.</motion.span>
                    <motion.span
                      animate={{ opacity: [0, 1, 0] }}
                      transition={{ repeat: Infinity, duration: 1, delay: 0.2, times: [0, 0.5, 1] }}
                    >.</motion.span>
                    <motion.span
                      animate={{ opacity: [0, 1, 0] }}
                      transition={{ repeat: Infinity, duration: 1, delay: 0.4, times: [0, 0.5, 1] }}
                    >.</motion.span>
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* 3. Sticky Bottom UI (The Action Base) */}
      <div className="fixed bottom-0 inset-x-0 bg-gradient-to-t from-[#010305] via-[#010305] to-transparent z-50 flex flex-col justify-end pointer-events-none pb-8 pt-16 px-4 sm:px-6">
        <div className="max-w-sm mx-auto w-full flex flex-col gap-0 pointer-events-auto">
          
          {/* Action Group Container */}
          <div className="flex flex-col border border-cyan-500/10 bg-black/40 backdrop-blur-sm overflow-hidden rounded-sm shadow-[0_40px_80px_rgba(0,0,0,0.9)]">
            
            {/* A. Contextual Primary Action */}
            {isHost ? (
              <motion.button
                whileTap={{ scale: 0.985 }}
                animate={canStart ? { 
                  boxShadow: [
                    'inset 0 0 15px rgba(255, 255, 255, 0.1), 0 0 20px rgba(0, 240, 255, 0.2)',
                    'inset 0 0 25px rgba(255, 255, 255, 0.2), 0 0 40px rgba(0, 240, 255, 0.4)',
                    'inset 0 0 15px rgba(255, 255, 255, 0.1), 0 0 20px rgba(0, 240, 255, 0.2)'
                  ],
                } : {}}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                onClick={onStart}
                disabled={!canStart}
                className={`relative w-full overflow-hidden text-center h-[90px] font-mono transition-all duration-300 flex flex-col justify-center items-center px-6 border-b
                  ${canStart 
                    ? 'bg-cyan-400 text-black border-white/40 shadow-[0_0_40px_rgba(34,211,238,0.4)] z-20' 
                    : 'bg-black/80 text-cyan-500/30 border-cyan-500/20 z-10'}`}
              >
                {/* Tactical Inner Bevel */}
                <div className={`absolute inset-[1px] border ${canStart ? 'border-white/20' : 'border-cyan-500/5'} pointer-events-none`} />
                
                <span className={`relative z-10 text-[13.5px] tracking-[0.4em] font-black uppercase drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)] ${canStart ? 'text-black' : 'text-cyan-400/80'}`}>
                  {canStart ? 'INITIATE PROTOCOL' : 'INITIATE PROTOCOL'}
                </span>
                
                {!canStart && (
                  <motion.span 
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ repeat: Infinity, duration: 2.5 }}
                    className="relative z-10 block mt-1.5 text-[10.5px] tracking-widest font-bold text-cyan-400/60 uppercase"
                  >
                    NEED {neededPlayers} MORE OPERATIVES
                  </motion.span>
                )}

                {canStart && (
                  <motion.div 
                    initial={{ x: '-100%', skewX: -20 }}
                    animate={{ x: '200%', skewX: -20 }}
                    transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                    className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none"
                  />
                )}
                
                {/* Intense Tap Feedback Flash */}
                <motion.div
                  initial={{ opacity: 0 }}
                  whileTap={{ opacity: [0, 0.8, 0] }}
                  transition={{ duration: 0.15 }}
                  className="absolute inset-0 bg-white pointer-events-none"
                />
              </motion.button>
            ) : (
              <div className="w-full bg-black/60 backdrop-blur-md h-[90px] flex items-center justify-center flex-col gap-1.5 text-cyan-500/40 uppercase tracking-[0.3em] text-[10px] font-mono font-black border-b border-cyan-500/10">
                <div className="flex items-center gap-2">
                  <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.5 }} className="w-1.5 h-1.5 bg-cyan-500 rounded-full shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
                  AWAITING HOST SIGNAL
                </div>
                <div className="w-32 h-[2px] bg-cyan-900/40 rounded-full overflow-hidden">
                  <motion.div 
                     animate={{ x: ['-100%', '100%'] }} 
                     transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
                     className="w-full h-full bg-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.5)]"
                  />
                </div>
              </div>
            )}

            {/* B. Secondary Action (Share) */}
            <motion.button
              whileTap={{ scale: 0.985 }}
              onClick={() => handleCopy(`${window.location.origin}?room=${gameState.roomId}`, 'link')}
              className={`relative w-full h-[60px] flex items-center justify-center gap-3 px-6 text-[9.5px] font-mono font-bold tracking-[0.3em] uppercase transition-all border-t border-cyan-500/10
                ${copiedLink 
                  ? 'text-cyan-300 bg-cyan-950/40' 
                  : 'text-cyan-500/40 bg-transparent hover:bg-white/5 hover:text-cyan-400'}`}
            >
              <div className="absolute inset-[1px] border border-white/5 pointer-events-none" />
              
              <Share size={11} className={copiedLink ? 'hidden' : 'opacity-50 group-hover:opacity-100'} />
              {copiedLink ? <Check size={13} className="text-cyan-400" animate={{ scale: [0.8, 1.2, 1] }} /> : null}
              {copiedLink ? 'SENT_TO_CLIPBOARD' : 'BROADCAST_ACCESS_LINK'}
              
              {/* Tap Feedback Ripple */}
              <motion.div
                initial={{ opacity: 0 }}
                whileTap={{ opacity: [0, 0.4, 0] }}
                transition={{ duration: 0.15 }}
                className="absolute inset-0 bg-cyan-400 pointer-events-none"
              />
            </motion.button>
          </div>

        </div>
      </div>
    </div>
  );
}
