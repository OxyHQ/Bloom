import { cloneElement, isValidElement, type ReactNode, type ReactElement } from 'react';
import type { FrostedIconButtonSize } from './types';

/** Resolved pixel geometry for a given size prop. */
export interface FrostedGeometry {
  /** Circle diameter (width === height). */
  diameter: number;
  /** Centered box the icon renders inside. */
  iconBox: number;
}

const SIZE_CONFIG: Record<FrostedIconButtonSize, FrostedGeometry> = {
  // 32px (`h-8`) — dense.
  xs: { diameter: 28, iconBox: 16 },
  lg: { diameter: 44, iconBox: 24 },
  sm: { diameter: 32, iconBox: 18 },
  // 36px (`h-9`) — the default comfortable header/overlay action.
  md: { diameter: 36, iconBox: 20 },
};

/**
 * Resolve a `size` prop (preset name or raw pixel diameter) to concrete pixel
 * geometry. A numeric size sets the diameter directly, derives the icon box as
 * `round(size * 0.56)` (min 16px) without introducing a second material implementation.
 * Mirrored byte-for-byte between the native and web forks via this one module.
 */
export function resolveFrostedSize(size: FrostedIconButtonSize | number): FrostedGeometry {
  if (typeof size === 'number') {
    return {
      diameter: size,
      iconBox: Math.max(16, Math.round(size * 0.56)),
    };
  }
  return SIZE_CONFIG[size];
}

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
