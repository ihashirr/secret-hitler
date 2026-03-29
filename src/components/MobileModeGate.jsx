"use client";

import { ArrowLeft, Download, Expand, Shield, Smartphone } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

const VIEW_COPY = {
  GAME_OVER: 'Return to private mode before reviewing the full match debrief.',
  LIVE_GAME: 'Lock the screen before continuing with live voting, nominations, and action prompts.',
  LOBBY: 'Secure this device before the briefing continues so every player keeps their screen private.',
  ROLE_REVEAL: 'Protect the next role briefing before anyone can glance at this screen.',
};

export default function MobileModeGate({ active, viewKey, onExitToConnect, accessState }) {
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    if (!active) {
      setIsLeaving(false);
    }
  }, [active]);

  const isMobile = accessState?.isMobile;
  const gateSatisfied = accessState?.gateSatisfied;

  const detectedModeLabel = useMemo(() => {
    if (accessState?.isStandalone) return 'Installed App';
    if (accessState?.isFullscreen) return 'Fullscreen';
    return 'Browser';
  }, [accessState?.isFullscreen, accessState?.isStandalone]);

  if (!active || !isMobile || gateSatisfied) return null;

  const hasInstallPrompt = accessState?.canInstall;
  const canFullscreen = accessState?.canFullscreen;
  const helperCopy = VIEW_COPY[viewKey] || 'Secure the screen before continuing in the room.';
  const primaryActionLabel = canFullscreen
    ? 'Enter Fullscreen'
    : hasInstallPrompt
      ? 'Install App'
      : 'Use Home Screen Install';

  const handleBackToJoin = async () => {
    setIsLeaving(true);

    try {
      await onExitToConnect();
    } finally {
      setIsLeaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[180] flex items-end justify-center p-3 sm:items-center sm:p-6">
      <div className="absolute inset-0 bg-[#020304]/84 backdrop-blur-md" />

      <div className="relative z-[181] w-full max-w-md">
        <div
          className="tactical-panel overflow-hidden rounded-[30px] border border-cyan-400/30 shadow-[0_28px_80px_rgba(0,0,0,0.55)]"
          style={{ maxHeight: 'calc(var(--app-vh) - 24px)' }}
        >
          <div className="border-b border-white/8 px-5 py-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-[10px] font-mono font-black uppercase tracking-[0.28em] text-cyan-300/75">
                  <Shield size={14} />
                  Mobile Access Lock
                </p>
                <h2 className="mt-2 text-2xl font-black uppercase tracking-[0.08em] text-paper-light">
                  {primaryActionLabel}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-paper-light/75">
                  {helperCopy}
                </p>
              </div>

              <span className="shrink-0 rounded-full border border-cyan-300/18 bg-cyan-400/8 px-3 py-1 text-[10px] font-mono font-black uppercase tracking-[0.18em] text-cyan-100">
                {detectedModeLabel}
              </span>
            </div>
          </div>

          <div className="space-y-5 overflow-y-auto px-5 py-4 scrollbar-hide">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-[18px] border border-white/8 bg-white/[0.03] px-3 py-3">
                <p className="text-[9px] font-mono font-black uppercase tracking-[0.18em] text-white/35">Device</p>
                <p className="mt-2 text-[11px] font-black uppercase tracking-[0.12em] text-white">Mobile</p>
              </div>
              <div className="rounded-[18px] border border-white/8 bg-white/[0.03] px-3 py-3">
                <p className="text-[9px] font-mono font-black uppercase tracking-[0.18em] text-white/35">Mode</p>
                <p className="mt-2 text-[11px] font-black uppercase tracking-[0.12em] text-white">{detectedModeLabel}</p>
              </div>
              <div className="rounded-[18px] border border-white/8 bg-white/[0.03] px-3 py-3">
                <p className="text-[9px] font-mono font-black uppercase tracking-[0.18em] text-white/35">Status</p>
                <p className="mt-2 text-[11px] font-black uppercase tracking-[0.12em] text-red-200">Locked</p>
              </div>
            </div>

            <div className="rounded-[22px] border border-white/8 bg-white/[0.03] px-4 py-4">
              <p className="flex items-center gap-2 text-[10px] font-mono font-black uppercase tracking-[0.22em] text-cyan-200/75">
                <Smartphone size={14} />
                Why This Matters
              </p>
              <p className="mt-3 text-sm leading-relaxed text-paper-light/68">
                Installed or fullscreen mode removes cheap browser chrome, prevents accidental page scroll, and keeps hidden-role prompts safer on shared tables.
              </p>
            </div>

            <div className="grid gap-3">
              {canFullscreen && (
                <button
                  type="button"
                  onClick={accessState.requestFullscreen}
                  className="flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-4 text-sm font-mono font-black uppercase tracking-[0.22em] text-black transition-colors hover:bg-cyan-300"
                >
                  <Expand size={16} />
                  Enter Fullscreen
                </button>
              )}

              {hasInstallPrompt && (
                <button
                  type="button"
                  onClick={accessState.promptInstall}
                  className={`flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl px-4 text-sm font-mono font-black uppercase tracking-[0.22em] transition-colors ${
                    canFullscreen
                      ? 'border border-[#d4af37]/30 bg-[#d4af37] text-black hover:bg-[#e2bd48]'
                      : 'bg-[#d4af37] text-black hover:bg-[#e2bd48]'
                  }`}
                >
                  <Download size={16} />
                  Install App
                </button>
              )}

              {!canFullscreen && !hasInstallPrompt && (
                <div className="rounded-[22px] border border-amber-300/20 bg-amber-400/10 px-4 py-4 text-left">
                  <p className="text-[10px] font-mono font-black uppercase tracking-[0.22em] text-amber-100/80">
                    Manual Install
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-amber-50/85">
                    {accessState?.isIos
                      ? 'iPhone/Safari: tap Share, choose Add to Home Screen, then reopen Eclipse from the app icon.'
                      : 'Use your browser menu to install or add this app to your home screen, then reopen it there.'}
                  </p>
                </div>
              )}

              <button
                type="button"
                onClick={accessState.refresh}
                className="flex h-12 w-full items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-[11px] font-mono font-black uppercase tracking-[0.22em] text-paper-light/80 transition-colors hover:bg-white/[0.08]"
              >
                I Switched Modes
              </button>

              <button
                type="button"
                onClick={handleBackToJoin}
                disabled={isLeaving}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-transparent text-[11px] font-mono font-black uppercase tracking-[0.22em] text-paper-light/65 transition-colors hover:bg-white/[0.04] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ArrowLeft size={14} />
                {isLeaving ? 'Returning...' : 'Back to Join Screen'}
              </button>
            </div>

            <p className="text-center text-xs leading-relaxed text-paper-light/50">
              Install or fullscreen only needs to happen once per session unless you exit the secure mode.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
