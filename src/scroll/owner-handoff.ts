import { SCROLL_RESTORE_TOLERANCE_PX, SCROLL_USER_TAKEOVER_EVENTS } from './constants';

/** One restoration claim; keep its intent until the owner accepts it or the user takes over. */
const offsets = new WeakMap<
  object,
  {
    offset: number;
    consumed: boolean;
    pending: boolean;
    current(): number | undefined;
    release(): void;
  }
>();

export function recordScrollOwnerHandoff(
  owner: object,
  offset: number,
  onTakeOver?: (offset: number) => void,
) {
  offsets.get(owner)?.release();
  const target = owner as Partial<EventTarget> & { scrollTop?: number };
  let userTookOver = false;
  const current = () =>
    typeof window !== 'undefined' && owner === window ? window.scrollY : target.scrollTop;
  const observe = () => {
    const value = current();
    if (value !== undefined && Math.abs(value - transfer.offset) <= SCROLL_RESTORE_TOLERANCE_PX)
      transfer.pending = false;
    if (userTookOver && typeof value === 'number' && Number.isFinite(value))
      transfer.offset = Math.max(0, value);
    if (transfer.consumed && !transfer.pending) transfer.release();
  };
  const takeOver = () => {
    userTookOver = true;
    transfer.pending = false;
    observe();
    onTakeOver?.(transfer.offset);
  };
  const transfer = {
    offset,
    consumed: false,
    pending: true,
    current,
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
  if (!transfer || transfer.consumed) return undefined;
  transfer.consumed = true;
  readScrollOwnerHandoff(owner);
  return transfer.offset;
}

/** Geometry can clamp a receiving owner before its virtual content is ready. */
export function readScrollOwnerHandoff(owner: object): number | undefined {
  const transfer = offsets.get(owner);
  if (!transfer) return undefined;
  const current = transfer.current();
  if (current !== undefined && Math.abs(current - transfer.offset) <= SCROLL_RESTORE_TOLERANCE_PX)
    transfer.pending = false;
  if (transfer.consumed && !transfer.pending) transfer.release();
  return transfer.pending ? transfer.offset : undefined;
}
