import React, { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Card, CardBody } from '../card';
import { Text } from '../typography';
import { PriceSummary } from './PriceSummary';
import { PriceSummaryLine } from './PriceSummaryLine';
import type { PriceLine } from './types';

const meta: Meta = {
  title: 'Blocks/Commerce/PriceBreakdown',
  parameters: { layout: 'fullscreen' },
};

export default meta;

type Story = StoryObj;

// ---------------------------------------------------------------------------
//  Demo data — invented quotes. Every amount is a STRING: the app formatted it.
// ---------------------------------------------------------------------------

const SHIPPING: PriceLine[] = [
  { id: 'base', label: 'Collection and delivery', sublabel: '18 km, one helper', amount: '€34.00' },
  { id: 'stairs', label: 'Stairs', sublabel: 'Third floor, no lift', amount: '€8.00', info: 'Charged per floor above the second when the building has no lift.' },
  { id: 'insurance', label: 'Cover up to €1,000', amount: '€4.50' },
  { id: 'promo', label: 'First trip discount', amount: '−€5.00', tone: 'discount' },
  { id: 'vat', label: 'VAT', amount: '€8.72', tone: 'muted' },
];

const KITCHEN: PriceLine[] = [
  { id: 'items', label: 'Four items', amount: '€28.40' },
  { id: 'delivery', label: 'Delivery', sublabel: '2.4 km', amount: '€2.90', state: 'estimated', info: 'The final delivery charge depends on the route the courier takes.' },
  { id: 'service', label: 'Service fee', amount: '€1.70', info: 'Covers payments and support.' },
  { id: 'tip', label: 'Courier tip', amount: undefined, state: 'pending' },
];

const INVOICE: PriceLine[] = [
  { id: 'labour', label: 'Labour', sublabel: '3 h at €45', amount: '€135.00' },
  { id: 'parts', label: 'Parts', amount: '€62.10' },
  { id: 'callout', label: 'Call-out', amount: '€20.00' },
  { id: 'credit', label: 'Credit from the last visit', amount: '−€15.00', tone: 'discount' },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 12 }}>
      <Text variant="caption-1-semibold" style={{ opacity: 0.6 }}>
        {title}
      </Text>
      {children}
    </View>
  );
}

function Page({ children }: { children: React.ReactNode }) {
  return <View style={{ width: '100%', padding: 16, gap: 32, maxWidth: 520 }}>{children}</View>;
}

export const Quote: Story = {
  render: () => (
    <Page>
      <Section title="A shipping quote">
        <PriceSummary
          lines={SHIPPING}
          total={{ label: 'Total', amount: '€50.22' }}
          testID="quote"
        />
      </Section>
      <Section title="A service invoice, inside a card">
        <Card>
          <CardBody>
            <PriceSummary lines={INVOICE} total={{ label: 'Total due', amount: '€202.10', note: 'Payable within 14 days' }} />
          </CardBody>
        </Card>
      </Section>
    </Page>
  ),
};

export const NotFinal: Story = {
  render: () => (
    <Page>
      <Section title="An estimate and a line with no number yet">
        <PriceSummary
          lines={KITCHEN}
          total={{ label: 'Total', amount: '€33.00', state: 'estimated', note: 'The tip is added when the order is delivered.' }}
          testID="kitchen"
        />
      </Section>
    </Page>
  ),
};

function CollapsibleDemo() {
  const [open, setOpen] = useState(false);
  return (
    <PriceSummary
      lines={SHIPPING}
      total={{ label: 'Total', amount: '€50.22' }}
      collapsible
      expanded={open}
      onExpandedChange={setOpen}
      testID="collapsible"
    />
  );
}

export const Collapsible: Story = {
  render: () => (
    <Page>
      <Section title="Controlled">
        <CollapsibleDemo />
      </Section>
      <Section title="Uncontrolled, open to begin with">
        <PriceSummary lines={INVOICE} total={{ label: 'Total', amount: '€202.10' }} collapsible defaultExpanded />
      </Section>
    </Page>
  ),
};

export const Edges: Story = {
  render: () => (
    <Page>
      <Section title="No total">
        <PriceSummary lines={INVOICE.slice(0, 2)} />
      </Section>
      <Section title="Long labels in a narrow column">
        <View style={{ maxWidth: 280 }}>
          <PriceSummary
            lines={[
              { label: 'Collection, delivery and one helper for the stairs', amount: '€34.00' },
              { label: 'Insurance cover up to one thousand euros', amount: '€4.50', info: 'Underwritten per trip.' },
            ]}
            total={{ label: 'Total before taxes', amount: '€38.50' }}
          />
        </View>
      </Section>
      <Section title="One line on its own">
        <PriceSummaryLine label="Delivery" sublabel="2.4 km" amount="€2.90" state="estimated" />
      </Section>
    </Page>
  ),
};
