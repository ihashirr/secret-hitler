import { useEffect } from 'react';

const HEADER_HEIGHT = 56;

const syncViewportVariables = () => {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const root = document.documentElement;
  const viewport = window.visualViewport;
  const viewportHeight = Math.round(viewport?.height || window.innerHeight);
  const viewportWidth = Math.round(viewport?.width || window.innerWidth);

  root.style.setProperty('--app-vh', `${viewportHeight}px`);
  root.style.setProperty('--app-vw', `${viewportWidth}px`);
  root.style.setProperty('--app-safe-top', 'env(safe-area-inset-top)');
  root.style.setProperty('--app-safe-bottom', 'env(safe-area-inset-bottom)');
  root.style.setProperty('--app-header-height', `${HEADER_HEIGHT}px`);
};

export default function useViewportShell() {
  useEffect(() => {
    syncViewportVariables();

    const viewport = window.visualViewport;

    window.addEventListener('resize', syncViewportVariables);
    window.addEventListener('orientationchange', syncViewportVariables);
    document.addEventListener('visibilitychange', syncViewportVariables);
    viewport?.addEventListener('resize', syncViewportVariables);

    return () => {
      window.removeEventListener('resize', syncViewportVariables);
      window.removeEventListener('orientationchange', syncViewportVariables);
      document.removeEventListener('visibilitychange', syncViewportVariables);
      viewport?.removeEventListener('resize', syncViewportVariables);
    };
  }, []);
}
