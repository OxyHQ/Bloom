import React, { useMemo, useState } from 'react';
import { View } from 'react-native';

import { BookingBar, BookingCard } from '../../src/booking';
import { Button } from '../../src/button';
import { RangeCalendar, type DateRange } from '../../src/date-picker';
import { Dialog, useDialogControl } from '../../src/dialog';
import { RiFlagLine, RiHeart3Fill, RiHeart3Line, RiShareLine } from '../../src/icons/remix';
import {
  ActionBar,
  ExchangeProposalCard,
  MortgageCalculator,
  RentalActionCard,
  SaleActionCard,
  ViewingScheduler,
  computeMortgage,
  type ExchangeMode,
  type ViewingMode,
} from '../../src/listing-actions';
import {
  AmenityList,
  ContactCard,
  FloorPlan,
  ListingHeader,
  ListingHeaderAction,
  ListingHighlights,
  ListingPhotoGrid,
  ListingSection,
  PropertyFacts,
  ReviewCard,
  ReviewSummary,
  type ListingHighlight,
  type ListingPhoto,
} from '../../src/listing-details';
import { PlaceReviewCard, PlaceReviewSummary } from '../../src/place-reviews';
import {
  EnergyLabel,
  NearbyPlaces,
  NeighbourhoodScores,
  PriceEstimate,
  PriceHistoryChart,
  PricePerAreaComparison,
  RentHistoryList,
} from '../../src/property-insights';
import { GuestPicker, type GuestCounts } from '../../src/stay-search';
import { WEB_POSITION_FIXED } from '../../src/styles/web-view-style';
import { Z_INDEX } from '../../src/styles/z-index';
import { useTheme } from '../../src/theme/use-theme';
import { Text } from '../../src/typography';
import {
  AREA_PRICES,
  LISTING_PHOTOS,
  NEARBY,
  NEIGHBOURHOOD,
  PEOPLE,
  PLACE_REVIEWS,
  PLACE_REVIEW_CATEGORIES,
  PRICE_HISTORY,
  RENT_AMENITIES,
  RENT_FACTS,
  RENT_HIGHLIGHTS,
  RENT_HISTORY,
  RENT_KEY_FACTS,
  RENT_LISTING,
  RENT_PLANS,
  SALE_FACTS,
  SALE_KEY_FACTS,
  SALE_LISTING,
  SALE_PHOTOS,
  START_MONTH,
  STAY_AMENITY_LIST,
  STAY_HIGHLIGHTS,
  STAY_LISTING,
  STAY_REVIEWS,
  STAY_REVIEW_CATEGORIES,
  STAY_REVIEW_DISTRIBUTION,
  SWAP_HIGHLIGHTS,
  SWAP_LISTING,
  THEIR_HOME,
  VIEWING_DAYS,
  VIEWING_SLOTS,
  YOUR_HOME,
  euro,
  formatDay,
  formatRange,
  guestSummary,
  nightsIn,
} from './data';
import {
  HousingFooter,
  HousingFrame,
  HousingHeader,
  IS_WEB,
  PageColumn,
  useHousingLayout,
  webSticky,
} from './HousingHeader';

const LISTING_WIDTH = 1120;
const noop = () => undefined;

// ---------------------------------------------------------------------------
//  The frame every listing page shares
// ---------------------------------------------------------------------------

interface ListingFrameProps {
  testID: string;
  title: string;
  subtitle: readonly string[];
  location: string;
  rating?: number | null;
  reviewsLabel?: string;
  photos: readonly ListingPhoto[];
  children: React.ReactNode;
  /** The action card: a sticky column from `lg`. */
  aside: React.ReactNode;
  /** Below `lg`: `bar` hides the card for `mobileBar`; `inline` puts the card above the sections. */
  narrowAside?: 'bar' | 'inline';
  /** Below `lg`, fixed to the bottom of the screen. */
  mobileBar?: React.ReactNode;
}

function ListingFrame({
  testID,
  title,
  subtitle,
  location,
  rating,
  reviewsLabel,
  photos,
  children,
  aside,
  narrowAside = 'bar',
  mobileBar,
}: ListingFrameProps) {
  const { md, lg } = useHousingLayout();
  const [saved, setSaved] = useState(false);
  const bar = !lg && narrowAside === 'bar' && mobileBar;

  return (
    <HousingFrame testID={testID}>
      <HousingHeader maxWidth={LISTING_WIDTH} />
      <PageColumn maxWidth={LISTING_WIDTH} style={{ paddingTop: md ? 24 : 16, paddingBottom: 48, gap: md ? 24 : 16 }}>
        <ListingHeader
          title={title}
          size={md ? 'large' : 'medium'}
          subtitle={subtitle}
          rating={rating}
          reviewsLabel={reviewsLabel}
          onPressReviews={reviewsLabel ? noop : undefined}
          location={location}
          onPressLocation={noop}
          actions={
            <>
              <ListingHeaderAction icon={RiShareLine} label="Share" iconOnly={!md} onPress={noop} />
              <ListingHeaderAction
                icon={saved ? RiHeart3Fill : RiHeart3Line}
                label={saved ? 'Saved' : 'Save'}
                pressed={saved}
                iconOnly={!md}
                onPress={() => setSaved((s) => !s)}
                testID={`${testID}-save`}
              />
            </>
          }
        />
        <ListingPhotoGrid photos={photos} onShowAll={noop} onPressPhoto={noop} />
        <View style={{ flexDirection: lg ? 'row' : 'column', alignItems: lg ? 'flex-start' : 'stretch', gap: lg ? 64 : 8 }}>
          {!lg && narrowAside === 'inline' ? <View style={{ paddingTop: 8, paddingBottom: 16 }}>{aside}</View> : null}
          <View style={{ flex: lg ? 1 : undefined, minWidth: 0 }}>{children}</View>
          {lg ? (
            <View style={[{ width: 372, paddingTop: 24 }, webSticky(24)]} testID={`${testID}-aside`}>
              {aside}
            </View>
          ) : null}
        </View>
      </PageColumn>
      <HousingFooter maxWidth={LISTING_WIDTH} bottomSpace={bar ? 88 : 0} />
      {bar ? (
        <View
          style={{ position: IS_WEB ? WEB_POSITION_FIXED : 'absolute', left: 0, right: 0, bottom: 0, zIndex: Z_INDEX.floating }}
          testID={`${testID}-bar`}
        >
          {mobileBar}
        </View>
      ) : null}
    </HousingFrame>
  );
}

function Paragraphs({ text }: { text: string }) {
  const theme = useTheme();
  return (
    <View style={{ gap: 12 }}>
      {text.split('\n\n').map((paragraph) => (
        <Text key={paragraph.slice(0, 24)} variant="body-regular" style={{ color: theme.colors.text }}>
          {paragraph}
        </Text>
      ))}
    </View>
  );
}

function ReportLink() {
  return (
    <Button variant="link" linkTone="secondary" size="small" leadingIcon={RiFlagLine} onPress={noop}>
      Report this listing
    </Button>
  );
}

function Highlights({ items }: { items: readonly ListingHighlight[] }) {
  return (
    <ListingSection divider={false} style={{ paddingTop: 24 }}>
      <ListingHighlights items={items} />
    </ListingSection>
  );
}

// ---------------------------------------------------------------------------
//  Rent
// ---------------------------------------------------------------------------

export function RentListingPage() {
  const { md } = useHousingLayout();
  const viewing = useDialogControl();
  const [day, setDay] = useState<string | null>('2026-09-22');
  const [slot, setSlot] = useState<string | null>(null);
  const [mode, setMode] = useState<ViewingMode>('in-person');
  const [note, setNote] = useState('');
  const [requested, setRequested] = useState<string | null>(null);
  const [helpful, setHelpful] = useState<Record<number, boolean>>({});
  const [phoneRevealed, setPhoneRevealed] = useState(false);

  const requestedLabel = requested ? `Viewing requested: ${requested}` : 'Usually responds within a day';

  return (
    <>
      <ListingFrame
        testID="housing-rent"
        title={RENT_LISTING.title}
        subtitle={RENT_LISTING.subtitle}
        location={RENT_LISTING.location}
        rating={4.6}
        reviewsLabel="18 building reviews"
        photos={LISTING_PHOTOS}
        aside={
          <RentalActionCard
            price={RENT_LISTING.rent}
            billsNote="Bills not included"
            facts={RENT_KEY_FACTS}
            onRequestViewing={() => viewing.open()}
            onApply={noop}
            note={requestedLabel}
            footer={<ReportLink />}
            testID="housing-rent-card"
          />
        }
        mobileBar={
          <ActionBar
            price={RENT_LISTING.rent}
            priceUnit="month"
            priceUnitPrefix="/"
            subtitle={requested ?? 'Available from Oct 1'}
            primaryLabel="Request a viewing"
            onPrimary={() => viewing.open()}
            testID="housing-rent-actionbar"
          />
        }
      >
        <Highlights items={RENT_HIGHLIGHTS} />
        <ListingSection title="About this home">
          <View style={{ gap: 24 }}>
            <PropertyFacts items={RENT_FACTS} />
            <Paragraphs text={RENT_LISTING.description} />
          </View>
        </ListingSection>
        <ListingSection title="What this home has">
          <AmenityList items={RENT_AMENITIES} limit={8} onShowAll={noop} />
        </ListingSection>
        <ListingSection title="Floor plans">
          <FloorPlan plans={RENT_PLANS} onPressPlan={noop} />
        </ListingSection>
        <ListingSection title="The neighbourhood" subtitle="Old Halden, city centre">
          <View style={{ gap: 32 }}>
            <NeighbourhoodScores items={NEIGHBOURHOOD} />
            <NearbyPlaces items={NEARBY} />
          </View>
        </ListingSection>
        <ListingSection title="Rent history" subtitle="What this home has rented for">
          <RentHistoryList items={RENT_HISTORY} />
        </ListingSection>
        <ListingSection title="Building reviews" subtitle="From past tenants, anonymised">
          <View style={{ gap: 24 }}>
            <PlaceReviewSummary
              rating={4.6}
              title="Rated by past tenants"
              reviewCount={18}
              categories={PLACE_REVIEW_CATEGORIES}
              depositReturnedRate={0.89}
              recommendRate={0.83}
            />
            {PLACE_REVIEWS.map((review, index) => (
              <PlaceReviewCard
                key={review.authorLabel}
                {...review}
                helpful={helpful[index] ?? false}
                onHelpfulChange={(next) => setHelpful((h) => ({ ...h, [index]: next }))}
                onReport={noop}
              />
            ))}
          </View>
        </ListingSection>
        <ListingSection title="Your landlord">
          <ContactCard
            role="landlord"
            name={PEOPLE.landlord.name}
            avatar={PEOPLE.landlord.avatar}
            verified
            responseTime="Usually responds within a day"
            activeListings={3}
            onPressListings={noop}
            phone="+00 612 480 115"
            phoneRevealed={phoneRevealed}
            onPhoneRevealedChange={setPhoneRevealed}
            onMessage={noop}
            style={{ maxWidth: md ? 560 : undefined }}
          />
        </ListingSection>
      </ListingFrame>

      <Dialog
        control={viewing}
        label="Schedule a viewing"
        placement={{ base: 'bottom', md: 'center' }}
        maxWidth={440}
        contentPadding={0}
        testID="housing-viewing"
      >
        <ViewingScheduler
          days={VIEWING_DAYS}
          day={day}
          onDayChange={(value) => {
            setDay(value);
            setSlot(null);
          }}
          slots={day === '2026-09-26' ? [] : VIEWING_SLOTS}
          slot={slot}
          onSlotChange={setSlot}
          mode={mode}
          onModeChange={setMode}
          note={note}
          onNoteChange={setNote}
          notePlaceholder="Anything the landlord should know?"
          onSubmit={() => {
            const chosen = VIEWING_DAYS.find((d) => d.value === day);
            setRequested(`${chosen?.weekday ?? ''} ${chosen?.day ?? ''}, ${slot}`);
            viewing.close();
          }}
          maxWidth={null}
          testID="housing-viewing-scheduler"
        />
      </Dialog>
    </>
  );
}

// ---------------------------------------------------------------------------
//  Sale
// ---------------------------------------------------------------------------

export function SaleListingPage() {
  const { md } = useHousingLayout();
  const mortgage = useDialogControl();
  const [price, setPrice] = useState(SALE_LISTING.price);
  const [down, setDown] = useState(77000);
  const [years, setYears] = useState(25);
  const [rate, setRate] = useState(3.4);
  const [phoneRevealed, setPhoneRevealed] = useState(false);
  const [reasonsOpen, setReasonsOpen] = useState(false);

  const estimate = useMemo(() => computeMortgage({ price, downPayment: down, years, annualRate: rate }), [price, down, years, rate]);
  const monthly = `Est. ${euro(estimate.monthlyPayment)}/month`;

  return (
    <>
      <ListingFrame
        testID="housing-sale"
        title={SALE_LISTING.title}
        subtitle={SALE_LISTING.subtitle}
        location={SALE_LISTING.location}
        photos={SALE_PHOTOS}
        aside={
          <SaleActionCard
            price={euro(SALE_LISTING.price)}
            originalPrice="€410,000"
            pricePerArea={`${euro(SALE_LISTING.price / SALE_LISTING.area)} / m²`}
            mortgageEstimate={monthly}
            onPressMortgage={() => mortgage.open()}
            facts={SALE_KEY_FACTS}
            onContact={noop}
            onRequestVisit={noop}
            onMakeOffer={noop}
            note="Listed by Harbourside Estates"
            footer={<ReportLink />}
            testID="housing-sale-card"
          />
        }
        mobileBar={
          <ActionBar
            price={euro(SALE_LISTING.price)}
            subtitle={monthly}
            onPressSubtitle={() => mortgage.open()}
            primaryLabel="Contact agent"
            onPrimary={noop}
            testID="housing-sale-actionbar"
          />
        }
      >
        <ListingSection title="About this home" divider={false} style={{ paddingTop: 24 }}>
          <View style={{ gap: 24 }}>
            <PropertyFacts items={SALE_FACTS} />
            <Paragraphs text={SALE_LISTING.description} />
          </View>
        </ListingSection>
        <ListingSection title="Energy performance">
          <EnergyLabel
            consumption={{ rating: 'B', value: '92 kWh/m²·year' }}
            emissions={{ rating: 'C', value: '21 kg CO₂/m²·year' }}
            style={{ maxWidth: 560 }}
          />
        </ListingSection>
        <ListingSection title="Is the price right?">
          <PriceEstimate
            low={362000}
            high={404000}
            estimate={381000}
            asking={SALE_LISTING.price}
            confidence="medium"
            confidenceNote="14 sales nearby in the last year"
            format={euro}
            reasons={[
              'Similar three-bedroom flats on this street sold for €3,450–€3,720/m².',
              'The 2021 renovation adds about 6% against unrenovated homes.',
              'Third floor without a lift in a four-storey building.',
            ]}
            expanded={reasonsOpen}
            onExpandedChange={setReasonsOpen}
            comparables={14}
            method="Automated valuation"
            updated="Updated 12 Sep 2026"
          />
        </ListingSection>
        <ListingSection title="Price history">
          <PriceHistoryChart periods={PRICE_HISTORY} defaultPeriod="1y" format={euro} />
        </ListingSection>
        <ListingSection title="Price per m²" subtitle="Against the street, the area and the town">
          <PricePerAreaComparison rows={AREA_PRICES} />
        </ListingSection>
        <ListingSection title="What’s nearby">
          <NearbyPlaces items={NEARBY} />
        </ListingSection>
        <ListingSection title="Listed by">
          <ContactCard
            role="agent"
            name={PEOPLE.agent.name}
            avatar={PEOPLE.agent.avatar}
            agency="Harbourside Estates"
            responseTime="Usually responds within an hour"
            activeListings={12}
            onPressListings={noop}
            phone="+00 604 221 870"
            phoneRevealed={phoneRevealed}
            onPhoneRevealedChange={setPhoneRevealed}
            onCall={phoneRevealed ? noop : undefined}
            onMessage={noop}
            style={{ maxWidth: md ? 560 : undefined }}
          />
        </ListingSection>
      </ListingFrame>

      <Dialog control={mortgage} label="Mortgage calculator" placement={{ base: 'bottom', md: 'center' }} maxWidth={780} contentPadding={0} testID="housing-mortgage">
        <MortgageCalculator
          price={price}
          onPriceChange={setPrice}
          downPayment={down}
          onDownPaymentChange={setDown}
          years={years}
          onYearsChange={setYears}
          annualRate={rate}
          onAnnualRateChange={setRate}
          formatCurrency={euro}
          testID="housing-mortgage-calculator"
        />
      </Dialog>
    </>
  );
}

// ---------------------------------------------------------------------------
//  Dates and guests dialogs (vacation rental, swap)
// ---------------------------------------------------------------------------

function DatesDialog({
  control,
  value,
  onChange,
  title = 'Select dates',
  onClose,
}: {
  control: ReturnType<typeof useDialogControl>;
  value: DateRange | null;
  onChange: (range: DateRange | null) => void;
  title?: string;
  onClose?: () => void;
}) {
  const { md } = useHousingLayout();
  const theme = useTheme();
  const nights = nightsIn(value);
  return (
    <Dialog
      control={control}
      label={title}
      placement={{ base: 'bottom', md: 'center' }}
      maxWidth={md ? 720 : 480}
      onClose={onClose}
      testID="housing-dates"
    >
      <View style={{ gap: 16, alignItems: 'center' }}>
        <View style={{ alignSelf: 'stretch', gap: 2 }}>
          <Text variant="title-3-semibold" style={{ color: theme.colors.text }}>
            {nights > 0 ? `${nights} nights` : title}
          </Text>
          <Text variant="body-2-regular" style={{ color: theme.colors.textSecondary }}>
            {formatRange(value) ?? 'Add your travel dates for exact pricing'}
          </Text>
        </View>
        <RangeCalendar value={value} onChange={onChange} visibleMonths={md ? 2 : 1} defaultMonth={START_MONTH} />
        <View style={{ alignSelf: 'stretch', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Button variant="link" onPress={() => onChange(null)} disabled={!value}>
            Clear dates
          </Button>
          <Button variant="primary" onPress={() => control.close()} testID="housing-dates-done">
            Done
          </Button>
        </View>
      </View>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
//  Vacation rental
// ---------------------------------------------------------------------------

export function StayListingPage() {
  const { md } = useHousingLayout();
  const theme = useTheme();
  const dates = useDialogControl();
  const [range, setRange] = useState<DateRange | null>({ start: new Date(2026, 9, 12), end: new Date(2026, 9, 17) });
  const [guests, setGuests] = useState<GuestCounts>({ adults: 2, children: 0, infants: 0, pets: 0 });
  const [guestsOpen, setGuestsOpen] = useState(false);
  const [datesOpen, setDatesOpen] = useState(false);

  const nights = nightsIn(range);
  const nightly = STAY_LISTING.nightly;
  const service = Math.round(nights * nightly * 0.12);
  const breakdown =
    nights > 0
      ? {
          rows: [
            { label: `${euro(nightly)} x ${nights} nights`, amount: euro(nightly * nights) },
            {
              label: 'Cleaning fee',
              amount: euro(STAY_LISTING.cleaningFee),
              details: (
                <Text variant="body-2-regular" style={{ color: theme.colors.text, padding: 8 }}>
                  A one-time fee the host charges to clean the flat after your stay.
                </Text>
              ),
            },
            { label: 'Service fee', amount: euro(service) },
          ],
          total: euro(nightly * nights + STAY_LISTING.cleaningFee + service),
        }
      : undefined;

  const openDates = () => {
    setDatesOpen(true);
    dates.open();
  };

  return (
    <>
      <ListingFrame
        testID="housing-stay"
        title={STAY_LISTING.title}
        subtitle={STAY_LISTING.subtitle}
        location={STAY_LISTING.location}
        rating={STAY_LISTING.rating}
        reviewsLabel={`${STAY_LISTING.reviewCount} reviews`}
        photos={LISTING_PHOTOS}
        aside={
          <BookingCard
            price={euro(nightly)}
            priceUnit="night"
            rating={STAY_LISTING.rating}
            reviewCount={STAY_LISTING.reviewCount}
            checkIn={range ? formatDay(range.start) : undefined}
            checkOut={range ? formatDay(range.end) : undefined}
            guests={guestSummary(guests) ?? 'Add guests'}
            onPressDates={openDates}
            activeField={datesOpen ? 'checkIn' : null}
            guestsOpen={guestsOpen}
            onGuestsOpenChange={setGuestsOpen}
            guestPicker={
              <GuestPicker
                size="small"
                value={guests}
                onChange={setGuests}
                maxGuests={STAY_LISTING.maxGuests}
                note="This place has a maximum of 4 guests, not including infants."
              />
            }
            onReserve={nights > 0 ? noop : openDates}
            breakdown={breakdown}
            footer={<ReportLink />}
            testID="housing-booking"
          />
        }
        mobileBar={
          <BookingBar
            price={euro(nightly)}
            priceUnit="night"
            dates={formatRange(range) ?? 'Add dates'}
            onPressDates={openDates}
            onReserve={nights > 0 ? noop : openDates}
            testID="housing-booking-bar"
          />
        }
      >
        <Highlights items={STAY_HIGHLIGHTS} />
        <ListingSection title="About this place">
          <Paragraphs text={STAY_LISTING.description} />
        </ListingSection>
        <ListingSection title="What this place offers">
          <AmenityList items={STAY_AMENITY_LIST} onShowAll={noop} total={32} />
        </ListingSection>
        <ListingSection title="Reviews">
          <View style={{ gap: 32 }}>
            <ReviewSummary
              rating={STAY_LISTING.rating}
              title="Guest favourite"
              description={`${STAY_LISTING.reviewCount} reviews`}
              categories={STAY_REVIEW_CATEGORIES}
              distribution={STAY_REVIEW_DISTRIBUTION}
            />
            <View style={{ flexDirection: md ? 'row' : 'column', flexWrap: 'wrap', columnGap: 48, rowGap: 32 }}>
              {STAY_REVIEWS.map((review) => (
                <View key={review.name} style={{ width: md ? '46%' : '100%' }}>
                  <ReviewCard {...review} />
                </View>
              ))}
            </View>
          </View>
        </ListingSection>
        <ListingSection title="Meet your host">
          <ContactCard
            role="host"
            name={PEOPLE.host.name}
            avatar={PEOPLE.host.avatar}
            verified
            label="Superb host"
            stats={[
              { value: '214', label: 'Reviews' },
              { value: '4.92', label: 'Rating', star: true },
              { value: '7', label: 'Years hosting' },
            ]}
            responseTime="Usually responds within an hour"
            onMessage={noop}
            style={{ maxWidth: md ? 560 : undefined }}
          />
        </ListingSection>
      </ListingFrame>
      <DatesDialog control={dates} value={range} onChange={setRange} onClose={() => setDatesOpen(false)} />
    </>
  );
}

// ---------------------------------------------------------------------------
//  Swap
// ---------------------------------------------------------------------------

export function SwapListingPage() {
  const { md } = useHousingLayout();
  const dates = useDialogControl();
  const guestsDialog = useDialogControl();
  const [range, setRange] = useState<DateRange | null>({ start: new Date(2026, 10, 2), end: new Date(2026, 10, 16) });
  const [guests, setGuests] = useState<GuestCounts>({ adults: 2, children: 2, infants: 0, pets: 0 });
  const [mode, setMode] = useState<ExchangeMode>('swap');
  const [sent, setSent] = useState(false);

  return (
    <>
      <ListingFrame
        testID="housing-swap"
        title={SWAP_LISTING.title}
        subtitle={SWAP_LISTING.subtitle}
        location={SWAP_LISTING.location}
        photos={[...LISTING_PHOTOS].reverse()}
        narrowAside="inline"
        aside={
          <ExchangeProposalCard
            yourHome={YOUR_HOME}
            theirHome={THEIR_HOME}
            dates={formatRange(range)}
            onPressDates={() => dates.open()}
            guests={guestSummary(guests)}
            onPressGuests={() => guestsDialog.open()}
            mode={mode}
            onModeChange={setMode}
            onPropose={() => setSent(true)}
            proposeLabel={sent ? 'Proposal sent' : 'Propose a swap'}
            proposeDisabled={sent || !range}
            note={
              sent
                ? 'The Oriel family usually replies within two days.'
                : mode === 'swap'
                  ? 'You stay at theirs while they stay at yours.'
                  : 'Guest points: 120 per night'
            }
            testID="housing-exchange"
          />
        }
      >
        <Highlights items={SWAP_HIGHLIGHTS} />
        <ListingSection title="About this home">
          <Paragraphs text={SWAP_LISTING.description} />
        </ListingSection>
        <ListingSection title="What this home has">
          <AmenityList items={RENT_AMENITIES.slice(0, 6)} />
        </ListingSection>
        <ListingSection title="Your swap partners">
          <ContactCard
            role="host"
            name="The Oriel family"
            avatar={PEOPLE.host.avatar}
            verified
            label="Swapping since 2022"
            stats={[
              { value: '9', label: 'Swaps' },
              { value: '4.97', label: 'Rating', star: true },
            ]}
            responseTime="Usually responds within two days"
            messageLabel="Message"
            onMessage={noop}
            style={{ maxWidth: md ? 560 : undefined }}
          />
        </ListingSection>
      </ListingFrame>
      <DatesDialog control={dates} value={range} onChange={setRange} title="Swap dates" />
      <Dialog control={guestsDialog} label="Guests" placement={{ base: 'bottom', md: 'center' }} maxWidth={420} testID="housing-guests">
        <GuestPicker value={guests} onChange={setGuests} maxGuests={6} onClose={() => guestsDialog.close()} />
      </Dialog>
    </>
  );
}
