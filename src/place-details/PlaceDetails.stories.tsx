import React, { useRef, useState } from 'react';
import { ScrollView, View, useWindowDimensions } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { BottomSheet } from '../bottom-sheet';
import { Button } from '../button';
import { ContentPanel } from '../content-panel';
import {
  RiBankCardLine,
  RiBookmarkLine,
  RiFileCopyLine,
  RiGlobalLine,
  RiLeafLine,
  RiMapPinLine,
  RiParkingBoxLine,
  RiPencilLine,
  RiPhoneLine,
  RiQrCodeLine,
  RiRouteLine,
  RiShare2Line,
  RiSunLine,
  RiVolumeUpLine,
  RiWalkLine,
  RiWheelchairLine,
  RiWifiLine,
} from '../icons/remix';
import { ListingPhotoGrid, ListingSection } from '../listing-details';
import { PlaceCard } from '../place-card';
import { PlaceReviewCard, PlaceReviewSummary } from '../place-reviews';
import { SurfaceLevelProvider, surfaceFillVars } from '../styles/surface-levels';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import ZoomableMediaGallery, {
  type ZoomableMediaGalleryHandle,
} from '../zoomable-media-gallery';
import { PlaceAmenities } from './PlaceAmenities';
import { PlaceHours } from './PlaceHours';
import { PlaceInfoList } from './PlaceInfoList';
import { PlacePopularTimes } from './PlacePopularTimes';
import { PlaceTransit } from './PlaceTransit';
import type {
  PlaceAmenity,
  PlaceHoursDay,
  PlaceInfoItem,
  PlacePopularTimesDay,
  PlaceTransitStop,
} from './types';

const meta: Meta = {
  title: 'Blocks/Maps/PlaceDetails',
  parameters: { layout: 'fullscreen' },
};

export default meta;

type Story = StoryObj;

const noop = () => undefined;

/** An inline illustration so the story needs no network. */
function photo(sky: string, wall: string, awning: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="654" height="400" viewBox="0 0 654 400"><rect width="654" height="400" fill="${sky}"/><rect y="120" width="654" height="280" fill="${wall}"/><rect x="60" y="180" width="150" height="150" fill="#F6F1E7"/><rect x="250" y="180" width="150" height="150" fill="#F6F1E7"/><rect x="440" y="180" width="120" height="220" fill="#7A5A44"/><path d="M40 170 L614 170 L614 210 L40 210 Z" fill="${awning}"/><circle cx="520" cy="300" r="6" fill="#F6F1E7"/></svg>`;
  // Raw markup: react-native-web percent-encodes a `;utf8,` SVG data URI itself.
  return `data:image/svg+xml;utf8,${svg}`;
}

const SHOPFRONT = photo('#DCE8F2', '#C9A27E', '#B4543F');
const COUNTER = photo('#E7E1F2', '#8E9BAE', '#3E5C76');
const TERRACE = photo('#D9EBF5', '#8FB08B', '#4E7A4A');
const OVEN = photo('#F2E6DC', '#A8724F', '#6E3B2A');

// ---------------------------------------------------------------------------
//  Demo data — one invented place
// ---------------------------------------------------------------------------

const INFO: PlaceInfoItem[] = [
  {
    id: 'address',
    icon: RiMapPinLine,
    label: 'Address',
    value: 'Plaça de les Bruixes 4, 08921 Vilafranca del Mar',
    action: 'copy',
    onPress: noop,
  },
  { id: 'phone', icon: RiPhoneLine, label: 'Phone', value: '+34 938 55 41 20', action: 'call', onPress: noop },
  {
    id: 'website',
    icon: RiGlobalLine,
    label: 'Website',
    value: 'fornerdelaplaca.example',
    action: 'open',
    onPress: noop,
  },
  {
    id: 'pluscode',
    icon: RiQrCodeLine,
    label: 'Plus code',
    value: '8FH4+2X Vilafranca del Mar',
    action: 'copy',
    onPress: noop,
    accessibilityLabel: 'Plus code: 8 F H 4 plus 2 X, Vilafranca del Mar',
  },
  { id: 'edit', icon: RiPencilLine, value: 'Suggest an edit', action: 'edit', onPress: noop },
];

const WEEK: PlaceHoursDay[] = [
  { label: 'Monday', intervals: [{ open: '07:30', close: '14:00' }] },
  {
    label: 'Tuesday',
    intervals: [
      { open: '07:30', close: '14:00' },
      { open: '17:00', close: '20:00' },
    ],
  },
  {
    label: 'Wednesday',
    intervals: [
      { open: '07:30', close: '14:00' },
      { open: '17:00', close: '20:00' },
    ],
    today: true,
  },
  {
    label: 'Thursday',
    intervals: [
      { open: '07:30', close: '14:00' },
      { open: '17:00', close: '20:00' },
    ],
  },
  { label: 'Friday', intervals: [{ open: '07:30', close: '20:00' }] },
  { label: 'Saturday', intervals: [{ open: '08:00', close: '15:00' }], exception: 'Market day' },
  { label: 'Sunday', intervals: [], exception: 'Public holiday' },
];

const AMENITIES: PlaceAmenity[] = [
  { label: 'Step-free entrance', icon: RiWheelchairLine, description: 'Ramp at the side door' },
  { label: 'Outdoor seating', icon: RiSunLine },
  { label: 'Free wifi', icon: RiWifiLine },
  { label: 'Cards accepted', icon: RiBankCardLine },
  { label: 'Quiet in the morning', icon: RiVolumeUpLine },
  { label: 'Own bread flour', icon: RiLeafLine },
  { label: 'Parking', icon: RiParkingBoxLine, available: false },
];

/** A day of trade, invented: two peaks with a quiet afternoon between them. */
function hours(shape: readonly number[], labels: readonly string[]) {
  return shape.map((value, index) => ({
    label: labels[index] ?? '',
    value,
    closed: value < 0,
    accessibilityLabel: `${labels[index] ?? ''} hundred hours`,
  }));
}

const HOUR_LABELS = ['6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21'];

const POPULAR: PlacePopularTimesDay[] = [
  {
    id: 'mon',
    label: 'M',
    accessibilityLabel: 'Monday',
    hours: hours([-1, 22, 54, 71, 58, 44, 61, 48, 20, -1, -1, -1, -1, -1, -1, -1], HOUR_LABELS),
  },
  {
    id: 'tue',
    label: 'T',
    accessibilityLabel: 'Tuesday',
    hours: hours([-1, 26, 58, 74, 60, 47, 63, 50, 22, -1, -1, 34, 52, 61, 40, -1], HOUR_LABELS),
  },
  {
    id: 'wed',
    label: 'W',
    accessibilityLabel: 'Wednesday',
    hours: hours([-1, 24, 55, 70, 64, 52, 66, 55, 24, -1, -1, 36, 58, 72, 45, -1], HOUR_LABELS),
    currentHourIndex: 12,
    trend: 'busier',
  },
  {
    id: 'thu',
    label: 'T',
    accessibilityLabel: 'Thursday',
    hours: hours([-1, 25, 57, 72, 59, 46, 62, 49, 21, -1, -1, 35, 54, 66, 42, -1], HOUR_LABELS),
  },
  {
    id: 'fri',
    label: 'F',
    accessibilityLabel: 'Friday',
    hours: hours([-1, 30, 66, 84, 70, 58, 74, 66, 40, 30, 28, 44, 70, 88, 62, 30], HOUR_LABELS),
  },
  {
    id: 'sat',
    label: 'S',
    accessibilityLabel: 'Saturday',
    hours: hours([-1, 38, 78, 96, 88, 74, 80, 62, 30, -1, -1, -1, -1, -1, -1, -1], HOUR_LABELS),
  },
  { id: 'sun', label: 'S', accessibilityLabel: 'Sunday', hours: [] },
];

const STOPS: PlaceTransitStop[] = [
  {
    id: 'bruixes',
    name: 'Plaça de les Bruixes',
    mode: 'bus',
    distance: '120 m · 2 min',
    note: 'Step-free access',
    lines: [
      { name: '12', color: '#1F6FB2' },
      { name: '34', color: '#B24F1F' },
      { name: 'N2' },
    ],
    departures: [
      { id: 'a', line: { name: '12', color: '#1F6FB2' }, headsign: 'Pla del Bosc', time: '4 min', realtime: true },
      { id: 'b', line: { name: '34', color: '#B24F1F' }, headsign: 'Estació Vella', time: '9 min', realtime: true },
      { id: 'c', line: { name: '12', color: '#1F6FB2' }, headsign: 'Pla del Bosc', time: '18:42' },
    ],
  },
  {
    id: 'mercat',
    name: 'Mercat Nou',
    mode: 'metro',
    distance: '340 m · 5 min',
    lines: [
      { name: 'L4', color: '#E0A526' },
      { name: 'L7', color: '#5A4FB2' },
    ],
    departures: [
      { id: 'd', line: { name: 'L4', color: '#E0A526' }, headsign: 'Port Antic', time: '2 min', realtime: true },
      { id: 'e', line: { name: 'L7', color: '#5A4FB2' }, headsign: 'Camp Gran', time: '7 min' },
    ],
  },
  {
    id: 'riera',
    name: 'Riera de Dalt',
    mode: 'tram',
    distance: '600 m · 8 min',
    lines: [{ name: 'T1', color: '#2E8B6E' }],
    departures: [],
  },
];

const GALLERY_PHOTOS = [
  { source: SHOPFRONT, alt: 'The shopfront under its awning' },
  { source: COUNTER, alt: 'The counter at opening time' },
  { source: TERRACE, alt: 'Four tables on the square' },
  { source: OVEN, alt: 'The oven at the back' },
];

// ---------------------------------------------------------------------------
//  Stories
// ---------------------------------------------------------------------------

function Frame({ children, width = 390 }: { children: React.ReactNode; width?: number }) {
  return (
    <View style={{ padding: 16 }}>
      <View style={{ width: '100%', maxWidth: width, gap: 24 }}>{children}</View>
    </View>
  );
}

/** The rows you act on: copy the address, ring the place, open its site. */
export const InfoList: Story = {
  render: () => (
    <Frame>
      <PlaceInfoList items={INFO} testID="info" />
    </Frame>
  ),
};

/** Today's answer over the week it comes from. Shut, then already open. */
export const Hours: Story = {
  render: () => (
    <Frame>
      <PlaceHours
        state="open"
        summary="Open until 20:00"
        days={WEEK}
        testID="hours-closed"
      />
      <PlaceHours
        state="closing-soon"
        summary="Closes at 20:00"
        days={WEEK}
        defaultExpanded
        testID="hours-open"
      />
      <PlaceHours
        state="closed"
        summary="Closed — opens 07:30 tomorrow"
        days={WEEK}
        testID="hours-shut"
      />
    </Frame>
  ),
};

/** The same amenities twice: the list a page uses, the strip a sheet uses. */
export const Amenities: Story = {
  render: () => (
    <Frame width={720}>
      <PlaceAmenities items={AMENITIES} testID="amenities-list" />
      <PlaceAmenities items={AMENITIES} layout="chips" testID="amenities-chips" />
    </Frame>
  ),
};

/** A chart, not a meter: the hours of one day against each other. */
export const PopularTimes: Story = {
  render: () => (
    <Frame>
      <PlacePopularTimes days={POPULAR} testID="popular" />
    </Frame>
  ),
};

/** The stops around the place, with the lines and what is due. */
export const Transit: Story = {
  render: () => (
    <Frame>
      <PlaceTransit stops={STOPS} onPressStop={noop} testID="transit" />
    </Frame>
  ),
};

/** Nothing to show: an empty day, a stop with no vehicle due, no amenities. */
export const Empty: Story = {
  render: () => (
    <Frame>
      <PlacePopularTimes days={[POPULAR[6]!]} testID="popular-empty" />
      <PlaceTransit stops={[STOPS[2]!]} testID="transit-empty" />
    </Frame>
  ),
};

// ---------------------------------------------------------------------------
//  The whole screen
// ---------------------------------------------------------------------------

function PlaceScreenBody() {
  const gallery = useRef<ZoomableMediaGalleryHandle>(null);
  const [saved, setSaved] = useState(false);

  const openGallery = (index: number) => {
    gallery.current?.open(
      GALLERY_PHOTOS.map((item) => ({ uri: item.source, alt: item.alt, aspectRatio: 654 / 400 })),
      index,
    );
  };

  return (
    <>
      <PlaceCard
        density="detail"
        name="Forner de la Plaça"
        category="Bakery · €€"
        photo={SHOPFRONT}
        rating={4.6}
        reviewCount={318}
        openState="open"
        hours="Open until 20:00"
        address="Plaça de les Bruixes 4"
        figure="12 min"
        figureLabel="Walk from you"
        figureDetail="950 m"
        stats={[
          { value: '€€', label: 'Price' },
          { value: '318', label: 'Reviews' },
          { value: '4.6', label: 'Rating' },
        ]}
        actions={[
          { id: 'directions', label: 'Directions', icon: RiRouteLine, onPress: noop },
          { id: 'call', label: 'Call', icon: RiPhoneLine, onPress: noop },
          {
            id: 'save',
            label: saved ? 'Saved' : 'Save',
            icon: RiBookmarkLine,
            onPress: () => setSaved((value) => !value),
          },
          { id: 'share', label: 'Share', icon: RiShare2Line, onPress: noop },
        ]}
      />

      <PlaceHours state="open" summary="Open until 20:00" days={WEEK} />

      <ListingSection title="Photos">
        <ListingPhotoGrid
          photos={GALLERY_PHOTOS}
          onPressPhoto={openGallery}
          onShowAll={() => openGallery(0)}
          accessibilityLabel="Photos of Forner de la Plaça"
        />
      </ListingSection>

      <ListingSection title="About">
        <PlaceInfoList items={INFO} />
      </ListingSection>

      <ListingSection title="Popular times">
        <PlacePopularTimes days={POPULAR} />
      </ListingSection>

      <ListingSection title="What it has">
        <PlaceAmenities items={AMENITIES} />
      </ListingSection>

      <ListingSection title="Getting there">
        <PlaceTransit
          stops={STOPS}
          departureLimit={2}
          onPressStop={noop}
          footer={
            <View style={{ flexDirection: 'row' }}>
              <Button variant="secondary" size="small" onPress={noop}>
                All nearby stops
              </Button>
            </View>
          }
        />
      </ListingSection>

      <ListingSection title="Reviews">
        <View style={{ gap: 24 }}>
          <PlaceReviewSummary
            rating={4.6}
            reviewCount={318}
            categories={[
              { label: 'Bread', value: 4.8 },
              { label: 'Service', value: 4.4 },
              { label: 'Value', value: 4.5 },
            ]}
          />
          <PlaceReviewCard
            authorLabel="A regular"
            authorInitial="R"
            date="Two weeks ago"
            rating={5}
            text="The sourdough is out at half seven and gone by ten. Worth the walk; the terrace catches the morning sun."
          />
          <PlaceReviewCard
            authorLabel="A visitor"
            authorInitial="V"
            date="Last month"
            rating={4}
            text="Queue out of the door on Saturday, but it moves. Ask for the day-old loaf if you are making toast."
          />
        </View>
      </ListingSection>

      <ZoomableMediaGallery ref={gallery} indicatorVariant="thumbnails" />
    </>
  );
}

/** A flat wash standing in for the map the sheet is drawn over. */
function MapBackdrop({ children }: { children?: React.ReactNode }) {
  return (
    <View
      aria-hidden
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ flex: 1, backgroundColor: '#9FB8A4', minHeight: 240 }}
    >
      {children}
    </View>
  );
}

/**
 * THE WHOLE SCREEN, and the point of this family: `PlaceCard`'s detail header,
 * then every part below it, then `place-reviews`. A sheet over the map on a
 * phone, a panel beside it on a desktop — the same body either way.
 */
function PlaceScreen() {
  const { width } = useWindowDimensions();
  const phone = width < 768;

  if (phone) {
    return (
      <View style={{ height: '100%', minHeight: 600 }}>
        <MapBackdrop />
        <PlaceSheet>
          <PlaceScreenBody />
        </PlaceSheet>
      </View>
    );
  }

  return (
    <View style={{ flexDirection: 'row', height: '100%', minHeight: 720 }}>
      <View style={{ width: 420, height: '100%' }}>
        <ContentPanel framed={false} fill>
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 48, gap: 8 }}>
            <PlaceScreenBody />
          </ScrollView>
        </ContentPanel>
      </View>
      <MapBackdrop />
    </View>
  );
}

/**
 * The phone side: Bloom's own `BottomSheet`, mounted OPEN (the controlled
 * path, so there is no present()-in-an-effect race), over the map.
 *
 * It publishes its fill (`SurfaceLevelProvider` + `surfaceFillVars`) — the
 * contract every block inside reads to paint itself. The settings card, the
 * chart track and the hairlines all resolve off the sheet's colour rather than
 * off the page's, which is the whole reason nothing in this family takes a
 * `surface` prop.
 *
 * The sheet takes its height from its CONTENT, and a whole place screen is
 * taller than any phone — so the story gives the content a height and lets the
 * sheet scroll inside it, which is what leaves the map visible above. An app
 * drives that from its own detents instead.
 */
function PlaceSheet({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  const { height } = useWindowDimensions();
  // No backdrop at all: a place sheet is not a modal over the map, it is the
  // other half of the screen, and the map has to stay readable beside it.
  // `backdropOpacity={0}` is not the same thing — the scrim is still drawn.
  return (
    <BottomSheet open showHandle backdropComponent={() => null}>
      <SurfaceLevelProvider level={1} fill={theme.colors.card}>
        <View
          style={[
            { height: Math.round(height * 0.78), backgroundColor: theme.colors.card },
            surfaceFillVars(theme.colors.card),
          ]}
        >
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 64, gap: 8 }}>
            {children}
          </ScrollView>
        </View>
      </SurfaceLevelProvider>
    </BottomSheet>
  );
}

export const Screen: Story = {
  render: () => <PlaceScreen />,
};

/** The body on its own, for reading the sections end to end. */
export const Body: Story = {
  render: () => (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 64 }}>
      <View style={{ width: '100%', maxWidth: 560, alignSelf: 'center' }}>
        <PlaceScreenBody />
      </View>
    </ScrollView>
  ),
};

/** A place with nothing but its name — every part asked to draw nothing. */
export const Sparse: Story = {
  render: () => (
    <Frame>
      <Text variant="body-2-regular">Every block below was given an empty list.</Text>
      <PlaceInfoList items={[]} />
      <PlaceAmenities items={[]} />
      <PlaceTransit stops={[]} />
    </Frame>
  ),
};
