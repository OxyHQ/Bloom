import { defineMessages, type MessageCatalog } from '../locale/messages';
import type { PriceLineState } from './types';

/**
 * Every fixed string the price breakdown draws or announces, in each Bloom
 * language. A caller's `stateLabels`, `expandLabel`, `collapseLabel`,
 * `infoAccessibilityLabel` and `accessibilityLabel` still win.
 */
export interface PriceBreakdownMessages {
  /** The word drawn beside an amount that is not the answer yet. */
  states: Record<Exclude<PriceLineState, 'final'>, string>;
  /** The disclosure of a collapsible summary. */
  showDetails: string;
  hideDetails: string;
  /** Names the list of charges. */
  breakdown: string;
  /** Names a line's info glyph: "About Service fee". */
  about: (label: string) => string;
}

export const PRICE_BREAKDOWN_MESSAGES: MessageCatalog<PriceBreakdownMessages> = defineMessages<PriceBreakdownMessages>('PRICE_BREAKDOWN_MESSAGES', {
  states: { estimated: 'Estimated', pending: 'Pending' },
  showDetails: 'Show price details',
  hideDetails: 'Hide price details',
  breakdown: 'Price breakdown',
  about: (label) => `About ${label}`,
});
