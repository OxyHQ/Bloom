import { Platform } from 'react-native';

import { mixColor, resolveButtonRamps } from '../button/shared';
import { oklchToSrgb, srgbToOklch, srgbToRgbString } from '../theme/color-space';
import { parseRgba } from '../theme/color-utils';
import type { Theme } from '../theme/types';
import type { TypeScaleVariant } from '../typography/scale';
import { TYPE_SCALE } from '../typography/scale';
import type { WebCssStyle } from '../styles/web-view-style';
import {
  AA_TEXT_CONTRAST,
  contrastRatio,
  readableOn,
  relativeLuminance,
} from '../styles/color-contrast';

export const IS_WEB = Platform.OS === 'web';

/** A header lays its cover beside the text from this container width. */
export const MEDIA_HEADER_WIDE_MIN_WIDTH = 600;


// ---------------------------------------------------------------------------
//  Contrast
// ---------------------------------------------------------------------------


// ---------------------------------------------------------------------------
//  The band — every colour a header paints
// ---------------------------------------------------------------------------

/**
 * The artwork colour clamped into a band that always carries readable text.
 *
 *            lightness (OKLCH)   chroma
 *   light    0.66 .. 0.84        ≤ 0.14
 *   dark     0.30 .. 0.44        ≤ 0.14
 *
 * The hue is kept; a vivid or near-black artwork colour is pulled towards the
 * page's own lightness, which is what "tinted towards the page background"
 * means. `null` when the colour is absent or unparsable.
 */
export function tintArtworkColor(color: string | null | undefined, dark: boolean): string | null {
  if (!color) return null;
  const rgba = parseRgba(color);
  if (!rgba) return null;
  const { l, c, h } = srgbToOklch(rgba);
  const [min, max] = dark ? [0.3, 0.44] : [0.66, 0.84];
  let chroma = Math.min(c, 0.14);
  const lightness = Math.min(max, Math.max(min, l));
  // Reduce chroma until the colour fits sRGB, keeping hue and lightness.
  for (let i = 0; i < 24; i++) {
    const rgb = oklchToSrgb({ l: lightness, c: chroma, h });
    const back = srgbToOklch(rgb);
    if (Math.abs(back.l - lightness) < 0.01 && Math.abs(back.c - chroma) < 0.01) {
      return srgbToRgbString(rgb);
    }
    chroma *= 0.9;
  }
  return srgbToRgbString(oklchToSrgb({ l: lightness, c: chroma, h }));
}

export interface MediaHeaderPaint {
  /** `true` when no usable artwork colour was given and the band is neutral. */
  fallback: boolean;
  /** The band's top colour — the tinted artwork colour (or the neutral step). */
  bandTop: string;
  /** The band's bottom colour, where the actions area begins its fade to the page. */
  bandBottom: string;
  /** The page background the actions area fades into. */
  background: string;
  /** Text on the band — the theme's text or background colour, whichever reads better over BOTH ends. */
  onBand: string;
  /** Secondary text on the band, as far from `onBand` as AA allows. */
  onBandMuted: string;
  /** A progress rail drawn on the band. */
  bandRail: string;
  /** The sticky top bar's fill and its text. */
  bar: string;
  onBar: string;
  text: string;
  textMuted: string;
  /** Hover wash behind glyph-only controls and rows. */
  wash: string;
  /** Hairline for outline pills and cards. */
  border: string;
  borderHover: string;
  card: string;
  accent: string;
  onAccent: string;
  ring: string;
  /** Cover placeholder fill and glyph. */
  placeholder: string;
  placeholderGlyph: string;
  /** Rail of a progress bar. */
  rail: string;
  /** The drop shadow under a cover. */
  coverShadow: string;
}

/**
 * Resolve a header's colours. Pure — walkable over every preset × mode × artwork
 * colour without rendering.
 */
export function resolveMediaHeaderPaint(
  theme: Theme,
  artworkColor?: string | null,
): MediaHeaderPaint {
  const { accent, neutral: n } = resolveButtonRamps(theme);
  const { colors } = theme;
  const dark = theme.isDark;
  const tinted = tintArtworkColor(artworkColor, dark);
  const fallback = tinted === null;
  const bandTop = tinted ?? (dark ? n[800] : n[200]);
  const bandBottom = mixColor(colors.background, bandTop, 0.55);

  const onBand = readableOn([bandTop, bandBottom], [colors.text, colors.background]);
  // Walk the secondary text towards the band until one more step would fail AA.
  let onBandMuted = onBand;
  for (let t = 0.04; t <= 0.4; t += 0.04) {
    const candidate = mixColor(onBand, bandTop, t);
    const worst = Math.min(contrastRatio(candidate, bandTop), contrastRatio(candidate, bandBottom));
    if (worst < AA_TEXT_CONTRAST + 0.25) break;
    onBandMuted = candidate;
  }

  return {
    fallback,
    bandTop,
    bandBottom,
    background: colors.background,
    onBand,
    onBandMuted,
    bandRail: mixColor(bandTop, onBand, 0.2),
    bar: bandTop,
    onBar: readableOn([bandTop], [colors.text, colors.background]),
    text: colors.text,
    textMuted: dark ? n[400] : n[500],
    wash: dark ? n[800] : n[100],
    border: dark ? n[600] : n[300],
    borderHover: colors.text,
    card: dark ? n[900] : n[100],
    accent: accent[500],
    onAccent: colors.primaryForeground,
    ring: accent[500],
    placeholder: dark ? n[800] : n[200],
    placeholderGlyph: dark ? n[500] : n[400],
    rail: dark ? n[700] : n[200],
    coverShadow: dark ? '0 8px 24px rgba(0, 0, 0, 0.5)' : '0 8px 24px rgba(0, 0, 0, 0.18)',
  };
}

/** The liked-songs cover and band: a diagonal accent gradient. */
export function resolveLikedGradient(theme: Theme): readonly [string, string] {
  const { accent } = resolveButtonRamps(theme);
  return [accent[700], accent[300]];
}

/** A linear gradient as a style: `background-image` on web, the native CSS-gradient style elsewhere. */
export function gradientStyle(stops: readonly string[], angle = 180): WebCssStyle {
  const image = `linear-gradient(${angle}deg, ${stops.join(', ')})`;
  return IS_WEB ? { backgroundImage: image } : { experimental_backgroundImage: image };
}

// ---------------------------------------------------------------------------
//  Title size
// ---------------------------------------------------------------------------

/**
 * The steps a header title shrinks through, largest first, each with the
 * number of lines it may take before the next step down is chosen.
 */
export const TITLE_STEPS: readonly { variant: TypeScaleVariant; lines: number }[] = [
  { variant: 'large-title-bold', lines: 1 },
  { variant: 'display-1-bold', lines: 1 },
  { variant: 'display-2-bold', lines: 2 },
  { variant: 'display-3-bold', lines: 2 },
  { variant: 'display-4-bold', lines: 2 },
  { variant: 'title-1-bold', lines: 3 },
];

/** Average advance of a bold sans glyph, as a fraction of the font size. */
export const TITLE_GLYPH_RATIO = 0.56;

/** Below this width the largest step is `display-4` — a phone never gets a 64px title. */
export const TITLE_COMPACT_WIDTH = 480;

/**
 * The display step for a title in `width` px of line: the largest step whose
 * estimated wrapped line count fits that step's allowance. The estimate is a
 * glyph-ratio sum rather than a measurement, so it is stable on first render
 * and identical on both platforms; the title still wraps if it is off.
 */
export function selectTitleVariant(title: string, width: number): TypeScaleVariant {
  const chars = Array.from(title.trim()).length;
  const start = width < TITLE_COMPACT_WIDTH ? TITLE_STEPS.findIndex((s) => s.variant === 'display-4-bold') : 0;
  for (let i = start; i < TITLE_STEPS.length - 1; i++) {
    const step = TITLE_STEPS[i]!;
    const estimated = chars * TYPE_SCALE[step.variant].fontSize * TITLE_GLYPH_RATIO;
    if (Math.ceil(estimated / Math.max(1, width)) <= step.lines) return step.variant;
  }
  return TITLE_STEPS[TITLE_STEPS.length - 1]!.variant;
}

// ---------------------------------------------------------------------------
//  Web CSS — focus rings and link underline on hover
// ---------------------------------------------------------------------------

export const MEDIA_HEADER_STYLE_ID = 'bloom-media-header-web-css';

export const MEDIA_HEADER_CSS = `
[data-bloom-media-header-press] {
  outline: none;
  cursor: pointer;
}
[data-bloom-media-header-press][aria-disabled="true"] {
  cursor: default;
}
[data-bloom-media-header-press]:focus-visible {
  outline: 2px solid var(--bloom-media-header-ring, currentColor);
  outline-offset: 2px;
}
[data-bloom-media-header-press="inset"]:focus-visible {
  outline-offset: -2px;
}
[data-bloom-media-header-link]:hover [data-bloom-media-header-link-text] {
  text-decoration-line: underline;
}
[data-bloom-media-header-fade] {
  transition: opacity 200ms ease-out;
}
@media (prefers-reduced-motion: reduce) {
  [data-bloom-media-header-fade] {
    transition: none;
  }
}
`;

export { contrastRatio, relativeLuminance };
