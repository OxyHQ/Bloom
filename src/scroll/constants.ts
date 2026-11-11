/** Inputs that transfer control of scrolling from restoration to the reader. */
export const SCROLL_USER_TAKEOVER_EVENTS = [
  'wheel',
  'touchstart',
  'pointerdown',
  'keydown',
] as const;

/** Fractional CSS pixels may round when the browser accepts a restored offset. */
export const SCROLL_RESTORE_TOLERANCE_PX = 2;
