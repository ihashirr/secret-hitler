import { useEffect, useRef, useState } from 'react';

const REFRESH_THRESHOLD = 84;
const MAX_PULL_DISTANCE = 120;
const DRAG_RESISTANCE = 0.45;

const isScrollableElement = (element) => {
  if (!(element instanceof HTMLElement)) return false;

  const styles = window.getComputedStyle(element);
  const overflowY = styles.overflowY;

  return ['auto', 'scroll', 'overlay'].includes(overflowY) && element.scrollHeight > element.clientHeight + 1;
};

const getScrollableParent = (target) => {
  let node = target instanceof HTMLElement ? target : null;

  while (node && node !== document.body && node !== document.documentElement) {
    if (isScrollableElement(node)) return node;
    node = node.parentElement;
  }

  return null;
};

export default function usePullToRefresh() {
  const gestureRef = useRef({
    pullDistance: 0,
    scrollContainer: null,
    startX: 0,
    startY: 0,
    tracking: false,
  });
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isThresholdReached, setIsThresholdReached] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return undefined;

    const resetPullState = () => {
      gestureRef.current = {
        pullDistance: 0,
        scrollContainer: null,
        startX: 0,
        startY: 0,
        tracking: false,
      };
      setPullDistance(0);
      setIsThresholdReached(false);
    };

    const triggerRefresh = () => {
      setIsRefreshing(true);
      setPullDistance(REFRESH_THRESHOLD);
      setIsThresholdReached(true);

      window.setTimeout(() => {
        window.location.reload();
      }, 180);
    };

    const handleTouchStart = (event) => {
      if (isRefreshing || event.touches.length !== 1) return;

      const touch = event.touches[0];
      const scrollContainer = getScrollableParent(event.target);
      const canStartPull = !scrollContainer || scrollContainer.scrollTop <= 0;

      if (!canStartPull) {
        gestureRef.current.tracking = false;
        return;
      }

      gestureRef.current = {
        pullDistance: 0,
        scrollContainer,
        startX: touch.clientX,
        startY: touch.clientY,
        tracking: true,
      };
    };

    const handleTouchMove = (event) => {
      if (isRefreshing || !gestureRef.current.tracking || event.touches.length !== 1) return;

      const touch = event.touches[0];
      const deltaX = touch.clientX - gestureRef.current.startX;
      const deltaY = touch.clientY - gestureRef.current.startY;

      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 12) {
        resetPullState();
        return;
      }

      if (gestureRef.current.scrollContainer && gestureRef.current.scrollContainer.scrollTop > 0) {
        resetPullState();
        return;
      }

      if (deltaY <= 0) {
        if (gestureRef.current.pullDistance > 0) {
          event.preventDefault();
          resetPullState();
        }
        return;
      }

      const nextPullDistance = Math.min(MAX_PULL_DISTANCE, Math.round(deltaY * DRAG_RESISTANCE));
      gestureRef.current.pullDistance = nextPullDistance;
      setPullDistance(nextPullDistance);
      setIsThresholdReached(nextPullDistance >= REFRESH_THRESHOLD);
      event.preventDefault();
    };

    const handleTouchEnd = () => {
      if (isRefreshing || !gestureRef.current.tracking) return;

      if (gestureRef.current.pullDistance >= REFRESH_THRESHOLD) {
        triggerRefresh();
        gestureRef.current.tracking = false;
        return;
      }

      resetPullState();
    };

    const handleTouchCancel = () => {
      if (isRefreshing) return;
      resetPullState();
    };

    const passiveOptions = { passive: true };
    const activeOptions = { passive: false };

    document.addEventListener('touchstart', handleTouchStart, passiveOptions);
    document.addEventListener('touchmove', handleTouchMove, activeOptions);
    document.addEventListener('touchend', handleTouchEnd, passiveOptions);
    document.addEventListener('touchcancel', handleTouchCancel, passiveOptions);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart, passiveOptions);
      document.removeEventListener('touchmove', handleTouchMove, activeOptions);
      document.removeEventListener('touchend', handleTouchEnd, passiveOptions);
      document.removeEventListener('touchcancel', handleTouchCancel, passiveOptions);
    };
  }, [isRefreshing]);

  return {
    isRefreshing,
    isThresholdReached,
    pullDistance,
    threshold: REFRESH_THRESHOLD,
  };
}
