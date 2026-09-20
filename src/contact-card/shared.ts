/**
 * What `ContactProfileCard` paints, and the pure helpers the card and its tests
 * both read.
 *
 * The paint is RELATIVE: every colour is computed from the fill the card's
 * content actually lands on (`styles/surface-levels.ts`), because the same
 * component is a `Card` at comfortable density and a bare row on whatever a
 * list is painted at compact — two different parents, one component. A ramp
 * stop picked here would be right for one of them and invisible on the other.
 */
import { interactiveWebCss } from '../styles/interactive-web-css';
import { hairlineOn, surfaceFillOn, surfaceTextOn } from '../styles/surface-levels';
import type { SurfaceTextPaint } from '../styles/surface-levels';
import { resolveAccentColors, type AccentTone } from '../theme/accent-colors';
import type { Theme } from '../theme/types';
import { CONTACT_NARROW_WIDTH } from './constants';
import type { ContactProfileCardProps } from './types';

export interface ContactPaint {
  /** The fill the content lands on — a card's, or the ambient one at compact. */
  surface: string;
  /** The rule between the meta row and the footer. */
  hairline: string;
  /**
   * The next fill UP: a stat tile, the neutral band behind a coverless card,
   * the wash a bare press target takes under a pointer. One step, read off the
   * real parent.
   */
  tile: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  /** The text rungs that clear AA on a TILE, which is not the card's fill. */
  tileText: SurfaceTextPaint;
  ring: string;
}

export function resolveContactPaint(theme: Theme, surface: string): ContactPaint {
  const text = surfaceTextOn(theme, surface);
  const tile = surfaceFillOn(theme, surface);
  return {
    surface,
    hairline: hairlineOn(theme, surface),
    tile,
    text: text.text,
    textSecondary: text.textSecondary,
    textTertiary: text.textTertiary,
    tileText: surfaceTextOn(theme, tile),
    ring: theme.colors.primary,
  };
}

/**
 * The cover band's wash when the caller gave no image.
 *
 * It is the tone's SUBTLE member through `resolveAccentColors` — the tint the
 * palette already ships, sized to carry that tone's own text — never the fill
 * colour with an alpha appended to it, which is the failure `docs/badge.mdx`
 * describes and which reads as fully opaque through react-native-web.
 */
export function contactCoverWash(theme: Theme, tone: AccentTone = 'primary'): string {
  return resolveAccentColors(theme.colors, tone, 'subtle').background;
}

/**
 * Whether the channel controls carry their LABELS at this card width.
 *
 * A pure function of the measured width so the decision can be walked at its
 * boundary without a layout pass — `onLayout` never fires in jsdom, and a
 * threshold that is only exercised in a browser is a threshold nothing pins.
 * Before the first layout the width is `null` and the labels are ON: a card
 * that has not been measured is being rendered by a caller who has not
 * constrained it, and the label is the better of the two guesses.
 */
export function contactActionsAreLabelled(width: number | null): boolean {
  return width === null || width >= CONTACT_NARROW_WIDTH;
}

/**
 * The meta line under the name: a person reads "Head of Ops · Northwind", a
 * company reads its industry alone — a company has no company.
 */
export function contactMetaLine(
  props: Pick<ContactProfileCardProps, 'kind' | 'role' | 'company'>,
): string {
  const parts = [props.role, props.kind === 'company' ? undefined : props.company];
  return parts.filter((part): part is string => typeof part === 'string' && part !== '').join(' · ');
}

/** Joins the non-empty parts of an accessible name. */
export function joinContactName(
  parts: ReadonlyArray<string | false | null | undefined>,
  separator = ', ',
): string {
  return parts.filter((part): part is string => typeof part === 'string' && part !== '').join(separator);
}

/**
 * The tiles, laid out: one row of every tile when the card is wide, and two
 * columns of pairs when it is not. An odd tile keeps its half of the grid
 * rather than stretching across it.
 */
export function contactStatRows(count: number, labelled: boolean): number[][] {
  const all = Array.from({ length: count }, (_, index) => index);
  if (labelled) return count > 0 ? [all] : [];
  const rows: number[][] = [];
  for (let i = 0; i < count; i += 2) rows.push(i + 1 < count ? [i, i + 1] : [i]);
  return rows;
}

// ---------------------------------------------------------------------------
//  Keyboard focus on web
//
//  The identity block is a react-native-web `Pressable`: focusable, with the
//  outline reset, so without a `:focus-visible` rule a keyboard user tabs
//  through an invisible stop. Inline styles carry no pseudo-classes, so the rule
//  lives in an adopted sheet hanging off a `dataSet` attribute, and the ring
//  colour is a per-instance custom property because it is a resolved token.
// ---------------------------------------------------------------------------

export const CONTACT_STYLE_ID = 'bloom-contact-card-web-css';

export const CONTACT_WEB_CSS = interactiveWebCss({
  selector: '[data-bloom-contact-subject]',
  varPrefix: 'bloom-contact',
  reset: 'none',
  transition: 'background-color 150ms ease',
});
