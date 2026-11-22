import { Text } from 'react-native';
import { ListingCard, ListingCardGrid, WishlistCard } from '@bloom/listing-card';
import type { Cases } from '../support/cases';

const cards = (n: number) => Array.from({ length: n }, (_, i) => <Text key={i}>Card {i}</Text>);

export const CASES: Cases = {
  'ListingCardGrid results': () => <ListingCardGrid testID="g">{cards(3)}</ListingCardGrid>,
  'ListingCardGrid compact': () => (
    <ListingCardGrid density="compact" style={{ marginTop: 8 }} testID="g">
      {cards(5)}
    </ListingCardGrid>
  ),
  ListingCard: () => (
    <ListingCard
      photos={['https://example.com/a.jpg']}
      title="Alvora, Coast of Merin"
      subtitle="Hosted by Ilse"
      dates="12–17 Jun"
      rating={4.9}
      price="€120"
      total="€600 total"
    />
  ),
  WishlistCard: () => (
    <WishlistCard
      name="Coast weekends"
      description="12 saved"
      photos={['https://example.com/a.jpg']}
    />
  ),
};
