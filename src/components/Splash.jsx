import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const STEPS = {
  BOOT: 'BOOT',
  IDENT: 'IDENT',
  SECTOR: 'SECTOR',
};

// Mode-switch style transition (scale 0.98 -> 1)
const SYS_TRANSITION = { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] };
const GLITCH_SHAKE = { x: [-2, 3, -1, 4, -2, 0], transition: { duration: 0.2, ease: "linear" } };

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
  "ESTABLISHING SECURE CHANNEL...",
  "IDENTITY VERIFICATION REQUIRED",
  "AWAITING OPERATOR INPUT",
  "DECRYPTING_HANDSHAKE...",
  "GPS_LOCK_CONFIRMED"
];

const Character = ({ char, index }) => (
  <motion.span
    initial={{ opacity: 0, filter: 'blur(4px)', scale: 0.8 }}
    animate={{ opacity: 1, filter: 'blur(0px)', scale: 1 }}
    transition={{ duration: 0.2, type: "spring", stiffness: 300 }}
    className="inline-block"
  >
    {char === ' ' ? '\u00A0' : char}
  </motion.span>
);

const CustomCursor = ({ active = true }) => {
  if (!active) return <div className="w-[12px] h-[32px] md:h-[40px] inline-block align-middle ml-1" />;
  return (
    <motion.div
      animate={{ opacity: [1, 1, 0, 0, 1] }}
      transition={{ duration: 0.8, repeat: Infinity, times: [0, 0.5, 0.51, 1], ease: "linear" }}
      className="w-[12px] h-[32px] md:h-[40px] bg-cyan-400 shadow-[0_0_12px_rgba(0,240,255,0.8)] inline-block align-middle ml-1"
    />
  );
};

export default function Splash({ onConnect, onReset }) {
  const [step, setStep] = useState(STEPS.BOOT);
  const [name, setName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sysTime, setSysTime] = useState('');
  const [identFocused, setIdentFocused] = useState(false);
  
  const mouse = useMousePosition();
  const tagline = useTagline(TAGLINES);
  const identRef = useRef(null);
  const sectorRef = useRef(null);

  useEffect(() => {
    // Atmospheric system time
    setSysTime(new Date().toLocaleTimeString([], { hour12: false }));
    const timeInterval = setInterval(() => {
      setSysTime(new Date().toLocaleTimeString([], { hour12: false }));
    }, 1000);

    // Boot sequence timing (No logs, just a cinematic wait)
    if (step === STEPS.BOOT) {
      setTimeout(() => setStep(STEPS.IDENT), 2400);
    }

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const room = params.get('room');
      if (room) setRoomId(room.toUpperCase().substring(0, 4));
    }

    return () => clearInterval(timeInterval);
  }, [step]);

  // Auto-focus inputs based on step
  useEffect(() => {
    if (step === STEPS.IDENT && identRef.current) setTimeout(() => identRef.current.focus(), 250);
    if (step === STEPS.SECTOR && sectorRef.current) setTimeout(() => sectorRef.current.focus(), 250);
    if (step !== STEPS.BOOT) triggerHaptic(20);
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
    const finalRoomId = roomId.trim().toUpperCase() || Math.random().toString(36).substring(2, 6).toUpperCase();
    try {
      await onConnect(name.trim(), finalRoomId);
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
          <div className="absolute inset-[-5%] bg-[url('/secret_card.svg')] bg-contain bg-center bg-no-repeat opacity-[0.05] blur-[1.5px] mix-blend-screen transition-opacity duration-1000 [mask-image:radial-gradient(ellipse_100%_100%_at_50%_40%,#000_10%,transparent_90%)]" />
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
          transition={{ duration: 0.2, repeat: Infinity, repeatDelay: Math.random() * 5 + 2 }}
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
              {error ? 'UPLINK_SEVERED' : 'SATELLITE_UPLINK_SECURE'}
            </span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-black tracking-widest text-[#fdfaf6] drop-shadow-[0_0_10px_rgba(0,240,255,0.1)] opacity-95">
            ECLIPSE
          </h1>
          <p className="font-mono text-[8px] md:text-[9px] tracking-[0.4em] uppercase text-[#f4b560]/70 mt-2 font-bold w-4/5 text-center">
            INFILTRATION PROTOCOL
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
                  <div className="relative group bg-[#060a0f] border border-cyan-900/20 pt-3 pb-5 px-6 flex flex-col gap-1 min-h-[100px]">
                    <div className="absolute top-2 right-4 flex gap-1 items-center opacity-30">
                      <div className="w-1 h-3 bg-cyan-400/20" />
                      <div className="w-1 h-3 bg-cyan-400/20" />
                    </div>
                    <label className="font-mono text-[9px] uppercase tracking-[0.3em] text-cyan-600/80 font-bold mb-1">
                      OPERATIVE ALIAS
                    </label>
                    
                    <div className="relative text-3xl md:text-4xl font-black text-white tracking-widest flex items-center h-[50px] overflow-hidden">
                      <AnimatePresence mode="popLayout" initial={false}>
                        {name.split('').map((char, i) => (
                          <Character key={`${i}-${char}`} char={char} index={i} />
                        ))}
                      </AnimatePresence>
                      <CustomCursor active={identFocused} />
                      <input
                        ref={identRef}
                        type="text"
                        value={name}
                        onChange={handleInputChange(setName, 12, false)}
                        onFocus={() => setIdentFocused(true)}
                        onBlur={() => setIdentFocused(false)}
                        className="absolute inset-0 opacity-0 cursor-default"
                        spellCheck="false"
                        autoComplete="off"
                        placeholder=""
                      />
                      {name.length === 0 && (
                        <div className="absolute inset-0 flex items-center pointer-events-none opacity-5 animate-pulse">
                          DESIGNATION_
                        </div>
                      )}
                    </div>
                    
                    <div className="absolute inset-x-0 bottom-0 h-[2px] bg-cyan-400 scale-x-0 origin-left transition-transform duration-300 ease-out group-focus-within:scale-x-100 shadow-[0_0_15px_rgba(0,240,255,0.4)]" />
                  </div>
                  
                  <motion.button 
                    whileHover={name.trim() ? { scale: 1.01, boxShadow: '0 0 30px rgba(0, 240, 255, 0.2)' } : {}}
                    whileTap={name.trim() ? { scale: 0.98 } : {}}
                    type="submit"
                    disabled={!name.trim()}
                    className={`relative w-full shrink-0 h-[64px] font-mono text-[11px] font-black tracking-[0.4em] uppercase transition-[all] duration-200 overflow-hidden ${name.trim() ? 'bg-cyan-400 text-black shadow-[0_0_20px_rgba(0,240,255,0.25)]' : 'bg-transparent border border-cyan-900/30 text-cyan-800'}`}
                  >
                    <span className="relative z-10">CONTINUE</span>
                    
                    {/* Shockwave Ripple */}
                    {name.trim() && (
                      <motion.div 
                        initial={{ scale: 0, opacity: 0 }}
                        whileTap={{ scale: 4, opacity: [0, 0.4, 0] }}
                        transition={{ duration: 0.5 }}
                        className="absolute inset-0 rounded-full pointer-events-none bg-white/30"
                      />
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
                  <div className="relative group bg-[#060a0f] border border-cyan-900/20 pt-3 pb-6 px-6 flex flex-col gap-1 items-center min-h-[120px]">
                    <div className="flex justify-between items-center w-full mb-2">
                      <label className="font-mono text-[9px] uppercase tracking-[0.3em] text-cyan-600/80 font-bold">FREQUENCY BAND <span className="opacity-30 font-normal ml-1">(OPTIONAL)</span></label>
                      <button type="button" onClick={() => { triggerHaptic(10); setStep(STEPS.IDENT); }} className="font-mono text-[8px] uppercase tracking-widest text-[#00f0ff]/40 hover:text-cyan-400 transition-colors">[ CHANGE ALIAS ]</button>
                    </div>
                    
                    <div className="relative text-4xl md:text-5xl my-2 font-mono font-black text-center text-white tracking-[0.5em] flex items-center justify-center w-full h-[60px]">
                       <AnimatePresence mode="popLayout" initial={false}>
                        {roomId.padEnd(4, '_').split('').map((char, i) => (
                           <motion.span
                             key={i}
                             initial={{ opacity: 0, y: 5 }}
                             animate={{ opacity: char === '_' ? 0.05 : 1, y: 0 }}
                             className={char === '_' ? 'text-white' : 'text-cyan-400 text-glow-cyan'}
                           >
                             {char}
                           </motion.span>
                        ))}
                      </AnimatePresence>
                      <input
                        ref={sectorRef}
                        type="text"
                        value={roomId}
                        onChange={handleInputChange(setRoomId, 4, true)}
                        className="absolute inset-0 opacity-0 cursor-default text-center"
                        spellCheck="false"
                        autoComplete="off"
                      />
                    </div>

                    <div className="absolute bottom-3 text-center font-mono text-[8px] tracking-[0.2em] uppercase transition-colors duration-300 pointer-events-none">
                      {roomId ? <span className="text-cyan-400/80 text-glow-cyan">LINKING TO SPECIFIED SECTOR</span> : <span className="text-cyan-600/40">LEAVE BLANK TO HOST NEW SYSTEM SECTOR</span>}
                    </div>
                    <div className="absolute inset-x-0 bottom-0 h-[2px] bg-cyan-400 scale-x-0 origin-center transition-transform duration-300 ease-out group-focus-within:scale-x-100 shadow-[0_0_15px_rgba(0,240,255,0.4)]" />
                  </div>

                  <div className="relative w-full shrink-0 h-[64px] overflow-hidden">
                    <motion.button 
                      whileHover={{ scale: 1.01, boxShadow: '0 0 35px rgba(0, 240, 255, 0.3)' }}
                      whileTap={{ scale: 0.98 }}
                      type="submit" disabled={loading}
                      className={`relative w-full h-full font-mono text-[11px] font-black tracking-[0.4em] uppercase transition-[background,shadow] duration-200 overflow-hidden
                        ${loading ? 'bg-cyan-900/50 text-black' : roomId ? 'bg-cyan-400 text-black shadow-[0_0_25px_rgba(0,240,255,0.3)]' : 'bg-[#00f0ff]/10 border border-cyan-400/30 text-cyan-300 shadow-[0_0_15px_rgba(0,240,255,0.05)]'}
                      `}
                    >
                      <span className="relative z-10">{loading ? 'UPLINKING...' : (roomId ? 'JOIN_SECTOR' : 'CREATE_SECTOR')}</span>
                      
                      {/* Shockwave Ripple */}
                      <motion.div 
                        initial={{ scale: 0, opacity: 0 }}
                        whileTap={{ scale: 4, opacity: [0, 0.4, 0] }}
                        transition={{ duration: 0.5 }}
                        className="absolute inset-0 bg-white/30 rounded-full pointer-events-none"
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
        <path d="M 0 30 L 0 0 L 30 0" fill="none" stroke="var(--color-cyan-neon)" strokeWidth="1" />
      </svg>
      <svg className="absolute bottom-4 right-4 w-12 h-12 opacity-20 pointer-events-none rotate-180" viewBox="0 0 100 100">
        <path d="M 0 30 L 0 0 L 30 0" fill="none" stroke="var(--color-cyan-neon)" strokeWidth="1" />
      </svg>
    </motion.main>
  );
}
