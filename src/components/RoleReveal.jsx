import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bot, Check, Eye, Shield, Skull, Users } from 'lucide-react';
import { FACTIONS, ROLES } from '../lib/constants';

const FACTION_THEME = {
  liberal: {
    shell: 'from-[#081220] via-[#10233b] to-[#081220]',
    glow: 'rgba(87,169,255,0.22)',
    frame: 'border-cyan-300/18 bg-[rgba(8,17,28,0.78)]',
    card: 'border-cyan-300/18 bg-[linear-gradient(180deg,rgba(247,251,255,0.98)_0%,rgba(223,236,248,0.98)_100%)] text-[#10233b]',
    cardMuted: 'text-[#36506f]',
    badge: 'border-cyan-300/20 bg-cyan-300/10 text-cyan-100',
    soft: 'border-cyan-300/14 bg-cyan-300/10 text-cyan-100/85',
    button: 'bg-[linear-gradient(180deg,#3a82c7_0%,#214e7b_100%)] border-cyan-200/20 text-white',
    asset: '/assets/membership-liberal.png',
  },
  fascist: {
    shell: 'from-[#180607] via-[#2d0c10] to-[#160506]',
    glow: 'rgba(255,101,101,0.22)',
    frame: 'border-red-300/18 bg-[rgba(26,8,9,0.78)]',
    card: 'border-red-300/18 bg-[linear-gradient(180deg,rgba(255,247,247,0.98)_0%,rgba(249,224,224,0.98)_100%)] text-[#4b1116]',
    cardMuted: 'text-[#7a3438]',
    badge: 'border-red-300/20 bg-red-400/10 text-red-100',
    soft: 'border-red-300/14 bg-red-400/10 text-red-100/85',
    button: 'bg-[linear-gradient(180deg,#b92a31_0%,#73141a_100%)] border-red-200/20 text-white',
    asset: '/assets/membership-fascist.png',
  },
};

const ROLE_COPY = {
  [ROLES.LIBERAL]: {
    roleLabel: 'Liberal',
    roleDescription: 'Pass liberal policies and keep Hitler away from the chancellorship.',
    roleIcon: Shield,
    partyLabel: 'Liberal',
    partyDescription: 'You are on the liberal team.',
  },
  [ROLES.FASCIST]: {
    roleLabel: 'Fascist',
    roleDescription: 'Help fascist policies pass and protect Hitler until the table gives him power.',
    roleIcon: Skull,
    partyLabel: 'Fascist',
    partyDescription: 'You are on the fascist team.',
  },
  [ROLES.HITLER]: {
    roleLabel: 'Hitler',
    roleDescription: 'Stay concealed and let the table open a path for your election.',
    roleIcon: Skull,
    partyLabel: 'Fascist',
    partyDescription: 'Your party membership is fascist.',
  },
};

function IdentityCard({ eyebrow, title, description, icon: Icon, theme, assetSrc, footer }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: 'easeOut' }}
      className={`relative overflow-hidden rounded-[28px] border p-5 shadow-[0_18px_50px_rgba(0,0,0,0.24)] ${theme.card}`}
    >
      <div className="absolute inset-0 paper-grain opacity-[0.12]" />
      {assetSrc && (
        <img
          src={assetSrc}
          alt=""
          className="pointer-events-none absolute -right-8 top-3 h-36 w-28 rotate-[10deg] object-contain opacity-[0.12] mix-blend-multiply"
        />
      )}

      <div className="relative z-10 flex min-w-0 items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-mono font-black uppercase tracking-[0.24em] text-black/38">{eyebrow}</p>
          <h2 className="mt-2 break-words text-[30px] font-black uppercase tracking-[0.04em] sm:text-[34px]">
            {title}
          </h2>
        </div>
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] border border-black/10 bg-black/5">
          <Icon size={24} />
        </div>
      </div>

      <p className={`relative z-10 mt-5 text-sm leading-relaxed ${theme.cardMuted}`}>{description}</p>

      {footer && (
        <div className="relative z-10 mt-5 inline-flex rounded-full border border-black/10 bg-black/[0.04] px-3 py-1 text-[10px] font-mono font-black uppercase tracking-[0.18em] text-black/55">
          {footer}
        </div>
      )}
    </motion.div>
  );
}

function KnownTeamPanel({ knownPlayers, role, theme }) {
  if (!knownPlayers.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: 'easeOut', delay: 0.06 }}
      className={`relative overflow-hidden rounded-[28px] border p-5 shadow-[0_18px_50px_rgba(0,0,0,0.24)] ${theme.frame}`}
    >
      <div className="absolute inset-0 paper-grain opacity-[0.08]" />
      <div className="relative z-10">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-[16px] border border-white/10 bg-white/[0.05] text-white/82">
            <Users size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-mono font-black uppercase tracking-[0.22em] text-white/46">Known To You</p>
            <h3 className="mt-1 text-lg font-black uppercase tracking-[0.06em] text-white">
              {role === ROLES.HITLER ? 'Fascist Team' : 'Your Allies'}
            </h3>
          </div>
        </div>

        <div className="mt-4 space-y-2.5">
          {knownPlayers.map((player) => (
            <div
              key={player.id}
              className="flex items-center justify-between gap-3 rounded-[20px] border border-white/8 bg-black/18 px-4 py-3"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-black uppercase tracking-[0.05em] text-white/92">{player.name}</span>
                  {player.isBot && <Bot size={12} className="shrink-0 text-white/28" />}
                </div>
              </div>
              <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-mono font-black uppercase tracking-[0.18em] ${theme.soft}`}>
                {player.role === ROLES.HITLER ? 'Hitler' : 'Fascist'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function ReadyState({ theme }) {
  return (
    <div className="relative flex h-full min-h-0 w-full items-center justify-center overflow-hidden bg-obsidian-950 px-4 pb-[calc(var(--app-safe-bottom)+1rem)] pt-[calc(var(--app-header-offset)+16px)]">
      <div className="absolute inset-0 board-grid opacity-[0.04]" />
      <div
        className="pointer-events-none absolute inset-0 blur-[120px]"
        style={{ background: `radial-gradient(circle at 50% 30%, ${theme.glow} 0%, transparent 60%)` }}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className={`relative z-10 w-full max-w-md overflow-hidden rounded-[32px] border p-8 text-center shadow-[0_30px_90px_rgba(0,0,0,0.56)] backdrop-blur-2xl ${theme.frame}`}
      >
        <div className="absolute inset-0 paper-grain opacity-[0.08]" />
        <div className="relative z-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] border border-white/10 bg-white/[0.06]">
            <Check className="text-white" size={30} />
          </div>
          <p className="mt-6 text-[10px] font-mono font-black uppercase tracking-[0.28em] text-white/46">Identity Checked</p>
          <h2 className="mt-2 text-2xl font-black uppercase tracking-[0.08em] text-white">Ready</h2>
          <p className="mx-auto mt-4 max-w-[22rem] text-sm leading-relaxed text-white/62">
            Waiting for the rest of the table to finish their private reveal.
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default function RoleReveal({ gameState, playerId, onReady }) {
  const myActualId = gameState?.myPlayerId || playerId;
  const me = gameState.players.find((player) => player.id === myActualId);
  const role = me?.role || ROLES.LIBERAL;
  const faction = me?.faction || (role === ROLES.LIBERAL ? FACTIONS.LIBERAL : FACTIONS.FASCIST);
  const theme = faction === FACTIONS.LIBERAL ? FACTION_THEME.liberal : FACTION_THEME.fascist;
  const roleMeta = ROLE_COPY[role] || ROLE_COPY[ROLES.LIBERAL];
  const [isRevealed, setIsRevealed] = useState(false);

  const knownPlayers = useMemo(
    () => gameState.players.filter((candidate) => candidate.id !== myActualId && Boolean(candidate.role)),
    [gameState.players, myActualId],
  );

  if (me?.isReady) {
    return <ReadyState theme={theme} />;
  }

  const revealIdentity = () => setIsRevealed(true);
  const sleeveLabel = isRevealed ? 'Identity Open' : 'Swipe Up To Reveal';

  return (
    <div className="relative flex h-full min-h-0 w-full flex-col overflow-hidden bg-obsidian-950 px-4 pb-[calc(var(--app-safe-bottom)+1rem)] pt-[calc(var(--app-header-offset)+14px)] sm:px-6">
      <div className="absolute inset-0 board-grid opacity-[0.04]" />
      <div
        className={`pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,${theme.glow}_0%,transparent_58%)] blur-[120px] transition-opacity duration-700 ${isRevealed ? 'opacity-100' : 'opacity-70'}`}
      />

      <div className="relative z-10 mx-auto flex h-full min-h-0 w-full max-w-5xl flex-col">
        <div className="shrink-0 text-center">
          <p className="text-[10px] font-mono font-black uppercase tracking-[0.26em] text-white/42">Private Role Check</p>
          <h1 className="mt-2 text-[28px] font-black uppercase tracking-[0.08em] text-white sm:text-[34px]">
            Review Your Identity
          </h1>
          <p className="mx-auto mt-3 max-w-[28rem] text-sm leading-relaxed text-white/58">
            Open the cover, read your role and party membership, then confirm when you are done.
          </p>
        </div>

        <AnimatePresence mode="wait">
          {!isRevealed ? (
            <motion.div
              key="concealed"
              initial={{ opacity: 0, y: 26 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="flex min-h-0 flex-1 flex-col items-center justify-center py-6"
            >
              <div className="w-full max-w-[380px]">
                <div className={`relative overflow-hidden rounded-[34px] border shadow-[0_32px_90px_rgba(0,0,0,0.44)] ${theme.frame}`}>
                  <div className="absolute inset-0 paper-grain opacity-[0.08]" />
                  <div className="relative aspect-[0.78]">
                    <div className="absolute inset-x-5 top-6 space-y-3">
                      <div className="rounded-[24px] border border-white/8 bg-white/[0.04] px-4 py-4 backdrop-blur-sm">
                        <p className="text-[10px] font-mono font-black uppercase tracking-[0.2em] text-white/42">Role</p>
                        <div className="mt-3 h-10 rounded-2xl bg-white/[0.06]" />
                        <div className="mt-2 h-3 rounded-full bg-white/[0.05]" />
                      </div>
                      <div className="rounded-[24px] border border-white/8 bg-white/[0.04] px-4 py-4 backdrop-blur-sm">
                        <p className="text-[10px] font-mono font-black uppercase tracking-[0.2em] text-white/42">Party Membership</p>
                        <div className="mt-3 h-10 rounded-2xl bg-white/[0.06]" />
                        <div className="mt-2 h-3 rounded-full bg-white/[0.05]" />
                      </div>
                    </div>

                    <motion.div
                      drag="y"
                      dragConstraints={{ top: -320, bottom: 0 }}
                      dragElastic={{ top: 0.08, bottom: 0.02 }}
                      dragMomentum={false}
                      onDragEnd={(_, info) => {
                        if (info.offset.y < -120 || info.velocity.y < -700) {
                          revealIdentity();
                        }
                      }}
                      onClick={revealIdentity}
                      className="absolute inset-0 z-20 cursor-grab active:cursor-grabbing"
                    >
                      <motion.div
                        animate={{ y: 0 }}
                        transition={{ type: 'spring', stiffness: 260, damping: 28 }}
                        className="flex h-full flex-col justify-between bg-[linear-gradient(180deg,rgba(9,11,14,0.88)_0%,rgba(6,8,11,0.94)_100%)] px-6 pb-7 pt-4 backdrop-blur-[20px]"
                      >
                        <div className="flex justify-center">
                          <div className="h-1.5 w-16 rounded-full bg-white/20" />
                        </div>

                        <div className="flex flex-1 flex-col items-center justify-center text-center">
                          <div className="flex h-[72px] w-[72px] items-center justify-center rounded-[26px] border border-white/10 bg-white/[0.05] shadow-[0_18px_40px_rgba(0,0,0,0.28)]">
                            <Eye className="text-white/88" size={30} />
                          </div>
                          <p className={`mt-6 rounded-full border px-3 py-1 text-[10px] font-mono font-black uppercase tracking-[0.2em] ${theme.badge}`}>
                            {sleeveLabel}
                          </p>
                          <h2 className="mt-4 text-[30px] font-black uppercase tracking-[0.08em] text-white">
                            Keep This Private
                          </h2>
                          <p className="mt-3 max-w-[17rem] text-sm leading-relaxed text-white/62">
                            Swipe this cover upward to reveal your role card and party membership.
                          </p>
                        </div>

                        <div className="text-center">
                          <p className="text-[10px] font-mono font-black uppercase tracking-[0.2em] text-white/44">
                            Swipe Up Or Tap To Open
                          </p>
                        </div>
                      </motion.div>
                    </motion.div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="revealed"
              initial={{ opacity: 0, y: 26 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="mt-5 flex min-h-0 flex-1 flex-col"
            >
              <div className="min-h-0 flex-1 overflow-y-auto pb-6 scrollbar-hide">
                <div className="grid min-h-0 gap-4 lg:grid-cols-[minmax(0,1.12fr)_minmax(0,0.88fr)]">
                  <div className="grid gap-4">
                    <IdentityCard
                      eyebrow="Role"
                      title={roleMeta.roleLabel}
                      description={roleMeta.roleDescription}
                      icon={roleMeta.roleIcon}
                      theme={theme}
                      footer={role === ROLES.HITLER ? 'Special Role' : 'Public Goal Driven'}
                    />
                    <IdentityCard
                      eyebrow="Party Membership"
                      title={roleMeta.partyLabel}
                      description={roleMeta.partyDescription}
                      icon={roleMeta.partyLabel === 'Liberal' ? Shield : Skull}
                      theme={theme}
                      assetSrc={theme.asset}
                      footer="Win Condition Reference"
                    />
                  </div>

                  <div className="grid gap-4">
                    <motion.div
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.32, ease: 'easeOut', delay: 0.04 }}
                      className={`relative overflow-hidden rounded-[28px] border p-5 shadow-[0_18px_50px_rgba(0,0,0,0.24)] ${theme.frame}`}
                    >
                      <div className="absolute inset-0 paper-grain opacity-[0.08]" />
                      <div className="relative z-10">
                        <p className="text-[10px] font-mono font-black uppercase tracking-[0.22em] text-white/46">Before You Continue</p>
                        <h3 className="mt-2 text-lg font-black uppercase tracking-[0.06em] text-white">Read, Memorize, Pass</h3>
                        <ul className="mt-4 space-y-3 text-sm leading-relaxed text-white/68">
                          <li>Memorize only what this screen tells you.</li>
                          <li>Do not leave this view open when handing the phone over.</li>
                          <li>Confirm once you are ready for the next player.</li>
                        </ul>
                      </div>
                    </motion.div>

                    <KnownTeamPanel knownPlayers={knownPlayers} role={role} theme={theme} />
                  </div>
                </div>
              </div>

              <div className="shrink-0 border-t border-white/8 bg-black/12 px-1 pt-4 backdrop-blur-sm">
                <button
                  type="button"
                  onClick={onReady}
                  className={`flex h-14 w-full items-center justify-center rounded-[22px] border text-[11px] font-mono font-black uppercase tracking-[0.22em] shadow-[0_18px_34px_rgba(0,0,0,0.24)] transition-transform active:scale-[0.985] ${theme.button}`}
                >
                  Ready For The Table
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
