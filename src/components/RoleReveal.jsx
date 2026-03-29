import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bot, Check, Info, Users } from 'lucide-react';
import { FACTIONS, ROLES } from '../lib/constants';

const THEME = {
  liberal: {
    glow: 'rgba(70,167,255,0.22)',
    accent: 'text-cyan-300',
    border: 'border-cyan-300/20',
    button: 'bg-[linear-gradient(180deg,#3d88cf_0%,#214e7b_100%)] border-cyan-200/25',
    image: '/assets/policy-liberal.png',
  },
  fascist: {
    glow: 'rgba(255,92,92,0.22)',
    accent: 'text-red-400',
    border: 'border-red-400/20',
    button: 'bg-[linear-gradient(180deg,#b92c33_0%,#73141a_100%)] border-red-200/25',
    image: '/assets/policy-fascist.png',
  },
};

const ROLE_META = {
  [ROLES.LIBERAL]: {
    label: 'Liberal',
    description: 'Protect the Republic. Prevent Hitler from becoming Chancellor.',
    stamp: 'LIBERAL',
    image: '/assets/role-liberal.png',
  },
  [ROLES.FASCIST]: {
    label: 'Fascist',
    description: 'Enact Fascist Policies. Help Hitler survive and rise to power.',
    stamp: 'FASCIST',
    image: '/assets/role-fascist.png',
  },
  [ROLES.HITLER]: {
    label: 'Hitler',
    description: 'Stay hidden. Let your Fascist allies clear a path to the Chancellorship.',
    stamp: 'ADOLF HITLER',
    image: '/assets/role-hitler.png',
  },
};

export default function RoleReveal({ gameState, playerId, onReady }) {
  const myActualId = gameState?.myPlayerId || playerId;
  const me = gameState.players.find((player) => player.id === myActualId);
  const role = me?.role || ROLES.LIBERAL;
  const faction = me?.faction || (role === ROLES.LIBERAL ? FACTIONS.LIBERAL : FACTIONS.FASCIST);
  const theme = faction === FACTIONS.LIBERAL ? THEME.liberal : THEME.fascist;
  const meta = ROLE_META[role] || ROLE_META[ROLES.LIBERAL];
  
  const [isFlipped, setIsFlipped] = useState(false);

  const knownPlayers = useMemo(
    () => gameState.players.filter((candidate) => candidate.id !== myActualId && Boolean(candidate.role)),
    [gameState.players, myActualId],
  );

  if (me?.isReady) {
    return (
      <div className="relative flex h-full min-h-0 w-full items-center justify-center overflow-hidden bg-obsidian-950 px-4 pb-[calc(var(--app-safe-bottom)+1rem)] pt-[calc(var(--app-header-offset)+16px)]">
        <div className="absolute inset-0 board-grid opacity-[0.04]" />
        <motion.div
           initial={{ opacity: 0, scale: 0.96 }}
           animate={{ opacity: 1, scale: 1 }}
           className={`relative z-10 w-full max-w-sm rounded-[32px] border ${theme.border} bg-black/40 p-8 text-center shadow-[0_30px_90px_rgba(0,0,0,0.6)] backdrop-blur-2xl`}
        >
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 border border-white/10 shadow-inner">
            <Check className="text-white" size={32} />
          </div>
          <h2 className="mt-6 text-2xl font-black uppercase tracking-widest text-white">Identity Logged</h2>
          <p className="mt-4 text-sm leading-relaxed text-white/40">
            Awaiting remaining operatives to confirm their dossiers before initialization.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative flex h-full min-h-0 w-full flex-col overflow-hidden bg-obsidian-950 px-4 pb-[calc(var(--app-safe-bottom)+1rem)] pt-[calc(var(--app-header-offset)+14px)] sm:px-6">
      <div className="absolute inset-0 board-grid opacity-[0.04]" />
      <div 
        className="pointer-events-none absolute inset-0 blur-[120px] transition-opacity duration-1000"
        style={{ background: `radial-gradient(circle at 50% 30%, ${theme.glow} 0%, transparent 60%)`, opacity: isFlipped ? 1 : 0.4 }} 
      />

      <div className="relative z-10 mx-auto flex h-full min-h-0 w-full max-w-5xl flex-col">
        <div className="shrink-0 text-center py-4">
          <p className="text-[10px] font-mono font-black uppercase tracking-[0.4em] text-white/30">Classified Intelligence</p>
          <h1 className="mt-2 text-2xl font-black uppercase tracking-widest text-white">Secret Identity</h1>
        </div>

        <div className="mt-4 min-h-0 flex-1 overflow-y-auto pb-6 scrollbar-hide">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start justify-items-center">
            
            {/* The Flip Card */}
            <div className={`w-full max-w-[320px] perspective-1000 ${isFlipped && knownPlayers.length > 0 ? 'lg:justify-self-end' : 'lg:col-span-2 lg:mx-auto'}`}>
              <motion.div
                onClick={() => setIsFlipped(!isFlipped)}
                initial={false}
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.65, type: 'spring', stiffness: 200, damping: 25 }}
                style={{ transformStyle: 'preserve-3d' }}
                className="relative mx-auto h-[440px] w-full cursor-pointer"
              >
                {/* BACK: Hidden Identity */}
                <div className="absolute inset-0 backface-hidden flex flex-col items-center justify-center rounded-[28px] border border-white/15 bg-[linear-gradient(135deg,#2b2d42_0%,#1a1a2e_100%)] shadow-[0_30px_80px_rgba(0,0,0,0.6)]">
                  <div className="absolute inset-0 paper-grain opacity-10" />
                  <div className="absolute inset-0 leather-texture opacity-25" />
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="h-24 w-1 bg-white/5 mb-6 rounded-full" />
                    <p className="text-[9px] font-mono font-black uppercase tracking-[0.5em] text-white/30">CONFIDENTIAL</p>
                    <div className="my-8 h-20 w-20 flex items-center justify-center rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md">
                      <div className="h-6 w-6 border-2 border-white/20 rounded-lg animate-pulse" />
                    </div>
                    <p className="text-[11px] font-black uppercase tracking-widest text-white/60">Tap To Reveal</p>
                  </div>
                </div>

                {/* FRONT: Revealed Role */}
                <div 
                  className="absolute inset-0 backface-hidden [transform:rotateY(180deg)] overflow-hidden rounded-[28px] border border-white/20 bg-[#f5f5f5] shadow-[0_30px_80px_rgba(0,0,0,0.8)]"
                >
                  <div className="absolute inset-0 paper-grain opacity-20" />
                  <img src={meta.image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-10 mix-blend-multiply transition-opacity group-hover:opacity-20" />
                  
                  <div className="absolute inset-0 p-8 flex flex-col text-[#2c2c2c]">
                    <div className="flex justify-between items-start border-b-2 border-black/10 pb-4">
                      <div className="min-w-0">
                        <p className="text-[10px] font-mono font-black uppercase tracking-[0.3em] opacity-40">
                          YOUR SECRET ROLE
                        </p>
                        <h2 className="mt-2 text-4xl font-black uppercase tracking-tight leading-none text-black">
                          {meta.label}
                        </h2>
                      </div>
                      <div className="h-10 w-10 border border-black/10 bg-black/5 rounded-xl flex items-center justify-center">
                        <Info size={18} className="text-black/30" />
                      </div>
                    </div>

                    <div className="mt-8 flex-1 flex flex-col items-center">
                       {/* Character Illustration / Icon */}
                       <div className="relative h-48 w-full flex items-center justify-center">
                          {isLiberal ? (
                            <Shield className="text-blue-900/10" size={160} strokeWidth={1} />
                          ) : (
                            <Skull className="text-red-900/10" size={160} strokeWidth={1} />
                          )}
                          <div className="absolute inset-0 flex items-center justify-center">
                             {/* Text detail / stamp placeholder */}
                             <div className="text-[120px] font-black opacity-[0.03] select-none pointer-events-none">?</div>
                          </div>
                       </div>

                      <p className="text-sm font-medium leading-relaxed text-black/60 text-center px-2">
                        {meta.description}
                      </p>
                    </div>

                    <div className="mt-auto pt-4 flex flex-col items-center">
                      <div className={`inline-block border-2 ${isLiberal ? 'border-blue-900/40 text-blue-900/60' : 'border-red-900/40 text-red-900/60'} px-6 py-1.5 rounded-sm font-black font-mono text-xl tracking-tighter rotate-[-12deg] uppercase`}>
                        {meta.stamp}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Sub-content (Known Allies) */}
            {isFlipped && knownPlayers.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="w-full max-w-[400px] lg:justify-self-start lg:mt-0"
              >
                <div className="rounded-3xl border border-white/5 bg-white/[0.04] p-6 backdrop-blur-2xl shadow-xl">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                      <Users size={20} className={theme.accent} />
                    </div>
                    <div>
                      <p className="text-[10px] font-mono font-black uppercase tracking-widest text-white/30">
                        OPERATIVE ROSTER
                      </p>
                      <p className={`text-sm font-black uppercase tracking-tight ${theme.accent}`}>
                        {me?.role === ROLES.HITLER ? 'CO-CONSPIRATORS' : 'IDENTIFIED ALLIES'}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3">
                     {knownPlayers.map(p => (
                       <div key={p.id} className="flex items-center justify-between p-4 rounded-2xl bg-black/40 border border-white/5 transition-colors hover:bg-black/60">
                         <div className="flex items-center gap-3">
                           <div className="h-8 w-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                             <div className="h-2 w-2 rounded-full bg-current" />
                           </div>
                           <span className="text-base font-black uppercase tracking-tight text-white/90">{p.name}</span>
                         </div>
                         <span className={`text-[10px] font-black font-mono border border-current rounded-lg px-3 py-1 ${theme.accent}`}>
                           {p.role === ROLES.HITLER ? 'HITLER' : 'FASCIST'}
                         </span>
                       </div>
                     ))}
                  </div>
                  
                  <p className="mt-8 text-[9px] font-mono text-white/20 uppercase tracking-[0.2em] leading-relaxed italic">
                    Exercise extreme caution. Maintain deniability at all costs.
                  </p>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        <div className="shrink-0 px-2 py-6 border-t border-white/5 mt-auto">
          <button
            onClick={onReady}
            disabled={!isFlipped}
            className={`w-full h-14 rounded-2xl font-black uppercase tracking-[0.25em] text-[11px] transition-all flex items-center justify-center gap-3 ${
              isFlipped 
                ? `${theme.button} text-white shadow-xl ${theme.border}`
                : 'bg-white/5 text-white/20 border border-white/5'
            }`}
          >
            {isFlipped ? (
              <>
                <Check size={18} />
                I Understand
              </>
            ) : (
              'Reveal Card First'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
