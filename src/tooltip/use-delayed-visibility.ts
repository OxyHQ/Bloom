import { useEffect, useRef, useState } from 'react';

/**
 * A desktop platform's tooltip delay (`useDesktopPlatform()`): a help tag
 * waits about a second under a resting pointer, so one passing over controls
 * on its way somewhere opens nothing.
 */
export const DESKTOP_TOOLTIP_DELAY = 1000;

/**
 * After a desktop tooltip closes, how long the next one opens at once: moving
 * from one control to its neighbour reads their tags in turn without waiting
 * again for each.
 */
export const TOOLTIP_WARM_WINDOW = 500;

// One pointer, so one "a tag was just shown" for every tooltip: how many show
// now, and until when one that closed keeps the next warm.
let showing = 0;
let warmUntil = 0;

function warm(): boolean {
  return showing > 0 || Date.now() < warmUntil;
}

/**
 * `visible`, held back until it has stayed true for `delay` ms: a pointer that only passes over a
 * trigger opens nothing. Closing is immediate, and a delay of 0 is `visible` itself.
 *
 * With `warmStart`, a request while another tooltip shows, or within
 * {@link TOOLTIP_WARM_WINDOW} of one closing, shows at once.
 */
export function useDelayedVisibility(
  visible: boolean,
  delay: number,
  warmStart: boolean = false,
): boolean {
  const [elapsed, setElapsed] = useState(false);
  if (!visible && elapsed) setElapsed(false);
  useEffect(() => {
    if (!visible || delay <= 0) return;
    if (warmStart && warm()) {
      setElapsed(true);
      return;
    }
    const timer = setTimeout(() => setElapsed(true), delay);
    return () => clearTimeout(timer);
  }, [visible, delay, warmStart]);
  const shown = visible && (delay <= 0 || elapsed);
  // Count this tooltip as showing while it does, and keep the next warm once it stops.
  const counted = useRef(false);
  useEffect(() => {
    if (!warmStart || shown === counted.current) return;
    counted.current = shown;
    if (shown) {
      showing += 1;
    } else {
      showing -= 1;
      warmUntil = Date.now() + TOOLTIP_WARM_WINDOW;
    }
  }, [shown, warmStart]);
  useEffect(
    () => () => {
      if (!counted.current) return;
      counted.current = false;
      showing -= 1;
      warmUntil = Date.now() + TOOLTIP_WARM_WINDOW;
    },
    [],
  );
  return shown;
}
