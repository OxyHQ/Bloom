import { resolveScrollElement } from '../scroll/scrollable.web';
import { useLayoutEffect, useRef, useState } from 'react';
import { ServerStyleSheet } from '../styles/ServerStyleSheet';
import { ScrollAreaBar } from './ScrollAreaBar.web';
import type { ScrollBarProps } from './types';

const STYLE_ID = 'bloom-scroll-area-web-css';
/** The native bar is hidden; Bloom's overlay replaces it, so the content never gives it room. */
const CSS = `
[data-bloom-scroll-area] { scrollbar-width: none; }
[data-bloom-scroll-area]::-webkit-scrollbar { display: none; }
`;
const owners = new WeakMap<HTMLElement, { count: number; original: string | null }>();
const THICKNESS = { sm: 4, md: 6 } as const;

function claimIndicator(scroller: HTMLElement) {
  const claim = owners.get(scroller) ?? {
    count: 0,
    original: scroller.getAttribute('data-bloom-scroll-area'),
  };
  claim.count += 1;
  owners.set(scroller, claim);
  scroller.setAttribute('data-bloom-scroll-area', '');
  return () => {
    claim.count -= 1;
    if (claim.count > 0) return;
    owners.delete(scroller);
    if (claim.original === null) scroller.removeAttribute('data-bloom-scroll-area');
    else scroller.setAttribute('data-bloom-scroll-area', claim.original);
  };
}

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
  side = 'end',
  insets,
  offset,
}: ScrollBarProps) {
  const [scroller, setScroller] = useState<HTMLElement | null>(null);
  const claim = useRef<{ node: HTMLElement; release(): void } | null>(null);
  const resolveOwner = () =>
    target === 'document'
      ? ((document.scrollingElement ?? document.documentElement) as HTMLElement)
      : resolveScrollElement(target);
  // Claim the current owner before paint, including a replaced ref. Waiting for
  // passive effects exposed the system bar between document and panel modes.
  useLayoutEffect(() => {
    let cancelled = false;
    const attach = () => {
      const node = resolveOwner();
      if (claim.current?.node !== node) {
        claim.current?.release();
        claim.current = node ? { node, release: claimIndicator(node) } : null;
      }
      if (scroller !== node) setScroller(node);
      return node;
    };
    if (!attach()) {
      // An ancestor ref attaches after child layout effects. Resolve once at
      // the end of this commit, before paint, without a passive-render round trip.
      queueMicrotask(() => {
        if (!cancelled) attach();
      });
    }
    return () => {
      cancelled = true;
    };
  });
  useLayoutEffect(
    () => () => {
      claim.current?.release();
      claim.current = null;
    },
    [],
  );

  return (
    <>
      <ServerStyleSheet id={STYLE_ID} css={CSS} />
      {scrollbar === 'never' ? null : (
        <ScrollAreaBar
          scroller={scroller}
          area={
            target === 'document' && typeof document !== 'undefined'
              ? document.documentElement
              : (scroller?.parentElement ?? null)
          }
          viewport={target === 'document'}
          offset={offset}
          horizontal={Boolean(horizontal)}
          side={side}
          mode={scrollbar}
          thickness={THICKNESS[size]}
          insets={insets}
        />
      )}
    </>
  );
}
