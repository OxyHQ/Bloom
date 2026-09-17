/**
 * The colours and web CSS every map piece shares.
 *
 *                      light              dark
 *   surface            card               neutral-800
 *   hairline           neutral-200        neutral-700
 *   hover hairline     neutral-300        neutral-500
 *   hover surface      neutral-100        neutral-700 @60% over neutral-800
 *   label              text-primary       text-primary
 *   active fill        text-primary       text-primary      (inverted)
 *   active label       card               neutral-900
 *   visited fill       neutral-100        neutral-900
 *   visited hairline   neutral-200        neutral-700
 *   visited label      neutral-500        neutral-400
 *   saved heart        red-500            red-500
 *   saved heart, active red-400           red-700   (on the inverted fill)
 *
 * The surface family is `floating/menu-palette.ts`'s — a marker, the preview
 * card and the search pill are floating things over a map, painted like a
 * menu panel. The elevations are the design tokens' `shadow-s` (at rest) and
 * `shadow-m` (active marker, preview card, search pill).
 */
import { Platform } from 'react-native';

import { colorRamp, DANGER_TABLE, resolveButtonRamps } from '../button/shared';
import { resolveMenuPalette } from '../floating/menu-palette';
import type { Theme } from '../theme/types';

const IS_WEB = Platform.OS === 'web';

export interface MapMarkerPaint {
  surface: string;
  border: string;
  hoverBorder: string;
  hoverSurface: string;
  label: string;
  labelSecondary: string;
  activeFill: string;
  activeLabel: string;
  visitedFill: string;
  visitedBorder: string;
  visitedLabel: string;
  heart: string;
  activeHeart: string;
  /** Photo placeholder behind an image that has not loaded. */
  placeholder: string;
  ring: string;
}

/** Pure, so it can be walked over presets and modes. */
export function resolveMapMarkerPaint(theme: Theme): MapMarkerPaint {
  const menu = resolveMenuPalette(theme);
  const { accent, neutral: n } = resolveButtonRamps(theme);
  const red = colorRamp(theme.colors.negative, DANGER_TABLE);
  const dark = theme.isDark;
  return {
    surface: menu.surface,
    border: menu.border,
    hoverBorder: menu.trigger.hoverBorder,
    hoverSurface: menu.trigger.hoverBackground,
    label: menu.text,
    labelSecondary: dark ? n[400] : n[500],
    activeFill: theme.colors.text,
    activeLabel: dark ? n[900] : theme.colors.card,
    visitedFill: dark ? n[900] : n[100],
    visitedBorder: dark ? n[700] : n[200],
    visitedLabel: dark ? n[400] : n[500],
    heart: red[500],
    activeHeart: dark ? red[700] : red[400],
    placeholder: dark ? n[700] : n[100],
    ring: accent[500],
  };
}

/** The web-only `dataSet` hook an adopted sheet's selectors hang off. */
export function mapWebData(data: Record<string, string>): Record<string, unknown> {
  return IS_WEB ? { dataSet: data } : {};
}

export const MAP_MARKER_STYLE_ID = 'bloom-map-marker-web-css';

/**
 * Cursor and keyboard focus ring for every pressable map piece, none of which
 * an inline style can carry.
 */
export const MAP_MARKER_CSS = `
[data-bloom-map-pressable] {
  cursor: pointer;
  outline: none;
  user-select: none;
}
[data-bloom-map-pressable]:focus-visible {
  outline: 2px solid var(--bloom-map-ring, currentColor);
  outline-offset: 2px;
}
[data-bloom-map-pressable][aria-disabled="true"] {
  cursor: not-allowed;
}
`;
