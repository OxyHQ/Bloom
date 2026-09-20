import { surfaceFillOn, surfaceTextOn } from '../styles/surface-levels';
import { Platform } from 'react-native';

import { mixColor, resolveButtonRamps } from '../button/shared';
import type { Theme } from '../theme/types';

export const IS_WEB = Platform.OS === 'web';

/**
 * Seconds as a clock: `m:ss` under an hour, `h:mm:ss` from an hour. Fractions
 * are floored (a player at 59.9s has not reached 1:00). Negative, `NaN` and
 * infinite input draw `0:00`.
 */
export function formatDuration(seconds: number): string {
  const total = Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : 0;
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`;
}

/** Every colour the family paints, from the theme only. */
export interface MediaControlsPaint {
  accent: string;
  accentHover: string;
  accentPressed: string;
  onAccent: string;
  inverse: string;
  inverseHover: string;
  onInverse: string;
  text: string;
  textMuted: string;
  /** A neutral wash behind a glyph-only control under the pointer. */
  wash: string;
  rail: string;
  buffered: string;
  badge: string;
  onBadge: string;
  ring: string;
}

export function resolveMediaControlsPaint(theme: Theme): MediaControlsPaint {
  const { accent } = resolveButtonRamps(theme);
  const dark = theme.isDark;
  const { colors } = theme;
  return {
    accent: accent[500],
    accentHover: dark ? accent[400] : accent[600],
    accentPressed: dark ? accent[300] : accent[700],
    onAccent: colors.primaryForeground,
    inverse: colors.text,
    inverseHover: mixColor(colors.text, colors.background, 0.16),
    onInverse: colors.background,
    text: colors.text,
    textMuted: surfaceTextOn(theme, colors.background).textSecondary,
    wash: surfaceFillOn(theme, colors.background),
    rail: colors.contrast50,
    buffered: colors.border,
    badge: surfaceTextOn(theme, colors.background).textSecondary,
    onBadge: colors.background,
    ring: accent[500],
  };
}

// ---------------------------------------------------------------------------
//  Web CSS — focus rings and the hover reveal have no inline-style spelling, so
//  they hang off `dataSet` attributes in one adopted sheet.
// ---------------------------------------------------------------------------

export const MEDIA_CONTROLS_STYLE_ID = 'bloom-media-controls-web-css';

const FOCUSABLE = '[data-bloom-media-focusable]';
const THUMB = '[data-bloom-media-thumb]';
const TRACK = '[data-bloom-media-track]';
const VOLUME = '[data-bloom-volume-control]';
const VOLUME_SLIDER = '[data-bloom-volume-slider]';

export const MEDIA_CONTROLS_CSS = `
${FOCUSABLE} {
  outline: none;
  cursor: pointer;
}
${FOCUSABLE}[aria-disabled="true"] {
  cursor: default;
}
${FOCUSABLE}:focus-visible {
  outline: 2px solid var(--bloom-media-ring, currentColor);
  outline-offset: 2px;
}
${TRACK}:focus-visible {
  outline-offset: 4px;
  border-radius: 4px;
}
${TRACK}:focus-visible ${THUMB} {
  opacity: 1 !important;
}
${TRACK}:focus-visible [data-bloom-media-fill] {
  background-color: var(--bloom-media-accent) !important;
}
${VOLUME}[data-bloom-volume-reveal="hover"] ${VOLUME_SLIDER} {
  opacity: 0;
  transition: opacity 150ms ease-out;
}
${VOLUME}[data-bloom-volume-reveal="hover"]:hover ${VOLUME_SLIDER},
${VOLUME}[data-bloom-volume-reveal="hover"]:focus-within ${VOLUME_SLIDER} {
  opacity: 1;
}
@media (hover: none) {
  ${VOLUME}[data-bloom-volume-reveal="hover"] ${VOLUME_SLIDER} {
    opacity: 1;
  }
}
@media (prefers-reduced-motion: reduce) {
  ${VOLUME} ${VOLUME_SLIDER} {
    transition: none;
  }
}
`;
