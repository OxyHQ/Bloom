import { RiArrowGoBackLine } from '../icons/remix/RiArrowGoBackLine';
import { RiCheckboxCircleLine } from '../icons/remix/RiCheckboxCircleLine';
import { RiCloseCircleLine } from '../icons/remix/RiCloseCircleLine';
import { RiErrorWarningLine } from '../icons/remix/RiErrorWarningLine';
import { RiTimeLine } from '../icons/remix/RiTimeLine';
import type { BloomIconComponent } from '../icons/icon-component';
import type { AccentTone } from '../theme/accent-colors';
import type { PaymentStatusState } from './types';

/**
 * The words each state says.
 *
 * `"Payment failed"` rather than `"Failed"` because the strip is read on its
 * own, in a row of other rows, where "Failed" is a word with no subject.
 */
export const PAYMENT_STATUS_LABELS: Record<PaymentStatusState, string> = {
  authorising: 'Authorising',
  paid: 'Paid',
  failed: 'Payment failed',
  refunded: 'Refunded',
  pending: 'Payment pending',
};

/**
 * The tone each state paints.
 *
 * `refunded` is `default` — the NEUTRAL tone — and that is the one decision
 * here worth arguing about: money coming back is neither good news nor bad,
 * and painting it green would congratulate a reader on a cancelled order while
 * painting it red would alarm one who asked for it.
 */
export const PAYMENT_STATUS_TONE: Record<PaymentStatusState, AccentTone> = {
  authorising: 'info',
  paid: 'success',
  failed: 'error',
  refunded: 'default',
  pending: 'warning',
};

/** The glyph each state draws when the caller names none. */
export const PAYMENT_STATUS_ICON: Record<PaymentStatusState, BloomIconComponent> = {
  authorising: RiTimeLine,
  failed: RiCloseCircleLine,
  paid: RiCheckboxCircleLine,
  pending: RiErrorWarningLine,
  refunded: RiArrowGoBackLine,
};

/**
 * Which `Admonition` a state's reason is drawn in, and `undefined` for the
 * three states that have no reason to give.
 */
export const PAYMENT_STATUS_ADMONITION: Record<
  PaymentStatusState,
  'error' | 'warning' | undefined
> = {
  authorising: undefined,
  failed: 'error',
  paid: undefined,
  pending: 'warning',
  refunded: undefined,
};

export interface PaymentStatusGeometry {
  /** The round tile the block's glyph sits in. */
  tile: number;
  /** The glyph inside it. */
  glyph: number;
  /** Between the tile, the heading block, the reference and the actions. */
  gap: number;
  /** The block's own padding when it paints a surface. */
  padding: number;
}

/**
 * The block is a CONFIRMATION, so its tile is bigger than the strip's 40: 56 is
 * the size at which a glyph reads as the page's subject rather than as a row's
 * ornament, and it is the same tile an empty state uses two families over.
 */
export const PAYMENT_STATUS_GEOMETRY: PaymentStatusGeometry = {
  tile: 56,
  glyph: 28,
  gap: 16,
  padding: 20,
};
