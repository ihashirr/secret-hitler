import { useEffect, useState } from 'react';

const MOBILE_BREAKPOINT = 1280;
const MAX_TOUCH_DEVICE_LONG_SIDE = 1600;

const DEFAULT_STATE = {
  canFullscreen: false,
  isFullscreen: false,
  isIos: false,
  isMobile: false,
  isReady: false,
  isSafari: false,
  isStandalone: false,
  justInstalled: false,
};

const getIsStandaloneMode = () => {
  if (typeof window === 'undefined') return false;

  const inDisplayMode = window.matchMedia('(display-mode: standalone)').matches;
  const iosStandalone = window.navigator.standalone === true;

  return inDisplayMode || iosStandalone;
};

const getIsFullscreenMode = () => {
  if (typeof document === 'undefined') return false;
  return Boolean(document.fullscreenElement);
};

const getIsMobileViewport = () => {
  if (typeof window === 'undefined') return false;

  const coarsePointer =
    window.matchMedia('(pointer: coarse)').matches ||
    window.matchMedia('(any-pointer: coarse)').matches;
  const shortSide = Math.min(window.innerWidth, window.innerHeight);
  const longSide = Math.max(window.innerWidth, window.innerHeight);
  const touchPoints = navigator.maxTouchPoints || 0;
  const touchCapable = touchPoints > 0 || 'ontouchstart' in window;
  const mobileUserAgent = /Android|webOS|iPhone|iPad|iPod|Mobile|Tablet|Silk/i.test(navigator.userAgent);
  const userAgentDataMobile = navigator.userAgentData?.mobile === true;
  const fitsTouchLayout = shortSide <= MOBILE_BREAKPOINT && longSide <= MAX_TOUCH_DEVICE_LONG_SIDE;
  const handheldSizedViewport = shortSide <= 900;

  return (
    mobileUserAgent ||
    userAgentDataMobile ||
    (touchCapable && fitsTouchLayout && (coarsePointer || handheldSizedViewport))
  );
};

const getIsIosDevice = () => {
  if (typeof navigator === 'undefined') return false;

  const appleMobileUserAgent = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const touchMac = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;

  return appleMobileUserAgent || touchMac;
};

const getIsSafariBrowser = () => {
  if (typeof navigator === 'undefined') return false;

  const userAgent = navigator.userAgent;
  return /Safari/i.test(userAgent) && !/CriOS|FxiOS|EdgiOS|OPiOS|DuckDuckGo|YaBrowser/i.test(userAgent);
};

const getAccessSnapshot = () => ({
  canFullscreen: Boolean(document.documentElement?.requestFullscreen),
  isFullscreen: getIsFullscreenMode(),
  isIos: getIsIosDevice(),
  isMobile: getIsMobileViewport(),
  isReady: true,
  isSafari: getIsSafariBrowser(),
  isStandalone: getIsStandaloneMode(),
});

export default function useMobileAccessState() {
  const [accessState, setAccessState] = useState(DEFAULT_STATE);
  const [installPromptEvent, setInstallPromptEvent] = useState(null);
  const [justInstalled, setJustInstalled] = useState(false);

  const refresh = () => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    setAccessState(getAccessSnapshot());
  };

  useEffect(() => {
    const onBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setInstallPromptEvent(event);
      refresh();
    };

    const onAppInstalled = () => {
      setInstallPromptEvent(null);
      setJustInstalled(true);
      refresh();
    };

    refresh();

    const viewport = window.visualViewport;

    window.addEventListener('resize', refresh);
    window.addEventListener('orientationchange', refresh);
    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onAppInstalled);
    document.addEventListener('fullscreenchange', refresh);
    document.addEventListener('visibilitychange', refresh);
    viewport?.addEventListener('resize', refresh);

    return () => {
      window.removeEventListener('resize', refresh);
      window.removeEventListener('orientationchange', refresh);
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onAppInstalled);
      document.removeEventListener('fullscreenchange', refresh);
      document.removeEventListener('visibilitychange', refresh);
      viewport?.removeEventListener('resize', refresh);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Registration can fail in dev or unsupported contexts; access checks still work.
    });
  }, []);

  const requestFullscreen = async () => {
    if (!document.documentElement?.requestFullscreen) return false;

    try {
      await document.documentElement.requestFullscreen();
      refresh();
      return true;
    } catch {
      refresh();
      return false;
    }
  };

  const promptInstall = async () => {
    if (!installPromptEvent) return false;

    try {
      await installPromptEvent.prompt();
      const choice = await installPromptEvent.userChoice;

      if (choice?.outcome === 'accepted') {
        setJustInstalled(true);
        return true;
      }

      return false;
    } catch {
      return false;
    } finally {
      setInstallPromptEvent(null);
      refresh();
    }
  };

  const clearJustInstalled = () => {
    setJustInstalled(false);
  };

  return {
    ...accessState,
    canInstall: Boolean(installPromptEvent),
    gateSatisfied: accessState.isStandalone || accessState.isFullscreen,
    justInstalled,
    clearJustInstalled,
    promptInstall,
    refresh,
    requestFullscreen,
  };
}
