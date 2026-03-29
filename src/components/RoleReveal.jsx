import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bot, Check, Users } from 'lucide-react';
import { FACTIONS, ROLES } from '../lib/constants';

const THEME = {
  liberal: {
    glow: 'rgba(70,167,255,0.2)',
    shell: 'border-cyan-300/16 bg-[linear-gradient(180deg,rgba(10,22,36,0.9)_0%,rgba(8,16,27,0.96)_100%)]',
    pill: 'border-cyan-300/18 bg-cyan-300/10 text-cyan-100',
    button: 'border-cyan-200/20 bg-[linear-gradient(180deg,#3d88cf_0%,#214e7b_100%)] text-white',
    image: '/assets/policy-liberal.png',
  },
  fascist: {
    glow: 'rgba(255,92,92,0.2)',
    shell: 'border-red-300/16 bg-[linear-gradient(180deg,rgba(34,10,12,0.9)_0%,rgba(21,8,9,0.96)_100%)]',
    pill: 'border-red-300/18 bg-red-400/10 text-red-100',
    button: 'border-red-200/20 bg-[linear-gradient(180deg,#b92c33_0%,#73141a_100%)] text-white',
    image: '/assets/policy-fascist.png',
  },
};

const ROLE_COPY = {
  [ROLES.LIBERAL]: {
    label: 'Liberal',
    description: 'Pass liberal policies and keep Hitler away from the chancellorship.',
  },
  [ROLES.FASCIST]: {
    label: 'Fascist',
    description: 'Pass fascist policies and help Hitler survive until the table gives him power.',
  },
  [ROLES.HITLER]: {
    label: 'Hitler',
    description: 'Stay concealed and let the table clear a path for your election.',
  },
};

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
          <p className="mt-6 text-[10px] font-mono font-black uppercase tracking-[0.28em] text-white/46">Ready</p>
          <p className="mx-auto mt-4 max-w-[22rem] text-sm leading-relaxed text-white/62">
            Waiting for the rest of the table to finish their reveal.
          </p>
        </div>
      </motion.div>
    </div>
  );
}

function KnownRoster({ knownPlayers, role, theme }) {
  if (!knownPlayers.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: 'easeOut', delay: 0.06 }}
      className={`relative overflow-hidden rounded-[24px] border p-4 shadow-[0_18px_44px_rgba(0,0,0,0.22)] ${theme.shell}`}
    >
      <div className="absolute inset-0 paper-grain opacity-[0.08]" />
      <div className="relative z-10">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-[14px] border border-white/10 bg-white/[0.05] text-white/82">
            <Users size={16} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-mono font-black uppercase tracking-[0.22em] text-white/44">Known To You</p>
            <p className="mt-1 text-sm font-black uppercase tracking-[0.06em] text-white">
              {role === ROLES.HITLER ? 'Fascist Team' : 'Your Allies'}
            </p>
          </div>
        </div>

        <div className="mt-3 space-y-2">
          {knownPlayers.map((player) => (
            <div
              key={player.id}
              className="flex items-center justify-between gap-3 rounded-[18px] border border-white/8 bg-black/18 px-3 py-2.5"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-black uppercase tracking-[0.05em] text-white/92">{player.name}</span>
                  {player.isBot && <Bot size={12} className="shrink-0 text-white/28" />}
                </div>
              </div>
              <span className={`shrink-0 rounded-full border px-2 py-1 text-[9px] font-mono font-black uppercase tracking-[0.16em] ${theme.pill}`}>
                {player.role === ROLES.HITLER ? 'Hitler' : 'Fascist'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export default function RoleReveal({ gameState, playerId, onReady }) {
  const myActualId = gameState?.myPlayerId || playerId;
  const me = gameState.players.find((player) => player.id === myActualId);
  const role = me?.role || ROLES.LIBERAL;
  const faction = me?.faction || (role === ROLES.LIBERAL ? FACTIONS.LIBERAL : FACTIONS.FASCIST);
  const theme = faction === FACTIONS.LIBERAL ? THEME.liberal : THEME.fascist;
  const roleMeta = ROLE_COPY[role] || ROLE_COPY[ROLES.LIBERAL];
  const [isFlipped, setIsFlipped] = useState(false);

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

      <div className="relative z-10 mx-auto flex h-full min-h-0 w-full max-w-3xl flex-col">
        <div className="shrink-0 text-center">
          <p className="text-[10px] font-mono font-black uppercase tracking-[0.26em] text-white/42">Role Reveal</p>
          <h1 className="mt-2 text-[28px] font-black uppercase tracking-[0.08em] text-white sm:text-[32px]">
            Private Card
          </h1>
          <p className="mx-auto mt-3 max-w-[24rem] text-sm leading-relaxed text-white/58">
            Tap the card to flip it. Read it, remember it, then pass the screen.
          </p>
        </div>

        <div className="mt-6 min-h-0 flex-1 overflow-y-auto pb-6 scrollbar-hide">
          <div className="mx-auto flex w-full max-w-md flex-col items-center gap-4">
            <div className="w-full [perspective:1400px]">
              <motion.button
                type="button"
                onClick={() => setIsFlipped((value) => !value)}
                initial={false}
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.58, ease: [0.22, 1, 0.36, 1] }}
                style={{ transformStyle: 'preserve-3d' }}
                className="relative mx-auto block aspect-[0.76] w-full max-w-[300px] cursor-pointer rounded-[28px] focus:outline-none"
              >
                <div
                  className="absolute inset-0 overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(13,15,19,0.98)_0%,rgba(7,9,12,0.98)_100%)] shadow-[0_28px_70px_rgba(0,0,0,0.42)] [backface-visibility:hidden]"
                >
                  <div className="absolute inset-0 paper-grain opacity-[0.08]" />
                  <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                    <p className="text-[10px] font-mono font-black uppercase tracking-[0.28em] text-white/42">Hidden Side</p>
                    <div className="mt-4 h-28 w-20 rounded-[18px] border border-white/10 bg-white/[0.04]" />
                    <p className="mt-5 text-sm font-black uppercase tracking-[0.12em] text-white/76">
                      Tap To Flip
                    </p>
                  </div>
                </div>

                <div
                  className="absolute inset-0 overflow-hidden rounded-[28px] border border-white/10 bg-black shadow-[0_28px_70px_rgba(0,0,0,0.42)] [transform:rotateY(180deg)] [backface-visibility:hidden]"
                >
                  <img
                    src={theme.image}
                    alt={roleMeta.label}
                    className="h-full w-full object-cover"
                  />
                </div>
              </motion.button>
            </div>

            {isFlipped && (
              <AnimatePresence>
                <motion.div
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  className="w-full"
                >
                  <div className={`rounded-[24px] border p-4 text-center shadow-[0_18px_44px_rgba(0,0,0,0.22)] ${theme.shell}`}>
                    <p className="text-[10px] font-mono font-black uppercase tracking-[0.22em] text-white/44">Role</p>
                    <h2 className="mt-2 text-[28px] font-black uppercase tracking-[0.06em] text-white">
                      {roleMeta.label}
                    </h2>
                    <p className="mt-3 text-sm leading-relaxed text-white/68">
                      {roleMeta.description}
                    </p>
                  </div>
                </motion.div>
              </AnimatePresence>
            )}

            {isFlipped && <KnownRoster knownPlayers={knownPlayers} role={role} theme={theme} />}
          </div>
        </div>

        <div className="shrink-0 border-t border-white/8 bg-black/12 px-1 pt-4 backdrop-blur-sm">
          <button
            type="button"
            onClick={onReady}
            disabled={!isFlipped}
            className={`flex h-14 w-full items-center justify-center rounded-[22px] border text-[11px] font-mono font-black uppercase tracking-[0.22em] shadow-[0_18px_34px_rgba(0,0,0,0.24)] transition-transform active:scale-[0.985] ${
              isFlipped ? theme.button : 'border-white/10 bg-white/[0.04] text-white/32'
            }`}
          >
            Ready For The Table
          </button>
        </div>
      </div>
    </div>
  );
}
