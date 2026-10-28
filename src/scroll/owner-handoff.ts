import { SCROLL_USER_TAKEOVER_EVENTS } from './constants';

/** An active Screen's owner transfer, consumed once when restoration focuses. */
const offsets = new WeakMap<object, { offset: number; release(): void }>();

export function recordScrollOwnerHandoff(owner: object, offset: number) {
  offsets.get(owner)?.release();
  const target = owner as Partial<EventTarget> & { scrollTop?: number };
  let userTookOver = false;
  const observe = () => {
    if (!userTookOver) return;
    const current =
      typeof window !== 'undefined' && owner === window ? window.scrollY : target.scrollTop;
    if (typeof current === 'number' && Number.isFinite(current))
      transfer.offset = Math.max(0, current);
  };
  const takeOver = () => {
    userTookOver = true;
    observe();
  };
  const transfer = {
    offset,
    release() {
      // A departed Screen must not delete a newer Screen's transfer on the
      // shared window owner. Release belongs to this transfer, not its node.
      if (offsets.get(owner) === transfer) offsets.delete(owner);
      target.removeEventListener?.('scroll', observe);
      for (const event of SCROLL_USER_TAKEOVER_EVENTS)
        target.removeEventListener?.(event, takeOver);
    },
  };
  offsets.set(owner, transfer);
  // Only a pending transfer listens. Explicit input takes precedence over the
  // original target; unsolicited geometry clamps must not erase it before focus.
  target.addEventListener?.('scroll', observe, { passive: true });
  for (const event of SCROLL_USER_TAKEOVER_EVENTS) {
    target.addEventListener?.(event, takeOver, { passive: true });
  }
  return transfer.release;
}

export function takeScrollOwnerHandoff(owner: object): number | undefined {
  const transfer = offsets.get(owner);
  transfer?.release();
  return transfer?.offset;
}
