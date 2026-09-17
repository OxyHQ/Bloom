import React, { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import {
  RiBuilding2Line,
  RiCustomerService2Line,
  RiMoneyEuroBoxLine,
  RiToolsLine,
  RiVolumeDownLine,
  RiGroupLine,
} from '../icons/remix';
import type { ReviewCategory } from '../listing-details/types';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { PlaceReviewCard } from './PlaceReviewCard';
import { PlaceReviewSummary } from './PlaceReviewSummary';
import { WriteReviewPrompt } from './WriteReviewPrompt';
import type { PlaceReviewCardProps } from './types';

const meta: Meta = {
  title: 'Blocks/Housing/Place Reviews',
  parameters: { layout: 'fullscreen' },
};

export default meta;

type Story = StoryObj;

const noop = () => undefined;

// ---------------------------------------------------------------------------
//  Demo data — an invented building
// ---------------------------------------------------------------------------

const CATEGORIES: ReviewCategory[] = [
  { label: 'Landlord responsiveness', value: 3.4, icon: RiCustomerService2Line },
  { label: 'Maintenance', value: 3.1, icon: RiToolsLine },
  { label: 'Noise', value: 4.2, icon: RiVolumeDownLine },
  { label: 'Neighbours', value: 4.7, icon: RiGroupLine },
  { label: 'Value for money', value: 3.8, icon: RiMoneyEuroBoxLine },
  { label: 'Building condition', value: 3.6, icon: RiBuilding2Line },
];

type Review = Omit<PlaceReviewCardProps, 'helpful' | 'onHelpfulChange'> & { id: string };

const REVIEWS: Review[] = [
  {
    id: 'a',
    authorLabel: 'Tenant, 2021–2024',
    authorInitial: 'T',
    date: 'Reviewed March 2026',
    rating: 4,
    wouldRecommend: true,
    depositReturned: true,
    categories: [
      { label: 'Landlord responsiveness', value: 4 },
      { label: 'Maintenance', value: 3.5 },
      { label: 'Noise', value: 4.5 },
      { label: 'Neighbours', value: 5 },
      { label: 'Value for money', value: 4 },
    ],
    text:
      'Three good years here. The flats facing the courtyard are very quiet and the neighbours look out for each other — there is a building chat that actually works. Repairs were slow in winter: the boiler took two weeks to be fixed, and we had to chase the agency more than once. The full deposit came back within a month of moving out, with the inventory photos agreed on both sides.',
    helpfulCount: 12,
  },
  {
    id: 'b',
    authorLabel: 'Tenant, 2019–2022',
    date: 'Reviewed November 2025',
    rating: 2,
    wouldRecommend: false,
    depositReturned: false,
    categories: [
      { label: 'Landlord responsiveness', value: 2 },
      { label: 'Maintenance', value: 1.5 },
      { label: 'Noise', value: 3 },
    ],
    text: 'Damp in the bedroom every winter and it was never properly fixed. Half the deposit was kept for "painting" that had been due before we moved in.',
    helpfulCount: 31,
  },
  {
    id: 'c',
    authorLabel: 'Room tenant, 2024–2025',
    authorInitial: 'R',
    date: 'Reviewed August 2025',
    rating: 5,
    wouldRecommend: true,
    text: 'Lovely building, great light on the upper floors.',
  },
];

// ---------------------------------------------------------------------------
//  Frames
// ---------------------------------------------------------------------------

function Page({ width, children }: { width: number; children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <View style={{ width: '100%', minHeight: '100%', alignItems: 'flex-start', backgroundColor: theme.colors.background }}>
      <View
        style={{
          width,
          paddingTop: 32,
          paddingBottom: 48,
          paddingLeft: width < 600 ? 16 : 80,
          paddingRight: width < 600 ? 16 : 80,
          gap: 32,
          backgroundColor: theme.colors.background,
        }}
      >
        {children}
      </View>
    </View>
  );
}

function ReviewsSection({ width }: { width: number }) {
  const theme = useTheme();
  const wide = width >= 900;
  const [helpful, setHelpful] = useState<Record<string, boolean>>({});
  const [dismissed, setDismissed] = useState(false);

  return (
    <Page width={width}>
      <View style={{ gap: 4 }}>
        <Text role="heading" aria-level={2} variant={wide ? 'title-2-semibold' : 'title-3-semibold'} style={{ color: theme.colors.text }}>
          What tenants say about Calle del Olmo 14
        </Text>
        <Text variant="body-regular" style={{ color: theme.colors.textSecondary }}>
          Reviews of the building stay here after a listing ends. Authors are anonymous.
        </Text>
      </View>
      <PlaceReviewSummary
        rating={3.9}
        title="Rated by past tenants"
        reviewCount={46}
        categories={CATEGORIES}
        depositReturnedRate={0.82}
        recommendRate={0.71}
      />
      {!dismissed ? (
        <WriteReviewPrompt buildingTitle="Calle del Olmo 14" onStart={noop} onDismiss={() => setDismissed(true)} />
      ) : null}
      <View style={wide ? { flexDirection: 'row', flexWrap: 'wrap', gap: 24, alignItems: 'flex-start' } : { gap: 16 }}>
        {REVIEWS.map(({ id, ...review }) => (
          <View key={id} style={wide ? { width: (width - 160 - 24) / 2 } : undefined}>
            <PlaceReviewCard
              {...review}
              helpful={helpful[id] ?? false}
              helpfulCount={(review.helpfulCount ?? 0) + (helpful[id] ? 1 : 0)}
              onHelpfulChange={(next) => setHelpful((h) => ({ ...h, [id]: next }))}
              onReport={noop}
            />
          </View>
        ))}
      </View>
    </Page>
  );
}

/** A building page's reviews section at 1280: summary, the invitation, two columns of reviews. */
export const SectionWide: Story = {
  name: 'Reviews section — 1280',
  render: () => <ReviewsSection width={1280} />,
};

export const SectionNarrow: Story = {
  name: 'Reviews section — 375',
  render: () => <ReviewsSection width={375} />,
};

export const SectionWideDark: Story = {
  name: 'Reviews section — 1280, dark',
  globals: { theme: 'dark' },
  render: () => <ReviewsSection width={1280} />,
};

export const SectionNarrowDark: Story = {
  name: 'Reviews section — 375, dark',
  globals: { theme: 'dark' },
  render: () => <ReviewsSection width={375} />,
};

/** The invitation alone, with and without the dismiss button. */
export const Prompt: Story = {
  render: () => (
    <Page width={900}>
      <WriteReviewPrompt buildingTitle="Calle del Olmo 14" onStart={noop} />
      <View style={{ width: 343 }}>
        <WriteReviewPrompt buildingTitle="Calle del Olmo 14" onStart={noop} onDismiss={noop} />
      </View>
    </Page>
  ),
};
