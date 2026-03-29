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
      <div className="flex h-full min-h-0 w-full items-center justify-center px-3 pb-[calc(var(--app-safe-bottom)+1rem)] pt-[calc(var(--app-header-offset)+16px)] text-center sm:px-4">
        <div className="tactical-panel w-full max-w-sm min-w-0 border-cyan-500/30 p-6 text-center sm:p-8">
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
  const dossierAccentBar = isFactionLiberal
    ? 'from-cyan-300 via-cyan-400 to-blue-500'
    : 'from-red-400 via-red-500 to-red-700';
  const dossierFrameClass = showColors
    ? themeColors
    : 'border border-cyan-500/18 shadow-[0_0_18px_rgba(0,240,255,0.14)]';
  const dossierOffsetY =
    state === REVEAL_STATES.IDLE
      ? 154
      : state === REVEAL_STATES.AUTH_TAP
        ? 118
        : state === REVEAL_STATES.DECRYPTING
          ? 58
          : state === REVEAL_STATES.DETAILS
            ? 22
            : state === REVEAL_STATES.OPERATIVES
              ? 10
              : 0;
  const dossierOpacity =
    state === REVEAL_STATES.IDLE ? 0.16 : state === REVEAL_STATES.AUTH_TAP ? 0.48 : 1;
  const flapRotation =
    state === REVEAL_STATES.IDLE ? 0 : state === REVEAL_STATES.AUTH_TAP ? -18 : -162;
  const sealHidden = state !== REVEAL_STATES.IDLE && state !== REVEAL_STATES.AUTH_TAP;
  const dossierStatusLabel =
    state === REVEAL_STATES.IDLE
      ? 'Tap To Unseal'
      : state === REVEAL_STATES.AUTH_TAP
        ? 'Seal Breaking'
        : state === REVEAL_STATES.DECRYPTING
          ? 'Decrypting'
          : 'Role Dossier';

  return (
    <div className="relative flex h-full min-h-0 w-full flex-col overflow-hidden bg-obsidian-900 px-3 pb-[calc(var(--app-safe-bottom)+0.5rem)] pt-[calc(var(--app-header-offset)+20px)] sm:px-6">
      
      {/* Background Grid Zoom Animation on Transition */}
      <motion.div 
        animate={{ scale: showCardContent ? 1.02 : 1 }}
        transition={{ duration: 2, ease: "easeOut" }}
        className="absolute inset-0 pointer-events-none board-grid opacity-10"
      />

      {/* Header */}
      <motion.div 
        animate={{ opacity: showCardContent ? 0.3 : 1 }}
        className="z-10 mb-6 shrink-0 text-center"
      >
        <h2 className="text-lg font-mono font-black uppercase tracking-[0.18em] text-cyan-400 neon-text-cyan sm:text-2xl sm:tracking-[0.25em]">Private Role Briefing</h2>
        <p className="mt-1 text-[9px] font-mono font-bold uppercase tracking-[0.28em] text-cyan-500/60 sm:tracking-[0.4em]">Made for phones. Shield your screen before opening.</p>
      </motion.div>

      {/* Shared Active Container */}
      <div className="z-10 flex min-h-0 w-full min-w-0 flex-1 flex-col items-center overflow-y-auto py-4 scrollbar-hide">
        <motion.div
          animate={state === REVEAL_STATES.AUTH_TAP ? { scale: 0.96, boxShadow: "0 0 40px rgba(0,240,255,0.4)" } : { scale: 1 }}
          transition={{ duration: 0.15 }}
          className="group relative w-full max-w-[320px] shrink-0 overflow-visible pt-10 pb-[170px]"
          onClick={state === REVEAL_STATES.IDLE ? handleAuthTap : undefined}
          style={state === REVEAL_STATES.IDLE ? { cursor: 'pointer' } : {}}
        >
          <AnimatePresence>
            {(state === REVEAL_STATES.IDLE || state === REVEAL_STATES.AUTH_TAP) && (
              <motion.div
                key="unseal-prompt"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, y: -10 }}
                className="pointer-events-none absolute inset-x-0 top-0 z-30 flex flex-col items-center text-center"
              >
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-[20px] border border-cyan-400/24 bg-cyan-400/8 shadow-[0_0_24px_rgba(0,240,255,0.12)] transition-colors group-hover:border-cyan-300/40 group-hover:bg-cyan-400/12">
                  <Eye size={28} className="text-cyan-300/80" />
                </div>
                <p className="text-[11px] font-mono font-black uppercase tracking-[0.24em] text-cyan-300/80 animate-pulse">
                  {state === REVEAL_STATES.AUTH_TAP ? 'Unsealing Dossier' : 'Tap To Unseal'}
                </p>
                <p className="mt-2 text-[9px] font-mono uppercase tracking-[0.24em] text-white/42">
                  The briefing slides out like an arcade intel packet.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            animate={{
              y: dossierOffsetY,
              opacity: dossierOpacity,
              rotate: state === REVEAL_STATES.IDLE ? -1.6 : 0,
              scale: state === REVEAL_STATES.AUTH_TAP ? 0.97 : 1,
            }}
            transition={{ type: 'spring', stiffness: 180, damping: 24 }}
            className="relative z-10 mx-auto w-full max-w-[300px] sm:max-w-xs"
          >
            <div
              className={`relative flex min-h-[360px] w-full min-w-0 flex-col overflow-hidden rounded-[28px] border bg-[linear-gradient(180deg,rgba(5,11,16,0.98)_0%,rgba(7,10,14,0.96)_100%)] p-5 shadow-[0_28px_80px_rgba(0,0,0,0.45)] ${dossierFrameClass}`}
            >
              <div className="pointer-events-none absolute inset-0 paper-grain opacity-[0.08]" />
              <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${dossierAccentBar}`} />
              <div className="relative z-10 flex h-full flex-col items-center">
                <div className="flex w-full items-start justify-between gap-3">
                  <div className="min-w-0 text-left">
                    <p className="text-[8px] font-mono font-black uppercase tracking-[0.32em] text-white/42">
                      Confidential Packet
                    </p>
                    <p className="mt-1 text-[10px] font-mono font-black uppercase tracking-[0.18em] text-white/58">
                      {dossierStatusLabel}
                    </p>
                  </div>

                  {(state === REVEAL_STATES.CONFIRMED || state === REVEAL_STATES.OPERATIVES) && (
                    <motion.button
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      onClick={() => setPrivacyMode(!privacyMode)}
                      className="pointer-events-auto -mt-1 -mr-1 rounded-2xl border border-white/10 bg-white/[0.04] p-2 text-white/38 transition-colors hover:bg-white/[0.08] hover:text-white/72"
                    >
                      {privacyMode ? <EyeOff size={16} /> : <Eye size={16} />}
                    </motion.button>
                  )}
                </div>

                {!showCardContent ? (
                  <div className="flex flex-1 flex-col items-center justify-center text-center">
                    <motion.div
                      animate={{
                        scale: state === REVEAL_STATES.AUTH_TAP ? [1, 1.06, 1] : 1,
                        opacity: state === REVEAL_STATES.AUTH_TAP ? [0.5, 1, 0.5] : 0.58,
                      }}
                      transition={{ duration: 1.1, repeat: state === REVEAL_STATES.AUTH_TAP ? Infinity : 0, ease: 'easeInOut' }}
                      className="mb-5 flex h-16 w-16 items-center justify-center rounded-[20px] border border-cyan-400/18 bg-cyan-400/8"
                    >
                      <Eye size={28} className="text-cyan-300/80" />
                    </motion.div>
                    <p className="text-[11px] font-mono font-black uppercase tracking-[0.24em] text-cyan-200/72">
                      {state === REVEAL_STATES.AUTH_TAP ? 'Decrypting Briefing' : 'Sealed Briefing'}
                    </p>
                    <p className="mt-3 max-w-[16rem] text-xs leading-relaxed text-white/42">
                      Your dossier is sliding out of the envelope. Keep the screen pointed only at you.
                    </p>
                  </div>
                ) : (
                  <>
                    <motion.div animate={{ opacity: showColors ? 1 : 0.2 }} transition={{ duration: 0.3 }} className="mb-3 mt-5">
                      {isFactionLiberal 
                        ? <Shield size={40} className="text-cyan-400 drop-shadow-[0_0_15px_rgba(0,240,255,0.8)]" /> 
                        : <Skull size={40} className="text-red-500 drop-shadow-[0_0_15px_rgba(255,0,60,0.8)]" />
                      }
                    </motion.div>

                    <p className="mb-2 text-center text-[9px] font-mono font-bold uppercase tracking-[0.2em] text-white/50">
                      Your Role:
                    </p>

                    <div className="mb-6 flex h-[40px] items-center justify-center">
                      {state === REVEAL_STATES.DECRYPTING ? (
                        <DecryptText text={roleTitle} isRevealing={true} isBlurred={false} />
                      ) : (
                        <DecryptText text={roleTitle} isRevealing={false} isBlurred={privacyMode} />
                      )}
                    </div>

                    <AnimatePresence>
                      {(state === REVEAL_STATES.DETAILS || state === REVEAL_STATES.OPERATIVES || state === REVEAL_STATES.CONFIRMED) && !privacyMode && (
                        <motion.div 
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4 }}
                          className="mb-4 w-full min-w-0 rounded-[22px] border border-white/10 bg-black/60 p-4 text-left font-mono text-[10px] leading-relaxed tracking-wide text-white/80 shadow-inner sm:text-[11px]"
                        >
                          <span className={`mb-1 block text-[9px] font-black tracking-widest ${isFactionLiberal ? 'text-cyan-400/60' : 'text-red-400/60'}`}>DIRECTIVE:</span>
                          {directiveText}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <AnimatePresence>
                      {(state === REVEAL_STATES.OPERATIVES || state === REVEAL_STATES.CONFIRMED) && visibleTeammates.length > 0 && !privacyMode && (
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="w-full text-left"
                        >
                          <p className="mb-2 border-b border-white/10 pb-1 text-[8px] font-mono font-bold uppercase tracking-[0.3em] text-white/40 sm:text-[9px]">
                            Known Allies
                          </p>
                          <div className="flex flex-col gap-[2px]">
                            {visibleTeammates.map((t, index) => (
                              <motion.div 
                                key={t.id}
                                initial={{ opacity: 0, x: -15 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.04, type: "spring", stiffness: 300, damping: 20 }}
                                className="flex flex-col gap-2 border-l-2 border-red-500/40 bg-black/40 px-3 py-2 text-[10px] font-mono min-[360px]:flex-row min-[360px]:items-center min-[360px]:justify-between"
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
                                <span className="self-start font-black text-red-500 min-[360px]:ml-2 min-[360px]:shrink-0">
                                  [{t.role === ROLES.HITLER ? 'HITLER' : 'FASCIST'}]
                                </span>
                              </motion.div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                )}
              </div>
            </div>
          </motion.div>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-[182px]">
            <motion.div
              animate={{
                rotateX: flapRotation,
                y: state === REVEAL_STATES.AUTH_TAP ? -4 : 0,
              }}
              transition={{ type: 'spring', stiffness: 180, damping: 24 }}
              className="absolute left-1/2 top-0 h-[88px] w-[92%] -translate-x-1/2 [clip-path:polygon(0_100%,50%_0,100%_100%)] border border-[#c9af7f] bg-[linear-gradient(180deg,#f0dfb7_0%,#d9bb86_100%)] shadow-[0_16px_30px_rgba(0,0,0,0.24)]"
              style={{
                transformOrigin: 'top center',
                transformStyle: 'preserve-3d',
                backfaceVisibility: 'hidden',
                perspective: 1200,
              }}
            >
              <div className="absolute inset-0 paper-grain opacity-[0.18]" />
              <div className="absolute inset-x-[18%] top-[18px] h-px bg-white/55" />
            </motion.div>

            <motion.div
              animate={{
                boxShadow:
                  state === REVEAL_STATES.IDLE
                    ? '0 18px 34px rgba(0,0,0,0.28)'
                    : '0 24px 48px rgba(0,0,0,0.34)',
              }}
              className="absolute inset-x-2 bottom-0 h-[136px] rounded-[28px] border border-[#b99662] bg-[linear-gradient(180deg,#e6cca0_0%,#c8a56f_100%)]"
            >
              <div className="absolute inset-0 overflow-hidden rounded-[28px] paper-grain opacity-[0.22]" />
              <div className="absolute inset-x-0 top-0 h-full bg-[linear-gradient(135deg,rgba(255,255,255,0.22)_0%,rgba(255,255,255,0)_36%,rgba(0,0,0,0.08)_100%)]" />
              <div className="absolute inset-x-0 top-0 h-full [clip-path:polygon(0_0,50%_58%,100%_0,100%_100%,0_100%)] bg-[linear-gradient(180deg,rgba(255,255,255,0.16)_0%,rgba(0,0,0,0.08)_100%)] opacity-80" />
              <div className="absolute left-1/2 top-4 h-[88px] w-px -translate-x-1/2 bg-[#826945]/20" />
              <div className="absolute inset-x-5 bottom-5 flex items-center justify-between text-[8px] font-mono font-black uppercase tracking-[0.22em] text-[#5a4322]/70">
                <span>Arcade Mail</span>
                <span>Role Pack</span>
              </div>
            </motion.div>

            <AnimatePresence>
              {!sealHidden && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{
                    opacity: state === REVEAL_STATES.AUTH_TAP ? [1, 0.45, 0] : 1,
                    scale: state === REVEAL_STATES.AUTH_TAP ? [1, 1.1, 0.78] : 1,
                    y: state === REVEAL_STATES.AUTH_TAP ? [0, 6, 18] : 0,
                  }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: state === REVEAL_STATES.AUTH_TAP ? 0.28 : 0.2, ease: 'easeOut' }}
                  className="absolute left-1/2 top-[54px] flex h-12 w-12 -translate-x-1/2 items-center justify-center rounded-full border border-[#7a0018]/35 bg-[radial-gradient(circle_at_30%_30%,#ff5c79_0%,#a30a23_70%)] shadow-[0_10px_24px_rgba(0,0,0,0.28)]"
                >
                  <Eye size={18} className="text-white/92" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {/* CONFIRMED: ACKNOWLEDGE CTA */}
      <div className="mt-auto flex shrink-0 justify-center px-2 pb-2 pt-2">
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
