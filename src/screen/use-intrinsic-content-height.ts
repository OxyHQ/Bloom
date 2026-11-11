import { useCallback, useLayoutEffect, useRef } from 'react';
import { useScreenContext, useScreenViewport } from './context';

/** Existing content-layout callbacks publish a metric; this hook never observes or sizes layout. */
export function useIntrinsicContentHeight() {
  const viewport = useScreenViewport();
  const screen = useScreenContext();
  const source = useRef({});
  const active = viewport?.active !== false;
  const publish = viewport?.metrics.intrinsicContentHeight
    ? viewport.setIntrinsicContentHeight
    : undefined;
  const contentNode = useRef<HTMLElement | null>(null);
  const measure = useCallback(
    (height: number, node?: HTMLElement | null) => {
      if (!active || !publish) return;
      if (node) contentNode.current = node;
      const root = viewport?.contentRef?.current;
      if (node) {
        // The content's own box includes list headers, footers and padding.
        // Its offset includes preceding content; only ancestor bottom padding
        // remains. Never substitute scrollHeight, whose minimum is the viewport.
        if (
          !(root instanceof HTMLElement) ||
          !root.contains(node) ||
          !node.getClientRects().length
        ) {
          publish(source.current, -1);
          return;
        }
        const style = getComputedStyle(node);
        if (Number.parseFloat(style.flexGrow) > 0 || Number.parseFloat(style.minHeight) > 0) {
          publish(source.current, -1);
          return;
        }
        height += node.getBoundingClientRect().top - root.getBoundingClientRect().top;
        let parent = node.parentElement;
        while (parent) {
          height += Number.parseFloat(getComputedStyle(parent).paddingBottom) || 0;
          if (parent === root) break;
          parent = parent.parentElement;
        }
      }
      publish(source.current, Number.isFinite(height) && height >= 0 ? height : -1);
    },
    [active, publish, viewport?.contentRef, screen?.topInset, screen?.bottomInset],
  );
  useLayoutEffect(() => {
    if (!active || !publish) return;
    publish(source.current, -1);
    const node = contentNode.current;
    if (node) measure(node.offsetHeight, node);
    return () => publish(source.current, null);
  }, [active, publish, measure]);
  return publish ? measure : undefined;
}
