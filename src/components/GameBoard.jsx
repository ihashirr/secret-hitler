import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  EXECUTIVE_POWERS,
  FASCIST_TO_WIN,
  LIBERAL_TO_WIN,
  MAX_ELECTION_TRACKER,
  PHASES,
} from '../lib/constants';
import { Bot, Shield, Skull } from 'lucide-react';
import GameOverlay from './GameOverlay';
import { triggerHaptic } from '../lib/haptics';

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
  return 'grid-cols-4 sm:grid-cols-5';
};

const getPlayerCardSize = (count) => {
  if (count >= 9) return 'aspect-[0.85] max-w-[78px] sm:max-w-[92px]';
  if (count >= 7) return 'aspect-[0.85] max-w-[84px] sm:max-w-[100px]';
  return 'aspect-[0.85] max-w-[96px] sm:max-w-[112px]';
};

const getVotingPlayerCardSize = (count) => {
  if (count >= 9) return 'min-h-[104px] max-w-[72px] sm:min-h-[112px] sm:max-w-[78px]';
  if (count >= 7) return 'min-h-[110px] max-w-[78px] sm:min-h-[118px] sm:max-w-[86px]';
  return 'min-h-[116px] max-w-[84px] sm:min-h-[126px] sm:max-w-[92px]';
};

const getVotingStatusMeta = (player, isRevealed, finalVote) => {
  if (!player.isAlive) {
    return {
      label: 'Observer',
      className: 'text-white/40',
      dotClassName: 'bg-white/20',
    };
  }

  if (isRevealed) {
    if (finalVote === 'YA') {
      return {
        label: 'Ja',
        className: 'text-cyan-100',
        dotClassName: 'bg-cyan-300 shadow-[0_0_10px_rgba(103,232,249,0.45)]',
      };
    }

    if (finalVote === 'NEIN') {
      return {
        label: 'Nein',
        className: 'text-red-100',
        dotClassName: 'bg-red-400 shadow-[0_0_10px_rgba(248,113,113,0.45)]',
      };
    }
  }

  if (player.hasVoted) {
    return {
      label: 'Voted',
      className: 'text-cyan-100',
      dotClassName: 'bg-cyan-300 shadow-[0_0_10px_rgba(103,232,249,0.35)]',
    };
  }

  return {
    label: 'Waiting',
    className: 'text-white/55',
    dotClassName: 'bg-white/25',
  };
};

const getVotingGroups = (players) => {
  const voted = players.filter((player) => player.isAlive && player.hasVoted);
  const waiting = players.filter((player) => player.isAlive && !player.hasVoted);
  const observers = players.filter((player) => !player.isAlive);

  return [
    { key: 'voted', label: 'Voted', players: voted },
    { key: 'waiting', label: 'Waiting', players: waiting },
    { key: 'observers', label: 'Observers', players: observers },
  ].filter((group) => group.players.length);
};

const getVoteRevealGroups = (players, votes = {}) => {
  const jaPlayers = players.filter((player) => player.isAlive && votes[player.id] === 'YA');
  const neinPlayers = players.filter((player) => player.isAlive && votes[player.id] === 'NEIN');
  const observers = players.filter((player) => !player.isAlive);

  return [
    { key: 'YA', label: 'Ja', players: jaPlayers, tone: 'ja' },
    { key: 'NEIN', label: 'Nein', players: neinPlayers, tone: 'nein' },
    { key: 'OBSERVERS', label: 'Observers', players: observers, tone: 'observer' },
  ].filter((group) => group.players.length);
};

const VOTE_REVEAL_STAGE_DELAY_MS = 180;
const VOTE_REVEAL_DURATION_MS = 3000;

export default function GameBoard({
  gameState,
  playerId,
  directorState,
  onNominate,
  onVote,
  onDiscard,
  onRequestVeto,
  onRespondVeto,
  onEnact,
  onInvestigate,
  onSpecialElection,
  onAcknowledgePeek,
  onKill,
}) {
  const myActualId = gameState?.myPlayerId || playerId;
  const me = gameState.players.find((player) => player.id === myActualId);
  const isPresident = gameState.amIPresident || myActualId === gameState.currentPresident;
  const isChancellor = gameState.amIChancellor || myActualId === gameState.currentChancellor;
  const executivePower = gameState.executivePower;

  const canNominate = gameState.phase === PHASES.NOMINATION && isPresident;
  const canExecutiveTarget =
    gameState.phase === PHASES.EXECUTIVE_ACTION &&
    isPresident &&
    [
      EXECUTIVE_POWERS.INVESTIGATE,
      EXECUTIVE_POWERS.SPECIAL_ELECTION,
      EXECUTIVE_POWERS.EXECUTION,
    ].includes(executivePower);

  const [revealState, setRevealState] = React.useState(null);
  const [revealStage, setRevealStage] = React.useState(0);
  const [pendingSelection, setPendingSelection] = React.useState(null);
  const [recentVoteIds, setRecentVoteIds] = React.useState([]);
  const [revealedVoteIds, setRevealedVoteIds] = React.useState([]);
  const [revealedVoteTotals, setRevealedVoteTotals] = React.useState({ YA: 0, NEIN: 0 });
  const [deckAnimation, setDeckAnimation] = React.useState(null);
  const prevPhaseRef = React.useRef(gameState.phase);
  const prevVoteStateRef = React.useRef({});
  const previousDeckCountRef = React.useRef(gameState.drawPileCount);
  const voteStateReadyRef = React.useRef(false);

  React.useEffect(() => {
    setPendingSelection(null);
  }, [gameState.phase]);

  React.useEffect(() => {
    const nextVoteState = gameState.players.reduce((accumulator, player) => {
      accumulator[player.id] = Boolean(player.hasVoted);
      return accumulator;
    }, {});

    if (!voteStateReadyRef.current) {
      voteStateReadyRef.current = true;
      prevVoteStateRef.current = nextVoteState;
      return undefined;
    }

    if (gameState.phase !== PHASES.VOTING) {
      prevVoteStateRef.current = nextVoteState;
      return undefined;
    }

    const justVotedIds = gameState.players
      .filter((player) => player.isAlive && player.hasVoted && !prevVoteStateRef.current[player.id])
      .map((player) => player.id);

    prevVoteStateRef.current = nextVoteState;

    if (!justVotedIds.length) return undefined;

    setRecentVoteIds((current) => Array.from(new Set([...current, ...justVotedIds])));

    const timer = window.setTimeout(() => {
      setRecentVoteIds((current) => current.filter((id) => !justVotedIds.includes(id)));
    }, 650);

    return () => window.clearTimeout(timer);
  }, [gameState.phase, gameState.players]);

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
      revealTimer = setTimeout(() => setRevealStage(1), VOTE_REVEAL_STAGE_DELAY_MS);
      cleanupTimer = setTimeout(() => {
        setRevealState(null);
        setRevealStage(0);
      }, VOTE_REVEAL_DURATION_MS);
    }

    prevPhaseRef.current = gameState.phase;

    return () => {
      clearTimeout(revealTimer);
      clearTimeout(cleanupTimer);
    };
  }, [gameState.phase, gameState.lastVotes]);

  React.useEffect(() => {
    if (gameState.phase === PHASES.VOTING || !revealState?.votes) {
      setRevealedVoteIds([]);
      setRevealedVoteTotals({ YA: 0, NEIN: 0 });
      return undefined;
    }

    const orderedPlayers = [...gameState.players]
      .filter((player) => player.isAlive && revealState.votes[player.id])
      .sort((left, right) => (left.position || 0) - (right.position || 0));

    setRevealedVoteIds([]);
    setRevealedVoteTotals({ YA: 0, NEIN: 0 });

    const timers = orderedPlayers.map((player, index) =>
      window.setTimeout(() => {
        const vote = revealState.votes[player.id];
        setRevealedVoteIds((current) => (current.includes(player.id) ? current : [...current, player.id]));
        setRevealedVoteTotals((current) => ({
          ...current,
          [vote]: (current[vote] || 0) + 1,
        }));
      }, 220 + index * 120),
    );

    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [gameState.phase, gameState.players, revealState]);

  React.useEffect(() => {
    const previousDeckCount = previousDeckCountRef.current;
    const currentDeckCount = gameState.drawPileCount;
    const visibleCardCount = Math.max(gameState.drawnCards?.length || 0, gameState.peekedPolicies?.length || 0);

    if (typeof previousDeckCount === 'number' && currentDeckCount < previousDeckCount && visibleCardCount > 0) {
      const nextAnimation = {
        id: Date.now(),
        count: Math.min(3, Math.max(1, previousDeckCount - currentDeckCount, visibleCardCount)),
      };
      setDeckAnimation(nextAnimation);

      const timer = window.setTimeout(() => {
        setDeckAnimation((active) => (active?.id === nextAnimation.id ? null : active));
      }, 900);

      previousDeckCountRef.current = currentDeckCount;
      return () => window.clearTimeout(timer);
    }

    previousDeckCountRef.current = currentDeckCount;
    return undefined;
  }, [gameState.drawPileCount, gameState.drawnCards?.length, gameState.peekedPolicies?.length]);

  const showVoteReveal = Boolean(revealState) && gameState.phase !== PHASES.VOTING;
  const isVoteRevealPhase = showVoteReveal;
  const displayPhase = showVoteReveal ? PHASES.VOTING : gameState.phase;
  const playerCount = gameState.players.length;
  const aliveCount = gameState.players.filter((player) => player.isAlive).length;
  const votedCount = gameState.players.filter((player) => player.isAlive && player.hasVoted).length;
  const voteResponsesRemaining = Math.max(0, aliveCount - votedCount);
  const voteMajority = Math.floor(aliveCount / 2) + 1;
  const voteProgressPercent = aliveCount ? (votedCount / aliveCount) * 100 : 0;
  const waitingPlayersLabel =
    voteResponsesRemaining === 0
      ? 'All responses received'
      : `${voteResponsesRemaining} player${voteResponsesRemaining === 1 ? '' : 's'} remaining`;
  const revealIsApproved = revealState?.result === 'APPROVED';
  const revealProgressTotal = revealedVoteTotals.YA + revealedVoteTotals.NEIN;
  const revealJaPercent = revealProgressTotal ? (revealedVoteTotals.YA / revealProgressTotal) * 100 : 0;
  const revealNeinPercent = revealProgressTotal ? (revealedVoteTotals.NEIN / revealProgressTotal) * 100 : 0;
  const revealOutcomeTitle = revealIsApproved ? 'Government Elected' : 'Vote Failed';
  const revealNextStep =
    revealIsApproved
      ? gameState.phase === PHASES.GAME_OVER
        ? 'Hitler took office. The match ends here.'
        : gameState.phase === PHASES.LEGISLATIVE_PRESIDENT
          ? 'President is selecting which policies move forward.'
          : gameState.phase === PHASES.LEGISLATIVE_CHANCELLOR
            ? 'Chancellor is deciding the final policy.'
            : 'The government moves into the legislative session.'
      : gameState.chaosTriggered && gameState.chaosPolicy
        ? `Chaos auto-enacted a ${gameState.chaosPolicy.toLowerCase()} policy.`
        : `Election tracker advances to ${gameState.electionTracker}/${MAX_ELECTION_TRACKER}.`;
  const voteStatusTitle = showVoteReveal
    ? 'Vote Result'
    : directorState?.primaryInstruction?.title ||
      (me?.isAlive === false ? 'Observer Only' : me?.hasVoted ? 'Vote Locked' : 'Vote In Private');
  const voteStatusCopy = showVoteReveal
    ? `${revealState?.ya || 0} Ja • ${revealState?.nein || 0} Nein`
    : directorState?.primaryInstruction?.description ||
      (me?.isAlive === false
        ? 'You have been eliminated. Watch the table, but you do not vote anymore.'
        : me?.hasVoted
          ? 'Your vote is in. Waiting for the rest of the table.'
          : 'Cast your vote on this device now.');

  const handleNominate = (id) => {
    triggerHaptic('selection');
    const player = gameState.players.find((candidate) => candidate.id === id);
    setPendingSelection({ id, name: player?.name, type: 'NOMINATE' });
  };

  const handleKill = (id) => {
    triggerHaptic('warning');
    const player = gameState.players.find((candidate) => candidate.id === id);
    setPendingSelection({ id, name: player?.name, type: 'KILL' });
  };

  const handleInvestigate = (id) => {
    triggerHaptic('selection');
    const player = gameState.players.find((candidate) => candidate.id === id);
    setPendingSelection({ id, name: player?.name, type: 'INVESTIGATE' });
  };

  const handleSpecialElection = (id) => {
    triggerHaptic('selection');
    const player = gameState.players.find((candidate) => candidate.id === id);
    setPendingSelection({ id, name: player?.name, type: 'SPECIAL_ELECTION' });
  };

  const confirmSelection = () => {
    if (!pendingSelection) return;
    triggerHaptic('confirm');
    if (pendingSelection.type === 'NOMINATE') onNominate(pendingSelection.id);
    if (pendingSelection.type === 'KILL') onKill(pendingSelection.id);
    if (pendingSelection.type === 'INVESTIGATE') onInvestigate(pendingSelection.id);
    if (pendingSelection.type === 'SPECIAL_ELECTION') onSpecialElection(pendingSelection.id);
    setPendingSelection(null);
  };

  const cancelSelection = () => {
    triggerHaptic('soft');
    setPendingSelection(null);
  };

  const renderDeckMetric = (className = 'text-white/72') => (
    <span className={`relative inline-flex items-center ${className}`}>
      <AnimatePresence>
        {deckAnimation && (
          <span className="pointer-events-none absolute left-1/2 top-1/2">
            {Array.from({ length: deckAnimation.count }).map((_, index) => (
              <motion.span
                key={`${deckAnimation.id}-${index}`}
                initial={{ opacity: 0, x: -8, y: 6, scale: 0.72, rotate: -14 + index * 7 }}
                animate={{ opacity: [0, 0.95, 0], x: 12 + index * 10, y: -18 - index * 5, scale: 1, rotate: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.72, delay: index * 0.05, ease: 'easeOut' }}
                className="absolute h-9 w-7 rounded-[8px] border border-[#d4c098]/18 bg-[linear-gradient(180deg,rgba(239,229,211,0.92)_0%,rgba(207,189,155,0.84)_100%)] shadow-[0_10px_24px_rgba(0,0,0,0.28)] paper-grain"
              />
            ))}
          </span>
        )}
      </AnimatePresence>

      <motion.span
        animate={
          deckAnimation
            ? {
                color: ['rgba(255,255,255,0.72)', 'rgba(244,238,224,1)', 'rgba(255,255,255,0.72)'],
                textShadow: ['0 0 0 rgba(0,0,0,0)', '0 0 18px rgba(212,192,152,0.18)', '0 0 0 rgba(0,0,0,0)'],
              }
            : undefined
        }
        transition={{ duration: 0.7, ease: 'easeOut' }}
      >
        DECK {gameState.drawPileCount}
      </motion.span>
    </span>
  );

  const renderTrack = (current, max, type) => {
    const isFascist = type === 'FASCIST';
    const fillClass = isFascist
      ? 'border-red-400/35 bg-[linear-gradient(180deg,#c1272d_0%,#701118_100%)] text-red-50'
      : 'border-cyan-300/30 bg-[linear-gradient(180deg,#4b88c4_0%,#234a72_100%)] text-cyan-50';
    const inactiveClass = isFascist
      ? 'border-red-950 bg-[#15080a] text-red-200/18'
      : 'border-cyan-950 bg-[#0b141d] text-cyan-100/18';
    const accentTextClass = isFascist ? 'text-red-100/82' : 'text-cyan-100/82';
    const summary = isFascist ? 'powers at 3, 4, 5' : '5 to secure';
    const Icon = isFascist ? Skull : Shield;

    return (
      <div className="min-w-0 rounded-[14px] border border-white/6 bg-black/18 px-3 py-2">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className={`text-[8px] font-mono font-black uppercase tracking-[0.28em] ${accentTextClass}`}>
              {type === 'LIBERAL' ? 'Liberal Track' : 'Fascist Track'}
            </p>
            <p className="mt-1 text-[9px] font-mono uppercase tracking-[0.16em] text-white/28">
              {summary}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Icon size={12} className={accentTextClass} />
            <span className={`text-[11px] font-mono font-black uppercase tracking-[0.18em] ${accentTextClass}`}>
              {current}/{max}
            </span>
          </div>
        </div>

        <div className="mt-2 grid min-w-0 gap-1.5" style={{ gridTemplateColumns: `repeat(${max}, minmax(0, 1fr))` }}>
          {Array.from({ length: max }).map((_, index) => {
            const isActive = index < current;
            const slotMeta = getTrackSlotMeta(type, index);

            return (
              <div
                key={index}
                className={`relative min-h-[30px] border px-1 py-1 transition-all duration-500 sm:min-h-[34px] ${isActive ? `${fillClass} shadow-[0_8px_18px_rgba(0,0,0,0.18)]` : inactiveClass}`}
              >
                <div className="relative z-10 flex h-full flex-col items-center justify-between text-center">
                  <span className="text-[6px] font-mono font-black uppercase tracking-[0.22em] opacity-80">
                    {slotMeta}
                  </span>

                  {isActive ? (
                    <Icon size={9} />
                  ) : (
                    <span className="text-[9px] font-mono font-black opacity-38">
                      {index + 1}
                    </span>
                  )}
                </div>

                {index === current - 1 && (
                  <motion.div
                    initial={{ scale: 1.15, opacity: 0.55 }}
                    animate={{ scale: 1, opacity: 0 }}
                    transition={{ duration: 0.75, ease: 'easeOut' }}
                    className={`absolute inset-0 pointer-events-none ${isFascist ? 'bg-red-400/40' : 'bg-cyan-300/40'}`}
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
    if (showVoteReveal) {
      return (
        <div className="mx-auto w-full min-w-0 max-w-[1120px] px-3 sm:px-4">
          <div
            className={`min-w-0 rounded-[30px] border px-4 py-4 shadow-[0_28px_64px_rgba(0,0,0,0.42)] ${
              revealIsApproved
                ? 'border-cyan-300/22 bg-[linear-gradient(180deg,rgba(8,17,24,0.98)_0%,rgba(8,13,19,0.96)_100%)]'
                : 'border-red-400/22 bg-[linear-gradient(180deg,rgba(25,8,10,0.98)_0%,rgba(15,8,9,0.96)_100%)]'
            }`}
          >
            <div className="text-center">
              <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[8px] font-mono font-black uppercase tracking-[0.26em] text-white/65">
                Vote Result
              </span>
              <motion.h2
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className={`mt-3 text-xl font-black uppercase tracking-[0.14em] sm:text-2xl ${
                  revealIsApproved ? 'text-cyan-100' : 'text-red-100'
                }`}
              >
                {revealOutcomeTitle}
              </motion.h2>
              <p className="mt-2 text-sm leading-relaxed text-white/62">
                {revealNextStep}
              </p>
            </div>

            <div className="mt-5 rounded-[22px] border border-white/8 bg-black/22 px-4 py-4">
              <div className="relative h-4 overflow-hidden rounded-full bg-white/8">
                <motion.div
                  initial={false}
                  animate={{ width: `${revealJaPercent}%` }}
                  transition={{ type: 'spring', stiffness: 160, damping: 24 }}
                  className="absolute inset-y-0 left-0 bg-[linear-gradient(90deg,#36d7ff_0%,#87bfff_100%)]"
                />
                <motion.div
                  initial={false}
                  animate={{ width: `${revealNeinPercent}%` }}
                  transition={{ type: 'spring', stiffness: 160, damping: 24 }}
                  className="absolute inset-y-0 right-0 bg-[linear-gradient(90deg,#f87171_0%,#c1272d_100%)]"
                />
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3 text-sm font-mono font-black uppercase tracking-[0.16em]">
                <div className="rounded-2xl border border-cyan-300/16 bg-cyan-300/8 px-3 py-2 text-cyan-100">
                  <span className="block text-[9px] tracking-[0.22em] text-cyan-100/60">Ja</span>
                  <span className="mt-1 block text-lg">{revealedVoteTotals.YA}</span>
                </div>
                <div className="rounded-2xl border border-red-400/16 bg-red-500/8 px-3 py-2 text-red-100">
                  <span className="block text-[9px] tracking-[0.22em] text-red-100/60">Nein</span>
                  <span className="mt-1 block text-lg">{revealedVoteTotals.NEIN}</span>
                </div>
              </div>

              <p className="mt-3 text-center text-[10px] font-mono font-black uppercase tracking-[0.18em] text-white/45">
                {revealProgressTotal < aliveCount ? `Revealing votes ${revealProgressTotal}/${aliveCount}` : revealNextStep}
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (displayPhase === PHASES.VOTING && !showVoteReveal) {
      return (
        <div className="mx-auto w-full min-w-0 max-w-[1120px] px-3 sm:px-4">
          <div className="min-w-0 rounded-[28px] border border-cyan-300/18 bg-[linear-gradient(180deg,rgba(10,15,21,0.98)_0%,rgba(11,17,23,0.94)_100%)] px-4 py-4 shadow-[0_24px_56px_rgba(0,0,0,0.34)]">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <motion.span
                  animate={{ opacity: [0.55, 1, 0.55] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                  className="inline-flex rounded-full border border-cyan-300/18 bg-cyan-300/10 px-2.5 py-1 text-[8px] font-mono font-black uppercase tracking-[0.26em] text-cyan-100"
                >
                  Live Briefing
                </motion.span>
                <h2 className="mt-2 text-lg font-black uppercase tracking-[0.12em] text-white sm:text-xl">
                  {voteStatusTitle}
                </h2>
                <p className="mt-1 max-w-[40rem] text-sm leading-relaxed text-white/62">
                  {voteStatusCopy}
                </p>

                {!showVoteReveal && (
                  <div className="mt-3 flex items-center gap-2 text-[10px] font-mono font-black uppercase tracking-[0.18em] text-white/52">
                    <span>{waitingPlayersLabel}</span>
                    {voteResponsesRemaining > 0 && (
                      <div className="flex items-center gap-1">
                        {[0, 1, 2].map((index) => (
                          <motion.span
                            key={index}
                            animate={{ opacity: [0.25, 1, 0.25] }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut', delay: index * 0.18 }}
                            className="h-1.5 w-1.5 rounded-full bg-cyan-200/75"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

            </div>

            <div className="mt-4">
              <div className="text-[10px] font-mono font-black uppercase tracking-[0.18em] text-white/48">
                Vote Progress
              </div>
              <div className="relative mt-2 h-2.5 overflow-hidden rounded-full bg-white/8">
                <motion.div
                  initial={false}
                  animate={{ width: `${voteProgressPercent}%` }}
                  transition={{ type: 'spring', stiffness: 200, damping: 28 }}
                  className="relative h-full rounded-full bg-[linear-gradient(90deg,#36d7ff_0%,#87bfff_100%)]"
                >
                  {voteResponsesRemaining > 0 && (
                    <motion.div
                      animate={{ opacity: [0.35, 0.9, 0.35] }}
                      transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                      className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0)_0%,rgba(255,255,255,0.35)_50%,rgba(255,255,255,0)_100%)]"
                    />
                  )}
                </motion.div>
                <div
                  className="absolute inset-y-0 w-px bg-white/20"
                  style={{ left: `${Math.min(100, Math.max(0, (voteMajority / Math.max(1, aliveCount)) * 100))}%` }}
                />
              </div>
              <div className="mt-2 flex items-center justify-between gap-3">
                <span className="text-[10px] font-mono font-black uppercase tracking-[0.16em] text-white/65">
                  {waitingPlayersLabel}
                </span>
                <span className="text-[10px] font-mono font-black uppercase tracking-[0.16em] text-white/38">
                  Pass threshold: {voteMajority} JA
                </span>
              </div>
            </div>
          </div>

          <div className="mt-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="inline-flex min-w-max items-center gap-2 rounded-[18px] border border-white/8 bg-black/28 px-3 py-2 shadow-[0_12px_28px_rgba(0,0,0,0.18)] whitespace-nowrap text-[10px] font-mono font-black uppercase tracking-[0.16em] sm:gap-3 sm:text-[11px]">
              <span className="text-cyan-100">LIB {gameState.liberalPolicies}/{LIBERAL_TO_WIN}</span>
              <span className="text-white/18">|</span>
              <span className="text-red-100">FAS {gameState.fascistPolicies}/{FASCIST_TO_WIN}</span>
              <span className="text-white/18">|</span>
              {renderDeckMetric()}
              <span className="text-white/18">|</span>
              <span className="text-white/72">DISC {gameState.discardPileCount}</span>
              <span className="text-white/18">|</span>
              <span className="flex items-center gap-1.5 text-white/72">
                <span>CHAOS</span>
                <span className="flex items-center gap-1">
                  {Array.from({ length: MAX_ELECTION_TRACKER }).map((_, index) => (
                    <span
                      key={index}
                      className={`h-2 w-2 rounded-full ${
                        index < gameState.electionTracker
                          ? 'bg-red-400 shadow-[0_0_10px_rgba(248,113,113,0.35)]'
                          : 'bg-white/18'
                      }`}
                    />
                  ))}
                </span>
              </span>
            </div>
          </div>
        </div>
      );
    }

    const isDimmed = displayPhase === PHASES.VOTING;

    return (
      <div className={`mx-auto w-full min-w-0 max-w-[1120px] px-3 sm:px-4 transition-all duration-700 ${isDimmed ? 'scale-[0.99] opacity-45' : 'opacity-[0.84]'}`}>
        <div className="overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="inline-flex min-w-max items-center gap-2 border border-white/6 bg-black/22 px-3 py-2 text-[10px] font-mono font-black uppercase tracking-[0.16em] text-white/68 shadow-[0_12px_24px_rgba(0,0,0,0.16)] sm:gap-3 sm:text-[11px]">
            <span className="text-cyan-100">LIB {gameState.liberalPolicies}/{LIBERAL_TO_WIN}</span>
            <span className="text-white/16">|</span>
            <span className="text-red-100">FAS {gameState.fascistPolicies}/{FASCIST_TO_WIN}</span>
            <span className="text-white/16">|</span>
            {renderDeckMetric('text-white/68')}
            <span className="text-white/16">|</span>
            <span>DISC {gameState.discardPileCount}</span>
            <span className="text-white/16">|</span>
            <span className="flex items-center gap-1.5">
              <span>CHAOS</span>
              <span className="flex items-center gap-1">
                {Array.from({ length: MAX_ELECTION_TRACKER }).map((_, index) => (
                  <span
                    key={index}
                    className={`h-2 w-2 ${
                      index < gameState.electionTracker
                        ? 'bg-red-400 shadow-[0_0_10px_rgba(248,113,113,0.35)]'
                        : 'bg-white/16'
                    }`}
                  />
                ))}
              </span>
            </span>
          </div>
        </div>

        <div className="mt-3 grid min-w-0 gap-2 md:grid-cols-2">
          {renderTrack(gameState.liberalPolicies, LIBERAL_TO_WIN, 'LIBERAL')}
          {renderTrack(gameState.fascistPolicies, FASCIST_TO_WIN, 'FASCIST')}
        </div>
      </div>
    );
  };

  const renderPlayerDock = () => {
    const isVotingPhase = displayPhase === PHASES.VOTING;
    const isLegislativePhase = displayPhase === PHASES.LEGISLATIVE_PRESIDENT || displayPhase === PHASES.LEGISLATIVE_CHANCELLOR;
    const gridColsClass = getPlayerGridCols(playerCount);
    const playerCardSizeClass = isVotingPhase ? getVotingPlayerCardSize(playerCount) : getPlayerCardSize(playerCount);
    const votingGroups = isVotingPhase
      ? showVoteReveal
        ? getVoteRevealGroups(gameState.players, revealState?.votes)
        : getVotingGroups(gameState.players)
      : [];
    const executiveLabel =
      executivePower === EXECUTIVE_POWERS.INVESTIGATE
        ? 'Select one player to investigate'
        : executivePower === EXECUTIVE_POWERS.SPECIAL_ELECTION
          ? 'Choose the next president'
          : executivePower === EXECUTIVE_POWERS.EXECUTION
            ? 'Choose one target from the dock'
            : 'Executive action in progress';
    const dockHint = canNominate
      ? 'Nominate from the dock below'
      : canExecutiveTarget
        ? executiveLabel
        : isVotingPhase
          ? null
          : isLegislativePhase
            ? 'Policy handoff in progress'
            : 'Private phone table';
    const dockTitle = 'Players';
    const dockBadgeLabel = isVotingPhase ? null : `${aliveCount}/${playerCount} Live`;
    const dockWrapperClass = isVoteRevealPhase
      ? 'mx-auto w-full min-w-0 max-w-[1120px] px-3 sm:px-4'
      : 'mx-auto flex min-h-0 w-full min-w-0 max-w-[1120px] flex-1 px-3 sm:px-4';
    const dockPanelClass = isVoteRevealPhase
      ? 'relative min-w-0 w-full overflow-hidden rounded-[28px] border border-white/8 bg-black/28 p-3 shadow-[0_18px_40px_rgba(0,0,0,0.24)] sm:p-4'
      : 'relative h-full min-h-0 min-w-0 w-full overflow-hidden rounded-[28px] border border-white/8 bg-black/28 p-3 shadow-[0_18px_40px_rgba(0,0,0,0.24)] sm:p-4';
    const dockBodyClass = isVoteRevealPhase
      ? 'relative z-10 min-w-0 pt-3'
      : 'relative z-10 min-h-0 min-w-0 overflow-y-auto pt-3';

    return (
      <div className={dockWrapperClass}>
        <div className={dockPanelClass}>
          <div className="absolute inset-0 paper-grain opacity-[0.06] pointer-events-none" />

          <div className="relative z-10 grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)]">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[8px] font-mono font-black uppercase tracking-[0.32em] text-cyan-300/75">
                  {dockTitle}
                </p>
                {dockHint && (
                  <p className="mt-1 text-[9px] leading-relaxed text-white/55 sm:text-[10px]">
                    {dockHint}
                  </p>
                )}
              </div>

              {dockBadgeLabel && (
                <div className="shrink-0 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[8px] font-mono font-black uppercase tracking-[0.22em] text-white/70">
                  {dockBadgeLabel}
                </div>
              )}
            </div>

            <div className={dockBodyClass}>
              {isVotingPhase ? (
                <div className="space-y-4">
                  {votingGroups.map((group) => (
                    <div key={group.key}>
                      {(() => {
                        const visibleGroupPlayers = showVoteReveal
                          ? group.key === 'OBSERVERS'
                            ? group.players
                            : group.players.filter((player) => revealedVoteIds.includes(player.id))
                          : group.players;
                        if (showVoteReveal && visibleGroupPlayers.length === 0) {
                          return null;
                        }
                        const groupCount = visibleGroupPlayers.length;
                        const groupToneClass =
                          group.tone === 'ja'
                            ? 'text-cyan-100/78'
                            : group.tone === 'nein'
                              ? 'text-red-100/78'
                              : 'text-white/40';

                        return (
                          <>
                      <div className="mb-2 flex items-center gap-2">
                        <span className={`text-[8px] font-mono font-black uppercase tracking-[0.24em] ${groupToneClass}`}>
                          {group.label}{showVoteReveal && group.key !== 'OBSERVERS' ? ` (${groupCount})` : ''}
                        </span>
                        <span className="h-px flex-1 bg-white/8" />
                      </div>

                      <div className="flex flex-wrap items-start gap-2 sm:gap-3">
                        {visibleGroupPlayers.map((player) => {
                          const isSelf = player.id === myActualId;
                          const isRevealed = showVoteReveal;
                          const finalVote = isRevealed ? revealState.votes[player.id] : null;
                          const voteStatus = getVotingStatusMeta(player, isRevealed, finalVote);
                          const justVoted = recentVoteIds.includes(player.id);

                          return (
                            <motion.div
                              key={player.id}
                              layout
                              initial={showVoteReveal ? { opacity: 0, y: 12, scale: 0.92 } : false}
                              animate={showVoteReveal ? { opacity: 1, y: 0, scale: 1 } : justVoted ? { scale: [1, 1.04, 1] } : { scale: 1 }}
                              transition={{ duration: showVoteReveal ? 0.28 : 0.45, ease: 'easeOut' }}
                              className="relative"
                            >
                              <div
                                className={`relative flex w-full flex-col items-center overflow-hidden rounded-[20px] border bg-[linear-gradient(180deg,rgba(17,19,22,0.98)_0%,rgba(10,11,13,0.96)_100%)] p-2 text-center transition-all duration-300 ${playerCardSizeClass}
                                  ${!player.isAlive ? 'opacity-45' : ''}
                                  ${isRevealed && finalVote === 'YA' ? 'ring-4 ring-[#2b5c8f] shadow-xl' : ''}
                                  ${isRevealed && finalVote === 'NEIN' ? 'ring-4 ring-[var(--color-stamp-red)] shadow-xl' : ''}
                                  ${justVoted ? 'border-cyan-300/40 shadow-[0_0_0_1px_rgba(103,232,249,0.28),0_0_26px_rgba(103,232,249,0.18)]' : ''}
                                  ${isSelf ? 'border-cyan-300/28 shadow-[0_0_0_1px_rgba(103,232,249,0.2),0_16px_32px_rgba(0,0,0,0.25)]' : 'border-white/8 shadow-[0_12px_24px_rgba(0,0,0,0.22)]'}
                                `}
                              >
                                {player.isBot && (
                                  <span className="absolute right-1.5 top-1.5 z-10 inline-flex items-center gap-1 rounded-full border border-amber-300/25 bg-amber-400/12 px-1.5 py-0.5 text-[6px] font-mono font-black uppercase tracking-[0.16em] text-amber-100">
                                    <Bot size={8} />
                                    Bot
                                  </span>
                                )}

                                <div className={`relative mx-auto flex h-14 w-14 items-end justify-center overflow-hidden rounded-[18px] border ${
                                  player.isAlive ? 'border-white/10 bg-white/[0.06]' : 'border-white/8 bg-white/[0.04]'
                                }`}>
                                  {player.isAlive ? (
                                    <img
                                      src={`/assets/avatars/avatar_${getAvatarId(player)}.png`}
                                      alt="Operative Profile"
                                      loading="lazy"
                                      decoding="async"
                                      className="absolute inset-0 h-full w-full object-cover opacity-78"
                                    />
                                  ) : (
                                    <Skull size={18} className="text-white/35" />
                                  )}
                                </div>

                                <span className={`mt-2 w-full truncate text-[10px] font-black uppercase tracking-[0.08em] ${
                                  player.isAlive ? 'text-white' : 'text-white/40 line-through'
                                }`}>
                                  {player.name}
                                </span>

                                <div className="mt-2 flex items-center justify-center gap-1.5 text-[9px] font-mono font-black uppercase tracking-[0.16em]">
                                  <motion.span
                                    animate={!isRevealed && player.isAlive && !player.hasVoted ? { opacity: [0.4, 1, 0.4] } : { opacity: 1 }}
                                    transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                                    className={`h-2 w-2 rounded-full ${voteStatus.dotClassName}`}
                                  />
                                  <span className={voteStatus.className}>{voteStatus.label}</span>
                                </div>

                                {player.isAlive && (
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
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                          </>
                        );
                      })()}
                    </div>
                  ))}
                </div>
              ) : (
                <div className={`grid min-w-0 w-full content-start justify-items-center gap-2 sm:gap-3 ${gridColsClass}`}>
                  {gameState.players.map((player) => {
                    const isSelf = player.id === myActualId;
                    const alreadyInvestigated = gameState.investigatedPlayerIds?.includes(player.id);
                    const isSelectable =
                      (displayPhase === PHASES.NOMINATION && canNominate && player.isAlive && !isSelf) ||
                      (displayPhase === PHASES.EXECUTIVE_ACTION &&
                        canExecutiveTarget &&
                        player.isAlive &&
                        !isSelf &&
                        !(executivePower === EXECUTIVE_POWERS.INVESTIGATE && alreadyInvestigated));
                    const isPending = pendingSelection?.id === player.id;
                    const playerIsPresident = player.id === gameState.currentPresident;
                    const playerIsChancellor = player.id === gameState.currentChancellor || player.id === gameState.nominatedChancellor;
                    const isInactiveLegislator = isLegislativePhase && !playerIsPresident && !playerIsChancellor;

                    return (
                      <div key={player.id} className="relative flex w-full justify-center">
                        <motion.button
                          layout
                          whileHover={isSelectable ? { y: -3 } : {}}
                          whileTap={isSelectable ? { scale: 0.97 } : {}}
                          onClick={() => {
                            if (!isSelectable) return;
                            if (displayPhase === PHASES.NOMINATION) handleNominate(player.id);
                            if (displayPhase === PHASES.EXECUTIVE_ACTION && executivePower === EXECUTIVE_POWERS.EXECUTION) handleKill(player.id);
                            if (displayPhase === PHASES.EXECUTIVE_ACTION && executivePower === EXECUTIVE_POWERS.INVESTIGATE) handleInvestigate(player.id);
                            if (displayPhase === PHASES.EXECUTIVE_ACTION && executivePower === EXECUTIVE_POWERS.SPECIAL_ELECTION) handleSpecialElection(player.id);
                          }}
                          className={`group relative flex w-full flex-col overflow-hidden rounded-[20px] border border-[#d4c098] bg-[var(--color-paper-light)] p-1.5 text-center shadow-md outline-none transition-all duration-300 sm:p-2 ${playerCardSizeClass}
                            ${isInactiveLegislator ? 'opacity-35 grayscale-[0.45]' : ''}
                            ${isSelectable ? 'cursor-pointer ring-1 ring-transparent hover:border-[#b09868] hover:bg-[#fff9ed] hover:shadow-xl hover:ring-[var(--color-stamp-blue)]' : 'cursor-default'}
                            ${!player.isAlive ? 'bg-[#d8d0c0] opacity-45 brightness-75' : ''}
                            ${displayPhase === PHASES.EXECUTIVE_ACTION && executivePower === EXECUTIVE_POWERS.INVESTIGATE && alreadyInvestigated ? 'opacity-45 grayscale-[0.3]' : ''}
                            ${isPending ? 'z-20 scale-[1.03] !opacity-100 ring-4 ring-[var(--color-stamp-red)] shadow-2xl' : ''}
                          `}
                        >
                          {(playerIsPresident || playerIsChancellor) && (
                            <span className={`absolute left-1.5 top-1.5 z-10 rounded-full px-1.5 py-0.5 text-[6px] font-mono font-black uppercase tracking-[0.2em] ${
                              playerIsPresident ? 'bg-[#d4af37] text-white' : 'bg-[#d9d9d9] text-[#2c2c2c]'
                            }`}>
                              {playerIsPresident ? 'PRES' : 'CHAN'}
                            </span>
                          )}

                          {player.isBot && (
                            <span className="absolute right-1.5 top-1.5 z-10 inline-flex items-center gap-1 rounded-full border border-amber-700/35 bg-amber-300/14 px-1.5 py-0.5 text-[6px] font-mono font-black uppercase tracking-[0.16em] text-[#7a5412]">
                              <Bot size={8} />
                              Bot
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
                                  loading="lazy"
                                  decoding="async"
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

                          {isSelectable && displayPhase === PHASES.EXECUTIVE_ACTION && !isPending && (
                            <span className="absolute inset-x-0 bottom-1 mx-auto w-fit rounded-full border border-[var(--color-stamp-red)] px-1.5 py-0.5 text-[6px] font-black uppercase tracking-[0.18em] text-[var(--color-stamp-red)] opacity-0 transition-all mix-blend-multiply group-hover:opacity-100">
                              {executivePower === EXECUTIVE_POWERS.INVESTIGATE
                                ? 'Investigate'
                                : executivePower === EXECUTIVE_POWERS.SPECIAL_ELECTION
                                  ? 'Elect'
                                  : 'Eliminate'}
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
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const boardDimmed = Boolean(pendingSelection);
  const boardContentTopClass = isVoteRevealPhase ? 'pt-4 sm:pt-5' : 'pt-16 sm:pt-20';

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
      className="relative h-full min-h-0 w-full overflow-hidden bg-obsidian-950 pt-[var(--app-header-offset)]"
    >
      <div className={`absolute inset-0 z-50 pointer-events-none transition-all duration-300 ${revealStage === 0 && showVoteReveal ? 'bg-black/80' : 'bg-transparent'}`} />

      {revealStage === 1 && showVoteReveal && (
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
        directorState={directorState}
        revealState={showVoteReveal ? revealState : null}
        pendingSelection={pendingSelection}
        onConfirm={confirmSelection}
        onCancel={cancelSelection}
        onVote={onVote}
        onDiscard={onDiscard}
        onRequestVeto={onRequestVeto}
        onRespondVeto={onRespondVeto}
        onEnact={onEnact}
        onAcknowledgePeek={onAcknowledgePeek}
      />

      <div className={`relative z-10 grid h-full min-h-0 min-w-0 grid-rows-[auto_minmax(0,1fr)] gap-2 pb-[calc(var(--app-safe-bottom)+0.75rem)] transition-all duration-700 sm:gap-3 sm:pb-[calc(var(--app-safe-bottom)+1rem)] ${boardContentTopClass} ${boardDimmed ? 'opacity-45' : 'opacity-100'}`}>
        {renderBoardStage()}
        {renderPlayerDock()}
      </div>
    </motion.div>
  );
}
