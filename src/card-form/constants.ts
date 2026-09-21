import type { CardFormLabels, CardFormValue } from './types';

/** The words above each box, when the caller names none. */
export const CARD_FORM_LABELS: Required<CardFormLabels> = {
  number: 'Card number',
  expiry: 'Expiry date',
  securityCode: 'Security code',
  name: 'Name on card',
  postcode: 'Postcode',
  country: 'Country',
};

/**
 * The two boxes whose SHAPE is not obvious from their label.
 *
 * The number gets none: a placeholder in a card number box is a string of
 * digits that looks like a card number, which is the one thing a field holding
 * card numbers should not draw.
 */
export const CARD_FORM_PLACEHOLDERS = {
  expiry: 'MM/YY',
  securityCode: '123',
} as const;

/** Every box empty — the shape `CardForm` reconciles a partial value against. */
export const CARD_FORM_EMPTY_VALUE: CardFormValue = {
  number: '',
  expiry: '',
  securityCode: '',
  name: '',
  postcode: '',
  country: '',
};

/**
 * The gap between two boxes on one line, and between the lines.
 *
 * 12 both ways: a form reads as a grid only when its two spacings agree, and
 * the pair of half-width boxes is the place that shows when they do not.
 */
export const CARD_FORM_GAP = 12;

