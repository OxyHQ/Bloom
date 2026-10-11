import type { AccentTone } from '../theme/accent-colors';
import type {
  ApplicationItemStatus,
  ExchangeMode,
  MortgageCalculatorLabels,
  RentalStatus,
  SaleStatus,
} from './types';
import { LISTING_ACTIONS_MESSAGES } from './messages';

interface OfferStatusInfo {
  tone: AccentTone;
  label: string;
  message: string;
}

const EN = LISTING_ACTIONS_MESSAGES.en;

/**
 * `RentalActionCard`'s badge tone, and its English label and message per
 * status. `available` draws no badge. The card itself speaks them in the
 * locale (`LISTING_ACTIONS_MESSAGES`); `statusLabel` / `statusMessage` win.
 */
export const RENTAL_STATUS: Record<RentalStatus, OfferStatusInfo> = {
  available: { tone: 'success', label: EN.rentalStatus.available, message: '' },
  reserved: {
    tone: 'warning',
    label: EN.rentalStatus.reserved,
    message: EN.rentalStatusMessage.reserved,
  },
  rented: {
    tone: 'default',
    label: EN.rentalStatus.rented,
    message: EN.rentalStatusMessage.rented,
  },
};

/** `SaleActionCard`'s badge tone, and its English label and message per status. */
export const SALE_STATUS: Record<SaleStatus, OfferStatusInfo> = {
  available: { tone: 'success', label: EN.saleStatus.available, message: '' },
  reserved: {
    tone: 'warning',
    label: EN.saleStatus.reserved,
    message: EN.saleStatusMessage.reserved,
  },
  sold: { tone: 'default', label: EN.saleStatus.sold, message: EN.saleStatusMessage.sold },
};

/** `ExchangeProposalCard`'s chip texts in English; the card speaks them in the locale. */
export const EXCHANGE_MODE_LABELS: Record<ExchangeMode, string> = EN.exchangeModes;

/** `ApplicationChecklist`'s badge tone, and its English label and default action per status. */
export const APPLICATION_ITEM_STATUS: Record<
  ApplicationItemStatus,
  { tone: AccentTone; label: string; action: string }
> = {
  missing: {
    tone: 'default',
    label: EN.applicationStatus.missing,
    action: EN.applicationAction.upload,
  },
  uploaded: {
    tone: 'primary',
    label: EN.applicationStatus.uploaded,
    action: EN.applicationAction.view,
  },
  verified: {
    tone: 'success',
    label: EN.applicationStatus.verified,
    action: EN.applicationAction.view,
  },
  rejected: {
    tone: 'error',
    label: EN.applicationStatus.rejected,
    action: EN.applicationAction.replace,
  },
};

/** Which of `applicationAction` each status's button says. */
export const APPLICATION_ITEM_ACTION: Record<ApplicationItemStatus, 'upload' | 'view' | 'replace'> =
  {
    missing: 'upload',
    uploaded: 'view',
    verified: 'view',
    rejected: 'replace',
  };

export const MORTGAGE_TERM_OPTIONS: readonly number[] = [10, 15, 20, 25, 30];

/** `MortgageCalculator`'s labels in English; the calculator speaks them in the locale. */
export const MORTGAGE_LABELS: MortgageCalculatorLabels = EN.mortgage;

/** `auto` layouts: homes stack under this card width, the calculator splits from this width. */
export const EXCHANGE_STACK_BELOW = 360;
export const MORTGAGE_SPLIT_FROM = 640;
export const APPLICATION_CHECKLIST_MAX_WIDTH = 560;
