import React, { useCallback, useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Badge } from '../badge';
import { Card, CardBody } from '../card';
import { RiBankCardLine } from '../icons/remix/RiBankCardLine';
import type { PriceLine } from '../price-breakdown';
import { Text } from '../typography';
import { CheckoutSummary } from './CheckoutSummary';
import { CheckoutSummaryRow } from './CheckoutSummaryRow';
import type { CheckoutSummaryProps } from './types';

const meta: Meta<typeof CheckoutSummary> = {
  title: 'Blocks/Checkout/CheckoutSummary',
  component: CheckoutSummary,
  parameters: { layout: 'fullscreen' },
};

export default meta;

type Story = StoryObj<typeof CheckoutSummary>;

// ---------------------------------------------------------------------------
//  Demo data — invented. Every amount is a string; nothing here adds up.
// ---------------------------------------------------------------------------

const LINES: PriceLine[] = [
  { id: 'subtotal', label: 'Subtotal', sublabel: '4 items', amount: '€51.80' },
  { id: 'delivery', label: 'Delivery', sublabel: '1.2 km', amount: '€1.90' },
  { id: 'service', label: 'Service fee', amount: '€1.10', tone: 'muted' },
  { id: 'promo', label: 'Promo SPRING10', amount: '−€5.18', tone: 'discount' },
];

/**
 * The payment row is another family's. Until it exists, a `CheckoutSummaryRow`
 * in the same register stands in — which is also what an app with no payment
 * family of its own should do.
 */
function PaymentPlaceholder({ onPress }: { onPress?: () => void }) {
  return (
    <CheckoutSummaryRow
      label="Pay with"
      icon={RiBankCardLine}
      value="Card ending 4417"
      detail="Expires 09/29"
      onPress={onPress}
      testID="checkout-payment"
    />
  );
}

const BASE: CheckoutSummaryProps = {
  address: {
    title: 'Home',
    subtitle: 'Carrer de l’Om 14, 2nd floor · Ring twice',
    kind: 'saved',
    badge: <Badge content="Default" color="default" variant="subtle" size="sm" />,
    onPress: () => {},
  },
  delivery: {
    label: 'Delivery window',
    value: 'Friday 24, 17:00 – 19:00',
    detail: '2 left at this price',
    badge: <Badge content="Express" color="primary" variant="subtle" size="sm" />,
    onPress: () => {},
  },
  note: {
    label: 'Note for the shop',
    value: '“Leave it with the concierge, please.”',
    onPress: () => {},
  },
  price: {
    lines: LINES,
    total: { label: 'Total', amount: '€49.62', note: 'Includes taxes' },
  },
};

function Page({ children }: { children: React.ReactNode }) {
  return <View style={{ padding: 24, maxWidth: 560, width: '100%' }}>{children}</View>;
}

/** Every row chosen, the totals under them, and the press that commits. */
export const Default: Story = {
  parameters: { controls: { disable: true } },
  render: function DefaultStory() {
    const [busy, setBusy] = useState(false);
    const [placed, setPlaced] = useState(0);
    const confirm = useCallback(() => {
      setPlaced((n) => n + 1);
      setBusy(true);
    }, []);
    return (
      <Page>
        <CheckoutSummary
          {...BASE}
          payment={<PaymentPlaceholder onPress={() => {}} />}
          confirm={{
            amount: '€49.62',
            terms: 'By placing this order you agree to the shop’s terms.',
            busy,
            onConfirm: confirm,
            footer: (
              <Text variant="caption-1-regular">
                Orders placed in this story: {placed}. Press again to see the busy state refuse it.
              </Text>
            ),
          }}
          testID="checkout"
        />
      </Page>
    );
  },
};

/** Nothing chosen yet: every row shows its placeholder and the button is refused. */
export const NothingChosen: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Page>
      <CheckoutSummary
        address={undefined}
        delivery={{ label: 'Delivery window', placeholder: 'Choose a window', onPress: () => {} }}
        note={{ label: 'Note for the shop', placeholder: 'Add a note', onPress: () => {} }}
        extras={[
          { label: 'Deliver to', placeholder: 'Choose an address', onPress: () => {} },
        ]}
        price={{ lines: LINES, total: { label: 'Total', amount: '€49.62', state: 'estimated' } }}
        confirm={{ amount: '€49.62', disabled: true, terms: 'Choose an address and a window first.' }}
      />
    </Page>
  ),
};

/** The order is in flight: the button spins, is renamed, and drops every press. */
export const Placing: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Page>
      <CheckoutSummary
        {...BASE}
        payment={<PaymentPlaceholder />}
        confirm={{ amount: '€49.62', busy: true, terms: 'This takes a moment.' }}
      />
    </Page>
  ),
};

/** A static review: no row opens anything, so no row draws a chevron. */
export const ReadOnly: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Page>
      <CheckoutSummary
        title="What you ordered"
        address={{ title: 'Home', subtitle: 'Carrer de l’Om 14, 2nd floor' }}
        delivery={{ label: 'Delivery window', value: 'Friday 24, 17:00 – 19:00' }}
        price={{ lines: LINES, total: { label: 'Paid', amount: '€49.62' } }}
      />
    </Page>
  ),
};

/** Long values, on a card, at the narrowest viewport this library targets. */
export const LongTextOnACard: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <View style={{ width: 358, padding: 16 }}>
      <Card radius="radius-16">
        <CardBody>
          <CheckoutSummary
            title={null}
            address={{
              title: 'Mum and dad’s, the one behind the market',
              subtitle:
                'Carrer de l’Om 14, entrance on the side street, second floor, the door with the blue tiles',
              kind: 'recent',
              onPress: () => {},
            }}
            delivery={{
              label: 'Delivery window',
              value: 'Friday 24 October, between 17:00 and 19:00',
              detail: 'Express · 2 left · Leaves the depot at 16:00',
              onPress: () => {},
            }}
            note={{
              label: 'Note for the shop',
              value:
                '“Please leave it with the concierge if nobody answers, and do not ring the bell after nine.”',
              onPress: () => {},
            }}
            price={{ lines: LINES, total: { label: 'Total', amount: '€49.62' }, collapsible: true }}
            confirm={{ amount: '€49.62', terms: 'You will not be charged until it is accepted.' }}
          />
        </CardBody>
      </Card>
    </View>
  ),
};

/** Edit the props in Controls. */
export const Playground: Story = {
  args: BASE,
};
