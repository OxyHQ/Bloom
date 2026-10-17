import { useEffect, useRef, type ComponentRef, type RefObject } from 'react';
import { Platform, type View } from 'react-native';
import type { ViewRef } from '../styles/native-refs';

const SCROLLER = '[data-bloom-scroll-area]';

/** Wheel deltas arrive in lines or pages on some browsers; the scroller wants pixels. */
const pixels = (event: WheelEvent, page: number) =>
  event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? page : 1);

/** An element between `from` and `root` that scrolls by itself in this direction (a long field). */
function scrollsItself(from: EventTarget | null, root: HTMLElement, down: boolean): boolean {
  for (let node = from as HTMLElement | null; node && node !== root; node = node.parentElement) {
    const { overflowY } = getComputedStyle(node);
    if ((overflowY !== 'auto' && overflowY !== 'scroll') || node.scrollHeight <= node.clientHeight)
      continue;
    const atEnd = down
      ? node.scrollTop + node.clientHeight >= node.scrollHeight - 1
      : node.scrollTop <= 0;
    if (!atEnd) return true;
  }
  return false;
}

/**
 * The wheel works from anywhere in the chat, not only over its transcript. The header and the
 * composer float over the thread, so a wheel over them reaches no scroller; this hands it to the
 * thread's. A field that scrolls by itself (a long draft in the composer) keeps its own wheel until
 * it is at its end, and a pinch-zoom (`ctrlKey`) is left to the browser. Web only; native scrolls
 * by touch, which the platform delivers to the thread.
 *
 * Give the returned ref to the root of the chat.
 */
export function useWheelForwarding(): RefObject<ViewRef | null> {
  const root = useRef<ComponentRef<typeof View>>(null);
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const el = root.current as unknown as HTMLElement | null;
    if (!el?.addEventListener) return;
    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey || event.deltaY === 0) return;
      const scroller = el.querySelector<HTMLElement>(SCROLLER);
      if (!scroller || scroller.contains(event.target as Node)) return;
      const down = event.deltaY > 0;
      if (scrollsItself(event.target, el, down)) return;
      const before = scroller.scrollTop;
      scroller.scrollTop += pixels(event, scroller.clientHeight);
      if (scroller.scrollTop !== before) event.preventDefault();
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);
  return root;
}
