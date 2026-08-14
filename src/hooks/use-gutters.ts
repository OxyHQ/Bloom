import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';

import { BREAKPOINTS } from '../styles/breakpoints';
import { space } from '../styles/tokens';

/**
 * A named gutter size, or `0` for no padding on that edge.
 *
 * - `'compact'` — tight gutter (dense lists, chips).
 * - `'base'` — the default page gutter.
 * - `'wide'` — roomy gutter (marketing / hero surfaces).
 */
export type Gutter = 'compact' | 'base' | 'wide' | 0;

/** Resolved edge padding in px — one value per side, ready to spread onto a style. */
export interface Gutters {
  paddingTop: number;
  paddingRight: number;
  paddingBottom: number;
  paddingLeft: number;
}

/** The active viewport tier: the widest matched breakpoint, or `'base'` below `sm`. */
type GutterTier = 'base' | 'sm' | 'md' | 'lg' | 'xl';

/**
 * Per-size gutter padding (px) at each viewport tier. Padding steps up around
 * tablet width (`md`), mirroring the design-system scale: phones get a tighter
 * gutter, wider screens a roomier one. Values come from the shared `space`
 * tokens so gutters stay on the spacing grid.
 */
const GUTTER_SCALE: Record<Exclude<Gutter, 0>, Record<GutterTier, number>> = {
  compact: { base: space.sm, sm: space.sm, md: space.md, lg: space.md, xl: space.md },
  base: { base: space.lg, sm: space.lg, md: space.xl, lg: space.xl, xl: space.xl },
  wide: { base: space.xl, sm: space.xl, md: space._3xl, lg: space._3xl, xl: space._3xl },
};

/** Widest-first breakpoint table so the first match wins. */
const TIERS: ReadonlyArray<readonly [Exclude<GutterTier, 'base'>, number]> = [
  ['xl', BREAKPOINTS.xl],
  ['lg', BREAKPOINTS.lg],
  ['md', BREAKPOINTS.md],
  ['sm', BREAKPOINTS.sm],
];

function resolveTier(width: number): GutterTier {
  for (const [tier, minWidth] of TIERS) {
    if (width >= minWidth) return tier;
  }
  return 'base';
}

function resolveEdge(size: Gutter, tier: GutterTier): number {
  return size === 0 ? 0 : GUTTER_SCALE[size][tier];
}

/**
 * Expand a 1/2/4-arg CSS-shorthand gutter list into `[top, right, bottom, left]`.
 * `??` (not `||`) so an explicit `0` is preserved rather than falling through.
 */
function normalizeShorthand(gutters: Gutter[]): [Gutter, Gutter, Gutter, Gutter] {
  const top = gutters[0] ?? 0;
  const right = gutters[1] ?? top;
  const bottom = gutters[2] ?? top;
  const left = gutters[3] ?? right;
  return [top, right, bottom, left];
}

/**
 * Breakpoint-aware gutter padding. Give it CSS-shorthand gutter sizes and it
 * returns resolved `padding*` values for the current viewport width, recomputed
 * as the window crosses a breakpoint.
 *
 * @example
 * ```tsx
 * const gutters = useGutters(['base']);            // uniform
 * const gutters = useGutters([0, 'wide']);         // no vertical, wide horizontal
 * const gutters = useGutters(['compact', 'base', 0, 'base']); // t / r / b / l
 * <View style={gutters} />
 * ```
 */
export function useGutters(gutters: [Gutter]): Gutters;
export function useGutters(gutters: [Gutter, Gutter]): Gutters;
export function useGutters(gutters: [Gutter, Gutter, Gutter, Gutter]): Gutters;
export function useGutters(gutters: Gutter[]): Gutters {
  const { width } = useWindowDimensions();
  const [top, right, bottom, left] = normalizeShorthand(gutters);

  return useMemo<Gutters>(() => {
    const tier = resolveTier(width);
    return {
      paddingTop: resolveEdge(top, tier),
      paddingRight: resolveEdge(right, tier),
      paddingBottom: resolveEdge(bottom, tier),
      paddingLeft: resolveEdge(left, tier),
    };
  }, [width, top, right, bottom, left]);
}
