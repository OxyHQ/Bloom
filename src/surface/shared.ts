import { Platform } from 'react-native';
import { parseRgba, withAlpha } from '../theme/color-utils';

import {
  SURFACE_LOOKS,
  edgeGlowMask,
  edgeLightFilter,
  materialFilter,
  type SurfaceLook,
} from './optics';

type GlowStop = readonly [px: number, opacity: number];

const white = (opacity: number) => `rgba(255, 255, 255, ${opacity})`;

/**
 * Native has no backdrop to brighten, so it paints the same edge as white light:
 * top and bottom lines that thin out around each corner, over a short glow.
 */
function nativeGlow(stops: readonly GlowStop[]): string {
  const top = stops.map(([px, opacity]) => `${white(opacity)} ${px}px`);
  const bottom = [...stops]
    .reverse()
    .map(([px, opacity]) => `${white(opacity)} calc(100% - ${px}px)`);
  return `linear-gradient(180deg, ${[...top, ...bottom].join(', ')})`;
}

function nativeRim(line: number): string {
  return [`inset 0 1px 0 ${white(line)}`, `inset 0 -1px 0 ${white(line)}`].join(', ');
}

const glowStops = (look: SurfaceLook): GlowStop[] =>
  look.rim.glow.map(([px, gain]) => [px, Math.min(1, gain)] as const);

export const SURFACE_FILTER = materialFilter(SURFACE_LOOKS.light);
export const SURFACE_HIGHLIGHT_FILTER = edgeLightFilter(SURFACE_LOOKS.light);
export const SURFACE_EDGE_GLOW = edgeGlowMask(SURFACE_LOOKS.light.rim);
export const SURFACE_SHEEN_CSS = nativeGlow(glowStops(SURFACE_LOOKS.light));
export const SURFACE_RIM = nativeRim(0.7);

export interface SurfaceOptics {
  filter: string;
  highlightFilter: string;
  glow: string;
  /** Native only. */
  sheenCss: string;
  /** Native only. */
  rim: string;
}

const LIGHT_OPTICS: SurfaceOptics = {
  filter: SURFACE_FILTER,
  highlightFilter: SURFACE_HIGHLIGHT_FILTER,
  glow: SURFACE_EDGE_GLOW,
  sheenCss: SURFACE_SHEEN_CSS,
  rim: SURFACE_RIM,
};
const DARK_OPTICS: SurfaceOptics = {
  filter: materialFilter(SURFACE_LOOKS.dark),
  highlightFilter: edgeLightFilter(SURFACE_LOOKS.dark),
  glow: edgeGlowMask(SURFACE_LOOKS.dark.rim),
  sheenCss: nativeGlow(glowStops(SURFACE_LOOKS.dark)),
  rim: nativeRim(0.4),
};

export function resolveSurfaceOptics(isDark: boolean): SurfaceOptics {
  return isDark ? DARK_OPTICS : LIGHT_OPTICS;
}

/** Radii above this are capsules, whose real corner is half the shorter side. */
const CAPSULE_FROM = 64;
/** The corner assumed when a host's radius comes from a class and cannot be read. */
const DEFAULT_CORNER = 16;

/**
 * How far down each corner reaches, for the edge light's falloff; the shape itself
 * is always the host's own border radius. A capsule's corner reaches half its
 * height, which CSS knows as `50%` of the box, so its radius need not be measured.
 */
function cornerReach(radius: unknown): string {
  if (radius === undefined) return `${DEFAULT_CORNER}px`;
  if (
    typeof radius === 'number' &&
    Number.isFinite(radius) &&
    radius >= 0 &&
    radius <= CAPSULE_FROM
  )
    return `${radius}px`;
  return '50%';
}

/**
 * The CSS variables the web material reads, set on every painting host so none
 * inherits an enclosing surface's values. `edge: false` turns the edge light off
 * for hosts that draw their own border.
 */
export function surfaceOpticsVars(
  optics: SurfaceOptics,
  radius?: unknown,
  edge = true,
): Record<string, string> {
  return {
    '--bloom-surface-filter': optics.filter,
    '--bloom-surface-highlight-filter': edge ? optics.highlightFilter : 'none',
    '--bloom-surface-edge-glow': optics.glow,
    '--bloom-surface-corner-y': cornerReach(radius),
  };
}

/** Every material variable at rest, for a host that paints no material. */
export const SURFACE_VARS_OFF: Record<string, string> = {
  '--bloom-surface-fill': 'transparent',
  '--bloom-surface-filter': 'none',
  '--bloom-surface-highlight-filter': 'none',
};

/**
 * How much of an opaque fill the web material keeps: the rest is the frosted
 * backdrop showing through, which is what makes the blur visible at all.
 */
export const SURFACE_TINT_OPACITY = 0.72;

/**
 * One subtle material: retain explicit alpha; on the web, opaque fills transmit
 * ten percent through the backdrop blur beneath them. Native has no blur under a
 * surface (a `BlurView` inside one can SIGSEGV on Android), so a transmitted
 * tenth would show the content behind unblurred — a bar's labels over a post's
 * text — and an opaque fill stays opaque there.
 */
export function resolveSurfaceTint(fill: string): string {
  if (Platform.OS !== 'web') return fill;
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
