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
          <div className="flex flex-col border border-cyan-500/30 bg-black/80 backdrop-blur-md overflow-hidden rounded-sm shadow-[0_20px_50px_rgba(0,0,0,1)]">
            
            {/* A. Contextual Primary Action */}
            {isHost ? (
              <motion.button
                whileTap={{ scale: 0.985 }}
                animate={canStart ? { 
                  scale: [0.98, 1.02, 1],
                  transition: { duration: 0.4, ease: "easeOut" }
                } : { opacity: 0.8 }}
                onClick={onStart}
                disabled={!canStart}
                className={`relative w-full py-4 font-mono transition-all duration-500 flex flex-col justify-center items-center px-6 border
                  ${canStart 
                    ? 'bg-cyan-400 text-black border-cyan-400 shadow-[inset_0_0_10px_rgba(255,255,255,0.4),0_0_30px_rgba(0,240,255,0.5)] z-10' 
                    : 'bg-[#00f0ff]/5 border-cyan-500/30'}`}
              >
                <span className={`relative z-10 text-[13px] sm:text-[14px] tracking-[0.25em] font-black uppercase transition-colors duration-500 ${canStart ? 'text-black' : 'text-cyan-300'}`}>
                  INITIATE PROTOCOL
                </span>
                
                <div className="relative z-10 mt-0.5 h-3.5 flex items-center justify-center overflow-hidden">
                  <AnimatePresence mode="popLayout">
                    {canStart ? (
                      <motion.span 
                        key="ready"
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1, textShadow: ['0 0 0px #000', '0 0 10px rgba(0,0,0,0.5)', '0 0 0px #000'] }}
                        transition={{ duration: 0.4 }}
                        className="text-[10px] tracking-[0.3em] font-black text-black/80 uppercase block"
                      >
                        [ READY TO INITIATE ]
                      </motion.span>
                    ) : (
                      <motion.span 
                        key="waiting"
                        initial={{ y: -10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -10, opacity: 0 }}
                        className="text-[10px] tracking-widest font-bold text-cyan-500 uppercase block"
                      >
                        NEED {neededPlayers} MORE OPERATIVES
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>

                {/* Simple Tap Flash */}
                <motion.div
                  initial={{ opacity: 0 }}
                  whileTap={{ opacity: [0, 0.2, 0] }}
                  transition={{ duration: 0.1 }}
                  className="absolute inset-0 bg-white pointer-events-none"
                />
              </motion.button>
            ) : (
              <div className={`w-full backdrop-blur-md py-4 flex items-center justify-center flex-col gap-1.5 uppercase tracking-[0.2em] text-[10px] font-mono font-black transition-colors duration-500 ${canStart ? 'bg-cyan-950/40 text-cyan-400' : 'bg-black/60 text-cyan-500/30'}`}>
                <div className="flex items-center gap-2">
                  <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.5 }} className={`w-1.5 h-1.5 rounded-full ${canStart ? 'bg-cyan-400' : 'bg-cyan-700'}`} />
                  AWAITING HOST SIGNAL
                </div>
                <div className="w-24 h-[1px] bg-cyan-900/20 rounded-full overflow-hidden mt-1">
                  <motion.div 
                     animate={{ x: ['-100%', '100%'] }} 
                     transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                     className={`w-full h-full ${canStart ? 'bg-cyan-400' : 'bg-cyan-500/20'}`}
                  />
                </div>
              </div>
            )}

            {/* B. Secondary Action (Share) */}
            <AnimatePresence>
              <motion.button
                layout
                whileTap={{ scale: 0.985 }}
                onClick={() => handleCopy(`${window.location.origin}?room=${gameState.roomId}`, 'link')}
                className={`relative w-full h-[60px] flex items-center justify-center gap-2.5 px-6 text-[12px] font-mono font-bold tracking-[0.25em] uppercase transition-all
                  ${copiedLink 
                    ? 'text-cyan-500 bg-cyan-950/40' 
                    : 'text-cyan-600 bg-transparent hover:text-cyan-300 hover:bg-cyan-950/20'}
                  ${canStart && !copiedLink ? 'opacity-50 hover:opacity-100' : ''}
                `}
              >
                <Share size={20} className={copiedLink ? 'hidden' : 'opacity-70'} />
                {copiedLink ? <Check size={20} className="text-cyan-400" /> : null}
                <span className="mt-[2px]">{copiedLink ? 'COPIED_TO_CLIPBOARD' : 'SHARE_ACCESS_CODE'}</span>
                
                <motion.div
                  initial={{ opacity: 0 }}
                  whileTap={{ opacity: [0, 0.15, 0] }}
                  className="absolute inset-0 bg-cyan-400 pointer-events-none"
                />
              </motion.button>
            </AnimatePresence>
          </div>

        </div>
      </div>
    </div>
  );
}
