/**
 * What the booking family's components share: the palette, the web focus
 * sheet, and a couple of pure helpers. Pure where it can be, so a test can walk
 * presets and modes without rendering.
 *
 *   Role              light          dark                      where
 *   surface           card           neutral-800               BookingCard, TripCard
 *   border            neutral-200    neutral-700               card hairline, box dividers
 *   fieldBorder       neutral-300    neutral-600               the date/guest box
 *   highlight         neutral-100    neutral-700 @60% on 800   hover / press wash
 *   active            text           text                      the open field's 2px outline
 *   ring              accent-500     accent-500                keyboard focus
 *   discount          success subtle foreground               a discount amount
 *   tile              neutral-100    neutral-900               photo placeholder
 *
 * The surfaces and hairlines are the floating-panel recipe's
 * (`floating/menu-palette.ts`), so a guests popover opened from the card is the
 * same white/neutral family as the card.
 */
import { resolveButtonRamps } from '../button/shared';
import { resolveMenuPalette } from '../floating/menu-palette';
import { resolveAccentColors } from '../theme/accent-colors';
import type { Theme } from '../theme/types';

export interface BookingPalette {
  surface: string;
  /** The page behind a bar. */
  page: string;
  border: string;
  fieldBorder: string;
  highlight: string;
  active: string;
  ring: string;
  text: string;
  textSecondary: string;
  discount: string;
  tile: string;
}

export function resolveBookingPalette(theme: Theme): BookingPalette {
  const menu = resolveMenuPalette(theme);
  const { accent } = resolveButtonRamps(theme);
  const dark = theme.isDark;
  return {
    surface: menu.surface,
    page: theme.colors.background,
    border: menu.border,
    fieldBorder: theme.colors.border,
    highlight: menu.rowHighlight,
    active: theme.colors.text,
    ring: accent[500],
    text: theme.colors.text,
    textSecondary: theme.colors.textSecondary,
    discount: resolveAccentColors(theme.colors, 'success', 'outlined').foreground,
    tile: theme.colors.backgroundSecondary,
  };
}

/** Card geometry. */
export const BOOKING_CARD_RADIUS = 16;
export const BOOKING_CARD_PADDING = 24;
export const BOOKING_CARD_MAX_WIDTH = 372;
export const BOOKING_FIELD_RADIUS = 12;
export const TRIP_CARD_RADIUS = 16;
export const TRIP_IMAGE_RADIUS = 12;
/** A `TripCard` with `orientation="auto"` turns horizontal at this width. */
export const TRIP_CARD_HORIZONTAL_MIN_WIDTH = 480;

/** The typographic minus a discount amount is drawn with. */
export const MINUS_SIGN = '−';

/** "$42" → "−$42"; an amount that already carries a minus is left alone. */
export function discountAmount(amount: string): string {
  return /^[-−]/.test(amount) ? amount.replace(/^-/, MINUS_SIGN) : `${MINUS_SIGN}${amount}`;
}

/** "$180 per night, originally $210". */
export function priceAccessibilityName(price: string, unit?: string, originalPrice?: string): string {
  return `${price}${unit ? ` per ${unit}` : ''}${originalPrice ? `, originally ${originalPrice}` : ''}`;
}


// ---------------------------------------------------------------------------
//  Keyboard focus on web
//
//  Every pressable here is a react-native-web `Pressable`: focusable, and with
//  the outline reset, so without a `:focus-visible` rule a keyboard user tabs
//  through invisible stops. Inline styles carry no pseudo-classes, so the rule
//  lives in an adopted sheet (`styles/adopt-style-sheet.ts`, never a `<style>`
//  element) hanging off a `dataSet` attribute. The ring colour is a per-
//  instance custom property because it is a resolved theme token.
// ---------------------------------------------------------------------------

export const BOOKING_STYLE_ID = 'bloom-booking-web-css';

const FOCUSABLE = '[data-bloom-booking-focus]';

export const BOOKING_WEB_CSS = `
${FOCUSABLE} {
  outline: none;
}
${FOCUSABLE}:focus-visible {
  outline: 2px solid var(--bloom-booking-ring, currentColor);
  outline-offset: var(--bloom-booking-ring-offset, 2px);
}
`;
