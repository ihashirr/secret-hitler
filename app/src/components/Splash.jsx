import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const STEPS = {
  IDENT: 'IDENT',
  SECTOR: 'SECTOR',
};

// Mode-switch style transition (scale 0.98 -> 1)
const SYS_TRANSITION = { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] };
const GLITCH_SHAKE = { x: [-2, 3, -1, 4, -2, 0], transition: { duration: 0.2, ease: "linear" } };
const createRoomCode = () => Math.random().toString(36).slice(2, 6).toUpperCase();
const getInitialRoomId = () => {
  if (typeof window === 'undefined') return '';

  const room = new URLSearchParams(window.location.search).get('room');
  return room ? room.toUpperCase().substring(0, 4) : '';
};

// Haptic helper
const triggerHaptic = (ms = 15) => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(ms);
  }
};

// Custom Hook for Mouse Tracking
function useMousePosition() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({
        x: (e.clientX / window.innerWidth - 0.5) * 2,
        y: (e.clientY / window.innerHeight - 0.5) * 2,
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);
  return mousePos;
}

// Custom Hook for Cycling Taglines
function useTagline(tags, interval = 3000) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setIndex(i => (i + 1) % tags.length), interval);
    return () => clearInterval(timer);
  }, [tags, interval]);
  return tags[index];
}

const TAGLINES = [
  "MOBILE BRIEFING ROOM ONLINE",
  "PRIVATE MATCHES FOR 5 TO 10 PLAYERS",
  "ONE PHONE PER PLAYER",
  "KEEP YOUR SCREEN PRIVATE DURING ROLE BRIEFING",
  "CREATE A ROOM OR ENTER A ROOM CODE"
];

export default function Splash({ onConnect }) {
  const [step, setStep] = useState(STEPS.IDENT);
  const [name, setName] = useState('');
  const [roomId, setRoomId] = useState(getInitialRoomId);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [identFocused, setIdentFocused] = useState(false);
  const [avatarId, setAvatarId] = useState(1);
  
  const mouse = useMousePosition();
  const tagline = useTagline(TAGLINES);
  const identRef = useRef(null);
  const sectorRef = useRef(null);

  // Auto-focus inputs based on step
  useEffect(() => {
    const targetRef = step === STEPS.IDENT ? identRef : sectorRef;
    if (!targetRef.current) return undefined;

    const timeoutId = window.setTimeout(() => targetRef.current?.focus(), 50);
    return () => window.clearTimeout(timeoutId);
  }, [step]);

  const handleNext = (e) => {
    if (e) e.preventDefault();
    if (!name.trim()) return;
    triggerHaptic(25);
    setStep(STEPS.SECTOR);
  };

  const handleJoin = async (e) => {
    if (e) e.preventDefault();
    if (!name.trim()) return;
    triggerHaptic(30);
    setLoading(true);
    setError('');
    const finalRoomId = roomId.trim().toUpperCase() || createRoomCode();
    try {
      await onConnect(name.trim(), finalRoomId, avatarId);
      triggerHaptic([30, 50, 30]);
    } catch (err) {
      triggerHaptic([50, 50, 50]);
      setError(err.message || 'CONNECTION_SEVERED');
      setLoading(false);
      setStep(STEPS.SECTOR);
    }
  };

  const handleInputChange = (setter, limit, isUpper = false) => (e) => {
    let val = e.target.value;
    if (isUpper) val = val.toUpperCase();
    val = val.substring(0, limit);
    setter(val);
    triggerHaptic(5);
  };

  return (
    <motion.main 
      animate={error ? GLITCH_SHAKE : {}}
      className="fixed inset-0 bg-[#020508] text-cyan-50 font-sans overflow-hidden flex flex-col justify-between select-none pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]"
    >
      
      {/* =========================================
          LAYER A: INTERACTIVE GAME OVERLAY
          ========================================= */}
      <motion.div 
        style={{ 
          x: mouse.x * 20, 
          y: mouse.y * 20,
          rotateX: mouse.y * -5,
          rotateY: mouse.x * 5,
        }}
        className="absolute inset-0 pointer-events-none z-0 perspective-[1000px]"
      >
        {/* Subtle Warm Game Tint */}
        {!error && <div className="absolute inset-[-10%] bg-[#d95843] mix-blend-color opacity-[0.07] transition-opacity duration-1000" />}
        
        {/* Narrative Game Identity Layer (Blurred for Depth) */}
        {!error && (
          <div className="absolute inset-[-5%] opacity-[0.08] blur-[1.5px] mix-blend-screen transition-opacity duration-1000 [mask-image:radial-gradient(ellipse_100%_100%_at_50%_40%,#000_10%,transparent_90%)] bg-[radial-gradient(circle_at_center,rgba(0,240,255,0.18),transparent_45%),repeating-linear-gradient(90deg,rgba(255,255,255,0.04)_0,rgba(255,255,255,0.04)_2px,transparent_2px,transparent_28px)]" />
        )}
      </motion.div>

      {/* =========================================
          LAYER B: REACTIVE OS BASE GRID
          ========================================= */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <motion.div 
          style={{ x: mouse.x * -10, y: mouse.y * -10 }}
          animate={{ 
            opacity: error ? [0, 1, 0.5] : [0.45, 0.55],
            backgroundColor: error ? '#ff003c05' : 'transparent',
          }}
          transition={{ opacity: { repeat: Infinity, duration: 4, ease: "easeInOut" } }}
          className={`absolute inset-[-10%] bg-[size:30px_30px] [mask-image:radial-gradient(ellipse_100%_100%_at_50%_0%,#000_10%,transparent_80%)] transition-all duration-300
            ${error ? 'bg-[linear-gradient(rgba(255,0,60,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,0,60,0.1)_1px,transparent_1px)]' 
                    : 'bg-[linear-gradient(rgba(0,240,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,240,255,0.03)_1px,transparent_1px)]'}
          `} 
        />
        {/* Ambient Flicker Layer */}
        <motion.div 
          animate={{ opacity: [0, 0.03, 0.01, 0.04, 0] }}
          transition={{ duration: 0.2, repeat: Infinity, repeatDelay: 4 }}
          className="absolute inset-0 bg-cyan-400/5 mix-blend-overlay pointer-events-none" 
        />
        {/* Scanline Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_50%,rgba(0,0,0,0.1)_50%)] bg-[size:100%_4px] pointer-events-none opacity-20" />
        
        {/* Full screen error glitch bleed */}
        {error && <div className="absolute inset-0 bg-red-500/5 mix-blend-overlay pointer-events-none" />}
      </div>

      {/* =========================================
          LAYER C: SYSTEM UI (OS SHELL)
          ========================================= */}
      
      {/* Top Heading Block */}
      <header className="relative z-10 w-full flex flex-col items-center shrink-0 pt-8 px-6">
        <motion.div 
          initial={{ opacity: 0, y: 15 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={SYS_TRANSITION}
          className="flex flex-col items-center"
        >
          <div className="flex items-center gap-2 mb-4 opacity-70">
            <div className={`w-[5px] h-[5px] rounded-full animate-pulse shadow-[0_0_8px] ${error ? 'bg-red-500 shadow-red-500' : 'bg-cyan-400 shadow-[rgba(0,240,255,0.8)]'}`} />
            <span className={`font-mono text-[9px] tracking-[0.4em] uppercase ${error ? 'text-red-400' : 'text-cyan-300'}`}>
              {error ? 'CHANNEL INTERRUPTED' : 'CHANNEL SECURE'}
            </span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-black tracking-widest text-[#fdfaf6] drop-shadow-[0_0_10px_rgba(0,240,255,0.1)] opacity-95">
            ECLIPSE
          </h1>
          <p className="font-mono text-[8px] md:text-[9px] tracking-[0.4em] uppercase text-[#f4b560]/70 mt-2 font-bold w-4/5 text-center">
            MOBILE-FIRST SOCIAL DEDUCTION
          </p>
          <p className="mt-4 max-w-xs text-center text-[11px] leading-relaxed text-cyan-100/60 normal-case tracking-[0.08em]">
            Built for private phone play. Each player joins on their own screen and keeps role information hidden from the room.
          </p>
        </motion.div>
      </header>

      {/* Middle Messaging Area (Dynamic Taglines) */}
      <section className="relative z-0 flex-1 w-full flex flex-col justify-end pb-12 px-10 overflow-hidden max-w-lg mx-auto pointer-events-none text-left">
        <AnimatePresence mode="wait">
          <motion.div
            key={tagline}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.5, ease: "anticipate" }}
            className="font-mono text-[10px] tracking-[0.5em] text-cyan-400/50 flex items-center gap-3 uppercase"
          >
            <div className="w-1.5 h-1.5 bg-cyan-400/20" />
            {error ? `CRITICAL_ERROR: ${error}` : tagline}
          </motion.div>
        </AnimatePresence>
      </section>

      {/* Bottom Glass Panel (OS Controls) */}
      <section className="relative z-20 w-full shrink-0 flex flex-col justify-end pt-12 pb-10 px-6 max-w-lg mx-auto bg-gradient-to-t from-[#010305] via-[#010305]/95 to-transparent">
        <div className="absolute inset-x-0 bottom-0 h-full backdrop-blur-[2px] pointer-events-none [mask-image:linear-gradient(to_bottom,transparent_20%,black_70%)]" />

        <div className="relative z-30 w-full flex flex-col gap-8">
          
          <div className="relative min-h-[200px]">
            <AnimatePresence mode="wait">
              
              {/* STEP 1: IDENT */}
              {step === STEPS.IDENT && (
                <motion.form 
                  key="ident-form"
                  initial={{ opacity: 0, scale: 0.98, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98, y: -10 }}
                  transition={SYS_TRANSITION}
                  className="absolute inset-0 flex flex-col justify-end gap-5"
                  onSubmit={handleNext}
                >
                    <div className="relative group bg-[#060a0f] border border-cyan-900/20 pt-3 pb-5 px-6 flex flex-col gap-1 min-h-[100px] overflow-hidden">
                      {/* Corner Accents */}
                      <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-cyan-400/40" />
                      <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-cyan-400/40" />
                      <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-cyan-400/40" />
                      <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-cyan-400/40" />

                      <div className="absolute top-2 right-4 flex gap-3 items-center">
                        <motion.div 
                          animate={{ opacity: [0.2, 0.5, 0.2] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="font-mono text-[7px] text-cyan-400/30 tracking-tighter"
                        >
                          SEC_LEVEL: ALPHA_7
                        </motion.div>
                        <div className="flex gap-1">
                          <div className="w-1 h-3 bg-cyan-400/20" />
                          <div className="w-1 h-3 bg-cyan-400/20" />
                        </div>
                      </div>

                      <label className="font-mono text-[9px] uppercase tracking-[0.3em] text-cyan-600/80 font-bold mb-1 flex justify-between">
                        <span>CALLSIGN_INPUT</span>
                        <motion.span 
                          animate={{ opacity: [0, 1, 0] }} 
                          transition={{ duration: 0.1, repeat: Infinity, repeatDelay: 3 }}
                          className="text-cyan-400/40"
                        >
                          [ REC_ACTIVE ]
                        </motion.span>
                      </label>
                      
                      <div className="relative flex items-center h-[60px]">
                        {/* Scanning Line Background */}
                        <motion.div 
                          animate={{ left: ['-10%', '110%'] }}
                          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                          className="absolute inset-y-0 w-8 bg-gradient-to-r from-transparent via-cyan-400/5 to-transparent skew-x-12 pointer-events-none"
                        />

                        <input
                          ref={identRef}
                          type="text"
                          value={name}
                          onChange={handleInputChange(setName, 14, false)}
                          onFocus={() => setIdentFocused(true)}
                          onBlur={() => setIdentFocused(false)}
                          className="w-full bg-transparent border-none outline-none text-3xl md:text-4xl font-black text-white tracking-[0.2em] uppercase placeholder:text-cyan-400/5 caret-cyan-400 relative z-10"
                          spellCheck="false"
                          autoComplete="off"
                          placeholder="OPERATIVE_ID"
                        />
                        
                        {/* Tactical Underline Decor */}
                        <div className="absolute bottom-0 inset-x-0 h-[1px] bg-cyan-900/30">
                          <motion.div 
                            initial={false}
                            animate={{ width: identFocused ? '100%' : '30%' }}
                            className="h-full bg-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.6)]"
                          />
                        </div>
                      </div>
                    
                    <div className="absolute inset-x-0 bottom-0 h-[2px] bg-cyan-400 scale-x-0 origin-left transition-transform duration-300 ease-out group-focus-within:scale-x-100 shadow-[0_0_15px_rgba(0,240,255,0.4)]" />
                  </div>

                  {/* Improved Avatar Selector */}
                  <div className="bg-[#060a0f] border border-cyan-900/20 py-4 px-6 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <label className="font-mono text-[9px] uppercase tracking-[0.3em] text-cyan-600/80 font-bold">
                        IDENTIFY_OPERATIVE_PORTRAIT
                      </label>
                      <span className="font-mono text-[9px] text-cyan-400 opacity-60 font-bold selection-none">PROFILE_{avatarId.toString().padStart(2, '0')}</span>
                    </div>
                    
                    <div className="grid grid-cols-5 gap-2 relative">
                      {[1,2,3,4,5,6,7,8,9,10].map((id) => {
                        const isSelected = avatarId === id;
                        return (
                          <div key={id} className="relative aspect-[3/4]">
                            <button
                              type="button"
                              onClick={() => { triggerHaptic(10); setAvatarId(id); }}
                              className={`absolute inset-0 border transition-all duration-300 overflow-hidden rounded-sm group/avatar
                                ${isSelected ? 'border-cyan-400 ring-2 ring-cyan-400/40 shadow-[0_0_15px_rgba(0,240,255,0.3)] scale-110 z-10' : 'border-cyan-900/30 opacity-40 hover:opacity-100 hover:border-cyan-400/30'}
                              `}
                            >
                              <img 
                                src={`/assets/avatars/avatar_${id}.png`}
                                className={`absolute inset-0 w-full h-full object-cover transition-all duration-500
                                  ${isSelected ? 'scale-110' : 'grayscale contrast-125 opacity-70 group-hover/avatar:opacity-100 group-hover/avatar:grayscale-0'}
                                `}
                                alt=""
                              />
                            </button>
                            {isSelected && (
                              <div className="absolute inset-x-0 -bottom-1 h-0.5 bg-cyan-400 z-20 pointer-events-none shadow-[0_-2px_8px_rgba(0,240,255,1)]" />
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex justify-between items-center font-mono text-[7px] tracking-[0.2em] text-cyan-600/40 uppercase px-1 selection-none">
                      <span>TAP_PROFILE_TO_SELECT_IDENTITY</span>
                      <span>SEC_IDENT: 4CAFE0</span>
                    </div>
                  </div>
                  
                  <motion.button 
                    whileTap={{ scale: 0.985 }}
                    type="submit"
                    disabled={!name.trim()}
                    className={`relative w-full shrink-0 h-[64px] font-mono text-[11px] font-black tracking-[0.4em] uppercase transition-all duration-200 overflow-hidden group/btn ${name.trim() ? 'bg-cyan-400 text-black shadow-[0_0_20px_rgba(0,240,255,0.3)] hover:scale-[1.01]' : 'bg-transparent border border-cyan-900/30 text-cyan-800'}`}
                  >
                    <span className="relative z-10">CONFIRM_AND_CONTINUE</span>
                    
                    {/* Shimmer Effect */}
                    {name.trim() && (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/btn:animate-[shimmer_2s_infinite] pointer-events-none" />
                    )}
                  </motion.button>

                </motion.form>
              )}

              {/* STEP 2: SECTOR */}
              {step === STEPS.SECTOR && (
                <motion.form 
                  key="sector-form"
                  initial={{ opacity: 0, scale: 0.98, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98, y: -10 }} transition={SYS_TRANSITION}
                  className="absolute inset-0 flex flex-col justify-end gap-5"
                  onSubmit={handleJoin}
                >
                  <div className="relative group bg-[#060a0f] border border-cyan-900/20 pt-3 pb-6 px-6 flex flex-col gap-1 items-center min-h-[120px] overflow-hidden">
                    {/* Corner Brackets */}
                    <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-cyan-400/20" />
                    <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-cyan-400/20" />
                    <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-cyan-400/20" />
                    <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-cyan-400/20" />

                    <div className="flex justify-between items-center w-full mb-2">
                      <label className="font-mono text-[9px] uppercase tracking-[0.3em] text-cyan-600/80 font-bold">FREQUENCY_BAND <span className="opacity-30 font-normal ml-1">(OPTIONAL)</span></label>
                      <button type="button" onClick={() => { triggerHaptic(10); setStep(STEPS.IDENT); }} className="font-mono text-[8px] uppercase tracking-widest text-[#00f0ff]/40 hover:text-cyan-400 transition-colors">[ EDIT_ALIAS ]</button>
                    </div>
                    
                    <div className="relative flex items-center justify-center w-full h-[60px]">
                      {/* Interactive Pulse Glow */}
                      <motion.div 
                        animate={{ opacity: [0.05, 0.1, 0.05] }}
                        transition={{ duration: 3, repeat: Infinity }}
                        className="absolute inset-0 bg-cyan-400 blur-2xl rounded-full"
                      />

                      <input
                        ref={sectorRef}
                        type="text"
                        value={roomId}
                        onChange={handleInputChange(setRoomId, 4, true)}
                        className="w-full bg-transparent border-none outline-none text-4xl md:text-5xl font-mono font-black text-center text-cyan-400 tracking-[0.5em] uppercase placeholder:text-white/5 caret-cyan-400 text-glow-cyan relative z-10"
                        spellCheck="false"
                        autoComplete="off"
                        placeholder="____"
                      />
                    </div>

                    <div className="absolute bottom-3 text-center font-mono text-[8px] tracking-[0.2em] uppercase transition-colors duration-300 pointer-events-none relative z-10">
                      {roomId ? <span className="text-cyan-400/80 text-glow-cyan">LINKING_TO_SPECIFIED_SECTOR</span> : <span className="text-cyan-600/40">OPEN_NEW_MISSION_SECTOR</span>}
                    </div>
                    <div className="absolute inset-x-0 bottom-0 h-[2px] bg-cyan-400 scale-x-0 origin-center transition-transform duration-300 ease-out group-focus-within:scale-x-100 shadow-[0_0_15px_rgba(0,240,255,0.4)]" />
                  </div>

                  <div className="relative w-full shrink-0 h-[64px] overflow-hidden">
                    <motion.button 
                      whileTap={{ scale: 0.985 }}
                      type="submit" disabled={loading}
                      className={`relative w-full h-full font-mono text-[11px] font-black tracking-[0.4em] uppercase transition-all duration-200 overflow-hidden
                        ${loading ? 'bg-cyan-900/50 text-black' : roomId ? 'bg-cyan-400 text-black shadow-[0_0_20px_rgba(0,240,255,0.3)]' : 'bg-[#00f0ff]/10 border border-cyan-400/30 text-cyan-300'}
                      `}
                    >
                      <span className="relative z-10">{loading ? 'OPENING BRIEFING ROOM...' : (roomId ? 'JOIN ROOM' : 'CREATE ROOM')}</span>
                      
                      {/* Shockwave Ripple */}
                      <motion.div 
                        initial={{ opacity: 0 }}
                        whileTap={{ opacity: [0, 0.2, 0] }}
                        transition={{ duration: 0.1 }}
                        className="absolute inset-0 bg-white pointer-events-none"
                      />
                    </motion.button>
                  </div>
                </motion.form>

              )}

            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* Decorative SVG HUD Corners (OS SYSTEM UI) */}
      <svg className="absolute top-4 left-4 w-12 h-12 opacity-20 pointer-events-none" viewBox="0 0 100 100">
        <path d="M 0 30 L 0 0 L 30 0" fill="none" stroke="var(--color-grid-cyan)" strokeWidth="1" />
      </svg>
      <svg className="absolute bottom-4 right-4 w-12 h-12 opacity-20 pointer-events-none rotate-180" viewBox="0 0 100 100">
        <path d="M 0 30 L 0 0 L 30 0" fill="none" stroke="var(--color-grid-cyan)" strokeWidth="1" />
      </svg>
    </motion.main>
  );
}
