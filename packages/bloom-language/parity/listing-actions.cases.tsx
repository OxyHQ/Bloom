import { RiHeart3Line } from '@oxy.so/bloom/icons';
import {
  ActionBar,
  MortgageCalculator,
  RentalActionCard,
  SaleActionCard,
} from '@oxy.so/bloom/listing-actions';
import { Text } from '@oxy.so/bloom/typography';

import { ENUMS } from '../src/generated/spec.generated';
import * as L from '../src/index';
import { toElement } from '../src/render';
import type { ParityCase } from './support/cases';

const press = () => {};
const FACTS = [
  { label: 'Available', value: 'Sep 1' },
  { label: 'Deposit', value: '€2,500' },
];
const euro = (value: number) => `€${Math.round(value)}`;

export const LISTING_ACTION_CASES: ParityCase[] = [
  {
    name: 'ListingActionBar',
    language: () =>
      toElement(L.ListingActionBar('€1,250', 'Apply', { priceUnit: 'month', onPrimary: press })),
    bloom: () => (
      <ActionBar price="€1,250" priceUnit="month" primaryLabel="Apply" onPrimary={press} />
    ),
  },
  {
    name: 'ListingActionBar loading, disabled, a secondary action, an inset',
    language: () =>
      toElement(
        L.ListingActionBar('€420,000', 'Make an offer', {
          subtitle: 'Mortgage from €1,780/mo',
          onPressSubtitle: press,
          secondaryIcon: RiHeart3Line,
          secondaryLabel: 'Save',
          onSecondary: press,
          bottomInset: 'lg',
        })
          .loading()
          .disabled(),
      ),
    bloom: () => (
      <ActionBar
        price="€420,000"
        primaryLabel="Make an offer"
        subtitle="Mortgage from €1,780/mo"
        onPressSubtitle={press}
        secondaryIcon={RiHeart3Line}
        secondaryLabel="Save"
        onSecondary={press}
        bottomInset={16}
        loading
        primaryDisabled
      />
    ),
  },
  {
    name: 'MortgageCalculator',
    language: () => toElement(L.MortgageCalculator({ defaultPrice: 420000 })),
    bloom: () => <MortgageCalculator defaultPrice={420000} />,
  },
  ...ENUMS.mortgageLayout.map((layout) => ({
    name: `MortgageCalculator ${layout}, controlled, a disclaimer, a width`,
    language: () =>
      toElement(
        L.MortgageCalculator({
          price: 300000,
          downPayment: 60000,
          years: 25,
          annualRate: 3.5,
          onPriceChange: press,
          formatCurrency: euro,
          labels: { title: 'Your mortgage' },
          disclaimer: L.Text('An estimate, not an offer.'),
          maxWidth: '360',
        }).style(layout),
      ),
    bloom: () => (
      <MortgageCalculator
        price={300000}
        downPayment={60000}
        years={25}
        annualRate={3.5}
        onPriceChange={press}
        formatCurrency={euro}
        labels={{ title: 'Your mortgage' }}
        disclaimer={<Text>An estimate, not an offer.</Text>}
        maxWidth={360}
        layout={layout}
      />
    ),
  })),
  {
    name: 'RentalActionCard',
    language: () =>
      toElement(
        L.RentalActionCard('€1,250', {
          priceUnit: 'month',
          priceUnitPrefix: '/',
          billsNote: 'Bills included',
          facts: FACTS,
          onRequestViewing: press,
          onApply: press,
        }),
      ),
    bloom: () => (
      <RentalActionCard
        price="€1,250"
        priceUnit="month"
        priceUnitPrefix="/"
        billsNote="Bills included"
        facts={FACTS}
        onRequestViewing={press}
        onApply={press}
      />
    ),
  },
  ...(['reserved', 'rented'] as const).map((status) => ({
    name: `RentalActionCard ${status}, loading, a note and footer`,
    language: () =>
      toElement(
        L.RentalActionCard('€1,250', {
          status,
          onApply: press,
          note: L.Text('Pets considered'),
          footer: L.Text('Listed 3 days ago'),
        }).loading(),
      ),
    bloom: () => (
      <RentalActionCard
        price="€1,250"
        status={status}
        onApply={press}
        note={<Text>Pets considered</Text>}
        footer={<Text>Listed 3 days ago</Text>}
        loading
      />
    ),
  })),
  {
    name: 'SaleActionCard',
    language: () =>
      toElement(
        L.SaleActionCard('€420,000', {
          pricePerArea: '€4,200/m²',
          mortgageEstimate: '€1,780/mo',
          onPressMortgage: press,
          facts: FACTS,
          onContact: press,
          onRequestVisit: press,
          onMakeOffer: press,
        }),
      ),
    bloom: () => (
      <SaleActionCard
        price="€420,000"
        pricePerArea="€4,200/m²"
        mortgageEstimate="€1,780/mo"
        onPressMortgage={press}
        facts={FACTS}
        onContact={press}
        onRequestVisit={press}
        onMakeOffer={press}
      />
    ),
  },
  ...(['reserved', 'sold'] as const).map((status) => ({
    name: `SaleActionCard ${status}, loading, a note and footer`,
    language: () =>
      toElement(
        L.SaleActionCard('€420,000', {
          status,
          onMakeOffer: press,
          note: L.Text('Chain free'),
          footer: L.Text('Listed by Halden Homes'),
        }).loading(),
      ),
    bloom: () => (
      <SaleActionCard
        price="€420,000"
        status={status}
        onMakeOffer={press}
        note={<Text>Chain free</Text>}
        footer={<Text>Listed by Halden Homes</Text>}
        loading
      />
    ),
  })),
];
