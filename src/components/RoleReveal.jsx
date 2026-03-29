import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ROLES, FACTIONS } from '../lib/constants';
import { Bot, Eye, EyeOff, Shield, Skull } from 'lucide-react';

const REVEAL_STATES = {
  IDLE: 'IDLE',
  AUTH_TAP: 'AUTH_TAP',
  DECRYPTING: 'DECRYPTING',
  DETAILS: 'DETAILS',
  OPERATIVES: 'OPERATIVES',
  CONFIRMED: 'CONFIRMED',
};

const FACTION_THEME = {
  liberal: {
    accentBar: 'from-[#7fc8ff] via-[#4d93d1] to-[#2b5c8f]',
    accentText: 'text-[#2b5c8f]',
    badgeClass: 'border-[#8abbe7]/45 bg-[#eff7fd] text-[#2b5c8f]',
    iconFrameClass: 'border-[#9fc8ec]/55 bg-[#edf6ff] text-[#2b5c8f]',
    directiveClass: 'border-[#c4d9ec] bg-[#eef5fb] text-[#3b4956]',
    allyClass: 'border-[#bfd6ea] bg-[#f2f7fc]',
    roleSummary: 'Liberal bloc',
    glow: 'rgba(72, 133, 190, 0.16)',
  },
  fascist: {
    accentBar: 'from-[#f28d8d] via-[#d54b4b] to-[#8a1f24]',
    accentText: 'text-[#8a1f24]',
    badgeClass: 'border-[#d9a3a6]/45 bg-[#fbefef] text-[#8a1f24]',
    iconFrameClass: 'border-[#dfb4b6]/55 bg-[#fff1f1] text-[#8a1f24]',
    directiveClass: 'border-[#e5c3c4] bg-[#fbefef] text-[#5a3c3e]',
    allyClass: 'border-[#e4c2c3] bg-[#fcf1f1]',
    roleSummary: 'Fascist bloc',
    glow: 'rgba(138, 31, 36, 0.16)',
  },
};

function DecryptText({ text, isRevealing, isBlurred, className, hiddenClassName }) {
  if (isBlurred) {
    return <span className={hiddenClassName}>REDACTED</span>;
  }

  return (
    <span className="flex flex-wrap items-center justify-center gap-[2px]">
      {text.split('').map((char, index) => (
        <motion.span
          key={`${index}-${char}`}
          initial={isRevealing ? { opacity: 0, y: 5, filter: 'blur(4px)' } : { opacity: 1, y: 0, filter: 'blur(0px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.12, delay: isRevealing ? index * 0.045 : 0 }}
          className={className}
        >
          {char}
        </motion.span>
      ))}
    </span>
  );
}

export default function RoleReveal({ gameState, playerId, onReady }) {
  const [state, setState] = useState(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem(`revealed_${gameState.roomId}`)) {
      return REVEAL_STATES.CONFIRMED;
    }
    return REVEAL_STATES.IDLE;
  });

  const [privacyMode, setPrivacyMode] = useState(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem(`revealed_${gameState.roomId}`)) {
      return true;
    }
    return false;
  });

  const myActualId = gameState?.myPlayerId || playerId;
  const me = gameState.players.find((player) => player.id === myActualId);
  const visibleTeammates = gameState.players.filter((candidate) => candidate.id !== myActualId && Boolean(candidate.role));
  const roleTitle =
    me?.role === ROLES.LIBERAL ? 'Liberal' : me?.role === ROLES.FASCIST ? 'Fascist' : me?.role === ROLES.HITLER ? 'Hitler' : 'Unknown';
  const directiveText =
    me?.role === ROLES.LIBERAL
      ? 'Protect the republic. Build trust carefully, secure five liberal policies, or eliminate Hitler before he reaches office.'
      : me?.role === ROLES.HITLER
        ? 'Stay deniable. Let the room fracture, survive suspicion, and reach the chancellorship after three fascist policies.'
        : 'Protect Hitler, distort trust, and guide the table toward a fascist victory without exposing the bloc too early.';
  const isFactionLiberal = me?.faction === FACTIONS.LIBERAL || me?.role === ROLES.LIBERAL;
  const theme = isFactionLiberal ? FACTION_THEME.liberal : FACTION_THEME.fascist;

  useEffect(() => {
    const timers = [];

    if (state === REVEAL_STATES.AUTH_TAP) {
      timers.push(window.setTimeout(() => setState(REVEAL_STATES.DECRYPTING), 170));
    } else if (state === REVEAL_STATES.DECRYPTING) {
      timers.push(window.setTimeout(() => setState(REVEAL_STATES.DETAILS), roleTitle.length * 44 + 420));
    } else if (state === REVEAL_STATES.DETAILS) {
      timers.push(window.setTimeout(() => setState(REVEAL_STATES.OPERATIVES), 320));
    } else if (state === REVEAL_STATES.OPERATIVES) {
      timers.push(window.setTimeout(() => setState(REVEAL_STATES.CONFIRMED), visibleTeammates.length * 55 + 260));
    } else if (state === REVEAL_STATES.CONFIRMED && typeof window !== 'undefined') {
      sessionStorage.setItem(`revealed_${gameState.roomId}`, 'true');
    }

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [state, roleTitle.length, visibleTeammates.length, gameState.roomId]);

  const handleAuthTap = () => {
    if (state === REVEAL_STATES.IDLE) setState(REVEAL_STATES.AUTH_TAP);
  };

  if (me?.isReady) {
    return (
      <div className="relative flex h-full min-h-0 w-full items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_center,rgba(222,201,159,0.09),transparent_38%),linear-gradient(180deg,#090b0d_0%,#111111_100%)] px-4 pb-[calc(var(--app-safe-bottom)+1rem)] pt-[calc(var(--app-header-offset)+16px)] text-center">
        <div className="absolute inset-0 board-grid opacity-[0.04]" />
        <div className="relative z-10 w-full max-w-sm rounded-[32px] border border-[#d8c7a7]/16 bg-[rgba(15,16,18,0.76)] px-6 py-7 shadow-[0_28px_90px_rgba(0,0,0,0.45)] backdrop-blur-xl">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-[18px] border border-[#d8c7a7]/22 bg-[#e8d7b7]/8">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#d8c7a7]/25 border-t-[#f1dfb9]" />
          </div>
          <p className="text-[10px] font-mono font-black uppercase tracking-[0.34em] text-[#e6d7ba]/66">
            Briefing Complete
          </p>
          <h2 className="mt-3 text-2xl font-serif font-black uppercase tracking-[0.08em] text-[#f4ead8]">
            Waiting On The Table
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-white/52">
            Your packet is sealed again. Waiting for the rest of the table to finish the briefing.
          </p>
        </div>
      </div>
    );
  }

  const showContent = state !== REVEAL_STATES.IDLE && state !== REVEAL_STATES.AUTH_TAP;
  const showDirective = state === REVEAL_STATES.DETAILS || state === REVEAL_STATES.OPERATIVES || state === REVEAL_STATES.CONFIRMED;
  const showAllies = (state === REVEAL_STATES.OPERATIVES || state === REVEAL_STATES.CONFIRMED) && visibleTeammates.length > 0;
  const showPrivacyToggle = state === REVEAL_STATES.OPERATIVES || state === REVEAL_STATES.CONFIRMED;
  const dossierOffsetY =
    state === REVEAL_STATES.IDLE
      ? 102
      : state === REVEAL_STATES.AUTH_TAP
        ? 76
        : state === REVEAL_STATES.DECRYPTING
          ? 36
          : state === REVEAL_STATES.DETAILS
            ? 10
            : 0;
  const dossierOpacity = state === REVEAL_STATES.IDLE ? 0.2 : state === REVEAL_STATES.AUTH_TAP ? 0.62 : 1;
  const flapRotation = state === REVEAL_STATES.IDLE ? 0 : state === REVEAL_STATES.AUTH_TAP ? -20 : -168;
  const sealVisible = state === REVEAL_STATES.IDLE || state === REVEAL_STATES.AUTH_TAP;
  const promptLabel =
    state === REVEAL_STATES.AUTH_TAP ? 'Unsealing packet' : showContent ? 'Role dossier opened' : 'Tap to open packet';

  return (
    <div className="relative flex h-full min-h-0 w-full flex-col overflow-hidden bg-[radial-gradient(circle_at_center,rgba(222,201,159,0.1),transparent_38%),linear-gradient(180deg,#090b0d_0%,#111111_100%)] px-4 pb-[calc(var(--app-safe-bottom)+0.75rem)] pt-[calc(var(--app-header-offset)+14px)] sm:px-6">
      <div className="absolute inset-0 board-grid opacity-[0.04]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(231,212,176,0.1),transparent_36%)]" />

      <motion.div
        animate={{ opacity: showContent ? 0.4 : 1 }}
        className="relative z-10 mx-auto mb-6 w-full max-w-md text-center"
      >
        <p className="text-[10px] font-mono font-black uppercase tracking-[0.34em] text-[#e6d7ba]/66">
          Classified Delivery
        </p>
        <p className="mt-2 text-xs leading-relaxed text-white/44">
          Open only when nobody else can see your screen.
        </p>
      </motion.div>

      <div className="relative z-10 flex min-h-0 w-full flex-1 items-center justify-center overflow-y-auto pb-4 scrollbar-hide">
        <div
          className="group relative w-full max-w-[340px] pb-[170px] pt-5"
          onClick={state === REVEAL_STATES.IDLE ? handleAuthTap : undefined}
          style={state === REVEAL_STATES.IDLE ? { cursor: 'pointer' } : undefined}
        >
          <motion.div
            animate={{ opacity: state === REVEAL_STATES.IDLE ? 0.55 : 0.2, scale: state === REVEAL_STATES.AUTH_TAP ? 1.04 : 1 }}
            transition={{ duration: 0.35 }}
            className="pointer-events-none absolute inset-x-6 top-10 z-0 h-[260px] rounded-[40px] blur-3xl"
            style={{ background: `radial-gradient(circle, ${theme.glow} 0%, rgba(0,0,0,0) 70%)` }}
          />

          <AnimatePresence>
            {(state === REVEAL_STATES.IDLE || state === REVEAL_STATES.AUTH_TAP) && (
              <motion.div
                key="packet-prompt"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="pointer-events-none absolute inset-x-0 top-0 z-40 text-center"
              >
                <div className="inline-flex rounded-full border border-[#dcc7a0]/18 bg-[rgba(15,16,18,0.74)] px-4 py-2 text-[10px] font-mono font-black uppercase tracking-[0.26em] text-[#eadab8]/72 backdrop-blur-sm">
                  {promptLabel}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            animate={{
              y: dossierOffsetY,
              opacity: dossierOpacity,
              rotate: state === REVEAL_STATES.IDLE ? -1.8 : state === REVEAL_STATES.AUTH_TAP ? -0.8 : 0,
              scale: state === REVEAL_STATES.AUTH_TAP ? 0.985 : 1,
            }}
            transition={{ type: 'spring', stiffness: 170, damping: 24 }}
            className="relative z-20 mx-auto w-full max-w-[306px] sm:max-w-[320px]"
          >
            <div className="relative min-h-[395px] overflow-hidden rounded-[30px] border border-[#d9c6a3] bg-[linear-gradient(180deg,#f5ecd9_0%,#eadcc2_100%)] shadow-[0_36px_90px_rgba(0,0,0,0.35)]">
              <div className="absolute inset-0 paper-grain opacity-[0.18]" />
              <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${theme.accentBar}`} />
              <div className="absolute -right-14 top-24 rotate-90 text-[56px] font-black uppercase tracking-[0.24em] text-black/5">
                Eclipse
              </div>
              <div className="relative z-10 flex min-h-[395px] flex-col px-5 pb-5 pt-5 sm:px-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[8px] font-mono font-black uppercase tracking-[0.34em] text-[#6e604f]/58">
                      Role Dossier
                    </p>
                    <p className="mt-1 text-[11px] font-serif italic text-[#6d5a42]/78">
                      Personal eyes only
                    </p>
                  </div>

                  {showPrivacyToggle && (
                    <motion.button
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      onClick={() => setPrivacyMode((value) => !value)}
                      className="rounded-2xl border border-[#d9c6a3] bg-white/45 p-2 text-[#6a5a47] transition-colors hover:bg-white/70 hover:text-[#352b1f]"
                    >
                      {privacyMode ? <EyeOff size={16} /> : <Eye size={16} />}
                    </motion.button>
                  )}
                </div>

                <div className="mt-6 flex items-center justify-between gap-4">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] border ${theme.iconFrameClass}`}>
                    {isFactionLiberal ? <Shield size={22} /> : <Skull size={22} />}
                  </div>
                  <div className={`rounded-full border px-3 py-1 text-[9px] font-mono font-black uppercase tracking-[0.2em] ${theme.badgeClass}`}>
                    {theme.roleSummary}
                  </div>
                </div>

                <div className="mt-6">
                  <p className="text-[9px] font-mono font-black uppercase tracking-[0.24em] text-[#6e604f]/54">
                    Assigned Role
                  </p>
                  <div className="mt-3 min-h-[56px]">
                    <DecryptText
                      text={roleTitle}
                      isRevealing={state === REVEAL_STATES.DECRYPTING}
                      isBlurred={privacyMode}
                      className="inline-block text-4xl font-serif font-black uppercase tracking-[0.14em] text-[#231a12] sm:text-5xl"
                      hiddenClassName="inline-block text-3xl font-serif font-black uppercase tracking-[0.18em] text-[#5f5244]/45 sm:text-4xl"
                    />
                  </div>
                  <p className={`mt-2 text-[11px] font-mono font-black uppercase tracking-[0.18em] ${theme.accentText}`}>
                    {me?.role === ROLES.HITLER ? 'Critical asset' : theme.roleSummary}
                  </p>
                </div>

                {privacyMode ? (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 flex flex-1 flex-col items-center justify-center rounded-[24px] border border-[#d8c7a8] bg-[rgba(245,236,217,0.78)] px-6 py-8 text-center"
                  >
                    <p className="text-[9px] font-mono font-black uppercase tracking-[0.24em] text-[#6c5b44]/56">
                      Screen Shield Active
                    </p>
                    <p className="mt-3 text-sm leading-relaxed text-[#4e4336]">
                      Tap the eye icon when you are ready to view the directive again.
                    </p>
                  </motion.div>
                ) : (
                  <>
                    {showDirective ? (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`mt-6 rounded-[24px] border px-4 py-4 ${theme.directiveClass}`}
                      >
                        <p className="text-[9px] font-mono font-black uppercase tracking-[0.24em] text-[#6b5b47]/56">
                          Directive
                        </p>
                        <p className="mt-3 text-sm leading-relaxed">{directiveText}</p>
                      </motion.div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0.6 }}
                        animate={{ opacity: [0.45, 0.8, 0.45] }}
                        transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
                        className="mt-6 rounded-[24px] border border-dashed border-[#d8c7a8] bg-[rgba(245,236,217,0.55)] px-4 py-8 text-center"
                      >
                        <p className="text-[9px] font-mono font-black uppercase tracking-[0.26em] text-[#6c5b44]/56">
                          Decrypting Packet
                        </p>
                      </motion.div>
                    )}

                    {showAllies && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4"
                      >
                        <p className="text-[9px] font-mono font-black uppercase tracking-[0.24em] text-[#6e604f]/54">
                          Known Allies
                        </p>
                        <div className="mt-2 space-y-2">
                          {visibleTeammates.map((teammate, index) => (
                            <motion.div
                              key={teammate.id}
                              initial={{ opacity: 0, x: -12 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className={`rounded-[18px] border px-3 py-3 ${theme.allyClass}`}
                            >
                              <div className="flex flex-col gap-2 min-[360px]:flex-row min-[360px]:items-center min-[360px]:justify-between">
                                <div className="flex min-w-0 items-center gap-2">
                                  <span className="truncate text-sm font-black uppercase tracking-[0.08em] text-[#201911]">
                                    {teammate.name}
                                  </span>
                                  {teammate.isBot && (
                                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/25 bg-amber-300/25 px-1.5 py-0.5 text-[8px] font-mono font-black uppercase tracking-[0.14em] text-[#7b5412]">
                                      <Bot size={9} />
                                      Bot
                                    </span>
                                  )}
                                </div>
                                <span className={`text-[10px] font-mono font-black uppercase tracking-[0.18em] ${theme.accentText}`}>
                                  {teammate.role === ROLES.HITLER ? 'Hitler' : 'Fascist'}
                                </span>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </>
                )}
              </div>
            </div>
          </motion.div>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 h-[156px]">
            <motion.div
              animate={{ rotateX: flapRotation, y: state === REVEAL_STATES.AUTH_TAP ? -3 : 0 }}
              transition={{ type: 'spring', stiffness: 180, damping: 24 }}
              className="absolute left-1/2 top-0 h-[84px] w-[90%] -translate-x-1/2 [clip-path:polygon(0_100%,50%_0,100%_100%)] border border-[#d7bf90] bg-[linear-gradient(180deg,#eeddb8_0%,#d9bb86_100%)] shadow-[0_16px_30px_rgba(0,0,0,0.2)]"
              style={{
                transformOrigin: 'top center',
                transformStyle: 'preserve-3d',
                backfaceVisibility: 'hidden',
              }}
            >
              <div className="absolute inset-0 paper-grain opacity-[0.18]" />
            </motion.div>

            <div className="absolute inset-x-2 bottom-0 h-[132px] rounded-[30px] border border-[#c6a975] bg-[linear-gradient(180deg,#e7d0a6_0%,#cba670_100%)] shadow-[0_24px_44px_rgba(0,0,0,0.22)]">
              <div className="absolute inset-0 overflow-hidden rounded-[30px] paper-grain opacity-[0.2]" />
              <div className="absolute inset-x-0 top-0 h-full bg-[linear-gradient(135deg,rgba(255,255,255,0.26)_0%,rgba(255,255,255,0)_34%,rgba(0,0,0,0.08)_100%)]" />
              <div className="absolute inset-x-0 top-0 h-full [clip-path:polygon(0_0,50%_56%,100%_0,100%_100%,0_100%)] bg-[linear-gradient(180deg,rgba(255,255,255,0.14)_0%,rgba(0,0,0,0.08)_100%)] opacity-85" />
              <div className="absolute inset-x-5 bottom-5 flex items-center justify-between text-[8px] font-mono font-black uppercase tracking-[0.22em] text-[#5d4522]/72">
                <span>Classified Mail</span>
                <span>Eclipse</span>
              </div>
            </div>

            <AnimatePresence>
              {sealVisible && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.75 }}
                  animate={{
                    opacity: state === REVEAL_STATES.AUTH_TAP ? [1, 0.55, 0] : 1,
                    scale: state === REVEAL_STATES.AUTH_TAP ? [1, 1.08, 0.82] : 1,
                    y: state === REVEAL_STATES.AUTH_TAP ? [0, 5, 14] : 0,
                  }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: state === REVEAL_STATES.AUTH_TAP ? 0.3 : 0.2, ease: 'easeOut' }}
                  className="absolute left-1/2 top-[52px] flex h-12 w-12 -translate-x-1/2 items-center justify-center rounded-full border border-[#7d2430]/36 bg-[radial-gradient(circle_at_30%_30%,#f27784_0%,#9a1f31_68%)] shadow-[0_10px_24px_rgba(0,0,0,0.22)]"
                >
                  <span className="text-[8px] font-mono font-black uppercase tracking-[0.18em] text-white/90">
                    Seal
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="relative z-10 mt-auto flex shrink-0 justify-center pb-2 pt-2">
        <AnimatePresence>
          {state === REVEAL_STATES.CONFIRMED && (
            <motion.button
              key="acknowledge-briefing"
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              whileTap={{ scale: 0.985 }}
              onClick={onReady}
              className="flex h-14 w-full max-w-[320px] items-center justify-center rounded-[24px] border border-[#d8c39e] bg-[linear-gradient(180deg,#f0dfbe_0%,#dfc292_100%)] px-5 text-[11px] font-mono font-black uppercase tracking-[0.28em] text-[#261b10] shadow-[0_18px_36px_rgba(0,0,0,0.22)] transition-transform"
            >
              Acknowledge Briefing
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
