/**
 * What the housing families (`tenancy`, `eviction`, `place-reviews`) share: the
 * palette, the web focus sheet and a couple of pure helpers. Pure where it can
 * be, so a test can walk presets and modes without rendering.
 *
 *   Role          light          dark                      where
 *   surface       card           neutral-800               every card
 *   border        neutral-200    neutral-700               card hairline, row dividers
 *   hairline      neutral-200    neutral-700               connectors, dividers
 *   highlight     neutral-100    neutral-700 @60% on 800   hover / press wash
 *   tile          neutral-100    neutral-700               icon tiles, photo placeholders
 *   track         neutral-200    neutral-700               progress track
 *   markerRing    neutral-300    neutral-500               an upcoming timeline marker
 *   ring          accent-500     accent-500                keyboard focus
 *   text          text           text
 *   textSecondary text-secondary text-secondary
 *
 * The surfaces and hairlines are the floating-panel recipe
 * (`floating/menu-palette.ts`), the same family `booking` cards use, so a lease
 * card and a trip card sit side by side without a seam.
 */
import { Platform } from 'react-native';

import { resolveButtonRamps } from '../button/shared';
import { resolveMenuPalette } from '../floating/menu-palette';
import type { ImageResolver } from '../image-resolver/context';
import { isImageUrl } from '../image-resolver/is-image-url';
import type { Theme } from '../theme/types';

export const IS_WEB = Platform.OS === 'web';

export interface HousingPalette {
  surface: string;
  border: string;
  hairline: string;
  highlight: string;
  tile: string;
  track: string;
  /** The hollow marker of an upcoming timeline event. */
  markerRing: string;
  ring: string;
  text: string;
  textSecondary: string;
  shadow: string;
  /** The filled toggle ("I'll be there", "Helpful" when on). */
  toggleOn: string;
  toggleOnForeground: string;
  /** The resting toggle. */
  toggleOff: string;
  toggleOffHover: string;
}

export function resolveHousingPalette(theme: Theme): HousingPalette {
  const menu = resolveMenuPalette(theme);
  const { accent, neutral: n } = resolveButtonRamps(theme);
  const dark = theme.isDark;
  return {
    surface: menu.surface,
    border: menu.border,
    hairline: dark ? n[700] : n[200],
    highlight: menu.rowHighlight,
    tile: dark ? n[700] : n[100],
    track: dark ? n[700] : n[200],
    markerRing: dark ? n[500] : n[300],
    ring: accent[500],
    text: theme.colors.text,
    textSecondary: theme.colors.textSecondary,
    shadow: menu.shadow,
    toggleOn: theme.colors.primary,
    toggleOnForeground: theme.colors.primaryForeground,
    toggleOff: dark ? n[700] : n[100],
    toggleOffHover: dark ? n[600] : n[200],
  };
}

/** Card geometry, shared by every housing card. */
export const HOUSING_CARD_RADIUS = 20;
export const HOUSING_CARD_PADDING = 20;
export const HOUSING_TILE_RADIUS = 12;

/** A URL passes through; an id goes to the resolver; nothing resolves to `undefined`. */
export function resolveImageUri(
  source: string | undefined,
  resolver: ImageResolver | null,
  variant: string,
): string | undefined {
  if (!source) return undefined;
  return isImageUrl(source) ? source : resolver?.(source, variant) ?? undefined;
}

/** Joins the non-empty parts of an accessible name. */
export function joinName(parts: ReadonlyArray<string | false | null | undefined>, separator = ', '): string {
  return parts.filter((part): part is string => typeof part === 'string' && part !== '').join(separator);
}

// ---------------------------------------------------------------------------
//  Keyboard focus on web
//
//  Every pressable drawn by hand here is a react-native-web `Pressable`:
//  focusable, with the outline reset, so without a `:focus-visible` rule a
//  keyboard user tabs through invisible stops. Inline styles carry no
//  pseudo-classes, so the rule lives in an adopted sheet
//  (`styles/adopt-style-sheet.ts`) hanging off a `dataSet` attribute. The ring
//  colour is a per-instance custom property because it is a resolved token.
// ---------------------------------------------------------------------------

export const HOUSING_STYLE_ID = 'bloom-housing-web-css';

export const HOUSING_WEB_CSS = `
[data-bloom-housing-focus] {
  outline: none;
  cursor: pointer;
}
[data-bloom-housing-focus]:focus-visible {
  outline: 2px solid var(--bloom-housing-ring, currentColor);
  outline-offset: 2px;
}
`;
