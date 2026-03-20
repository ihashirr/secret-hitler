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
  const isPresident = gameState.amIPresident ?? (playerId === gameState.currentPresident);
  const isChancellor = gameState.amIChancellor ?? (playerId === gameState.currentChancellor);
  const me = gameState.players.find(p => p.id === (gameState.myPlayerId || playerId));
  
  const currentPresident = gameState.players.find(p => p.id === gameState.currentPresident);
  const currentChancellor = gameState.players.find(p => p.id === gameState.currentChancellor || p.id === gameState.nominatedChancellor);

  // Determine Overlay State
  let title = '';
  let subtext = '';
  let isActive = false;
  let actionContent = null;

  const displayPhase = revealState ? PHASES.VOTING : gameState.phase;

  if (pendingSelection) {
    title = pendingSelection.type === 'NOMINATE' ? 'CONFIRM CHANCELLOR?' : 'CONFIRM EXECUTION?';
    subtext = `${pendingSelection.name}`;
    isActive = true;
  } else {
    switch (displayPhase) {
      case PHASES.NOMINATION:
        if (isPresident) {
          title = 'SELECT A CHANCELLOR';
          subtext = 'Tap a player below';
          isActive = true;
        } else {
          title = 'WAITING FOR PRESIDENT';
          subtext = `${currentPresident?.name?.toUpperCase() || 'PRESIDENT'} IS SELECTING A CHANCELLOR`;
          isActive = true;
        }
        break;

      case PHASES.VOTING:
        if (revealState) {
          const isApprove = revealState.result === 'APPROVED';
          title = `GOVERNMENT ${revealState.result}`;
          subtext = `JA: ${revealState.ya} — NEIN: ${revealState.nein}`;
          isActive = true;
        } else if (!me?.hasVoted) {
          title = 'VOTE NOW';
          subtext = `Ja or Nein for ${currentChancellor?.name || 'Proposed Government'}`;
          isActive = true;
          actionContent = (
            <div className="flex gap-8 mt-10 pointer-events-auto">
              <button 
                onClick={() => onVote(true)} 
                className="relative group transition-all duration-300 hover:scale-[1.15] active:scale-95"
              >
                <img src="/assets/vote-yes.png" alt="Ja" className="w-[80px] sm:w-[100px] drop-shadow-[0_0_20px_rgba(0,240,255,0.4)] group-hover:drop-shadow-[0_0_40px_rgba(0,240,255,1)]" />
              </button>
              <button 
                onClick={() => onVote(false)} 
                className="relative group transition-all duration-300 hover:scale-[1.15] active:scale-95"
              >
                <img src="/assets/vote-no.png" alt="Nein" className="w-[80px] sm:w-[100px] drop-shadow-[0_0_20px_rgba(255,0,60,0.4)] group-hover:drop-shadow-[0_0_40px_rgba(255,0,60,1)]" />
              </button>
            </div>
          );
        } else {
          title = 'WAITING FOR PLAYERS';
          subtext = 'Tallying democratic consensus...';
          isActive = true;
        }
        break;

      case PHASES.LEGISLATIVE_PRESIDENT:
        if (isPresident) {
          title = 'LEGISLATIVE SESSION';
          subtext = 'Discard one policy';
          isActive = true;
          if (gameState.drawnCards) {
            actionContent = (
              <div className="flex gap-6 mt-10 pointer-events-auto group/cards">
                {gameState.drawnCards.map((card, i) => (
                  <button 
                    key={i} 
                    onClick={() => onDiscard(i)} 
                    className="relative group hover:scale-110 hover:-translate-y-4 transition-all duration-300 group-hover/cards:opacity-50 hover:!opacity-100"
                  >
                    <img 
                      src={card === 'FASCIST' ? "/assets/policy-fascist.png" : "/assets/policy-liberal.png"} 
                      className={`w-[65px] sm:w-[85px] drop-shadow-[0_0_15px_${card === 'FASCIST' ? 'rgba(255,0,60,0.5)' : 'rgba(0,240,255,0.5)'}]`} 
                      alt={card} 
                    />
                    <div className="absolute inset-x-0 -bottom-8 opacity-0 group-hover:opacity-100 transition-all text-[8px] sm:text-[10px] font-black text-red-500 uppercase tracking-widest pt-2">
                      DISCARD
                    </div>
                  </button>
                ))}
              </div>
            );
          }
        } else {
          title = 'WAITING FOR PRESIDENT';
          subtext = `${currentPresident?.name?.toUpperCase() || 'PRESIDENT'} IS REVIEWING POLICIES`;
          isActive = true;
        }
        break;

      case PHASES.LEGISLATIVE_CHANCELLOR:
        if (isChancellor) {
          title = 'LEGISLATIVE SESSION';
          subtext = 'Enact one policy';
          isActive = true;
          if (gameState.drawnCards) {
            actionContent = (
              <div className="flex gap-8 mt-10 pointer-events-auto group/cards">
                {gameState.drawnCards.map((card, i) => (
                  <button 
                    key={i} 
                    onClick={() => onEnact(i)} 
                    className="relative group hover:scale-110 hover:-translate-y-4 transition-all duration-300 group-hover/cards:opacity-50 hover:!opacity-100"
                  >
                    <img 
                      src={card === 'FASCIST' ? "/assets/policy-fascist.png" : "/assets/policy-liberal.png"} 
                      className={`w-[75px] sm:w-[95px] drop-shadow-[0_0_15px_${card === 'FASCIST' ? 'rgba(255,0,60,0.5)' : 'rgba(0,240,255,0.5)'}]`} 
                      alt={card} 
                    />
                    <div className="absolute inset-x-0 -bottom-8 opacity-0 group-hover:opacity-100 transition-all text-[8px] sm:text-[10px] font-black text-white uppercase tracking-widest pt-2">
                      ENACT
                    </div>
                  </button>
                ))}
              </div>
            );
          }
        } else {
          title = 'WAITING FOR CHANCELLOR';
          subtext = `${currentChancellor?.name?.toUpperCase() || 'CHANCELLOR'} IS ENACTING A POLICY`;
          isActive = true;
        }
        break;

      case PHASES.EXECUTIVE_ACTION:
        if (isPresident) {
          title = 'EXECUTIVE ACTION';
          subtext = 'Select target for termination';
          isActive = true;
        } else {
          title = 'WAITING FOR PRESIDENT';
          subtext = `${currentPresident?.name?.toUpperCase() || 'PRESIDENT'} IS EXECUTING A DIRECTIVE`;
          isActive = true;
        }
        break;

      default:
        isActive = false;
    }
  }

  if (!isActive) return null;

  const isCritical = title.includes('VOTE') || title.includes('SELECT') || title.includes('CONFIRM') || title.includes('LEGISLATIVE') || title.includes('EXECUTIVE');

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[100] flex flex-col items-center justify-center pointer-events-none"
      >
        {/* Background Dim & Blur */}
        <motion.div 
          className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />

        {/* Overlay Content */}
        <motion.div
          key={title + subtext + displayPhase}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ 
            type: "spring", 
            stiffness: 300, 
            damping: 25,
            duration: 0.2 
          }}
          className="relative z-10 flex flex-col items-center text-center px-6 py-8 pointer-events-auto"
        >
          <motion.h2 
            animate={{ 
              textShadow: isCritical ? [
                "0 0 10px rgba(0,240,255,0.4)",
                "0 0 20px rgba(0,240,255,0.8)",
                "0 0 10px rgba(0,240,255,0.4)"
              ] : "none"
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className={`text-2xl sm:text-4xl font-black tracking-[0.25em] uppercase mb-2 
              ${isCritical ? 'text-cyan-400' : 'text-white/80'}`}
          >
            {title}
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`text-[12px] sm:text-lg font-mono font-black uppercase tracking-[0.4em] mb-4
              ${pendingSelection ? 'text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]' : 'text-cyan-500/60'}`}
          >
            {subtext}
          </motion.p>

          {/* Action Interactive Content */}
          {actionContent}

          {pendingSelection && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-6 mt-8"
            >
              <button 
                onClick={onConfirm}
                className="px-6 py-2 bg-cyan-500 text-black font-black text-xs uppercase tracking-widest hover:bg-white transition-all shadow-[0_0_15px_rgba(0,240,255,0.6)] active:scale-95"
              >
                Confirm
              </button>
              <button 
                onClick={onCancel}
                className="px-6 py-2 border border-white/20 text-white/60 font-black text-xs uppercase tracking-widest hover:border-white hover:text-white transition-all active:scale-95"
              >
                Cancel
              </button>
            </motion.div>
          )}

          {/* Subtle Pulse Glow */}
          <motion.div 
            animate={{ 
              scale: [1, 1.05, 1],
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -inset-10 bg-cyan-500/5 blur-3xl rounded-full -z-10 pointer-events-none"
          />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
