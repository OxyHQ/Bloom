import { Platform } from 'react-native';
import { parseRgba, withAlpha } from '../theme/color-utils';
import { mixColors, quietText } from '../styles/color-contrast';

import { SURFACE_LOOKS, materialFilter, bodyRelief, rimLight } from './optics';
export { controlReliefScale } from './optics';

export const SURFACE_FILTER = materialFilter(SURFACE_LOOKS.light);
export const SURFACE_SHEEN_SHADOW = bodyRelief(SURFACE_LOOKS.light);
export const SURFACE_RIM = rimLight(SURFACE_LOOKS.light);

export interface SurfaceOptics {
  filter: string;
  /** Full contour and the two fine edge reflections. */
  rim: string;
  /** Broad shoulder and inner trough, kept inside the shape. */
  sheenShadow: string;
}

const LIGHT_OPTICS: SurfaceOptics = {
  filter: SURFACE_FILTER,
  rim: SURFACE_RIM,
  sheenShadow: SURFACE_SHEEN_SHADOW,
};
const DARK_OPTICS: SurfaceOptics = {
  filter: materialFilter(SURFACE_LOOKS.dark),
  rim: rimLight(SURFACE_LOOKS.dark),
  sheenShadow: bodyRelief(SURFACE_LOOKS.dark),
};

export function resolveSurfaceOptics(isDark: boolean, lightingScale = 1): SurfaceOptics {
  const optics = isDark ? DARK_OPTICS : LIGHT_OPTICS;
  return lightingScale === 1
    ? optics
    : {
        ...optics,
        sheenShadow: bodyRelief(isDark ? SURFACE_LOOKS.dark : SURFACE_LOOKS.light, lightingScale),
      };
}

/** Identical decoration for native, live web and baked web bodies. */
export function surfaceLighting(optics: SurfaceOptics, rim = true, sheen = true): string {
  return (
    [rim ? optics.rim : null, sheen ? optics.sheenShadow : null].filter(Boolean).join(', ') ||
    'none'
  );
}

export const SURFACE_LIGHTING = surfaceLighting(LIGHT_OPTICS);

/**
 * Conservative body-lighting bounds for copy over additional artwork. The fine
 * contour sits at the perimeter; these are the shoulder/trough that can reach
 * content. Callers combine these shared bounds with their own painted artwork.
 */
export function surfaceLightingFills(fill: string, isDark: boolean): readonly string[] {
  const { relief } = isDark ? SURFACE_LOOKS.dark : SURFACE_LOOKS.light;
  return [fill, mixColors(fill, '#ffffff', relief.light), mixColors(fill, '#000000', relief.shade)];
}

/** Reset lighting on every painting host, including explicit rim/sheen opt-outs. */
export function surfaceOpticsVars(
  optics: SurfaceOptics,
  rim = true,
  sheen = true,
): Record<string, string> {
  return {
    '--bloom-surface-filter': optics.filter,
    '--bloom-surface-lighting': surfaceLighting(optics, rim, sheen),
  };
}

/** Every material variable at rest, for a host that paints no material. */
export const SURFACE_VARS_OFF: Record<string, string> = {
  '--bloom-surface-lighting': 'none',
  '--bloom-surface-fill': 'transparent',
  '--bloom-surface-solid': 'transparent',
  '--bloom-surface-hairline': 'transparent',
  '--bloom-surface-filter': 'none',
};

/**
 * How much of an opaque fill the web material keeps: the rest is the frosted
 * backdrop showing through, which is what makes the blur visible at all.
 */
export const SURFACE_TINT_OPACITY = 0.72;

/**
 * One subtle material: retain explicit alpha; on the web, opaque fills keep
 * `SURFACE_TINT_OPACITY` and let the rest of the frosted backdrop through. Native
 * has no blur under a surface (a `BlurView` inside one can SIGSEGV on Android), so
 * a transmitted share would show the content behind unblurred (a bar's labels
 * over a post's text), and an opaque fill stays opaque there.
 */
export function resolveSurfaceTint(fill: string): string {
  if (Platform.OS !== 'web') return fill;
  return translucentTint(fill);
}

/**
 * An opaque fill at `SURFACE_TINT_OPACITY`, for a body with a blur under it (the
 * web's, and an iOS floating surface's); an explicit alpha is kept.
 */
export function translucentTint(fill: string): string {
  const parsed = parseRgba(fill);
  return parsed?.a === 1 ? withAlpha(fill, SURFACE_TINT_OPACITY) : fill;
}

/** Estimate the backing descendants see by compositing tint onto its parent. */
export function resolveSurfaceFill(fill: string, backdrop: string): string {
  if (fill.trim().toLowerCase() === 'transparent') return backdrop;
  const tint = parseRgba(fill);
  const base = parseRgba(backdrop);
  if (!tint || !base || tint.a === 1) return fill;
  const channel = (front: number, back: number) => Math.round(front * tint.a + back * (1 - tint.a));
  return `rgb(${channel(tint.r, base.r)}, ${channel(tint.g, base.g)}, ${channel(tint.b, base.b)})`;
}

/** Whether a fill paints nothing, so its host has no surface to put material on. */
export function isClearFill(fill: string | undefined | null): boolean {
  if (fill == null) return true;
  if (fill.trim().toLowerCase() === 'transparent') return true;
  return parseRgba(fill)?.a === 0;
}

/** A translucent fill over its backing, as one opaque colour; a clear fill stays clear. */
export function compositeOnto(fill: string, backing: string): string {
  const alpha = parseRgba(fill)?.a;
  return alpha === undefined || alpha === 0 ? fill : resolveSurfaceFill(fill, backing);
}

/**
 * A colour at `factor` of its own alpha: how a control on the material dims a
 * stroke when disabled, since dimming its host with `opacity` would make the
 * host the material's backdrop root.
 */
export function dimColor(color: string, factor: number): string {
  const parsed = parseRgba(color);
  return parsed ? `rgba(${parsed.r}, ${parsed.g}, ${parsed.b}, ${parsed.a * factor})` : color;
}

/**
 * WCAG 1.4.11's floor for a graphical object against what is next to it: the
 * hairline a surface draws when contrast is increased.
 */
export const SURFACE_CONTRAST_EDGE_RATIO = 3;

/**
 * The edge a surface draws when contrast is increased, instead of the edge
 * light: the quietest mix of its body toward the theme's text that still holds
 * {@link SURFACE_CONTRAST_EDGE_RATIO} against the body. A clear body has no edge.
 */
export function surfaceContrastEdge(body: string, text: string): string {
  if (isClearFill(body)) return 'transparent';
  return quietText(body, text, SURFACE_CONTRAST_EDGE_RATIO);
}
