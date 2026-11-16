import { fn } from 'storybook/test';
import React, { useState } from 'react';
import { View, type ViewProps } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useContainerWidth } from '../hooks/use-container-width';

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
  id: 'blocks-housing-place-reviews',
  title: 'Patterns/Housing/Place Reviews',
  parameters: { layout: 'fullscreen' },
};

export default meta;

type Story = StoryObj;

const onDemoAction = fn().mockName('place-reviews.action');

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
    text: 'Three good years here. The flats facing the courtyard are very quiet and the neighbours look out for each other — there is a building chat that actually works. Repairs were slow in winter: the boiler took two weeks to be fixed, and we had to chase the agency more than once. The full deposit came back within a month of moving out, with the inventory photos agreed on both sides.',
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

function Page({
  width = 1280,
  children,
  onLayout,
}: {
  width?: number;
  children: React.ReactNode;
  onLayout?: ViewProps['onLayout'];
}) {
  return (
    <View onLayout={onLayout} style={{ width: '100%', maxWidth: width, padding: 24, gap: 24 }}>
      {children}
    </View>
  );
}

function ReviewsSection() {
  const { width: measuredWidth, onLayout } = useContainerWidth();
  const width = measuredWidth ?? 0;
  const theme = useTheme();
  const wide = width >= 900;
  const [helpful, setHelpful] = useState<Record<string, boolean>>({});
  const [dismissed, setDismissed] = useState(false);

  return (
    <Page onLayout={onLayout}>
      <View style={{ gap: 4 }}>
        <Text
          role="heading"
          aria-level={2}
          variant={wide ? 'title-2-semibold' : 'title-3-semibold'}
          style={{ color: theme.colors.text }}
        >
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
        <WriteReviewPrompt
          buildingTitle="Calle del Olmo 14"
          onStart={onDemoAction}
          onDismiss={() => setDismissed(true)}
        />
      ) : null}
      <View
        style={
          wide
            ? { flexDirection: 'row', flexWrap: 'wrap', gap: 24, alignItems: 'flex-start' }
            : { gap: 16 }
        }
      >
        {REVIEWS.map(({ id, ...review }) => (
          <View
            key={id}
            style={wide ? { width: Math.max(0, width - 48 - 24) / 2, maxWidth: '100%' } : undefined}
          >
            <PlaceReviewCard
              {...review}
              helpful={helpful[id] ?? false}
              helpfulCount={(review.helpfulCount ?? 0) + (helpful[id] ? 1 : 0)}
              onHelpfulChange={(next) => setHelpful((h) => ({ ...h, [id]: next }))}
              onReport={onDemoAction}
            />
          </View>
        ))}
      </View>
    </Page>
  );
}

/** A building page's reviews responsive section: summary, the invitation, two columns of reviews. */
export const Section: Story = {
  render: () => <ReviewsSection />,
};

/** The invitation alone, with and without the dismiss button. */
export const Prompt: Story = {
  render: () => (
    <Page width={900}>
      <WriteReviewPrompt buildingTitle="Calle del Olmo 14" onStart={onDemoAction} />
      <View style={{ width: 343, maxWidth: '100%' }}>
        <WriteReviewPrompt
          buildingTitle="Calle del Olmo 14"
          onStart={onDemoAction}
          onDismiss={onDemoAction}
        />
      </View>
    </Page>
  ),
};
