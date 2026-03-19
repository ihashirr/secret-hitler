import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share, Download, Smartphone, AlertOctagon, Terminal, ChevronRight } from 'lucide-react';

export default function InstallGate({ children }) {
  const [isStandalone, setIsStandalone] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [checking, setChecking] = useState(true);
  const [stage, setStage] = useState('INIT'); // INIT, ERROR, BYPASS
  const [progress, setProgress] = useState(0);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    // Listen for install prompt on Android
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Detect standalone mode and mobile
    const checkStatus = () => {
      const standalone = window.matchMedia('(display-mode: standalone)').matches || 
                         (window.navigator).standalone || 
                         document.referrer.includes('android-app://');
      
      const mobile = /iphone|ipad|ipod|android/i.test(window.navigator.userAgent.toLowerCase());
      
      setIsStandalone(!!standalone);
      setIsMobile(mobile);
      
      // Artificial delay for cinematic feedback
      let p = 0;
      const interval = setInterval(() => {
        p += Math.random() * 8;
        if (p >= 100) {
          p = 100;
          clearInterval(interval);
          setTimeout(() => {
            if (mobile && !standalone) {
              setStage('ERROR');
            } else {
              setChecking(false);
            }
          }, 800);
        }
        setProgress(p);
      }, 60);
    };

    checkStatus();
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleAndroidInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      alert("Please use 'Add to Home Screen' in your browser menu.");
    }
  };

  if (!checking && (isStandalone || !isMobile || stage === 'BYPASS')) {
    return <>{children}</>;
  }

  const isIOS = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());

  return (
    <div className="fixed inset-0 z-[1000] bg-zinc-950 flex flex-col items-center justify-center p-6 sm:p-10 font-mono overflow-hidden">
      {/* Background Grids */}
      <div className="absolute inset-0 opacity-10 floor-grid pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent pointer-events-none" />

      <motion.div 
        className="w-full max-w-lg z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {stage === 'INIT' ? (
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3 text-cyan-400">
              <Terminal size={20} className="animate-pulse" />
              <span className="text-sm tracking-[0.3em] font-bold uppercase">System_Initialization</span>
            </div>

            <div className="tactical-panel p-6 border-cyan-500/30 bg-black/40">
              <div className="flex justify-between text-[10px] text-cyan-500/60 mb-2 uppercase tracking-widest">
                <span>Establishing_Uplink</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="h-1.5 w-full bg-cyan-950/50 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-cyan-400 shadow-[0_0_10px_rgba(0,240,255,0.6)]"
                  style={{ width: `${progress}%` }}
                />
              </div>
              
              <div className="mt-8 flex flex-col gap-2">
                <p className="text-[10px] text-cyan-400/40 uppercase font-mono"> {'>'} Checking hardware abstraction...</p>
                {progress > 40 && <p className="text-[10px] text-cyan-400/40 uppercase font-mono"> {'>'} Environment signature detected</p>}
                {progress > 70 && <p className="text-[10px] text-cyan-400/40 uppercase font-mono"> {'>'} Securing data packets...</p>}
              </div>
            </div>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div 
              key="error"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col gap-8"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-red-500/10 border-2 border-red-500/30 flex items-center justify-center mb-6 transform rotate-45 shadow-[0_0_30px_rgba(239,68,68,0.1)]">
                  <AlertOctagon size={32} className="text-red-500 -rotate-45 drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
                </div>
                <h2 className="text-2xl font-black text-red-500 tracking-[0.2em] uppercase neon-text-crimson mb-2">Access_Denied</h2>
                <p className="text-red-400/60 text-xs tracking-widest uppercase mb-8">Security Protocol Error: Browser Environment</p>
                
                <div className="tactical-panel p-6 sm:p-8 bg-black/60 border-red-500/20 w-full relative">
                  <p className="text-cyan-50 text-xs sm:text-sm mb-8 leading-relaxed tracking-wide font-mono">
                    ECLIPSE requires <span className="text-cyan-400 font-bold uppercase">Standalone Tactical Client</span> to prevent interface leakage and ensure immersive comms.
                  </p>

                  <div className="flex flex-col gap-6 text-left">
                    <h3 className="text-[10px] font-bold text-cyan-400 uppercase tracking-[0.3em] border-l-2 border-cyan-400 pl-3">Deployment_Steps:</h3>
                    
                    {isIOS ? (
                      <div className="flex flex-col gap-4">
                        <div className="flex items-start gap-4 p-4 bg-cyan-950/20 border border-cyan-500/10">
                          <div className="w-10 h-10 shrink-0 flex items-center justify-center border border-cyan-400/40 bg-black/40">
                            <Share size={20} className="text-cyan-400" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-cyan-400 text-xs font-bold uppercase mb-1">Step 1</span>
                            <span className="text-[10px] text-cyan-300/60 uppercase leading-tight">tap 'share' icon at the bottom</span>
                          </div>
                        </div>
                        <div className="flex items-start gap-4 p-4 bg-cyan-950/20 border border-cyan-500/10">
                          <div className="w-10 h-10 shrink-0 flex items-center justify-center border border-cyan-400/40 bg-black/40">
                            <Download size={20} className="text-cyan-400" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-cyan-400 text-xs font-bold uppercase mb-1">Step 2</span>
                            <span className="text-[10px] text-cyan-300/60 uppercase leading-tight">select 'add to home screen'</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-4 p-5 bg-cyan-950/30 border border-cyan-400 hover:bg-cyan-500/20 transition-all cursor-pointer group" onClick={handleAndroidInstall}>
                          <Download size={24} className="text-cyan-400 group-hover:scale-110 transition-transform" />
                          <div className="flex flex-col">
                            <span className="text-cyan-400 text-sm font-bold uppercase mb-0.5 font-sans">Initialize_Client</span>
                            <span className="text-[9px] text-cyan-400/50 uppercase">Deploy directly to device</span>
                          </div>
                          <ChevronRight size={16} className="ml-auto text-cyan-400/40" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-12 flex flex-col items-center gap-4">
                  <p className="text-[9px] text-white/20 uppercase tracking-[0.2em]">Fullscreen engagement is mandatory for high-tier operatives.</p>
                  <button 
                    onClick={() => setStage('BYPASS')}
                    className="text-[10px] text-red-500/40 hover:text-red-500 transition-colors uppercase tracking-[0.15em] border-b border-red-500/0 hover:border-red-500/40 pb-1"
                  >
                    Proceed in Low-Security (Browser)
                  </button>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </motion.div>
    </div>
  );
}
