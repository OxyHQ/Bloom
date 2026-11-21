import {
  CardForm,
  CardFormCountry,
  CardFormHostedField,
  CardFormPostcode,
} from '@oxy.so/bloom/card-form';
import { Text } from '@oxy.so/bloom/typography';

import * as L from '../src/index';
import { toElement } from '../src/render';
import type { ParityCase } from './support/cases';

const set = () => {};
const COUNTRIES = [
  { value: 'PT', label: 'Portugal' },
  { value: 'ES', label: 'Spain' },
];
const CARD = { number: '4242424242424242', expiry: '12/29', name: 'Ana Lima' };

export const CARD_FORM_CASES: ParityCase[] = [
  {
    name: 'CardForm',
    language: () => toElement(L.CardForm([{}, set])),
    bloom: () => <CardForm value={{}} onValueChange={set} />,
  },
  {
    name: 'CardForm filled, with countries and errors',
    language: () =>
      toElement(
        L.CardForm([CARD, set], {
          countries: COUNTRIES,
          errors: { expiry: 'Expired' },
          required: true,
        }),
      ),
    bloom: () => (
      <CardForm
        value={CARD}
        onValueChange={set}
        countries={COUNTRIES}
        errors={{ expiry: 'Expired' }}
        required
      />
    ),
  },
  {
    name: 'CardForm disabled, hosted fields',
    language: () =>
      toElement(
        L.CardForm([{}, set], {
          hostedFields: { number: L.Text('n'), expiry: L.Text('e'), securityCode: L.Text('c') },
        }).disabled(),
      ),
    bloom: () => (
      <CardForm
        value={{}}
        onValueChange={set}
        disabled
        hostedFields={{
          number: <Text>n</Text>,
          expiry: <Text>e</Text>,
          securityCode: <Text>c</Text>,
        }}
      />
    ),
  },
  {
    name: 'CardFormCountry',
    language: () => toElement(L.CardFormCountry(['PT', set], COUNTRIES, { label: 'Country' })),
    bloom: () => (
      <CardFormCountry value="PT" onValueChange={set} countries={COUNTRIES} label="Country" />
    ),
  },
  {
    name: 'CardFormPostcode, invalid, disabled',
    language: () =>
      toElement(
        L.CardFormPostcode(['1100', set], { error: 'Too short', invalid: true }).disabled(),
      ),
    bloom: () => (
      <CardFormPostcode value="1100" onValueChange={set} error="Too short" invalid disabled />
    ),
  },
  {
    name: 'CardFormHostedField',
    language: () =>
      toElement(L.CardFormHostedField('Card number', false, { content: () => L.Text('••••') })),
    bloom: () => (
      <CardFormHostedField label="Card number" focused={false}>
        {() => <Text>••••</Text>}
      </CardFormHostedField>
    ),
  },
  {
    name: 'CardFormHostedField focused, with an error',
    language: () =>
      toElement(
        L.CardFormHostedField('Card number', true, {
          error: 'Declined',
          content: () => L.Text('••••'),
        }),
      ),
    bloom: () => (
      <CardFormHostedField label="Card number" focused error="Declined">
        {() => <Text>••••</Text>}
      </CardFormHostedField>
    ),
  },
];
