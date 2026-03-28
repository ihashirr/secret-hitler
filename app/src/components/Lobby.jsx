import { useEffect, useState } from 'react';
import { Check, Copy, Crown, Share2, Users } from 'lucide-react';

const getStableNumber = (seed, min, max) => {
  let hash = 0;

  for (const char of seed) {
    hash = (hash * 31 + char.charCodeAt(0)) % 100000;
  }

  return min + (hash % (max - min + 1));
};

const getAvatarId = (player) => {
  if (player.avatarId) return player.avatarId;
  return getStableNumber(player.id || player.name || 'operative', 1, 10);
};

const copyText = async (value) => {
  if (navigator.clipboard) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textArea = document.createElement('textarea');
  textArea.value = value;
  textArea.style.position = 'fixed';
  textArea.style.left = '-9999px';
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  document.execCommand('copy');
  document.body.removeChild(textArea);
};

export default function Lobby({ gameState, playerId, onStart, onAddBot }) {
  const me = gameState.players.find((player) => player.id === playerId);
  const isHost = me?.isHost;
  const [copyState, setCopyState] = useState(null);

  const playerCount = gameState.players.length;
  const canStart = playerCount >= 5 && playerCount <= 10;
  const canAddBot = playerCount < 10;
  const playersNeeded = Math.max(0, 5 - playerCount);
  const ghostSlotCount = Math.max(0, 5 - playerCount);

  useEffect(() => {
    if (!copyState) return undefined;

    const timer = window.setTimeout(() => setCopyState(null), 2000);
    return () => window.clearTimeout(timer);
  }, [copyState]);

  const handleCopy = async (value, type) => {
    try {
      await copyText(value);
      setCopyState(type);
    } catch {
      setCopyState(null);
    }
  };

  return (
    <main className="min-h-[100svh] bg-transparent">
      <div className="mx-auto flex min-h-[100svh] w-full max-w-md flex-col px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-[calc(4.5rem+env(safe-area-inset-top))]">
        <section className="rounded-[28px] border border-cyan-500/15 bg-black/35 px-5 py-5 shadow-[0_24px_64px_rgba(0,0,0,0.42)] backdrop-blur-xl">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-mono font-black uppercase tracking-[0.32em] text-cyan-300/70">
                Briefing Room
              </p>
              <h2 className="mt-2 text-5xl font-mono font-black uppercase tracking-[0.24em] text-white sm:text-6xl">
                {gameState.roomId}
              </h2>
            </div>

            <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-mono font-black uppercase tracking-[0.18em] text-white/60">
              {playerCount}/10
            </div>
          </div>

          <p className="mt-3 text-sm leading-relaxed text-white/65">
            Share the code, wait for everyone to join on their own phone, then start the match once the table is full enough.
          </p>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleCopy(gameState.roomId, 'code')}
              className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 text-[11px] font-mono font-black uppercase tracking-[0.22em] text-white transition-colors hover:bg-white/10"
            >
              {copyState === 'code' ? <Check size={16} className="text-cyan-300" /> : <Copy size={16} />}
              {copyState === 'code' ? 'Copied' : 'Copy Code'}
            </button>
            <button
              type="button"
              onClick={() => handleCopy(`${window.location.origin}?room=${gameState.roomId}`, 'link')}
              className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 text-[11px] font-mono font-black uppercase tracking-[0.22em] text-white transition-colors hover:bg-white/10"
            >
              {copyState === 'link' ? <Check size={16} className="text-cyan-300" /> : <Share2 size={16} />}
              {copyState === 'link' ? 'Copied' : 'Share Link'}
            </button>
          </div>
        </section>

        <section className="mt-4 flex min-h-0 flex-1 flex-col rounded-[28px] border border-white/10 bg-[rgba(10,10,10,0.8)] px-4 py-4 shadow-[0_24px_64px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          <div className="flex items-center justify-between gap-3 border-b border-white/8 pb-3">
            <div>
              <p className="flex items-center gap-2 text-[11px] font-mono font-black uppercase tracking-[0.22em] text-cyan-300/80">
                <Users size={14} />
                Operatives
              </p>
              <p className="mt-1 text-xs text-white/45">
                {canStart ? 'Ready to start when the host is ready.' : `${playersNeeded} more needed to start.`}
              </p>
            </div>
            {isHost && (
              <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-[10px] font-mono font-black uppercase tracking-[0.18em] text-cyan-200">
                Host
              </span>
            )}
          </div>

          <div className="mt-4 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-1">
            {gameState.players.map((player) => {
              const isSelf = player.id === playerId;

              return (
                <div
                  key={player.id}
                  className={`flex items-center gap-3 rounded-2xl border px-3 py-3 ${
                    isSelf ? 'border-cyan-400/35 bg-cyan-400/8' : 'border-white/8 bg-white/[0.03]'
                  }`}
                >
                  <img
                    src={`/assets/avatars/avatar_${getAvatarId(player)}.png`}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="h-12 w-10 shrink-0 rounded-xl border border-white/10 object-cover"
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-black uppercase tracking-[0.12em] text-white">
                        {player.name}
                      </p>
                      {isSelf && (
                        <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2 py-0.5 text-[9px] font-mono font-black uppercase tracking-[0.14em] text-cyan-200">
                          You
                        </span>
                      )}
                      {player.isBot && (
                        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[9px] font-mono font-black uppercase tracking-[0.14em] text-white/55">
                          Bot
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-[11px] font-mono uppercase tracking-[0.16em] text-white/35">
                      {player.isHost ? 'Room host' : 'Connected'}
                    </p>
                  </div>

                  {player.isHost && <Crown size={16} className="shrink-0 text-cyan-300" />}
                </div>
              );
            })}

            {Array.from({ length: ghostSlotCount }).map((_, index) => (
              <div
                key={`ghost-${index}`}
                className="flex items-center gap-3 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-3 py-3"
              >
                <div className="flex h-12 w-10 shrink-0 items-center justify-center rounded-xl border border-dashed border-white/10 text-sm font-black text-white/25">
                  +
                </div>
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.12em] text-white/40">
                    Waiting for player
                  </p>
                  <p className="mt-1 text-[11px] font-mono uppercase tracking-[0.16em] text-white/25">
                    Room supports up to 10
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-4 rounded-[28px] border border-white/10 bg-[rgba(12,12,12,0.88)] px-4 py-4 shadow-[0_24px_64px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          {isHost ? (
            <div className="grid gap-2">
              <button
                type="button"
                onClick={onAddBot}
                disabled={!canAddBot}
                className={`flex h-12 items-center justify-center rounded-2xl border text-[11px] font-mono font-black uppercase tracking-[0.22em] transition-colors ${
                  canAddBot
                    ? 'border-white/10 bg-white/5 text-white hover:bg-white/10'
                    : 'border-white/8 bg-white/[0.03] text-white/25'
                }`}
              >
                Add Bot
              </button>
              <button
                type="button"
                onClick={onStart}
                disabled={!canStart}
                className={`flex h-14 items-center justify-center rounded-2xl text-sm font-mono font-black uppercase tracking-[0.28em] transition-all ${
                  canStart
                    ? 'bg-cyan-400 text-black shadow-[0_18px_36px_rgba(0,240,255,0.18)]'
                    : 'border border-white/10 bg-white/5 text-white/35'
                }`}
              >
                Start Match
              </button>
            </div>
          ) : (
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-4 text-center">
              <p className="text-[11px] font-mono font-black uppercase tracking-[0.22em] text-cyan-200/75">
                Waiting for Host
              </p>
              <p className="mt-2 text-sm leading-relaxed text-white/50">
                The match will open once the host has enough players and starts the briefing.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
