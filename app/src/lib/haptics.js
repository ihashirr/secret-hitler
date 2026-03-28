const HAPTIC_PATTERNS = {
  light: [10],
  selection: [8],
  confirm: [12, 40, 18],
  warning: [18, 42, 18],
  soft: [6],
};

export function triggerHaptic(kind = 'light') {
  if (typeof window === 'undefined') return false;
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return false;

  const pattern = HAPTIC_PATTERNS[kind] || HAPTIC_PATTERNS.light;
  return navigator.vibrate(pattern);
}
