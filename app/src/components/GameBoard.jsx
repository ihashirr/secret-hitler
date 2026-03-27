import React from 'react';
import { motion } from 'framer-motion';
import { PHASES, FASCIST_TO_WIN, LIBERAL_TO_WIN, MAX_ELECTION_TRACKER } from '../lib/constants';
import { Shield, Skull, Check } from 'lucide-react';
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

const getVoteStampRotation = (playerId, vote) => getStableNumber(`${playerId}-${vote}`, -10, 10);

const getTrackSlotMeta = (type, index) => {
  if (type === 'LIBERAL') {
    return index === LIBERAL_TO_WIN - 1 ? 'SECURE' : `0${index + 1}`;
  }

  if (index >= 2 && index <= 4) return 'ORDER';
  if (index === FASCIST_TO_WIN - 1) return 'WIN';
  return `0${index + 1}`;
};

const getPlayerGridCols = (count) => {
  if (count <= 4) return 'grid-cols-2 sm:grid-cols-4';
  if (count === 5) return 'grid-cols-3 sm:grid-cols-5';
  if (count === 6) return 'grid-cols-3 sm:grid-cols-6';
  if (count <= 8) return 'grid-cols-4 sm:grid-cols-4';
  return 'grid-cols-5 sm:grid-cols-5';
};

const getPlayerCardSize = (count) => {
  if (count >= 9) return 'h-[min(12.5vh,100px)] max-w-[82px] sm:h-[min(13.5vh,112px)] sm:max-w-[96px]';
  if (count >= 7) return 'h-[min(13.5vh,108px)] max-w-[88px] sm:h-[min(14.5vh,118px)] sm:max-w-[104px]';
  return 'h-[min(15vh,122px)] max-w-[100px] sm:h-[min(16vh,132px)] sm:max-w-[116px]';
};

export default function GameBoard({ gameState, playerId, onNominate, onVote, onDiscard, onEnact, onKill }) {
  const myActualId = gameState?.myPlayerId || playerId;
  const isPresident = gameState.amIPresident || myActualId === gameState.currentPresident;

  const canNominate = gameState.phase === PHASES.NOMINATION && isPresident;
  const canKill = gameState.phase === PHASES.EXECUTIVE_ACTION && isPresident;

  const [revealState, setRevealState] = React.useState(null);
  const [revealStage, setRevealStage] = React.useState(0);
  const [pendingSelection, setPendingSelection] = React.useState(null);
  const prevPhaseRef = React.useRef(gameState.phase);

  React.useEffect(() => {
    setPendingSelection(null);
  }, [gameState.phase]);

  React.useEffect(() => {
    let revealTimer;
    let cleanupTimer;

    if (prevPhaseRef.current === PHASES.VOTING && gameState.phase !== PHASES.VOTING && gameState.lastVotes) {
      let ya = 0;
      let nein = 0;

      Object.values(gameState.lastVotes).forEach((vote) => {
        if (vote === 'YA') ya += 1;
        else nein += 1;
      });

      setRevealState({
        result: ya > nein ? 'APPROVED' : 'REJECTED',
        votes: gameState.lastVotes,
        ya,
        nein,
      });

      setRevealStage(0);
      revealTimer = setTimeout(() => setRevealStage(1), 150);
      cleanupTimer = setTimeout(() => {
        setRevealState(null);
        setRevealStage(0);
      }, 4000);
    }

    prevPhaseRef.current = gameState.phase;

    return () => {
      clearTimeout(revealTimer);
      clearTimeout(cleanupTimer);
    };
  }, [gameState.phase, gameState.lastVotes]);

  const displayPhase = revealState ? PHASES.VOTING : gameState.phase;
  const playerCount = gameState.players.length;
  const aliveCount = gameState.players.filter((player) => player.isAlive).length;

  const handleNominate = (id) => {
    const player = gameState.players.find((candidate) => candidate.id === id);
    setPendingSelection({ id, name: player?.name, type: 'NOMINATE' });
  };

  const handleKill = (id) => {
    const player = gameState.players.find((candidate) => candidate.id === id);
    setPendingSelection({ id, name: player?.name, type: 'KILL' });
  };

  const confirmSelection = () => {
    if (!pendingSelection) return;
    if (pendingSelection.type === 'NOMINATE') onNominate(pendingSelection.id);
    if (pendingSelection.type === 'KILL') onKill(pendingSelection.id);
    setPendingSelection(null);
  };

  const cancelSelection = () => setPendingSelection(null);

  const renderTrack = (current, max, type) => {
    const isFascist = type === 'FASCIST';
    const accentClass = isFascist
      ? 'border-[#7c1221] bg-[linear-gradient(180deg,#2a090d_0%,#1a0608_100%)] text-[#ff7b7b]'
      : 'border-[#8eb9e0] bg-[linear-gradient(180deg,#eef5fb_0%,#ddeaf7_100%)] text-[#2b5c8f]';
    const inactiveClass = isFascist
      ? 'border-[#5a1216]/70 bg-[#22090b] text-[#8c5053]'
      : 'border-[#9ec0dd]/50 bg-[#f9fbfe] text-[#7c9cb8]';
    const fillClass = isFascist
      ? 'border-[#ff6b73] bg-[linear-gradient(180deg,#c1272d_0%,#82131a_100%)] text-white'
      : 'border-[#87bfff] bg-[linear-gradient(180deg,#4b88c4_0%,#2b5c8f_100%)] text-white';
    const summary = isFascist ? 'Orders at 3, 4, 5' : '5 to secure';
    const Icon = isFascist ? Skull : Shield;

    return (
      <div className={`relative overflow-hidden rounded-[22px] border p-3 shadow-[0_14px_32px_rgba(0,0,0,0.24)] sm:p-3.5 ${accentClass}`}>
        <div className="absolute inset-0 paper-grain opacity-10 pointer-events-none" />

        <div className="relative z-10 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[8px] font-mono font-black uppercase tracking-[0.32em] opacity-80">
              {type === 'LIBERAL' ? 'Liberal Track' : 'Fascist Track'}
            </p>
            <p className={`mt-1 text-[9px] font-mono uppercase tracking-[0.16em] ${isFascist ? 'text-red-100/70' : 'text-[#4c7093]'}`}>
              {summary}
            </p>
          </div>

          <div className={`shrink-0 rounded-full border px-2.5 py-1 text-[9px] font-mono font-black uppercase tracking-[0.2em] ${isFascist ? 'border-red-400/35 bg-red-950/35 text-red-200' : 'border-[#2b5c8f]/20 bg-white/65 text-[#2b5c8f]'}`}>
            {current}/{max}
          </div>
        </div>

        <div className="relative z-10 mt-2 grid gap-1.5 sm:gap-2" style={{ gridTemplateColumns: `repeat(${max}, minmax(0, 1fr))` }}>
          {Array.from({ length: max }).map((_, index) => {
            const isActive = index < current;
            const slotMeta = getTrackSlotMeta(type, index);

            return (
              <div
                key={index}
                className={`relative min-h-[34px] rounded-xl border px-1 py-1 transition-all duration-500 sm:min-h-[40px] ${isActive ? `${fillClass} shadow-sm` : inactiveClass}`}
              >
                <div className="absolute inset-0 rounded-xl paper-grain opacity-10 pointer-events-none" />

                <div className="relative z-10 flex h-full flex-col items-center justify-between text-center">
                  <span className="text-[6px] font-mono font-black uppercase tracking-[0.22em] opacity-80 sm:text-[7px]">
                    {slotMeta}
                  </span>

                  {isActive ? (
                    <Icon size={10} className="sm:h-[12px] sm:w-[12px]" />
                  ) : (
                    <span className="text-[9px] font-mono font-black opacity-50 sm:text-[10px]">
                      {index + 1}
                    </span>
                  )}
                </div>

                {index === current - 1 && (
                  <motion.div
                    initial={{ scale: 1.15, opacity: 0.55 }}
                    animate={{ scale: 1, opacity: 0 }}
                    transition={{ duration: 0.75, ease: 'easeOut' }}
                    className={`absolute inset-0 rounded-xl pointer-events-none ${isFascist ? 'bg-red-400/50' : 'bg-cyan-300/50'}`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderBoardStage = () => {
    const isDimmed = displayPhase === PHASES.VOTING;

    return (
      <div className={`mx-auto w-full max-w-[1120px] px-4 transition-all duration-700 ${isDimmed ? 'scale-[0.99] opacity-45' : 'opacity-100'}`}>
        <div className="grid gap-2 md:grid-cols-2">
          {renderTrack(gameState.liberalPolicies, LIBERAL_TO_WIN, 'LIBERAL')}
          {renderTrack(gameState.fascistPolicies, FASCIST_TO_WIN, 'FASCIST')}
        </div>

        <div className="mt-2 grid grid-cols-3 gap-2">
          <div className="rounded-2xl border border-[#2b5c8f]/18 bg-[#162231]/80 px-2 py-2.5 text-center shadow-[0_10px_20px_rgba(0,0,0,0.18)]">
            <p className="text-[7px] font-mono font-black uppercase tracking-[0.25em] text-cyan-200/70">Deck</p>
            <p className="mt-1 text-lg font-serif font-black text-white sm:text-xl">{gameState.drawPileCount}</p>
          </div>

          <div className="rounded-2xl border border-[#c1272d]/18 bg-[#2a1718]/80 px-2 py-2.5 text-center shadow-[0_10px_20px_rgba(0,0,0,0.18)]">
            <p className="text-[7px] font-mono font-black uppercase tracking-[0.25em] text-red-200/70">Discard</p>
            <p className="mt-1 text-lg font-serif font-black text-white sm:text-xl">{gameState.discardPileCount}</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 px-2 py-2.5 text-center shadow-[0_10px_20px_rgba(0,0,0,0.18)]">
            <p className="text-[7px] font-mono font-black uppercase tracking-[0.25em] text-[#d4c098]/75">Chaos</p>
            <div className="mt-2 flex justify-center gap-1">
              {Array.from({ length: MAX_ELECTION_TRACKER }).map((_, index) => (
                <div
                  key={index}
                  className={`h-2.5 w-2.5 rounded-full border transition-all duration-500 sm:h-3 sm:w-3 ${
                    index < gameState.electionTracker
                      ? 'border-[#8a001d] bg-[#c1272d] shadow-[0_0_10px_rgba(193,39,45,0.35)]'
                      : 'border-[#d4c098]/30 bg-[#f4eee0]/8'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderPlayerDock = () => {
    const isVotingPhase = displayPhase === PHASES.VOTING;
    const isLegislativePhase = displayPhase === PHASES.LEGISLATIVE_PRESIDENT || displayPhase === PHASES.LEGISLATIVE_CHANCELLOR;
    const gridColsClass = getPlayerGridCols(playerCount);
    const playerCardSizeClass = getPlayerCardSize(playerCount);
    const dockHint = canNominate
      ? 'Nominate from the dock below'
      : canKill
        ? 'Choose one target from the dock'
        : isVotingPhase
          ? 'Read the table here. Vote on your own phone.'
          : isLegislativePhase
            ? 'Policy handoff in progress'
            : 'Private phone table';

    return (
      <div className="mx-auto flex min-h-0 w-full max-w-[1120px] flex-1 px-4">
        <div className="relative h-full min-h-0 w-full overflow-hidden rounded-[28px] border border-white/8 bg-black/28 p-3 shadow-[0_18px_40px_rgba(0,0,0,0.24)] sm:p-4">
          <div className="absolute inset-0 paper-grain opacity-[0.06] pointer-events-none" />

          <div className="relative z-10 grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)]">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[8px] font-mono font-black uppercase tracking-[0.32em] text-cyan-300/75">
                  Operative Dock
                </p>
                <p className="mt-1 text-[9px] leading-relaxed text-white/55 sm:text-[10px]">
                  {dockHint}
                </p>
              </div>

              <div className="shrink-0 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[8px] font-mono font-black uppercase tracking-[0.22em] text-white/70">
                {aliveCount}/{playerCount} Live
              </div>
            </div>

            <div className="relative z-10 flex min-h-0 items-center justify-center pt-3">
              <div className={`grid w-full justify-items-center gap-2 sm:gap-3 ${gridColsClass}`}>
                {gameState.players.map((player) => {
                  const isSelf = player.id === myActualId;
                  const isSelectable =
                    (displayPhase === PHASES.NOMINATION && canNominate && player.isAlive && !isSelf) ||
                    (displayPhase === PHASES.EXECUTIVE_ACTION && canKill && player.isAlive && !isSelf);
                  const isPending = pendingSelection?.id === player.id;
                  const playerIsPresident = player.id === gameState.currentPresident;
                  const playerIsChancellor = player.id === gameState.currentChancellor || player.id === gameState.nominatedChancellor;
                  const isInactiveLegislator = isLegislativePhase && !playerIsPresident && !playerIsChancellor;
                  const showVoteState = isVotingPhase && player.isAlive;
                  const isRevealed = Boolean(revealState);
                  const finalVote = isRevealed ? revealState.votes[player.id] : null;

                  return (
                    <div key={player.id} className="relative flex w-full justify-center">
                      <motion.button
                        whileHover={isSelectable ? { y: -3 } : {}}
                        whileTap={isSelectable ? { scale: 0.97 } : {}}
                        onClick={() => {
                          if (!isSelectable) return;
                          if (displayPhase === PHASES.NOMINATION) handleNominate(player.id);
                          if (displayPhase === PHASES.EXECUTIVE_ACTION) handleKill(player.id);
                        }}
                        className={`group relative flex w-full flex-col overflow-hidden rounded-[20px] border border-[#d4c098] bg-[var(--color-paper-light)] p-1.5 text-center shadow-md outline-none transition-all duration-300 sm:p-2 ${playerCardSizeClass}
                          ${isInactiveLegislator ? 'opacity-35 grayscale-[0.45]' : ''}
                          ${isSelectable ? 'cursor-pointer ring-1 ring-transparent hover:border-[#b09868] hover:bg-[#fff9ed] hover:shadow-xl hover:ring-[var(--color-stamp-blue)]' : 'cursor-default'}
                          ${!player.isAlive ? 'bg-[#d8d0c0] opacity-45 brightness-75' : ''}
                          ${isPending ? 'z-20 scale-[1.03] !opacity-100 ring-4 ring-[var(--color-stamp-red)] shadow-2xl' : ''}
                          ${isRevealed && finalVote === 'YA' ? 'ring-4 ring-[#2b5c8f] shadow-xl' : ''}
                          ${isRevealed && finalVote === 'NEIN' ? 'ring-4 ring-[var(--color-stamp-red)] shadow-xl' : ''}
                        `}
                      >
                        {(playerIsPresident || playerIsChancellor) && (
                          <span className={`absolute left-1.5 top-1.5 z-10 rounded-full px-1.5 py-0.5 text-[6px] font-mono font-black uppercase tracking-[0.2em] ${
                            playerIsPresident ? 'bg-[#d4af37] text-white' : 'bg-[#d9d9d9] text-[#2c2c2c]'
                          }`}>
                            {playerIsPresident ? 'PRES' : 'CHAN'}
                          </span>
                        )}

                        <div className={`relative flex h-[58%] w-full items-end justify-center overflow-hidden rounded-[10px] border border-[#d4c098] shadow-inner ${
                          !player.isAlive ? 'bg-[#b8b0a0]' : 'bg-[#e8dcc4]'
                        }`}>
                          {player.isAlive ? (
                            <>
                              <img
                                src={`/assets/avatars/avatar_${getAvatarId(player)}.png`}
                                alt="Operative Profile"
                                className="absolute inset-0 h-full w-full object-cover pointer-events-none opacity-80 mix-blend-multiply filter sepia-[0.2] contrast-125 brightness-90"
                              />
                              <div className="absolute inset-0 paper-grain pointer-events-none opacity-30 mix-blend-overlay" />
                            </>
                          ) : (
                            <Skull size={18} className="relative z-10 mb-2 text-[#2c2c2c] opacity-50 pointer-events-none" />
                          )}
                        </div>

                        <span className={`mt-1 w-full truncate font-serif text-[9px] font-black tracking-tight sm:text-[10px] ${
                          !player.isAlive ? 'text-[#6a6a6a] line-through' : 'text-[#2c2c2c]'
                        }`}>
                          {player.name}
                        </span>

                        {showVoteState && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            {isRevealed && finalVote === 'YA' && (
                              <motion.div
                                initial={{ scale: 2.5, opacity: 0, rotate: -20 }}
                                animate={{ scale: 1, opacity: 1, rotate: getVoteStampRotation(player.id, 'YA') }}
                                transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                                className="rounded-sm border-2 border-[#2b5c8f] px-1 text-xs font-black uppercase tracking-[0.2em] text-[#2b5c8f] opacity-90 mix-blend-multiply sm:text-sm"
                              >
                                JA
                              </motion.div>
                            )}

                            {isRevealed && finalVote === 'NEIN' && (
                              <motion.div
                                initial={{ scale: 2.5, opacity: 0, rotate: 20 }}
                                animate={{ scale: 1, opacity: 1, rotate: getVoteStampRotation(player.id, 'NEIN') }}
                                transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                                className="rounded-sm border-2 border-[var(--color-stamp-red)] px-1 text-xs font-black uppercase tracking-[0.2em] text-[var(--color-stamp-red)] opacity-90 mix-blend-multiply sm:text-sm"
                              >
                                NEIN
                              </motion.div>
                            )}

                            {!isRevealed && player.hasVoted && (
                              <div className="absolute right-1 bottom-1 flex items-center gap-0.5 rounded-sm border border-[#b8b0a0] bg-[#d4c8b0] px-1 text-[7px] font-bold text-[#2c2c2c] shadow-sm">
                                <Check size={7} />
                                OK
                              </div>
                            )}

                            {!isRevealed && !player.hasVoted && (
                              <div className="absolute right-1 bottom-1 flex items-center gap-0.5 text-[6px] text-[#8a8a8a] animate-pulse">
                                <div className="h-1.5 w-1.5 rounded-full border border-[#8a8a8a] border-t-transparent animate-spin" />
                                WAIT
                              </div>
                            )}
                          </div>
                        )}

                        {isSelectable && displayPhase === PHASES.EXECUTIVE_ACTION && !isPending && (
                          <span className="absolute inset-x-0 bottom-1 mx-auto w-fit rounded-full border border-[var(--color-stamp-red)] px-1.5 py-0.5 text-[6px] font-black uppercase tracking-[0.18em] text-[var(--color-stamp-red)] opacity-0 transition-all mix-blend-multiply group-hover:opacity-100">
                            Eliminate
                          </span>
                        )}

                        {isSelectable && displayPhase === PHASES.NOMINATION && !isPending && (
                          <span className="absolute inset-x-0 bottom-1 mx-auto w-fit rounded-full border border-[#2b5c8f] px-1.5 py-0.5 text-[6px] font-black uppercase tracking-[0.18em] text-[#2b5c8f] opacity-0 transition-all mix-blend-multiply group-hover:opacity-100">
                            Nominate
                          </span>
                        )}
                      </motion.button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const boardDimmed = Boolean(revealState || pendingSelection);

  return (
    <motion.div
      key={`viewport-${displayPhase}`}
      initial={{ opacity: 0, scale: 0.98, filter: 'brightness(1.3)' }}
      animate={{
        opacity: 1,
        scale: 1,
        filter: 'brightness(1)',
        x: revealStage === 1 ? [-8, 8, -4, 4, 0] : 0,
        y: revealStage === 1 ? [-4, 4, -2, 2, 0] : 0,
      }}
      transition={{
        duration: revealStage === 1 ? 0.4 : 0.55,
        ease: 'easeOut',
      }}
      className="relative h-[100dvh] w-full overflow-hidden bg-obsidian-950 pt-[44px] sm:pt-[48px]"
    >
      <div className={`absolute inset-0 z-50 pointer-events-none transition-all duration-300 ${revealStage === 0 && revealState ? 'bg-black/80' : 'bg-transparent'}`} />

      {revealStage === 1 && revealState && (
        <motion.div
          initial={{ opacity: 0.8 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={`absolute inset-0 z-50 pointer-events-none ${revealState.result === 'APPROVED' ? 'bg-cyan-400' : 'bg-red-500'}`}
        />
      )}

      <div className={`fixed inset-0 z-0 board-grid pointer-events-none transition-all duration-1000 ${displayPhase === PHASES.LEGISLATIVE_PRESIDENT || displayPhase === PHASES.LEGISLATIVE_CHANCELLOR ? 'opacity-[0.03]' : 'opacity-[0.05]'}`} />
      <div className={`absolute inset-0 z-0 pointer-events-none opacity-20 transition-all duration-1000 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] ${displayPhase === PHASES.VOTING ? 'from-cyan-900/40 via-transparent to-transparent' : displayPhase === PHASES.EXECUTIVE_ACTION ? 'from-red-900/40 via-transparent to-transparent' : 'from-transparent to-transparent'}`} />

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

      <div className={`relative z-10 grid h-full grid-rows-[auto_minmax(0,1fr)] gap-2 pb-3 pt-14 transition-all duration-700 sm:gap-3 sm:pb-4 sm:pt-16 ${boardDimmed ? 'opacity-45' : 'opacity-100'}`}>
        {renderBoardStage()}
        {renderPlayerDock()}
      </div>
    </motion.div>
  );
}
