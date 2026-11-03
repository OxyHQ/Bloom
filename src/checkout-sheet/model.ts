import type { ReactNode } from 'react';
/** Merchant-neutral checkout view model. Amounts are quoted minor units, never client prices. */
export type CheckoutStep =
  | 'review'
  | 'confirmation'
  | 'contact'
  | 'shipping'
  | 'delivery'
  | 'payment'
  | 'card'
  | 'method'
  | 'terms'
  | 'processing'
  | 'success'
  | 'failure';
export interface CheckoutItem {
  id: string;
  name: string;
  detail: string;
  quantity: number;
  /** Total for this line, including quantity, supplied by the authoritative quote. */
  amountMinorUnits: number;
  /** Already-rendered merchant artwork; no asset loading is performed here. */
  artwork?: ReactNode;
}
export interface CheckoutRequest {
  merchant: string;
  currency: string;
  dueTodayMinorUnits: number;
  /** Full quoted order total when distinct from the amount due today. */
  totalMinorUnits?: number;
  items: CheckoutItem[];
  requiresShipping: boolean;
  /** The host supplies account identity; false removes guest contact collection. */
  requiresContact?: boolean;
  /** Preformatted tax treatment supplied by the host; omitted hides the row. */
  taxDescription?: string;
  paymentMethods: readonly string[];
  recurring?: {
    amountMinorUnits: number;
    interval: 'month' | 'year';
    startsOn?: string;
    renewalTerms?: string;
    cancellationTerms?: string;
  };
}
/** Card metadata only. Provider fields/tokenization must own PAN, expiry and security codes. */
export interface CheckoutCard {
  id: string;
  brand: string;
  last4: string;
  saveForLater: boolean;
}
/** Display metadata only; the host owns method-specific authorization and credentials. */
export interface CheckoutPaymentSelection {
  id: string;
  method: string;
  label: string;
  detail?: string;
}
export interface CheckoutPaymentMethod {
  id: string;
  label: string;
  detail?: string;
  kind?: 'card' | 'account' | 'wallet' | 'cash';
  artwork?: ReactNode;
}
export interface CheckoutDraft {
  email: string;
  /** Undefined preserves legacy card selection; null explicitly clears selection. */
  paymentSelection?: CheckoutPaymentSelection | null;
  shipping: { name: string; address: string; city: string; postalCode: string; country: string };
  delivery: 'standard' | 'express' | null;
  card: CheckoutCard | null;
}
export const emptyCheckoutDraft = (): CheckoutDraft => ({
  email: '',
  shipping: { name: '', address: '', city: '', postalCode: '', country: '' },
  delivery: null,
  card: null,
});
export function nextCheckoutStep(request: CheckoutRequest, draft: CheckoutDraft): CheckoutStep {
  if (request.requiresContact !== false && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email.trim()))
    return 'contact';
  if (request.requiresShipping && Object.values(draft.shipping).some((value) => !value.trim()))
    return 'shipping';
  if (request.requiresShipping && !draft.delivery) return 'delivery';
  if (draft.paymentSelection !== undefined) {
    return draft.paymentSelection && request.paymentMethods.includes(draft.paymentSelection.method)
      ? 'review'
      : 'payment';
  }
  if (!draft.card || !request.paymentMethods.includes('card')) return 'payment';
  return 'review';
}
export function checkoutSections(
  request: CheckoutRequest,
): Array<'contact' | 'shipping' | 'delivery' | 'payment'> {
  const sections: Array<'contact' | 'shipping' | 'delivery' | 'payment'> = [];
  if (request.requiresContact !== false) sections.push('contact');
  if (request.requiresShipping) sections.push('shipping', 'delivery');
  sections.push('payment');
  return sections;
}
