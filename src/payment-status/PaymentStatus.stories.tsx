import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from '../button';
import { Card, CardBody } from '../card';
import { Text } from '../typography';
import { PaymentStatusBar } from './PaymentStatusBar';
import { PaymentStatusBlock } from './PaymentStatusBlock';

const meta: Meta = {
  title: 'Blocks/Payments/PaymentStatus',
  parameters: { layout: 'fullscreen' },
};

export default meta;

type Story = StoryObj;

const noop = () => undefined;

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
  return <View style={{ width: '100%', padding: 16, gap: 32, maxWidth: 560 }}>{children}</View>;
}

export const Bar: Story = {
  render: () => (
    <Page>
      <Section title="The five states">
        <View style={{ gap: 12 }}>
          <PaymentStatusBar
            state="authorising"
            amount="€48.00"
            detail="Aurora •••• 4417"
            progress={{ value: 0.6, accessibilityLabel: 'Authorisation progress', valueText: 'Contacting your bank' }}
            testID="authorising"
          />
          <PaymentStatusBar state="paid" amount="€48.00" detail="Charged to Aurora •••• 4417" testID="paid" />
          <PaymentStatusBar
            state="failed"
            amount="€48.00"
            detail="Your bank turned this one down."
            action={<Button size="sm" variant="outline" onPress={noop}>Retry</Button>}
            testID="failed"
          />
          <PaymentStatusBar state="refunded" amount="−€48.00" detail="Back within five working days" testID="refunded" />
          <PaymentStatusBar state="pending" amount="€48.00" detail="No connection — we will send it when you are back." testID="pending" />
        </View>
      </Section>
      <Section title="Plain, inside a card that already paints">
        <Card>
          <CardBody>
            <PaymentStatusBar state="paid" amount="€12.40" detail="Store balance" variant="plain" />
          </CardBody>
        </Card>
      </Section>
      <Section title="Long text, and words of the caller's own">
        <View style={{ gap: 12, maxWidth: 340 }}>
          <PaymentStatusBar
            state="pending"
            status="Held for review"
            amount="€1,284.00"
            detail="Our payments team looks at larger orders by hand; this usually takes under an hour."
          />
          <PaymentStatusBar state="paid" amount="€1,284.00" />
        </View>
      </Section>
    </Page>
  ),
};

export const Block: Story = {
  render: () => (
    <Page>
      <Section title="Paid — the confirmation screen">
        <PaymentStatusBlock
          state="paid"
          amount="€48.00"
          detail="Aurora •••• 4417"
          reference="8F2K-41QD-7T"
          actions={<Button variant="outline" onPress={noop}>View receipt</Button>}
          testID="block-paid"
        />
      </Section>
      <Section title="Failed — the reason, and a way out of it">
        <PaymentStatusBlock
          state="failed"
          amount="€48.00"
          detail="Solstice •••• 7734"
          reference="8F2K-41QD-7T"
          reason="Your bank turned this one down and did not say why. Trying another card usually works; if it does not, they can tell you more."
          actions={
            <View style={{ gap: 8 }}>
              <Button onPress={noop}>Try again</Button>
              <Button variant="outline" onPress={noop}>Use another method</Button>
            </View>
          }
          testID="block-failed"
        />
      </Section>
      <Section title="Authorising, refunded, and pending">
        <View style={{ gap: 16 }}>
          <PaymentStatusBlock state="authorising" amount="€48.00" detail="Talking to your bank" />
          <PaymentStatusBlock state="refunded" amount="−€48.00" detail="Back within five working days" reference="8F2K-41QD-7T" />
          <PaymentStatusBlock
            state="pending"
            amount="€48.00"
            reason="You are offline. We kept the order and will send the payment as soon as there is a connection."
            variant="plain"
          />
        </View>
      </Section>
    </Page>
  ),
};
