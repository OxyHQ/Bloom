/**
 * What a payment-method row paints, read RELATIVE to the surface it was dropped
 * on (`styles/surface-levels.ts`) — a saved-methods screen sits on the page, a
 * checkout picker sits in a card and a sheet's picker sits two rungs up, and a
 * plate colour picked by eye disappears on one of the three.
 *
 * Pure, so `PaymentMethod.test.tsx` can walk presets and modes without
 * rendering.
 */
import { surfaceFillOn, surfaceTextOn, type SurfaceTextPaint } from '../styles/surface-levels';
import type { Theme } from '../theme/types';
import { PAYMENT_METHOD_STATE_LABELS } from './constants';
import type { PaymentMethodState } from './types';

export interface PaymentMethodPaint extends SurfaceTextPaint {
  /** The plate the mark's glyph sits on — one step off whatever is behind the row. */
  plate: string;
}

export function resolvePaymentMethodPaint(theme: Theme, surface: string): PaymentMethodPaint {
  return {
    ...surfaceTextOn(theme, surface),
    plate: surfaceFillOn(theme, surface),
  };
}

/** Joins the non-empty parts of an accessible name, in reading order. */
export function composePaymentMethodName(
  parts: ReadonlyArray<string | false | null | undefined>,
  separator = ', ',
): string {
  return parts
    .filter((part): part is string => typeof part === 'string' && part !== '')
    .join(separator);
}

/**
 * The words a state says when the caller gave no message.
 *
 * `ok` has none: an ordinary method is not a status, and a row that said "OK"
 * under every card would be noise a reader has to read past four times.
 */
export function paymentMethodStateMessage(
  state: PaymentMethodState,
  message?: string,
): string | undefined {
  if (typeof message === 'string' && message !== '') return message;
  const label = PAYMENT_METHOD_STATE_LABELS[state];
  return label === '' ? undefined : label;
}
