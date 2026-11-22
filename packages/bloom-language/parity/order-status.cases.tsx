import { RiCheckLine, RiBikeLine } from '@oxy.so/bloom/icons';
import { OrderStatusBar, OrderStatusTimeline } from '@oxy.so/bloom/order-status';

import { ENUMS } from '../src/generated/spec.generated';
import * as L from '../src/index';
import { toElement } from '../src/render';
import type { ParityCase } from './support/cases';

const STEPS = [
  { id: 'placed', label: 'Placed', timestamp: '14:02', state: 'done' as const, icon: RiCheckLine },
  {
    id: 'cooking',
    label: 'Cooking',
    timestamp: '14:10',
    note: 'Table 6',
    state: 'done' as const,
    tone: 'success' as const,
  },
  { id: 'road', label: 'On the way', timestamp: '14:25', state: 'current' as const },
  { id: 'delivered', label: 'Delivered', state: 'upcoming' as const },
];
const FAILED = [
  { label: 'Placed', state: 'done' as const },
  { label: 'Payment', note: 'Card declined', state: 'failed' as const },
  { label: 'Cooking' },
];
const PROGRESS = {
  value: 3,
  max: 4,
  accessibilityLabel: 'Delivery progress',
  valueText: '3 of 4 stops',
};
const DENSITY = { default: 'comfortable', compact: 'compact' } as const;

export const ORDER_STATUS_CASES: ParityCase[] = [
  {
    name: 'OrderStatusBar',
    language: () => toElement(L.OrderStatusBar('Out for delivery')),
    bloom: () => <OrderStatusBar status="Out for delivery" />,
  },
  ...ENUMS.orderStatusBarStyle.flatMap((variant) =>
    ENUMS.accentTone.map((tone) => ({
      name: `OrderStatusBar ${variant}, ${tone}, every part`,
      language: () =>
        toElement(
          L.OrderStatusBar('Out for delivery', {
            eta: 'Arrives 14:35',
            detail: 'Four stops away',
            progress: PROGRESS,
            icon: RiBikeLine,
          })
            .style(variant)
            .tint(tone),
        ),
      bloom: () => (
        <OrderStatusBar
          status="Out for delivery"
          eta="Arrives 14:35"
          detail="Four stops away"
          progress={PROGRESS}
          icon={RiBikeLine}
          variant={variant}
          tone={tone}
        />
      ),
    })),
  ),
  {
    name: 'OrderStatusBar a leading view and an action',
    language: () =>
      toElement(
        L.OrderStatusBar('Cooking', {
          icon: RiBikeLine,
          leading: L.Avatar(null, { name: 'Ana Lima' }),
          action: L.Button(L.Text('Call')).size('sm'),
        }),
      ),
    bloom: () => (
      <OrderStatusBar
        status="Cooking"
        icon={RiBikeLine}
        leading={toElement(L.Avatar(null, { name: 'Ana Lima' }))}
        action={toElement(L.Button(L.Text('Call')).size('sm'))}
      />
    ),
  },
  {
    name: 'OrderStatusTimeline',
    language: () => toElement(L.OrderStatusTimeline(STEPS)),
    bloom: () => <OrderStatusTimeline steps={STEPS} />,
  },
  ...ENUMS.axis.flatMap((orientation) =>
    ENUMS.density.map((density) => ({
      name: `OrderStatusTimeline ${orientation}, ${density}`,
      language: () => toElement(L.OrderStatusTimeline(STEPS).axis(orientation).density(density)),
      bloom: () => (
        <OrderStatusTimeline steps={STEPS} orientation={orientation} density={DENSITY[density]} />
      ),
    })),
  ),
  {
    name: 'OrderStatusTimeline failed, its words, named',
    language: () =>
      toElement(
        L.OrderStatusTimeline(FAILED, { stateLabels: { failed: 'Stopped' } }).label('Order'),
      ),
    bloom: () => (
      <OrderStatusTimeline
        steps={FAILED}
        stateLabels={{ failed: 'Stopped' }}
        accessibilityLabel="Order"
      />
    ),
  },
];
