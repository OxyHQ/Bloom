import React, { useMemo, useRef, useState } from 'react';
import { View, useWindowDimensions } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Badge } from '../badge';
import {
  RiBriefcase4Line,
  RiCalendarCloseLine,
  RiCarLine,
  RiChat3Line,
  RiCheckboxCircleLine,
  RiDoorOpenLine,
  RiFireLine,
  RiFridgeLine,
  RiHeart3Fill,
  RiHeart3Line,
  RiKey2Line,
  RiMapPin2Line,
  RiMedalLine,
  RiParkingBoxLine,
  RiRestaurantLine,
  RiShareLine,
  RiSparklingLine,
  RiTempColdLine,
  RiTranslate2,
  RiTvLine,
  RiWifiLine,
} from '../icons/remix';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { ZoomableMediaGallery } from '../zoomable-media-gallery/ZoomableMediaGallery';
import type { GalleryImage, ZoomableMediaGalleryHandle } from '../zoomable-media-gallery/types';
import { AmenityList } from './AmenityList';
import { HostCard } from './HostCard';
import { ListingHeader, ListingHeaderAction } from './ListingHeader';
import { ListingHighlights } from './ListingHighlights';
import { ListingPhotoGrid } from './ListingPhotoGrid';
import { ListingSection } from './ListingSection';
import { ReviewCard } from './ReviewCard';
import { ReviewSummary } from './ReviewSummary';
import type { Amenity, ListingHighlight, ListingPhoto, ReviewCategory, ReviewDistributionRow } from './types';

const meta: Meta = {
  title: 'Blocks/Stays/Listing Details',
  parameters: { layout: 'fullscreen' },
};

export default meta;

type Story = StoryObj;

// ---------------------------------------------------------------------------
//  Demo data — an invented flat in Porto
// ---------------------------------------------------------------------------

const img = (id: string) => `https://images.unsplash.com/photo-${id}?w=1400&q=80`;

const PHOTOS: ListingPhoto[] = [
  { source: img('1502672260266-1c1ef2d93688'), alt: 'Living room with a sofa by the window' },
  { source: img('1522708323590-d24dbb6b0267'), alt: 'Open living and dining area' },
  { source: img('1560448204-e02f11c3d0e2'), alt: 'Bright lounge' },
  { source: img('1505691938895-1758d7feb511'), alt: 'Bedroom' },
  { source: img('1484154218962-a197022b5858'), alt: 'Kitchen' },
  { source: img('1493809842364-78817add7ffb'), alt: 'Reading corner' },
  { source: img('1554995207-c18c203602cb'), alt: 'Sitting room' },
  { source: img('1566665797739-1674de7a421a'), alt: 'Second bedroom' },
  { source: img('1600585154340-be6161a56a0c'), alt: 'Building exterior' },
  { source: img('1600596542815-ffad4c1539a9'), alt: 'Garden' },
  { source: img('1512917774080-9991f1c4c750'), alt: 'Terrace' },
  { source: img('1586023492125-27b2c045efd7'), alt: 'Dining table' },
  { source: img('1556909114-f6e7ad7d3136'), alt: 'Kitchen counter' },
  { source: img('1540518614846-7eded433c457'), alt: 'Main bedroom' },
  { source: img('1631049307264-da0ec9d70304'), alt: 'Guest bedroom' },
  { source: img('1507089947368-19c1da9775ae'), alt: 'Desk by the window' },
];

const SUBTITLE = ['Entire rental unit in Porto', '4 guests', '2 bedrooms', '3 beds', '1 bath'];

const HIGHLIGHTS: ListingHighlight[] = [
  { icon: RiDoorOpenLine, title: 'Self check-in', description: 'Check yourself in with the lockbox.' },
  { icon: RiBriefcase4Line, title: 'Dedicated workspace', description: 'A room with wifi that’s well suited for working.' },
  { icon: RiCalendarCloseLine, title: 'Free cancellation before 12 May', description: 'Get a full refund if you change your mind.' },
];

const AMENITIES: Amenity[] = [
  { icon: RiWifiLine, label: 'Wifi' },
  { icon: RiRestaurantLine, label: 'Kitchen' },
  { icon: RiBriefcase4Line, label: 'Dedicated workspace' },
  { icon: RiTvLine, label: 'TV with streaming apps' },
  { icon: RiFridgeLine, label: 'Refrigerator' },
  { icon: RiParkingBoxLine, label: 'Paid parking nearby', description: 'Two streets away' },
  { icon: RiKey2Line, label: 'Lockbox' },
  { icon: RiFireLine, label: 'Heating' },
  { icon: RiTempColdLine, label: 'Air conditioning', available: false },
  { icon: RiCarLine, label: 'Free parking on premises', available: false },
];

const CATEGORIES: ReviewCategory[] = [
  { label: 'Cleanliness', value: 4.9, icon: RiSparklingLine },
  { label: 'Accuracy', value: 4.9, icon: RiCheckboxCircleLine },
  { label: 'Check-in', value: 5, icon: RiKey2Line },
  { label: 'Communication', value: 4.8, icon: RiChat3Line },
  { label: 'Location', value: 4.7, icon: RiMapPin2Line },
  { label: 'Value', value: 4.6, icon: RiMedalLine },
];

const DISTRIBUTION: ReviewDistributionRow[] = [
  { label: '5', value: 0.88 },
  { label: '4', value: 0.09 },
  { label: '3', value: 0.02 },
  { label: '2', value: 0.01 },
  { label: '1', value: 0 },
];

const REVIEWS = [
  {
    name: 'Inês',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200',
    subtitle: 'Lisbon, Portugal',
    rating: 5,
    date: 'August 2026',
    text:
      'The flat is even brighter than the photos. Marta left a handwritten list of bakeries and a map of the river walk, and the lockbox made a late arrival painless. The bedroom stays quiet even on a Saturday night, and the workspace has a proper chair — I got a full week of work done without once missing my desk at home.',
    hostResponse: {
      title: 'Response from Marta',
      date: 'August 2026',
      text: 'Thank you, Inês — come back for the autumn festival!',
    },
  },
  {
    name: 'Tomás',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200',
    subtitle: '3 years travelling',
    rating: 5,
    date: 'July 2026',
    text: 'Spotless, well located and exactly as described.',
  },
  {
    name: 'Hanna',
    avatar: 'https://images.unsplash.com/photo-1502685104226-ee32379fefbe?w=200',
    subtitle: 'Tampere, Finland',
    rating: 4,
    date: 'June 2026',
    text:
      'Lovely place in a great neighbourhood with trams at the door. The stairs are steep with luggage, which the listing does mention. The kitchen had everything we needed for cooking dinners in, and the terrace caught the evening sun. Would stay again.',
  },
  {
    name: 'Rafael',
    subtitle: 'São Paulo, Brazil',
    rating: 5,
    date: 'May 2026',
    text:
      'Our second stay here. Communication was quick, the beds are comfortable and the neighbourhood is full of small places to eat.',
  },
];

const GALLERY: GalleryImage[] = PHOTOS.map((p) => ({ uri: p.source, alt: p.alt, aspectRatio: 1.5 }));

const noop = () => {};

// ---------------------------------------------------------------------------
//  Frames
// ---------------------------------------------------------------------------

/** The preview decorator pads every story by 24; a page is edge to edge. */
const BLEED = {};

function Frame({ width, children, padded = true }: { width: number; children: React.ReactNode; padded?: boolean }) {
  width = Math.min(width, useWindowDimensions().width - 32);
  const theme = useTheme();
  return (
    // `padded={false}` cancels the preview decorator's 24px padding, for full-bleed parts.
    <View
      style={{
        width: '100%',
        alignItems: 'flex-start',
        backgroundColor: theme.colors.background,
        ...(padded ? null : BLEED),
      }}
    >
      <View
        style={{
          width,
          backgroundColor: theme.colors.background,
          paddingTop: padded ? 24 : 0,
          paddingBottom: padded ? 24 : 0,
          paddingLeft: padded ? 24 : 0,
          paddingRight: padded ? 24 : 0,
        }}
      >
        {children}
      </View>
    </View>
  );
}

function Caption({ children }: { children: string }) {
  const theme = useTheme();
  return (
    <Text variant="caption-1-medium" style={{ color: theme.colors.textSecondary, marginBottom: 8 }}>
      {children}
    </Text>
  );
}

function HeaderActions({ compact = false }: { compact?: boolean }) {
  const [saved, setSaved] = useState(false);
  return (
    <>
      <ListingHeaderAction icon={RiShareLine} label="Share" iconOnly={compact} onPress={noop} />
      <ListingHeaderAction
        icon={saved ? RiHeart3Fill : RiHeart3Line}
        label={saved ? 'Saved' : 'Save'}
        accessibilityLabel="Save"
        iconOnly={compact}
        pressed={saved}
        onPress={() => setSaved((s) => !s)}
      />
    </>
  );
}

// ---------------------------------------------------------------------------
//  Full page
// ---------------------------------------------------------------------------

function ListingPage({ width }: { width: number }) {
  width = Math.min(width, useWindowDimensions().width - 32);
  const theme = useTheme();
  const gallery = useRef<ZoomableMediaGalleryHandle>(null);
  const narrow = width < 744;
  const gutter = narrow ? 24 : 80;
  const open = (index: number) => gallery.current?.open(GALLERY, index);

  const reviews = useMemo(() => REVIEWS, []);

  const header = (
    <ListingHeader
      title="Sunlit flat above the river steps"
      size={narrow ? 'medium' : 'large'}
      subtitle={SUBTITLE}
      rating={4.92}
      reviewsLabel="128 reviews"
      onPressReviews={noop}
      location="Porto, Portugal"
      onPressLocation={noop}
      badge={narrow ? undefined : <Badge content="Loved by guests" size="large" color="primary" />}
      actions={<HeaderActions compact={narrow} />}
    />
  );

  const gutterStyle = { paddingLeft: gutter, paddingRight: gutter };

  return (
    <View style={[BLEED, { width, backgroundColor: theme.colors.background }]}>
      {narrow ? (
        <ListingPhotoGrid photos={PHOTOS} onPressPhoto={open} testID="page-photos" />
      ) : (
        <View style={[gutterStyle, { paddingTop: 32, gap: 24 }]}>
          {header}
          <ListingPhotoGrid photos={PHOTOS} onPressPhoto={open} onShowAll={() => open(0)} testID="page-photos" />
        </View>
      )}
      <View style={[gutterStyle, { paddingTop: narrow ? 24 : 40, paddingBottom: 48 }]}>
        {narrow ? <View style={{ paddingBottom: 24 }}>{header}</View> : null}
        <View style={{ maxWidth: narrow ? undefined : 720 }}>
          <ListingSection>
            <ListingHighlights items={HIGHLIGHTS} />
          </ListingSection>
          <ListingSection title="What this place offers">
            <AmenityList items={AMENITIES} limit={narrow ? 6 : 10} total={42} onShowAll={noop} />
          </ListingSection>
        </View>
        <ListingSection title="Reviews" subtitle="From guests who stayed in the last year">
          <ReviewSummary
            rating={4.92}
            title="Loved by guests"
            description="128 reviews"
            categories={CATEGORIES}
            distribution={DISTRIBUTION}
          />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: 64, rowGap: 32, marginTop: 16 }}>
            {reviews.map((review) => (
              <ReviewCard
                key={review.name}
                {...review}
                numberOfLines={3}
                style={{ width: narrow ? '100%' : (width - gutter * 2 - 64) / 2 }}
              />
            ))}
          </View>
        </ListingSection>
        <ListingSection title="Meet your host">
          <HostCard
            name="Marta"
            avatar="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400"
            verified
            label="Top host"
            labelIcon={RiMedalLine}
            stats={[
              { value: '214', label: 'Reviews' },
              { value: '4.92', label: 'Rating', star: true },
              { value: '7', label: 'Years hosting' },
            ]}
            details={[
              { icon: RiTranslate2, text: 'Speaks English, Portuguese and Spanish' },
              { icon: RiMapPin2Line, text: 'Lives in Porto, Portugal' },
            ]}
            responseLines={['Response rate: 100%', 'Responds within an hour']}
            onMessage={noop}
            onPressProfile={noop}
          />
        </ListingSection>
      </View>
      <ZoomableMediaGallery ref={gallery} indicatorVariant="thumbnails" />
    </View>
  );
}

/** The whole page at 1280: header, photo grid (press a photo or "Show all photos" to open the gallery), sections. */
export const PageWide: Story = {
  name: 'Page — 1280',
  render: () => <ListingPage width={1280} />,
};

/** The page at 375: the grid becomes a full-bleed carousel with a counter, the header moves under it. */
export const PageNarrow: Story = {
  name: 'Page — 375',
  render: () => <ListingPage width={375} />,
};

export const PageWideDark: Story = {
  name: 'Page — 1280, dark',
  globals: { theme: 'dark' },
  render: () => <ListingPage width={1280} />,
};

export const PageNarrowDark: Story = {
  name: 'Page — 375, dark',
  globals: { theme: 'dark' },
  render: () => <ListingPage width={375} />,
};

// ---------------------------------------------------------------------------
//  Parts
// ---------------------------------------------------------------------------

/** 5+, 4, 3, 2 and 1 photos in the grid layout. */
export const PhotoGrid: Story = {
  render: () => (
    <Frame width={1040}>
      <View style={{ gap: 32 }}>
        {[16, 4, 3, 2, 1].map((count) => (
          <View key={count}>
            <Caption>{`${count} photo${count === 1 ? '' : 's'}`}</Caption>
            <ListingPhotoGrid
              photos={PHOTOS.slice(0, count)}
              layout="grid"
              aspectRatio={count >= 5 ? 2 : 2.4}
              onPressPhoto={noop}
              onShowAll={count > 1 ? noop : undefined}
              testID={`grid-${count}`}
            />
          </View>
        ))}
      </View>
    </Frame>
  ),
};

/** The narrow carousel: swipe (or scroll) to page; the pill counts. */
export const PhotoCarousel: Story = {
  render: () => (
    <Frame width={375} padded={false}>
      <ListingPhotoGrid photos={PHOTOS} onPressPhoto={noop} testID="carousel" />
    </Frame>
  ),
};

export const Header: Story = {
  render: () => (
    <View style={{ gap: 24 }}>
      <Frame width={1040}>
        <ListingHeader
          title="Sunlit flat above the river steps"
          subtitle={SUBTITLE}
          rating={4.92}
          reviewsLabel="128 reviews"
          onPressReviews={noop}
          location="Porto, Portugal"
          onPressLocation={noop}
          badge={<Badge content="Loved by guests" size="large" color="primary" />}
          actions={<HeaderActions />}
          testID="header"
        />
      </Frame>
      <Frame width={375}>
        <ListingHeader
          size="medium"
          title="Stone cottage in the vineyard hills"
          subtitle="Entire cottage in Lamego"
          rating={null}
          location="Lamego, Portugal"
          onPressLocation={noop}
          actions={<HeaderActions compact />}
        />
      </Frame>
    </View>
  ),
};

export const Highlights: Story = {
  render: () => (
    <Frame width={560}>
      <View style={{ gap: 32 }}>
        <ListingHighlights items={HIGHLIGHTS} testID="highlights" />
        <ListingHighlights items={HIGHLIGHTS.slice(0, 2)} iconSize={24} />
      </View>
    </Frame>
  ),
};

/** Two columns (auto at 720), one column (auto at 375), unavailable amenities, and a `limit` with "Show all". */
export const Amenities: Story = {
  render: () => (
    <View>
      <Frame width={720}>
        <Caption>auto, 720 wide — 2 columns</Caption>
        <AmenityList items={AMENITIES} limit={8} total={42} onShowAll={noop} testID="amenities" />
      </Frame>
      <Frame width={375}>
        <Caption>auto, 375 wide — 1 column</Caption>
        <AmenityList items={AMENITIES} limit={5} total={42} onShowAll={noop} />
      </Frame>
    </View>
  ),
};

export const Host: Story = {
  render: () => (
    <View>
      <Frame width={560}>
        <HostCard
          name="Marta"
          avatar="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400"
          verified
          label="Top host"
          labelIcon={RiMedalLine}
          stats={[
            { value: '214', label: 'Reviews' },
            { value: '4.92', label: 'Rating', star: true },
            { value: '7', label: 'Years hosting' },
          ]}
          details={[
            { icon: RiTranslate2, text: 'Speaks English, Portuguese and Spanish' },
            { icon: RiMapPin2Line, text: 'Lives in Porto, Portugal' },
          ]}
          responseLines={['Response rate: 100%', 'Responds within an hour']}
          onMessage={noop}
          onPressProfile={noop}
          testID="host"
        />
      </Frame>
      <Frame width={375}>
        <HostCard
          name="Duarte"
          stats={[
            { value: '12', label: 'Reviews' },
            { value: '1', label: 'Year hosting' },
          ]}
          onMessage={noop}
        />
      </Frame>
    </View>
  ),
};

/** Wide (distribution beside two columns of categories) and narrow (stacked, one column). */
export const Summary: Story = {
  render: () => (
    <View>
      <Frame width={1040}>
        <ReviewSummary
          rating={4.92}
          title="Loved by guests"
          description="128 reviews"
          categories={CATEGORIES}
          distribution={DISTRIBUTION}
          testID="summary"
        />
      </Frame>
      <Frame width={375}>
        <ReviewSummary rating={4.92} description="128 reviews" categories={CATEGORIES} distribution={DISTRIBUTION} />
      </Frame>
    </View>
  ),
};

/** A clamped review with a host response, a short one (no "Show more"), and a review without an avatar. */
export const Reviews: Story = {
  render: () => (
    <Frame width={480}>
      <View style={{ gap: 32 }}>
        {REVIEWS.map((review, index) => (
          <ReviewCard key={review.name} {...review} numberOfLines={3} testID={`review-${index}`} />
        ))}
      </View>
    </Frame>
  ),
};

/** Sections stacked: the hairline and the vertical rhythm, a `small` title and an action. */
export const Sections: Story = {
  render: () => {
    function Body() {
      const theme = useTheme();
      return (
        <Text variant="body-regular" style={{ color: theme.colors.text }}>
          A quiet two-bedroom flat on the third floor of a restored townhouse, five minutes on foot from the river.
        </Text>
      );
    }
    return (
      <Frame width={720}>
        <ListingSection divider={false} title="About this place" testID="section-1">
          <Body />
        </ListingSection>
        <ListingSection title="Where you’ll sleep" subtitle="2 bedrooms · 3 beds" testID="section-2">
          <Body />
        </ListingSection>
        <ListingSection size="small" title="House rules">
          <Body />
        </ListingSection>
      </Frame>
    );
  },
};

export const PartsDark: Story = {
  name: 'Parts, dark',
  globals: { theme: 'dark' },
  render: () => (
    <View>
      <Frame width={1040}>
        <View style={{ gap: 32 }}>
          <ListingHeader
            title="Sunlit flat above the river steps"
            subtitle={SUBTITLE}
            rating={4.92}
            reviewsLabel="128 reviews"
            onPressReviews={noop}
            location="Porto, Portugal"
            onPressLocation={noop}
            actions={<HeaderActions />}
          />
          <ListingPhotoGrid photos={PHOTOS} layout="grid" onPressPhoto={noop} onShowAll={noop} />
          <ListingHighlights items={HIGHLIGHTS} />
          <AmenityList items={AMENITIES} limit={10} total={42} onShowAll={noop} />
          <ReviewSummary rating={4.92} title="Loved by guests" description="128 reviews" categories={CATEGORIES} distribution={DISTRIBUTION} />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 48 }}>
            <ReviewCard {...REVIEWS[0]!} numberOfLines={3} style={{ flex: 1 }} />
            <HostCard
              name="Marta"
              avatar="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400"
              verified
              label="Top host"
              labelIcon={RiMedalLine}
              stats={[
                { value: '214', label: 'Reviews' },
                { value: '4.92', label: 'Rating', star: true },
                { value: '7', label: 'Years hosting' },
              ]}
              onMessage={noop}
              style={{ flex: 1 }}
            />
          </View>
        </View>
      </Frame>
    </View>
  ),
};
