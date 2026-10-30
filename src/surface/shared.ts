import { Platform } from 'react-native';
import { parseRgba, withAlpha } from '../theme/color-utils';
import { quietText } from '../styles/color-contrast';

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
 * Where an Android inset shadow `inset 0 Y B -B` reaches half its colour, as a
 * share of `B` back from `Y`; it is clear again at about `Y`. Measured on React
 * Native 0.88's Android renderer.
 */
const INSET_HALF_BACK = 0.82;

/**
 * Native has no backdrop to brighten, so it paints the same edge as white light:
 * top and bottom lines that thin out around each corner, over a short glow.
 *
 * The glow is two inset shadows, one from each edge, never a gradient: a
 * gradient can only place a stop at a fixed depth in `px`, which React Native
 * draws past the end of a short host, and the Android emulator's renderer
 * crashes on such gradients (a SIGSEGV in its render thread, on the first
 * frame). An inset shadow keeps to the host at any height, follows its corners,
 * and fades out along the sides as the measured edge light does.
 */
function nativeGlow(stops: readonly GlowStop[]): string {
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
  const edge = (sign: string) => `inset 0 ${sign}${reach}px ${blur}px -${blur}px ${white(gain)}`;
  return `${edge('')}, ${edge('-')}`;
}

function nativeRim(line: number): string {
  return [`inset 0 1px 0 ${white(line)}`, `inset 0 -1px 0 ${white(line)}`].join(', ');
}

const glowStops = (look: SurfaceLook): GlowStop[] =>
  look.rim.glow.map(([px, gain]) => [px, Math.min(1, gain)] as const);

export const SURFACE_FILTER = materialFilter(SURFACE_LOOKS.light);
export const SURFACE_HIGHLIGHT_FILTER = edgeLightFilter(SURFACE_LOOKS.light);
export const SURFACE_EDGE_GLOW = edgeGlowMask(SURFACE_LOOKS.light.rim);
export const SURFACE_SHEEN_SHADOW = nativeGlow(glowStops(SURFACE_LOOKS.light));
export const SURFACE_RIM = nativeRim(0.7);

export interface SurfaceOptics {
  filter: string;
  highlightFilter: string;
  glow: string;
  /** Native only: the edge glow, as inset shadows. */
  sheenShadow: string;
  /** Native only. */
  rim: string;
}

const LIGHT_OPTICS: SurfaceOptics = {
  filter: SURFACE_FILTER,
  highlightFilter: SURFACE_HIGHLIGHT_FILTER,
  glow: SURFACE_EDGE_GLOW,
  sheenShadow: SURFACE_SHEEN_SHADOW,
  rim: SURFACE_RIM,
};
const DARK_OPTICS: SurfaceOptics = {
  filter: materialFilter(SURFACE_LOOKS.dark),
  highlightFilter: edgeLightFilter(SURFACE_LOOKS.dark),
  glow: edgeGlowMask(SURFACE_LOOKS.dark.rim),
  sheenShadow: nativeGlow(glowStops(SURFACE_LOOKS.dark)),
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
  '--bloom-surface-solid': 'transparent',
  '--bloom-surface-hairline': 'transparent',
  '--bloom-surface-filter': 'none',
  '--bloom-surface-highlight-filter': 'none',
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
