import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PHASES, FASCIST_TO_WIN, LIBERAL_TO_WIN, MAX_ELECTION_TRACKER } from '../lib/constants';
import { Shield, Skull, Check, Info, ChevronDown, ChevronUp } from 'lucide-react';
import GameOverlay from './GameOverlay';

const getStableNumber = (seed, min, max) => {
  let hash = 0;
  for (const char of seed) {
    hash = (hash * 31 + char.charCodeAt(0)) % 100000;
  }

  return min + (hash % (max - min + 1));
};

const getAvatarId = (player) => {
  if (player.avatarId) return player.avatarId;
  return getStableNumber(player.id || player.name || 'operative', 1, 10);
};

const getCardTilt = (playerId) => getStableNumber(playerId || 'card', -2, 2);
const getVoteStampRotation = (playerId, vote) => getStableNumber(`${playerId}-${vote}`, -10, 10);

export default function GameBoard({ gameState, playerId, onNominate, onVote, onDiscard, onEnact, onKill }) {
  const myActualId = gameState?.myPlayerId || playerId;
  const isPresident = gameState.amIPresident || (myActualId === gameState.currentPresident);

  const canNominate = gameState.phase === PHASES.NOMINATION && isPresident;
  const canKill = gameState.phase === PHASES.EXECUTIVE_ACTION && isPresident;
  
  // Vote Reveal Sequence State
  const [revealState, setRevealState] = React.useState(null); 
  const [revealStage, setRevealStage] = React.useState(0);
  const [showGameInfo, setShowGameInfo] = React.useState(false);
  const [pendingSelection, setPendingSelection] = React.useState(null); // { id: string, type: 'NOMINATE' | 'KILL' }
  const prevPhaseRef = React.useRef(gameState.phase);

  React.useEffect(() => {
    setPendingSelection(null);
  }, [gameState.phase]);

  // Vote Interception Logic
  React.useEffect(() => {
    if (prevPhaseRef.current === PHASES.VOTING && gameState.phase !== PHASES.VOTING) {
      if (!gameState.lastVotes) return;
      
      let ya = 0; let nein = 0;
      Object.values(gameState.lastVotes).forEach(v => {
        if (v === 'YA') ya++; else nein++;
      });
      
      setRevealState({ 
        result: ya > nein ? 'APPROVED' : 'REJECTED', 
        votes: gameState.lastVotes,
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
  }, [gameState.phase, gameState.players, gameState.lastVotes]);

  const displayPhase = revealState ? PHASES.VOTING : gameState.phase;

  const handleNominate = (id) => { 
    const player = gameState.players.find(p => p.id === id);
    setPendingSelection({ id, name: player?.name, type: 'NOMINATE' });
  };
  const handleKill = (id) => { 
    const player = gameState.players.find(p => p.id === id);
    setPendingSelection({ id, name: player?.name, type: 'KILL' });
  };

  const confirmSelection = () => {
    if (!pendingSelection) return;
    if (pendingSelection.type === 'NOMINATE') onNominate(pendingSelection.id);
    if (pendingSelection.type === 'KILL') onKill(pendingSelection.id);
    setPendingSelection(null);
  };

  const cancelSelection = () => setPendingSelection(null);

  // Removed renderTurnHeader, renderRolesBox, and renderActionState as they are now handled by GameOverlay

  const renderTrack = (current, max, type) => {
    const isFascist = type === 'FASCIST';
    // Muted, non-neon colors for the physical aesthetic
    const activeColor = isFascist ? 'bg-[#c1272d] border border-[#ff4d4d]' : 'bg-[#2b5c8f] border border-[#5a9cff]';
    const inactiveColor = isFascist ? 'border-2 border-dashed border-[#8a001d]/40 bg-[#8a001d]/5' : 'border-2 border-dashed border-[#005a7a]/40 bg-[#005a7a]/5';
    const lineColor = isFascist ? 'border-t-2 border-dotted border-[#8a001d]/40' : 'border-t-2 border-dotted border-[#005a7a]/40';

    return (
      <div className="flex items-center w-full justify-between pb-2 relative px-1 sm:px-2 z-10">
        {Array.from({ length: max }).map((_, i) => (
          <React.Fragment key={i}>
            <div className="relative flex flex-col items-center group/slot">
              <div className={`w-6 h-8 sm:w-8 sm:h-11 flex-shrink-0 flex flex-col items-center justify-center transition-all duration-700 relative z-10 rounded-sm shadow-sm
                ${i < current ? activeColor + ' shadow-md rounded-sm' : inactiveColor}`}
              >
                {i < current && (
                  <div className="absolute inset-0 paper-grain opacity-10 mix-blend-multiply pointer-events-none" />
                )}
                
                {i < current && (isFascist ? <Skull size={10} className="text-[#3a0a0a] opacity-80" /> : <Shield size={10} className="text-[#0a1a3a] opacity-80" />)}
              </div>
              
              {/* Highlight flash when newly added */}
              {i === current - 1 && (
                <motion.div 
                  initial={{ scale: 1.5, opacity: 1 }} 
                  animate={{ scale: 1, opacity: 0 }} 
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className={`absolute inset-0 z-20 ${isFascist ? 'bg-[#ff4d4d]' : 'bg-[#5a9cff]'} rounded-sm pointer-events-none mix-blend-overlay`}
                />
              )}
            </div>
            {i < max - 1 && (
              <div className={`flex-1 ${i < current - 1 ? (isFascist ? 'border-t-2 border-[#c1272d]' : 'border-t-2 border-[#2b5c8f]') : lineColor} transition-colors duration-700 mx-1 sm:mx-2 mt-4`} />
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };

  const renderPolicyTracks = () => {
    // Dim the policy tracks massively during voting
    const isDimmed = displayPhase === PHASES.VOTING;
    const trackClasses = `flex flex-col gap-3 w-full shrink-0 px-4 max-w-[600px] mx-auto mt-2 transition-all duration-700 ${isDimmed ? 'opacity-40 grayscale-[0.5] scale-[0.98]' : 'opacity-100'}`;

    return (
      <div className={trackClasses}>
        
        {/* LIBERAL */}
        <div className="relative w-full h-[60px] sm:h-[70px] bg-[var(--color-paper-light)] border-2 border-[#d4c098] overflow-hidden flex flex-col justify-end shadow-md rounded-sm">
          <img src="/assets/board-liberal.png" className="absolute inset-x-0 bottom-0 w-full h-auto min-h-full object-cover object-center opacity-30 mix-blend-multiply pointer-events-none" alt="" />
          <div className="absolute inset-0 paper-grain opacity-[0.08] pointer-events-none"></div>
          
          <div className="absolute top-1.5 left-2 z-10">
            <span className="text-[8px] font-mono font-black text-[#2b5c8f] tracking-[0.2em] border border-[#2b5c8f]/30 px-1.5 py-0.5 bg-[#e8dcc4]/80 backdrop-blur-sm rounded-sm uppercase flex items-center gap-1">
              [LIBERAL] {gameState.liberalPolicies}/{LIBERAL_TO_WIN}
            </span>
          </div>
          
          <div className="relative z-10 w-full px-2">
            {renderTrack(gameState.liberalPolicies, LIBERAL_TO_WIN, 'LIBERAL')}
          </div>
        </div>

        {/* FASCIST */}
        <div className="relative w-full h-[60px] sm:h-[70px] bg-[#3a0f12] border-2 border-[#2a0a0a] overflow-hidden flex flex-col justify-end shadow-md rounded-sm">
          <img src="/assets/board-fascist.png" className="absolute inset-x-0 bottom-0 w-full h-auto min-h-full object-cover object-center opacity-40 mix-blend-multiply pointer-events-none" alt="" />
          <div className="absolute inset-0 paper-grain opacity-[0.1] pointer-events-none"></div>
          
          <div className="absolute top-1.5 left-2 z-10">
            <span className="text-[8px] font-mono font-black text-[#ff4d4d] tracking-[0.2em] border border-[#ff4d4d]/30 px-1.5 py-0.5 bg-[#2a0a0a]/80 backdrop-blur-sm rounded-sm uppercase flex items-center gap-1">
              [FASCIST] {gameState.fascistPolicies}/{FASCIST_TO_WIN}
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
    <div className="w-full max-w-[600px] mx-auto z-20 px-4 mb-2 relative">
      <button 
        onClick={() => setShowGameInfo(!showGameInfo)}
        className="flex items-center justify-center gap-2 px-6 py-1.5 bg-[#d4c098] border-2 border-b-0 border-[#b09868] text-[#2c2c2c] hover:bg-[#e8dcc4] transition-all rounded-t-md shadow-sm group font-mono text-[9px] font-black uppercase tracking-widest mx-auto translate-y-[2px]"
      >
        <Info size={12} className="group-hover:text-[#2b5c8f] transition-colors" />
        <span>CLASSIFIED INTEL</span>
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
            <div className="flex flex-col sm:flex-row justify-between items-center w-full px-6 py-4 bg-[var(--color-paper-light)] border-2 border-[#d4c098] text-[10px] sm:text-[11px] font-mono font-black uppercase tracking-[0.2em] text-[#2c2c2c] shadow-lg relative rounded-sm overflow-hidden">
              <div className="absolute inset-0 paper-grain opacity-10 pointer-events-none" />
              
              {/* Top Secret Stamp */}
              <div className="absolute top-2 left-3 text-[#c1272d] text-[7px] border-2 border-[#c1272d] px-1 py-0.5 opacity-60 transform -rotate-3 mix-blend-multiply">
                EYES ONLY
              </div>

              <div className="flex justify-center flex-1 gap-8 mt-4 sm:mt-0">
                <span className="flex items-center">DECK: <strong className="text-[#2b5c8f] ml-2 text-base">{gameState.drawPileCount}</strong></span>
                <span className="flex items-center">DISCARD: <strong className="text-[#c1272d] ml-2 text-base">{gameState.discardPileCount}</strong></span>
              </div>
              
              <div className="flex items-center gap-3 mt-4 sm:mt-0 flex-1 justify-center sm:justify-end">
                <span className="mr-1 text-[#8a001d]">CHAOS:</span>
                <div className="flex gap-2">
                  {Array.from({ length: MAX_ELECTION_TRACKER }).map((_, i) => (
                    <div key={i} className={`w-3.5 h-3.5 rounded-full border-2 ${i < gameState.electionTracker ? 'bg-[#c1272d] border-[#8a001d]' : 'border-[#d4c098] bg-[#e8dcc4]'} transition-all duration-500`} />
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
    const isVotingPhase = displayPhase === PHASES.VOTING;
    const isLegislativePhase = displayPhase === PHASES.LEGISLATIVE_PRESIDENT || displayPhase === PHASES.LEGISLATIVE_CHANCELLOR;

    return (
      <div className={`w-full max-w-[600px] mx-auto z-10 px-4 transition-all duration-500 pb-20`}>
        
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 pb-6 place-content-start group/grid justify-center">
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
              <div key={p.id} className="relative flex flex-col items-center">
                
                {/* ROLE TAGS (Look like Dymo labels or gold plaques) */}
                {(pIsPresident || pIsChancellor) && (
                  <div className={`absolute -top-3 z-30 px-2 py-0.5 text-[8px] font-black uppercase tracking-widest shadow-md rounded-sm
                    ${pIsPresident ? 'bg-[#d4af37] text-white border border-[#b8952b]' : 'bg-[#e0e0e0] text-[#2c2c2c] border border-[#a0a0a0]'}
                  `}>
                    {pIsPresident ? 'PRESIDENT' : 'CHANCELLOR'}
                  </div>
                )}

                <motion.button
                  whileHover={isSelectable ? { y: -5, rotateZ: isPending ? 0 : getCardTilt(p.id) } : {}}
                  whileTap={isSelectable ? { scale: 0.95 } : {}}
                  onClick={() => {
                    if (!isSelectable) return;
                    if (displayPhase === PHASES.NOMINATION) handleNominate(p.id);
                    if (displayPhase === PHASES.EXECUTIVE_ACTION) handleKill(p.id);
                  }}
                  className={`relative flex flex-col items-center justify-between text-center p-2 h-28 sm:h-32 aspect-[3/4] transition-all duration-300 rounded-sm shadow-md group outline-none
                    bg-[var(--color-paper-light)] border border-[#d4c098] overflow-hidden
                    ${isInactiveLegislator ? 'opacity-40 grayscale-[0.5]' : ''}
                    ${isSelectable ? 'cursor-pointer hover:shadow-xl hover:border-[#b09868] hover:bg-[#fff9ed] ring-2 ring-transparent hover:ring-[var(--color-stamp-blue)] hover:ring-offset-2 hover:ring-offset-obsidian-900 group-hover/grid:duration-500' : 'cursor-default'}
                    ${!p.isAlive ? 'opacity-40 brightness-75 bg-[#d8d0c0]' : ''}
                    
                    ${isPending ? 'ring-4 ring-[var(--color-stamp-red)] z-30 scale-105 shadow-2xl !opacity-100' : ''}
                    ${isRevealed && finalVote === 'YA' ? 'ring-4 ring-[#2b5c8f] scale-105 z-20 shadow-xl' : ''}
                    ${isRevealed && finalVote === 'NEIN' ? 'ring-4 ring-[var(--color-stamp-red)] scale-105 z-20 shadow-xl' : ''}
                  `}
                >
                  
                  {/* Faux Photo / Avatar Silhouette */}
                  <div className={`relative w-full aspect-[4/3] border border-[#d4c098] rounded-sm mb-1 mt-1 flex flex-col items-center justify-end overflow-hidden shadow-inner
                    ${!p.isAlive ? 'bg-[#b8b0a0]' : 'bg-[#e8dcc4]'}`}>
                      {p.isAlive ? (
                         <>
                           <img 
                             src={`/assets/avatars/avatar_${getAvatarId(p)}.png`} 
                             alt="Operative Profile" 
                             className="absolute inset-0 w-full h-full object-cover mix-blend-multiply opacity-80 pointer-events-none filter sepia-[0.2] contrast-125 brightness-90"
                           />
                           <div className="absolute inset-0 paper-grain mix-blend-overlay opacity-30 pointer-events-none"></div>
                         </>
                      ) : (
                         <Skull size={24} className="text-[#2c2c2c] mb-2 opacity-50 pointer-events-none z-10 relative" />
                      )}
                  </div>

                  <span className={`font-serif text-[10px] sm:text-xs font-black tracking-tight truncate w-full mt-auto mb-1 
                    ${!p.isAlive ? 'line-through text-[#6a6a6a]' : 'text-[#2c2c2c]'}`}>
                    {p.name}
                  </span>

                  {/* VOTE STATES (Stamps) */}
                  {showVoteState && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      {isRevealed && finalVote === 'YA' && (
                        <motion.div initial={{ scale: 3, opacity: 0, rotate: -20 }} animate={{ scale: 1, opacity: 1, rotate: getVoteStampRotation(p.id, 'YA') }} transition={{ type: "spring", stiffness: 300, damping: 15 }} 
                                    className="text-xl sm:text-2xl font-black text-[#2b5c8f] border-4 border-[#2b5c8f] rounded-sm px-1 opacity-90 rotate-[-15deg] transform mix-blend-multiply flex items-center gap-1 font-mono uppercase tracking-widest">
                          JA
                        </motion.div>
                      )}
                      {isRevealed && finalVote === 'NEIN' && (
                        <motion.div initial={{ scale: 3, opacity: 0, rotate: 20 }} animate={{ scale: 1, opacity: 1, rotate: getVoteStampRotation(p.id, 'NEIN') }} transition={{ type: "spring", stiffness: 300, damping: 15 }} 
                                    className="text-xl sm:text-2xl font-black text-[var(--color-stamp-red)] border-4 border-[var(--color-stamp-red)] rounded-sm px-1 opacity-90 rotate-[15deg] transform mix-blend-multiply font-mono uppercase tracking-widest">
                          NEIN
                        </motion.div>
                      )}
                      {!isRevealed && p.hasVoted && (
                         <div className="absolute bottom-1 right-1 text-[8px] bg-[#d4c8b0] text-[#2c2c2c] px-1 font-bold border border-[#b8b0a0] rounded-sm shadow-sm flex items-center gap-0.5">
                           <Check size={8}/> READY
                         </div>
                      )}
                      {!isRevealed && !p.hasVoted && (
                         <div className="absolute bottom-1 right-1 text-[7px] text-[#8a8a8a] flex items-center gap-0.5 animate-pulse">
                           <div className="w-1.5 h-1.5 border border-[#8a8a8a] rounded-full animate-spin border-t-transparent"/> WAITING
                         </div>
                      )}
                    </div>
                  )}
                  
                  {isSelectable && displayPhase === PHASES.EXECUTIVE_ACTION && !isPending && (
                    <span className="absolute inset-0 m-auto w-fit h-fit text-[10px] text-[var(--color-stamp-red)] font-black border-2 border-[var(--color-stamp-red)] px-2 py-0.5 transform rotate-[-12deg] opacity-0 group-hover:opacity-100 transition-all mix-blend-multiply">ELIMINATE</span>
                  )}

                  {isSelectable && displayPhase === PHASES.NOMINATION && !isPending && (
                    <span className="absolute inset-0 m-auto w-fit h-fit text-[10px] text-[#2b5c8f] font-black border-2 border-[#2b5c8f] px-2 py-0.5 transform rotate-[-5deg] opacity-0 group-hover:opacity-100 transition-all mix-blend-multiply">NOMINATE</span>
                  )}
                </motion.button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const boardDimmed = Boolean(revealState || pendingSelection);

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
      <div className={`fixed inset-0 z-0 board-grid opacity-5 pointer-events-none transition-all duration-1000 ${displayPhase === PHASES.LEGISLATIVE_PRESIDENT || displayPhase === PHASES.LEGISLATIVE_CHANCELLOR ? 'opacity-2' : ''}`} />
      
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
        ${boardDimmed ? 'opacity-40 blur-[1px]' : 'opacity-100'}`}>
        {renderPolicyTracks()}
      </div>

      {/* BOTTOM ZONE (Players + Info) */}
      <div className={`w-full shrink-0 flex flex-col justify-end relative z-10 pb-6 transition-all duration-700
        ${boardDimmed ? 'opacity-100 scale-[1.02]' : 'opacity-80'}`}>
        {renderGameInfoLine()}
        {renderPlayerGrid()}
      </div>
    </motion.div>
  );
}
