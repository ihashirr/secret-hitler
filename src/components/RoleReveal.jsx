import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { FACTIONS, ROLES } from '../lib/constants';
import { triggerHaptic } from '../lib/haptics';

const AUTO_ADVANCE_MS = 5000;

const THEMES = {
  liberal: {
    glow: 'rgba(54, 161, 255, 0.22)',
    frame: 'border-cyan-400/20 bg-[#0a1016]',
    panel: 'border-cyan-400/15 bg-cyan-400/5',
    chip: 'border-cyan-400/18 bg-cyan-400/10 text-cyan-100',
    button: 'border-cyan-400/30 bg-[linear-gradient(180deg,#22d3ee_0%,#0891b2_100%)] text-white',
    partyImage: '/assets/policy-liberal.png',
  },
  fascist: {
    glow: 'rgba(239, 68, 68, 0.22)',
    frame: 'border-red-500/20 bg-[#0e0708]',
    panel: 'border-red-500/15 bg-red-500/5',
    chip: 'border-red-500/18 bg-red-500/10 text-red-100',
    button: 'border-red-500/30 bg-[linear-gradient(180deg,#ef4444_0%,#991b1b_100%)] text-white',
    partyImage: '/assets/policy-fascist.png',
  },
};

const ROLE_COPY = {
  [ROLES.LIBERAL]: {
    title: 'The Loyal Liberal',
    membership: 'LIBERAL PARTY',
    mission: "Stop the fascists from ruining the scenes. Keep it 100, find your allies, and don't get played.",
    image: '/assets/role-liberal-premium.png',
    accent: 'text-cyan-400',
    description: 'Protect the Republic at all costs.',
  },
  [ROLES.FASCIST]: {
    title: 'The Secret Fascist',
    membership: 'FASCIST PARTY',
    mission: "Operation: Gaslight. Get Hitler on the throne. Easy dubs if you play the table right.",
    image: '/assets/role-fascist-premium.png',
    accent: 'text-red-500',
    description: 'Infiltrate and usher in the New Order.',
  },
  [ROLES.HITLER]: {
    title: 'The Secret Hitler',
    membership: 'FASCIST PARTY',
    mission: "The Main Character. Stay low, look innocent, and wait for the table to cook themselves.",
    image: '/assets/role-hitler-premium.png',
    accent: 'text-red-600',
    description: 'Rise to power through legal mechanisms.',
  },
};

const getAvatarId = (player) => player?.avatarId || 1;

export default function RoleReveal({ gameState, playerId, onReady }) {
  const myActualId = gameState?.myPlayerId || playerId;
  const me = gameState.players.find((p) => p.id === myActualId);
  const role = me?.role || ROLES.LIBERAL;
  const faction = me?.faction || (role === ROLES.LIBERAL ? FACTIONS.LIBERAL : FACTIONS.FASCIST);
  const theme = faction === FACTIONS.LIBERAL ? THEMES.liberal : THEMES.fascist;
  const roleMeta = ROLE_COPY[role];

  const [step, setStep] = useState('cover');
  const [remainingMs, setRemainingMs] = useState(AUTO_ADVANCE_MS);
  const [isHolding, setIsHolding] = useState(false);

  const knownPlayers = useMemo(
    () => gameState.players.filter((p) => p.id !== myActualId && Boolean(p.role)),
    [gameState, myActualId]
  );

  useEffect(() => {
    if (step !== 'role' || isHolding) return;

    const interval = setInterval(() => {
      setRemainingMs((prev) => {
        if (prev <= 100) {
          clearInterval(interval);
          setStep('briefing');
          return 0;
        }
        return prev - 100;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [step, isHolding]);

  const handleReveal = () => {
    triggerHaptic('selection');
    setStep('role');
  };

  const handleSkip = () => {
    triggerHaptic('soft');
    setStep('briefing');
  };

  const handleReady = () => {
    triggerHaptic('confirm');
    onReady();
  };

  if (me?.isReady) {
    return (
      <div className="relative flex h-full w-full items-center justify-center bg-obsidian-950 px-4">
        <div className="absolute inset-0 board-grid opacity-[0.04]" />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`relative z-10 w-full max-w-sm rounded-4xl border ${theme.frame} px-6 py-10 text-center shadow-2xl`}
        >
          <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border ${theme.panel}`}>
            <Check size={32} />
          </div>
          <h2 className="mt-6 text-2xl font-black uppercase tracking-tight text-white">Identity Secured</h2>
          <p className="mt-2 text-sm text-white/40">Waiting for other operatives...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative flex h-(--app-vh) min-h-0 w-full flex-col overflow-hidden bg-obsidian-950 px-3 pb-[calc(var(--app-safe-bottom)+0.75rem)] pt-[calc(var(--app-header-offset)+8px)] sm:px-6 sm:pb-[calc(var(--app-safe-bottom)+1rem)] sm:pt-[calc(var(--app-header-offset)+12px)]">
      <div className="absolute inset-0 board-grid opacity-[0.04]" />
      <div
        className="pointer-events-none absolute inset-0 blur-[120px]"
        style={{ background: `radial-gradient(circle at 50% 30%, ${theme.glow} 0%, transparent 60%)` }}
      />

      <div className="relative z-10 mx-auto flex h-full min-h-0 w-full max-w-sm flex-col">
        <div className="shrink-0 py-1.5 text-center sm:py-2">
          <span className="text-[10px] font-mono font-black uppercase tracking-[0.4em] text-white/30">
            Classified Transmission
          </span>
        </div>

        <div className="flex min-h-0 flex-1 items-center justify-center">
          <AnimatePresence mode="wait">
            {step === 'cover' && (
              <motion.div
                key="cover"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`w-full max-h-[calc(var(--app-vh)-var(--app-header-offset)-var(--app-safe-bottom)-18px)] overflow-y-auto rounded-[40px] border ${theme.frame} px-5 py-7 text-center shadow-2xl scrollbar-hide sm:px-6 sm:py-10`}
              >
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl border border-white/10 bg-white/5 sm:h-20 sm:w-20">
                  <div className="h-4 w-4 rounded-full border-2 border-white/20" />
                </div>
                <h1 className="mt-6 text-[clamp(1.5rem,6.6vw,1.95rem)] font-black uppercase tracking-tight text-white sm:mt-8">Hide Screen</h1>
                <p className="mt-2 text-sm text-white/50">Ensure privacy before identity reveal.</p>
                <button
                  type="button"
                  onClick={handleReveal}
                  className={`mt-7 h-14 w-full rounded-2xl border text-[10px] font-black uppercase tracking-[0.18em] shadow-xl active:scale-[0.98] sm:mt-10 sm:h-16 sm:text-[11px] ${theme.button}`}
                >
                  Confirm Awareness
                </button>
              </motion.div>
            )}

            {step === 'role' && (
              <motion.div
                key="role"
                initial={{ opacity: 0, rotateY: 90 }}
                animate={{ opacity: 1, rotateY: 0 }}
                exit={{ opacity: 0, scale: 1.1 }}
                onPointerDown={() => {
                  setIsHolding(true);
                  triggerHaptic('selection');
                }}
                onPointerUp={() => setIsHolding(false)}
                onPointerLeave={() => setIsHolding(false)}
                className={`group relative w-full max-h-[calc(var(--app-vh)-var(--app-header-offset)-var(--app-safe-bottom)-18px)] cursor-pointer select-none overflow-hidden rounded-[40px] border ${theme.frame} px-5 pb-24 pt-6 text-center shadow-[0_32px_80px_rgba(0,0,0,0.6)] transition-transform sm:px-6 sm:pb-28 sm:pt-8 ${isHolding ? 'scale-[1.02]' : ''}`}
              >
                <div className="absolute inset-0 paper-grain opacity-10 pointer-events-none" />
                <img
                  src={roleMeta.image}
                  alt={roleMeta.title}
                  className="mx-auto w-full max-w-[clamp(8.25rem,24vh,12.5rem)] drop-shadow-2xl transition-transform duration-700 group-hover:scale-105"
                />
                <div className="mt-5 sm:mt-8">
                  <span className={`text-[10px] font-mono font-black uppercase tracking-[0.3em] ${roleMeta.accent}`}>
                    {roleMeta.membership}
                  </span>
                  <h2 className="mt-2 text-[clamp(1.55rem,6vw,2.6rem)] font-black uppercase leading-[0.92] tracking-tight text-white">
                    {roleMeta.title}
                  </h2>
                </div>

                <div className="absolute inset-x-0 bottom-0 px-5 pb-4 sm:px-6 sm:pb-6">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                    <motion.div
                      initial={false}
                      animate={{ width: `${(remainingMs / AUTO_ADVANCE_MS) * 100}%` }}
                      transition={{ duration: 0.1, ease: 'linear' }}
                      className={`h-full ${faction === FACTIONS.LIBERAL ? 'bg-cyan-400' : 'bg-red-500'}`}
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[clamp(0.42rem,1.9vw,0.5rem)] font-mono font-black uppercase tracking-[0.16em] text-white/30 sm:mt-3 sm:text-[8px] sm:tracking-widest">
                    <span className="truncate pr-2">{isHolding ? 'Timer Paused' : 'Revealing Mission'}</span>
                    <button onClick={handleSkip} className="shrink-0 whitespace-nowrap hover:text-white">Proceed Now</button>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 'briefing' && (
              <motion.div
                key="briefing"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`flex min-h-0 w-full max-h-[calc(var(--app-vh)-var(--app-header-offset)-var(--app-safe-bottom)-18px)] flex-col rounded-[40px] border ${theme.frame} px-5 py-6 shadow-2xl sm:px-6 sm:py-8`}
              >
                <div className="shrink-0 text-center">
                  <span className="text-[9px] font-mono font-black uppercase tracking-[0.4em] text-white/30">
                    Mission Briefing
                  </span>
                  <h2 className={`mt-2 text-[clamp(1.35rem,5.4vw,1.5rem)] font-black uppercase tracking-tight text-white`}>{roleMeta.title}</h2>
                </div>

                <div className="scrollbar-hide flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto py-1 pr-1 sm:gap-6">
                  <div className="rounded-3xl border border-white/5 bg-black/40 p-4 text-center sm:p-5">
                    <p className="text-[11px] leading-relaxed text-white/70 italic">
                      &ldquo;{roleMeta.mission}&rdquo;
                    </p>
                  </div>

                  {knownPlayers.length > 0 && (
                    <div className="flex flex-col gap-3">
                      <span className="px-2 text-[9px] font-mono font-black uppercase tracking-widest text-white/30">
                        Operative Database
                      </span>
                      <div className="grid grid-cols-1 gap-2">
                        {knownPlayers.map((p) => (
                          <div key={p.id} className={`flex items-center gap-3 rounded-2xl border p-2.5 sm:gap-4 sm:p-3 ${theme.panel}`}>
                            <img
                              src={`/assets/avatars/avatar_${getAvatarId(p)}.png`}
                              className="h-9 w-9 rounded-xl border border-white/10 p-0.5 object-cover sm:h-10 sm:w-10"
                              alt=""
                            />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[11px] font-black uppercase tracking-wide text-white sm:text-xs">{p.name}</p>
                              <p className={`text-[9px] font-mono font-black uppercase tracking-widest ${roleMeta.accent}`}>
                                {p.role === ROLES.HITLER ? 'HITLER' : 'FASCIST'}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleReady}
                  className={`mt-3 h-14 w-full shrink-0 rounded-2xl border text-[10px] font-black uppercase tracking-[0.18em] shadow-xl active:scale-[0.98] sm:h-16 sm:text-[11px] sm:tracking-[0.2em] ${theme.button}`}
                >
                  Transmission Confirmed
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
