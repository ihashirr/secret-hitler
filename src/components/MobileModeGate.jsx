"use client";

import { ArrowLeft, Download, Expand, Shield } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

const VIEW_COPY = {
  CONNECT: 'Install the app or use fullscreen to continue.',
  GAME_OVER: 'Open in app or fullscreen to continue.',
  LIVE_GAME: 'Open in app or fullscreen to continue.',
  LOBBY: 'Open in app or fullscreen to continue.',
  ROLE_REVEAL: 'Secure this screen first.',
};

export default function MobileModeGate({ active, viewKey, onExitToConnect, accessState, installResumeUrl }) {
  const [isLeaving, setIsLeaving] = useState(false);
  const [launchState, setLaunchState] = useState('idle');

  useEffect(() => {
    if (!active) {
      setIsLeaving(false);
      setLaunchState('idle');
    }
  }, [active]);

  useEffect(() => {
    if (!active || !accessState?.justInstalled || accessState?.isStandalone) return;

    setLaunchState('launching');
    accessState.clearJustInstalled?.();

    const handoffTimer = window.setTimeout(() => {
      if (installResumeUrl) {
        window.location.assign(installResumeUrl);
      }
    }, 180);

    const fallbackTimer = window.setTimeout(() => {
      setLaunchState((current) => (current === 'launching' ? 'manual' : current));
      accessState.refresh?.();
    }, 1800);

    return () => {
      window.clearTimeout(handoffTimer);
      window.clearTimeout(fallbackTimer);
    };
  }, [
    active,
    accessState,
    installResumeUrl,
  ]);

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
  const primaryActionLabel = hasInstallPrompt
    ? 'Install App'
    : canFullscreen
      ? 'Enter Fullscreen'
      : 'Use Home Screen Install';
  const installInstructions = accessState?.isIos
    ? 'Share -> Add to Home Screen.'
    : 'Use the browser menu to install the app.';
  const isLaunchPending = launchState === 'launching';
  const showLaunchFallback = launchState === 'manual';

  const handleBackToJoin = async () => {
    setIsLeaving(true);

    try {
      await onExitToConnect();
    } finally {
      setIsLeaving(false);
    }
  };

  const handleInstall = async () => {
    if (!hasInstallPrompt) return;

    setLaunchState('installing');
    const accepted = await accessState.promptInstall();

    if (!accepted) {
      setLaunchState('idle');
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
                  Private Mode
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
            <div className="grid gap-3">
              {hasInstallPrompt ? (
                <button
                  type="button"
                  onClick={handleInstall}
                  className="flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-[#d4af37] px-4 text-sm font-mono font-black uppercase tracking-[0.22em] text-black transition-colors hover:bg-[#e2bd48]"
                >
                  <Download size={16} />
                  Install App
                </button>
              ) : (
                <div className="rounded-[22px] border border-amber-300/20 bg-amber-400/10 px-4 py-4 text-left">
                  <p className="text-[10px] font-mono font-black uppercase tracking-[0.22em] text-amber-100/80">
                    Install App
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-amber-50/85">
                    {installInstructions}
                  </p>
                </div>
              )}

              {canFullscreen && (
                <button
                  type="button"
                  onClick={accessState.requestFullscreen}
                  className="flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl border border-cyan-300/25 bg-cyan-400 px-4 text-sm font-mono font-black uppercase tracking-[0.22em] text-black transition-colors hover:bg-cyan-300"
                >
                  <Expand size={16} />
                  Enter Fullscreen
                </button>
              )}

              {(isLaunchPending || showLaunchFallback) && (
                <div className="rounded-[22px] border border-cyan-300/18 bg-cyan-400/10 px-4 py-4 text-left">
                  <p className="text-[10px] font-mono font-black uppercase tracking-[0.22em] text-cyan-100/80">
                    {isLaunchPending ? 'Opening App' : 'App Installed'}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-cyan-50/85">
                    {isLaunchPending
                      ? 'Trying to continue in the installed app.'
                      : 'Open Eclipse from your home screen if it did not open automatically.'}
                  </p>
                  {showLaunchFallback && installResumeUrl && (
                    <button
                      type="button"
                      onClick={() => window.location.assign(installResumeUrl)}
                      className="mt-3 inline-flex h-11 items-center justify-center rounded-2xl border border-cyan-300/24 bg-white/5 px-4 text-[11px] font-mono font-black uppercase tracking-[0.18em] text-cyan-100 transition-colors hover:bg-white/10"
                    >
                      Try Again
                    </button>
                  )}
                </div>
              )}

              <button
                type="button"
                onClick={accessState.refresh}
                className="flex h-12 w-full items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-[11px] font-mono font-black uppercase tracking-[0.22em] text-paper-light/80 transition-colors hover:bg-white/[0.08]"
              >
                Refresh
              </button>

              {viewKey !== 'CONNECT' && (
                <button
                  type="button"
                  onClick={handleBackToJoin}
                  disabled={isLeaving}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-transparent text-[11px] font-mono font-black uppercase tracking-[0.22em] text-paper-light/65 transition-colors hover:bg-white/[0.04] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ArrowLeft size={14} />
                  {isLeaving ? 'Returning...' : 'Back to Join Screen'}
                </button>
              )}
            </div>

            <p className="text-center text-xs leading-relaxed text-paper-light/50">
              Install is best. Fullscreen also works.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
