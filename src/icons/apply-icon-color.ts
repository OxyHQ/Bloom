import { cloneElement, isValidElement, type ReactNode, type ReactElement } from 'react';
/** A React element that accepts a `fill` prop (Bloom icons, raw SVG). */
type FillableElement = ReactElement<{ fill?: unknown }>;

/**
 * Inject `color` as the icon's `fill` — but only as a FALLBACK: if the caller
 * already set an explicit `fill` on the icon element, it wins and the node is
 * returned untouched. Bloom icons resolve their paint as `fill ?? style.color`,
 * so any bare Bloom icon element gets the theme-aware color for free while an
 * explicitly-colored icon is never overridden. Non-element children (plain
 * text/strings) pass through unchanged.
 *
 * KNOWN LIMIT, deliberately not papered over: an icon component that paints from
 * a `color` PROP rather than from `fill`/`style.color` ignores this entirely, and
 * does so SILENTLY — nothing throws, the glyph renders, it simply never takes the
 * tint. `color` is not injected alongside `fill` because the prop is not ours to
 * claim: components use it for semantic variants (`color="danger"`), so writing an
 * `rgb(…)` string into it can produce a worse failure than the one it fixes, and
 * an icon already carrying its own `color` would be clobbered. Consumers with such
 * a set pre-color the element themselves; the tab bar additionally offers
 * `TabBarItem.activeIcon`, which carries selection by shape instead of by tint.
 */
export function applyIconColor(node: ReactNode, color: string): ReactNode {
  if (!isValidElement(node)) return node;
  const el = node as FillableElement;
  if (el.props.fill != null) return node;
  return cloneElement(el, { fill: color });
}
