import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function Splash({ onConnect }) {
  const [name, setName] = useState('');
  const [roomId, setRoomId] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const room = params.get('room');
    return room ? room.toUpperCase().substring(0, 4) : '';
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a name');
      return;
    }
    
    setLoading(true);
    setError('');
    
    // Generate random 4 letter room ID if creating new
    const finalRoomId = roomId.trim().toUpperCase() || Math.random().toString(36).substring(2, 6).toUpperCase();
    
    try {
      await onConnect(name.trim(), finalRoomId);
    } catch (err) {
      setError(err.message || 'Failed to connect');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] rounded-full bg-cyan-dark/20 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-crimson-dark/20 blur-[120px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="z-10 w-full max-w-sm"
      >
        <div className="text-center mb-12">
          <h1 className="text-6xl font-sans font-black tracking-[0.2em] mb-2 text-white neon-text-cyan">
            SECRET
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-cyan-600 neon-text-cyan">
              HITLER
            </span>
          </h1>
          <p className="text-cyan-400/80 tracking-[0.3em] text-xs font-mono uppercase mt-4">Tactical Intelligence Dashboard</p>
        </div>

        <form onSubmit={handleJoin} className="tactical-panel p-8 flex flex-col gap-6 relative overflow-hidden">
          {/* Decorative Corner Accents */}
          <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyan-500/50" />
          <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyan-500/50" />
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyan-500/50" />
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-cyan-500/50" />

          {error && (
            <div className="bg-red-500/10 border-l-2 border-red-500 text-red-400 text-xs font-mono p-3">
              {'>'} ERROR: {error}
            </div>
          )}
          
          <div className="flex flex-col gap-2">
            <label className="text-[10px] uppercase tracking-widest text-cyan-500/60 font-mono">_Operative_ID</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value.substring(0, 12))}
              placeholder="Enter name"
              className="bg-black/50 border border-cyan-500/20 p-4 text-cyan-50 font-mono placeholder-cyan-900 focus:outline-none focus:border-cyan-400 focus:bg-cyan-900/10 transition-colors"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] uppercase tracking-widest text-cyan-500/60 font-mono">_Sector_Code</label>
            <input 
              type="text" 
              value={roomId}
              onChange={(e) => setRoomId(e.target.value.toUpperCase().substring(0, 4))}
              placeholder="Leave blank to create securely"
              className="bg-black/50 border border-cyan-500/20 p-4 text-cyan-50 font-mono tracking-[0.2em] uppercase placeholder-cyan-900 focus:outline-none focus:border-cyan-400 focus:bg-cyan-900/10 transition-colors"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="mt-4 bg-cyan-600 text-white font-mono font-bold uppercase tracking-[0.1em] p-4 text-sm hover:bg-cyan-500 border border-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.3)] hover:shadow-[0_0_25px_rgba(0,240,255,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'AUTHENTICATING...' : (roomId ? 'INITIALIZE CONNECTION' : 'GENERATE SECTOR')}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
