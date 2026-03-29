import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bot, Check, Info, Lock, Shield, Skull, Users } from 'lucide-react';
import { FACTIONS, ROLES } from '../lib/constants';

const FACTION_THEME = {
  liberal: {
    shell: 'from-[#0d1b2a] via-[#1b263b] to-[#0d1b2a]',
    glow: 'rgba(74,158,255,0.22)',
    border: 'border-blue-400/30',
    dossier: 'bg-[#1b263b] border-blue-400/40 text-blue-100',
    cardBack: 'bg-[#e0e1dd] text-[#1b263b]',
    cardFront: 'bg-[linear-gradient(135deg,#f4f8fc_0%,#dcebf8_100%)] text-[#0d1b2a]',
    accentText: 'text-blue-200',
    stamp: 'border-blue-600/40 text-blue-800/60',
    asset: '/assets/membership-liberal.png',
  },
  fascist: {
    shell: 'from-[#1a0505] via-[#2d0a0a] to-[#1a0505]',
    glow: 'rgba(255,74,74,0.22)',
    border: 'border-red-400/30',
    dossier: 'bg-[#2d0a0a] border-red-400/40 text-red-100',
    cardBack: 'bg-[#2b2d42] text-[#edf2f4]',
    cardFront: 'bg-[linear-gradient(135deg,#fff4f4_0%,#f5dede_100%)] text-[#7b1f24]',
    accentText: 'text-red-200',
    stamp: 'border-red-700/40 text-red-900/60',
    asset: '/assets/membership-fascist.png',
  },
};

const ROLE_COPY = {
  [ROLES.LIBERAL]: {
    roleLabel: 'Liberal',
    roleSummary: 'Protect the republic and find the fascists before they seize the board.',
    partyLabel: 'Liberal',
  },
  [ROLES.FASCIST]: {
    roleLabel: 'Fascist',
    roleSummary: 'Protect Hitler, bend the table, and keep your coalition hidden.',
    partyLabel: 'Fascist',
  },
  [ROLES.HITLER]: {
    roleLabel: 'Hitler',
    roleSummary: 'Stay deniable and let the table clear a path for you.',
    partyLabel: 'Fascist',
  },
};

function FlipCard({ 
  frontTitle, 
  frontDescription, 
  frontIcon: Icon, 
  backLabel, 
  isRevealed, 
  onReveal, 
  theme, 
  membershipAsset,
  delay = 0 
}) {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlip = () => {
    if (isFlipped) return;
    setIsFlipped(true);
    if (onReveal) onReveal();
  };

  return (
    <div className="perspective-1000 relative h-[180px] w-full max-w-[320px] cursor-pointer" onClick={handleFlip}>
      <motion.div
        initial={false}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.7, type: 'spring', stiffness: 260, damping: 20, delay }}
        style={{ transformStyle: 'preserve-3d' }}
        className="relative h-full w-full"
      >
        {/* Back of the Card (Visible First) */}
        <div 
          className={`absolute inset-0 flex flex-col items-center justify-center rounded-[24px] border border-white/10 ${theme.cardBack} shadow-[0_20px_40px_rgba(0,0,0,0.3)] backface-hidden`}
        >
          <div className="absolute inset-0 paper-grain opacity-[0.12]" />
          <Lock className="opacity-20" size={40} />
          <p className="mt-4 text-[10px] font-mono font-black uppercase tracking-[0.3em] opacity-40">
            {backLabel}
          </p>
          <div className="absolute inset-x-4 top-4 flex justify-between opacity-10">
            <div className="h-6 w-6 rounded-full border border-current" />
            <div className="h-6 w-6 border-b border-r border-current" />
          </div>
        </div>

        {/* Front of the Card (Hidden Back) */}
        <div 
          className={`absolute inset-0 overflow-hidden rounded-[24px] border border-white/10 ${theme.cardFront} px-6 py-6 shadow-[0_20px_40px_rgba(0,0,0,0.3)] [transform:rotateY(180deg)] backface-hidden`}
        >
          <div className="absolute inset-0 paper-grain opacity-[0.16]" />
          
          {membershipAsset && (
            <img 
              src={membershipAsset} 
              alt="" 
              className="absolute -right-8 -top-8 h-40 w-32 rotate-[12deg] object-contain opacity-[0.08] mix-blend-multiply transition-opacity hover:opacity-[0.12]"
            />
          )}

          <div className="relative z-10 flex h-full flex-col">
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <p className="text-[10px] font-mono font-black uppercase tracking-[0.24em] opacity-40">
                  Confirmed Identity
                </p>
                <h3 className="mt-2 text-3xl font-black uppercase tracking-[0.05em]">
                  {frontTitle}
                </h3>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-[14px] border border-black/10 bg-black/5">
                <Icon size={24} />
              </div>
            </div>
            
            <p className="mt-auto text-sm leading-relaxed opacity-70">
              {frontDescription}
            </p>

            <div className="mt-4 inline-flex self-start rounded-full border border-black/15 px-3 py-1 text-[9px] font-mono font-black uppercase tracking-[0.15em] opacity-50">
              Verified Dossier
            </div>
          </div>

          <div className={`absolute bottom-4 right-4 flex h-10 w-16 items-center justify-center rounded-[4px] border-2 uppercase rotate-[-12deg] font-black font-mono text-[9px] ${theme.stamp}`}>
            CLASSIFIED
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function RoleReveal({ gameState, playerId, onReady }) {
  const myActualId = gameState?.myPlayerId || playerId;
  const me = gameState.players.find((player) => player.id === myActualId);
  const knownPlayers = gameState.players.filter((candidate) => candidate.id !== myActualId && Boolean(candidate.role));

  const [dossierOpened, setDossierOpened] = useState(false);
  const [cardsRevealed, setCardsRevealed] = useState({ role: false, party: false });

  const roleMeta = ROLE_COPY[me?.role] || ROLE_COPY[ROLES.LIBERAL];
  const isLiberal = me?.faction === FACTIONS.LIBERAL || me?.role === ROLES.LIBERAL;
  const theme = isLiberal ? FACTION_THEME.liberal : FACTION_THEME.fascist;
  const roleIcon = me?.role === ROLES.HITLER ? Skull : me?.role === ROLES.FASCIST ? Skull : Shield;
  const partyIcon = roleMeta.partyLabel === 'Liberal' ? Shield : Skull;

  const bothRevealed = cardsRevealed.role && cardsRevealed.party;
  const showKnown = bothRevealed && knownPlayers.length > 0;

  if (me?.isReady) {
    return (
      <div className={`relative flex h-full min-h-0 w-full items-center justify-center overflow-hidden bg-obsidian-950 px-4 pb-[calc(var(--app-safe-bottom)+1rem)] pt-[calc(var(--app-header-offset)+16px)]`}>
        <div className="absolute inset-0 board-grid opacity-[0.04]" />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`relative z-10 w-full max-w-sm overflow-hidden rounded-[30px] border ${theme.border} bg-black/40 p-8 text-center shadow-[0_30px_90px_rgba(0,0,0,0.6)] backdrop-blur-2xl`}
        >
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 border border-white/10">
            <Check className={theme.accentText} size={32} />
          </div>
          <h2 className="mt-6 text-2xl font-black uppercase tracking-widest text-white">Identity Secured</h2>
          <p className="mt-4 text-sm leading-relaxed text-white/50 px-4">
            Awaiting remaining operatives to verify their dossiers before the mission begins.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`relative flex h-full min-h-0 w-full flex-col overflow-hidden bg-obsidian-950 px-4 pb-[calc(var(--app-safe-bottom)+1rem)] pt-[calc(var(--app-header-offset)+16px)] sm:px-6`}>
      <div className="absolute inset-0 board-grid opacity-[0.04]" />
      
      {/* Background Ambience */}
      <div 
        className="pointer-events-none absolute inset-0 blur-[120px] transition-all duration-[1500ms]"
        style={{ 
          background: dossierOpened 
            ? `radial-gradient(circle at 50% 30%, ${theme.glow} 0%, transparent 60%)`
            : 'none'
        }} 
      />

      <AnimatePresence mode="wait">
        {!dossierOpened ? (
          <motion.div
            key="closed-dossier"
            initial={{ opacity: 0, y: 40, rotateX: 20 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            exit={{ opacity: 0, scale: 1.1, y: -20, transition: { duration: 0.6 } }}
            className="flex flex-1 flex-col items-center justify-center pt-8"
          >
            <div className="text-center mb-8 max-w-[320px]">
              <p className="text-[10px] font-mono font-black uppercase tracking-[0.4em] text-white/30">
                Level 4 Clearance Required
              </p>
              <h1 className="mt-4 text-4xl font-black uppercase tracking-tighter text-white">
                Briefing <br/><span className="text-white/30">Material</span>
              </h1>
            </div>

            <motion.div
              whileHover={{ scale: 1.02, rotate: 1 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setDossierOpened(true)}
              className="relative aspect-[3/4] w-full max-w-[280px] cursor-pointer overflow-hidden rounded-[12px] border-l-[12px] border-r border-y border-white/5 bg-[linear-gradient(135deg,#343a40_0%,#212529_100%)] shadow-[20px_30px_60px_rgba(0,0,0,0.5)] transition-shadow hover:shadow-[30px_40px_70px_rgba(0,0,0,0.6)]"
            >
              <div className="absolute inset-0 leather-texture opacity-30" />
              <div className="absolute inset-0 p-8 flex flex-col items-center justify-between text-white/70">
                <div className="w-full h-px bg-white/10" />
                <div className="text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/5 backdrop-blur-sm">
                    <Lock size={24} />
                  </div>
                  <p className="text-[11px] font-mono font-black mb-1">DOSSIDER CASE</p>
                  <p className="text-[9px] opacity-40">REF: OPERATION_ECLIPSE</p>
                </div>
                <div className="w-full flex justify-between items-end">
                  <div className="h-10 w-24 border-2 border-red-900/40 rounded flex items-center justify-center rotate-[-15deg] text-red-900/60 font-black text-[12px]">
                    TOP SECRET
                  </div>
                  <Info size={18} className="opacity-30" />
                </div>
              </div>
            </motion.div>
            
            <p className="mt-12 text-center text-sm font-black uppercase tracking-widest text-white/20 animate-pulse">
              Click Folder To Open
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="open-reveal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex flex-col min-h-0 h-full"
          >
            <div className="shrink-0 text-center mb-6 pt-4">
              <p className={`text-[10px] font-mono font-black uppercase tracking-[0.3em] ${theme.accentText}`}>
                Identity Manifest
              </p>
              <h2 className="mt-1 text-xl font-black uppercase tracking-[0.05em] text-white">
                Verify Your Assets
              </h2>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto px-2 space-y-4 pb-8 flex flex-col items-center scrollbar-hide">
              <FlipCard 
                frontTitle={roleMeta.roleLabel}
                frontDescription={roleMeta.roleSummary}
                frontIcon={roleIcon}
                backLabel="Role Assignment"
                theme={theme}
                onReveal={() => setCardsRevealed(prev => ({ ...prev, role: true }))}
              />

              <FlipCard 
                frontTitle={roleMeta.partyLabel}
                frontDescription={`Your party membership is ${roleMeta.partyLabel}. You win if ${roleMeta.partyLabel === 'Liberal' ? 'Liberals' : 'Fascists'} win.`}
                frontIcon={partyIcon}
                backLabel="Party Membership"
                theme={theme}
                membershipAsset={theme.asset}
                onReveal={() => setCardsRevealed(prev => ({ ...prev, party: true }))}
                delay={0.1}
              />

              {showKnown && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full max-w-[320px] rounded-3xl border border-white/5 bg-white/5 p-6 backdrop-blur-xl"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                      <Users size={18} className={theme.accentText} />
                    </div>
                    <p className={`text-[10px] font-mono font-black uppercase tracking-widest ${theme.accentText}`}>
                      {me?.role === ROLES.HITLER ? 'Known Fascists' : 'Known Team'}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    {knownPlayers.map(p => (
                      <div key={p.id} className="flex items-center justify-between p-3 rounded-2xl bg-black/40 border border-white/5">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="truncate text-sm font-black uppercase tracking-tight text-white/90">
                            {p.name}
                          </span>
                          {p.isBot && <Bot size={12} className="text-white/20" />}
                        </div>
                        <span className={`text-[10px] font-black font-mono border border-current rounded-full px-2 py-0.5 ${theme.accentText}`}>
                          {p.role === ROLES.HITLER ? 'HITLER' : 'FASCIST'}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            <div className="mt-auto pt-6 pb-2">
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: bothRevealed ? 1 : 0.3, y: bothRevealed ? 0 : 20 }}
                disabled={!bothRevealed}
                onClick={onReady}
                whileTap={{ scale: 0.98 }}
                className={`w-full h-14 rounded-2xl font-black uppercase tracking-[0.2em] transition-all ${
                  bothRevealed 
                    ? `bg-[linear-gradient(180deg,${isLiberal ? '#24507d' : '#8e111d'} 0%,${isLiberal ? '#163552' : '#5c0b12'} 100%)] text-white shadow-lg ${theme.border}`
                    : 'bg-white/5 text-white/20 border border-white/10'
                }`}
              >
                {bothRevealed ? 'Commit Identity' : 'Reveal All Cards'}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
