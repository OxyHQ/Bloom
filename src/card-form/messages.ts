import { defineMessages, type MessageCatalog } from '../locale/messages';
import type { CardFormLabels } from './types';

/**
 * Every fixed string the card form draws or announces, in each Bloom language.
 * The expiry's `MM/YY` pattern is a format, not copy. A caller's `labels`,
 * `label`, `accessibilityLabel` and `placeholder` still win.
 */
export interface CardFormMessages {
  /** The words above each box. */
  labels: Required<CardFormLabels>;
  /** The country trigger while nothing is chosen. */
  selectCountry: string;
}

export const CARD_FORM_MESSAGES: MessageCatalog<CardFormMessages> = defineMessages<CardFormMessages>('CARD_FORM_MESSAGES', {
  labels: { number: 'Card number', expiry: 'Expiry date', securityCode: 'Security code', name: 'Name on card', postcode: 'Postcode', country: 'Country' },
  selectCountry: 'Select a country',
});
