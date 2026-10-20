import { adoptStyleSheet } from '../styles/adopt-style-sheet';

const ATTRIBUTE = 'data-bloom-scroll-disabled';
const locks = new WeakMap<HTMLElement, number>();
const CSS = `[${ATTRIBUTE}] { overflow: hidden !important; touch-action: none !important; }`;

/** Several observers may constrain the same owner. Releasing one never unlocks another. */
export function acquireScrollLock(element: HTMLElement): () => void {
  adoptStyleSheet('bloom-scroll-disabled', CSS);
  locks.set(element, (locks.get(element) ?? 0) + 1);
  element.setAttribute(ATTRIBUTE, '');
  let released = false;
  return () => {
    if (released) return;
    released = true;
    const remaining = (locks.get(element) ?? 1) - 1;
    if (remaining > 0) locks.set(element, remaining);
    else {
      locks.delete(element);
      element.removeAttribute(ATTRIBUTE);
    }
  };
}

/** Only user gestures are constrained; programmatic scroll and restoration remain available. */
export function isScrollLocked(element: HTMLElement): boolean {
  return locks.has(element);
}
