import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { FACTIONS, ROLES } from '../lib/constants';
import { triggerHaptic } from '../lib/haptics';

const AUTO_ADVANCE_MS = 5000;

const THEMES = {
  liberal: {
    glow: 'rgba(54, 161, 255, 0.18)',
    frame: 'border-cyan-300/18 bg-[linear-gradient(180deg,rgba(8,18,28,0.96)_0%,rgba(8,14,22,0.92)_100%)]',
    panel: 'border-cyan-300/16 bg-cyan-300/10 text-cyan-100',
    chip: 'border-cyan-300/18 bg-cyan-300/10 text-cyan-100',
    softText: 'text-cyan-100/72',
    strongText: 'text-cyan-100',
    button: 'border-cyan-300/22 bg-[linear-gradient(180deg,#3992da_0%,#225177_100%)] text-white',
    partyImage: '/assets/policy-liberal.png',
    partyLabel: 'Liberal Party',
  },
  fascist: {
    glow: 'rgba(218, 64, 64, 0.18)',
    frame: 'border-red-400/18 bg-[linear-gradient(180deg,rgba(28,10,12,0.96)_0%,rgba(19,8,9,0.92)_100%)]',
    panel: 'border-red-400/16 bg-red-500/10 text-red-100',
    chip: 'border-red-400/18 bg-red-500/10 text-red-100',
    softText: 'text-red-100/72',
    strongText: 'text-red-100',
    button: 'border-red-300/22 bg-[linear-gradient(180deg,#be373d_0%,#77181d_100%)] text-white',
    partyImage: '/assets/policy-fascist.png',
    partyLabel: 'Fascist Party',
  },
};

const ROLE_COPY = {
  [ROLES.LIBERAL]: {
    headline: 'You Are A Liberal',
    detail: 'Protect the Republic and keep Hitler away from power.',
    stamp: 'LIBERAL',
    image: '/assets/role-liberal.png',
  },
  [ROLES.FASCIST]: {
    headline: 'You Are A Fascist',
    detail: 'Blend in, protect Hitler, and push the regime forward.',
    stamp: 'FASCIST',
    image: '/assets/role-fascist.png',
  },
  [ROLES.HITLER]: {
    headline: 'You Are Hitler',
    detail: 'Stay trusted. Let the table bring you to power.',
    stamp: 'HITLER',
    image: '/assets/role-hitler.png',
  },
};

function getStableNumber(seed, min, max) {
  let hash = 0;
  for (const char of seed) {
    hash = (hash * 31 + char.charCodeAt(0)) % 100000;
  }

  return min + (hash % (max - min + 1));
}

function getAvatarId(player) {
  if (player?.avatarId) return player.avatarId;
  return getStableNumber(player?.id || player?.name || 'operative', 1, 10);
}

function getKnownPlayers(gameState, myActualId) {
  return gameState.players.filter(
    (candidate) => candidate.id !== myActualId && Boolean(candidate.role),
  );
}

export default function RoleReveal({ gameState, playerId, onReady }) {
  const myActualId = gameState?.myPlayerId || playerId;
  const me = gameState.players.find((player) => player.id === myActualId);
  const role = me?.role || ROLES.LIBERAL;
  const faction = me?.faction || (role === ROLES.LIBERAL ? FACTIONS.LIBERAL : FACTIONS.FASCIST);
  const theme = faction === FACTIONS.LIBERAL ? THEMES.liberal : THEMES.fascist;
  const roleMeta = ROLE_COPY[role] || ROLE_COPY[ROLES.LIBERAL];
  const [step, setStep] = useState('cover');

  const knownPlayers = useMemo(
    () => getKnownPlayers(gameState, myActualId),
    [gameState, myActualId],
  );

  useEffect(() => {
    if (step !== 'role') return undefined;

    const timer = window.setTimeout(() => {
      setStep('briefing');
    }, AUTO_ADVANCE_MS);

    return () => window.clearTimeout(timer);
  }, [step]);

  const revealRole = () => {
    triggerHaptic('selection');
    setStep('role');
  };

  const showBriefingNow = () => {
    triggerHaptic('soft');
    setStep('briefing');
  };

  const handleReady = () => {
    triggerHaptic('confirm');
    onReady();
  };

  const allyHeading =
    role === ROLES.FASCIST
      ? 'Known To You'
      : role === ROLES.HITLER
        ? 'Known To You'
        : 'Who You Know';
  const allySummary =
    knownPlayers.length > 0
      ? role === ROLES.HITLER
        ? 'These players are visible to you before the game begins.'
        : 'Keep these identities quiet and coordinate indirectly.'
      : role === ROLES.LIBERAL
        ? 'Nobody is revealed to you at the start.'
        : 'Nobody is revealed to you at the start.';

  if (me?.isReady) {
    return (
      <div className="relative flex h-full min-h-0 w-full items-center justify-center overflow-hidden bg-obsidian-950 px-4 pb-[calc(var(--app-safe-bottom)+1rem)] pt-[calc(var(--app-header-offset)+12px)]">
        <div className="absolute inset-0 board-grid opacity-[0.04]" />
        <div
          className="pointer-events-none absolute inset-0 blur-[120px]"
          style={{ background: `radial-gradient(circle at 50% 32%, ${theme.glow} 0%, transparent 62%)` }}
        />
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className={`relative z-10 w-full max-w-sm rounded-[30px] border ${theme.frame} px-6 py-8 text-center shadow-[0_28px_80px_rgba(0,0,0,0.52)]`}
        >
          <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border ${theme.panel}`}>
            <Check size={30} />
          </div>
          <p className="mt-5 text-[10px] font-mono font-black uppercase tracking-[0.32em] text-white/36">
            Role Confirmed
          </p>
          <h2 className="mt-3 text-2xl font-black uppercase tracking-[0.14em] text-white">
            Waiting For The Table
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-white/48">
            Stay on this screen until everyone has finished checking their identity.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative flex h-full min-h-0 w-full overflow-hidden bg-obsidian-950 px-4 pb-[calc(var(--app-safe-bottom)+1rem)] pt-[calc(var(--app-header-offset)+12px)] sm:px-6">
      <div className="absolute inset-0 board-grid opacity-[0.04]" />
      <div
        className="pointer-events-none absolute inset-0 blur-[120px] transition-opacity duration-700"
        style={{ background: `radial-gradient(circle at 50% 24%, ${theme.glow} 0%, transparent 60%)` }}
      />

      <div className="relative z-10 mx-auto flex h-full min-h-0 w-full max-w-md flex-col">
        <div className="shrink-0 pt-2 text-center">
          <p className="text-[10px] font-mono font-black uppercase tracking-[0.36em] text-white/30">
            Private Role Reveal
          </p>
        </div>

        <div className="flex min-h-0 flex-1 items-center justify-center">
          <AnimatePresence mode="wait">
            {step === 'cover' && (
              <motion.div
                key="cover"
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -18, scale: 0.98 }}
                transition={{ duration: 0.28, ease: 'easeOut' }}
                className={`w-full rounded-[30px] border ${theme.frame} px-6 py-8 text-center shadow-[0_28px_80px_rgba(0,0,0,0.52)]`}
              >
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[26px] border border-white/10 bg-white/[0.05]">
                  <div className="h-7 w-7 rounded-xl border-2 border-white/18" />
                </div>
                <h1 className="mt-6 text-2xl font-black uppercase tracking-[0.14em] text-white">
                  Hide Your Screen
                </h1>
                <p className="mt-3 text-sm leading-relaxed text-white/52">
                  Make sure nobody else can see before you reveal your identity.
                </p>
                <button
                  type="button"
                  onClick={revealRole}
                  className={`mt-8 inline-flex h-14 w-full items-center justify-center rounded-2xl border text-[11px] font-black uppercase tracking-[0.24em] shadow-[0_16px_34px_rgba(0,0,0,0.28)] transition-transform active:scale-[0.98] ${theme.button}`}
                >
                  Reveal My Role
                </button>
              </motion.div>
            )}

            {step === 'role' && (
              <motion.div
                key="role"
                initial={{ opacity: 0, scale: 0.96, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 1.02, y: -16 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className={`w-full rounded-[32px] border ${theme.frame} px-6 py-6 text-center shadow-[0_30px_90px_rgba(0,0,0,0.6)]`}
              >
                <p className="text-[10px] font-mono font-black uppercase tracking-[0.32em] text-white/32">
                  Your Identity
                </p>
                <div className="mt-6">
                  <div className="relative mx-auto aspect-[0.7] w-full max-w-[240px] overflow-hidden rounded-[24px] border border-white/15 bg-black/40 shadow-2xl">
                    <div className="absolute inset-0 paper-grain opacity-20" />
                    <img 
                      src={roleMeta.image} 
                      alt="" 
                      className="h-full w-full object-cover transition-transform duration-[3000ms] hover:scale-105" 
                      loading="eager"
                    />
                    <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className={`absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full border px-4 py-1 text-[9px] font-mono font-black uppercase tracking-widest ${theme.chip}`}>
                      {roleMeta.stamp}
                    </div>
                  </div>

                  <h2 className="mt-6 text-3xl font-black uppercase tracking-tight text-white leading-none">
                    {roleMeta.headline}
                  </h2>
                  <p className="mt-4 text-sm leading-relaxed text-white/58 px-4">
                    {roleMeta.detail}
                  </p>
                </div>

                <div className="mt-8">
                  <div className="mx-auto h-1 w-full max-w-[180px] overflow-hidden rounded-full bg-white/10">
                    <motion.div
                      initial={{ width: '0%' }}
                      animate={{ width: '100%' }}
                      transition={{ duration: AUTO_ADVANCE_MS / 1000, ease: 'linear' }}
                      className={`h-full rounded-full ${faction === FACTIONS.LIBERAL ? 'bg-cyan-400' : 'bg-red-500'}`}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={showBriefingNow}
                    className="mt-4 text-[10px] font-mono font-black uppercase tracking-[0.22em] text-white/40 transition-colors hover:text-white/70"
                  >
                    Skip to Briefing
                  </button>
                </div>
              </motion.div>
            )}

            {step === 'briefing' && (
              <motion.div
                key="briefing"
                initial={{ opacity: 0, y: 22, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -14, scale: 0.98 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className={`w-full rounded-[32px] border ${theme.frame} px-5 py-5 shadow-[0_28px_84px_rgba(0,0,0,0.56)] sm:px-6 sm:py-6`}
              >
                <div className="text-center">
                  <p className="text-[10px] font-mono font-black uppercase tracking-[0.3em] text-white/30">
                    Mission Dossier
                  </p>
                  <h2 className="mt-2 text-2xl font-black uppercase tracking-[0.12em] text-white">
                    {roleMeta.headline}
                  </h2>
                </div>

                <div className="mt-5 flex flex-col items-center gap-6">
                  {/* Two Identity Cards Display */}
                  <div className="flex w-full items-center justify-center gap-4">
                    <div className="flex-1 flex flex-col items-center gap-2">
                       <p className="text-[8px] font-mono font-black uppercase tracking-widest text-white/20">Secret Role</p>
                       <div className="relative aspect-[0.7] w-full max-w-[110px] overflow-hidden rounded-xl border border-white/10 bg-black/40 shadow-lg">
                          <img src={roleMeta.image} alt="" className="h-full w-full object-cover" />
                       </div>
                    </div>
                    <div className="flex-1 flex flex-col items-center gap-2">
                       <p className="text-[8px] font-mono font-black uppercase tracking-widest text-white/20">Membership</p>
                       <div className="relative aspect-[0.7] w-full max-w-[110px] overflow-hidden rounded-xl border border-white/10 bg-black/40 shadow-lg">
                          <img src={theme.partyImage} alt="" className="h-full w-full object-cover" />
                       </div>
                    </div>
                  </div>

                  <div className="w-full rounded-[24px] border border-white/8 bg-black/32 px-4 py-5 shadow-inner">
                    <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
                       <p className="text-[10px] font-mono font-black uppercase tracking-[0.24em] text-white/34">
                        {allyHeading}
                      </p>
                      <div className="flex items-center gap-1.5">
                        <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-[8px] font-mono font-bold text-green-500/80 uppercase">Active Net</span>
                      </div>
                    </div>

                    {knownPlayers.length > 0 ? (
                      <div className="grid grid-cols-1 gap-2.5">
                        {knownPlayers.map((player) => (
                          <div
                            key={player.id}
                            className={`flex items-center justify-between rounded-xl border ${theme.chip} group overflow-hidden`}
                          >
                            <div className="flex items-center gap-3">
                               <div className="relative h-12 w-12 shrink-0">
                                  <img
                                    src={`/assets/avatars/avatar_${getAvatarId(player)}.png`}
                                    alt=""
                                    className="h-full w-full object-cover transition-transform group-hover:scale-110"
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                               </div>
                               <div className="text-left">
                                  <p className="text-[12px] font-black uppercase tracking-tight text-white">{player.name}</p>
                                  <p className={`text-[8px] font-mono font-black uppercase tracking-widest ${theme.softText}`}>
                                    {player.role === ROLES.HITLER ? 'PRIMARY TARGET' : 'LOYALIST AGENT'}
                                  </p>
                               </div>
                            </div>
                            <div className="pr-4">
                               <span className={`text-[9px] font-mono font-black uppercase border border-current rounded px-2 py-0.5 ${theme.softText}`}>
                                 {player.role === ROLES.HITLER ? 'HITLER' : 'FASCIST'}
                               </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-4">
                        <p className="text-[11px] leading-relaxed text-white/32 italic px-4">
                          {allySummary}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="shrink-0 pb-2 pt-4">
          <button
            type="button"
            onClick={handleReady}
            disabled={step !== 'briefing'}
            className={`h-14 w-full rounded-2xl border text-[11px] font-black uppercase tracking-[0.24em] transition-all ${
              step === 'briefing'
                ? `${theme.button} shadow-[0_18px_34px_rgba(0,0,0,0.3)] active:scale-[0.98]`
                : 'border-white/8 bg-white/[0.04] text-white/24'
            }`}
          >
            {step === 'briefing' ? 'Got It' : 'Reveal First'}
          </button>
        </div>
      </div>
    </div>
  );
}
