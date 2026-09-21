/**
 * What `CarrierQuoteCard` paints, and the pure ordering the list is built on.
 *
 * The paint is RELATIVE, for the reason every commerce family here computes one
 * the same way: the card is a `Card` on an offers screen and a bare row inside
 * a sheet, and a ramp stop picked here would be right for one of them and
 * invisible on the other. Everything comes off the fill the content actually
 * lands on (`styles/surface-levels.ts`).
 *
 * The ordering is pure and exported because "cheapest first" is a claim about a
 * SET, and a claim about a set is exactly what a render-level test cannot walk
 * at its boundaries — ties, missing numbers, a list of one.
 */
import { interactiveWebCss } from '../styles/interactive-web-css';
import { hairlineOn, surfaceFillOn, surfaceTextOn } from '../styles/surface-levels';
import type { SurfaceTextPaint } from '../styles/surface-levels';
import type { Theme } from '../theme/types';
import { CARRIER_QUOTE_MARK_ORDER } from './constants';
import type { CarrierQuote, CarrierQuoteMark, CarrierQuoteSort } from './types';

export interface CarrierQuotePaint {
  /** The fill the content lands on — the card's, or the ambient one at compact. */
  surface: string;
  /** The rule over the action footer, and the breakdown's own divider. */
  hairline: string;
  /** The next fill UP: a tile, the wash a bare press target takes under a pointer. */
  tile: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  /** The text rungs that clear AA on a TILE, which is not the card's fill. */
  tileText: SurfaceTextPaint;
  /** The chosen card's border, and the focus ring. */
  accent: string;
}

export function resolveCarrierQuotePaint(theme: Theme, surface: string): CarrierQuotePaint {
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
    accent: theme.colors.primary,
  };
}

/**
 * Whether the card's actions carry their LABELS at this width.
 *
 * A pure function of the measured width so the threshold can be walked without
 * a layout pass — `onLayout` never fires in jsdom, and a threshold only a
 * browser exercises is a threshold nothing pins. Before the first layout the
 * width is `null` and the labels are ON: an unmeasured card is one the caller
 * has not constrained, and the label is the better of the two guesses.
 */
export function carrierActionsAreLabelled(width: number | null, narrowWidth: number): boolean {
  return width === null || width >= narrowWidth;
}

/**
 * The offers in the order the list draws them.
 *
 * Every key is a NUMBER the caller supplied for comparison only — this family
 * never reads a formatted amount, so a quote with no number for the current
 * order cannot be placed against one that has a number, and goes LAST. Within
 * the missing group the caller's own order is kept, because there is nothing
 * left to sort on and re-shuffling a group of equals makes a list jump for no
 * visible reason.
 *
 * Stable: equal keys keep their input order.
 */
export function sortCarrierQuotes(
  quotes: readonly CarrierQuote[],
  sort: CarrierQuoteSort,
): CarrierQuote[] {
  const key = (quote: CarrierQuote): number | undefined => {
    if (sort === 'price') return quote.priceValue;
    if (sort === 'eta') return quote.etaMinutes;
    const rating = quote.carrier.rating;
    return typeof rating === 'number' ? rating : undefined;
  };
  // A rating sorts HIGH first; a price and an ETA sort LOW first.
  const direction = sort === 'rating' ? -1 : 1;
  return quotes
    .map((quote, index) => ({ quote, index, key: key(quote) }))
    .sort((a, b) => {
      if (a.key === undefined && b.key === undefined) return a.index - b.index;
      if (a.key === undefined) return 1;
      if (b.key === undefined) return -1;
      if (a.key === b.key) return a.index - b.index;
      return (a.key - b.key) * direction;
    })
    .map((entry) => entry.quote);
}

/**
 * Which offers are the cheapest and which the fastest, by id.
 *
 * EVERY offer tied at a minimum is marked. Two offers at €38.40 are both the
 * cheapest, and choosing one of them would be this component inventing a
 * tie-break the app never asked for — while marking neither would hide a true
 * statement. A quote with no number for a mark cannot win it.
 */
export function markCarrierQuotes(
  quotes: readonly CarrierQuote[],
): Map<string, CarrierQuoteMark[]> {
  const best = (read: (quote: CarrierQuote) => number | undefined): number | undefined => {
    let min: number | undefined;
    for (const quote of quotes) {
      const value = read(quote);
      if (value === undefined || Number.isNaN(value)) continue;
      if (min === undefined || value < min) min = value;
    }
    return min;
  };
  const cheapest = best((quote) => quote.priceValue);
  const fastest = best((quote) => quote.etaMinutes);

  const out = new Map<string, CarrierQuoteMark[]>();
  for (const quote of quotes) {
    const marks: CarrierQuoteMark[] = [];
    if (cheapest !== undefined && quote.priceValue === cheapest) marks.push('cheapest');
    if (fastest !== undefined && quote.etaMinutes === fastest) marks.push('fastest');
    if (marks.length > 0) out.set(quote.id, marks);
  }
  return out;
}

/** The marks in their drawn order, so two marked quotes never disagree. Pure. */
export function orderCarrierMarks(marks: readonly CarrierQuoteMark[]): CarrierQuoteMark[] {
  return CARRIER_QUOTE_MARK_ORDER.filter((mark) => marks.includes(mark));
}

/** Joins the non-empty parts of an accessible name. */
export function joinQuoteName(
  parts: ReadonlyArray<string | number | false | null | undefined>,
  separator = ', ',
): string {
  return parts
    .map((part) => (typeof part === 'number' ? String(part) : part))
    .filter((part): part is string => typeof part === 'string' && part !== '')
    .join(separator);
}

// ---------------------------------------------------------------------------
//  Keyboard focus on web
//
//  The identity block is a react-native-web `Pressable`: focusable, with the
//  outline reset, so without a `:focus-visible` rule a keyboard user tabs
//  through an invisible stop. Inline styles carry no pseudo-classes, so the
//  rule lives in an adopted sheet hanging off a `dataSet` attribute, and the
//  ring colour is a per-instance custom property because it is a resolved
//  token.
// ---------------------------------------------------------------------------

export const CARRIER_QUOTE_STYLE_ID = 'bloom-carrier-quote-web-css';

export const CARRIER_QUOTE_WEB_CSS = interactiveWebCss({
  selector: '[data-bloom-carrier-subject]',
  varPrefix: 'bloom-carrier',
  reset: 'none',
  transition: 'background-color 150ms ease',
});
