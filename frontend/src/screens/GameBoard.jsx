import React from 'react';
import { motion } from 'framer-motion';
import { PHASES, ROLES, FACTIONS, FASCIST_TO_WIN, LIBERAL_TO_WIN, MAX_ELECTION_TRACKER } from '../constants';
import { Shield, Skull, Crown, Star, AlertTriangle, LogOut } from 'lucide-react';

export default function GameBoard({ gameState, playerId, onNominate, onVote, onDiscard, onEnact, onExit }) {
  const me = gameState.players.find(p => p.id === playerId);
  
  // Handlers for child components
  const canNominate = gameState.phase === PHASES.NOMINATION && gameState.currentPresident === playerId;
  
  const handleNominate = (id) => {
    if (canNominate) onNominate(id);
  };

  // Render tracks
  const renderTrack = (current, max, type) => {
    const isFascist = type === 'FASCIST';
    const activeColor = isFascist ? 'bg-red-500 shadow-[0_0_15px_rgba(255,0,60,0.8)]' : 'bg-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.8)]';
    const inactiveColor = isFascist ? 'bg-black border border-red-500/20' : 'bg-black border border-cyan-500/20';
    const lineColor = isFascist ? 'bg-red-500/30' : 'bg-cyan-500/30';

    return (
      <div className="flex items-center w-full mb-4 px-2">
        {Array.from({ length: max }).map((_, i) => (
          <React.Fragment key={i}>
            <div 
              className={`w-10 h-10 flex-shrink-0 flex items-center justify-center transition-all duration-500 relative z-10 
                ${i < current ? activeColor : inactiveColor} 
                ${i === max - 1 ? 'transform rotate-45' : 'rounded-sm'}`}
            >
              <div className={i === max - 1 ? '-rotate-45' : ''}>
                {i < current && (isFascist ? <Skull size={16} className="text-white" /> : <Shield size={16} className="text-white" />)}
              </div>
            </div>
            {i < max - 1 && (
              <div className={`flex-1 h-0.5 ${i < current - 1 ? activeColor : lineColor} transition-colors duration-500`} />
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };

  // VOTE PORTAL
  const [hasVotedLocal, setHasVotedLocal] = React.useState(false);

  // Reset local vote state when phase changes
  React.useEffect(() => {
    if (gameState.phase !== PHASES.VOTING) {
      setHasVotedLocal(false);
    }
  }, [gameState.phase]);

  const handleVote = (approve) => {
    onVote(approve);
    setHasVotedLocal(true);
  };

  // Radial positioning logic
  const alivePlayers = gameState.players.filter(p => p.isAlive || p.id === playerId);
  const totalSlots = alivePlayers.length;
  // Arc from -60 to 60 degrees (total 120 deg spread)
  const arcSpread = 160;
  const startAngle = -arcSpread / 2;

  // Mission Status Descriptions
  const getStatusText = () => {
    const presidentName = gameState.players.find(p => p.id === gameState.currentPresident)?.name || 'UNKNOWN';
    const chancellorName = gameState.players.find(p => p.id === gameState.nominatedChancellor)?.name || 'UNKNOWN';

    switch (gameState.phase) {
      case PHASES.NOMINATION:
        return `NOMINATION_PROTOCOL: PRESIDENT ${presidentName} ANALYIZING CANDIDATES...`;
      case PHASES.VOTING:
        return `VOTING_AUTH: ALL OPERATIVES MUST AUTHENTICATE CHANCELLOR ${chancellorName}.`;
      case PHASES.LEGISLATIVE_PRESIDENT:
        return `LEGISLATIVE_DECRYPT: PRESIDENT ${presidentName} IS DISCARDING POLICY INTEL...`;
      case PHASES.LEGISLATIVE_CHANCELLOR:
        return `LEGISLATIVE_ENACT: CHANCELLOR ${gameState.players.find(p=>p.id===gameState.currentChancellor)?.name} IS ENFORCING POLICY...`;
      case PHASES.EXECUTIVE_ACTION:
        return `TACTICAL_OVERRIDE: PRESIDENT ${presidentName} EXECUTING DIRECTIVE...`;
      case PHASES.GAME_OVER:
        return `MISSION_TERMINATED: TRANSMITTING FINAL DEBRIEF...`;
      default:
        return 'SYSTEM_STABLE: MONITORING_SECTOR';
    }
  };

  return (
    <div className="min-h-[100dvh] w-full flex flex-col relative overflow-hidden bg-obsidian-950 war-room-perspective">
      {/* Floor Grid Decoration */}
      <div className="absolute inset-0 z-0 floor-grid opacity-30 pointer-events-none" />

      {/* MISSION STATUS HUD (Floating) */}
      <div className="fixed top-0 inset-x-0 z-[100] flex justify-center p-4 pointer-events-none">
        <motion.div 
           initial={{ y: -100, opacity: 0 }}
           animate={{ y: 0, opacity: 1 }}
           className="w-full max-w-xl h-10 bg-black/60 border-x border-b border-cyan-500/30 backdrop-blur-md flex items-center px-4 relative overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
        >
           {/* Scanning Line Animation */}
           <motion.div 
              animate={{ x: [-500, 500] }}
              transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
              className="absolute inset-y-0 w-24 bg-gradient-to-r from-transparent via-cyan-400/10 to-transparent pointer-events-none"
           />
           
           <div className="flex items-center gap-3 w-full">
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <div className="flex flex-col">
                 <span className="text-[7px] font-mono text-cyan-500/50 uppercase tracking-[0.4em] leading-none mb-0.5">Mission_Live_Context</span>
                 <span className="text-[9px] font-mono text-cyan-400 font-bold uppercase tracking-widest truncate max-w-[80vw]">
                    {getStatusText()}
                 </span>
              </div>
           </div>

           {/* Top Right HUD Metadata */}
           <div className="hidden sm:flex items-center gap-4 ml-auto border-l border-cyan-500/10 pl-4 h-full">
              <div className="flex flex-col items-end">
                 <span className="text-[7px] font-mono text-cyan-500/30 uppercase tracking-tighter">PHASE_SYNC</span>
                 <span className="text-[8px] font-mono text-cyan-500/60 font-bold">{gameState.phase}</span>
              </div>
           </div>
        </motion.div>
      </div>
      
      {/* Command Surface (The "Table") */}
      <div className="absolute inset-x-0 top-0 h-[60%] table-surface z-10 flex flex-col items-center justify-center p-4">
        <div className="tactical-panel w-full max-w-2xl p-6 mt-8 border-b-4 border-cyan-500/20 shadow-[0_30px_60px_rgba(0,0,0,0.8)] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
          
          <div className="flex justify-between items-center mb-6">
             <div className="text-left">
                <span className="text-[10px] font-mono uppercase tracking-[0.4em] text-cyan-500/60 block mb-1">// COMMAND_CENTER</span>
                <h3 className="text-sm font-mono text-cyan-400 font-bold uppercase tracking-widest flex items-center gap-2">
                   <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" /> 
                   LIVE_INTEL_SYSTEM
                </h3>
             </div>
             <button onClick={onExit} className="text-[10px] text-cyan-500/40 hover:text-red-500 flex items-center gap-1 uppercase font-mono tracking-widest border border-cyan-500/20 px-3 py-1 bg-black/40">
                <LogOut size={12} /> Exit_Session
             </button>
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-end mb-2">
                <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-cyan-400 neon-text-cyan">{'>'} LIBERAL_POLICIES [{gameState.liberalPolicies}/{LIBERAL_TO_WIN}]</span>
              </div>
              {renderTrack(gameState.liberalPolicies, LIBERAL_TO_WIN, 'LIBERAL')}
            </div>
            
            <div>
              <div className="flex justify-between items-end mb-2">
                <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-red-500 neon-text-crimson">{'>'} FASCIST_POLICIES [{gameState.fascistPolicies}/{FASCIST_TO_WIN}]</span>
              </div>
              {renderTrack(gameState.fascistPolicies, FASCIST_TO_WIN, 'FASCIST')}
            </div>
          </div>

          {/* Election Tracker HUD */}
          <div className="mt-8 flex justify-between items-center text-[9px] font-mono text-cyan-500/40 border-t border-cyan-500/10 pt-4 uppercase tracking-[0.3em]">
             <span>Election_Chaos_Level</span>
             <div className="flex gap-3">
               {Array.from({ length: MAX_ELECTION_TRACKER }).map((_, i) => (
                 <div 
                   key={i} 
                   className={`w-4 h-4 border ${i < gameState.electionTracker ? 'bg-red-500 border-red-400 shadow-[0_0_15px_rgba(255,0,60,0.6)]' : 'border-cyan-500/20 bg-obsidian-900'} transform rotate-45 transition-all duration-500`}
                 />
               ))}
             </div>
          </div>
        </div>
      </div>

      {/* Operative Ring (The radial arc) */}
      <div className="absolute inset-x-0 bottom-[-10%] h-[50%] z-20 flex items-center justify-center">
        <div className="relative w-full h-full max-w-4xl mx-auto">
          {gameState.players.map((p, i) => {
            const isMe = p.id === playerId;
            const isPresident = p.id === gameState.currentPresident;
            const isChancellor = p.id === gameState.currentChancellor || p.id === gameState.nominatedChancellor;
            const isSelectable = canNominate && p.isAlive && !isMe;

            // Calculate angle and position
            const angle = startAngle + (i * (arcSpread / (gameState.players.length - 1)));
            const radius = 220; // Radius of the arc
            const x = Math.sin(angle * (Math.PI / 180)) * radius;
            const y = -Math.cos(angle * (Math.PI / 180)) * (radius * 0.4); // Squish Y for perspective
            
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ 
                   opacity: 1, 
                   scale: isMe ? 1.15 : 1, 
                   x: `${x}px`, 
                   y: `${y}px`,
                   rotate: angle / 3, // Tilt card based on position
                   z: isMe ? 50 : 0
                }}
                className={`absolute left-1/2 top-1/2 -ml-16 -mt-20 w-32 h-44 z-10 transition-shadow duration-300`}
              >
                <div 
                   onClick={() => handleNominate(p.id)}
                   className={`w-full h-full tactical-panel p-3 flex flex-col items-center justify-center text-center relative overflow-hidden transition-all
                    ${isSelectable ? 'cursor-pointer hover:border-cyan-400 hover:shadow-[0_0_20px_rgba(0,240,255,0.3)]' : 'cursor-default'}
                    ${isMe ? 'border-2 border-cyan-400 shadow-[0_0_25px_rgba(0,240,255,0.2)]' : 'border-cyan-500/10'}
                    ${!p.isAlive ? 'grayscale opacity-50' : ''}
                   `}
                >
                  {/* Status Indicator Beams & HUD */}
                  {isPresident && (
                    <>
                      <div className="absolute top-0 left-0 w-full h-1 bg-gold-400 shadow-[0_0_15px_rgba(201,162,39,0.8)] z-20" />
                      <div className="absolute -top-32 left-1/2 -translateX-1/2 transform translate-z-[100px] pointer-events-none">
                         <motion.div 
                            animate={{ y: [0, -5, 0] }} 
                            transition={{ repeat: Infinity, duration: 3 }}
                            className="bg-gold-500/20 border border-gold-500 text-gold-400 font-mono text-[8px] px-2 py-0.5 whitespace-nowrap uppercase tracking-[0.4em] shadow-[0_0_20px_rgba(201,162,39,0.4)]"
                         >
                            PRESIDENT_ACTIVE
                         </motion.div>
                         <div className="w-[1px] h-32 bg-gradient-to-t from-gold-400 to-transparent mx-auto opacity-50" />
                      </div>
                    </>
                  )}
                  {isChancellor && (
                    <>
                      <div className="absolute top-0 left-0 w-full h-1 bg-white shadow-[0_0_15px_white] z-20" />
                      <div className="absolute -top-32 left-1/2 -translateX-1/2 transform translate-z-[100px] pointer-events-none">
                         <motion.div 
                            animate={{ y: [0, -5, 0] }} 
                            transition={{ repeat: Infinity, duration: 3, delay: 0.5 }}
                            className="bg-white/10 border border-white text-white font-mono text-[8px] px-2 py-0.5 whitespace-nowrap uppercase tracking-[0.4em] shadow-[0_0_20px_rgba(255,255,255,0.4)]"
                         >
                            CHANCELLOR_ACTIVE
                         </motion.div>
                         <div className="w-[1px] h-32 bg-gradient-to-t from-white to-transparent mx-auto opacity-50" />
                      </div>
                    </>
                  )}
                  
                  <div className={`w-12 h-12 mb-3 flex items-center justify-center border transform rotate-45 transition-all
                    ${isPresident ? 'border-gold-500 bg-gold-500/10 text-gold-400 shadow-[0_0_10px_rgba(201,162,39,0.3)]' : 
                      isChancellor ? 'border-white bg-white/10 text-white shadow-[0_0_10px_white]' : 
                      'border-cyan-500/30 bg-cyan-950/20 text-cyan-400'}`}
                  >
                    <div className="-rotate-45">
                      {isPresident ? <Crown size={20} /> : isChancellor ? <Star size={20} /> : <span>{p.name.charAt(0)}</span>}
                    </div>
                  </div>

                  <span className={`font-mono text-[10px] uppercase tracking-widest break-all mb-1 ${!p.isAlive ? 'line-through text-red-500' : 'text-white'}`}>
                    {p.name}
                  </span>
                  
                  {isMe && <span className="text-[7px] font-mono text-cyan-400 uppercase tracking-widest opacity-60">Operative_Self</span>}
                  
                  {/* Governance Tag */}
                  {(isPresident || isChancellor) && (
                    <div className={`mt-2 text-[7px] font-mono p-1 uppercase tracking-widest border
                      ${isPresident ? 'text-gold-400 border-gold-500/30 bg-gold-950/20' : 'text-white border-white/30 bg-white/10'}`}>
                      {isPresident ? 'President' : 'Chancellor'}
                    </div>
                  )}

                  {/* Voted Indicator */}
                  {p.hasVoted && (
                    <div className="absolute top-2 right-2 w-2 h-2 bg-cyan-400 rounded-full shadow-[0_0_10px_rgba(0,240,255,1)] animate-pulse" />
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Overlays */}
      {gameState.phase === PHASES.VOTING && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-6">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="tactical-panel w-full max-w-sm p-8 flex flex-col items-center"
          >
            <h2 className="text-xl font-mono text-cyan-400 mb-2 uppercase tracking-[0.3em] neon-text-cyan">Direct_Vote</h2>
            
            {hasVotedLocal || me?.hasVoted ? (
               <div className="text-center py-8">
                 <div className="w-10 h-10 border-2 border-cyan-500/20 border-t-cyan-400 animate-spin mx-auto mb-6 transform rotate-45" />
                 <p className="text-cyan-400 font-mono text-xs tracking-[0.2em] uppercase">Auth_Confirmed</p>
               </div>
            ) : (
              <>
                <p className="text-white/60 mb-8 text-center font-mono text-xs uppercase tracking-[0.2em]">
                  Authenticate <span className="text-white">{gameState.players.find(p=>p.id===gameState.nominatedChancellor)?.name}</span>?
                </p>
                <div className="flex gap-6 w-full">
                  <button onClick={() => handleVote(true)} className="flex-1 aspect-square bg-cyan-950/40 border border-cyan-400 flex flex-col items-center justify-center gap-3 hover:bg-cyan-500/20 transition-all">
                    <Shield size={32} className="text-cyan-400" />
                    <span className="text-lg font-black font-sans text-cyan-400 uppercase tracking-widest">JA!</span>
                  </button>
                  <button onClick={() => handleVote(false)} className="flex-1 aspect-square bg-red-950/40 border border-red-500 flex flex-col items-center justify-center gap-3 hover:bg-red-500/20 transition-all">
                    <AlertTriangle size={32} className="text-red-500" />
                    <span className="text-lg font-black font-sans text-red-500 uppercase tracking-widest">NEIN!</span>
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}

      {/* LEGISLATIVE OVERLAY */}
      {(gameState.phase === PHASES.LEGISLATIVE_PRESIDENT || gameState.phase === PHASES.LEGISLATIVE_CHANCELLOR) && (
        <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-xl flex flex-col p-6 items-center justify-center">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-mono text-cyan-400 tracking-[0.3em] uppercase neon-text-cyan">{'>'} POLICY_DECRYPT</h2>
            <p className="text-white/40 font-mono text-[9px] uppercase tracking-[0.5em] mt-2">Level 7 Operative Authorization Required</p>
          </div>
          
          <div className="flex gap-6 justify-center w-full max-w-4xl">
            {gameState.drawnCards?.length > 0 ? (
               hasVotedLocal ? (
                  <div className="text-center py-12">
                     <div className="w-12 h-12 border-2 border-cyan-500/20 border-t-cyan-400 animate-spin mx-auto mb-4" />
                     <p className="text-cyan-400 font-mono text-xs uppercase tracking-widest">TRANSMITTING...</p>
                  </div>
               ) : (
                gameState.drawnCards.map((card, i) => (
                  <motion.button
                    key={i}
                    whileHover={{ y: -20, scale: 1.05 }}
                    onClick={() => {
                        handleVote(i);
                        if (gameState.phase === PHASES.LEGISLATIVE_PRESIDENT) onDiscard(i);
                        else onEnact(i);
                    }}
                    className={`relative w-32 h-48 border-2 flex flex-col items-center justify-center transition-all group
                      ${card === 'LIBERAL' ? 'bg-cyan-950/40 border-cyan-400 shadow-[0_0_20px_rgba(0,240,255,0.2)]' : 'bg-red-950/40 border-red-500 shadow-[0_0_20px_rgba(255,0,60,0.2)]'}
                      ${(gameState.phase === PHASES.LEGISLATIVE_PRESIDENT && !isPresident) || 
                        (gameState.phase === PHASES.LEGISLATIVE_CHANCELLOR && !isChancellor) ? 'pointer-events-none opacity-40' : ''}
                    `}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
                    {card === 'LIBERAL' ? <Shield size={40} className="text-cyan-400 mb-4" /> : <Skull size={40} className="text-red-500 mb-4" />}
                    <span className={`font-mono text-[10px] font-bold tracking-widest ${card === 'LIBERAL' ? 'text-cyan-400' : 'text-red-500'}`}>{card}</span>
                    
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-black/60 flex items-center justify-center transition-opacity">
                       <span className="text-[10px] font-mono text-white border-y border-white/50 py-1 px-3">
                          {gameState.phase === PHASES.LEGISLATIVE_PRESIDENT ? 'DISCARD' : 'ENACT'}
                       </span>
                    </div>
                  </motion.button>
                ))
               )
            ) : (
               <div className="text-center text-cyan-500/50 font-mono animate-pulse uppercase tracking-[0.2em] text-xs">Awaiting encrypted manifest...</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
