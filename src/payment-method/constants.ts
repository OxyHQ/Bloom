import { RiBankCardLine } from '../icons/remix/RiBankCardLine';
import { RiBankLine } from '../icons/remix/RiBankLine';
import { RiCoinsLine } from '../icons/remix/RiCoinsLine';
import { RiWallet3Line } from '../icons/remix/RiWallet3Line';
import type { BloomIconComponent } from '../icons/icon-component';
import type { AccentTone } from '../theme/accent-colors';
import type { PaymentMethodDensity, PaymentMethodKind, PaymentMethodState } from './types';

/** The glyph each kind draws when the caller names none. */
export const PAYMENT_METHOD_KIND_ICON: Record<PaymentMethodKind, BloomIconComponent> = {
  card: RiBankCardLine,
  account: RiBankLine,
  wallet: RiWallet3Line,
  cash: RiCoinsLine,
};

/** What the row says under itself when a state has no message of its own. */
export const PAYMENT_METHOD_STATE_LABELS: Record<PaymentMethodState, string> = {
  ok: '',
  expired: 'Expired',
  declined: 'Declined',
};

/**
 * The tone each state paints. `ok` paints nothing — an ordinary row is not a
 * status.
 */
export const PAYMENT_METHOD_STATE_TONE: Record<PaymentMethodState, AccentTone | undefined> = {
  ok: undefined,
  expired: 'warning',
  declined: 'error',
};

export interface PaymentMethodGeometry {
  /** The plate the glyph sits on: wider than tall, which is what says "card". */
  plateWidth: number;
  plateHeight: number;
  plateRadius: number;
  /** The glyph inside it. */
  glyph: number;
  /** The radio dot in the trailing slot. */
  dot: number;
}

/**
 * 40 wide is the leading column `Item` rows across the library already use
 * (`address`'s tile is 40 round), so a checkout screen stacking an address row
 * and a payment row does not step sideways between them. 28 tall against 40
 * wide is the ratio that reads as a card rather than a square tile, and it is
 * the one measurement in this family that is about SHAPE rather than size.
 */
export const PAYMENT_METHOD_GEOMETRY: Record<PaymentMethodDensity, PaymentMethodGeometry> = {
  comfortable: { plateWidth: 40, plateHeight: 28, plateRadius: 6, glyph: 18, dot: 16 },
  compact: { plateWidth: 32, plateHeight: 22, plateRadius: 5, glyph: 14, dot: 14 },
};

/** Space between the plate and the name, inside a `PaymentMethodMark`. */
export const PAYMENT_METHOD_MARK_GAP = 8;

/** Space between the rows of a list, and between the list and its add row. */
export const PAYMENT_METHOD_LIST_GAP = 4;
