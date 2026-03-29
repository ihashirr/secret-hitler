"use client";

import { useEffect, useMemo, useState } from 'react';

const MOBILE_BREAKPOINT = 1024;

const isStandaloneMode = () => {
  if (typeof window === 'undefined') return false;
  const inDisplayMode = window.matchMedia('(display-mode: standalone)').matches;
  const iosStandalone = window.navigator.standalone === true;
  return inDisplayMode || iosStandalone;
};

const isFullscreenMode = () => {
  if (typeof document === 'undefined') return false;
  return Boolean(document.fullscreenElement);
};

const isMobileViewport = () => {
  if (typeof window === 'undefined') return false;
  const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
  return coarsePointer && window.innerWidth <= MOBILE_BREAKPOINT;
};

export default function MobileModeGate() {
  const [isMobile, setIsMobile] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [canFullscreen, setCanFullscreen] = useState(false);
  const [installPromptEvent, setInstallPromptEvent] = useState(null);

  useEffect(() => {
    const syncState = () => {
      setIsMobile(isMobileViewport());
      setIsStandalone(isStandaloneMode());
      setIsFullscreen(isFullscreenMode());
      setCanFullscreen(Boolean(document.documentElement?.requestFullscreen));
    };

    const onBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setInstallPromptEvent(event);
    };

    syncState();
    window.addEventListener('resize', syncState);
    document.addEventListener('fullscreenchange', syncState);
    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', syncState);
    document.addEventListener('visibilitychange', syncState);

    return () => {
      window.removeEventListener('resize', syncState);
      document.removeEventListener('fullscreenchange', syncState);
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', syncState);
      document.removeEventListener('visibilitychange', syncState);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Registration can fail in dev or unsupported contexts; gate still works via fullscreen.
    });
  }, []);

  const gateSatisfied = useMemo(
    () => isStandalone || isFullscreen,
    [isStandalone, isFullscreen],
  );

  if (!isMobile || gateSatisfied) return null;

  const requestFullscreen = async () => {
    if (!document.documentElement?.requestFullscreen) return;
    try {
      await document.documentElement.requestFullscreen();
    } catch {
      // Some mobile browsers block fullscreen without explicit user gesture support.
    }
  };

  const triggerInstall = async () => {
    if (!installPromptEvent) return;
    try {
      await installPromptEvent.prompt();
      await installPromptEvent.userChoice;
      setInstallPromptEvent(null);
    } catch {
      // Ignore dismissals and keep instructions visible.
    }
  };

  return (
    <div className="fixed inset-0 z-120 bg-obsidian-950/95 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-md tactical-panel rounded-2xl border border-cyan-400/40 p-5 text-center">
        <p className="text-xs tracking-[0.3em] uppercase text-cyan-300">Mobile Access Lock</p>
        <h2 className="mt-2 text-2xl font-bold text-paper-light">Use Fullscreen or Install App</h2>
        <p className="mt-3 text-sm text-paper-light/80 leading-relaxed">
          For fair play and hidden-role privacy, mobile players must continue in browser fullscreen
          or launch the installed web app.
        </p>

        <div className="mt-5 grid gap-3">
          {canFullscreen && (
            <button
              type="button"
              onClick={requestFullscreen}
              className="w-full rounded-xl bg-cyan-500/90 px-4 py-3 text-sm font-semibold text-black hover:bg-cyan-400 transition"
            >
              Enter Fullscreen
            </button>
          )}

          {installPromptEvent && (
            <button
              type="button"
              onClick={triggerInstall}
              className="w-full rounded-xl bg-gold-foil/90 px-4 py-3 text-sm font-semibold text-black hover:bg-gold-foil transition"
            >
              Install App
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setIsMobile(isMobileViewport());
              setIsStandalone(isStandaloneMode());
              setIsFullscreen(isFullscreenMode());
            }}
            className="w-full rounded-xl border border-white/20 px-4 py-3 text-sm font-semibold text-paper-light hover:bg-white/10 transition"
          >
            I Installed It / Retry Check
          </button>
        </div>

        <p className="mt-4 text-xs text-paper-light/60">
          iPhone/Safari: Share {'->'} Add to Home Screen, then open the app icon.
        </p>
      </div>
    </div>
  );
}