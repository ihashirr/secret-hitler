import { useEffect, useRef, useState } from 'react';

const REFRESH_THRESHOLD = 84;
const MAX_PULL_DISTANCE = 120;
const DRAG_RESISTANCE = 0.45;
const PULL_ACTIVATION_DISTANCE = 14;

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

      if (deltaY < -8) {
        gestureRef.current.tracking = false;
        return;
      }

      if (deltaY <= 0) {
        if (gestureRef.current.pullDistance > 0) {
          if (event.cancelable) event.preventDefault();
          resetPullState();
        }
        return;
      }

      const nextPullDistance = Math.min(MAX_PULL_DISTANCE, Math.round(deltaY * DRAG_RESISTANCE));
      if (nextPullDistance < PULL_ACTIVATION_DISTANCE) return;
      gestureRef.current.pullDistance = nextPullDistance;
      setPullDistance(nextPullDistance);
      setIsThresholdReached(nextPullDistance >= REFRESH_THRESHOLD);
      if (event.cancelable) event.preventDefault();
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

    const passiveCaptureOptions = { passive: true, capture: true };
    const activeCaptureOptions = { passive: false, capture: true };

    window.addEventListener('touchstart', handleTouchStart, passiveCaptureOptions);
    window.addEventListener('touchmove', handleTouchMove, activeCaptureOptions);
    window.addEventListener('touchend', handleTouchEnd, passiveCaptureOptions);
    window.addEventListener('touchcancel', handleTouchCancel, passiveCaptureOptions);

    return () => {
      window.removeEventListener('touchstart', handleTouchStart, passiveCaptureOptions);
      window.removeEventListener('touchmove', handleTouchMove, activeCaptureOptions);
      window.removeEventListener('touchend', handleTouchEnd, passiveCaptureOptions);
      window.removeEventListener('touchcancel', handleTouchCancel, passiveCaptureOptions);
    };
  }, [isRefreshing]);

  return {
    isRefreshing,
    isThresholdReached,
    pullDistance,
    threshold: REFRESH_THRESHOLD,
  };
}
