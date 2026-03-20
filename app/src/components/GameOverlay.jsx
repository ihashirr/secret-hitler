import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PHASES } from '../lib/constants';

export default function GameOverlay({ 
  gameState, 
  playerId, 
  revealState, 
  pendingSelection, 
  onConfirm, 
  onCancel,
  onVote,
  onDiscard,
  onEnact
}) {
  const myActualId = gameState?.myPlayerId || playerId;
  const isPresident = gameState.amIPresident || (myActualId === gameState.currentPresident);
  const isChancellor = gameState.amIChancellor || (myActualId === gameState.currentChancellor);
  const me = gameState.players.find(p => p.id === myActualId);
  
  const currentPresident = gameState.players.find(p => p.id === gameState.currentPresident);
  const currentChancellor = gameState.players.find(p => p.id === gameState.currentChancellor || p.id === gameState.nominatedChancellor);

  // Determine Overlay State
  let title = '';
  let subtext = '';
  let isActive = false;
  let actionContent = null;

  const displayPhase = revealState ? PHASES.VOTING : gameState.phase;

  if (pendingSelection) {
    title = pendingSelection.type === 'NOMINATE' ? 'Confirm Government Ticket' : 'Confirm Execution Order';
    subtext = `${pendingSelection.name}`;
    isActive = true;
  } else {
    switch (displayPhase) {
      case PHASES.NOMINATION:
        if (isPresident) {
          title = 'Form The Next Government';
          subtext = 'Choose one player to serve as chancellor this round';
          isActive = true;
        } else {
          title = 'President Selecting Chancellor';
          subtext = `${currentPresident?.name || 'The president'} is building the next ticket`;
          isActive = true;
        }
        break;

      case PHASES.VOTING:
        if (revealState) {
          title = revealState.result === 'APPROVED' ? 'Government Approved' : 'Government Rejected';
          subtext = `Final tally: ${revealState.ya} Ja, ${revealState.nein} Nein`;
          isActive = true;
        } else if (!me?.hasVoted) {
          title = 'Cast Your Vote';
          subtext = `Vote privately on ${currentChancellor?.name || 'the proposed government'}`;
          isActive = true;
          actionContent = (
            <div className="flex gap-8 mt-6 pointer-events-auto">
              <button 
                onClick={() => onVote(true)} 
                className="relative group transition-all duration-300 hover:scale-[1.15] active:scale-95"
              >
                <img src="/assets/vote-yes.png" alt="Ja" className="w-[80px] sm:w-[100px] drop-shadow-lg group-hover:drop-shadow-2xl transition-all" />
              </button>
              <button 
                onClick={() => onVote(false)} 
                className="relative group transition-all duration-300 hover:scale-[1.15] active:scale-95"
              >
                <img src="/assets/vote-no.png" alt="Nein" className="w-[80px] sm:w-[100px] drop-shadow-lg group-hover:drop-shadow-2xl transition-all" />
              </button>
            </div>
          );
        } else {
          title = 'Votes Are Still Coming In';
          subtext = 'Waiting for every player to lock in a private vote';
          isActive = true;
        }
        break;

      case PHASES.LEGISLATIVE_PRESIDENT:
        if (isPresident) {
          title = 'President Briefing';
          subtext = 'Review the agenda and discard one policy';
          isActive = true;
          if (gameState.drawnCards) {
            actionContent = (
              <div className="flex gap-6 mt-6 pointer-events-auto group/cards">
                {gameState.drawnCards.map((card, i) => (
                  <button 
                    key={i} 
                    onClick={() => onDiscard(i)} 
                    className="relative group hover:scale-110 hover:-translate-y-4 transition-all duration-300 group-hover/cards:opacity-50 hover:!opacity-100"
                  >
                    <img 
                      src={card === 'FASCIST' ? "/assets/policy-fascist.png" : "/assets/policy-liberal.png"} 
                      className={`w-[65px] sm:w-[85px] drop-shadow-md rounded-sm border border-[#2c2c2c]/10`} 
                      alt={card} 
                    />
                    <div className="absolute inset-x-0 -bottom-8 opacity-0 group-hover:opacity-100 transition-all text-[8px] sm:text-[10px] font-black text-[#c1272d] uppercase tracking-widest pt-2 font-mono">
                      [DISCARD]
                    </div>
                  </button>
                ))}
              </div>
            );
          }
        } else {
          title = 'President Reviewing The Agenda';
          subtext = `${currentPresident?.name || 'The president'} is handling the first decision`;
          isActive = true;
        }
        break;

      case PHASES.LEGISLATIVE_CHANCELLOR:
        if (isChancellor) {
          title = 'Chancellor Briefing';
          subtext = 'Choose the policy that will define this round';
          isActive = true;
          if (gameState.drawnCards) {
            actionContent = (
              <div className="flex gap-8 mt-6 pointer-events-auto group/cards">
                {gameState.drawnCards.map((card, i) => (
                  <button 
                    key={i} 
                    onClick={() => onEnact(i)} 
                    className="relative group hover:scale-110 hover:-translate-y-4 transition-all duration-300 group-hover/cards:opacity-50 hover:!opacity-100"
                  >
                    <img 
                      src={card === 'FASCIST' ? "/assets/policy-fascist.png" : "/assets/policy-liberal.png"} 
                      className={`w-[75px] sm:w-[95px] drop-shadow-md rounded-sm border border-[#2c2c2c]/10`} 
                      alt={card} 
                    />
                    <div className="absolute inset-x-0 -bottom-8 opacity-0 group-hover:opacity-100 transition-all text-[8px] sm:text-[10px] font-black text-[#2b5c8f] uppercase tracking-widest pt-2 font-mono">
                      [ENACT]
                    </div>
                  </button>
                ))}
              </div>
            );
          }
        } else {
          title = 'Chancellor Making The Final Choice';
          subtext = `${currentChancellor?.name || 'The chancellor'} is selecting the policy to enact`;
          isActive = true;
        }
        break;

      case PHASES.EXECUTIVE_ACTION:
        if (isPresident) {
          title = 'Executive Order';
          subtext = 'Choose one player to eliminate from the room';
          isActive = true;
        } else {
          title = 'President Issuing An Order';
          subtext = `${currentPresident?.name || 'The president'} is deciding who will be removed`;
          isActive = true;
        }
        break;

      default:
        isActive = false;
    }
  }

  const [isDismissed, setIsDismissed] = React.useState(false);

  // Reset dismissal state whenever the action prompt changes
  React.useEffect(() => {
    setIsDismissed(false);
  }, [title, displayPhase, pendingSelection]);

  if (!isActive) return null;

  const hasActionContent = !!actionContent || !!pendingSelection;

  return (
    <AnimatePresence>
      {/* 
        TOP BANNER (Status / Directive)
        Always present to tell the player WHAT is happening without blocking the board. 
      */}
      {!hasActionContent && !isDismissed && (
        <motion.div
          key={`banner-${title}`}
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="fixed top-0 inset-x-0 z-[100] flex justify-center pointer-events-none px-4 pt-4 sm:pt-6"
        >
          <div className="bg-[#f4eee0] border-2 border-b-4 border-[#c1272d] shadow-[0_10px_30px_rgba(193,39,45,0.2)] rounded-sm px-8 py-4 flex flex-col items-center pointer-events-auto relative overflow-hidden">
            <div className="absolute inset-0 paper-grain opacity-10 pointer-events-none" />
            <button 
              onClick={() => setIsDismissed(true)}
              className="absolute top-1 right-1 p-1 text-[#2c2c2c]/50 hover:text-[#c1272d] hover:bg-black/5 rounded-full transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
            <h2 className="text-base sm:text-2xl font-serif font-black tracking-widest uppercase text-[#2c2c2c]">
              {title}
            </h2>
            {subtext && (
              <p className={`text-[10px] sm:text-xs font-mono tracking-tight mt-1 ${pendingSelection ? 'text-[#c1272d] font-bold' : 'text-[#6a6a6a]'}`}>
                {subtext}
              </p>
            )}
          </div>
        </motion.div>
      )}

      {/* Minimized Top Banner */}
      {!hasActionContent && isDismissed && (
        <motion.div
          key="minimized-banner"
          initial={{ y: -50 }}
          animate={{ y: 0 }}
          className="fixed top-0 inset-x-0 z-[100] flex justify-center pointer-events-none"
        >
          <button 
            onClick={() => setIsDismissed(false)}
            className="bg-[#f4eee0] border border-t-0 border-[#c1272d] text-[#c1272d] px-6 py-1.5 rounded-b-md shadow-md text-[10px] font-mono font-black uppercase tracking-widest pointer-events-auto hover:bg-[#fff9ed] transition-colors flex items-center gap-2"
          >
            Show Briefing
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
          </button>
        </motion.div>
      )}

      {/* 
        BOTTOM DESK (Action Content)
        Slides up only when the player has physical interactive elements (Cards, Votes).
      */}
      {hasActionContent && !isDismissed && (
        <motion.div
           key={`desk-${displayPhase}`}
           initial={{ y: "100%" }}
           animate={{ y: 0 }}
           exit={{ y: "100%" }}
           transition={{ type: "spring", stiffness: 250, damping: 30 }}
           className="fixed bottom-0 inset-x-0 z-[110] flex justify-center pointer-events-none"
        >
          {/* The Desk Surface */}
          <div className="bg-[#e8dcc4] border-t-[12px] border-[#2c2c2c] w-full max-w-4xl px-4 pt-10 pb-12 sm:pb-16 flex flex-col items-center shadow-[0_-20px_50px_rgba(0,0,0,0.6)] pointer-events-auto relative overflow-hidden">
            <div className="absolute inset-0 paper-grain opacity-10 pointer-events-none" />
            
            {/* Close Button */}
            <button 
              onClick={() => setIsDismissed(true)}
              className="absolute top-4 right-4 p-2 text-[#2c2c2c]/70 hover:text-[#c1272d] bg-black/5 hover:bg-black/10 rounded-full transition-colors z-20"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>

            {/* Classification Tape on the Desk */}
            <div className="absolute top-0 inset-x-0 h-1.5 bg-[#c1272d]/30 w-full" />
            <div className="absolute top-[-14px] left-1/2 -translate-x-1/2 bg-[#c1272d] text-white text-[10px] font-mono font-black uppercase tracking-[0.3em] px-6 py-1.5 rounded-t-sm shadow-md border border-[#8a001d]">
              {title}
            </div>

            {subtext && (
              <p className="text-xs font-mono font-bold text-[#c1272d] mb-4 uppercase tracking-widest bg-[#c1272d]/5 border border-[#c1272d]/20 px-4 py-1 rounded-sm">
                {subtext}
              </p>
            )}

            {actionContent && (
              <div className="mb-2 relative z-10 w-full flex justify-center">
                {actionContent}
              </div>
            )}

            {pendingSelection && (
              <div className="flex gap-4 sm:gap-8 mt-4 relative z-10">
                <button 
                  onClick={onConfirm}
                  className="px-6 py-3 sm:px-10 sm:py-4 bg-[#c1272d] text-white font-serif font-black text-xs sm:text-sm uppercase tracking-widest hover:bg-[#a01d22] transition-colors shadow-lg active:scale-95 flex items-center gap-2 border-b-4 border-[#8a001d]"
                >
                  Confirm
                </button>
                <button 
                  onClick={onCancel}
                  className="px-6 py-3 sm:px-10 sm:py-4 bg-[#d4c098] text-[#2c2c2c] font-serif font-black text-xs sm:text-sm uppercase tracking-widest hover:bg-[#b09868] transition-colors shadow-lg active:scale-95 border-b-4 border-[#b09868]"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Minimized Bottom Desk */}
      {hasActionContent && isDismissed && (
        <motion.div
          key="minimized-desk"
          initial={{ y: 50 }}
          animate={{ y: 0 }}
          className="fixed bottom-0 inset-x-0 z-[110] flex justify-center pointer-events-none"
        >
          <button 
            onClick={() => setIsDismissed(false)}
            className="bg-[#2c2c2c] border-2 border-b-0 border-[#4a4a4a] text-white px-8 py-3 rounded-t-lg shadow-[0_-10px_20px_rgba(0,0,0,0.5)] text-xs font-mono font-black uppercase tracking-widest pointer-events-auto hover:bg-[#1a1a1a] transition-all flex items-center gap-2 hover:-translate-y-1"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
            Reopen Action Desk
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
