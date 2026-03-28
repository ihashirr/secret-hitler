import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ROLES, FACTIONS } from '../lib/constants';
import { Bot, Shield, Skull, Eye, EyeOff } from 'lucide-react';

const REVEAL_STATES = {
  IDLE: 'IDLE',
  AUTH_TAP: 'AUTH_TAP',
  DECRYPTING: 'DECRYPTING', // ████████ -> letters -> colors
  DETAILS: 'DETAILS',       // Directives fade in
  OPERATIVES: 'OPERATIVES', // List slides in
  CONFIRMED: 'CONFIRMED'    // Ack button appears
};

// Character decrypt component
const DecryptText = ({ text, isRevealing, isBlurred }) => {
  const characters = text.split('');
  
  if (isBlurred) {
    return (
      <span className="text-3xl sm:text-4xl font-sans font-black tracking-widest uppercase text-white/50 blur-[2px] transition-all">
        ••••••••
      </span>
    );
  }

  return (
    <span className="flex items-center justify-center gap-[2px]">
      {characters.map((char, i) => (
        <motion.span
          key={`${i}-${char}`}
          initial={isRevealing ? { opacity: 0, y: 4, filter: 'blur(4px)' } : { opacity: 1, y: 0, filter: 'blur(0px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.1, delay: isRevealing ? i * 0.04 : 0 }}
          className="inline-block text-3xl sm:text-4xl font-sans font-black uppercase tracking-widest text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]"
        >
          {char}
        </motion.span>
      ))}
    </span>
  );
};

export default function RoleReveal({ gameState, playerId, onReady }) {
  const [state, setState] = useState(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem(`revealed_${gameState.roomId}`)) {
      return REVEAL_STATES.CONFIRMED;
    }
    return REVEAL_STATES.IDLE;
  });
  
  const [privacyMode, setPrivacyMode] = useState(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem(`revealed_${gameState.roomId}`)) {
      return true; // Reconnecting: Default to privacy shield on
    }
    return false;
  });
  
  const myActualId = gameState?.myPlayerId || playerId;
  const me = gameState.players.find(p => p.id === myActualId);
  const visibleTeammates = gameState.players.filter((candidate) => candidate.id !== myActualId && Boolean(candidate.role));

  const roleTitle = me?.role === ROLES.LIBERAL ? 'Liberal' : me?.role === ROLES.FASCIST ? 'Fascist' : me?.role === ROLES.HITLER ? 'Hitler' : 'Unknown';
  const directiveText =
    me?.role === ROLES.LIBERAL
      ? 'You are protecting the republic. Read the room, build trust carefully, and secure five liberal policies or eliminate Hitler.'
      : me?.role === ROLES.HITLER
        ? 'You are Hitler. Stay deniable, let the room fight itself, and reach the chancellorship after three fascist policies.'
        : 'You are part of the fascist bloc. Protect Hitler, manipulate trust, and push the table toward a fascist victory.';
  
  const isFactionLiberal = me?.faction === FACTIONS.LIBERAL || me?.role === ROLES.LIBERAL;
  
  const themeColors = isFactionLiberal 
    ? 'border-2 border-cyan-400 shadow-[0_0_20px_rgba(0,240,255,0.3)] bg-cyan-950/20' 
    : 'border-2 border-red-500 shadow-[0_0_20px_rgba(255,0,60,0.3)] bg-red-950/20';

  // Sequence Master Timeline
  useEffect(() => {
    const timers = [];

    if (state === REVEAL_STATES.AUTH_TAP) {
      timers.push(window.setTimeout(() => setState(REVEAL_STATES.DECRYPTING), 150));
    } else if (state === REVEAL_STATES.DECRYPTING) {
      const decryptTime = (roleTitle.length * 40) + 300; // time to spell + ramp glow
      timers.push(window.setTimeout(() => setState(REVEAL_STATES.DETAILS), decryptTime));
    } else if (state === REVEAL_STATES.DETAILS) {
      timers.push(window.setTimeout(() => setState(REVEAL_STATES.OPERATIVES), 300));
    } else if (state === REVEAL_STATES.OPERATIVES) {
      const operativesTime = visibleTeammates.length * 40;
      timers.push(window.setTimeout(() => setState(REVEAL_STATES.CONFIRMED), operativesTime + 200));
    } else if (state === REVEAL_STATES.CONFIRMED) {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(`revealed_${gameState.roomId}`, 'true');
      }
    }

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [state, roleTitle.length, visibleTeammates.length, gameState.roomId]);

  const handleAuthTap = () => {
    if (state === REVEAL_STATES.IDLE) setState(REVEAL_STATES.AUTH_TAP);
  };
  
    if (me?.isReady) {
    return (
      <div className="min-h-[100svh] w-full flex items-center justify-center p-4 pt-[calc(4.5rem+env(safe-area-inset-top))] text-center">
        <div className="tactical-panel p-6 sm:p-8 text-center border-cyan-500/30 w-full max-w-sm">
          <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-400 animate-spin mx-auto mb-6 transform rotate-45" />
          <h2 className="text-lg sm:text-xl font-mono text-cyan-400 mb-2 uppercase tracking-[0.2em]">Room Is Synchronizing</h2>
          <p className="text-cyan-500/50 text-xs font-mono tracking-widest uppercase animate-pulse">Waiting for every phone to finish the briefing...</p>
        </div>
      </div>
    );
  }

  // Determine active component visibility
  const showCardContent = state !== REVEAL_STATES.IDLE && state !== REVEAL_STATES.AUTH_TAP;
  const showColors = state === REVEAL_STATES.DETAILS || state === REVEAL_STATES.OPERATIVES || state === REVEAL_STATES.CONFIRMED;

  return (
    <div className="min-h-[100svh] w-full flex flex-col px-4 sm:px-6 pb-4 sm:pb-6 pt-[calc(4.75rem+env(safe-area-inset-top))] bg-obsidian-900 overflow-hidden relative">
      
      {/* Background Grid Zoom Animation on Transition */}
      <motion.div 
        animate={{ scale: showCardContent ? 1.02 : 1 }}
        transition={{ duration: 2, ease: "easeOut" }}
        className="absolute inset-0 pointer-events-none board-grid opacity-10"
      />

      {/* Header */}
      <motion.div 
        animate={{ opacity: showCardContent ? 0.3 : 1 }}
        className="text-center mb-6 shrink-0 z-10"
      >
        <h2 className="text-xl sm:text-2xl font-mono text-cyan-400 tracking-[0.25em] font-black neon-text-cyan uppercase">Private Role Briefing</h2>
        <p className="text-cyan-500/60 text-[9px] mt-1 font-mono uppercase tracking-[0.4em] font-bold">Made for phones. Shield your screen before opening.</p>
      </motion.div>

      {/* Shared Active Container */}
      <div className="flex-1 overflow-y-auto min-h-0 flex flex-col items-center py-4 scrollbar-hide w-full z-10">
        
        <motion.div 
          animate={state === REVEAL_STATES.AUTH_TAP ? { scale: 0.96, boxShadow: "0 0 40px rgba(0,240,255,0.4)" } : { scale: 1 }}
          transition={{ duration: 0.15 }}
          className={`w-full max-w-[300px] sm:max-w-xs shrink-0 tactical-panel relative overflow-hidden transition-all duration-300
            ${showColors ? themeColors : 'border border-cyan-500/20 bg-black/60'}
            p-6 flex flex-col items-center justify-center min-h-[360px] cursor-default
          `}
          onClick={state === REVEAL_STATES.IDLE ? handleAuthTap : undefined}
          style={state === REVEAL_STATES.IDLE ? { cursor: 'pointer' } : {}}
        >
          
          <AnimatePresence mode="wait">
            
            {/* 1. IDLE & AUTH_TAP */}
            {(state === REVEAL_STATES.IDLE || state === REVEAL_STATES.AUTH_TAP) && (
              <motion.div 
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="flex flex-col items-center justify-center h-full w-full"
              >
                <div className="w-16 h-16 mb-6 border border-cyan-500/30 flex items-center justify-center transform rotate-45 group-hover:border-cyan-400 transition-colors">
                  <Eye size={30} className="text-cyan-500/50 group-hover:text-cyan-400 -rotate-45" />
                </div>
                <p className="text-cyan-500/80 text-[11px] uppercase tracking-[0.25em] font-mono font-bold animate-pulse">Open Your Private Briefing</p>
              </motion.div>
            )}

            {/* 2. REVEAL SEQUENCE (DECRYPT -> CONFIRMED) */}
            {showCardContent && (
              <motion.div 
                key="content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center w-full h-full relative"
              >
                {/* Privacy Toggle */}
                {(state === REVEAL_STATES.CONFIRMED || state === REVEAL_STATES.OPERATIVES) && (
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={() => setPrivacyMode(!privacyMode)}
                    className="absolute -top-2 -right-2 p-2 text-white/30 hover:text-white/70 transition-colors z-20"
                  >
                    {privacyMode ? <EyeOff size={16} /> : <Eye size={16} />}
                  </motion.button>
                )}

                {/* Role Icon */}
                <motion.div animate={{ opacity: showColors ? 1 : 0.2 }} transition={{ duration: 0.3 }} className="mb-3">
                  {isFactionLiberal 
                    ? <Shield size={40} className="text-cyan-400 drop-shadow-[0_0_15px_rgba(0,240,255,0.8)]" /> 
                    : <Skull size={40} className="text-red-500 drop-shadow-[0_0_15px_rgba(255,0,60,0.8)]" />
                  }
                </motion.div>

                <p className="text-white/50 text-[9px] font-mono uppercase tracking-[0.2em] mb-2 font-bold text-center">
                  Your Role:
                </p>
                
                <div className="h-[40px] flex items-center justify-center mb-6">
                  {state === REVEAL_STATES.DECRYPTING ? (
                    <DecryptText text={roleTitle} isRevealing={true} isBlurred={false} />
                  ) : (
                    <DecryptText text={roleTitle} isRevealing={false} isBlurred={privacyMode} />
                  )}
                </div>

                {/* DETAILS EXPANDED */}
                <AnimatePresence>
                  {(state === REVEAL_STATES.DETAILS || state === REVEAL_STATES.OPERATIVES || state === REVEAL_STATES.CONFIRMED) && !privacyMode && (
                     <motion.div 
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                        className="bg-black/60 w-full p-4 border border-white/10 mb-4 font-mono text-[10px] sm:text-[11px] leading-relaxed text-white/80 tracking-wide text-left shadow-inner"
                     >
                       <span className={`font-black block mb-1 text-[9px] tracking-widest ${isFactionLiberal ? 'text-cyan-400/60' : 'text-red-400/60'}`}>DIRECTIVE:</span>
                       {directiveText}
                     </motion.div>
                  )}
                </AnimatePresence>

                {/* OPERATIVES SLIDE IN */}
                <AnimatePresence>
                  {(state === REVEAL_STATES.OPERATIVES || state === REVEAL_STATES.CONFIRMED) && visibleTeammates.length > 0 && !privacyMode && (
                    <motion.div 
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="w-full text-left"
                    >
                      <p className="text-[8px] sm:text-[9px] text-white/40 font-mono uppercase tracking-[0.3em] mb-2 border-b border-white/10 pb-1 font-bold">Known Allies</p>
                      <div className="flex flex-col gap-[2px]">
                        {visibleTeammates.map((t, index) => (
                           <motion.div 
                             key={t.id} 
                             initial={{ opacity: 0, x: -15 }}
                             animate={{ opacity: 1, x: 0 }}
                             transition={{ delay: index * 0.04, type: "spring", stiffness: 300, damping: 20 }}
                             className="flex justify-between items-center bg-black/40 px-3 py-2 border-l-2 border-red-500/40 text-[10px] font-mono"
                           >
                             <div className="flex min-w-0 items-center gap-2">
                               <span className="truncate font-bold text-white/90">{t.name}</span>
                               {t.isBot && (
                                 <span className="inline-flex items-center gap-1 rounded-full border border-amber-300/20 bg-amber-400/10 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-[0.14em] text-amber-100">
                                   <Bot size={9} />
                                   Bot
                                 </span>
                               )}
                             </div>
                             <span className="shrink-0 ml-2 font-black text-red-500">[{t.role === ROLES.HITLER ? 'HITLER' : 'FASCIST'}]</span>
                           </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* CONFIRMED: ACKNOWLEDGE CTA */}
      <div className="flex justify-center mt-auto pt-2 shrink-0 px-2 pb-2 h-[80px]">
        <AnimatePresence>
          {state === REVEAL_STATES.CONFIRMED && (
            <motion.button
              key="ack-btn"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1, filter: ['brightness(1)', 'brightness(1.5)', 'brightness(1)'] }}
              transition={{ duration: 0.4, filter: { duration: 0.8, ease: "easeOut" } }}
              whileTap={{ scale: 0.985 }}
              onClick={onReady}
              className="w-full max-w-[300px] h-[64px] bg-cyan-400 text-black font-mono font-black uppercase tracking-[0.3em] shadow-[0_0_20px_rgba(0,240,255,0.4)] text-[11px] sm:text-xs flex items-center justify-center transition-all z-20"
            >
              <span className="opacity-60 mr-2">{'>'}</span> I UNDERSTAND
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
