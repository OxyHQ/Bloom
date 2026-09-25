/**
 * Everything `cart-panel` decides WITHOUT rendering: the options line, the
 * sentence a line is announced as, and the colours a basket paints RELATIVE to
 * whatever it was dropped on — a desktop panel puts it in a card, a phone puts
 * it in a sheet, and a rule or a quiet caption picked by eye disappears on one
 * of the two.
 *
 * Pure, so `CartPanel.test.tsx` can walk presets and modes without rendering.
 */
import { hairlineOn, surfaceFillOn, surfaceTextOn, type SurfaceTextPaint } from '../styles/surface-levels';
import type { Theme } from '../theme/types';
import { CART_OPTION_SEPARATOR } from './constants';
import type { CartLineEntry } from './types';

export interface CartPaint extends SurfaceTextPaint {
  /** Behind a photo that has not loaded, and the vendor tile. */
  tile: string;
  /** Laid over a sold-out line's photo. The surface itself, so the photo fades INTO the panel. */
  wash: string;
  /** Between two blocks of the panel. */
  rule: string;
}

export function resolveCartPaint(theme: Theme, surface: string): CartPaint {
  return {
    ...surfaceTextOn(theme, surface),
    tile: surfaceFillOn(theme, surface),
    wash: surface,
    rule: hairlineOn(theme, surface),
  };
}

/** "Large · Extra cheese", or `null` for a line with no choices. */
export function optionsLine(options: ReadonlyArray<string> | undefined): string | null {
  if (!options || options.length === 0) return null;
  const kept = options.filter((option) => option !== '');
  return kept.length > 0 ? kept.join(CART_OPTION_SEPARATOR) : null;
}

/**
 * One line as one sentence, in the order it is read on screen. The quantity is
 * said in words ("2") rather than left to the "×2" glyph, which announces
 * nothing.
 */
export function composeCartLineName(
  line: Pick<
    CartLineEntry,
    | 'name'
    | 'options'
    | 'note'
    | 'quantity'
    | 'price'
    | 'originalPrice'
    | 'secondaryPrice'
    | 'unavailable'
    | 'unavailableLabel'
  >,
): string {
  const parts: string[] = [line.name];
  const options = optionsLine(line.options);
  if (options) parts.push(options);
  if (line.note) parts.push(line.note);
  parts.push(String(line.quantity));
  if (line.originalPrice) parts.push(`${line.price}, originally ${line.originalPrice}`);
  else parts.push(line.price);
  // The second currency travels with the price it restates.
  if (line.secondaryPrice) parts.push(line.secondaryPrice);
  if (line.unavailable) parts.push(line.unavailableLabel ?? 'Sold out');
  return parts.join(', ');
}
