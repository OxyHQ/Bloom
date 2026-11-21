import type { ReactNode } from 'react';

/**
 * Native: a keyed list as it is. A removed child unmounts at once, and the
 * `exit` of a `MotionView` inside it plays after, as a Reanimated layout
 * animation (`exiting`) on a native snapshot: no JS runs for it.
 * `presence.web.tsx` keeps the child while the web plays it.
 */
export function Presence({ items }: { items: readonly ReactNode[] }): ReactNode {
  return items;
}
Presence.displayName = 'BloomPresence';
