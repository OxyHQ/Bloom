import React, { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from '../button';
import { Card, CardBody } from '../card';
import { Field } from '../field';
import { Text } from '../typography';
import { CardForm } from './CardForm';
import { CardFormExpiry, CardFormNumber, CardFormSecurityCode } from './CardFormParts';
import { CARD_FORM_EMPTY_VALUE } from './constants';
import { cardNumberIsWellFormed, cardExpiryIsWellFormed } from './shared';
import type { CardFormValue, CardScheme } from './types';

const meta: Meta = {
  title: 'Blocks/Payments/CardForm',
  parameters: { layout: 'fullscreen' },
};

export default meta;

type Story = StoryObj;

// ---------------------------------------------------------------------------
//  Demo data — INVENTED schemes and prefixes. Bloom ships no scheme table:
//  these three exist only in this file, and an app passes its processor's.
// ---------------------------------------------------------------------------

const SCHEMES: CardScheme[] = [
  { id: 'aurora', name: 'Aurora', prefixes: ['7'], lengths: [16], groups: [4, 4, 4, 4] },
  {
    id: 'meridian',
    name: 'Meridian',
    prefixes: [['81', '85']],
    lengths: [15],
    groups: [4, 6, 5],
    securityCodeLength: 4,
    securityCodeLabel: 'Card code',
  },
  { id: 'northwind', name: 'Northwind', prefixes: ['90', '91'], lengths: [16, 19], groups: [4, 4, 4, 4, 3] },
];

const COUNTRIES = [
  { value: 'es', label: 'Spain' },
  { value: 'pt', label: 'Portugal' },
  { value: 'fr', label: 'France' },
  { value: 'it', label: 'Italy' },
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
  return (
    <View style={{ width: '100%', padding: 16, gap: 32, maxWidth: 560 }}>{children}</View>
  );
}

function BasicForm() {
  const [value, setValue] = useState<CardFormValue>(CARD_FORM_EMPTY_VALUE);
  const [scheme, setScheme] = useState<string>('none');
  return (
    <View style={{ gap: 12 }}>
      <CardForm
        value={value}
        onValueChange={setValue}
        schemes={SCHEMES}
        onSchemeChange={(next) => setScheme(next?.name ?? 'none')}
        accessibilityLabel="Card details"
        testID="basic"
      />
      <Text variant="caption-1-regular" style={{ opacity: 0.6 }}>
        {`Detected: ${scheme} · number well formed: ${String(cardNumberIsWellFormed(value.number))}`}
      </Text>
    </View>
  );
}

function FullForm() {
  const [value, setValue] = useState<CardFormValue>({
    ...CARD_FORM_EMPTY_VALUE,
    number: '7000 1111 2222 3339',
    expiry: '09/29',
    securityCode: '123',
    name: 'Nil Abella',
    country: 'es',
    postcode: '08041',
  });
  return (
    <CardForm
      value={value}
      onValueChange={setValue}
      schemes={SCHEMES}
      fields={{ name: true, postcode: true, country: true }}
      countries={COUNTRIES}
      required
      accessibilityLabel="Card details"
    />
  );
}

export const Basic: Story = {
  render: () => (
    <Page>
      <Section title="Empty — type to see the grouping and the mark">
        <BasicForm />
      </Section>
      <Section title="Filled, with a name, a country and a postcode">
        <FullForm />
      </Section>
    </Page>
  ),
};

export const Errors: Story = {
  render: () => (
    <Page>
      <Section title="A message per box">
        <CardForm
          value={{ number: '7000 1111 2222 333', expiry: '13/29', securityCode: '1', name: '' }}
          schemes={SCHEMES}
          errors={{
            number: 'That is one digit short.',
            expiry: 'There is no thirteenth month.',
            securityCode: 'Three digits, from the back of the card.',
            name: 'Put the name as it is printed.',
          }}
          accessibilityLabel="Card details"
        />
      </Section>
      <Section title="Disabled, while the charge is in flight">
        <CardForm
          value={{ number: '7000 1111 2222 3339', expiry: '09/29', securityCode: '123', name: 'Nil Abella' }}
          schemes={SCHEMES}
          disabled
          accessibilityLabel="Card details"
        />
      </Section>
    </Page>
  ),
};

function OneBox() {
  const [number, setNumber] = useState('');
  return (
    <Field
      label="Card number"
      description="Grouped as you type; never re-grouped behind the caret."
      error={number !== '' && !cardNumberIsWellFormed(number) ? 'Check that number.' : undefined}
    >
      <CardFormNumber value={number} onValueChange={setNumber} />
    </Field>
  );
}

function PairInAField() {
  const [expiry, setExpiry] = useState('');
  const [code, setCode] = useState('');
  return (
    <Field label="When it runs out, and the code" multiple>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flexBasis: 0, flexGrow: 1, minWidth: 0 }}>
          <CardFormExpiry
            value={expiry}
            onValueChange={setExpiry}
            label="Expiry date"
            error={expiry.length === 5 && !cardExpiryIsWellFormed(expiry) ? 'Check the month.' : undefined}
          />
        </View>
        <View style={{ flexBasis: 0, flexGrow: 1, minWidth: 0 }}>
          <CardFormSecurityCode value={code} onValueChange={setCode} label="Security code" />
        </View>
      </View>
    </Field>
  );
}

export const Parts: Story = {
  render: () => (
    <Page>
      <Section title="One box, in a Field of its own">
        <OneBox />
      </Section>
      <Section title="Two boxes in one `Field multiple` — no shared id, one description">
        <PairInAField />
      </Section>
      <Section title="In a checkout card">
        <Card>
          <CardBody>
            <View style={{ gap: 16 }}>
              <CardForm
                value={{ number: '8100 111111 22229', expiry: '03/27', securityCode: '4417', name: 'Mireia Ferrer' }}
                schemes={SCHEMES}
                accessibilityLabel="Card details"
              />
              <Button onPress={() => undefined}>Pay €48.00</Button>
            </View>
          </CardBody>
        </Card>
      </Section>
    </Page>
  ),
};
