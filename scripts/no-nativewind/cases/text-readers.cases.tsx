import { Text } from 'react-native';
import { ThinkingReasoning } from '@bloom/agent-thinking';
import { ListingPreviewPane } from '@bloom/listing-editor';
import { NotificationPermissionSheet } from '@bloom/notifications';
import { RadioGroup } from '@bloom/radio';
import { SubscriptionPlans, SubscriptionPrice } from '@bloom/subscription-plans';
import type { Cases } from '../support/cases';

const noop = () => {};

const LISTING = {
  photos: [],
  title: 'Flat in Varnholm',
  subtitle: '2 bedrooms · 64 m²',
  rating: null,
  price: '€1200',
  priceUnit: 'month',
  description: 'Bright and quiet.',
  location: 'Varnholm',
};

const PLANS = [
  {
    id: 'month',
    label: 'Monthly',
    subtitle: 'Billed every month',
    price: { amount: 9, currency: 'EUR', suffix: '/ month', description: 'Cancel any time' },
    benefits: [{ id: 'a', title: 'Unlimited', description: 'No caps' }],
  },
  { id: 'year', label: 'Yearly', price: { amount: 90, currency: 'EUR' }, benefits: [] },
];

export const CASES: Cases = {
  'ThinkingReasoning open': () => (
    <ThinkingReasoning open>
      <Text>Weighing it up</Text>
    </ThinkingReasoning>
  ),
  'ListingPreviewPane card': () => <ListingPreviewPane listing={LISTING} />,
  'ListingPreviewPane page': () => <ListingPreviewPane listing={LISTING} defaultMode="page" />,
  'SubscriptionPrice with description': () => (
    <SubscriptionPrice amount={9} currency="EUR" locale="en" description="Billed monthly" />
  ),
  SubscriptionPlans: () => (
    <SubscriptionPlans
      productName="Bloom Pro"
      plans={PLANS}
      value="month"
      onValueChange={noop}
      selectorLabel="Plan"
      primaryAction={{ label: 'Continue', onPress: noop }}
      moreBenefits={{ label: 'All benefits', onPress: noop }}
    />
  ),
  NotificationPermissionSheet: () => (
    <NotificationPermissionSheet
      surface={{ dismiss: noop }}
      permission={{ getStatus: async () => 'undetermined', request: async () => 'granted' }}
    />
  ),
  'RadioGroup swatch': () => (
    <RadioGroup
      label="Colour"
      variant="swatch"
      value="red"
      onValueChange={noop}
      options={[
        { value: 'red', label: 'Red', color: '#e11d48' },
        { value: 'blue', label: 'Blue', color: '#2563eb' },
      ]}
    />
  ),
};
