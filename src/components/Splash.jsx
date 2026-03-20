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

export default function Splash({ onConnect, onReset }) {
  const [step, setStep] = useState(STEPS.BOOT);
  const [name, setName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [logs, setLogs] = useState([]);
  const [sysTime, setSysTime] = useState('');
  
  const identRef = useRef(null);
  const sectorRef = useRef(null);

  useEffect(() => {
    // Atmospheric system time
    setSysTime(new Date().toLocaleTimeString([], { hour12: false }));
    const timeInterval = setInterval(() => {
      setSysTime(new Date().toLocaleTimeString([], { hour12: false }));
    }, 1000);

    // Boot sequence
    const bootSequence = [
      "INITIALIZING ECLIPSE_OS_V4",
      "BYPASSING_EXTERNAL_FIREWALL...",
      "DECRYPTING_HANDSHAKE_PROTOCOLS...",
      "GPS_LOCK: 42°21'28.5\"N 71°03'42.1\"W",
      "NEURAL_LINK: STANDBY",
      "TERMINAL_READY",
      "AWAITING_INPUT..."
    ];

    let delay = 0;
    bootSequence.forEach((log, index) => {
      delay += Math.random() * 200 + 100; // slightly faster stagger
      setTimeout(() => {
        setLogs(prev => {
          const newLogs = [...prev, log];
          return newLogs.length > 7 ? newLogs.slice(-7) : newLogs;
        });
        if (index === bootSequence.length - 1) {
          setTimeout(() => setStep(STEPS.IDENT), 500);
        }
      }, delay);
    });

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const room = params.get('room');
      if (room) setRoomId(room.toUpperCase().substring(0, 4));
    }

    return () => clearInterval(timeInterval);
  }, []);

  // Auto-focus inputs based on step
  useEffect(() => {
    // Slight delay ensures the DOM transition has mounted
    if (step === STEPS.IDENT && identRef.current) setTimeout(() => identRef.current.focus(), 250);
    if (step === STEPS.SECTOR && sectorRef.current) setTimeout(() => sectorRef.current.focus(), 250);
    
    // Step transition Haptic
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
      triggerHaptic([30, 50, 30]); // Success pattern
    } catch (err) {
      triggerHaptic([50, 50, 50]); // Error pattern
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
    triggerHaptic(5); // Micro-haptic on type
  };

  return (
    <motion.main 
      animate={error ? GLITCH_SHAKE : {}}
      className="fixed inset-0 bg-[#020508] text-cyan-50 font-sans overflow-hidden flex flex-col justify-between select-none pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]"
    >
      
      {/* 1. Page Background (Ambient Texture with Error Reactive Grid) */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <motion.div 
          animate={{ opacity: error ? [0, 1, 0.5] : 0.5, backgroundColor: error ? '#ff003c05' : 'transparent' }}
          className={`absolute inset-0 bg-[size:30px_30px] [mask-image:radial-gradient(ellipse_100%_100%_at_50%_0%,#000_10%,transparent_80%)] transition-all duration-300
            ${error ? 'bg-[linear-gradient(rgba(255,0,60,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,0,60,0.1)_1px,transparent_1px)]' 
                    : 'bg-[linear-gradient(rgba(0,240,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,240,255,0.03)_1px,transparent_1px)]'}
          `} 
        />
        {/* Full screen error glitch bleed */}
        {error && <div className="absolute inset-0 bg-red-500/5 mix-blend-overlay pointer-events-none" />}
      </div>

      {/* 2. Top Heading Block (Compressed) */}
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
          
          <h1 className="text-4xl md:text-5xl font-black tracking-widest text-[#f8fafc] drop-shadow-[0_0_15px_rgba(0,240,255,0.15)] opacity-90">
            ECLIPSE
          </h1>
          <p className="font-mono text-[8px] md:text-[9px] tracking-[0.4em] uppercase text-cyan-600/60 mt-2 font-bold w-4/5 text-center">
            INFILTRATION PROTOCOL
          </p>
        </motion.div>
      </header>

      {/* 3. Middle Ambient Area (Asymmetrical, Left-Biased, Masked) */}
      <section className="relative z-0 flex-1 w-full flex flex-col justify-end pb-8 pl-[10%] pr-4 overflow-hidden max-w-lg mx-auto pointer-events-none">
        {/* Blur mask top/bottom to make them "roll" */}
        <div className="absolute inset-0 [mask-image:linear-gradient(to_bottom,transparent_0%,black_30%,black_70%,transparent_100%)]">
          <div className="absolute bottom-12 flex flex-col gap-1.5 opacity-30 w-full max-w-[280px]">
            <AnimatePresence>
              {logs.map((log, i) => (
                <motion.div 
                  key={`${log}-${i}`}
                  initial={{ opacity: 0, x: -5 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  transition={{ duration: 0.15 }}
                  className="font-mono text-[9px] text-cyan-400 flex gap-2 break-all"
                >
                  <span className="opacity-40 min-w-[50px]">[{sysTime}]</span>
                  <span>{log}</span>
                </motion.div>
              ))}
              {error && (
                <motion.div 
                  initial={{ opacity: 0, x: -5 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  className="font-mono text-[9px] text-red-500 flex gap-2 mt-2"
                >
                  <span className="opacity-40">[{sysTime}]</span>
                  <span>{'>'} CRITICAL_ERROR: {error}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* 4. Bottom Glass Panel (Anchored, Heavier Padding) */}
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
                  {/* Monolithic Input Block (At least 56px height inherently from p-5 text-3xl) */}
                  <div className="relative group bg-[#060a0f] border border-cyan-900/20 pt-3 pb-5 px-6 flex flex-col gap-1">
                    <label className="font-mono text-[9px] uppercase tracking-[0.3em] text-cyan-600/80 font-bold mb-1">
                      OPERATIVE ALIAS
                    </label>
                    <input
                      ref={identRef}
                      type="text"
                      value={name}
                      onChange={handleInputChange(setName, 12, false)}
                      className="w-full bg-transparent text-3xl md:text-4xl font-black text-white focus:outline-none focus:ring-0 font-sans tracking-widest caret-cyan-400 placeholder-white/5"
                      placeholder="DESIGNATION"
                      spellCheck="false"
                      autoComplete="off"
                    />
                    <div className="absolute inset-x-0 bottom-0 h-[2px] bg-cyan-400 scale-x-0 origin-left transition-transform duration-300 ease-out group-focus-within:scale-x-100 shadow-[0_0_15px_rgba(0,240,255,0.4)]" />
                  </div>
                  
                  {/* Binary CTA (Min 60px height) */}
                  <button 
                    type="submit"
                    disabled={!name.trim()}
                    className={`w-full shrink-0 h-[64px] font-mono text-[11px] font-black tracking-[0.4em] uppercase transition-[background,shadow,transform] duration-200 ${name.trim() ? 'bg-cyan-400 text-black shadow-[0_0_20px_rgba(0,240,255,0.25)] active:scale-[0.98]' : 'bg-transparent border border-cyan-900/20 text-cyan-900'}`}
                  >
                    CONTINUE
                  </button>
                </motion.form>
              )}

              {/* STEP 2: SECTOR */}
              {step === STEPS.SECTOR && (
                <motion.form 
                  key="sector-form"
                  initial={{ opacity: 0, scale: 0.98, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98, y: -10 }}
                  transition={SYS_TRANSITION}
                  className="absolute inset-0 flex flex-col justify-end gap-5"
                  onSubmit={handleJoin}
                >
                  <div className="relative group bg-[#060a0f] border border-cyan-900/20 pt-3 pb-6 px-6 flex flex-col gap-1 items-center">
                    <div className="flex justify-between items-center w-full mb-2">
                      <label className="font-mono text-[9px] uppercase tracking-[0.3em] text-cyan-600/80 font-bold">
                        FREQUENCY BAND <span className="opacity-30 font-normal ml-1">(OPTIONAL)</span>
                      </label>
                      <button 
                        type="button" 
                        onClick={() => { triggerHaptic(10); setStep(STEPS.IDENT); }}
                        className="font-mono text-[8px] uppercase tracking-widest text-[#00f0ff]/40 hover:text-cyan-400 transition-colors"
                      >
                        [ CHANGE ALIAS ]
                      </button>
                    </div>
                    
                    <input
                      ref={sectorRef}
                      type="text"
                      value={roomId}
                      onChange={handleInputChange(setRoomId, 4, true)}
                      className="w-full bg-transparent text-4xl md:text-5xl my-2 font-black text-center text-white focus:outline-none focus:ring-0 font-mono tracking-[0.5em] pl-[0.5em] caret-cyan-400 placeholder-white/5"
                      placeholder="____"
                      spellCheck="false"
                      autoComplete="off"
                    />

                    <div className="absolute bottom-3 text-center font-mono text-[8px] tracking-[0.2em] uppercase transition-colors duration-300 pointer-events-none">
                      {roomId ? (
                         <span className="text-cyan-400/80">LINKING TO SPECIFIED SECTOR</span>
                      ) : (
                         <span className="text-cyan-600/40">LEAVE BLANK TO HOST NEW SYSTEM SECTOR</span>
                      )}
                    </div>
                    
                    <div className="absolute inset-x-0 bottom-0 h-[2px] bg-cyan-400 scale-x-0 origin-center transition-transform duration-300 ease-out group-focus-within:scale-x-100 shadow-[0_0_15px_rgba(0,240,255,0.4)]" />
                  </div>

                  <div className="relative w-full shrink-0 h-[64px] overflow-hidden">
                    <button 
                      type="submit"
                      disabled={loading}
                      className={`w-full h-full font-mono text-[11px] font-black tracking-[0.4em] uppercase transition-[background,transform,shadow] duration-200
                        ${window.document ? (loading ? 'bg-cyan-900/50 block text-black' : roomId ? 'bg-cyan-400 block text-black shadow-[0_0_25px_rgba(0,240,255,0.3)] active:scale-[0.98]' : 'bg-[#00f0ff]/10 block border border-cyan-400/30 text-cyan-300 shadow-[0_0_15px_rgba(0,240,255,0.05)] active:scale-[0.98]') : ''}
                      `}
                    >
                      {loading ? 'UPLINKING...' : (roomId ? 'JOIN_SECTOR' : 'CREATE_SECTOR')}
                    </button>
                    {loading && (
                      <div className="absolute inset-0 pointer-events-none">
                        <div className="h-full w-1/3 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full animate-[scan_1.5s_linear_infinite]" />
                      </div>
                    )}
                  </div>
                </motion.form>
              )}

            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* Decorative SVG HUD Corners (Low opacity context) */}
      <svg className="absolute top-4 left-4 w-12 h-12 opacity-20 pointer-events-none" viewBox="0 0 100 100">
        <path d="M 0 30 L 0 0 L 30 0" fill="none" stroke="var(--color-cyan-neon)" strokeWidth="1" />
      </svg>
      <svg className="absolute bottom-4 right-4 w-12 h-12 opacity-20 pointer-events-none rotate-180" viewBox="0 0 100 100">
        <path d="M 0 30 L 0 0 L 30 0" fill="none" stroke="var(--color-cyan-neon)" strokeWidth="1" />
      </svg>
    </motion.main>
  );
}
