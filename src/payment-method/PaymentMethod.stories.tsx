import React, { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { GlyphButton } from '../button';
import { Card, CardBody } from '../card';
import { Field } from '../field';
import { RiMore2Line } from '../icons';
import { Text } from '../typography';
import { PaymentMethodList } from './PaymentMethodList';
import { PaymentMethodMark } from './PaymentMethodMark';
import { PaymentMethodRow } from './PaymentMethodRow';
import type { PaymentMethodEntry } from './types';

const meta: Meta = {
  title: 'Blocks/Payments/PaymentMethod',
  parameters: { layout: 'fullscreen' },
};

export default meta;

type Story = StoryObj;

const noop = () => undefined;

// ---------------------------------------------------------------------------
//  Demo data — INVENTED schemes. Bloom ships no scheme table and no artwork;
//  these names exist only in this file.
// ---------------------------------------------------------------------------

const METHODS: PaymentMethodEntry[] = [
  {
    id: 'aurora',
    scheme: 'Aurora',
    masked: '•••• 4417',
    expiry: 'Expires 09/29',
    isDefault: true,
  },
  { id: 'meridian', scheme: 'Meridian', masked: '•••• 0082', expiry: 'Expires 03/27' },
  {
    id: 'account',
    kind: 'account',
    scheme: 'Direct debit',
    masked: '•••• •••• 8842',
    expiry: 'Set up 12 March',
  },
  { id: 'wallet', kind: 'wallet', scheme: 'Store balance', masked: '€18.40 left' },
];

const TROUBLE: PaymentMethodEntry[] = [
  {
    id: 'old',
    scheme: 'Northwind',
    masked: '•••• 1190',
    expiry: 'Expired 06/24',
    state: 'expired',
  },
  {
    id: 'declined',
    scheme: 'Solstice',
    masked: '•••• 7734',
    expiry: 'Expires 11/28',
    state: 'declined',
    stateMessage: 'Your bank turned this one down. Try another, or call them.',
  },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 12 }}>
      <Text variant="caption-1-semibold" style={{ opacity: 0.6, paddingHorizontal: 16 }}>
        {title}
      </Text>
      {children}
    </View>
  );
}

function Page({ children }: { children: React.ReactNode }) {
  return <View style={{ width: '100%', paddingVertical: 16, gap: 32, maxWidth: 560 }}>{children}</View>;
}

export const Rows: Story = {
  render: () => (
    <Page>
      <Section title="The four kinds">
        <View>
          <PaymentMethodRow scheme="Aurora" masked="•••• 4417" expiry="Expires 09/29" onPress={noop} testID="row" />
          <PaymentMethodRow kind="account" scheme="Direct debit" masked="•••• •••• 8842" expiry="Set up 12 March" onPress={noop} />
          <PaymentMethodRow kind="wallet" scheme="Store balance" masked="€18.40 left" onPress={noop} />
          <PaymentMethodRow kind="cash" scheme="Cash on delivery" masked="Pay the driver" onPress={noop} />
        </View>
      </Section>
      <Section title="Default, expired, declined, disabled">
        <View>
          <PaymentMethodRow scheme="Aurora" masked="•••• 4417" expiry="Expires 09/29" isDefault onPress={noop} />
          <PaymentMethodRow scheme="Northwind" masked="•••• 1190" expiry="Expired 06/24" state="expired" onPress={noop} />
          <PaymentMethodRow
            scheme="Solstice"
            masked="•••• 7734"
            state="declined"
            stateMessage="Your bank turned this one down."
            onPress={noop}
          />
          <PaymentMethodRow scheme="Meridian" masked="•••• 0082" expiry="Expires 03/27" disabled onPress={noop} />
        </View>
      </Section>
      <Section title="With an action, as a radio, and compact">
        <View>
          <PaymentMethodRow
            scheme="Aurora"
            masked="•••• 4417"
            expiry="Expires 09/29"
            onPress={noop}
            action={<GlyphButton size={32} glyphSize={16} icon={RiMore2Line} accessibilityLabel="More for Aurora" onPress={noop} />}
          />
          <PaymentMethodRow scheme="Meridian" masked="•••• 0082" role="radio" selectable selected onPress={noop} />
          <PaymentMethodRow scheme="Northwind" masked="•••• 1190" density="compact" onPress={noop} />
        </View>
      </Section>
      <Section title="Long text, and the mark on its own">
        <View style={{ gap: 12 }}>
          <View style={{ maxWidth: 320 }}>
            <PaymentMethodRow
              kind="account"
              scheme="Cooperativa de Crèdit del Vallès"
              masked="•••• •••• •••• 8842"
              expiry="Mandate signed 12 March 2026"
              isDefault
              onPress={noop}
            />
          </View>
          <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center', paddingHorizontal: 16 }}>
            <PaymentMethodMark scheme="Aurora" />
            <PaymentMethodMark kind="account" scheme="Meridian" density="compact" />
            <PaymentMethodMark kind="wallet" />
          </View>
        </View>
      </Section>
    </Page>
  ),
};

function PickerDemo() {
  const [selected, setSelected] = useState('aurora');
  return (
    <PaymentMethodList
      methods={METHODS}
      variant="picker"
      selectedId={selected}
      onSelect={setSelected}
      onAdd={noop}
      accessibilityLabel="Pay with"
      testID="picker"
    />
  );
}

function FieldDemo() {
  const [selected, setSelected] = useState<string | undefined>(undefined);
  return (
    <Field label="Pay with" description="We charge this when the order is dispatched." multiple>
      <PaymentMethodList methods={METHODS.slice(0, 2)} variant="picker" selectedId={selected} onSelect={setSelected} />
    </Field>
  );
}

export const List: Story = {
  render: () => (
    <Page>
      <Section title="A picker — a radiogroup of radios, with an add row outside it">
        <PickerDemo />
      </Section>
      <Section title="A saved-methods list, with trouble on it">
        <PaymentMethodList
          methods={[...METHODS.slice(0, 1), ...TROUBLE]}
          onAdd={noop}
          accessibilityLabel="Saved payment methods"
        />
      </Section>
      <Section title="Inside a Field, and inside a card">
        <View style={{ gap: 16, paddingHorizontal: 16 }}>
          <FieldDemo />
          <Card>
            <CardBody style={{ paddingHorizontal: 0 }}>
              <PaymentMethodList methods={METHODS.slice(0, 2)} accessibilityLabel="Charging" />
            </CardBody>
          </Card>
        </View>
      </Section>
    </Page>
  ),
};

export const LoadingAndEmpty: Story = {
  render: () => (
    <Page>
      <Section title="Loading">
        <PaymentMethodList methods={[]} loading accessibilityLabel="Saved payment methods" testID="loading" />
      </Section>
      <Section title="Empty, with the add row">
        <PaymentMethodList
          methods={[]}
          onAdd={noop}
          emptyTitle="No saved payment methods"
          emptyDescription="Whatever you pay with is kept here so you do not have to type it twice."
          accessibilityLabel="Saved payment methods"
          testID="empty"
        />
      </Section>
      <Section title="Disabled, while a charge is in flight">
        <PaymentMethodList
          methods={METHODS.slice(0, 2)}
          variant="picker"
          selectedId="aurora"
          disabled
          onAdd={noop}
          accessibilityLabel="Pay with"
        />
      </Section>
    </Page>
  ),
};
