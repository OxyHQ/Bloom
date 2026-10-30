import { useEffect, useRef } from 'react';

/**
 * Whether this render lays out for another room than the last one committed:
 * `room` keys the sizes a layout is resolved from (the group's measured width,
 * the shell's, the axis they give). A window or container resizing changes it;
 * a panel shown, hidden or resized by the user does not.
 *
 * Geometry the room changed lands at once, as a live resize lays a window out
 * (macOS, Android's multi-window resize): panes animating toward a size the
 * window already has trail its edge and leave content outside the window for
 * the animation's length.
 */
export function useRoomChanged(room: string): boolean {
  const committed = useRef(room);
  useEffect(() => {
    committed.current = room;
  }, [room]);
  return committed.current !== room;
}
