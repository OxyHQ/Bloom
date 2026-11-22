import { AddressList, AddressRow } from '@oxy.so/bloom/address';
import { RiBankLine, RiHome4Line } from '@oxy.so/bloom/icons';
import {
  PaymentMethodList,
  PaymentMethodMark,
  PaymentMethodRow,
} from '@oxy.so/bloom/payment-method';
import { Text } from '@oxy.so/bloom/typography';

import { ENUMS } from '../src/generated/spec.generated';
import * as L from '../src/index';
import { toElement } from '../src/render';
import type { ParityCase } from './support/cases';

const press = () => {};
const select = (_id: string) => {};
const SECTIONS = [
  {
    title: 'Saved',
    entries: [
      {
        id: 'home',
        title: 'Home',
        subtitle: 'Carrer de l’Om 14, Barcelona',
        kind: 'saved' as const,
      },
      { id: 'work', title: 'Work', subtitle: 'Passeig de Gràcia 21', meta: '1.2 km' },
    ],
  },
  {
    title: 'Recent',
    entries: [{ id: 'r', title: 'Plaça Reial 3', kind: 'recent' as const }],
  },
];
const METHODS = [
  { id: 'a', scheme: 'Aurora', masked: '•••• 4417', expiry: '08/29', isDefault: true },
  { id: 'b', scheme: 'Meridian', masked: '•••• 0042', kind: 'account' as const, icon: RiBankLine },
  { id: 'c', scheme: 'Aurora', masked: '•••• 1881', state: 'expired' as const },
];
const DENSITIES = ENUMS.density;

const addresses: ParityCase[] = [
  ...DENSITIES.map((density) => ({
    name: `AddressRow ${density}`,
    language: () =>
      toElement(
        L.AddressRow('Home', {
          subtitle: 'Carrer de l’Om 14, Barcelona',
          kind: 'saved',
          meta: '12 min',
          badge: L.Text('Default'),
          action: L.Text('Edit'),
        })
          .density(density)
          .onPress(press),
      ),
    bloom: () => (
      <AddressRow
        title="Home"
        subtitle="Carrer de l’Om 14, Barcelona"
        kind="saved"
        meta="12 min"
        badge={<Text>Default</Text>}
        action={<Text>Edit</Text>}
        density={density === 'compact' ? 'compact' : 'comfortable'}
        onPress={press}
      />
    ),
  })),
  ...ENUMS.controlSize.map((size) => ({
    name: `AddressRow ${size}, selected`,
    language: () =>
      toElement(
        L.AddressRow('Work', { icon: RiHome4Line, selected: true, role: 'radio' }).size(size),
      ),
    bloom: () => <AddressRow title="Work" icon={RiHome4Line} selected role="radio" size={size} />,
  })),
  {
    name: 'AddressRow no media, disabled',
    language: () =>
      toElement(L.AddressRow('Plaça Reial 3', { leading: null }).disabled().onPress(press)),
    bloom: () => <AddressRow title="Plaça Reial 3" leading={null} disabled onPress={press} />,
  },
  ...ENUMS.choiceListStyle.flatMap((variant) =>
    DENSITIES.map((density) => ({
      name: `AddressList ${variant} ${density}`,
      language: () =>
        toElement(
          L.AddressList(SECTIONS, { selectedId: 'home', onSelect: select })
            .style(variant)
            .density(density),
        ),
      bloom: () => (
        <AddressList
          sections={SECTIONS}
          selectedId="home"
          onSelect={select}
          variant={variant}
          density={density === 'compact' ? 'compact' : 'comfortable'}
        />
      ),
    })),
  ),
  {
    name: 'AddressList loading',
    language: () => toElement(L.AddressList([], { loadingRows: 2 }).loading().size('sm')),
    bloom: () => <AddressList sections={[]} loadingRows={2} loading size="sm" />,
  },
  {
    name: 'AddressList empty',
    language: () => toElement(L.AddressList([], { emptyTitle: 'No addresses' }).label('Addresses')),
    bloom: () => (
      <AddressList sections={[]} emptyTitle="No addresses" accessibilityLabel="Addresses" />
    ),
  },
  {
    name: 'AddressList an empty block',
    language: () => toElement(L.AddressList([], { empty: L.Text('Add one') })),
    bloom: () => <AddressList sections={[]} empty={<Text>Add one</Text>} />,
  },
];

const payments: ParityCase[] = [
  ...DENSITIES.map((density) => ({
    name: `PaymentMethodMark ${density}`,
    language: () => toElement(L.PaymentMethodMark({ scheme: 'Aurora' }).density(density)),
    bloom: () => (
      <PaymentMethodMark
        scheme="Aurora"
        density={density === 'compact' ? 'compact' : 'comfortable'}
      />
    ),
  })),
  {
    name: 'PaymentMethodMark a wallet, an image',
    language: () => toElement(L.PaymentMethodMark({ kind: 'wallet', image: L.Text('W') })),
    bloom: () => <PaymentMethodMark kind="wallet" image={<Text>W</Text>} />,
  },
  ...DENSITIES.map((density) => ({
    name: `PaymentMethodRow ${density}`,
    language: () =>
      toElement(
        L.PaymentMethodRow({
          scheme: 'Aurora',
          masked: '•••• 4417',
          expiry: '08/29',
          isDefault: true,
          action: L.Text('Edit'),
        })
          .density(density)
          .onPress(press),
      ),
    bloom: () => (
      <PaymentMethodRow
        scheme="Aurora"
        masked="•••• 4417"
        expiry="08/29"
        isDefault
        action={<Text>Edit</Text>}
        density={density === 'compact' ? 'compact' : 'comfortable'}
        onPress={press}
      />
    ),
  })),
  {
    name: 'PaymentMethodRow declined, selectable, disabled',
    language: () =>
      toElement(
        L.PaymentMethodRow({
          scheme: 'Meridian',
          masked: '•••• 0042',
          state: 'declined',
          selectable: true,
          selected: true,
        }).disabled(),
      ),
    bloom: () => (
      <PaymentMethodRow
        scheme="Meridian"
        masked="•••• 0042"
        state="declined"
        selectable
        selected
        disabled
      />
    ),
  },
  ...ENUMS.choiceListStyle.flatMap((variant) =>
    DENSITIES.map((density) => ({
      name: `PaymentMethodList ${variant} ${density}`,
      language: () =>
        toElement(
          L.PaymentMethodList(METHODS, { selectedId: 'a', onSelect: select, onAdd: press })
            .style(variant)
            .density(density),
        ),
      bloom: () => (
        <PaymentMethodList
          methods={METHODS}
          selectedId="a"
          onSelect={select}
          onAdd={press}
          variant={variant}
          density={density === 'compact' ? 'compact' : 'comfortable'}
        />
      ),
    })),
  ),
  {
    name: 'PaymentMethodList loading, disabled',
    language: () => toElement(L.PaymentMethodList([]).loading().disabled()),
    bloom: () => <PaymentMethodList methods={[]} loading disabled />,
  },
  {
    name: 'PaymentMethodList empty',
    language: () =>
      toElement(L.PaymentMethodList([], { empty: L.Text('No cards yet') }).label('Payment')),
    bloom: () => (
      <PaymentMethodList
        methods={[]}
        empty={<Text>No cards yet</Text>}
        accessibilityLabel="Payment"
      />
    ),
  },
];

export const ADDRESS_PAYMENT_CASES: ParityCase[] = [...addresses, ...payments];
