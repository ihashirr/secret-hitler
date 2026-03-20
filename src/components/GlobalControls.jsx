import React, { useState, useEffect } from 'react';
import { AlertTriangle, ShieldAlert, LogOut, Terminal, MoreVertical, Settings, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function GlobalControls({ gameState, playerId, onReset, onWipe, onExit }) {
  const me = gameState?.players?.find(p => p.id === playerId);
  const isHost = me?.isHost;
  const [showHostMenu, setShowHostMenu] = useState(false);
  const [activeModal, setActiveModal] = useState(null); // 'wipe' | 'reset'
  const [modalInput, setModalInput] = useState('');

  // Handle Escape key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        setActiveModal(null);
        setShowHostMenu(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  if (!me) return null;

  const handleWipe = () => {
    onWipe();
    setActiveModal(null);
    setModalInput('');
  };

  const handleReset = () => {
    onReset();
    setActiveModal(null);
  };

  return (
    <>
      {/* Global Click-outside underlay for Host Menu */}
      <AnimatePresence>
        {showHostMenu && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowHostMenu(false)}
            className="fixed inset-0 z-[205] bg-transparent pointer-events-auto"
          />
        )}
      </AnimatePresence>

      <motion.div
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={`fixed top-0 left-0 right-0 backdrop-blur-md shadow-lg border-b ${isHost ? 'border-red-500/30' : 'border-cyan-500/10'} ${showHostMenu ? 'z-[210]' : 'z-[200]'} bg-black/90 transition-all duration-300`}
      >
        {/* Main bar */}
        <div className="flex items-center justify-between px-3 py-2 gap-2">
          {/* Left: Identity */}
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            {isHost ? <ShieldAlert size={12} className="text-red-500 shrink-0" /> : <Terminal size={12} className="text-cyan-500/50 shrink-0" />}
            <span className={`text-[9.5px] font-mono font-bold uppercase tracking-widest truncate ${isHost ? 'text-red-400' : 'text-cyan-500/50'}`}>
              {me.name}<span className="text-white/20">@</span>{gameState.roomId}
            </span>
          </div>

          {/* Right: Action Buttons */}
          <div className="flex items-center gap-2 shrink-0 relative">
            {isHost && (
              <div className="relative">
                <button
                  onClick={() => setShowHostMenu(!showHostMenu)}
                  className={`flex items-center justify-center w-7 h-7 transition-all rounded-sm relative z-[210] ${showHostMenu ? 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]' : 'bg-red-950/30 border border-red-500/40 text-red-400 hover:bg-red-500/20'}`}
                >
                  {showHostMenu ? <X size={14} /> : <Settings size={14} />}
                </button>

                <AnimatePresence>
                  {showHostMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 5, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 5, scale: 0.95 }}
                      className="absolute right-0 top-full mt-0 w-40 bg-black backdrop-blur-xl border border-white/10 shadow-2xl p-1 rounded-sm z-[210] pointer-events-auto"
                    >
                      <div className="px-2 py-1 mb-0.5">
                        <span className="text-[7px] font-mono text-white/20 uppercase tracking-[0.2em] font-normal">System Actions</span>
                      </div>
                      
                      <button
                        onClick={() => {
                          setShowHostMenu(false);
                          setActiveModal('wipe');
                        }}
                        className="group relative flex items-center gap-2 px-2 py-1.5 bg-transparent hover:bg-red-500/10 text-red-500 transition-all text-[8.5px] font-mono font-black uppercase tracking-widest text-left rounded-sm overflow-hidden"
                      >
                        <AlertTriangle size={10} className="text-red-500 group-hover:scale-110 transition-transform" /> DESTROY DB
                      </button>

                      <button
                        onClick={() => {
                          setShowHostMenu(false);
                          setActiveModal('reset');
                        }}
                        className="group relative flex items-center gap-2 px-2 py-1.5 bg-transparent hover:bg-white/5 text-white/40 hover:text-white/80 transition-all text-[8px] font-mono font-bold uppercase tracking-widest text-left rounded-sm overflow-hidden"
                      >
                        <ShieldAlert size={10} className="text-white/20 group-hover:text-white/60 transition-colors" /> DELETE SESSION
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            <button
              onClick={onExit}
              className="flex items-center gap-1.5 h-7 px-3 bg-black/40 border border-white/10 text-white/40 hover:text-red-500 hover:border-red-500/30 transition-all text-[9.5px] font-mono font-bold uppercase tracking-widest rounded-sm"
            >
              <LogOut size={11} />
              <span className="hidden xs:inline">ABORT</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Custom System Modal */}
      <AnimatePresence>
        {activeModal && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveModal(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="w-full max-w-[320px] bg-black border border-white/10 p-6 rounded-sm shadow-2xl relative overflow-hidden z-[310]"
            >
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-red-500/40 to-transparent" />
              
              <h2 className={`text-[10px] font-mono font-black uppercase tracking-[0.3em] mb-3 ${activeModal === 'wipe' ? 'text-red-500' : 'text-white/60'}`}>
                {activeModal === 'wipe' ? 'Critical Override Required' : 'Session Termination'}
              </h2>
              
              <p className="text-[9px] font-mono text-white/40 leading-relaxed mb-6 uppercase tracking-wider">
                {activeModal === 'wipe' 
                  ? 'This action will PERMANENTLY ERASE all database records. This protocol is irreversible.' 
                  : 'This will terminate the current tactical session for all operatives. Proceed?'}
              </p>

              {activeModal === 'wipe' && (
                <div className="mb-6">
                  <label className="block text-[7px] font-mono text-red-500/50 uppercase mb-2 tracking-widest font-bold">Type "ECLIPSE" to authorize</label>
                  <input 
                    autoFocus
                    type="text" 
                    value={modalInput}
                    onChange={(e) => setModalInput(e.target.value.toUpperCase())}
                    className="w-full bg-red-500/5 border border-red-500/10 px-3 py-2 text-red-500 font-mono text-[10px] tracking-[0.2em] focus:outline-none focus:border-red-500/30 rounded-sm"
                    placeholder="CODE"
                  />
                </div>
              )}

              <div className="flex gap-2">
                <button 
                  onClick={() => setActiveModal(null)}
                  className="flex-1 py-3 border border-white/5 text-white/20 hover:text-white/40 hover:bg-white/5 transition-all text-[8.5px] font-mono font-bold uppercase tracking-widest rounded-sm"
                >
                  Abort
                </button>
                <button 
                  onClick={activeModal === 'wipe' ? handleWipe : handleReset}
                  disabled={activeModal === 'wipe' && modalInput !== 'ECLIPSE'}
                  className={`flex-1 py-3 font-mono font-black text-[8.5px] uppercase tracking-widest transition-all rounded-sm ${
                    activeModal === 'wipe' 
                      ? 'bg-red-500 text-black hover:bg-red-400 disabled:opacity-20 disabled:grayscale' 
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  {activeModal === 'wipe' ? 'Execute' : 'Proceed'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
