import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bot, Check, Eye, Shield, Skull, Users } from 'lucide-react';
import { FACTIONS, ROLES } from '../lib/constants';

const THEME = {
  liberal: {
    glow: 'rgba(70,167,255,0.22)',
    shell: 'border-cyan-300/18 bg-[linear-gradient(180deg,rgba(10,22,36,0.92)_0%,rgba(8,16,27,0.96)_100%)]',
    primaryCard: 'border-cyan-300/16 bg-[linear-gradient(180deg,rgba(249,252,255,0.98)_0%,rgba(228,239,248,0.98)_100%)] text-[#0f2238]',
    secondaryCard: 'border-cyan-300/16 bg-[linear-gradient(180deg,rgba(229,244,255,0.96)_0%,rgba(205,229,244,0.96)_100%)] text-[#12304c]',
    mutedText: 'text-[#36506f]',
    pill: 'border-cyan-300/18 bg-cyan-300/10 text-cyan-100',
    roster: 'border-cyan-300/14 bg-cyan-300/10 text-cyan-100/85',
    button: 'border-cyan-200/20 bg-[linear-gradient(180deg,#3d88cf_0%,#214e7b_100%)] text-white',
    asset: '/assets/membership-liberal.png',
  },
  fascist: {
    glow: 'rgba(255,92,92,0.22)',
    shell: 'border-red-300/18 bg-[linear-gradient(180deg,rgba(34,10,12,0.92)_0%,rgba(21,8,9,0.96)_100%)]',
    primaryCard: 'border-red-300/16 bg-[linear-gradient(180deg,rgba(255,247,247,0.98)_0%,rgba(246,226,226,0.98)_100%)] text-[#4a1116]',
    secondaryCard: 'border-red-300/16 bg-[linear-gradient(180deg,rgba(255,236,236,0.96)_0%,rgba(244,213,213,0.96)_100%)] text-[#612227]',
    mutedText: 'text-[#7d3a3f]',
    pill: 'border-red-300/18 bg-red-400/10 text-red-100',
    roster: 'border-red-300/14 bg-red-400/10 text-red-100/85',
    button: 'border-red-200/20 bg-[linear-gradient(180deg,#b92c33_0%,#73141a_100%)] text-white',
    asset: '/assets/membership-fascist.png',
  },
};

const ROLE_COPY = {
  [ROLES.LIBERAL]: {
    label: 'Liberal',
    description: 'Pass liberal policies and keep Hitler away from the chancellorship.',
    partyLabel: 'Liberal',
    partyDescription: 'Your party membership is Liberal.',
    icon: Shield,
  },
  [ROLES.FASCIST]: {
    label: 'Fascist',
    description: 'Pass fascist policies and help Hitler survive until the table gives him power.',
    partyLabel: 'Fascist',
    partyDescription: 'Your party membership is Fascist.',
    icon: Skull,
  },
  [ROLES.HITLER]: {
    label: 'Hitler',
    description: 'Stay concealed and let the table clear a path for your election.',
    partyLabel: 'Fascist',
    partyDescription: 'Your party membership is Fascist.',
    icon: Skull,
  },
};

function PrivacyGate({ onReveal }) {
  return (
    <motion.div
      key="privacy-gate"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -18 }}
      className="flex min-h-0 flex-1 items-center justify-center py-6"
    >
      <div className="relative w-full max-w-md">
        <div className="absolute inset-x-6 top-5 h-full rounded-[34px] border border-white/6 bg-white/[0.03]" />
        <div className="absolute inset-x-3 top-2 h-full rounded-[34px] border border-white/8 bg-white/[0.04]" />

        <div className="relative overflow-hidden rounded-[34px] border border-white/10 bg-[linear-gradient(180deg,rgba(13,15,19,0.96)_0%,rgba(7,9,12,0.98)_100%)] px-6 pb-7 pt-6 shadow-[0_34px_90px_rgba(0,0,0,0.48)]">
          <div className="absolute inset-0 paper-grain opacity-[0.08]" />
          <div className="relative z-10 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] border border-white/10 bg-white/[0.05]">
              <Eye className="text-white/85" size={28} />
            </div>
            <p className="mt-5 text-[10px] font-mono font-black uppercase tracking-[0.28em] text-white/42">
              Private Identity Check
            </p>
            <h1 className="mt-2 text-[32px] font-black uppercase tracking-[0.08em] text-white">
              Reveal Your Cards
            </h1>
            <p className="mx-auto mt-4 max-w-[19rem] text-sm leading-relaxed text-white/62">
              Make sure only you can see this screen, then open your role card and party membership.
            </p>

            <div className="mt-8 rounded-[28px] border border-white/8 bg-white/[0.04] p-4">
              <div className="grid gap-3">
                <div className="rounded-[22px] border border-white/8 bg-white/[0.04] px-4 py-4">
                  <p className="text-[10px] font-mono font-black uppercase tracking-[0.2em] text-white/38">Role Card</p>
                  <div className="mt-3 h-10 rounded-2xl bg-white/[0.06]" />
                </div>
                <div className="rounded-[22px] border border-white/8 bg-white/[0.04] px-4 py-4">
                  <p className="text-[10px] font-mono font-black uppercase tracking-[0.2em] text-white/38">Party Membership</p>
                  <div className="mt-3 h-10 rounded-2xl bg-white/[0.06]" />
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onReveal}
              className="mt-8 flex h-14 w-full items-center justify-center rounded-[22px] border border-white/10 bg-white text-[11px] font-mono font-black uppercase tracking-[0.24em] text-[#11161c] shadow-[0_18px_34px_rgba(255,255,255,0.08)] transition-transform active:scale-[0.985]"
            >
              Open Identity
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function IdentityCard({ className, themeClassName, eyebrow, title, description, icon: Icon, assetSrc, footer }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: 'easeOut' }}
      className={`relative overflow-hidden rounded-[30px] border px-5 py-5 shadow-[0_22px_54px_rgba(0,0,0,0.26)] ${themeClassName} ${className || ''}`}
    >
      <div className="absolute inset-0 paper-grain opacity-[0.12]" />
      {assetSrc && (
        <img
          src={assetSrc}
          alt=""
          className="pointer-events-none absolute -right-8 top-3 h-40 w-28 rotate-[10deg] object-contain opacity-[0.12] mix-blend-multiply"
        />
      )}

      <div className="relative z-10 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-mono font-black uppercase tracking-[0.24em] text-black/38">{eyebrow}</p>
          <h2 className="mt-2 break-words text-[32px] font-black uppercase tracking-[0.04em] sm:text-[36px]">
            {title}
          </h2>
        </div>
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] border border-black/10 bg-black/5">
          <Icon size={24} />
        </div>
      </div>

      <p className="relative z-10 mt-5 text-sm leading-relaxed text-black/65">{description}</p>

      {footer && (
        <div className="relative z-10 mt-5 inline-flex rounded-full border border-black/10 bg-black/[0.04] px-3 py-1 text-[10px] font-mono font-black uppercase tracking-[0.18em] text-black/52">
          {footer}
        </div>
      )}
    </motion.div>
  );
}

function KnownRoster({ knownPlayers, role, theme }) {
  if (!knownPlayers.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 26 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.34, ease: 'easeOut', delay: 0.08 }}
      className={`relative overflow-hidden rounded-[28px] border p-5 shadow-[0_18px_44px_rgba(0,0,0,0.2)] ${theme.shell}`}
    >
      <div className="absolute inset-0 paper-grain opacity-[0.08]" />
      <div className="relative z-10">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-[16px] border border-white/10 bg-white/[0.05] text-white/82">
            <Users size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-mono font-black uppercase tracking-[0.22em] text-white/44">Known To You</p>
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
              <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-mono font-black uppercase tracking-[0.18em] ${theme.roster}`}>
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
        className={`relative z-10 w-full max-w-md overflow-hidden rounded-[32px] border p-8 text-center shadow-[0_30px_90px_rgba(0,0,0,0.56)] backdrop-blur-2xl ${theme.shell}`}
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
  const theme = faction === FACTIONS.LIBERAL ? THEME.liberal : THEME.fascist;
  const roleMeta = ROLE_COPY[role] || ROLE_COPY[ROLES.LIBERAL];
  const [isRevealed, setIsRevealed] = useState(false);

  const knownPlayers = useMemo(
    () => gameState.players.filter((candidate) => candidate.id !== myActualId && Boolean(candidate.role)),
    [gameState.players, myActualId],
  );

  if (me?.isReady) {
    return <ReadyState theme={theme} />;
  }

  return (
    <div className="relative flex h-full min-h-0 w-full flex-col overflow-hidden bg-obsidian-950 px-4 pb-[calc(var(--app-safe-bottom)+1rem)] pt-[calc(var(--app-header-offset)+14px)] sm:px-6">
      <div className="absolute inset-0 board-grid opacity-[0.04]" />
      <div
        className="pointer-events-none absolute inset-0 blur-[120px]"
        style={{ background: `radial-gradient(circle at 50% 18%, ${theme.glow} 0%, transparent 58%)` }}
      />

      <div className="relative z-10 mx-auto flex h-full min-h-0 w-full max-w-5xl flex-col">
        <div className="shrink-0 text-center">
          <p className="text-[10px] font-mono font-black uppercase tracking-[0.26em] text-white/42">Role Reveal</p>
          <h1 className="mt-2 text-[30px] font-black uppercase tracking-[0.08em] text-white sm:text-[34px]">
            Private Identity
          </h1>
          <p className="mx-auto mt-3 max-w-[28rem] text-sm leading-relaxed text-white/58">
            Review your two cards, remember them, then confirm when you are done.
          </p>
        </div>

        <AnimatePresence mode="wait">
          {!isRevealed ? (
            <PrivacyGate onReveal={() => setIsRevealed(true)} />
          ) : (
            <motion.div
              key="identity-stack"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="mt-5 flex min-h-0 flex-1 flex-col"
            >
              <div className="min-h-0 flex-1 overflow-y-auto pb-6 scrollbar-hide">
                <div className="mx-auto flex w-full max-w-xl flex-col gap-4">
                  <div className="relative pt-5">
                    <div className="absolute inset-x-5 top-0 h-full rounded-[30px] border border-black/5 bg-black/[0.03]" />
                    <IdentityCard
                      themeClassName={theme.primaryCard}
                      eyebrow="Role"
                      title={roleMeta.label}
                      description={roleMeta.description}
                      icon={roleMeta.icon}
                      footer={role === ROLES.HITLER ? 'Special Role' : 'Role Card'}
                      className="relative z-20"
                    />
                    <IdentityCard
                      themeClassName={theme.secondaryCard}
                      eyebrow="Party Membership"
                      title={roleMeta.partyLabel}
                      description={roleMeta.partyDescription}
                      icon={roleMeta.partyLabel === 'Liberal' ? Shield : Skull}
                      assetSrc={theme.asset}
                      footer="Membership Card"
                      className="relative z-10 -mt-7 ml-auto w-[88%]"
                    />
                  </div>

                  <motion.div
                    initial={{ opacity: 0, y: 26 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.34, ease: 'easeOut', delay: 0.06 }}
                    className={`relative overflow-hidden rounded-[28px] border p-5 shadow-[0_18px_44px_rgba(0,0,0,0.2)] ${theme.shell}`}
                  >
                    <div className="absolute inset-0 paper-grain opacity-[0.08]" />
                    <div className="relative z-10">
                      <p className="text-[10px] font-mono font-black uppercase tracking-[0.22em] text-white/44">Before You Pass The Phone</p>
                      <h3 className="mt-2 text-lg font-black uppercase tracking-[0.06em] text-white">Memorize And Close</h3>
                      <p className="mt-3 text-sm leading-relaxed text-white/66">
                        Keep only these cards in mind. Once you are done, confirm and hand the screen over.
                      </p>
                    </div>
                  </motion.div>

                  <KnownRoster knownPlayers={knownPlayers} role={role} theme={theme} />
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
