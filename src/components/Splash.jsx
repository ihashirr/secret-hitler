import { useState } from 'react';

const AVATAR_IDS = Array.from({ length: 10 }, (_, index) => index + 1);

const createRoomCode = () => Math.random().toString(36).slice(2, 6).toUpperCase();

const getInitialRoomId = () => {
  if (typeof window === 'undefined') return '';

  const room = new URLSearchParams(window.location.search).get('room');
  return room ? room.toUpperCase().slice(0, 4) : '';
};

const triggerHaptic = (pattern = 15) => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(pattern);
  }
};

export default function Splash({ onConnect }) {
  const [name, setName] = useState('');
  const [roomId, setRoomId] = useState(getInitialRoomId);
  const [avatarId, setAvatarId] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!name.trim() || loading) return;

    setLoading(true);
    setError('');

    const finalRoomId = roomId.trim().toUpperCase() || createRoomCode();

    try {
      await onConnect(name.trim(), finalRoomId, avatarId);
      triggerHaptic([20, 35, 20]);
    } catch (err) {
      triggerHaptic([35, 30, 35]);
      setError(err.message || 'Unable to open room.');
      setLoading(false);
    }
  };

  return (
    <main className="h-full min-h-0 overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(0,240,255,0.08),transparent_38%),linear-gradient(180deg,#040607_0%,#111111_100%)] text-white">
      <div className="mx-auto flex h-full min-h-0 w-full max-w-md flex-col overflow-y-auto px-4 pb-[calc(var(--app-safe-bottom)+1.5rem)] pt-[calc(var(--app-safe-top)+1rem)] scrollbar-hide">
        <section className="rounded-[28px] border border-cyan-500/15 bg-black/35 px-5 py-6 shadow-[0_24px_64px_rgba(0,0,0,0.45)] backdrop-blur-xl">
          <p className="text-[10px] font-mono font-black uppercase tracking-[0.32em] text-cyan-300/70">
            Private Phone Match
          </p>
          <h1 className="mt-3 text-4xl font-black uppercase tracking-[0.18em] text-white sm:text-5xl">
            Eclipse
          </h1>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/68">
            Join on your own phone. Keep your role private.
          </p>

          <div className="mt-5 grid grid-cols-2 gap-2 text-[10px] font-mono font-black uppercase tracking-[0.18em] text-white/55">
            <div className="rounded-2xl border border-white/8 bg-white/5 px-3 py-3">
              5 to 10 players
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/5 px-3 py-3">
              One device each
            </div>
          </div>
        </section>

        <form
          onSubmit={handleSubmit}
          className="mt-4 rounded-[28px] border border-white/10 bg-[rgba(12,12,12,0.82)] px-4 py-5 shadow-[0_24px_64px_rgba(0,0,0,0.4)] backdrop-blur-xl"
        >
          <div>
            <label
              htmlFor="player-name"
              className="text-[10px] font-mono font-black uppercase tracking-[0.28em] text-cyan-300/70"
            >
              Alias
            </label>
            <input
              id="player-name"
              type="text"
              value={name}
              onChange={(event) => {
                setName(event.target.value.slice(0, 14));
                if (error) setError('');
              }}
              maxLength={14}
              autoComplete="off"
              spellCheck="false"
              placeholder="Choose a callsign"
              className="mt-2 h-14 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-lg font-black uppercase tracking-[0.16em] text-white outline-none transition-colors placeholder:text-white/25 focus:border-cyan-400/60 focus:bg-cyan-400/5"
            />
          </div>

          <div className="mt-5">
            <div className="flex items-center justify-between gap-3">
              <label className="text-[10px] font-mono font-black uppercase tracking-[0.28em] text-cyan-300/70">
                Portrait
              </label>
              <span className="text-[10px] font-mono font-black uppercase tracking-[0.18em] text-white/45">
                {`Profile ${String(avatarId).padStart(2, '0')}`}
              </span>
            </div>

            <div className="mt-3 grid grid-cols-5 gap-2">
              {AVATAR_IDS.map((id) => {
                const isSelected = avatarId === id;

                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      triggerHaptic(10);
                      setAvatarId(id);
                    }}
                    className={`relative aspect-[3/4] overflow-hidden rounded-2xl border transition-all ${
                      isSelected
                        ? 'border-cyan-400 shadow-[0_0_0_2px_rgba(0,240,255,0.2)]'
                        : 'border-white/10 opacity-70'
                    }`}
                  >
                    <img
                      src={`/assets/avatars/avatar_${id}.png`}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className={`h-full w-full object-cover transition-transform ${
                        isSelected ? 'scale-105' : 'scale-100'
                      }`}
                    />
                    {isSelected && (
                      <span className="absolute inset-x-2 bottom-2 rounded-full bg-cyan-400 px-1 py-1 text-[8px] font-mono font-black uppercase tracking-[0.2em] text-black">
                        Active
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-5">
            <div className="flex items-center justify-between gap-3">
              <label
                htmlFor="room-id"
                className="text-[10px] font-mono font-black uppercase tracking-[0.28em] text-cyan-300/70"
              >
                Room Code
              </label>
              <span className="text-[10px] font-mono font-black uppercase tracking-[0.18em] text-white/45">
                Optional
              </span>
            </div>
            <input
              id="room-id"
              type="text"
              inputMode="text"
              value={roomId}
              onChange={(event) => {
                setRoomId(event.target.value.toUpperCase().slice(0, 4));
                if (error) setError('');
              }}
              autoComplete="off"
              spellCheck="false"
              placeholder="Auto-create if blank"
              className="mt-2 h-14 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-center font-mono text-2xl font-black uppercase tracking-[0.4em] text-cyan-300 outline-none transition-colors placeholder:tracking-[0.18em] placeholder:text-white/25 focus:border-cyan-400/60 focus:bg-cyan-400/5"
            />
            <p className="mt-2 text-xs leading-relaxed text-white/45">
              Leave blank to create a room.
            </p>
          </div>

          {error && (
            <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={!name.trim() || loading}
            className={`mt-5 flex h-14 w-full items-center justify-center rounded-2xl px-4 text-sm font-mono font-black uppercase tracking-[0.3em] transition-all ${
              !name.trim() || loading
                ? 'border border-white/10 bg-white/5 text-white/35'
                : 'bg-cyan-400 text-black shadow-[0_18px_36px_rgba(0,240,255,0.18)]'
            }`}
          >
            {loading ? 'Connecting' : roomId ? 'Join Room' : 'Create Room'}
          </button>
        </form>
      </div>
    </main>
  );
}
