import { Platform } from 'react-native';

import { neutralRamp } from '../button/shared';
import { parseRgba } from '../theme/color-utils';
import type { WebCssStyle } from '../styles/web-view-style';
import type { MediaArtist, RepeatMode, SleepTimerValue, TransportControlsSize } from './types';

export const IS_WEB = Platform.OS === 'web';

// ---------------------------------------------------------------------------
//  Repeat, speed, sleep
// ---------------------------------------------------------------------------

const REPEAT_CYCLE: Record<RepeatMode, RepeatMode> = { off: 'all', all: 'one', one: 'off' };

/** The next mode of the repeat cycle: `off` → `all` → `one` → `off`. */
export function nextRepeatMode(mode: RepeatMode): RepeatMode {
  return REPEAT_CYCLE[mode] ?? 'all';
}

export const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3] as const;
export const SLEEP_TIMER_MINUTES = [5, 10, 15, 30, 45, 60] as const;

/** `1` → `"1×"`, `1.25` → `"1.25×"`, `0.5` → `"0.5×"`. */
export function formatPlaybackRate(rate: number): string {
  return `${Number(rate.toFixed(2))}×`;
}

/** Menu values are strings; a rate or a timer value round-trips through one. */
export function sleepTimerKey(value: SleepTimerValue): string {
  return typeof value === 'number' ? `min-${value}` : value;
}

export function parseSleepTimerKey(key: string): SleepTimerValue {
  if (key === 'off' || key === 'end') return key;
  const minutes = Number(key.replace(/^min-/, ''));
  return Number.isFinite(minutes) && minutes > 0 ? minutes : 'off';
}

export function artistNames(artists: string | MediaArtist[]): string {
  return typeof artists === 'string' ? artists : artists.map((a) => a.name).join(', ');
}

export function isUrl(value: string): boolean {
  return /^(https?:|data:|blob:|file:)/.test(value);
}

// ---------------------------------------------------------------------------
//  Sizes
// ---------------------------------------------------------------------------

export interface TransportGeometry {
  play: 'small' | 'medium' | 'large';
  /** Glyph of a secondary button. */
  glyph: number;
  /** Hit box of a secondary button. */
  box: number;
  /** Glyph of previous / next. */
  skipGlyph: number;
  gap: number;
}

export const TRANSPORT_GEOMETRY: Record<TransportControlsSize, TransportGeometry> = {
  compact: { play: 'small', glyph: 16, box: 32, skipGlyph: 20, gap: 8 },
  regular: { play: 'medium', glyph: 20, box: 32, skipGlyph: 24, gap: 16 },
  large: { play: 'large', glyph: 24, box: 40, skipGlyph: 32, gap: 24 },
};

// ---------------------------------------------------------------------------
//  Contrast — artwork colours arrive from the backend and can be anything.
// ---------------------------------------------------------------------------

function channel(v: number): number {
  const s = v / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

/** WCAG relative luminance of an opaque colour, or `null` if it does not parse. */
export function relativeLuminance(color: string): number | null {
  const c = parseRgba(color);
  if (!c) return null;
  return 0.2126 * channel(c.r) + 0.7152 * channel(c.g) + 0.0722 * channel(c.b);
}

/** WCAG contrast ratio between two opaque colours (1..21); `1` if either does not parse. */
export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  if (la === null || lb === null) return 1;
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

function hex(v: number): string {
  return Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0');
}

/** `color` darkened toward black by `amount` (0..1), as `#rrggbb`. */
export function darken(color: string, amount: number): string | null {
  const c = parseRgba(color);
  if (!c) return null;
  const k = 1 - amount;
  return `#${hex(c.r * k)}${hex(c.g * k)}${hex(c.b * k)}`;
}

/** The two foregrounds the immersive surfaces draw on a tint: body text and secondary text. */
export const IMMERSIVE_TEXT_TARGET = 4.5;

export interface ArtworkTint {
  /** The background to paint, or `null` when the artwork colour is absent / unparseable. */
  background: string | null;
  /** How far toward black the colour was pulled to hold the text (0 = as given). */
  darkened: number;
}

/**
 * The artwork colour, darkened in 5% steps until BOTH `text` and `textMuted`
 * clear 4.5:1 on it. A missing or unparseable colour gives `background: null`
 * — the caller falls back to its neutral surface. Black clears any light
 * foreground, so the loop always ends with a colour.
 */
export function resolveArtworkTint(
  artworkColor: string | undefined,
  text: string,
  textMuted: string,
): ArtworkTint {
  if (!artworkColor || !parseRgba(artworkColor)) return { background: null, darkened: 0 };
  for (let step = 0; step <= 20; step++) {
    const amount = step / 20;
    const bg = darken(artworkColor, amount) as string;
    if (
      contrastRatio(bg, text) >= IMMERSIVE_TEXT_TARGET &&
      contrastRatio(bg, textMuted) >= IMMERSIVE_TEXT_TARGET
    ) {
      return { background: bg, darkened: amount };
    }
  }
  return { background: '#000000', darkened: 1 };
}

/** The dark surface the full-screen gradient ends on: neutral-950 tinted by the theme text. */
export function immersiveBase(themeText: string): string {
  return neutralRamp(themeText)[950];
}

/** A top-to-bottom gradient: `background-image` on web, the native CSS-gradient style elsewhere. */
export function verticalGradient(stops: readonly string[], positions?: readonly number[]): WebCssStyle {
  const list = stops
    .map((c, i) => (positions?.[i] !== undefined ? `${c} ${positions[i]}%` : c))
    .join(', ');
  const image = `linear-gradient(180deg, ${list})`;
  return IS_WEB ? { backgroundImage: image } : { experimental_backgroundImage: image };
}

// ---------------------------------------------------------------------------
//  Web CSS — a link's hover / focus underline has no inline-style spelling.
// ---------------------------------------------------------------------------

export const MEDIA_PLAYER_STYLE_ID = 'bloom-media-player-web-css';

export const MEDIA_PLAYER_CSS = `
[data-bloom-player-link] {
  cursor: pointer;
  outline: none;
}
[data-bloom-player-link]:hover,
[data-bloom-player-link]:focus-visible {
  text-decoration-line: underline;
}
`;
