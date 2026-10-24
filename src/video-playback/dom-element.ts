import type { ViewRef } from '../styles/native-refs';

/**
 * The DOM node behind a react-native-web view ref, or `null` before it resolves
 * (and always on native, where a view has no `getBoundingClientRect`).
 */
export function domElementOf(node: ViewRef | null | undefined): Element | null {
  const element = node as unknown as Partial<Element> | null | undefined;
  return element && typeof element.getBoundingClientRect === 'function'
    ? (element as Element)
    : null;
}

/**
 * The view's current viewport centre-Y, or `undefined` without a node: never 0,
 * which is a real position (the top of the viewport). A row whose node had gone
 * mid-unmount ranked as if it sat there and took the slot from the row playing.
 */
export function viewportCenterYOf(node: ViewRef | null | undefined): number | undefined {
  const element = domElementOf(node);
  if (!element) return undefined;
  const rect = element.getBoundingClientRect();
  return rect.y + rect.height / 2;
}
