import { RiTimeLine } from '@oxy.so/bloom/icons';
import { PaymentStatusBar, PaymentStatusBlock } from '@oxy.so/bloom/payment-status';
import { PriceSummary, PriceSummaryLine } from '@oxy.so/bloom/price-breakdown';
import { Text } from '@oxy.so/bloom/typography';

import { ENUMS } from '../src/generated/spec.generated';
import * as L from '../src/index';
import { toElement } from '../src/render';
import type { ParityCase } from './support/cases';

const press = () => {};
const LINES = [
  { label: 'Subtotal', sublabel: '3 items', amount: '€24.00' },
  { label: 'Delivery', amount: '€2.90', state: 'estimated' as const },
  { label: 'Promo', amount: '−€3.00', tone: 'discount' as const },
  { label: 'Tax', amount: '€1.20', tone: 'muted' as const },
  { label: 'Service fee', state: 'pending' as const },
];
const TOTAL = {
  label: 'Total',
  amount: '€25.10',
  secondaryAmount: '≈ $27.30',
  note: 'Includes taxes',
};
const STATES = ['authorising', 'paid', 'failed', 'refunded', 'pending'] as const;

const prices: ParityCase[] = [
  {
    name: 'PriceSummary',
    language: () => toElement(L.PriceSummary(LINES, { total: TOTAL }).label('Price')),
    bloom: () => <PriceSummary lines={LINES} total={TOTAL} accessibilityLabel="Price" />,
  },
  {
    name: 'PriceSummary collapsible',
    language: () => toElement(L.PriceSummary(LINES, { total: TOTAL, collapsible: true })),
    bloom: () => <PriceSummary lines={LINES} total={TOTAL} collapsible />,
  },
  {
    name: 'PriceSummary expanded',
    language: () =>
      toElement(
        L.PriceSummary(LINES, {
          total: TOTAL,
          collapsible: true,
          expanded: true,
          onExpandedChange: press,
        }),
      ),
    bloom: () => (
      <PriceSummary lines={LINES} total={TOTAL} collapsible expanded onExpandedChange={press} />
    ),
  },
  ...ENUMS.priceLineTone.map((tone) => ({
    name: `PriceSummaryLine ${tone}`,
    language: () =>
      toElement(L.PriceSummaryLine('Delivery', { amount: '€2.90', sublabel: '4.2 km' }).tint(tone)),
    bloom: () => <PriceSummaryLine label="Delivery" amount="€2.90" sublabel="4.2 km" tone={tone} />,
  })),
  {
    name: 'PriceSummaryLine pending, with info',
    language: () =>
      toElement(
        L.PriceSummaryLine('Service fee', { state: 'pending', info: L.Text('Set at checkout') }),
      ),
    bloom: () => (
      <PriceSummaryLine label="Service fee" state="pending" info={<Text>Set at checkout</Text>} />
    ),
  },
];

const statuses: ParityCase[] = [
  ...STATES.flatMap((state) =>
    ENUMS.paymentStatusStyle.map((variant) => ({
      name: `PaymentStatusBar ${state} ${variant}`,
      language: () =>
        toElement(
          L.PaymentStatusBar(state, { amount: '€48.00', detail: 'Aurora •••• 4417' }).style(
            variant,
          ),
        ),
      bloom: () => (
        <PaymentStatusBar
          state={state}
          amount="€48.00"
          detail="Aurora •••• 4417"
          variant={variant}
        />
      ),
    })),
  ),
  {
    name: 'PaymentStatusBar progress, an action',
    language: () =>
      toElement(
        L.PaymentStatusBar('authorising', {
          status: 'Confirming',
          progress: { value: 0.4, accessibilityLabel: 'Authorising' },
          icon: RiTimeLine,
          action: L.Text('Cancel'),
        }),
      ),
    bloom: () => (
      <PaymentStatusBar
        state="authorising"
        status="Confirming"
        progress={{ value: 0.4, accessibilityLabel: 'Authorising' }}
        icon={RiTimeLine}
        action={<Text>Cancel</Text>}
      />
    ),
  },
  ...STATES.flatMap((state) =>
    ENUMS.paymentStatusStyle.map((variant) => ({
      name: `PaymentStatusBlock ${state} ${variant}`,
      language: () =>
        toElement(
          L.PaymentStatusBlock(state, {
            amount: '€48.00',
            detail: 'Charged on 4 June',
            reference: 'PAY-2041',
            reason: 'The bank declined the charge.',
            actions: L.Text('Try again'),
          }).style(variant),
        ),
      bloom: () => (
        <PaymentStatusBlock
          state={state}
          amount="€48.00"
          detail="Charged on 4 June"
          reference="PAY-2041"
          reason="The bank declined the charge."
          actions={<Text>Try again</Text>}
          variant={variant}
        />
      ),
    })),
  ),
  {
    name: 'PaymentStatusBlock no glyph tile',
    language: () =>
      toElement(L.PaymentStatusBlock('paid', { illustration: null }).label('Payment done')),
    bloom: () => (
      <PaymentStatusBlock state="paid" illustration={null} accessibilityLabel="Payment done" />
    ),
  },
  {
    name: 'PaymentStatusBlock an illustration',
    language: () => toElement(L.PaymentStatusBlock('refunded', { illustration: L.Text('↩') })),
    bloom: () => <PaymentStatusBlock state="refunded" illustration={<Text>↩</Text>} />,
  },
];

export const PRICE_PAYMENT_STATUS_CASES: ParityCase[] = [...prices, ...statuses];
