import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PHASES, ROLES, FACTIONS, FASCIST_TO_WIN, LIBERAL_TO_WIN, MAX_ELECTION_TRACKER } from '../lib/constants';
import { Shield, Skull, Crown, Star, AlertTriangle, Check, X } from 'lucide-react';

export default function GameBoard({ gameState, playerId, onNominate, onVote, onDiscard, onEnact, onKill, onExit, onReset }) {
  const me = gameState.players.find(p => p.id === (gameState.myPlayerId || playerId));
  const isPresident = gameState.amIPresident ?? (playerId === gameState.currentPresident);
  const isChancellor = gameState.amIChancellor ?? (playerId === gameState.currentChancellor);

  const canNominate = gameState.phase === PHASES.NOMINATION && isPresident;
  const canKill = gameState.phase === PHASES.EXECUTIVE_ACTION && isPresident;

  const currentPresident = gameState.players.find(p => p.id === gameState.currentPresident);
  const currentChancellor = gameState.players.find(p => p.id === gameState.currentChancellor || p.id === gameState.nominatedChancellor);
  
  const [hasActedLocal, setHasActedLocal] = React.useState(false);
  const [dots, setDots] = React.useState('');
  
  // Vote Reveal Sequence State
  const [revealState, setRevealState] = React.useState(null); 
  const [revealStage, setRevealStage] = React.useState(0);
  const prevPhaseRef = React.useRef(gameState.phase);

  React.useEffect(() => {
    setHasActedLocal(false);
  }, [gameState.phase]);

  // Live Dots Animation
  React.useEffect(() => {
    if (gameState.phase !== PHASES.VOTING && !revealState) return;
    const int = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 400);
    return () => clearInterval(int);
  }, [gameState.phase, revealState]);

  // Vote Interception Logic
  React.useEffect(() => {
    if (prevPhaseRef.current === PHASES.VOTING && gameState.phase !== PHASES.VOTING) {
      let ya = 0; let nein = 0;
      const voteRecord = {};
      gameState.players.forEach(p => {
         if (p.lastVote) {
             voteRecord[p.id] = p.lastVote;
             if (p.lastVote === 'YA') ya++; else nein++;
         }
      });
      
      setRevealState({ 
        result: ya > nein ? 'APPROVED' : 'REJECTED', 
        votes: voteRecord,
        ya,
        nein
      });
      
      // Cinematic timing sequence
      setRevealStage(0); // Dim screen
      setTimeout(() => setRevealStage(1), 150); // Flash + Shake + Show Results
      
      // Cleanup after 4 seconds
      setTimeout(() => {
         setRevealState(null);
         setRevealStage(0);
      }, 4000);
    }
    prevPhaseRef.current = gameState.phase;
  }, [gameState.phase, gameState.players]);

  const displayPhase = revealState ? PHASES.VOTING : gameState.phase;

  const handleNominate = (id) => { if (canNominate) onNominate(id); };
  const handleVote = (approve) => { onVote(approve); setHasActedLocal(true); };
  const handleKill = (targetId) => { onKill(targetId); setHasActedLocal(true); };

  const renderTurnHeader = () => {
    let phaseTitle = 'SYSTEM STANDBY';
    let phaseSub = 'AWAITING PROTOCOL';
    let myAction = 'WAITING FOR PRESIDENT';

    switch (displayPhase) {
      case PHASES.NOMINATION:
        phaseTitle = 'PRESIDENT TURN';
        phaseSub = `${currentPresident?.name || '?'} IS SELECTING A CHANCELLOR`;
        if (canNominate) {
          myAction = 'TAP TO NOMINATE';
        } else {
          myAction = 'WAITING FOR PRESIDENT';
        }
        break;
      case PHASES.VOTING:
        phaseTitle = 'VOTING PHASE';
        if (revealState) {
          phaseSub = 'VERIFYING DEMOCRATIC CONSENSUS...';
          myAction = 'AWAITING RESULT';
        } else {
          phaseSub = `VOTE ON PROPOSED GOVERNMENT: ${currentPresident?.name} & ${currentChancellor?.name}`;
          if (!me?.hasVoted) {
            myAction = 'CAST VOTE CAREFULLY';
          } else {
            myAction = 'WAITING FOR OTHERS';
          }
        }
        break;
      case PHASES.LEGISLATIVE_PRESIDENT:
        phaseTitle = 'LEGISLATIVE SESSION';
        phaseSub = `PRESIDENT ${currentPresident?.name || '?'} IS REVIEWING POLICIES`;
        if (isPresident && !hasActedLocal) {
          myAction = 'DISCARD ONE POLICY';
        } else {
          myAction = 'WAITING FOR PRESIDENT';
        }
        break;
      case PHASES.LEGISLATIVE_CHANCELLOR:
        phaseTitle = 'LEGISLATIVE SESSION';
        phaseSub = `CHANCELLOR ${currentChancellor?.name || '?'} IS ENACTING A POLICY`;
        if (isChancellor && !hasActedLocal) {
          myAction = 'ENACT ONE POLICY';
        } else {
          myAction = 'WAITING FOR CHANCELLOR';
        }
        break;
      case PHASES.EXECUTIVE_ACTION:
        phaseTitle = 'EXECUTIVE ACTION';
        phaseSub = `PRESIDENT ${currentPresident?.name || '?'} IS EXECUTING A DIRECTIVE`;
        if (canKill) {
          myAction = 'SELECT TARGET FOR TERMINATION';
        } else {
          myAction = 'WAITING FOR PRESIDENT';
        }
        break;
    }

    const isActionRequired = myAction.includes('NOMINATE') || myAction.includes('DISCARD') || myAction.includes('ENACT') || myAction.includes('CAST') || myAction.includes('SELECT');

    return (
      <div className="flex flex-col items-center mt-0 z-10 w-full pt-1 pb-1">
        <h2 className="text-[11px] sm:text-[12px] font-black text-black bg-cyan-400 px-4 py-1.5 uppercase tracking-[0.25em] shadow-[0_0_15px_rgba(0,240,255,0.6)] animate-pulse-glow">
          {phaseTitle}
        </h2>
        <p className="text-[8px] sm:text-[9px] text-cyan-400 mt-2 font-mono font-bold uppercase tracking-[0.2em] opacity-80">{phaseSub}</p>
        <div className={`mt-2 px-3 py-1 font-mono uppercase tracking-widest border transition-all duration-300 ${isActionRequired ? 'text-[9px] border-red-500 text-red-500 bg-red-950/40 shadow-[0_0_15px_rgba(255,0,60,0.6)] animate-pulse-slow font-bold scale-105' : 'text-[8px] border-cyan-500/20 text-cyan-500/60 bg-black/40'}`}>
          YOU: {myAction}
        </div>
      </div>
    );
  };

  const renderRolesBox = () => (
    <div className="flex justify-center gap-3 sm:gap-6 w-full mt-3 z-10 px-2 shrink-0">
      <div className="flex flex-1 items-center gap-3 bg-yellow-950/20 border border-yellow-500/50 px-4 py-2 max-w-[180px] justify-between shadow-[0_0_25px_rgba(234,179,8,0.25)] relative overflow-hidden transition-all duration-500 hover:shadow-[0_0_35px_rgba(234,179,8,0.4)]">
        <div className="absolute inset-0 bg-yellow-400/5 animate-pulse-slow pointer-events-none" />
        <span className="text-[8px] sm:text-[9px] text-yellow-500/80 font-mono font-bold tracking-widest uppercase relative z-10">PRES</span>
        <span className="text-[11px] sm:text-xs text-yellow-400 font-extrabold tracking-widest flex items-center gap-1.5 uppercase drop-shadow-[0_0_10px_rgba(234,179,8,0.9)] relative z-10">
          {currentPresident?.name || '—'} {currentPresident && <Crown size={14} className="animate-pulse-slow" />}
        </span>
      </div>
      <div className="flex flex-1 items-center gap-3 bg-obsidian-900 border border-white/30 px-4 py-2 max-w-[180px] justify-between shadow-[0_0_15px_rgba(255,255,255,0.1)] transition-all duration-500 hover:shadow-[0_0_25px_rgba(255,255,255,0.2)]">
        <span className="text-[8px] sm:text-[9px] text-white/50 font-mono tracking-widest uppercase">CHAN</span>
        <span className={`text-[11px] sm:text-xs font-black tracking-widest flex items-center gap-1.5 uppercase ${currentChancellor ? 'text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.7)]' : 'text-white/20'}`}>
          {currentChancellor?.name || '—'} {currentChancellor && <Star size={14} />}
        </span>
      </div>
    </div>
  );

  const renderActionState = () => {
    const renderWaiting = (text) => (
      <div className="w-full bg-cyan-950/10 border border-cyan-500/10 py-5 px-6 flex items-center justify-center text-center gap-4 shadow-[0_0_20px_rgba(0,240,255,0.05)] animate-pulse-slow backdrop-blur-sm">
        <div className="w-5 h-5 border-[3px] border-cyan-500/20 border-t-cyan-400 animate-spin transform rotate-45 shrink-0 shadow-[0_0_10px_rgba(0,240,255,0.4)]" />
        <p className="font-mono text-cyan-400/80 font-bold text-[10px] sm:text-[11px] tracking-[0.2em] uppercase leading-tight whitespace-pre-wrap">{text}</p>
      </div>
    );

    let content = null;

    if (displayPhase === PHASES.NOMINATION) {
      if (canNominate) {
        content = (
          <div className="w-full bg-cyan-950/40 border border-cyan-400/80 py-6 px-6 flex flex-col items-center text-center shadow-[0_0_35px_rgba(0,240,255,0.3)] backdrop-blur-md">
            <h3 className="text-cyan-400 font-mono font-black tracking-[0.25em] text-[12px] sm:text-sm uppercase drop-shadow-[0_0_12px_rgba(0,240,255,1)] leading-tight">Select a Chancellor</h3>
            <p className="text-cyan-400/60 text-[8px] sm:text-[9px] font-mono font-bold uppercase tracking-[0.3em] mt-2 animate-pulse">Select an operative below</p>
          </div>
        );
      } else {
        content = renderWaiting(`WAITING FOR PRESIDENT ${currentPresident?.name?.toUpperCase() || ''}\nTO SELECT CHANCELLOR`);
      }
    } else if (displayPhase === PHASES.VOTING) {
      if (revealState) {
        // VOTE REVEAL CINEMATIC
        const isApprove = revealState.result === 'APPROVED';
        content = (
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, filter: 'brightness(3)' }} 
            animate={revealStage === 1 ? { scale: 1.05, opacity: 1, filter: 'brightness(1)' } : { opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className={`w-full py-8 px-4 flex flex-col items-center border ${isApprove ? 'bg-cyan-950/60 border-cyan-400 shadow-[0_0_60px_rgba(0,240,255,0.6)] backdrop-blur-md' : 'bg-red-950/60 border-red-500 shadow-[0_0_60px_rgba(255,0,60,0.6)] backdrop-blur-md'}`}
          >
            <h3 className={`font-mono font-black tracking-[0.25em] text-[16px] sm:text-lg uppercase ${isApprove ? 'text-cyan-400 drop-shadow-[0_0_15px_rgba(0,240,255,1)]' : 'text-red-500 drop-shadow-[0_0_15px_rgba(255,0,60,1)]'}`}>
              GOVERNMENT {revealState.result}
            </h3>
            <p className={`font-mono font-bold tracking-[0.4em] text-[10px] sm:text-[11px] mt-3 ${isApprove ? 'text-cyan-400/80' : 'text-red-500/80'}`}>
              JA: {revealState.ya} — NEIN: {revealState.nein}
            </p>
          </motion.div>
        );
      } else if (!hasActedLocal && !me?.hasVoted) {
        content = (
          <div className="w-full bg-obsidian-900 border border-cyan-500/40 py-6 px-6 flex flex-col items-center relative overflow-hidden shadow-[0_0_35px_rgba(0,240,255,0.2)] backdrop-blur-sm">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-cyan-400/50 via-white/80 to-red-500/50 animate-[pulse_2s_ease-in-out_infinite]" />
            <p className="text-white/60 mb-5 text-center font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.25em]">
              Authenticate Chancellor <span className="text-white font-black text-[10px] sm:text-[11px] drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]">{currentChancellor?.name}</span>?
            </p>
            <div className="flex gap-8 w-full justify-center">
              <button onClick={() => handleVote(true)} className="relative group hover:scale-[1.15] active:scale-95 transition-all outline-none duration-300">
                <img src="/assets/vote-yes.png" alt="Ja" className="w-[70px] sm:w-[85px] drop-shadow-[0_0_20px_rgba(0,240,255,0.4)] group-hover:drop-shadow-[0_0_40px_rgba(0,240,255,1)]" />
              </button>
              <button onClick={() => handleVote(false)} className="relative group hover:scale-[1.15] active:scale-95 transition-all outline-none duration-300">
                <img src="/assets/vote-no.png" alt="Nein" className="w-[70px] sm:w-[85px] drop-shadow-[0_0_20px_rgba(255,0,60,0.4)] group-hover:drop-shadow-[0_0_40px_rgba(255,0,60,1)]" />
              </button>
            </div>
          </div>
        );
      } else {
        const totalVotes = gameState.players.filter(p => p.isAlive).length;
        const votesCast = gameState.players.filter(p => p.hasVoted).length;
        
        content = (
          <div className="w-full bg-cyan-950/10 border border-cyan-500/20 py-5 px-6 flex flex-col items-center justify-center text-center shadow-[0_0_20px_rgba(0,240,255,0.05)] backdrop-blur-sm">
            <div className="w-full flex items-center justify-center gap-3 mb-2">
              <div className="w-4 h-4 border-2 border-cyan-500/30 border-t-cyan-400 animate-spin rounded-full shrink-0 drop-shadow-[0_0_5px_rgba(0,240,255,0.8)]" />
              <p className="font-mono text-cyan-400 font-bold text-[10px] sm:text-[11px] tracking-[0.2em] uppercase leading-tight w-[160px] text-left">
                TALLYING VOTES{dots}
              </p>
            </div>
            <div className="w-full h-1.5 bg-black/60 rounded-full overflow-hidden mt-2 max-w-[220px] border border-cyan-500/20 shadow-inner">
              <div className="h-full bg-cyan-400 transition-all duration-300 shadow-[0_0_15px_rgba(0,240,255,1)]" style={{ width: `${(votesCast / totalVotes) * 100}%` }} />
            </div>
            <p className="font-mono text-cyan-500/60 text-[7px] sm:text-[8px] tracking-[0.25em] font-bold uppercase mt-3">
              {votesCast} / {totalVotes} OPERATIVES RESPONDED
            </p>
          </div>
        );
      }
    } else if (displayPhase === PHASES.LEGISLATIVE_PRESIDENT) {
      if (isPresident) {
        if (hasActedLocal || !gameState.drawnCards) {
          content = renderWaiting("TRANSMITTING SECURE POLICIES...");
        } else {
          content = (
            <div className="w-full bg-obsidian-900 border border-cyan-500/50 py-6 flex flex-col items-center shadow-[0_0_35px_rgba(0,240,255,0.2)] backdrop-blur-md relative overflow-hidden">
               <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-cyan-900/20 to-transparent pointer-events-none" />
               <h3 className="text-cyan-400 font-mono font-black tracking-[0.25em] text-[10px] sm:text-[11px] uppercase mb-4 neon-text-cyan flex items-center gap-3"><Shield size={14}/> Discard One Policy</h3>
               <div className="flex gap-5 justify-center group/cards">
                  {gameState.drawnCards.map((card, i) => (
                    <button key={i} onClick={() => { setHasActedLocal(true); onDiscard(i); }} className="relative group hover:scale-[1.1] hover:-translate-y-2 transition-all duration-300 group-hover/cards:opacity-50 hover:!opacity-100">
                      {card === 'FASCIST' ? (
                        <img src="/assets/policy-fascist.png" className="w-[55px] sm:w-[65px] drop-shadow-[0_0_15px_rgba(255,0,60,0.5)] group-hover:drop-shadow-[0_0_30px_rgba(255,0,60,0.9)]" alt="Fascist" />
                      ) : (
                        <img src="/assets/policy-liberal.png" className="w-[55px] sm:w-[65px] drop-shadow-[0_0_15px_rgba(0,240,255,0.5)] group-hover:drop-shadow-[0_0_30px_rgba(0,240,255,0.9)]" alt="Liberal" />
                      )}
                      <div className="absolute inset-0 bg-red-500/0 group-hover:bg-red-500/20 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 backdrop-blur-[1px] rounded-sm">
                        <span className="bg-red-950 text-white text-[8px] font-black px-2 py-1 uppercase tracking-[0.2em] border border-red-500 shadow-[0_0_15px_rgba(255,0,60,1)] scale-110">Discard</span>
                      </div>
                    </button>
                  ))}
               </div>
            </div>
          );
        }
      } else {
        content = renderWaiting(`PRESIDENT ${currentPresident?.name?.toUpperCase() || ''}\nIS REVIEWING POLICIES...`);
      }
    } else if (displayPhase === PHASES.LEGISLATIVE_CHANCELLOR) {
      if (isChancellor) {
        if (hasActedLocal || !gameState.drawnCards) {
          content = renderWaiting("ENACTING PROTOCOL...");
        } else {
          content = (
            <div className="w-full bg-obsidian-900 border border-white/40 py-6 flex flex-col items-center shadow-[0_0_35px_rgba(255,255,255,0.15)] backdrop-blur-md relative overflow-hidden">
               <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
               <h3 className="text-white font-mono font-black tracking-[0.25em] text-[10px] sm:text-[11px] uppercase mb-5 flex items-center gap-3 drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]"><Star size={14}/> Enact One Policy</h3>
               <div className="flex gap-7 justify-center group/cards">
                  {gameState.drawnCards.map((card, i) => (
                    <button key={i} onClick={() => { setHasActedLocal(true); onEnact(i); }} className="relative group hover:scale-[1.1] hover:-translate-y-2 transition-all duration-300 group-hover/cards:opacity-50 hover:!opacity-100">
                      {card === 'FASCIST' ? (
                        <img src="/assets/policy-fascist.png" className="w-[60px] sm:w-[75px] drop-shadow-[0_0_20px_rgba(255,0,60,0.5)] group-hover:drop-shadow-[0_0_40px_rgba(255,0,60,0.9)]" alt="Fascist" />
                      ) : (
                        <img src="/assets/policy-liberal.png" className="w-[60px] sm:w-[75px] drop-shadow-[0_0_20px_rgba(0,240,255,0.5)] group-hover:drop-shadow-[0_0_40px_rgba(0,240,255,0.9)]" alt="Liberal" />
                      )}
                      <div className="absolute inset-0 bg-cyan-400/0 group-hover:bg-cyan-400/20 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 backdrop-blur-[1px] rounded-sm">
                        <span className="bg-cyan-950 text-white text-[8px] font-black px-2 py-1 uppercase tracking-[0.2em] border border-cyan-400 shadow-[0_0_20px_rgba(0,240,255,1)] scale-110">Enact</span>
                      </div>
                    </button>
                  ))}
               </div>
            </div>
          );
        }
      } else {
        content = renderWaiting(`CHANCELLOR ${currentChancellor?.name?.toUpperCase() || ''}\nIS CHOOSING A POLICY...`);
      }
    } else if (displayPhase === PHASES.EXECUTIVE_ACTION) {
      if (isPresident) {
         content = (
           <div className="w-full bg-red-950/30 border border-red-500/80 py-6 px-6 flex flex-col items-center shadow-[0_0_40px_rgba(255,0,60,0.25)] backdrop-blur-md">
             <h3 className="text-red-500 font-mono font-black tracking-[0.25em] text-[12px] sm:text-sm uppercase mb-2 flex gap-3 items-center drop-shadow-[0_0_15px_rgba(255,0,60,1)]"><Skull size={18} className="animate-pulse"/> Execute an Operative</h3>
             <p className="text-red-500/70 text-[8px] sm:text-[9px] font-mono font-bold uppercase tracking-[0.3em] mt-2">Select target below</p>
           </div>
         );
      } else {
        content = renderWaiting(`PRESIDENT ${currentPresident?.name?.toUpperCase() || ''}\nIS PLOTTING AN EXECUTION...`);
      }
    }

    return (
      <div className="w-full my-4 shrink-0 z-10 flex px-4 max-w-[500px] mx-auto min-h-[140px]">
        <AnimatePresence mode="wait">
          <motion.div 
            key={displayPhase + (hasActedLocal ? '-acted' : '') + (revealState ? '-reveal' : '')}
            initial={{ opacity: 0, scale: 0.95, y: 10, filter: 'brightness(1.5)' }} 
            animate={{ opacity: 1, scale: 1, y: 0, filter: 'brightness(1)' }} 
            exit={{ opacity: 0, scale: 1.05, y: -10, filter: 'brightness(0.5)' }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="w-full flex items-center justify-center"
          >
            {content}
          </motion.div>
        </AnimatePresence>
      </div>
    );
  };

  const renderTrack = (current, max, type) => {
    const isFascist = type === 'FASCIST';
    const activeColor = isFascist ? 'bg-red-500/90 shadow-[0_0_8px_rgba(255,0,60,0.8)]' : 'bg-cyan-400/90 shadow-[0_0_8px_rgba(0,240,255,0.8)]';
    const inactiveColor = isFascist ? 'bg-black/60 border border-red-500/20' : 'bg-black/60 border border-cyan-500/20';
    const lineColor = isFascist ? 'bg-red-500/30' : 'bg-cyan-500/30';

    return (
      <div className="flex items-center w-full justify-between pb-1.5 relative">
        {Array.from({ length: max }).map((_, i) => (
          <React.Fragment key={i}>
            <div className="relative">
              <div className={`w-5 h-5 sm:w-7 sm:h-7 flex-shrink-0 flex items-center justify-center transition-all duration-700 relative z-10
                ${i < current ? activeColor : inactiveColor}
                ${i === max - 1 ? 'transform rotate-45' : 'rounded-sm backdrop-blur-sm'}`}
              >
                <div className={i === max - 1 ? '-rotate-45' : ''}>
                  {i < current && (isFascist ? <Skull size={8} className="text-white" /> : <Shield size={8} className="text-white bg-black/40 p-0.5 rounded-full" />)}
                </div>
              </div>
              
              {/* Highlight flash when newly added */}
              {i === current - 1 && (
                <motion.div 
                  initial={{ scale: 2, opacity: 0.8, filter: 'blur(4px)' }} 
                  animate={{ scale: 1, opacity: 0, filter: 'blur(0px)' }} 
                  transition={{ duration: 1, ease: "easeOut" }}
                  className={`absolute inset-0 z-20 ${isFascist ? 'bg-red-500' : 'bg-cyan-400'} rounded-sm pointer-events-none`}
                />
              )}
            </div>
            {i < max - 1 && (
              <div className={`flex-1 h-0.5 ${i < current - 1 ? activeColor : lineColor} transition-colors duration-700 mx-0.5`} />
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };

  const renderPolicyTracks = () => {
    // Dim the policy tracks massively during voting
    const isDimmed = displayPhase === PHASES.VOTING;
    const trackClasses = `flex flex-col gap-1.5 w-full shrink-0 px-4 max-w-[500px] mx-auto mt-2 transition-all duration-700 ${isDimmed ? 'opacity-30 grayscale-[0.8] scale-[0.97]' : 'opacity-100'} hover:opacity-100 hover:grayscale-0`;

    return (
      <div className={trackClasses}>
        
        {/* LIBERAL */}
        <div className="relative w-full h-[46px] sm:h-[54px] bg-cyan-950/20 border border-cyan-500/30 overflow-hidden flex flex-col justify-end shadow-md shadow-cyan-950">
          <img src="/assets/board-liberal.png" className="absolute inset-x-0 bottom-0 w-full h-auto min-h-full object-cover object-center opacity-40 pointer-events-none mix-blend-luminosity" alt="" />
          <div className="absolute inset-0 bg-cyan-900/20 mix-blend-overlay pointer-events-none"></div>
          <div className="absolute top-1 left-2 z-10">
            <span className="text-[7px] font-mono font-bold text-cyan-400/90 tracking-widest bg-cyan-950/40 px-1 py-0.5 backdrop-blur-sm rounded-sm">
              LIBERAL_ [{gameState.liberalPolicies}/{LIBERAL_TO_WIN}]
            </span>
          </div>
          <div className="relative z-10 w-full px-2">
            {renderTrack(gameState.liberalPolicies, LIBERAL_TO_WIN, 'LIBERAL')}
          </div>
        </div>

        {/* FASCIST */}
        <div className="relative w-full h-[46px] sm:h-[54px] bg-red-950/20 border border-red-500/30 overflow-hidden flex flex-col justify-end shadow-md shadow-red-950">
          <img src="/assets/board-fascist.png" className="absolute inset-x-0 bottom-0 w-full h-auto min-h-full object-cover object-center opacity-40 pointer-events-none mix-blend-luminosity" alt="" />
          <div className="absolute inset-0 bg-red-900/20 mix-blend-overlay pointer-events-none"></div>
          <div className="absolute top-1 left-2 z-10">
            <span className="text-[7px] font-mono font-bold text-red-500/90 tracking-widest bg-red-950/40 px-1 py-0.5 backdrop-blur-sm rounded-sm">
              FASCIST_ [{gameState.fascistPolicies}/{FASCIST_TO_WIN}]
            </span>
          </div>
          <div className="relative z-10 w-full px-2">
            {renderTrack(gameState.fascistPolicies, FASCIST_TO_WIN, 'FASCIST')}
          </div>
        </div>

      </div>
    );
  };

  const renderGameInfoLine = () => (
    <div className="flex justify-between items-center w-full px-6 py-3 my-3 border-y border-white/10 bg-black/60 shrink-0 z-10 text-[10px] sm:text-[11px] font-mono font-black uppercase tracking-[0.25em] text-white/50 max-w-[500px] mx-auto shadow-[0_0_20px_rgba(0,0,0,0.8)] backdrop-blur-md">
      <div className="flex gap-8">
        <span>DECK: <strong className="text-cyan-400 drop-shadow-[0_0_8px_rgba(0,240,255,0.6)] ml-1.5">{gameState.drawPileCount}</strong></span>
        <span>DISCARD: <strong className="text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.4)] ml-1.5">{gameState.discardPileCount}</strong></span>
      </div>
      <div className="flex items-center gap-3">
        <span className="mr-1">CHAOS:</span>
        <div className="flex gap-2">
          {Array.from({ length: MAX_ELECTION_TRACKER }).map((_, i) => (
            <div key={i} className={`w-3 h-3 border ${i < gameState.electionTracker ? 'bg-red-500 border-red-400 shadow-[0_0_10px_rgba(255,0,60,0.8)] scale-110' : 'border-cyan-500/20'} transform rotate-45 transition-all duration-500`} />
          ))}
        </div>
      </div>
    </div>
  );

  const renderPlayerGrid = () => {
    const isInteractivePhase = (displayPhase === PHASES.NOMINATION && isPresident && !hasActedLocal) || 
                               (displayPhase === PHASES.EXECUTIVE_ACTION && isPresident && !hasActedLocal);
    const isVotingPhase = displayPhase === PHASES.VOTING;
    const isLegislativePhase = displayPhase === PHASES.LEGISLATIVE_PRESIDENT || displayPhase === PHASES.LEGISLATIVE_CHANCELLOR;

    return (
      <div className={`w-full max-w-[500px] mx-auto z-10 px-4 transition-all duration-500 
        ${(!isInteractivePhase && !isVotingPhase && !isLegislativePhase) ? 'opacity-40 grayscale-[0.3]' : 'opacity-100'}`}>
        
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 pb-6 place-content-start group/grid">
          {gameState.players.map((p) => {
            const isSelectTarget = p.id === playerId;
            const pIsPresident = p.id === gameState.currentPresident;
            const pIsChancellor = p.id === gameState.currentChancellor || p.id === gameState.nominatedChancellor;
            let isSelectable = false;
            if (displayPhase === PHASES.NOMINATION && canNominate && p.isAlive && !isSelectTarget) isSelectable = true;
            if (displayPhase === PHASES.EXECUTIVE_ACTION && canKill && p.isAlive && !isSelectTarget) isSelectable = true;

            // Voting Statuses
            const showVoteState = isVotingPhase && p.isAlive;
            const isRevealed = !!revealState;
            const finalVote = isRevealed ? revealState.votes[p.id] : null;
            
            // Dim inactive players during legislative
            const isInactiveLegislator = isLegislativePhase && !pIsPresident && !pIsChancellor;

            return (
              <motion.button
                key={p.id}
                whileHover={isSelectable ? { scale: 1.05 } : {}}
                whileTap={isSelectable ? { scale: 0.95 } : {}}
                onClick={() => {
                  if (!isSelectable) return;
                  if (displayPhase === PHASES.NOMINATION) handleNominate(p.id);
                  if (displayPhase === PHASES.EXECUTIVE_ACTION) handleKill(p.id);
                }}
                className={`relative flex flex-col items-center justify-center text-center p-1.5 pt-2.5 pb-2 aspect-[3/4] transition-all duration-300 border group
                  ${isInactiveLegislator ? 'opacity-30 grayscale-[0.7]' : ''}
                  ${isSelectable ? 'cursor-pointer border-cyan-400/50 bg-cyan-950/20 hover:bg-cyan-900/40 hover:border-cyan-400 hover:shadow-[0_0_25px_rgba(0,240,255,0.5)] shadow-[0_0_10px_rgba(0,240,255,0.15)] group-hover/grid:opacity-50 hover:!opacity-100' : 'cursor-default'}
                  ${!isSelectable && !isVotingPhase ? 'border-white/5 bg-black/40' : ''}
                  ${!p.isAlive ? 'opacity-20' : ''}
                  ${pIsPresident ? 'border-yellow-500/60 bg-yellow-950/20 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-yellow-900/40 to-transparent shadow-[0_0_20px_rgba(234,179,8,0.1)]' : ''}
                  ${pIsChancellor && !pIsPresident ? 'border-white/40 bg-white/5 shadow-[0_0_15px_rgba(255,255,255,0.05)]' : ''}
                  
                  ${showVoteState && !isRevealed && !p.hasVoted ? 'opacity-50 grayscale-[0.5] border-cyan-500/10' : ''}
                  ${showVoteState && !isRevealed && p.hasVoted ? 'border-cyan-500/40 bg-cyan-950/20 shadow-[0_0_10px_rgba(0,240,255,0.1)]' : ''}
                  ${isSelectTarget && showVoteState ? 'border-cyan-400 shadow-[0_0_20px_rgba(0,240,255,0.3)]' : ''}
                  ${isRevealed && finalVote === 'YA' ? 'border-cyan-400 bg-cyan-950/50 shadow-[0_0_25px_rgba(0,240,255,0.6)] z-20 scale-105 transition-all duration-300' : ''}
                  ${isRevealed && finalVote === 'NEIN' ? 'border-red-500 bg-red-950/50 shadow-[0_0_25px_rgba(255,0,60,0.6)] z-20 scale-105 transition-all duration-300' : ''}
                `}
              >
                {/* Role Tapes */}
                {pIsPresident && <div className="absolute top-0 inset-x-0 h-[3px] bg-yellow-400 shadow-[0_0_12px_rgba(234,179,8,1)] animate-pulse-slow" />}
                {pIsChancellor && !pIsPresident && <div className="absolute top-0 inset-x-0 h-[2px] bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" />}
                {isSelectTarget && !pIsPresident && !pIsChancellor && <div className="absolute top-0 inset-x-0 h-[2px] bg-cyan-400/40" />}

                {/* Avatar Icon */}
                <div className={`w-5 h-5 sm:w-6 sm:h-6 mb-2 flex flex-col items-center justify-center transform rotate-45 border shrink-0 transition-all duration-300
                  ${pIsPresident ? 'border-yellow-400 text-yellow-400 shadow-[0_0_12px_rgba(234,179,8,0.8)] animate-pulse-slow' : 
                    pIsChancellor ? 'border-white text-white shadow-[0_0_10px_rgba(255,255,255,0.6)]' : 
                    isSelectTarget ? 'border-cyan-400 text-cyan-400 drop-shadow-[0_0_5px_rgba(0,240,255,0.5)]' : 'border-white/10 text-white/40 group-hover:border-cyan-400/50 group-hover:text-cyan-400/50'}
                `}>
                  <div className="-rotate-45 text-[9px] sm:text-[10px]">
                    {pIsPresident ? <Crown size={12} className="drop-shadow-[0_0_5px_rgba(234,179,8,0.8)]"/> : pIsChancellor ? <Star size={10}/> : !p.isAlive ? <Skull size={10}/> : <Shield size={8}/>}
                  </div>
                </div>

                <span className={`font-mono text-[7px] sm:text-[8px] font-bold uppercase tracking-widest truncate w-full mt-auto mb-2
                  ${!p.isAlive ? 'line-through text-red-500/40' : isSelectTarget ? 'text-cyan-400 drop-shadow-[0_0_5px_rgba(0,240,255,0.5)]' : 'text-white/80 group-hover:text-cyan-400 transition-colors'}`}>
                  {p.name}
                </span>

                {isSelectable && displayPhase === PHASES.EXECUTIVE_ACTION && (
                  <span className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[7px] text-red-500 font-black bg-red-950 px-1.5 py-0.5 border border-red-500 shadow-[0_0_20px_rgba(255,0,60,0.8)] opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap transform group-hover:-translate-y-1">KILL</span>
                )}
                
                {isSelectable && displayPhase === PHASES.NOMINATION && (
                  <span className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[6px] text-cyan-400 font-black bg-cyan-950 px-1.5 py-0.5 border border-cyan-400 shadow-[0_0_20px_rgba(0,240,255,0.8)] opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap transform group-hover:-translate-y-1">TAP</span>
                )}

                {/* VOTE STATES (ONLY RENDER IN VOTING PHASE) */}
                {showVoteState && (
                   <div className="absolute -bottom-1.5 inset-x-1 flex justify-center z-30">
                     {isRevealed && finalVote === 'YA' && (
                       <span className="text-[6px] sm:text-[7px] text-cyan-400 bg-cyan-950/90 font-black border border-cyan-400 px-1.5 py-0.5 shadow-[0_0_15px_rgba(0,240,255,0.8)] whitespace-nowrap animate-in zoom-in duration-300">[ ✔ JA ]</span>
                     )}
                     {isRevealed && finalVote === 'NEIN' && (
                       <span className="text-[6px] sm:text-[7px] text-red-500 bg-red-950/90 font-black border border-red-500 px-1.5 py-0.5 shadow-[0_0_15px_rgba(255,0,60,0.8)] whitespace-nowrap animate-in zoom-in duration-300">[ ✖ NEIN ]</span>
                     )}
                     {!isRevealed && p.hasVoted && (
                       <span className="text-[6px] sm:text-[7px] text-white bg-black/80 font-bold border border-white/40 px-1 whitespace-nowrap shadow-[0_0_10px_rgba(255,255,255,0.1)]">[ • READY ]</span>
                     )}
                     {!isRevealed && !p.hasVoted && (
                       <span className="text-[6px] sm:text-[7px] text-white/40 bg-black/80 font-bold border border-white/10 px-1 whitespace-nowrap animate-pulse-slow">[ ○ WAITING ]</span>
                     )}
                   </div>
                )}

              </motion.button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <motion.div 
      key={`viewport-${displayPhase}`}
      initial={{ opacity: 0, scale: 0.98, filter: 'brightness(1.5)' }}
      animate={{ 
        opacity: 1, 
        scale: 1, 
        filter: 'brightness(1)',
        x: revealStage === 1 ? [-8, 8, -4, 4, 0] : 0,
        y: revealStage === 1 ? [-4, 4, -2, 2, 0] : 0
      }}
      transition={{ 
        duration: revealStage === 1 ? 0.4 : 0.6, 
        ease: "easeOut" 
      }}
      className="h-[100dvh] w-full flex flex-col overflow-hidden bg-obsidian-950 relative pt-[60px] sm:pt-16"
    >
      {/* Cinematic Overlays */}
      <div className={`absolute inset-0 z-50 pointer-events-none transition-all duration-300 ${revealStage === 0 && revealState ? 'bg-black/80' : 'bg-transparent'}`} />
      
      {revealStage === 1 && revealState && (
        <motion.div 
          initial={{ opacity: 0.8 }} 
          animate={{ opacity: 0 }} 
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={`absolute inset-0 z-50 pointer-events-none ${revealState.result === 'APPROVED' ? 'bg-cyan-400' : 'bg-red-500'}`} 
        />
      )}
      
      {/* Background Grid */}
      <div className={`fixed inset-0 z-0 bg-[url('/grid.svg')] opacity-5 pointer-events-none transition-all duration-1000 ${displayPhase === PHASES.LEGISLATIVE_PRESIDENT || displayPhase === PHASES.LEGISLATIVE_CHANCELLOR ? 'opacity-2' : ''}`} />
      
      {/* Ambient background glow for phase personality */}
      <div className={`absolute inset-0 z-0 pointer-events-none opacity-20 transition-all duration-1000 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] ${displayPhase === PHASES.VOTING ? 'from-cyan-900/40 via-transparent to-transparent' : displayPhase === PHASES.EXECUTIVE_ACTION ? 'from-red-900/40 via-transparent to-transparent' : 'from-transparent to-transparent'}`} />

      {/* TOP ZONE */}
      <div className="w-full shrink-0 flex flex-col relative z-20 items-center">
        {renderTurnHeader()}
        {renderRolesBox()}
      </div>

      {/* MIDDLE ZONE */}
      <div className="w-full flex-1 min-h-0 flex flex-col justify-center relative z-10 py-2">
        {renderActionState()}
        {renderPolicyTracks()}
      </div>

      {/* BOTTOM ZONE (Players + Info) */}
      <div className="w-full shrink-0 flex flex-col justify-end relative z-10 pb-4">
        {renderGameInfoLine()}
        {renderPlayerGrid()}
      </div>
    </motion.div>
  );
}
