import { CheckoutSheet, emptyCheckoutDraft } from '@oxy.so/bloom/checkout-sheet';
import { Text } from '@oxy.so/bloom/typography';

import * as L from '../src/index';
import { toElement } from '../src/render';
import type { ParityCase } from './support/cases';

const set = () => {};
const WORDS: Record<string, string> = {
  'title.review': 'Review order',
  'section.order': 'Order',
  'section.total': 'Order total',
  continue: 'Continue',
  pay: 'Pay',
  dueToday: 'Due today',
};
const DRAFT = {
  ...emptyCheckoutDraft(),
  email: 'buyer@example.test',
  card: { id: 'c', brand: 'Card', last4: '4242', saveForLater: false },
};
const SHEET = {
  direction: 'forward' as const,
  draft: DRAFT,
  onDraft: set,
  request: {
    merchant: 'Example shop',
    currency: 'USD',
    dueTodayMinorUnits: 2800,
    requiresShipping: false,
    paymentMethods: ['card' as const],
    items: [
      { id: 'i', name: 'Canvas bag', detail: 'One size', quantity: 1, amountMinorUnits: 2800 },
    ],
  },
  savedCards: [DRAFT.card],
  label: (key: string) => WORDS[key] ?? key,
  formatAmount: (value: number, currency: string) => `${currency} ${(value / 100).toFixed(2)}`,
  onClose: set,
  onBack: set,
  onStep: set,
  onAuthorize: set,
  onCard: set,
};
const STEPS = ['review', 'confirmation', 'payment', 'success'] as const;

export const CHECKOUT_SHEET_CASES: ParityCase[] = [
  {
    name: 'CheckoutSheet closed',
    language: () => toElement(L.CheckoutSheet({ ...SHEET, open: false, step: 'review' })),
    bloom: () => <CheckoutSheet {...SHEET} open={false} step="review" />,
  },
  ...STEPS.map((step) => ({
    name: `CheckoutSheet ${step}`,
    language: () =>
      toElement(L.CheckoutSheet({ ...SHEET, open: true, step, cardEntry: L.Text('Card fields') })),
    bloom: () => <CheckoutSheet {...SHEET} open step={step} cardEntry={<Text>Card fields</Text>} />,
  })),
];
