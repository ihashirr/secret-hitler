import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PHASES, ROLES, FACTIONS, FASCIST_TO_WIN, LIBERAL_TO_WIN, MAX_ELECTION_TRACKER } from '../lib/constants';
import { Shield, Skull, Crown, Star, AlertTriangle, Check, X, Info, ChevronDown, ChevronUp } from 'lucide-react';
import GameOverlay from './GameOverlay';

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
  const [showGameInfo, setShowGameInfo] = React.useState(false);
  const [pendingSelection, setPendingSelection] = React.useState(null); // { id: string, type: 'NOMINATE' | 'KILL' }
  const prevPhaseRef = React.useRef(gameState.phase);

  React.useEffect(() => {
    setHasActedLocal(false);
    setPendingSelection(null);
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

  const handleNominate = (id) => { 
    const player = gameState.players.find(p => p.id === id);
    setPendingSelection({ id, name: player?.name, type: 'NOMINATE' });
  };
  const handleVote = (approve) => { onVote(approve); setHasActedLocal(true); };
  const handleKill = (id) => { 
    const player = gameState.players.find(p => p.id === id);
    setPendingSelection({ id, name: player?.name, type: 'KILL' });
  };

  const confirmSelection = () => {
    if (!pendingSelection) return;
    if (pendingSelection.type === 'NOMINATE') onNominate(pendingSelection.id);
    if (pendingSelection.type === 'KILL') onKill(pendingSelection.id);
    setPendingSelection(null);
    setHasActedLocal(true);
  };

  const cancelSelection = () => setPendingSelection(null);

  // Removed renderTurnHeader, renderRolesBox, and renderActionState as they are now handled by GameOverlay

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
    <div className="w-full max-w-[500px] mx-auto z-20 px-4 mb-2">
      <button 
        onClick={() => setShowGameInfo(!showGameInfo)}
        className="flex items-center gap-2 px-3 py-1.5 bg-black/40 border border-white/10 hover:border-white/30 transition-all rounded-sm group font-mono text-[9px] uppercase tracking-widest text-white/60"
      >
        <Info size={12} className="group-hover:text-cyan-400 transition-colors" />
        <span>Game Info</span>
        {showGameInfo ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
      </button>

      <AnimatePresence>
        {showGameInfo && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="flex justify-between items-center w-full px-4 py-3 my-2 bg-black/60 border border-white/10 text-[10px] sm:text-[11px] font-mono font-black uppercase tracking-[0.25em] text-white/50 shadow-[0_0_20px_rgba(0,0,0,0.8)] backdrop-blur-md">
              <div className="flex gap-6">
                <span>DECK: <strong className="text-cyan-400 ml-1.5">{gameState.drawPileCount}</strong></span>
                <span>DISCARD: <strong className="text-white ml-1.5">{gameState.discardPileCount}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <span className="mr-1">CHAOS:</span>
                <div className="flex gap-1.5">
                  {Array.from({ length: MAX_ELECTION_TRACKER }).map((_, i) => (
                    <div key={i} className={`w-2.5 h-2.5 border ${i < gameState.electionTracker ? 'bg-red-500 border-red-400 shadow-[0_0_10px_rgba(255,0,60,0.8)]' : 'border-cyan-500/20'} transform rotate-45 transition-all duration-500`} />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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

            const isPending = pendingSelection?.id === p.id;

            // Voting Statuses
            const showVoteState = isVotingPhase && p.isAlive;
            const isRevealed = !!revealState;
            const finalVote = isRevealed ? revealState.votes[p.id] : null;
            
            // Dim inactive players during legislative
            const isInactiveLegislator = isLegislativePhase && !pIsPresident && !pIsChancellor;

            return (
              <motion.button
                key={p.id}
                whileHover={isSelectable ? { scale: 1.05, y: -4 } : {}}
                whileTap={isSelectable ? { scale: 0.95 } : {}}
                onClick={() => {
                  if (!isSelectable) return;
                  if (displayPhase === PHASES.NOMINATION) handleNominate(p.id);
                  if (displayPhase === PHASES.EXECUTIVE_ACTION) handleKill(p.id);
                }}
                className={`relative flex flex-col items-center justify-center text-center p-1.5 pt-2.5 pb-2 h-28 sm:h-32 aspect-[3/4] transition-all duration-300 border group
                  ${isInactiveLegislator ? 'opacity-30 grayscale-[0.7]' : ''}
                  ${isSelectable ? 'cursor-pointer border-cyan-400 bg-cyan-950/20 hover:border-cyan-300 hover:shadow-[0_0_35px_rgba(0,240,255,0.6)] shadow-[0_0_15px_rgba(0,240,255,0.2)] group-hover/grid:opacity-50 hover:!opacity-100 ring-1 ring-cyan-500/20' : 'cursor-default'}
                  ${!isSelectable && !isVotingPhase ? 'border-white/5 bg-black/40' : ''}
                  ${!p.isAlive ? 'opacity-20' : ''}
                  ${pIsPresident ? 'border-yellow-500/60 bg-yellow-950/20 shadow-[0_0_20px_rgba(234,179,8,0.15)] ring-1 ring-yellow-500/30' : ''}
                  ${pIsChancellor && !pIsPresident ? 'border-white/40 bg-white/5 shadow-[0_0_15px_rgba(255,255,255,0.1)] ring-1 ring-white/10' : ''}
                  
                  ${isPending ? 'border-cyan-400 bg-cyan-400/20 shadow-[0_0_40px_rgba(0,240,255,0.8)] z-30 scale-110 !opacity-100 ring-2 ring-white/50' : ''}
                  ${showVoteState && !isRevealed && !p.hasVoted ? 'opacity-50 grayscale-[0.5] border-cyan-500/10' : ''}
                  ${showVoteState && !isRevealed && p.hasVoted ? 'border-cyan-500/60 bg-cyan-950/30 shadow-[0_0_20px_rgba(0,240,255,0.2)] ring-1 ring-cyan-500/40' : ''}
                  ${isSelectTarget && showVoteState ? 'border-cyan-400 shadow-[0_0_25px_rgba(0,240,255,0.4)] ring-2 ring-cyan-400/50' : ''}
                  ${isRevealed && finalVote === 'YA' ? 'border-cyan-400 bg-cyan-950/60 shadow-[0_0_40px_rgba(0,240,255,0.7)] z-20 scale-110' : ''}
                  ${isRevealed && finalVote === 'NEIN' ? 'border-red-500 bg-red-950/60 shadow-[0_0_40px_rgba(255,0,60,0.7)] z-20 scale-110' : ''}
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

      {/* Main Overlay Driver */}
      <GameOverlay 
        gameState={gameState} 
        playerId={playerId} 
        revealState={revealState}
        pendingSelection={pendingSelection}
        onConfirm={confirmSelection}
        onCancel={cancelSelection}
        onVote={onVote}
        onDiscard={onDiscard}
        onEnact={onEnact}
      />

      {/* TOP ZONE (Removed header, keep spacing if needed) */}
      <div className="w-full shrink-0 h-4" />

      {/* MIDDLE ZONE (Board Focus) */}
      <div className={`w-full flex-1 min-h-0 flex flex-col justify-center relative z-10 py-2 transition-all duration-700 
        ${(revealState || gameState.phase !== PHASES.NONE || pendingSelection) ? 'opacity-40 blur-[1px]' : 'opacity-100'}`}>
        {renderPolicyTracks()}
      </div>

      {/* BOTTOM ZONE (Players + Info) */}
      <div className={`w-full shrink-0 flex flex-col justify-end relative z-10 pb-6 transition-all duration-700
        ${(revealState || pendingSelection) ? 'opacity-100 scale-[1.02]' : (gameState.phase !== PHASES.NONE ? 'opacity-80' : 'opacity-100')}`}>
        {renderGameInfoLine()}
        {renderPlayerGrid()}
      </div>
    </motion.div>
  );
}
