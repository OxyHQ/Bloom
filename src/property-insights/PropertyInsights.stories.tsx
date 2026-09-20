import React, { useRef, useState } from 'react';
import { View, useWindowDimensions } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import {
  RiArrowUpDownLine,
  RiBuildingLine,
  RiBusLine,
  RiCalendarLine,
  RiCompass3Line,
  RiDropLine,
  RiFireLine,
  RiHammerLine,
  RiHospitalLine,
  RiHotelBedLine,
  RiMedalLine,
  RiParkingBoxLine,
  RiRulerLine,
  RiSchoolLine,
  RiShieldCheckLine,
  RiShoppingCartLine,
  RiSofaLine,
  RiStairsLine,
  RiStore2Line,
  RiSubwayLine,
  RiTrainLine,
  RiTranslate2,
  RiTreeLine,
  RiVolumeDownLine,
} from '../icons/remix';
import {
  ContactCard,
  FloorPlan,
  HostCard,
  ListingHeader,
  ListingPhotoGrid,
  ListingSection,
  PropertyFacts,
} from '../listing-details';
import type { FloorPlanItem, ListingPhoto, PropertyFact } from '../listing-details';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { ZoomableMediaGallery } from '../zoomable-media-gallery/ZoomableMediaGallery';
import type { GalleryImage, ZoomableMediaGalleryHandle } from '../zoomable-media-gallery/types';
import { EnergyBadge } from './EnergyBadge';
import { EnergyLabel } from './EnergyLabel';
import { NearbyPlaces } from './NearbyPlaces';
import { NeighbourhoodScores } from './NeighbourhoodScores';
import { PriceEstimate } from './PriceEstimate';
import { PriceHistoryChart } from './PriceHistoryChart';
import { PricePerAreaComparison } from './PricePerAreaComparison';
import { RentHistoryList } from './RentHistoryList';
import type {
  AreaPriceRow,
  NearbyPlace,
  NeighbourhoodScore,
  PriceHistoryPeriod,
  PriceHistoryPoint,
  RentHistoryEntry,
} from './types';

const meta: Meta = {
  title: 'Blocks/Housing/Property Insights',
  parameters: { layout: 'fullscreen' },
};

export default meta;

type Story = StoryObj;

const noop = () => {};

// ---------------------------------------------------------------------------
//  Demo data — an invented flat for sale in Porto and a rental in Braga
// ---------------------------------------------------------------------------

const img = (id: string) => `https://images.unsplash.com/photo-${id}?w=1400&q=80`;

const PHOTOS: ListingPhoto[] = [
  { source: img('1502672260266-1c1ef2d93688'), alt: 'Living room' },
  { source: img('1522708323590-d24dbb6b0267'), alt: 'Open living and dining area' },
  { source: img('1484154218962-a197022b5858'), alt: 'Kitchen' },
  { source: img('1505691938895-1758d7feb511'), alt: 'Bedroom' },
  { source: img('1600585154340-be6161a56a0c'), alt: 'Building exterior' },
];

/** Two invented plans drawn as SVG data URIs, so the stories need no plan image from the network. */
function planSvg(rooms: { x: number; y: number; w: number; h: number; label: string }[]): string {
  const walls = rooms
    .map((r) => `<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" fill="none" stroke="#222" stroke-width="4"/>`)
    .join('');
  const labels = rooms
    .map(
      (r) =>
        `<text x="${r.x + r.w / 2}" y="${r.y + r.h / 2}" font-family="sans-serif" font-size="16" fill="#444" text-anchor="middle" dominant-baseline="middle">${r.label}</text>`,
    )
    .join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 480"><rect width="640" height="480" fill="#fff"/>${walls}<rect x="20" y="20" width="600" height="440" fill="none" stroke="#222" stroke-width="10"/>${labels}</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

const PLANS: FloorPlanItem[] = [
  {
    source: planSvg([
      { x: 20, y: 20, w: 340, h: 260, label: 'Living · 28 m²' },
      { x: 360, y: 20, w: 260, h: 180, label: 'Kitchen' },
      { x: 360, y: 200, w: 260, h: 80, label: 'Bath' },
      { x: 20, y: 280, w: 300, h: 180, label: 'Bedroom · 14 m²' },
      { x: 320, y: 280, w: 300, h: 180, label: 'Bedroom · 11 m²' },
    ]),
    label: 'Main floor · 96 m²',
    description: '3 bedrooms, 2 baths',
  },
  {
    source: planSvg([
      { x: 20, y: 20, w: 400, h: 440, label: 'Loft studio' },
      { x: 420, y: 20, w: 200, h: 220, label: 'Terrace' },
      { x: 420, y: 240, w: 200, h: 220, label: 'Storage' },
    ]),
    label: 'Upper floor · 42 m²',
    description: 'Loft and terrace',
  },
];

const PLAN_GALLERY: GalleryImage[] = PLANS.map((p) => ({ uri: p.source, alt: p.label, aspectRatio: 4 / 3 }));

const SALE_FACTS: PropertyFact[] = [
  { icon: RiRulerLine, label: 'Built area', value: '138 m²' },
  { icon: RiSofaLine, label: 'Usable area', value: '121 m²' },
  { icon: RiHotelBedLine, label: 'Bedrooms', value: '3' },
  { icon: RiDropLine, label: 'Bathrooms', value: '2' },
  { icon: RiStairsLine, label: 'Floor', value: '3rd of 5' },
  { icon: RiArrowUpDownLine, label: 'Elevator', value: 'Yes' },
  { icon: RiCalendarLine, label: 'Year built', value: '1962' },
  { icon: RiCompass3Line, label: 'Orientation', value: 'South-west' },
  { icon: RiHammerLine, label: 'Condition', value: 'Renovated 2021' },
  { icon: RiFireLine, label: 'Heating', value: 'Heat pump' },
  { icon: RiParkingBoxLine, label: 'Parking', value: '1 space' },
  { icon: RiBuildingLine, label: 'Community fees', value: '€65 / month' },
];

const RENTAL_FACTS: PropertyFact[] = [
  { icon: RiRulerLine, label: 'Built area', value: '74 m²' },
  { icon: RiHotelBedLine, label: 'Bedrooms', value: '2' },
  { icon: RiDropLine, label: 'Bathrooms', value: '1' },
  { icon: RiStairsLine, label: 'Floor', value: '1st' },
  { icon: RiSofaLine, label: 'Furnished', value: 'Yes' },
  { icon: RiCalendarLine, label: 'Available', value: '1 Oct 2026' },
];

const MONTHS = ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];
const FULL: Record<string, string> = {
  Jan: 'January', Feb: 'February', Mar: 'March', Apr: 'April', May: 'May', Jun: 'June',
  Jul: 'July', Aug: 'August', Sep: 'September', Oct: 'October', Nov: 'November', Dec: 'December',
};

const ONE_YEAR: PriceHistoryPoint[] = MONTHS.map((m, i) => {
  const year = i < 4 ? 2025 : 2026;
  const value = i < 6 ? 405000 : i < 10 ? 385000 : 385000;
  return { label: m, value, title: `${FULL[m]} ${year}` };
});

const PERIODS: PriceHistoryPeriod[] = [
  {
    id: '1y',
    label: '1Y',
    data: ONE_YEAR,
    events: [
      { index: 0, kind: 'listed', label: 'Listed', date: 'Sep 2025' },
      { index: 6, kind: 'price-drop', label: 'Price drop −5%', date: 'Mar 2026' },
    ],
  },
  {
    id: '3y',
    label: '3Y',
    data: [
      { label: '2023', value: 312000, title: 'Autumn 2023' },
      { label: 'Q1', value: 312000, title: 'Q1 2024' },
      { label: 'Q2', value: 312000, title: 'Q2 2024' },
      { label: 'Q3', value: 312000, title: 'Q3 2024' },
      { label: '2025', value: 405000, title: 'Q3 2025' },
      { label: 'Q4', value: 405000, title: 'Q4 2025' },
      { label: 'Q1', value: 385000, title: 'Q1 2026' },
      { label: '2026', value: 385000, title: 'Q3 2026' },
    ],
    events: [
      { index: 0, kind: 'sold', label: 'Sold', date: 'Oct 2023' },
      { index: 4, kind: 'listed', label: 'Listed', date: 'Sep 2025' },
      { index: 6, kind: 'price-drop', label: 'Price drop −5%', date: 'Mar 2026' },
    ],
  },
  {
    id: 'all',
    label: 'All',
    data: [
      { label: '2014', value: 168000 },
      { label: '2016', value: 168000 },
      { label: '2018', value: 236000 },
      { label: '2020', value: 236000 },
      { label: '2022', value: 236000 },
      { label: '2023', value: 312000 },
      { label: '2025', value: 405000 },
      { label: '2026', value: 385000 },
    ],
    events: [
      { index: 0, kind: 'sold', label: 'Sold', date: 'Apr 2014' },
      { index: 2, kind: 'sold', label: 'Sold', date: 'Jun 2018' },
      { index: 5, kind: 'sold', label: 'Sold', date: 'Oct 2023' },
      { index: 6, kind: 'listed', label: 'Listed', date: 'Sep 2025' },
      { index: 7, kind: 'price-drop', label: 'Price drop −5%', date: 'Mar 2026' },
    ],
  },
];

const COMPARISON: AreaPriceRow[] = [
  { label: 'This home', value: 2790, display: '€2,790/m²', highlight: true },
  { label: 'Rua do Almada', value: 3120, display: '€3,120/m²' },
  { label: 'Cedofeita', value: 2940, display: '€2,940/m²' },
  { label: 'Porto', value: 2610, display: '€2,610/m²' },
];

const SCORES: NeighbourhoodScore[] = [
  { icon: RiBusLine, label: 'Transport', value: 9.2, description: 'Metro 4 min, six bus lines' },
  { icon: RiSchoolLine, label: 'Schools', value: 7.8, description: 'Two primary schools within 800 m' },
  { icon: RiShoppingCartLine, label: 'Shops', value: 8.9, description: 'Market, bakery and pharmacy on the street' },
  { icon: RiTreeLine, label: 'Green areas', value: 6.1, description: 'A garden square 9 min away' },
  { icon: RiVolumeDownLine, label: 'Quiet', value: 5.4, description: 'Busy on weekend evenings' },
  { icon: RiShieldCheckLine, label: 'Safety', value: 8.3, description: 'Well lit, lively until late' },
];

const NEARBY: NearbyPlace[] = [
  { icon: RiSubwayLine, name: 'Lapa station', category: 'Metro', time: '4 min' },
  { icon: RiSchoolLine, name: 'Escola das Oliveiras', category: 'Primary school', time: '7 min' },
  { icon: RiStore2Line, name: 'Mercado do Bolhão', category: 'Market', time: '9 min' },
  { icon: RiHospitalLine, name: 'Santo Amaro clinic', category: 'Health centre', time: '12 min' },
  { icon: RiTrainLine, name: 'Trindade', category: 'Train station', time: '14 min' },
];

const RENT_HISTORY: RentHistoryEntry[] = [
  { period: 'Since Oct 2026', amount: '€1,150 / month', delta: '+4%', note: 'Current listing' },
  { period: 'Oct 2023 – Sep 2026', amount: '€1,105 / month', delta: '+6%', note: 'Rented' },
  { period: 'Mar 2021 – Sep 2023', amount: '€1,040 / month', delta: '−2%', note: 'Rented' },
  { period: 'Feb 2019 – Feb 2021', amount: '€1,060 / month', note: 'Rented' },
];

const REASONS = [
  'Nine sales within 400 m in the last 12 months, median €2,860/m²',
  'Renovated in 2021, which recent sales on the street reward by about 6%',
  'Third floor with an elevator and a south-west aspect',
  'No terrace, unlike four of the closest comparables',
];

// ---------------------------------------------------------------------------
//  Frames
// ---------------------------------------------------------------------------

const BLEED = {};

function Frame({ width, children, gap = 32 }: { width: number; children: React.ReactNode; gap?: number }) {
  width = Math.min(width, useWindowDimensions().width - 32);
  const theme = useTheme();
  const gutter = width < 480 ? 16 : 24;
  return (
    <View style={{ alignItems: 'flex-start', backgroundColor: theme.colors.background }}>
      <View
        style={{
          width,
          gap,
          backgroundColor: theme.colors.background,
          paddingTop: 24,
          paddingBottom: 24,
          paddingLeft: gutter,
          paddingRight: gutter,
        }}
      >
        {children}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
//  Pages
// ---------------------------------------------------------------------------

function AgentContact({ testID }: { testID?: string }) {
  return (
    <ContactCard
      role="agent"
      name="Leonor Brandão"
      avatar="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400"
      verified
      stats={[
        { value: '38', label: 'Homes sold' },
        { value: '4.9', label: 'Rating', star: true },
        { value: '11', label: 'Years' },
      ]}
      agency="Casa Ribeirinha Imóveis"
      logo={planSvgLogo}
      responseTime="Usually responds within an hour"
      activeListings={12}
      onPressListings={noop}
      details={[{ icon: RiTranslate2, text: 'Speaks Portuguese, English and French' }]}
      phone="+351 912 480 316"
      onMessage={noop}
      onCall={noop}
      testID={testID}
    />
  );
}

const planSvgLogo = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" rx="8" fill="#0f766e"/><path d="M8 22 20 11l12 11v10H8z" fill="#fff"/><rect x="17" y="24" width="6" height="8" fill="#0f766e"/></svg>',
)}`;

function LandlordContact({ testID }: { testID?: string }) {
  return (
    <ContactCard
      role="landlord"
      name="Artur Meireles"
      stats={[
        { value: '3', label: 'Homes let' },
        { value: '6', label: 'Years' },
      ]}
      responseTime="Usually responds within a day"
      activeListings={1}
      phone="+351 934 118 502"
      onMessage={noop}
      testID={testID}
    />
  );
}

function SalePage({ width }: { width: number }) {
  width = Math.min(width, useWindowDimensions().width - 32);
  const theme = useTheme();
  const gallery = useRef<ZoomableMediaGalleryHandle>(null);
  const narrow = width < 744;
  const gutter = narrow ? 16 : 80;
  const content = (
    <>
      <ListingSection title="Features" divider={false}>
        <PropertyFacts items={SALE_FACTS} limit={narrow ? 6 : 8} onShowAll={noop} testID="sale-facts" />
      </ListingSection>
      <ListingSection title="Floor plans">
        <FloorPlan plans={PLANS} onPressPlan={(i) => gallery.current?.open(PLAN_GALLERY, i)} testID="sale-plans" />
      </ListingSection>
      <ListingSection title="Energy certificate">
        <EnergyLabel
          consumption={{ rating: 'C', value: '112 kWh/m²·year' }}
          emissions={{ rating: 'D', value: '24 kg CO₂/m²·year' }}
          testID="sale-energy"
        />
      </ListingSection>
      <ListingSection title="Is the price right?">
        <View style={{ gap: 24 }}>
          <PriceEstimate
            low={362000}
            high={398000}
            estimate={381000}
            asking={385000}
            confidence="high"
            confidenceNote="Nine recent sales nearby"
            reasons={REASONS}
            comparables={24}
            method="Automated valuation"
            version="Model 3.2"
            updated="Updated 2 Sep 2026"
            testID="sale-estimate"
          />
          <PriceHistoryChart periods={PERIODS} testID="sale-history" />
          <View style={{ gap: 12 }}>
            <Text variant="headline-semibold" style={{ color: theme.colors.text }}>
              Price per square metre
            </Text>
            <PricePerAreaComparison rows={COMPARISON} testID="sale-comparison" />
          </View>
        </View>
      </ListingSection>
      <ListingSection title="The neighbourhood" subtitle="Cedofeita, Porto">
        <View style={{ gap: 16 }}>
          <NeighbourhoodScores items={SCORES} testID="sale-scores" />
          <NearbyPlaces items={NEARBY} />
        </View>
      </ListingSection>
    </>
  );
  return (
    <View style={[BLEED, { width, backgroundColor: theme.colors.background }]}>
      <View style={{ paddingLeft: gutter, paddingRight: gutter, paddingTop: 32, paddingBottom: 48, gap: 24 }}>
        <ListingHeader
          size={narrow ? 'medium' : 'large'}
          title="Renovated three-bedroom flat near the market"
          subtitle={['Flat for sale in Cedofeita, Porto', '138 m²', '3 bedrooms', '2 baths']}
          location="Porto, Portugal"
          badge={<EnergyBadge rating="C" />}
        />
        <ListingPhotoGrid photos={PHOTOS} onPressPhoto={noop} />
        {narrow ? (
          <View>
            {content}
            <ListingSection title="Listed by">
              <AgentContact testID="sale-contact" />
            </ListingSection>
          </View>
        ) : (
          <View style={{ flexDirection: 'row', gap: 64, alignItems: 'flex-start' }}>
            <View style={{ flex: 1, minWidth: 0 }}>{content}</View>
            <View style={{ width: 360, maxWidth: '100%', paddingTop: 32 }}>
              <AgentContact testID="sale-contact" />
            </View>
          </View>
        )}
      </View>
      <ZoomableMediaGallery ref={gallery} indicatorVariant="thumbnails" />
    </View>
  );
}

function RentalPage({ width }: { width: number }) {
  width = Math.min(width, useWindowDimensions().width - 32);
  const theme = useTheme();
  const narrow = width < 744;
  const gutter = narrow ? 16 : 80;
  const content = (
    <>
      <ListingSection title="Features" divider={false}>
        <PropertyFacts items={RENTAL_FACTS} testID="rental-facts" />
      </ListingSection>
      <ListingSection title="Energy certificate">
        <EnergyLabel pending testID="rental-energy" />
      </ListingSection>
      <ListingSection title="Rent history" subtitle="Every rent this flat has been let for">
        <RentHistoryList items={RENT_HISTORY} testID="rental-history" />
      </ListingSection>
      <ListingSection title="The neighbourhood" subtitle="Maximinos, Braga">
        <NeighbourhoodScores items={SCORES.slice(0, 4)} variant="rings" />
      </ListingSection>
    </>
  );
  return (
    <View style={[BLEED, { width, backgroundColor: theme.colors.background }]}>
      <View style={{ paddingLeft: gutter, paddingRight: gutter, paddingTop: 32, paddingBottom: 48, gap: 24 }}>
        <ListingHeader
          size={narrow ? 'medium' : 'large'}
          title="Bright two-bedroom flat by the cathedral"
          subtitle={['Flat for rent in Braga', '€1,150 / month', '2 bedrooms', '1 bath']}
          location="Braga, Portugal"
          badge={<EnergyBadge pending />}
        />
        <ListingPhotoGrid photos={PHOTOS.slice(1)} onPressPhoto={noop} />
        {narrow ? (
          <View>
            {content}
            <ListingSection title="Your landlord">
              <LandlordContact testID="rental-contact" />
            </ListingSection>
          </View>
        ) : (
          <View style={{ flexDirection: 'row', gap: 64, alignItems: 'flex-start' }}>
            <View style={{ flex: 1, minWidth: 0 }}>{content}</View>
            <View style={{ width: 360, maxWidth: '100%', paddingTop: 32 }}>
              <LandlordContact testID="rental-contact" />
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

/** A home for sale at 1280: facts, floor plans, energy, the explainable estimate, price history, €/m², neighbourhood, and the agent beside it. */
export const SalePageWide: Story = { name: 'Sale page — 1280', render: () => <SalePage width={1280} /> };
export const SalePageNarrow: Story = { name: 'Sale page — 390', render: () => <SalePage width={390} /> };
export const SalePageWideDark: Story = {
  name: 'Sale page — 1280, dark',
  globals: { theme: 'dark' },
  render: () => <SalePage width={1280} />,
};
export const SalePageNarrowDark: Story = {
  name: 'Sale page — 390, dark',
  globals: { theme: 'dark' },
  render: () => <SalePage width={390} />,
};

/** A rental at 1280: facts, a certificate still in progress, the place's rent history, neighbourhood rings, the landlord. */
export const RentalPageWide: Story = { name: 'Rental page — 1280', render: () => <RentalPage width={1280} /> };
export const RentalPageNarrow: Story = { name: 'Rental page — 390', render: () => <RentalPage width={390} /> };
export const RentalPageNarrowDark: Story = {
  name: 'Rental page — 390, dark',
  globals: { theme: 'dark' },
  render: () => <RentalPage width={390} />,
};

// ---------------------------------------------------------------------------
//  Parts
// ---------------------------------------------------------------------------

/** `columns="auto"`: 4 at 800, 3 at 560, 2 at 390 — and a `limit` with "Show all". */
export const Facts: Story = {
  render: () => (
    <View style={BLEED}>
      <Frame width={800}>
        <PropertyFacts items={SALE_FACTS} limit={8} onShowAll={noop} testID="facts" />
      </Frame>
      <Frame width={560}>
        <PropertyFacts items={SALE_FACTS.slice(0, 6)} />
      </Frame>
      <Frame width={390}>
        <PropertyFacts items={SALE_FACTS} limit={4} onShowAll={noop} />
      </Frame>
    </View>
  ),
};

function RevealedAgent() {
  const [revealed, setRevealed] = useState(true);
  return (
    <ContactCard
      role="agency"
      name="Casa Ribeirinha Imóveis"
      logo={planSvgLogo}
      verified
      stats={[
        { value: '214', label: 'Homes sold' },
        { value: '19', label: 'Years' },
      ]}
      activeListings={48}
      onPressListings={noop}
      phone="+351 220 118 400"
      phoneRevealed={revealed}
      onPhoneRevealedChange={setRevealed}
      onMessage={noop}
    />
  );
}

/** An agent with agency, a landlord, an agency with its number already shown, and `HostCard` (unchanged). */
export const Contact: Story = {
  render: () => (
    <View style={BLEED}>
      <Frame width={1040}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 40, alignItems: 'flex-start' }}>
          <View style={{ flex: 1, minWidth: 240, maxWidth: '100%' }}>
            <AgentContact testID="contact-agent" />
          </View>
          <View style={{ flex: 1, minWidth: 240, maxWidth: '100%' }}>
            <LandlordContact testID="contact-landlord" />
          </View>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 40, alignItems: 'flex-start' }}>
          <View style={{ flex: 1, minWidth: 240, maxWidth: '100%' }}>
            <RevealedAgent />
          </View>
          <View style={{ flex: 1, minWidth: 240, maxWidth: '100%' }}>
            <HostCard
              name="Marta"
              avatar="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400"
              verified
              label="Top host"
              labelIcon={RiMedalLine}
              stats={[
                { value: '214', label: 'Reviews' },
                { value: '4.92', label: 'Rating', star: true },
              ]}
              onMessage={noop}
            />
          </View>
        </View>
      </Frame>
      <Frame width={390}>
        <AgentContact />
      </Frame>
    </View>
  ),
};

function PlansWithGallery({ count }: { count: number }) {
  const gallery = useRef<ZoomableMediaGalleryHandle>(null);
  return (
    <>
      <FloorPlan
        plans={PLANS.slice(0, count)}
        onPressPlan={(i) => gallery.current?.open(PLAN_GALLERY.slice(0, count), i)}
        testID={`plans-${count}`}
      />
      <ZoomableMediaGallery ref={gallery} indicatorVariant="thumbnails" />
    </>
  );
}

/** Two plans side by side at 800, one plan full width, and two stacked at 390. Press a plan to open the gallery. */
export const FloorPlans: Story = {
  render: () => (
    <View style={BLEED}>
      <Frame width={800}>
        <PlansWithGallery count={2} />
      </Frame>
      <Frame width={560}>
        <PlansWithGallery count={1} />
      </Frame>
      <Frame width={390}>
        <PlansWithGallery count={2} />
      </Frame>
    </View>
  ),
};

/** Both ratings wide (values in the tags) and narrow (values under the column labels), one rating, a pending certificate, and the badges. */
export const Energy: Story = {
  render: () => (
    <View style={BLEED}>
      <Frame width={720}>
        <EnergyLabel
          consumption={{ rating: 'C', value: '112 kWh/m²·year' }}
          emissions={{ rating: 'D', value: '24 kg CO₂/m²·year' }}
          testID="energy"
        />
        <EnergyLabel consumption={{ rating: 'A', value: '38 kWh/m²·year' }} />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {(['A', 'B', 'C', 'D', 'E', 'F', 'G'] as const).map((r) => (
            <EnergyBadge key={r} rating={r} testID={`badge-${r}`} />
          ))}
          <EnergyBadge pending />
          <EnergyBadge rating="B" size="small" />
          <EnergyBadge rating="F" size="small" label="" />
        </View>
      </Frame>
      <Frame width={390}>
        <EnergyLabel
          consumption={{ rating: 'G', value: '412 kWh/m²·year' }}
          emissions={{ rating: 'E', value: '71 kg CO₂/m²·year' }}
        />
        <EnergyLabel pending testID="energy-pending" />
      </Frame>
    </View>
  ),
};

/** Step (default) with periods and events, a line with no periods, and a home with no history yet. */
export const PriceHistory: Story = {
  render: () => (
    <View style={BLEED}>
      <Frame width={720}>
        <PriceHistoryChart periods={PERIODS} testID="history" />
        <PriceHistoryChart
          shape="line"
          title="Asking rent"
          format={(v) => `€${v.toLocaleString('en')}`}
          formatAxisValue={(v) => `€${v}`}
          currentLabel="Now"
          data={[
            { label: '2021', value: 1040 },
            { label: '2022', value: 1040 },
            { label: '2023', value: 1105 },
            { label: '2024', value: 1105 },
            { label: '2025', value: 1105 },
            { label: '2026', value: 1150 },
          ]}
          events={[
            { index: 0, kind: 'rented', label: 'Rented' },
            { index: 2, kind: 'price-rise', label: 'Rent up 6%' },
            { index: 5, kind: 'listed', label: 'Listed' },
          ]}
        />
      </Frame>
      <Frame width={390}>
        <PriceHistoryChart periods={PERIODS} />
        <PriceHistoryChart data={[]} currentPrice={219000} testID="history-empty" />
      </Frame>
    </View>
  ),
};

/** High confidence and fair; medium and 8% above; high and 22% above (error); LOW confidence: the band widens and the verdict is withheld. */
export const Estimate: Story = {
  render: () => (
    <View style={BLEED}>
      <Frame width={640}>
        <PriceEstimate
          low={362000}
          high={398000}
          estimate={381000}
          asking={385000}
          confidence="high"
          confidenceNote="Nine recent sales nearby"
          reasons={REASONS}
          comparables={24}
          expanded
          method="Automated valuation"
          version="Model 3.2"
          updated="Updated 2 Sep 2026"
          testID="estimate-fair"
        />
        <PriceEstimate
          low={250000}
          high={278000}
          estimate={264000}
          asking={300000}
          confidence="medium"
          confidenceNote="Few sales of this size in the last year"
          comparables={11}
          method="Automated valuation"
          updated="Updated 2 Sep 2026"
          testID="estimate-above"
        />
        <PriceEstimate low={180000} high={205000} asking={250000} confidence="high" testID="estimate-error" />
      </Frame>
      <Frame width={390}>
        <PriceEstimate
          low={410000}
          high={520000}
          estimate={462000}
          asking={495000}
          confidence="low"
          confidenceNote="Only three comparable sales"
          reasons={['A detached house on a street of flats', 'The last sale nearby was 14 months ago']}
          comparables={3}
          method="Automated valuation"
          version="Model 3.2"
          updated="Updated 2 Sep 2026"
          testID="estimate-low"
        />
        <PriceEstimate low={362000} high={398000} asking={340000} confidence="high" />
      </Frame>
    </View>
  ),
};

export const Comparison: Story = {
  render: () => (
    <View style={BLEED}>
      <Frame width={640}>
        <PricePerAreaComparison rows={COMPARISON} testID="comparison" />
      </Frame>
      <Frame width={390}>
        <PricePerAreaComparison rows={COMPARISON} />
      </Frame>
    </View>
  ),
};

/** Bars in two columns (auto at 800), rings, one column at 390, and nearby places. */
export const Neighbourhood: Story = {
  render: () => (
    <View style={BLEED}>
      <Frame width={800}>
        <NeighbourhoodScores items={SCORES} testID="scores" />
        <NeighbourhoodScores items={SCORES} variant="rings" testID="rings" />
        <NearbyPlaces items={NEARBY} testID="nearby" />
      </Frame>
      <Frame width={390}>
        <NeighbourhoodScores items={SCORES.slice(0, 3)} />
        <NearbyPlaces items={NEARBY.slice(0, 3)} />
      </Frame>
    </View>
  ),
};

/** A place's past rents, and a place with no history. */
export const RentHistory: Story = {
  render: () => (
    <View style={BLEED}>
      <Frame width={560}>
        <RentHistoryList items={RENT_HISTORY} testID="rent-history" />
      </Frame>
      <Frame width={390}>
        <RentHistoryList items={RENT_HISTORY.slice(0, 2)} />
        <RentHistoryList items={[]} testID="rent-history-empty" />
      </Frame>
    </View>
  ),
};

export const PartsDark: Story = {
  name: 'Parts, dark',
  globals: { theme: 'dark' },
  render: () => (
    <View style={BLEED}>
      <Frame width={800}>
        <PropertyFacts items={SALE_FACTS} limit={8} onShowAll={noop} />
        <EnergyLabel
          consumption={{ rating: 'C', value: '112 kWh/m²·year' }}
          emissions={{ rating: 'D', value: '24 kg CO₂/m²·year' }}
        />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <EnergyBadge rating="A" />
          <EnergyBadge rating="D" />
          <EnergyBadge pending />
        </View>
        <PriceEstimate
          low={250000}
          high={278000}
          estimate={264000}
          asking={300000}
          confidence="medium"
          confidenceNote="Few sales of this size in the last year"
          reasons={REASONS}
          expanded
          comparables={11}
          method="Automated valuation"
          updated="Updated 2 Sep 2026"
        />
        <PriceHistoryChart periods={PERIODS} />
        <PricePerAreaComparison rows={COMPARISON} />
        <NeighbourhoodScores items={SCORES} />
        <NeighbourhoodScores items={SCORES.slice(0, 4)} variant="rings" />
        <NearbyPlaces items={NEARBY.slice(0, 3)} />
        <RentHistoryList items={RENT_HISTORY} />
        <FloorPlan plans={PLANS} onPressPlan={noop} />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 40 }}>
          <View style={{ flex: 1, minWidth: 240, maxWidth: '100%' }}>
            <AgentContact />
          </View>
          <View style={{ flex: 1, minWidth: 240, maxWidth: '100%' }}>
            <LandlordContact />
          </View>
        </View>
      </Frame>
    </View>
  ),
};
