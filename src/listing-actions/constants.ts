import type { AccentTone } from '../theme/accent-colors';
import type {
  ApplicationItemStatus,
  ExchangeMode,
  MortgageCalculatorLabels,
  RentalStatus,
  SaleStatus,
} from './types';

interface OfferStatusInfo {
  tone: AccentTone;
  label: string;
  message: string;
}

/** `RentalActionCard`'s badge tone, label and message per status. `available` draws no badge. */
export const RENTAL_STATUS: Record<RentalStatus, OfferStatusInfo> = {
  available: { tone: 'success', label: 'Available', message: '' },
  reserved: {
    tone: 'warning',
    label: 'Reserved',
    message: 'Another applicant is finalising a contract. New viewings are paused.',
  },
  rented: { tone: 'default', label: 'Rented', message: 'This home has been rented and no longer takes requests.' },
};

/** `SaleActionCard`'s badge tone, label and message per status. */
export const SALE_STATUS: Record<SaleStatus, OfferStatusInfo> = {
  available: { tone: 'success', label: 'For sale', message: '' },
  reserved: {
    tone: 'warning',
    label: 'Reserved',
    message: 'An offer has been accepted. The agent is not arranging visits for now.',
  },
  sold: { tone: 'default', label: 'Sold', message: 'This home has been sold.' },
};

/** `ExchangeProposalCard`'s default chip texts. */
export const EXCHANGE_MODE_LABELS: Record<ExchangeMode, string> = {
  swap: 'Reciprocal swap',
  host: 'Guest points',
  both: 'Either',
};

/** `ApplicationChecklist`'s badge tone, label and default action per status. */
export const APPLICATION_ITEM_STATUS: Record<
  ApplicationItemStatus,
  { tone: AccentTone; label: string; action: string }
> = {
  missing: { tone: 'default', label: 'Missing', action: 'Upload' },
  uploaded: { tone: 'primary', label: 'In review', action: 'View' },
  verified: { tone: 'success', label: 'Verified', action: 'View' },
  rejected: { tone: 'error', label: 'Rejected', action: 'Replace' },
};

export const MORTGAGE_TERM_OPTIONS: readonly number[] = [10, 15, 20, 25, 30];

export const MORTGAGE_LABELS: MortgageCalculatorLabels = {
  title: 'Mortgage calculator',
  price: 'Property price',
  downPayment: 'Down payment',
  downPaymentPercent: 'Down payment percent',
  percent: 'Percent',
  term: 'Loan term',
  years: 'years',
  rate: 'Interest rate',
  monthlyPayment: 'Monthly payment',
  principal: 'Principal',
  interest: 'Interest',
  loanAmount: 'Loan amount',
  totalInterest: 'Total interest',
  totalCost: 'Total cost',
};

/** `auto` layouts: homes stack under this card width, the calculator splits from this width. */
export const EXCHANGE_STACK_BELOW = 360;
export const MORTGAGE_SPLIT_FROM = 640;
export const APPLICATION_CHECKLIST_MAX_WIDTH = 560;
