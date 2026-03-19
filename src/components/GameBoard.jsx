import React from 'react';
import { motion } from 'framer-motion';
import { PHASES, ROLES, FACTIONS, FASCIST_TO_WIN, LIBERAL_TO_WIN, MAX_ELECTION_TRACKER } from '../lib/constants';
import { Shield, Skull, Crown, Star, AlertTriangle } from 'lucide-react';

export default function GameBoard({ gameState, playerId, onNominate, onVote, onDiscard, onEnact, onKill, onExit, onReset }) {
  const me = gameState.players.find(p => p.id === playerId);
  const isPresident = playerId === gameState.currentPresident;
  const isChancellor = playerId === gameState.currentChancellor;

  const canNominate = gameState.phase === PHASES.NOMINATION && isPresident;
  const canKill = gameState.phase === PHASES.EXECUTIVE_ACTION && isPresident;
  const handleNominate = (id) => { if (canNominate) onNominate(id); };

  // Track renderer
  const renderTrack = (current, max, type) => {
    const isFascist = type === 'FASCIST';
    const activeColor = isFascist ? 'bg-red-500 shadow-[0_0_10px_rgba(255,0,60,0.8)]' : 'bg-cyan-400 shadow-[0_0_10px_rgba(0,240,255,0.8)]';
    const inactiveColor = isFascist ? 'bg-black border border-red-500/20' : 'bg-black border border-cyan-500/20';
    const lineColor = isFascist ? 'bg-red-500/30' : 'bg-cyan-500/30';

    return (
      <div className="flex items-center w-full">
        {Array.from({ length: max }).map((_, i) => (
          <React.Fragment key={i}>
            <div className={`w-7 h-7 sm:w-9 sm:h-9 flex-shrink-0 flex items-center justify-center transition-all duration-500 relative z-10
              ${i < current ? activeColor : inactiveColor}
              ${i === max - 1 ? 'transform rotate-45' : 'rounded-sm'}`}
            >
              <div className={i === max - 1 ? '-rotate-45' : ''}>
                {i < current && (isFascist ? <Skull size={12} className="text-white" /> : <Shield size={12} className="text-white" />)}
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

  const [hasActedLocal, setHasActedLocal] = React.useState(false);

  React.useEffect(() => {
    setHasActedLocal(false);
  }, [gameState.phase]);

  const handleVote = (approve) => { onVote(approve); setHasActedLocal(true); };
  const handleKill = (targetId) => { onKill(targetId); setHasActedLocal(true); };

  // Status text
  const getStatusText = () => {
    const pName = gameState.players.find(p => p.id === gameState.currentPresident)?.name || '?';
    const cName = gameState.players.find(p => p.id === gameState.nominatedChancellor)?.name || '?';
    switch (gameState.phase) {
      case PHASES.NOMINATION: return `PRESIDENT ${pName} SELECTING CHANCELLOR`;
      case PHASES.VOTING: return `VOTE: AUTHENTICATE CHANCELLOR ${cName}`;
      case PHASES.LEGISLATIVE_PRESIDENT: return `PRESIDENT ${pName} DISCARDING POLICY`;
      case PHASES.LEGISLATIVE_CHANCELLOR: return `CHANCELLOR ${gameState.players.find(p => p.id === gameState.currentChancellor)?.name} ENACTING POLICY`;
      case PHASES.EXECUTIVE_ACTION: return `PRESIDENT ${pName} EXECUTING DIRECTIVE`;
      case PHASES.GAME_OVER: return `MISSION TERMINATED`;
      default: return 'SYSTEM STABLE';
    }
  };

  return (
    <div className="min-h-[100dvh] w-full flex flex-col relative overflow-hidden bg-obsidian-950">
      {/* Floor Grid */}
      <div className="absolute inset-0 z-0 floor-grid opacity-20 pointer-events-none" />

      {/* MISSION STATUS HUD - stays below the global controls header */}
      <div className="fixed top-9 inset-x-0 z-[150] flex justify-center pointer-events-none px-2">
        <motion.div
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="w-full max-w-xl h-8 bg-black/70 border-x border-b border-cyan-500/20 backdrop-blur-md flex items-center px-3 gap-3 relative overflow-hidden"
        >
          <motion.div
            animate={{ x: [-300, 300] }}
            transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
            className="absolute inset-y-0 w-16 bg-gradient-to-r from-transparent via-cyan-400/10 to-transparent pointer-events-none"
          />
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shrink-0" />
          <span className="text-[8px] sm:text-[9px] font-mono text-cyan-400 font-bold uppercase tracking-widest truncate">
            {getStatusText()}
          </span>
          <span className="ml-auto text-[7px] font-mono text-cyan-500/40 uppercase shrink-0">{gameState.phase}</span>
        </motion.div>
      </div>

      {/* Main layout: top = command center, bottom = player ring */}
      <div className="flex flex-col h-[100dvh] pt-16 pb-4 px-3 sm:px-4 gap-3">
        
        {/* COMMAND CENTER (policy tracks) */}
        <div className="tactical-panel p-4 sm:p-5 border border-cyan-500/20 relative shadow-[0_10px_30px_rgba(0,0,0,0.6)]">
          <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />
          
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />
            <span className="text-[9px] sm:text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-widest">LIVE_INTEL_SYSTEM</span>
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <span className="text-[8px] sm:text-[9px] font-mono uppercase tracking-widest text-cyan-400 neon-text-cyan mb-2 block">
                {'>'} LIBERAL [{gameState.liberalPolicies}/{LIBERAL_TO_WIN}]
              </span>
              {renderTrack(gameState.liberalPolicies, LIBERAL_TO_WIN, 'LIBERAL')}
            </div>
            <div>
              <span className="text-[8px] sm:text-[9px] font-mono uppercase tracking-widest text-red-500 neon-text-crimson mb-2 block">
                {'>'} FASCIST [{gameState.fascistPolicies}/{FASCIST_TO_WIN}]
              </span>
              {renderTrack(gameState.fascistPolicies, FASCIST_TO_WIN, 'FASCIST')}
            </div>
          </div>

          {/* Election Tracker */}
          <div className="mt-4 flex justify-between items-center text-[8px] font-mono text-cyan-500/40 border-t border-cyan-500/10 pt-3 uppercase tracking-widest">
            <span>Election_Chaos</span>
            <div className="flex gap-2.5">
              {Array.from({ length: MAX_ELECTION_TRACKER }).map((_, i) => (
                <div
                  key={i}
                  className={`w-3.5 h-3.5 sm:w-4 sm:h-4 border ${i < gameState.electionTracker ? 'bg-red-500 border-red-400 shadow-[0_0_10px_rgba(255,0,60,0.6)]' : 'border-cyan-500/20 bg-obsidian-900'} transform rotate-45 transition-all duration-500`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* PLAYER GRID — responsive flex-wrap instead of fixed radial */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 pb-2">
            {gameState.players.map((p) => {
              const isMe = p.id === playerId;
              const pIsPresident = p.id === gameState.currentPresident;
              const pIsChancellor = p.id === gameState.currentChancellor || p.id === gameState.nominatedChancellor;
              const isSelectable = canNominate && p.isAlive && !isMe;

              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`relative tactical-panel flex flex-col items-center justify-center text-center p-2 aspect-[3/4] transition-all overflow-hidden
                    ${isSelectable ? 'cursor-pointer hover:border-cyan-400 hover:shadow-[0_0_15px_rgba(0,240,255,0.3)]' : 'cursor-default'}
                    ${isMe ? 'border border-cyan-400 shadow-[0_0_20px_rgba(0,240,255,0.15)]' : 'border border-cyan-500/10'}
                    ${!p.isAlive ? 'grayscale opacity-40' : ''}
                    ${pIsPresident ? 'border-yellow-400/70 shadow-[0_0_15px_rgba(234,179,8,0.2)]' : ''}
                    ${pIsChancellor && !pIsPresident ? 'border-white/50 shadow-[0_0_15px_rgba(255,255,255,0.1)]' : ''}
                  `}
                  onClick={() => handleNominate(p.id)}
                >
                  {/* Role accent bar */}
                  {pIsPresident && <div className="absolute top-0 left-0 w-full h-0.5 bg-yellow-400 shadow-[0_0_8px_rgba(234,179,8,0.8)]" />}
                  {pIsChancellor && !pIsPresident && <div className="absolute top-0 left-0 w-full h-0.5 bg-white shadow-[0_0_8px_white]" />}
                  {isMe && !pIsPresident && !pIsChancellor && <div className="absolute top-0 left-0 w-full h-0.5 bg-cyan-400/60" />}

                  {/* Avatar */}
                  <div className={`w-9 h-9 sm:w-11 sm:h-11 mb-1.5 flex items-center justify-center border transform rotate-45 flex-shrink-0
                    ${pIsPresident ? 'border-yellow-400 bg-yellow-950/30 text-yellow-400 shadow-[0_0_8px_rgba(234,179,8,0.3)]' :
                      pIsChancellor ? 'border-white bg-white/10 text-white' :
                      'border-cyan-500/30 bg-cyan-950/20 text-cyan-400'}`}
                  >
                    <div className="-rotate-45 text-sm">
                      {pIsPresident ? <Crown size={16} /> : pIsChancellor ? <Star size={16} /> : <span className="font-mono text-xs font-bold">{p.name.charAt(0)}</span>}
                    </div>
                  </div>

                  {/* Name */}
                  <span className={`font-mono text-[9px] sm:text-[10px] uppercase tracking-widest truncate w-full px-1 ${!p.isAlive ? 'line-through text-red-500/60' : isMe ? 'text-cyan-300' : 'text-white/80'}`}>
                    {p.name}
                  </span>

                  {/* Role badge */}
                  {(pIsPresident || pIsChancellor) && (
                    <div className={`mt-1 text-[7px] font-mono px-1 border uppercase tracking-widest
                      ${pIsPresident ? 'text-yellow-400 border-yellow-500/30 bg-yellow-950/20' : 'text-white border-white/30 bg-white/10'}`}
                    >
                      {pIsPresident ? 'PRES' : 'CHAN'}
                    </div>
                  )}

                  {/* Selectable indicator */}
                  {isSelectable && (
                    <div className="absolute inset-0 border-2 border-cyan-400/0 hover:border-cyan-400/60 transition-all rounded-none" />
                  )}

                  {/* Voted dot */}
                  {p.hasVoted && (
                    <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-cyan-400 rounded-full shadow-[0_0_6px_rgba(0,240,255,1)] animate-pulse" />
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* VOTING OVERLAY */}
      {gameState.phase === PHASES.VOTING && (
        <div className="fixed inset-0 z-[300] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="tactical-panel w-full max-w-xs sm:max-w-sm p-6 sm:p-8 flex flex-col items-center"
          >
            <h2 className="text-lg sm:text-xl font-mono text-cyan-400 mb-2 uppercase tracking-[0.2em] neon-text-cyan">Direct_Vote</h2>

            {hasActedLocal ? (
              <div className="text-center py-8">
                <div className="w-10 h-10 border-2 border-cyan-500/20 border-t-cyan-400 animate-spin mx-auto mb-6 transform rotate-45" />
                <p className="text-cyan-400 font-mono text-xs tracking-[0.2em] uppercase">Auth_Confirmed — awaiting all votes...</p>
              </div>
            ) : (
              <>
                <p className="text-white/60 mb-6 text-center font-mono text-xs uppercase tracking-[0.15em]">
                  Authenticate <span className="text-white">{gameState.players.find(p => p.id === gameState.nominatedChancellor)?.name}</span>?
                </p>
                <div className="flex gap-4 w-full">
                  <button onClick={() => handleVote(true)} className="flex-1 aspect-square bg-cyan-950/40 border border-cyan-400 flex flex-col items-center justify-center gap-2 hover:bg-cyan-500/20 transition-all">
                    <Shield size={28} className="text-cyan-400" />
                    <span className="text-base font-black font-sans text-cyan-400 uppercase tracking-widest">JA!</span>
                  </button>
                  <button onClick={() => handleVote(false)} className="flex-1 aspect-square bg-red-950/40 border border-red-500 flex flex-col items-center justify-center gap-2 hover:bg-red-500/20 transition-all">
                    <AlertTriangle size={28} className="text-red-500" />
                    <span className="text-base font-black font-sans text-red-500 uppercase tracking-widest">NEIN!</span>
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}

      {/* LEGISLATIVE OVERLAY — only shown to the acting president or chancellor */}
      {(gameState.phase === PHASES.LEGISLATIVE_PRESIDENT && isPresident) && (
        <div className="fixed inset-0 z-[300] bg-black/93 backdrop-blur-xl flex flex-col items-center justify-center p-4">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-xl sm:text-2xl font-mono text-cyan-400 tracking-[0.25em] uppercase neon-text-cyan">{'>'} PRESIDENT_DECRYPT</h2>
            <p className="text-white/40 font-mono text-[9px] uppercase tracking-[0.4em] mt-2">Discard one policy to pass to Chancellor</p>
          </div>
          <div className="flex gap-4 sm:gap-6 justify-center w-full max-w-xs sm:max-w-md">
            {gameState.drawnCards?.length > 0 ? (
              hasActedLocal ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 border-2 border-cyan-500/20 border-t-cyan-400 animate-spin mx-auto mb-4" />
                  <p className="text-cyan-400 font-mono text-xs uppercase tracking-widest">TRANSMITTING...</p>
                </div>
              ) : (
                gameState.drawnCards.map((card, i) => (
                  <motion.button
                    key={i}
                    whileHover={{ y: -12, scale: 1.04 }}
                    onClick={() => { setHasActedLocal(true); onDiscard(i); }}
                    className={`relative w-24 h-36 sm:w-32 sm:h-48 border-2 flex flex-col items-center justify-center transition-all group
                      ${card === 'LIBERAL' ? 'bg-cyan-950/40 border-cyan-400 shadow-[0_0_20px_rgba(0,240,255,0.2)]' : 'bg-red-950/40 border-red-500 shadow-[0_0_20px_rgba(255,0,60,0.2)]'}`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
                    {card === 'LIBERAL' ? <Shield size={32} className="text-cyan-400 mb-3" /> : <Skull size={32} className="text-red-500 mb-3" />}
                    <span className={`font-mono text-[9px] sm:text-[10px] font-bold tracking-widest ${card === 'LIBERAL' ? 'text-cyan-400' : 'text-red-500'}`}>{card}</span>
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-black/60 flex items-center justify-center transition-opacity">
                      <span className="text-[9px] sm:text-[10px] font-mono text-white border-y border-white/50 py-0.5 px-2">DISCARD</span>
                    </div>
                  </motion.button>
                ))
              )
            ) : (
              <div className="text-center text-cyan-500/50 font-mono animate-pulse uppercase tracking-[0.2em] text-xs">Loading policies...</div>
            )}
          </div>
        </div>
      )}

      {/* LEGISLATIVE OVERLAY — Chancellor picks which to enact */}
      {(gameState.phase === PHASES.LEGISLATIVE_CHANCELLOR && isChancellor) && (
        <div className="fixed inset-0 z-[300] bg-black/93 backdrop-blur-xl flex flex-col items-center justify-center p-4">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-xl sm:text-2xl font-mono text-cyan-400 tracking-[0.25em] uppercase neon-text-cyan">{'>'} CHANCELLOR_ENACT</h2>
            <p className="text-white/40 font-mono text-[9px] uppercase tracking-[0.4em] mt-2">Choose one policy to enact</p>
          </div>
          <div className="flex gap-4 sm:gap-6 justify-center w-full max-w-xs sm:max-w-md">
            {gameState.drawnCards?.length > 0 ? (
              hasActedLocal ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 border-2 border-cyan-500/20 border-t-cyan-400 animate-spin mx-auto mb-4" />
                  <p className="text-cyan-400 font-mono text-xs uppercase tracking-widest">ENACTING...</p>
                </div>
              ) : (
                gameState.drawnCards.map((card, i) => (
                  <motion.button
                    key={i}
                    whileHover={{ y: -12, scale: 1.04 }}
                    onClick={() => { setHasActedLocal(true); onEnact(i); }}
                    className={`relative w-24 h-36 sm:w-32 sm:h-48 border-2 flex flex-col items-center justify-center transition-all group
                      ${card === 'LIBERAL' ? 'bg-cyan-950/40 border-cyan-400 shadow-[0_0_20px_rgba(0,240,255,0.2)]' : 'bg-red-950/40 border-red-500 shadow-[0_0_20px_rgba(255,0,60,0.2)]'}`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
                    {card === 'LIBERAL' ? <Shield size={32} className="text-cyan-400 mb-3" /> : <Skull size={32} className="text-red-500 mb-3" />}
                    <span className={`font-mono text-[9px] sm:text-[10px] font-bold tracking-widest ${card === 'LIBERAL' ? 'text-cyan-400' : 'text-red-500'}`}>{card}</span>
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-black/60 flex items-center justify-center transition-opacity">
                      <span className="text-[9px] sm:text-[10px] font-mono text-white border-y border-white/50 py-0.5 px-2">ENACT</span>
                    </div>
                  </motion.button>
                ))
              )
            ) : (
              <div className="text-center text-cyan-500/50 font-mono animate-pulse uppercase tracking-[0.2em] text-xs">Loading policies...</div>
            )}
          </div>
        </div>
      )}

      {/* OBSERVER WAITING SCREEN — for non-acting players during legislative phase */}
      {(gameState.phase === PHASES.LEGISLATIVE_PRESIDENT && !isPresident) && (
        <div className="fixed inset-0 z-[300] bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center p-4 pointer-events-none">
          <div className="tactical-panel p-6 sm:p-8 text-center border-cyan-500/20 max-w-xs sm:max-w-sm w-full">
            <div className="w-10 h-10 border-2 border-cyan-500/20 border-t-cyan-400 animate-spin mx-auto mb-5 transform rotate-45" />
            <h3 className="text-sm font-mono text-cyan-400 uppercase tracking-[0.2em] mb-2">Awaiting President</h3>
            <p className="text-cyan-500/50 text-xs font-mono uppercase tracking-widest">
              {gameState.players.find(p => p.id === gameState.currentPresident)?.name} is reviewing policies...
            </p>
          </div>
        </div>
      )}

      {(gameState.phase === PHASES.LEGISLATIVE_CHANCELLOR && !isChancellor) && (
        <div className="fixed inset-0 z-[300] bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center p-4 pointer-events-none">
          <div className="tactical-panel p-6 sm:p-8 text-center border-cyan-500/20 max-w-xs sm:max-w-sm w-full">
            <div className="w-10 h-10 border-2 border-cyan-500/20 border-t-cyan-400 animate-spin mx-auto mb-5 transform rotate-45" />
            <h3 className="text-sm font-mono text-cyan-400 uppercase tracking-[0.2em] mb-2">Awaiting Chancellor</h3>
            <p className="text-cyan-500/50 text-xs font-mono uppercase tracking-widest">
              {gameState.players.find(p => p.id === gameState.currentChancellor)?.name} is selecting a policy...
            </p>
          </div>
        </div>
      )}

      {/* EXECUTIVE ACTION OVERLAY */}
      {gameState.phase === PHASES.EXECUTIVE_ACTION && (
        <div className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-sm flex flex-col items-center"
          >
            <div className="text-center mb-6 sm:mb-8">
              <Skull size={40} className="text-red-500 mx-auto mb-3 drop-shadow-[0_0_20px_rgba(255,0,60,0.8)]" />
              <h2 className="text-xl sm:text-2xl font-mono text-red-500 tracking-[0.2em] uppercase neon-text-crimson">EXECUTION_ORDER</h2>
              <p className="text-white/40 font-mono text-[9px] uppercase tracking-[0.4em] mt-1">
                {isPresident ? 'Select an operative to eliminate' : `President ${gameState.players.find(p => p.id === gameState.currentPresident)?.name} is deciding...`}
              </p>
            </div>

            {hasActedLocal ? (
              <div className="text-center py-8">
                <div className="w-10 h-10 border-2 border-red-500/20 border-t-red-500 animate-spin mx-auto mb-4 transform rotate-45" />
                <p className="text-red-400 font-mono text-xs tracking-[0.2em] uppercase">Executing order...</p>
              </div>
            ) : isPresident ? (
              <div className="w-full flex flex-col gap-2 max-h-[50vh] overflow-y-auto">
                {gameState.players.filter(p => p.isAlive && p.id !== playerId).map(p => (
                  <motion.button
                    key={p.id}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleKill(p.id)}
                    className="w-full flex items-center gap-3 p-3 bg-red-950/30 border border-red-500/30 hover:bg-red-900/50 hover:border-red-500 transition-all group"
                  >
                    <div className="w-8 h-8 flex items-center justify-center border border-red-500/40 bg-red-950/50 transform rotate-45 shrink-0">
                      <Skull size={14} className="-rotate-45 text-red-500/50 group-hover:text-red-400" />
                    </div>
                    <span className="font-mono text-sm uppercase tracking-widest text-white/70 group-hover:text-white">{p.name}</span>
                    <span className="ml-auto text-[9px] font-mono text-red-500/40 group-hover:text-red-400 uppercase tracking-widest">EXECUTE →</span>
                  </motion.button>
                ))}
              </div>
            ) : (
              <div className="text-center">
                <div className="w-10 h-10 border-2 border-red-500/20 border-t-red-500 animate-spin mx-auto mb-4 transform rotate-45" />
                <p className="text-red-400/60 font-mono text-xs tracking-[0.2em] uppercase animate-pulse">Awaiting execution order...</p>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}
