import { useEffect, useMemo, useState } from 'react';
import { useQuery } from 'convex/react';
import { motion } from 'framer-motion';
import { api } from '../../backend/convex/_generated/api';
import { FACTIONS, ROLES } from '../lib/constants';
import { buildGameDebrief, getDebriefTagMeta } from '../engine/debriefEngine';
import { ArrowLeft, Bot, Crown, Shield, Skull } from 'lucide-react';

const typeText = (fullText, onUpdate, delay, step = 28) => {
  const timers = [];

  for (let index = 1; index <= fullText.length; index += 1) {
    timers.push(window.setTimeout(() => onUpdate(fullText.slice(0, index)), delay + index * step));
  }

  return timers;
};

export default function GameOver({ gameState, playerId, onReplay }) {
  const myActualId = gameState?.myPlayerId || playerId;
  const me = gameState.players.find((player) => player.id === myActualId);
  const isLiberalWin = gameState.winner === FACTIONS.LIBERAL;
  const winnerTitle = isLiberalWin ? 'REPUBLIC SECURED' : 'REGIME ASCENDANT';
  const logs = useQuery(api.game.getGameLog, gameState?.roomId ? { roomId: gameState.roomId } : 'skip');
  const [typedTitle, setTypedTitle] = useState('');
  const [typedReason, setTypedReason] = useState('');
  const [revealedCount, setRevealedCount] = useState(0);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const debrief = useMemo(() => buildGameDebrief(gameState, logs || []), [gameState, logs]);

  useEffect(() => {
    const timers = [];
    const titleTimers = typeText(winnerTitle, setTypedTitle, 220, 34);
    const titleDuration = 220 + winnerTitle.length * 34;
    const reasonTimers = typeText(gameState.winReason || '', setTypedReason, titleDuration + 260, 18);
    const revealStart = titleDuration + 260 + (gameState.winReason?.length || 0) * 18 + 360;

    timers.push(...titleTimers, ...reasonTimers);

    gameState.players.forEach((_, index) => {
      timers.push(
        window.setTimeout(() => {
          setRevealedCount(index + 1);
        }, revealStart + index * 130),
      );
    });

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [gameState.players, gameState.winReason, winnerTitle]);

  return (
    <div className="relative h-full min-h-0 overflow-hidden bg-obsidian-950 px-4 pb-[calc(var(--app-safe-bottom)+1rem)] pt-[calc(var(--app-header-offset)+16px)] sm:px-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`absolute inset-0 ${
          isLiberalWin
            ? 'bg-[radial-gradient(circle_at_top,_rgba(43,92,143,0.34),_rgba(5,10,16,0.96)_58%)]'
            : 'bg-[radial-gradient(circle_at_top,_rgba(193,39,45,0.38),_rgba(15,4,5,0.98)_58%)]'
        }`}
      />
      <motion.div
        animate={{ backgroundPosition: ['0% 0%', '100% 25%', '0% 100%'] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: isLiberalWin
            ? 'linear-gradient(135deg, rgba(43,92,143,0.42), rgba(0,0,0,0) 45%, rgba(43,92,143,0.14))'
            : 'linear-gradient(135deg, rgba(193,39,45,0.48), rgba(0,0,0,0) 45%, rgba(193,39,45,0.18))',
          backgroundSize: '180% 180%',
        }}
      />
      <div className="absolute inset-0 board-grid opacity-[0.06]" />

      <div className="relative z-10 mx-auto flex h-full min-h-0 w-full max-w-md flex-col">
        <section className="shrink-0 rounded-[30px] border border-white/10 bg-black/35 px-5 py-6 text-center shadow-[0_28px_90px_rgba(0,0,0,0.42)] backdrop-blur-xl">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{
              scale: 1,
              opacity: 1,
            }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="mx-auto flex w-full flex-col items-center"
          >
            <motion.div
              animate={{
                scale: [1, 1.05, 1],
                filter: isLiberalWin
                  ? ['drop-shadow(0 0 10px rgba(103,232,249,0.35))', 'drop-shadow(0 0 28px rgba(103,232,249,0.8))', 'drop-shadow(0 0 10px rgba(103,232,249,0.35))']
                  : ['drop-shadow(0 0 10px rgba(248,113,113,0.35))', 'drop-shadow(0 0 28px rgba(248,113,113,0.8))', 'drop-shadow(0 0 10px rgba(248,113,113,0.35))'],
              }}
              transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
              className="mb-5"
            >
              {isLiberalWin ? (
                <Shield size={70} className="text-cyan-300" />
              ) : (
                <Skull size={70} className="text-red-400" />
              )}
            </motion.div>

            <h1
              className={`min-h-[3.6rem] text-3xl font-black uppercase tracking-[0.18em] sm:min-h-[4.2rem] sm:text-4xl ${
                isLiberalWin ? 'text-cyan-300' : 'text-red-400'
              }`}
            >
              {typedTitle}
              {typedTitle.length < winnerTitle.length && <span className="animate-pulse text-white/60">|</span>}
            </h1>

            <div
              className={`mt-4 w-full rounded-[22px] border px-4 py-4 text-left ${
                isLiberalWin
                  ? 'border-cyan-400/22 bg-cyan-950/25'
                  : 'border-red-500/20 bg-red-950/30'
              }`}
            >
              <p className="text-[10px] font-mono font-black uppercase tracking-[0.26em] text-white/55">
                Final Debrief
              </p>
              <p className="mt-3 min-h-[2.75rem] text-sm font-mono uppercase tracking-[0.12em] text-white/85">
                {typedReason}
                {typedReason.length < (gameState.winReason || '').length && (
                  <span className="animate-pulse text-white/45">|</span>
                )}
              </p>
            </div>

            <div className="mt-5 grid w-full grid-cols-2 gap-2">
              <button
                type="button"
                onClick={onReplay}
                className={`flex h-12 items-center justify-center gap-2 rounded-2xl text-[11px] font-mono font-black uppercase tracking-[0.18em] transition-colors ${
                  isLiberalWin
                    ? 'bg-cyan-300 text-black hover:bg-cyan-200'
                    : 'bg-red-500 text-white hover:bg-red-400'
                }`}
              >
                <ArrowLeft size={16} />
                Replay Game
              </button>
              <button
                type="button"
                onClick={() => setShowBreakdown((value) => !value)}
                className="flex h-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-[11px] font-mono font-black uppercase tracking-[0.18em] text-white/75 transition-colors hover:bg-white/[0.08]"
              >
                {showBreakdown ? 'Back To Outcome' : 'View Breakdown'}
              </button>
            </div>
          </motion.div>
        </section>

        {!showBreakdown ? (
          <section className="mt-4 min-h-0 flex-1 space-y-4 overflow-y-auto pr-1 scrollbar-hide">
            <div className="rounded-[28px] border border-white/10 bg-black/30 p-4 shadow-[0_18px_48px_rgba(0,0,0,0.32)] backdrop-blur-xl">
              <p className="text-[10px] font-mono font-black uppercase tracking-[0.24em] text-white/45">
                Final Events
              </p>
              <div className="mt-3 grid gap-2">
                {debrief.recentEvents.map((event, index) => (
                  <motion.div
                    key={`${event}-${index}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + index * 0.12 }}
                    className="rounded-[18px] border border-white/8 bg-white/[0.03] px-4 py-3 text-sm leading-relaxed text-white/72"
                  >
                    {event}
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-black/30 p-4 shadow-[0_18px_48px_rgba(0,0,0,0.32)] backdrop-blur-xl">
              <p className="text-[10px] font-mono font-black uppercase tracking-[0.24em] text-white/45">
                System Analysis
              </p>
              <div className="mt-3 grid gap-2">
                {debrief.systemAnalysis.map((note, index) => (
                  <div key={`${note}-${index}`} className="rounded-[18px] border border-white/8 bg-white/[0.03] px-4 py-3">
                    <p className="text-sm leading-relaxed text-white/65">{note}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : (
          <section className="mt-4 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pr-1 scrollbar-hide">
            <div className="rounded-[28px] border border-white/10 bg-black/30 p-4 shadow-[0_18px_48px_rgba(0,0,0,0.32)] backdrop-blur-xl">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[10px] font-mono font-black uppercase tracking-[0.24em] text-white/45">
                  Revealing Roles
                </p>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-mono font-black uppercase tracking-[0.18em] text-white/65">
                  {Math.min(revealedCount, gameState.players.length)}/{gameState.players.length}
                </span>
              </div>

              <div className="mt-3 grid gap-2">
                {gameState.players.slice(0, revealedCount).map((player, index) => {
                  const tag = getDebriefTagMeta(player, gameState, debrief.chronologicalLogs);

                  return (
                    <motion.div
                      key={player.id}
                      initial={{ opacity: 0, y: 10, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="rounded-[20px] border border-white/10 bg-black/35 px-4 py-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border ${
                                player.role === ROLES.HITLER
                                  ? 'border-red-400/30 bg-red-500/10 text-red-100'
                                  : player.role === ROLES.FASCIST
                                    ? 'border-red-400/20 bg-red-500/8 text-red-200'
                                    : 'border-cyan-400/20 bg-cyan-400/10 text-cyan-100'
                              }`}
                            >
                              {player.role === ROLES.HITLER ? (
                                <Crown size={14} />
                              ) : player.role === ROLES.FASCIST ? (
                                <Skull size={14} />
                              ) : (
                                <Shield size={14} />
                              )}
                            </span>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className={`truncate text-sm font-black uppercase tracking-[0.08em] text-white ${!player.isAlive ? 'opacity-55 line-through' : ''}`}>
                                  {player.name}
                                </p>
                                {player.isBot && (
                                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-300/20 bg-amber-400/10 px-2 py-0.5 text-[8px] font-mono font-black uppercase tracking-[0.14em] text-amber-100">
                                    <Bot size={10} />
                                    Bot
                                  </span>
                                )}
                              </div>
                              <p className="mt-1 text-[10px] font-mono uppercase tracking-[0.18em] text-white/45">
                                {player.role}
                              </p>
                            </div>
                          </div>
                        </div>

                        <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[9px] font-mono font-black uppercase tracking-[0.18em] ${tag.className}`}>
                          {tag.label}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}

                {revealedCount < gameState.players.length && (
                  <div className="rounded-[20px] border border-dashed border-white/10 bg-white/[0.02] px-4 py-4">
                    <p className="text-[10px] font-mono font-black uppercase tracking-[0.2em] text-white/45">
                      Decrypting next role...
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-black/30 p-4 shadow-[0_18px_48px_rgba(0,0,0,0.32)] backdrop-blur-xl">
              <p className="text-[10px] font-mono font-black uppercase tracking-[0.24em] text-white/45">
                Recent Match Log
              </p>
              <div className="mt-3 grid gap-2">
                {debrief.chronologicalLogs.length ? (
                  debrief.chronologicalLogs.map((entry, index) => (
                    <div key={`${entry}-${index}`} className="rounded-[18px] border border-white/8 bg-white/[0.03] px-4 py-3">
                      <p className="text-sm leading-relaxed text-white/62">{entry}</p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[18px] border border-white/8 bg-white/[0.03] px-4 py-3">
                    <p className="text-sm leading-relaxed text-white/50">
                      No extra log data was captured for the final turns.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        <div className="mt-4 shrink-0 pb-2 text-center">
          <p className="text-[11px] font-mono font-black uppercase tracking-[0.2em] text-white/35">
            {me?.isHost ? 'Host controls remain in the top bar if you want a full room reset.' : 'Replay Game returns this device to the home screen.'}
          </p>
        </div>
      </div>
    </div>
  );
}
