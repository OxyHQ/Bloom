import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Badge } from '../badge';
import { Card, CardBody } from '../card';
import { RiBikeLine } from '../icons/remix/RiBikeLine';
import { Item } from '../item';
import { Text } from '../typography';
import { OrderConfirmation } from './OrderConfirmation';
import type { OrderConfirmationFact } from './types';

const meta: Meta<typeof OrderConfirmation> = {
  title: 'Blocks/Checkout/OrderConfirmation',
  component: OrderConfirmation,
  parameters: { layout: 'fullscreen' },
};

export default meta;

type Story = StoryObj<typeof OrderConfirmation>;

// ---------------------------------------------------------------------------
//  Demo data — invented. Every time and amount is a string.
// ---------------------------------------------------------------------------

const FACTS: OrderConfirmationFact[] = [
  { id: 'arrives', label: 'Arrives', value: 'Friday 24, 17:00 – 19:00' },
  { id: 'paid', label: 'Paid with', value: 'Card ending 4417' },
  { id: 'total', label: 'Total', value: '€49.62' },
];

function Lines() {
  return (
    <View>
      <Item title="Ember flatbread" subtitle="Large · Extra smoked curd" trailing={<Text variant="body-medium">×2</Text>} />
      <Item title="Sorrel and white bean stew" subtitle="Regular" trailing={<Text variant="body-medium">×1</Text>} />
      <Item title="Harbour pickles" trailing={<Text variant="body-medium">×1</Text>} />
    </View>
  );
}

function Page({ children }: { children: React.ReactNode }) {
  return <View style={{ padding: 24, maxWidth: 560, width: '100%' }}>{children}</View>;
}

/** The whole receipt: the mark, the number, where it is, where it goes, what it cost. */
export const Default: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Page>
      <OrderConfirmation
        description="We have sent the receipt to your inbox."
        reference="A-4821"
        status={{
          status: 'Being prepared',
          eta: 'Arrives 17:35',
          detail: 'The shop has started on it',
          icon: RiBikeLine,
          progress: { value: 1, max: 4, accessibilityLabel: 'Order progress', valueText: '1 of 4 steps' },
        }}
        address={{ title: 'Home', subtitle: 'Carrer de l’Om 14, 2nd floor', kind: 'saved', meta: '1.2 km' }}
        facts={FACTS}
        items={<Lines />}
        action={{ label: 'Track order', onPress: () => {} }}
        secondaryAction={{ label: 'Get help', onPress: () => {} }}
        testID="confirmation"
      />
    </Page>
  ),
};

/** The smallest useful version: it happened, here is the number, here is what to do. */
export const Minimal: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Page>
      <OrderConfirmation
        reference="A-4821"
        description="You will get a message when the courier is on the way."
        action={{ label: 'Track order', onPress: () => {} }}
      />
    </Page>
  ),
};

/** On a card, at the panel rung, with the mark replaced by the app's own. */
export const CompactOnACard: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Page>
      <Card radius="radius-16" style={{ maxWidth: 380 }}>
        <CardBody>
          <OrderConfirmation
            variant="compact"
            mark={<Badge content="Placed" color="success" variant="subtle" size="md" />}
            title="Order placed"
            description="Reference below; track it any time."
            reference="A-4821"
            facts={FACTS.slice(0, 2)}
            action={{ label: 'Track order', onPress: () => {} }}
          />
        </CardBody>
      </Card>
    </Page>
  ),
};

/** A long title, long facts and a long address, at 358 wide. */
export const LongText: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <View style={{ width: 358, padding: 16 }}>
      <OrderConfirmation
        title="Your order with the bakery on the corner is placed"
        description="The shop has it and will start as soon as the oven is free. We have sent the receipt to your inbox."
        reference="A-4821-BCN-2026"
        status={{
          status: 'Waiting for the shop to accept',
          eta: 'between 17:00 and 19:00',
          icon: RiBikeLine,
        }}
        address={{
          title: 'Mum and dad’s, the one behind the market',
          subtitle: 'Carrer de l’Om 14, second floor, the door with the blue tiles',
          kind: 'recent',
        }}
        facts={[
          { label: 'Arrives', value: 'Friday 24 October, between 17:00 and 19:00' },
          { label: 'Paid with', value: 'Card ending 4417' },
        ]}
        action={{ label: 'Track order', onPress: () => {} }}
        secondaryAction={{ label: 'Get help', onPress: () => {} }}
      />
    </View>
  ),
};

/** Edit the props in Controls. */
export const Playground: Story = {
  args: {
    reference: 'A-4821',
    description: 'We have sent the receipt to your inbox.',
    facts: FACTS,
  },
};
