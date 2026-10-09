import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { Platform, type View, type ViewStyle } from 'react-native';
import { WEB_POSITION_FIXED } from '../styles/web-view-style';

/** A document footer follows its column without owning the page's scroller. */
export function useDocumentAnchor(documentPosition: boolean) {
  const enabled = documentPosition && Platform.OS === 'web';
  const ref = useRef<View>(null);
  const [bounds, setBounds] = useState<{ left: number; width: number } | null>(null);
  const measure = useCallback(() => {
    const node: unknown = ref.current;
    if (!enabled || typeof HTMLElement === 'undefined' || !(node instanceof HTMLElement)) return;
    const rect = node.getBoundingClientRect();
    if (!Number.isFinite(rect.left) || !Number.isFinite(rect.width)) return;
    setBounds(previous => previous?.left === rect.left && previous.width === rect.width
      ? previous : { left: rect.left, width: rect.width });
  }, [enabled]);

  useLayoutEffect(() => {
    const node: unknown = ref.current;
    if (!enabled || typeof HTMLElement === 'undefined' || !(node instanceof HTMLElement)) return;
    measure();
    // A sibling rail can change this column's offset without changing its
    // width. Observe the ancestor frames as well as the anchor itself.
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
    // Direction/class changes may move a column without resizing any frame.
    const attributes = typeof MutationObserver === 'undefined' ? null : new MutationObserver(measure);
    for (let current: HTMLElement | null = node; current; current = current.parentElement) {
      observer?.observe(current);
      attributes?.observe(current, { attributes: true, attributeFilter: ['dir', 'class', 'style'] });
    }
    window.addEventListener('resize', measure);
    // Horizontal document scrolling changes the viewport coordinate. Equality
    // above prevents ordinary vertical scrolling from scheduling a React render.
    window.addEventListener('scroll', measure, { passive: true });
    return () => {
      observer?.disconnect();
      attributes?.disconnect();
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure);
    };
  }, [enabled, measure]);

  const style: ViewStyle | undefined = enabled ? {
    position: WEB_POSITION_FIXED,
    left: bounds?.left ?? 0,
    right: undefined,
    width: bounds?.width ?? 0,
    opacity: bounds ? 1 : 0,
  } : undefined;
  return { enabled, ref, measure, style };
}
