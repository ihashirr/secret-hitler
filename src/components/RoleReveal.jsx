import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bot, Check, ChevronsUp, Shield, Skull, Users } from 'lucide-react';
import { FACTIONS, ROLES } from '../lib/constants';

const FACTION_THEME = {
  liberal: {
    shell: 'from-[#08131d] via-[#0b1823] to-[#061018]',
    glow: 'rgba(84,153,214,0.18)',
    border: 'border-cyan-300/22',
    softBorder: 'border-cyan-300/18',
    surface: 'bg-[linear-gradient(180deg,#f4f8fc_0%,#dcebf8_100%)]',
    softSurface: 'bg-cyan-300/[0.08]',
    accentText: 'text-cyan-100',
    accentInk: 'text-[#214c76]',
    accentChip: 'border-cyan-300/22 bg-cyan-300/10 text-cyan-100',
    iconSurface: 'border-cyan-300/22 bg-cyan-300/10 text-cyan-100',
    shadow: 'rgba(72,133,190,0.22)',
    asset: '/assets/policy-liberal.png',
  },
  fascist: {
    shell: 'from-[#19090c] via-[#16080a] to-[#110608]',
    glow: 'rgba(193,39,45,0.18)',
    border: 'border-red-400/22',
    softBorder: 'border-red-400/18',
    surface: 'bg-[linear-gradient(180deg,#fff4f4_0%,#f5dede_100%)]',
    softSurface: 'bg-red-500/[0.08]',
    accentText: 'text-red-100',
    accentInk: 'text-[#7b1f24]',
    accentChip: 'border-red-400/22 bg-red-500/10 text-red-100',
    iconSurface: 'border-red-400/22 bg-red-500/10 text-red-100',
    shadow: 'rgba(138,31,36,0.24)',
    asset: '/assets/policy-fascist.png',
  },
};

const ROLE_COPY = {
  [ROLES.LIBERAL]: {
    roleLabel: 'Liberal',
    roleSummary: 'Protect the republic and find the fascists before they seize the board.',
    partyLabel: 'Liberal',
    partySummary: 'You win with the Liberal team.',
  },
  [ROLES.FASCIST]: {
    roleLabel: 'Fascist',
    roleSummary: 'Protect Hitler, bend the table, and keep your coalition hidden.',
    partyLabel: 'Fascist',
    partySummary: 'You win with the Fascist team.',
  },
  [ROLES.HITLER]: {
    roleLabel: 'Hitler',
    roleSummary: 'Stay deniable and let the table clear a path for you.',
    partyLabel: 'Fascist',
    partySummary: 'Your party membership is Fascist.',
  },
};

const getRevealKey = (roomId) => `revealed_${roomId}`;

function IdentityCard({
  eyebrow,
  title,
  description,
  icon: Icon,
  theme,
  badge,
  asset,
  delay = 0,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18, rotate: delay === 0 ? -1.5 : 1.5, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, rotate: 0, scale: 1 }}
      transition={{ duration: 0.42, delay, ease: 'easeOut' }}
      className={`relative overflow-hidden rounded-[28px] border ${theme.softBorder} ${theme.surface} px-5 py-5 shadow-[0_24px_50px_rgba(0,0,0,0.18)]`}
      style={{ boxShadow: `0 24px 50px rgba(0,0,0,0.18), 0 0 0 1px rgba(255,255,255,0.04), 0 14px 36px ${theme.shadow}` }}
    >
      <div className="absolute inset-0 paper-grain opacity-[0.16]" />
      <div className="absolute inset-x-0 top-0 h-1 bg-white/45" />
      <img
        src={asset}
        alt=""
        aria-hidden="true"
        loading="eager"
        decoding="async"
        className="pointer-events-none absolute -right-5 bottom-0 h-28 w-20 rotate-[-7deg] rounded-[14px] object-cover opacity-[0.13] mix-blend-multiply"
      />

      <div className="relative z-10">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-mono font-black uppercase tracking-[0.24em] text-black/42">
              {eyebrow}
            </p>
            <h3 className={`mt-3 text-3xl font-black uppercase tracking-[0.1em] ${theme.accentInk}`}>
              {title}
            </h3>
          </div>

          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] border ${theme.iconSurface}`}>
            <Icon size={22} />
          </div>
        </div>

        <p className="mt-3 max-w-[18rem] text-sm leading-relaxed text-black/62">
          {description}
        </p>

        <div className="mt-4 inline-flex rounded-full border border-black/8 bg-white/50 px-3 py-1 text-[10px] font-mono font-black uppercase tracking-[0.18em] text-black/58">
          {badge}
        </div>
      </div>
    </motion.div>
  );
}

export default function RoleReveal({ gameState, playerId, onReady }) {
  const revealKey = getRevealKey(gameState.roomId);
  const myActualId = gameState?.myPlayerId || playerId;
  const me = gameState.players.find((player) => player.id === myActualId);
  const knownPlayers = gameState.players.filter((candidate) => candidate.id !== myActualId && Boolean(candidate.role));

  const [revealed, setRevealed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem(revealKey) === 'true';
  });
  const [isDragging, setIsDragging] = useState(false);

  const roleMeta = ROLE_COPY[me?.role] || ROLE_COPY[ROLES.LIBERAL];
  const isLiberal = me?.faction === FACTIONS.LIBERAL || me?.role === ROLES.LIBERAL;
  const theme = isLiberal ? FACTION_THEME.liberal : FACTION_THEME.fascist;
  const roleIcon = me?.role === ROLES.LIBERAL ? Shield : Skull;
  const partyIcon = roleMeta.partyLabel === 'Liberal' ? Shield : Skull;
  const teamLabel = roleMeta.partyLabel === 'Liberal' ? 'Liberal Membership' : 'Fascist Membership';
  const allyTitle = me?.role === ROLES.HITLER ? 'Known Fascists' : 'Known Team';
  const showKnownPlayers = knownPlayers.length > 0;

  const handleReveal = () => {
    if (revealed) return;
    setRevealed(true);

    if (typeof window !== 'undefined') {
      sessionStorage.setItem(revealKey, 'true');
    }
  };

  const handleDragEnd = (_event, info) => {
    setIsDragging(false);

    if (info.offset.y < -110 || info.velocity.y < -650) {
      handleReveal();
    }
  };

  const sleeveLabel = useMemo(() => {
    if (revealed) return 'Reveal complete';
    if (isDragging) return 'Keep pulling up';
    return 'Swipe up to reveal';
  }, [revealed, isDragging]);

  if (me?.isReady) {
    return (
      <div className={`relative flex h-full min-h-0 w-full items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.06),transparent_34%),linear-gradient(180deg,#090b0d_0%,#111214_100%)] px-4 pb-[calc(var(--app-safe-bottom)+1rem)] pt-[calc(var(--app-header-offset)+16px)]`}>
        <div className="absolute inset-0 board-grid opacity-[0.04]" />
        <div
          className={`relative z-10 w-full max-w-sm overflow-hidden rounded-[30px] border ${theme.border} bg-[rgba(9,10,12,0.82)] px-6 py-7 shadow-[0_30px_90px_rgba(0,0,0,0.42)] backdrop-blur-xl`}
          style={{ boxShadow: `0 30px 90px rgba(0,0,0,0.42), 0 0 90px ${theme.glow}` }}
        >
          <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-[18px] border ${theme.iconSurface}`}>
            <Check size={24} />
          </div>
          <p className={`mt-5 text-center text-[10px] font-mono font-black uppercase tracking-[0.3em] ${theme.accentText}`}>
            Identity Locked
          </p>
          <h2 className="mt-3 text-center text-2xl font-black uppercase tracking-[0.08em] text-white">
            Waiting On The Table
          </h2>
          <p className="mt-3 text-center text-sm leading-relaxed text-white/58">
            Your role is set. Waiting for the rest of the players to finish their reveal.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative flex h-full min-h-0 w-full flex-col overflow-hidden bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.08),transparent_36%),linear-gradient(180deg,#090b0d_0%,#111214_100%)] px-4 pb-[calc(var(--app-safe-bottom)+0.9rem)] pt-[calc(var(--app-header-offset)+14px)] sm:px-6`}>
      <div className="absolute inset-0 board-grid opacity-[0.04]" />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[42%] blur-3xl"
        style={{ background: `radial-gradient(circle at 50% 18%, ${theme.glow} 0%, rgba(0,0,0,0) 68%)` }}
      />

      <div className="relative z-10 mx-auto w-full max-w-[380px] text-center">
        <p className={`text-[10px] font-mono font-black uppercase tracking-[0.34em] ${theme.accentText}`}>
          Private Identity
        </p>
        <p className="mt-2 text-sm leading-relaxed text-white/48">
          Reveal your two identity cards only when nobody else can see the screen.
        </p>
      </div>

      <div className="relative z-10 flex min-h-0 flex-1 items-center justify-center overflow-y-auto pb-4 pt-6 scrollbar-hide">
        <div className="relative w-full max-w-[380px]">
          <motion.div
            animate={revealed ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0.38, scale: 0.97, y: 18 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className={`relative overflow-hidden rounded-[34px] border ${theme.border} bg-[linear-gradient(180deg,rgba(9,10,12,0.9)_0%,rgba(10,12,14,0.95)_100%)] p-4 shadow-[0_34px_100px_rgba(0,0,0,0.42)]`}
            style={{ boxShadow: `0 34px 100px rgba(0,0,0,0.42), 0 0 110px ${theme.glow}` }}
          >
            <div className="absolute inset-0 paper-grain opacity-[0.08]" />
            <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${isLiberal ? 'from-cyan-300 via-cyan-400 to-blue-500' : 'from-red-400 via-red-500 to-red-700'}`} />

            <div className="relative z-10 space-y-3">
              <IdentityCard
                eyebrow="Role"
                title={roleMeta.roleLabel}
                description={roleMeta.roleSummary}
                icon={roleIcon}
                theme={theme}
                badge={me?.role === ROLES.HITLER ? 'Special Role' : 'Identity Card'}
                asset={theme.asset}
              />

              <IdentityCard
                eyebrow="Party Membership"
                title={roleMeta.partyLabel}
                description={roleMeta.partySummary}
                icon={partyIcon}
                theme={theme}
                badge={teamLabel}
                asset={theme.asset}
                delay={0.08}
              />

              {revealed && showKnownPlayers && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: 0.14, ease: 'easeOut' }}
                  className={`overflow-hidden rounded-[28px] border ${theme.softBorder} bg-white/[0.04] px-4 py-4`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-[16px] border ${theme.iconSurface}`}>
                      <Users size={18} />
                    </div>
                    <div className="min-w-0">
                      <p className={`text-[10px] font-mono font-black uppercase tracking-[0.24em] ${theme.accentText}`}>
                        {allyTitle}
                      </p>
                      <p className="mt-1 text-xs text-white/46">
                        These identities are known to you at the start.
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    {knownPlayers.map((candidate) => (
                      <div
                        key={candidate.id}
                        className="flex min-w-0 items-center justify-between gap-3 rounded-[18px] border border-white/8 bg-white/[0.04] px-3 py-3"
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="truncate text-sm font-black uppercase tracking-[0.08em] text-white">
                            {candidate.name}
                          </span>
                          {candidate.isBot && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/18 bg-amber-300/10 px-2 py-1 text-[8px] font-mono font-black uppercase tracking-[0.14em] text-amber-200">
                              <Bot size={9} />
                              Bot
                            </span>
                          )}
                        </div>

                        <span className={`shrink-0 text-[10px] font-mono font-black uppercase tracking-[0.18em] ${theme.accentText}`}>
                          {candidate.role === ROLES.HITLER ? 'Hitler' : 'Fascist'}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            <AnimatePresence>
              {!revealed && (
                <motion.div
                  key="privacy-sleeve"
                  drag="y"
                  dragDirectionLock
                  dragConstraints={{ top: -320, bottom: 0 }}
                  dragElastic={0.08}
                  onDragStart={() => setIsDragging(true)}
                  onDragEnd={handleDragEnd}
                  exit={{ y: -420, opacity: 0, transition: { duration: 0.42, ease: [0.22, 1, 0.36, 1] } }}
                  className="absolute inset-0 z-30 cursor-grab overflow-hidden rounded-[34px] active:cursor-grabbing"
                >
                  <div className={`absolute inset-0 bg-[linear-gradient(180deg,rgba(18,20,24,0.98)_0%,rgba(8,10,12,0.98)_100%)]`} />
                  <div className="absolute inset-0 paper-grain opacity-[0.08]" />
                  <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${isLiberal ? 'from-cyan-300 via-cyan-400 to-blue-500' : 'from-red-400 via-red-500 to-red-700'}`} />

                  <div className="relative flex h-full flex-col items-center justify-center px-8 text-center">
                    <motion.div
                      animate={{ y: [0, -6, 0] }}
                      transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                      className={`flex h-20 w-20 items-center justify-center rounded-[24px] border ${theme.iconSurface}`}
                    >
                      <ChevronsUp size={30} />
                    </motion.div>

                    <p className={`mt-6 text-[10px] font-mono font-black uppercase tracking-[0.34em] ${theme.accentText}`}>
                      {sleeveLabel}
                    </p>
                    <h2 className="mt-4 text-3xl font-black uppercase tracking-[0.1em] text-white">
                      Pull The Cover
                    </h2>
                    <p className="mt-3 max-w-[16rem] text-sm leading-relaxed text-white/56">
                      Swipe upward to uncover your role card and party membership card.
                    </p>

                    <div className="mt-8 h-12 w-12 rounded-full border border-white/10 bg-white/[0.04] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.02)]" />
                    <div className="mt-3 h-1.5 w-20 rounded-full bg-white/14" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>

      <div className="relative z-10 mt-auto flex shrink-0 justify-center pt-2">
        <AnimatePresence>
          {revealed && (
            <motion.button
              key="role-reveal-ready"
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              whileTap={{ scale: 0.985 }}
              onClick={onReady}
              className={`flex h-14 w-full max-w-[340px] items-center justify-center rounded-[24px] border px-5 text-[11px] font-mono font-black uppercase tracking-[0.28em] text-white shadow-[0_18px_36px_rgba(0,0,0,0.24)] ${
                isLiberal
                  ? 'border-cyan-300/26 bg-[linear-gradient(180deg,#24507d_0%,#163552_100%)]'
                  : 'border-red-400/24 bg-[linear-gradient(180deg,#8f2027_0%,#5c1117_100%)]'
              }`}
            >
              I&apos;m Ready
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
