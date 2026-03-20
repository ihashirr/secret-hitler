import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PHASES, ROLES, FACTIONS, FASCIST_TO_WIN, LIBERAL_TO_WIN, MAX_ELECTION_TRACKER } from '../lib/constants';
import { Shield, Skull, Crown, Star, AlertTriangle } from 'lucide-react';

export default function GameBoard({ gameState, playerId, onNominate, onVote, onDiscard, onEnact, onKill, onExit, onReset }) {
  const me = gameState.players.find(p => p.id === (gameState.myPlayerId || playerId));
  const isPresident = gameState.amIPresident ?? (playerId === gameState.currentPresident);
  const isChancellor = gameState.amIChancellor ?? (playerId === gameState.currentChancellor);

  const canNominate = gameState.phase === PHASES.NOMINATION && isPresident;
  const canKill = gameState.phase === PHASES.EXECUTIVE_ACTION && isPresident;

  const currentPresident = gameState.players.find(p => p.id === gameState.currentPresident);
  const currentChancellor = gameState.players.find(p => p.id === gameState.currentChancellor || p.id === gameState.nominatedChancellor);
  
  const [hasActedLocal, setHasActedLocal] = React.useState(false);

  React.useEffect(() => {
    setHasActedLocal(false);
  }, [gameState.phase]);

  const handleNominate = (id) => { if (canNominate) onNominate(id); };
  const handleVote = (approve) => { onVote(approve); setHasActedLocal(true); };
  const handleKill = (targetId) => { onKill(targetId); setHasActedLocal(true); };

  const renderTurnHeader = () => {
    let phaseTitle = 'SYSTEM STANDBY';
    let phaseSub = 'AWAITING PROTOCOL';
    let myAction = 'WAITING';

    switch (gameState.phase) {
      case PHASES.NOMINATION:
        phaseTitle = 'PRESIDENT TURN';
        phaseSub = `${currentPresident?.name || '?'} IS SELECTING A CHANCELLOR`;
        if (canNominate) myAction = 'ACTION REQUIRED';
        break;
      case PHASES.VOTING:
        phaseTitle = 'VOTING PHASE';
        phaseSub = `AUTHENTICATING CHANCELLOR ${currentChancellor?.name || '?'}`;
        if (!me?.hasVoted) myAction = 'ACTION REQUIRED';
        break;
      case PHASES.LEGISLATIVE_PRESIDENT:
        phaseTitle = 'LEGISLATIVE SESSION';
        phaseSub = `PRESIDENT ${currentPresident?.name || '?'} IS REVIEWING POLICIES`;
        if (isPresident && !hasActedLocal) myAction = 'ACTION REQUIRED';
        break;
      case PHASES.LEGISLATIVE_CHANCELLOR:
        phaseTitle = 'LEGISLATIVE SESSION';
        phaseSub = `CHANCELLOR ${currentChancellor?.name || '?'} IS ENACTING A POLICY`;
        if (isChancellor && !hasActedLocal) myAction = 'ACTION REQUIRED';
        break;
      case PHASES.EXECUTIVE_ACTION:
        phaseTitle = 'EXECUTIVE ACTION';
        phaseSub = `PRESIDENT ${currentPresident?.name || '?'} IS EXECUTING A DIRECTIVE`;
        if (canKill) myAction = 'ACTION REQUIRED';
        break;
    }

    return (
      <div className="flex flex-col items-center mt-0 z-10 w-full pt-1 pb-1">
        <h2 className="text-[10px] sm:text-[11px] font-black text-black bg-cyan-400 px-3 py-1 uppercase tracking-[0.2em] shadow-[0_0_15px_rgba(0,240,255,0.4)]">
          {phaseTitle}
        </h2>
        <p className="text-[8px] sm:text-[9px] text-cyan-400 mt-1 font-mono uppercase tracking-[0.2em]">{phaseSub}</p>
        <div className={`mt-1 px-2 py-0.5 text-[8px] font-mono uppercase tracking-widest border transition-all ${myAction === 'ACTION REQUIRED' ? 'border-red-500 text-red-500 bg-red-950/30 shadow-[0_0_10px_rgba(255,0,60,0.5)] animate-pulse' : 'border-cyan-500/20 text-cyan-500/40 bg-black/40'}`}>
          YOU: {myAction}
        </div>
      </div>
    );
  };

  const renderRolesBox = () => (
    <div className="flex justify-center gap-2 sm:gap-4 w-full mt-1.5 z-10 px-2 shrink-0">
      <div className="flex flex-1 items-center gap-2 bg-yellow-950/20 border border-yellow-500/30 px-3 py-1.5 max-w-[160px] justify-between shadow-[0_0_10px_rgba(234,179,8,0.1)]">
        <span className="text-[8px] text-yellow-500/60 font-mono tracking-widest uppercase">PRES</span>
        <span className="text-[10px] sm:text-xs text-yellow-400 font-black tracking-widest flex items-center gap-1 uppercase drop-shadow-[0_0_8px_rgba(234,179,8,0.6)]">
          {currentPresident?.name || '—'} {currentPresident && <Crown size={12} />}
        </span>
      </div>
      <div className="flex flex-1 items-center gap-2 bg-obsidian-900 border border-white/10 px-3 py-1.5 max-w-[160px] justify-between">
        <span className="text-[8px] text-white/40 font-mono tracking-widest uppercase">CHAN</span>
        <span className={`text-[10px] sm:text-xs font-black tracking-widest flex items-center gap-1 uppercase ${currentChancellor ? 'text-white' : 'text-white/20'}`}>
          {currentChancellor?.name || '—'} {currentChancellor && <Star size={12} />}
        </span>
      </div>
    </div>
  );

  const renderActionState = () => {
    const renderWaiting = (text) => (
      <div className="w-full bg-cyan-950/10 border border-cyan-500/20 py-3 px-4 flex items-center justify-center text-center gap-3">
        <div className="w-3.5 h-3.5 border-2 border-cyan-500/30 border-t-cyan-400 animate-spin transform rotate-45 shrink-0" />
        <p className="font-mono text-cyan-500/60 text-[8px] sm:text-[9px] tracking-[0.15em] uppercase truncate">{text}</p>
      </div>
    );

    let content = null;

    if (gameState.phase === PHASES.NOMINATION) {
      if (canNominate) {
        content = (
          <div className="w-full bg-cyan-950/30 border border-cyan-400/50 py-3 px-4 flex flex-col items-center text-center shadow-[0_0_15px_rgba(0,240,255,0.1)]">
            <h3 className="text-cyan-400 font-mono font-bold tracking-[0.2em] text-[10px] sm:text-xs uppercase drop-shadow-[0_0_8px_rgba(0,240,255,0.8)] leading-tight">Select a Chancellor</h3>
            <p className="text-cyan-500/60 text-[7px] sm:text-[8px] font-mono uppercase tracking-widest mt-0.5">Tap an operative from the grid</p>
          </div>
        );
      } else {
        content = renderWaiting(`WAITING FOR ${currentPresident?.name || 'PRESIDENT'} TO SELECT CHANCELLOR`);
      }
    } else if (gameState.phase === PHASES.VOTING) {
      if (!hasActedLocal && !me?.hasVoted) {
        content = (
          <div className="w-full bg-obsidian-900 border border-white/10 py-3 px-4 flex flex-col items-center relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-cyan-400/50 via-white/80 to-red-500/50" />
            <p className="text-white/60 mb-2 text-center font-mono text-[8px] sm:text-[9px] uppercase tracking-[0.2em]">
              Authenticate <span className="text-white font-bold">{currentChancellor?.name}</span>?
            </p>
            <div className="flex gap-4 w-full justify-center">
              <button onClick={() => handleVote(true)} className="relative group hover:scale-105 active:scale-95 transition-all outline-none">
                <img src="/assets/vote-yes.png" alt="Ja" className="w-[60px] sm:w-[72px] drop-shadow-[0_0_10px_rgba(0,240,255,0.2)] group-hover:drop-shadow-[0_0_20px_rgba(0,240,255,0.6)]" />
              </button>
              <button onClick={() => handleVote(false)} className="relative group hover:scale-105 active:scale-95 transition-all outline-none">
                <img src="/assets/vote-no.png" alt="Nein" className="w-[60px] sm:w-[72px] drop-shadow-[0_0_10px_rgba(255,0,60,0.2)] group-hover:drop-shadow-[0_0_20px_rgba(255,0,60,0.6)]" />
              </button>
            </div>
          </div>
        );
      } else {
        content = renderWaiting("TALLYING VOTES FROM OPERATIVES...");
      }
    } else if (gameState.phase === PHASES.LEGISLATIVE_PRESIDENT) {
      if (isPresident) {
        if (hasActedLocal || !gameState.drawnCards) {
          content = renderWaiting("TRANSMITTING SECURE POLICIES...");
        } else {
          content = (
            <div className="w-full bg-obsidian-900 border border-cyan-500/30 py-3 flex flex-col items-center">
               <h3 className="text-cyan-400 font-mono tracking-[0.2em] text-[9px] sm:text-[10px] uppercase mb-2 neon-text-cyan flex items-center gap-2"><Shield size={10}/> Discard One Policy</h3>
               <div className="flex gap-2 justify-center">
                  {gameState.drawnCards.map((card, i) => (
                    <button key={i} onClick={() => { setHasActedLocal(true); onDiscard(i); }} className="relative group hover:-translate-y-1 transition-transform">
                      {card === 'FASCIST' ? (
                        <img src="/assets/policy-fascist.png" className="w-[45px] sm:w-[50px] drop-shadow-[0_0_10px_rgba(255,0,60,0.2)]" alt="Fascist" />
                      ) : (
                        <div className="w-[45px] h-[64px] sm:w-[50px] sm:h-[71px] bg-cyan-950 border-[2px] border-cyan-400 flex items-center justify-center shadow-[0_0_10px_rgba(0,240,255,0.2)]">
                          <Shield className="text-cyan-400/50" size={16} />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-red-500/0 group-hover:bg-red-500/20 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100">
                        <span className="bg-red-900 text-white text-[7px] font-bold px-1 py-0.5 uppercase tracking-widest border border-red-500">Discard</span>
                      </div>
                    </button>
                  ))}
               </div>
            </div>
          );
        }
      } else {
        content = renderWaiting(`${currentPresident?.name || 'President'} IS REVIEWING POLICIES...`);
      }
    } else if (gameState.phase === PHASES.LEGISLATIVE_CHANCELLOR) {
      if (isChancellor) {
        if (hasActedLocal || !gameState.drawnCards) {
          content = renderWaiting("ENACTING PROTOCOL...");
        } else {
          content = (
            <div className="w-full bg-obsidian-900 border border-white/20 py-3 flex flex-col items-center">
               <h3 className="text-white font-mono tracking-[0.2em] text-[9px] sm:text-[10px] uppercase mb-2 flex items-center gap-2"><Star size={10}/> Enact One Policy</h3>
               <div className="flex gap-4 justify-center">
                  {gameState.drawnCards.map((card, i) => (
                    <button key={i} onClick={() => { setHasActedLocal(true); onEnact(i); }} className="relative group hover:-translate-y-1 transition-transform">
                      {card === 'FASCIST' ? (
                        <img src="/assets/policy-fascist.png" className="w-[50px] sm:w-[58px] drop-shadow-[0_0_10px_rgba(255,0,60,0.2)]" alt="Fascist" />
                      ) : (
                        <div className="w-[50px] h-[71px] sm:w-[58px] sm:h-[83px] bg-cyan-950 border-[2px] border-cyan-400 flex items-center justify-center shadow-[0_0_10px_rgba(0,240,255,0.2)]">
                          <Shield className="text-cyan-400/50" size={20} />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-cyan-400/0 group-hover:bg-cyan-400/20 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100">
                        <span className="bg-cyan-900 text-white text-[7px] font-bold px-1 py-0.5 uppercase tracking-widest border border-cyan-400">Enact</span>
                      </div>
                    </button>
                  ))}
               </div>
            </div>
          );
        }
      } else {
        content = renderWaiting(`${currentChancellor?.name || 'Chancellor'} IS CHOOSING A POLICY...`);
      }
    } else if (gameState.phase === PHASES.EXECUTIVE_ACTION) {
      if (isPresident) {
         content = (
           <div className="w-full bg-red-950/20 border border-red-500/50 py-3 px-4 flex flex-col items-center shadow-[0_0_15px_rgba(255,0,60,0.1)]">
             <h3 className="text-red-500 font-mono font-bold tracking-[0.2em] text-[10px] sm:text-xs uppercase mb-0.5 flex gap-2 items-center"><Skull size={12}/> Execute an Operative</h3>
             <p className="text-red-500/60 text-[7px] font-mono uppercase tracking-widest">Select target from grid below</p>
           </div>
         );
      } else {
        content = renderWaiting(`PRESIDENT ${currentPresident?.name?.toUpperCase() || ''} IS PLOTTING AN EXECUTION...`);
      }
    }

    return (
      <div className="w-full mt-2 mb-1 shrink-0 z-10 min-h-[50px] flex px-2 max-w-[400px] mx-auto">
        <AnimatePresence mode="wait">
          <motion.div 
            key={gameState.phase + (hasActedLocal ? '-acted' : '')}
            initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="w-full h-full flex"
          >
            {content}
          </motion.div>
        </AnimatePresence>
      </div>
    );
  };

  const renderTrack = (current, max, type) => {
    const isFascist = type === 'FASCIST';
    const activeColor = isFascist ? 'bg-red-500 shadow-[0_0_6px_rgba(255,0,60,0.8)]' : 'bg-cyan-400 shadow-[0_0_6px_rgba(0,240,255,0.8)]';
    const inactiveColor = isFascist ? 'bg-black/60 border border-red-500/30' : 'bg-black/60 border border-cyan-500/30';
    const lineColor = isFascist ? 'bg-red-500/40' : 'bg-cyan-500/40';

    return (
      <div className="flex items-center w-full justify-between">
        {Array.from({ length: max }).map((_, i) => (
          <React.Fragment key={i}>
            <div className={`w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0 flex items-center justify-center transition-all duration-500 relative z-10
              ${i < current ? activeColor : inactiveColor}
              ${i === max - 1 ? 'transform rotate-45' : 'rounded-sm backdrop-blur-sm'}`}
            >
              <div className={i === max - 1 ? '-rotate-45' : ''}>
                {i < current && (isFascist ? <Skull size={10} className="text-white" /> : <Shield size={10} className="text-white bg-black/40 p-0.5 rounded-full" />)}
              </div>
            </div>
            {i < max - 1 && (
              <div className={`flex-1 h-0.5 ${i < current - 1 ? activeColor : lineColor} transition-colors duration-500 mx-0.5`} />
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };

  const renderPolicyTracks = () => (
    <div className="flex flex-col gap-1 w-full mt-1 z-10 shrink-0 px-2 max-w-[500px] mx-auto">
      
      {/* LIBERAL */}
      <div className="relative w-full h-[52px] sm:h-[64px] bg-obsidian-900 border border-cyan-500/30 overflow-hidden flex flex-col justify-end pb-1.5 shadow-md">
        <img src="/assets/board-liberal.png" className="absolute top-0 right-0 w-[80%] max-w-[400px] h-[180%] object-cover object-left-bottom opacity-20 pointer-events-none mix-blend-screen mix-blend-lighten" alt="" />
        <div className="absolute top-1 left-2 z-10">
          <span className="text-[7px] sm:text-[8px] font-mono font-black text-cyan-400 tracking-widest bg-black px-1.5 py-0.5 border border-cyan-500/30">
            LIBERAL_ [{gameState.liberalPolicies}/{LIBERAL_TO_WIN}]
          </span>
        </div>
        <div className="relative z-10 w-full px-2">
          {renderTrack(gameState.liberalPolicies, LIBERAL_TO_WIN, 'LIBERAL')}
        </div>
      </div>

      {/* FASCIST */}
      <div className="relative w-full h-[52px] sm:h-[64px] bg-obsidian-900 border border-red-500/30 overflow-hidden flex flex-col justify-end pb-1.5 shadow-md">
        <img src="/assets/board-fascist.png" className="absolute top-0 right-0 w-[80%] max-w-[400px] h-[180%] object-cover object-left-bottom opacity-20 pointer-events-none mix-blend-screen mix-blend-lighten" alt="" />
        <div className="absolute top-1 left-2 z-10">
          <span className="text-[7px] sm:text-[8px] font-mono font-black text-red-500 tracking-widest bg-black px-1.5 py-0.5 border border-red-500/30">
            FASCIST_ [{gameState.fascistPolicies}/{FASCIST_TO_WIN}]
          </span>
        </div>
        <div className="relative z-10 w-full px-2">
          {renderTrack(gameState.fascistPolicies, FASCIST_TO_WIN, 'FASCIST')}
        </div>
      </div>

    </div>
  );

  const renderGameInfoLine = () => (
    <div className="flex justify-between items-center w-full px-4 py-1.5 mt-2 border-y border-white/5 bg-black/40 shrink-0 z-10 text-[8px] font-mono uppercase tracking-[0.1em] text-white/50 max-w-[500px] mx-auto">
      <div className="flex gap-4">
        <span>Deck: <strong className="text-cyan-400 font-bold tracking-widest">{gameState.drawPileCount}</strong></span>
        <span>Discard: <strong className="text-white/80 font-bold tracking-widest">{gameState.discardPileCount}</strong></span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="mr-1">Chaos:</span>
        <div className="flex gap-1.5">
          {Array.from({ length: MAX_ELECTION_TRACKER }).map((_, i) => (
            <div key={i} className={`w-2 h-2 border ${i < gameState.electionTracker ? 'bg-red-500 border-red-400 shadow-[0_0_8px_rgba(255,0,60,0.6)]' : 'border-cyan-500/20'} transform rotate-45 transition-all duration-500`} />
          ))}
        </div>
      </div>
    </div>
  );

  const renderPlayerGrid = () => {
    const isInteractivePhase = (gameState.phase === PHASES.NOMINATION && isPresident && !hasActedLocal) || 
                               (gameState.phase === PHASES.EXECUTIVE_ACTION && isPresident && !hasActedLocal);

    return (
      <div className={`mt-0 flex-1 min-h-0 overflow-y-auto overflow-x-hidden flex flex-col transition-all duration-300 z-10 px-2 sm:px-4 max-w-[700px] mx-auto w-full 
        ${!isInteractivePhase ? 'opacity-50 grayscale-[0.2]' : 'opacity-100'}`}>
        
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5 pt-2 pb-6 flex-1 place-content-start">
          {gameState.players.map((p) => {
            const isSelectTarget = p.id === playerId;
            const pIsPresident = p.id === gameState.currentPresident;
            const pIsChancellor = p.id === gameState.currentChancellor || p.id === gameState.nominatedChancellor;
            let isSelectable = false;
            if (gameState.phase === PHASES.NOMINATION && canNominate && p.isAlive && !isSelectTarget) isSelectable = true;
            if (gameState.phase === PHASES.EXECUTIVE_ACTION && canKill && p.isAlive && !isSelectTarget) isSelectable = true;

            return (
              <motion.button
                key={p.id}
                whileTap={isSelectable ? { scale: 0.95 } : {}}
                onClick={() => {
                  if (!isSelectable) return;
                  if (gameState.phase === PHASES.NOMINATION) handleNominate(p.id);
                  if (gameState.phase === PHASES.EXECUTIVE_ACTION) handleKill(p.id);
                }}
                className={`relative flex flex-col items-center justify-center text-center p-1.5 pt-2 pb-1.5 aspect-[3/4] transition-all border
                  ${isSelectable ? 'cursor-pointer border-cyan-400/50 bg-cyan-950/20 hover:bg-cyan-900/40 hover:border-cyan-400 hover:shadow-[0_0_15px_rgba(0,240,255,0.3)] shadow-[0_0_8px_rgba(0,240,255,0.1)]' : 'cursor-default border-white/5 bg-black/40'}
                  ${!p.isAlive ? 'opacity-30' : ''}
                  ${pIsPresident ? 'border-yellow-500/40 bg-yellow-950/20' : ''}
                  ${pIsChancellor && !pIsPresident ? 'border-white/30 bg-white/5' : ''}
                `}
              >
                {/* Role Tapes */}
                {pIsPresident && <div className="absolute top-0 inset-x-0 h-[2px] bg-yellow-400 shadow-[0_0_8px_rgba(234,179,8,0.8)]" />}
                {pIsChancellor && !pIsPresident && <div className="absolute top-0 inset-x-0 h-[2px] bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" />}
                {isSelectTarget && !pIsPresident && !pIsChancellor && <div className="absolute top-0 inset-x-0 h-[2px] bg-cyan-400/40" />}

                {/* Avatar Icon */}
                <div className={`w-5 h-5 sm:w-6 sm:h-6 mb-1.5 flex flex-col items-center justify-center transform rotate-45 border shrink-0
                  ${pIsPresident ? 'border-yellow-400 text-yellow-400 shadow-[0_0_8px_rgba(234,179,8,0.4)]' : 
                    pIsChancellor ? 'border-white text-white shadow-[0_0_8px_rgba(255,255,255,0.4)]' : 
                    isSelectTarget ? 'border-cyan-400 text-cyan-400' : 'border-white/10 text-white/40'}
                `}>
                  <div className="-rotate-45 text-[9px] sm:text-[10px]">
                    {pIsPresident ? <Crown size={10}/> : pIsChancellor ? <Star size={10}/> : !p.isAlive ? <Skull size={10}/> : <Shield size={8}/>}
                  </div>
                </div>

                <span className={`font-mono text-[7px] sm:text-[8px] uppercase tracking-widest truncate w-full mt-auto ${!p.isAlive ? 'line-through text-red-500/60' : isSelectTarget ? 'text-cyan-400' : 'text-white/80'}`}>
                  {p.name}
                </span>

                {isSelectable && gameState.phase === PHASES.EXECUTIVE_ACTION && (
                  <span className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[6px] text-red-500 font-bold bg-red-950 px-1 border border-red-500 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">KILL</span>
                )}
                
                {isSelectable && gameState.phase === PHASES.NOMINATION && (
                  <span className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[5px] text-cyan-400 font-bold bg-cyan-950 px-1 border border-cyan-400 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">TAP</span>
                )}

                {p.hasVoted && gameState.phase === PHASES.VOTING && (
                  <div className="absolute top-1 right-1 w-1 h-1 bg-cyan-400 rounded-full shadow-[0_0_6px_rgba(0,240,255,1)] animate-pulse" />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="h-[100dvh] w-full flex flex-col overflow-hidden bg-obsidian-950 relative pt-[60px] pb-2 sm:pt-16">
      {/* Background Grid */}
      <div className="fixed inset-0 z-0 bg-[url('/grid.svg')] opacity-5 pointer-events-none" />

      {/* Main Single-Viewport Flow */}
      <div className="w-full flex-1 min-h-0 flex flex-col relative z-10">
        {renderTurnHeader()}
        {renderRolesBox()}
        {renderActionState()}
        {renderPolicyTracks()}
        {renderGameInfoLine()}
        {renderPlayerGrid()}
      </div>
    </div>
  );
}
