import { useEffect, useState } from 'react';
import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import { ScrollAreaBar } from './ScrollAreaBar.web';
import type { ScrollBarProps } from './types';

const STYLE_ID = 'bloom-scroll-area-web-css';
/** The native bar is hidden; Bloom's overlay replaces it, so the content never gives it room. */
const CSS = `
[data-bloom-scroll-area] { scrollbar-width: none; }
[data-bloom-scroll-area]::-webkit-scrollbar { display: none; }
`;
const THICKNESS = { sm: 4, md: 6 } as const;

/**
 * Bloom's scrollbar over a scroller of your own: themed, compact, drawn OVER the content (so it
 * takes no room and nothing moves when it appears), and hidden when it is not needed. It hides
 * the scroller's own bar, mirrors its position onto a thumb that can also be dragged, and goes
 * where the scroller's parent is: place it beside the scroller in a box that is not `static`.
 * `ScrollArea` is a `ScrollView` and one of these; use this directly for a scroller that is not
 * a plain `ScrollView` (a reanimated one).
 */
export function ScrollBar({
  target,
  scrollbar = 'scroll',
  size = 'sm',
  horizontal = false,
  insets,
}: ScrollBarProps) {
  const [scroller, setScroller] = useState<HTMLElement | null>(null);
  useEffect(() => {
    adoptStyleSheet(STYLE_ID, CSS);
  }, []);
  // Every commit: a scroller that remounts is a new node, and the bar must follow it.
  useEffect(() => {
    const node =
      (target.current?.getScrollableNode?.() as unknown as HTMLElement | undefined) ?? null;
    setScroller((was) => (was === node ? was : node));
  });
  useEffect(() => {
    scroller?.setAttribute('data-bloom-scroll-area', '');
    return () => scroller?.removeAttribute('data-bloom-scroll-area');
  }, [scroller]);

  return (
    <ScrollAreaBar
      scroller={scroller}
      area={scroller?.parentElement ?? null}
      horizontal={Boolean(horizontal)}
      mode={scrollbar}
      thickness={THICKNESS[size]}
      insets={insets}
    />
  );
}
