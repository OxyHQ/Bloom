import {
  CheckoutConfirm,
  CheckoutSummary,
  CheckoutSummaryRow,
} from '@oxy.so/bloom/checkout-summary';
import {
  DeliverySlotDays,
  DeliverySlotOption,
  DeliverySlotPicker,
} from '@oxy.so/bloom/delivery-slot';
import { RiFlashlightLine, RiTimeLine } from '@oxy.so/bloom/icons';
import { OrderConfirmation } from '@oxy.so/bloom/order-confirmation';
import { Text } from '@oxy.so/bloom/typography';

import { ENUMS } from '../src/generated/spec.generated';
import * as L from '../src/index';
import { toElement } from '../src/render';
import { type ParityCase, Themed } from './support/cases';

const press = () => {};
const set = () => {};
const ADDRESS = {
  label: 'Deliver to',
  title: 'Home',
  subtitle: 'Carrer de l’Om 14',
  kind: 'saved' as const,
  onPress: press,
};
const DELIVERY = {
  label: 'Delivery',
  icon: RiTimeLine,
  value: 'Today, 19:00–19:30',
  onPress: press,
};
const NOTE = { label: 'Note', placeholder: 'Add a note for the rider', onPress: press };
const PRICE = {
  lines: [
    { label: 'Subtotal', amount: '€30.00' },
    { label: 'Delivery', amount: '€2.90' },
  ],
  total: { label: 'Total', amount: '€32.90' },
};
const CONFIRM = { label: 'Place order', amount: '€32.90', onConfirm: press };
const DAYS = [
  { id: 'mon', weekday: 'Mon', day: '9' },
  { id: 'tue', weekday: 'Tue', day: '10' },
  { id: 'wed', weekday: 'Wed', day: '11', disabled: true },
];
const WINDOWS = [
  { id: 'a', label: '18:00–18:30', price: '€2.90', capacity: '3 left' },
  { id: 'b', label: '18:30–19:00', tier: 'express' as const, price: '€4.90' },
  { id: 'c', label: '19:00–19:30', soldOut: true },
];
const ASAP = { id: 'asap', eta: '25–35 min', icon: RiFlashlightLine };
const STATUS = {
  status: 'Preparing',
  eta: 'Arrives 19:20',
  progress: { value: 0.3, accessibilityLabel: 'Order progress' },
};

const checkout: ParityCase[] = [
  {
    name: 'CheckoutSummaryRow',
    language: () =>
      toElement(
        L.CheckoutSummaryRow('Delivery', {
          icon: RiTimeLine,
          value: 'Today, 19:00–19:30',
          detail: 'Standard',
          badge: L.Text('Fast'),
        }).onPress(press),
      ),
    bloom: () => (
      <CheckoutSummaryRow
        label="Delivery"
        icon={RiTimeLine}
        value="Today, 19:00–19:30"
        detail="Standard"
        badge={<Text>Fast</Text>}
        onPress={press}
      />
    ),
  },
  {
    name: 'CheckoutSummaryRow a placeholder, content, disabled',
    language: () =>
      toElement(
        L.CheckoutSummaryRow('Note', {
          placeholder: 'Add a note',
          content: L.Text('Ring twice'),
          leading: L.Text('✎'),
        })
          .disabled()
          .label('Note for the rider'),
      ),
    bloom: () => (
      <CheckoutSummaryRow
        label="Note"
        placeholder="Add a note"
        content={<Text>Ring twice</Text>}
        leading={<Text>✎</Text>}
        disabled
        accessibilityLabel="Note for the rider"
      />
    ),
  },
  {
    name: 'CheckoutSummary',
    language: () =>
      toElement(
        L.CheckoutSummary(L.Text('A gift'), {
          address: ADDRESS,
          delivery: DELIVERY,
          payment: L.Text('Aurora •••• 4417'),
          note: NOTE,
          extras: [{ label: 'Cutlery', value: 'None' }],
          price: PRICE,
          confirm: CONFIRM,
        }).label('Review your order'),
      ),
    bloom: () => (
      <CheckoutSummary
        address={ADDRESS}
        delivery={DELIVERY}
        payment={<Text>Aurora •••• 4417</Text>}
        note={NOTE}
        extras={[{ label: 'Cutlery', value: 'None' }]}
        price={PRICE}
        confirm={CONFIRM}
        accessibilityLabel="Review your order"
      >
        <Text>A gift</Text>
      </CheckoutSummary>
    ),
  },
  {
    name: 'CheckoutSummary no title',
    language: () => toElement(L.CheckoutSummary(undefined, { title: null, delivery: DELIVERY })),
    bloom: () => <CheckoutSummary title={null} delivery={DELIVERY} />,
  },
  {
    name: 'CheckoutConfirm',
    language: () =>
      toElement(
        L.CheckoutConfirm({
          ...CONFIRM,
          secondaryAmount: '≈ $35.80',
          terms: L.Text('By placing the order you accept the terms.'),
          footer: L.Text('Secure payment'),
        }),
      ),
    bloom: () => (
      <CheckoutConfirm
        {...CONFIRM}
        secondaryAmount="≈ $35.80"
        terms={<Text>By placing the order you accept the terms.</Text>}
        footer={<Text>Secure payment</Text>}
      />
    ),
  },
  {
    name: 'CheckoutConfirm busy',
    language: () => toElement(L.CheckoutConfirm({ ...CONFIRM, busyLabel: 'Placing' }).loading()),
    bloom: () => <CheckoutConfirm {...CONFIRM} busyLabel="Placing" busy />,
  },
  {
    name: 'CheckoutConfirm disabled',
    language: () => toElement(L.CheckoutConfirm(CONFIRM).disabled()),
    bloom: () => <CheckoutConfirm {...CONFIRM} disabled />,
  },
];

const delivery: ParityCase[] = [
  {
    name: 'DeliverySlotDays',
    language: () => toElement(L.DeliverySlotDays(['tue', set], DAYS).label('Day')),
    bloom: () => (
      <DeliverySlotDays days={DAYS} value="tue" onChange={set} accessibilityLabel="Day" />
    ),
  },
  {
    name: 'DeliverySlotDays a fade colour, disabled',
    language: () => toElement(L.DeliverySlotDays(['mon', set], DAYS).tint('primary').disabled()),
    bloom: () => (
      <Themed>
        {(colors) => (
          <DeliverySlotDays
            days={DAYS}
            value="mon"
            onChange={set}
            fadeColor={colors.primary}
            disabled
          />
        )}
      </Themed>
    ),
  },
  {
    name: 'DeliverySlotOption selected',
    language: () =>
      toElement(
        L.DeliverySlotOption('18:00–18:30', {
          detail: '3 left',
          price: '€2.90',
          icon: RiTimeLine,
          selected: true,
          badge: L.Text('Express'),
        }).onPress(press),
      ),
    bloom: () => (
      <DeliverySlotOption
        label="18:00–18:30"
        detail="3 left"
        price="€2.90"
        icon={RiTimeLine}
        selected
        badge={<Text>Express</Text>}
        onPress={press}
      />
    ),
  },
  {
    name: 'DeliverySlotOption disabled',
    language: () => toElement(L.DeliverySlotOption('19:00–19:30').disabled().label('Sold out')),
    bloom: () => <DeliverySlotOption label="19:00–19:30" disabled accessibilityLabel="Sold out" />,
  },
  {
    name: 'DeliverySlotPicker',
    language: () =>
      toElement(
        L.DeliverySlotPicker(['a', set], DAYS, WINDOWS, {
          label: 'When',
          description: 'Choose a window',
          day: 'mon',
          onDayChange: set,
          asap: ASAP,
        }),
      ),
    bloom: () => (
      <DeliverySlotPicker
        days={DAYS}
        windows={WINDOWS}
        value="a"
        onValueChange={set}
        label="When"
        description="Choose a window"
        day="mon"
        onDayChange={set}
        asap={ASAP}
      />
    ),
  },
  {
    name: 'DeliverySlotPicker loading, a fade colour',
    language: () =>
      toElement(
        L.DeliverySlotPicker(['', set], DAYS, [], { day: 'tue', loadingRows: 2 })
          .loading()
          .tint('primary'),
      ),
    bloom: () => (
      <Themed>
        {(colors) => (
          <DeliverySlotPicker
            days={DAYS}
            windows={[]}
            value=""
            onValueChange={set}
            day="tue"
            loadingRows={2}
            loading
            fadeColor={colors.primary}
          />
        )}
      </Themed>
    ),
  },
  {
    name: 'DeliverySlotPicker empty, an error, disabled',
    language: () =>
      toElement(
        L.DeliverySlotPicker(['', set], DAYS, [], {
          error: 'Choose a window',
          required: true,
          empty: L.Text('No windows today'),
        }).disabled(),
      ),
    bloom: () => (
      <DeliverySlotPicker
        days={DAYS}
        windows={[]}
        value=""
        onValueChange={set}
        error="Choose a window"
        required
        empty={<Text>No windows today</Text>}
        disabled
      />
    ),
  },
];

const orders: ParityCase[] = [
  ...ENUMS.density.map((density) => ({
    name: `OrderConfirmation ${density}`,
    language: () =>
      toElement(
        L.OrderConfirmation({
          description: 'Forno Rosso is preparing it.',
          reference: 'A-2041',
          status: STATUS,
          address: { title: 'Home', subtitle: 'Carrer de l’Om 14', kind: 'saved' },
          facts: [{ label: 'Charged', value: '€32.90' }],
          items: L.Text('2 × Margherita'),
          action: { label: 'Track order', onPress: press },
          secondaryAction: { label: 'Done', onPress: press },
          footer: L.Text('A receipt is on its way'),
        })
          .density(density)
          .label('Order placed'),
      ),
    bloom: () => (
      <OrderConfirmation
        description="Forno Rosso is preparing it."
        reference="A-2041"
        status={STATUS}
        address={{ title: 'Home', subtitle: 'Carrer de l’Om 14', kind: 'saved' }}
        facts={[{ label: 'Charged', value: '€32.90' }]}
        items={<Text>2 × Margherita</Text>}
        action={{ label: 'Track order', onPress: press }}
        secondaryAction={{ label: 'Done', onPress: press }}
        footer={<Text>A receipt is on its way</Text>}
        variant={density === 'compact' ? 'compact' : 'comfortable'}
        accessibilityLabel="Order placed"
      />
    ),
  })),
  {
    name: 'OrderConfirmation a mark and its size',
    language: () =>
      toElement(L.OrderConfirmation({ title: 'Booked', mark: L.Text('✓'), markSize: '48' })),
    bloom: () => <OrderConfirmation title="Booked" mark={<Text>✓</Text>} markSize={48} />,
  },
];

export const CHECKOUT_DELIVERY_ORDER_CASES: ParityCase[] = [...checkout, ...delivery, ...orders];
