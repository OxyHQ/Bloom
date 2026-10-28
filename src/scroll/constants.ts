/** Inputs that transfer control of scrolling from restoration to the reader. */
export const SCROLL_USER_TAKEOVER_EVENTS = [
  'wheel',
  'touchstart',
  'pointerdown',
  'keydown',
] as const;
