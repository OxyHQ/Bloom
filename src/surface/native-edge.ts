/**
 * The native edge as numbers: no React Native here, so a generator can read it
 * (`scripts/native-theme-kotlin.ts` writes it into Bloom's native runtime). `shared.ts` writes the
 * same edge as React Native `boxShadow`s.
 */
import { SURFACE_LOOKS, type SurfaceLook } from './optics';

export type GlowStop = readonly [px: number, opacity: number];

/**
 * Where an Android inset shadow `inset 0 Y B -B` reaches half its colour, as a
 * share of `B` back from `Y`; it is clear again at about `Y`. Measured on React
 * Native 0.88's Android renderer.
 */
export const INSET_HALF_BACK = 0.82;

/** The native glow's inset shadow: how far in it reaches, its blur, and its white's opacity. */
export function nativeGlowShadow(stops: readonly GlowStop[]): {
  reach: number;
  blur: number;
  gain: number;
} {
  const gain = stops[0]?.[1] ?? 0;
  const reach = stops[stops.length - 1]?.[0] ?? 0;
  let halfDepth = reach;
  for (let index = 1; index < stops.length; index++) {
    const [x0, g0] = stops[index - 1] ?? [0, gain];
    const [x1, g1] = stops[index] ?? [reach, 0];
    if (g1 > gain / 2) continue;
    halfDepth = g0 === g1 ? x1 : x0 + ((x1 - x0) * (g0 - gain / 2)) / (g0 - g1);
    break;
  }
  const blur = Math.round(((reach - halfDepth) / INSET_HALF_BACK) * 100) / 100;
  return { reach, blur, gain };
}

export const glowStops = (look: SurfaceLook): GlowStop[] =>
  look.rim.glow.map(([px, gain]) => [px, Math.min(1, gain)] as const);

/** The native rim's white, per scheme: a 1px line at the top and bottom edges. */
export const NATIVE_RIM_LINE = { light: 0.7, dark: 0.4 } as const;

/**
 * The native edge per scheme: the rim's line (`inset 0 ±1px 0`, white at `rimLine`) and the sheen's
 * two inset shadows (`inset 0 ±reach blur -blur`, white at `gain`). A renderer that draws the
 * edge itself (Bloom's native runtime, Compose) takes these.
 */
export const NATIVE_SURFACE_EDGE = {
  light: {
    rimLine: NATIVE_RIM_LINE.light,
    sheen: nativeGlowShadow(glowStops(SURFACE_LOOKS.light)),
  },
  dark: { rimLine: NATIVE_RIM_LINE.dark, sheen: nativeGlowShadow(glowStops(SURFACE_LOOKS.dark)) },
} as const;
