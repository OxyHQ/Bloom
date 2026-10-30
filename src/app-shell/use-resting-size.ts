import { useCallback, useEffect, useRef, useState } from 'react';
import { useSharedValue, type SharedValue } from 'react-native-reanimated';

export interface RestingSize {
  /** The size React lays out while nothing moves: a style prop of this render. */
  rest: number;
  /** 1 while an animation (or a drag's preview) owns the size, 0 at rest. */
  moving: SharedValue<number>;
  /** An animation toward `size` finished: React takes the size over. */
  landed: (size: number) => void;
}

/**
 * A size that React lays out at rest and Reanimated only while it moves.
 *
 * Reanimated keeps an animated style's last values and hands them back to React
 * as the view's final style (settled props), so a size that rests in an animated
 * style outlives the render that changed it: a window growing showed its panes
 * at their previous width for a commit, until the shared value caught up. Here
 * the resting size is a plain style (`rest`), in the very commit that changes
 * it when `immediate` (the room changed, or reduced motion), and the animated
 * style only overrides it while `moving`, resting at values that defer to it
 * (`flexBasis: 'auto'`, `minWidth: 0`, `maxWidth: '100%'`).
 *
 * The caller animates its own shared value: it sets `moving` before an
 * animation that is not immediate and calls `landed` (through `runOnJS`) when
 * it finishes; React then rests at the new size and `moving` drops once that
 * render is committed, so the hand-over shows the same size twice.
 */
export function useRestingSize(target: number, immediate: boolean): RestingSize {
  const [rest, setRest] = useState(target);
  // Adjusted while rendering: React lays this render out again before committing it.
  if (immediate && rest !== target) setRest(target);
  const moving = useSharedValue(0);
  const resting = useRef(rest);
  resting.current = rest;
  const landed = useCallback(
    (size: number) => {
      if (size === resting.current) moving.value = 0;
      else setRest(size);
    },
    [moving],
  );
  useEffect(() => {
    if (rest === target) moving.value = 0;
  }, [rest, target, moving]);
  return { rest, moving, landed };
}
