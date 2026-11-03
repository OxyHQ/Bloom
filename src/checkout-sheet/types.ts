import type { ReactNode } from 'react';
import type { TypeScaleVariant } from '../typography';
import type {
  CheckoutCard,
  CheckoutDraft,
  CheckoutRequest,
  CheckoutStep,
  CheckoutPaymentMethod,
} from './model';

export interface CheckoutSheetProps {
  open: boolean;
  /** Prevent dismissal while a host operation requires its current fields to remain mounted. */
  interactionBlocked?: boolean;
  /** Account identity supplied by the host; rendered instead of guest contact collection. */
  accountSummary?: {
    name: string;
    detail?: string;
    avatar?: ReactNode;
    /** Host-owned account context; no identity or balance lookup happens here. */
    supportingRows?: readonly {
      id: string;
      title: string;
      value?: string;
      description?: string;
      onPress?: () => void;
    }[];
  };
  /** Display entries filtered against request.paymentMethods; no availability is inferred. */
  paymentMethods?: readonly CheckoutPaymentMethod[];
  methodContent?: ReactNode;
  /** Heading owned by the shared dialog for a host-specific payment-method screen. */
  methodTitle?: string;
  /** Center an amount-led method screen without changing form or picker headings. */
  methodTitleAlign?: 'left' | 'center';
  /** Optional type-scale token when the method amount, rather than its heading, is primary. */
  methodTitleVariant?: TypeScaleVariant;
  /** Distinguishes host-owned method substates for the shared size morph. */
  frameKey?: string;
  /** The host selects the content and navigates to the method step. */
  onMethod?(methodId: string): void;
  /** Localized copy, including interpolated merchant, quantity and formatted amount. */
  label(key: string, values?: Record<string, string | number>): string;
  /** Format the quoted minor units; the host owns currency exponents and display preferences. */
  formatAmount(amountMinorUnits: number, currency: string): string;
  footer?: ReactNode;
  /** Optional result artwork; the footer owns the status glyph by default. */
  resultIllustration?: ReactNode;
  /** Provider-owned fields, or a host's explicitly labelled local preview. */
  cardEntry?: ReactNode;
  /** Optional disclosure shown below the confirmation button. */
  notice?: ReactNode;
  /** Override prerequisite navigation for a host-supplied payment method. */
  nextStep?: CheckoutStep;
  /** Disable payment selection and review/confirmation advancement while host authority is pending; dismissal stays available. */
  continueDisabled?: boolean;
  /** Advance completed details with the updated draft; defaults to returning to review. */
  onContinue?(draft: CheckoutDraft): void;

  request: CheckoutRequest;
  draft: CheckoutDraft;
  step: CheckoutStep;
  direction: 'forward' | 'backward';
  onDraft(draft: CheckoutDraft): void;
  onStep(step: CheckoutStep): void;
  onBack(): void;
  onClose(): void;
  onAuthorize(): void;
  savedCards: CheckoutCard[];
  onCard(card: CheckoutCard): void;
}
