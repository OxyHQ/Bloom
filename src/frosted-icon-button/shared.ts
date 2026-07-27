import { cloneElement, isValidElement, type ReactNode, type ReactElement } from 'react';

import { withAlpha } from '../theme/color-utils';
import type { ThemeColors } from '../theme/types';
import type { FrostedIconButtonSize } from './types';

/** Resolved pixel geometry for a given size prop. */
export interface FrostedGeometry {
  /** Circle diameter (width === height). */
  diameter: number;
  /** Centered box the icon renders inside. */
  iconBox: number;
  /** Backdrop-blur radius in px (web) — scaled for BlurView intensity on native. */
  blur: number;
}

const SIZE_CONFIG: Record<FrostedIconButtonSize, FrostedGeometry> = {
  // 32px (`h-8`) — dense.
  sm: { diameter: 32, iconBox: 18, blur: 10 },
  // 36px (`h-9`) — the default comfortable header/overlay action.
  md: { diameter: 36, iconBox: 20, blur: 12 },
};

/**
 * Resolve a `size` prop (preset name or raw pixel diameter) to concrete pixel
 * geometry. A numeric size sets the diameter directly, derives the icon box as
 * `round(size * 0.56)` (min 16px) and scales the blur radius with the diameter.
 * Mirrored byte-for-byte between the native and web forks via this one module.
 */
export function resolveFrostedSize(size: FrostedIconButtonSize | number): FrostedGeometry {
  if (typeof size === 'number') {
    return {
      diameter: size,
      iconBox: Math.max(16, Math.round(size * 0.56)),
      blur: Math.max(8, Math.round(size * 0.34)),
    };
  }
  return SIZE_CONFIG[size];
}

/**
 * Per-mode alpha weights for the translucent surface + hairline ring.
 *
 * These are calibrated so the chip READS on a SOLID background independently of
 * any content behind it: on a dark theme the surface is a LOW-OPACITY LIGHT tint
 * of the foreground token (lighter than the near-black page — NOT a dark `card`
 * fill that sinks into the background), and on a light theme it is a subtle dark
 * tint. E.g. on a `rgb(11 11 15)` page a `rgba(237,237,237,0.14)` surface
 * composites to ≈`rgb(43 43 47)` — a clearly visible frosted circle.
 */
const SURFACE_ALPHA = { light: 0.06, dark: 0.14 } as const;
const SURFACE_ALPHA_HOVER = { light: 0.1, dark: 0.22 } as const;
const RING_ALPHA = { light: 0.12, dark: 0.22 } as const;
const RING_ALPHA_HOVER = { light: 0.18, dark: 0.3 } as const;

/** Theme-aware colors for every frosted-button surface state. */
export interface FrostedPalette {
  /** Translucent surface at rest. */
  surface: string;
  /** Translucent surface on hover / press (slightly lighter). */
  surfaceHover: string;
  /** Hairline ring/border at rest. */
  ring: string;
  /** Hairline ring/border on hover / press. */
  ringHover: string;
  /** Icon color when frosted (rest). */
  icon: string;
  /** Opaque surface for the solid `active` state. */
  activeSurface: string;
  /** Icon color when `active`. */
  activeIcon: string;
  /** Focus-ring color (web `:focus-visible` outline). */
  focusRing: string;
  /**
   * Soft drop shadow color. Intentionally kept in BOTH modes (never
   * `dark:shadow-none`) so the chip has an edge over an image and reads as a
   * distinct button. The token already carries its own alpha.
   */
  shadow: string;
}

/**
 * Build the frosted palette from the resolved theme colors. Everything is
 * derived from Bloom tokens (`text`/foreground, `primary`, `shadow`) so it is
 * fully theme-aware and Oxy-agnostic — no hardcoded colors.
 */
export function resolveFrostedPalette(colors: ThemeColors, isDark: boolean): FrostedPalette {
  const k = isDark ? 'dark' : 'light';
  return {
    surface: withAlpha(colors.text, SURFACE_ALPHA[k]),
    surfaceHover: withAlpha(colors.text, SURFACE_ALPHA_HOVER[k]),
    ring: withAlpha(colors.text, RING_ALPHA[k]),
    ringHover: withAlpha(colors.text, RING_ALPHA_HOVER[k]),
    icon: colors.text,
    activeSurface: colors.primary,
    activeIcon: colors.primaryForeground,
    focusRing: colors.primary,
    shadow: colors.shadow,
  };
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
