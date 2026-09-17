import type { ApplicationItem, ExchangeHome, KeyFact, ViewingDay, ViewingSlot } from '../../src/listing-actions/types';
import type { TripStatus } from '../../src/booking/types';
import type { CategoryBarItem } from '../../src/category-bar/types';
import type { DateRange } from '../../src/date-picker';
import type { EvictionEvent, EvictionReportCardProps } from '../../src/eviction/types';
import type { HomeSearchMode, MoveInValue } from '../../src/home-search';
import {
  RiAncientGateLine,
  RiArmchairLine,
  RiBankCardLine,
  RiBearSmileLine,
  RiBikeLine,
  RiBriefcase4Line,
  RiBuilding2Line,
  RiBuilding4Line,
  RiBusLine,
  RiCalendarCloseLine,
  RiCalendarLine,
  RiCarLine,
  RiChat3Line,
  RiCheckboxCircleLine,
  RiCommunityLine,
  RiDoorOpenLine,
  RiDropLine,
  RiFileTextLine,
  RiFireLine,
  RiFlowerLine,
  RiFridgeLine,
  RiHeartPulseLine,
  RiHome4Line,
  RiHomeHeartLine,
  RiHospitalLine,
  RiHotelBedLine,
  RiKey2Line,
  RiLandscapeLine,
  RiLeafLine,
  RiMapPin2Line,
  RiMapPinLine,
  RiMedalLine,
  RiMoneyEuroBoxLine,
  RiParkingBoxLine,
  RiPlantLine,
  RiPriceTag3Line,
  RiRestaurantLine,
  RiRulerLine,
  RiSailboatLine,
  RiSchoolLine,
  RiSeedlingLine,
  RiShieldCheckLine,
  RiShoppingBasketLine,
  RiSnowflakeLine,
  RiSofaLine,
  RiSparklingLine,
  RiStairsLine,
  RiSubwayLine,
  RiSunLine,
  RiTShirtAirLine,
  RiTempColdLine,
  RiTentLine,
  RiTimeLine,
  RiTrainLine,
  RiTreeLine,
  RiTvLine,
  RiVolumeDownLine,
  RiWalkLine,
  RiWifiLine,
} from '../../src/icons/remix';
import type {
  Amenity,
  FloorPlanItem,
  ListingHighlight,
  ListingPhoto,
  PropertyFact,
  ReviewCategory,
  ReviewDistributionRow,
} from '../../src/listing-details/types';
import type { ListingCardProps, ListingFact } from '../../src/listing-card/types';
import type { SortablePhoto } from '../../src/sortable-media';
import type {
  AreaPriceRow,
  NearbyPlace,
  NeighbourhoodScore,
  PriceHistoryPeriod,
  RentHistoryEntry,
} from '../../src/property-insights/types';
import type { PropertyType, EnergyRating, FloorOption, HousingFeature, ToggleChipOption } from '../../src/stay-filters/types';
import type { DestinationSuggestion, GuestCounts } from '../../src/stay-search';
import type {
  LeaseSummaryCardProps,
  MaintenanceRequestCardProps,
  RentPayment,
  TenancyDocument,
  TenancyTimelineEvent,
} from '../../src/tenancy/types';
import type { WizardStep } from '../../src/wizard';

/**
 * Demo data for the housing template. Every town, street, person, review and
 * price is invented; photos are seeded placeholders or inline drawings.
 */

// ---------------------------------------------------------------------------
//  Images
// ---------------------------------------------------------------------------

export const picsum = (seed: string, w = 800, h = 760) => `https://picsum.photos/seed/${seed}/${w}/${h}`;
const unsplash = (id: string, w = 1400) => `https://images.unsplash.com/photo-${id}?w=${w}&q=80`;
const photos = (seed: string, count: number) => Array.from({ length: count }, (_, i) => picsum(`${seed}-${i}`));

/** A floor plan drawn inline: rooms as outlined rectangles with labels. */
function plan(rooms: { x: number; y: number; w: number; h: number; label: string }[]): string {
  const body = rooms
    .map(
      (r) =>
        `<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" fill="#f7f5f1" stroke="#3d3a36" stroke-width="4"/>` +
        `<text x="${r.x + r.w / 2}" y="${r.y + r.h / 2 + 7}" font-family="sans-serif" font-size="20" fill="#5c5852" text-anchor="middle">${r.label}</text>`,
    )
    .join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600"><rect width="800" height="600" fill="#ffffff"/>${body}</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export const PEOPLE = {
  you: { name: 'Noor Halvik', avatar: unsplash('1535713875002-d1d0cf377fde', 200) },
  landlord: { name: 'Ilse Marrow', avatar: unsplash('1438761681033-6461ffad8d80', 400) },
  agent: { name: 'Teodor Vane', avatar: unsplash('1502685104226-ee32379fefbe', 400) },
  host: { name: 'Marta Oriel', avatar: unsplash('1494790108377-be9c29b29330', 400) },
};

// ---------------------------------------------------------------------------
//  Formatting
// ---------------------------------------------------------------------------

export function euro(n: number): string {
  return `€${Math.round(n).toLocaleString('en-US')}`;
}

export function euroShort(n: number): string {
  if (n >= 1_000_000) return `€${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  if (n >= 1000) return `€${Math.round(n / 1000)}K`;
  return `€${n}`;
}

export function formatDay(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatRange(range: DateRange | null): string | undefined {
  if (!range) return undefined;
  const sameMonth = range.start.getMonth() === range.end.getMonth();
  return `${formatDay(range.start)} – ${sameMonth ? range.end.getDate() : formatDay(range.end)}`;
}

export function nightsIn(range: DateRange | null): number {
  if (!range) return 0;
  return Math.max(0, Math.round((range.end.getTime() - range.start.getTime()) / 86_400_000));
}

export function rangeSummary([min, max]: [number | null, number | null], format: (n: number) => string): string | undefined {
  if (min == null && max == null) return undefined;
  if (min == null) return `Up to ${format(max as number)}`;
  if (max == null) return `${format(min)}+`;
  return `${format(min)} – ${format(max)}`;
}

export function guestSummary(g: GuestCounts): string | undefined {
  const guests = g.adults + g.children;
  if (guests === 0 && g.infants === 0 && g.pets === 0) return undefined;
  const parts = [`${guests} ${guests === 1 ? 'guest' : 'guests'}`];
  if (g.infants) parts.push(`${g.infants} ${g.infants === 1 ? 'infant' : 'infants'}`);
  if (g.pets) parts.push(`${g.pets} ${g.pets === 1 ? 'pet' : 'pets'}`);
  return parts.join(', ');
}

export const TYPE_LABELS: Record<PropertyType, string> = {
  apartment: 'Apartment',
  house: 'House',
  room: 'Room',
  studio: 'Studio',
  duplex: 'Duplex',
  penthouse: 'Penthouse',
  coliving: 'Coliving',
  hostel: 'Hostel',
  other: 'Other',
};

export function typesSummary(types: PropertyType[]): string | undefined {
  if (types.length === 0) return undefined;
  if (types.length === 1) return TYPE_LABELS[types[0]!];
  return `${TYPE_LABELS[types[0]!]} +${types.length - 1}`;
}

export function moveInSummary(v: MoveInValue): string | undefined {
  if (v.timing === 'asap') return 'As soon as possible';
  if (v.timing === 'flexible') return 'Flexible';
  return v.date ? formatDay(v.date) : undefined;
}

// ---------------------------------------------------------------------------
//  Search
// ---------------------------------------------------------------------------

/** The month every calendar opens on. */
export const START_MONTH = new Date(2026, 9, 1);

export const NO_GUESTS: GuestCounts = { adults: 0, children: 0, infants: 0, pets: 0 };
export const NO_MOVE_IN: MoveInValue = { timing: 'date', date: null, contractLength: 'any' };

export const AREAS: DestinationSuggestion[] = [
  { id: 'nearby', title: 'Nearby', description: 'Search around your location', icon: RiMapPinLine },
  { id: 'recent', title: 'Old Halden · 2+ bedrooms', description: 'Recent search', icon: RiTimeLine },
  { id: 'halden', title: 'Old Halden', description: 'City centre, 1,240 homes', icon: RiBuilding2Line },
  { id: 'marrow', title: 'Marrowfield', description: 'Lakeside town, 312 homes', icon: RiHome4Line },
  { id: 'solvia', title: 'Solvia Bay', description: 'Coast, 586 homes', icon: RiMapPinLine },
];

export const DESTINATIONS: DestinationSuggestion[] = [
  { id: 'nearby', title: 'Nearby', description: 'Find what’s around you', icon: RiMapPinLine },
  { id: 'recent', title: 'Solvia Bay · 3 guests', description: 'Oct 12 – 16', icon: RiTimeLine },
  { id: 'marrow', title: 'Marrowfield', description: 'For its lakeside cabins', icon: RiMapPinLine },
  { id: 'halden', title: 'Old Halden', description: 'Great for a city weekend', icon: RiBuilding2Line },
  { id: 'terrace', title: 'Terracina Coast', description: 'Popular beach destination', icon: RiMapPinLine },
];

export const MODE_TITLES: Record<HomeSearchMode, string> = {
  rent: 'Find a home to rent',
  buy: 'Find a home to buy',
  stays: 'Find a place to stay',
  swap: 'Swap your home',
};

// ---------------------------------------------------------------------------
//  Categories
// ---------------------------------------------------------------------------

export const CATEGORIES: Record<HomeSearchMode, CategoryBarItem[]> = {
  rent: [
    { key: 'all', label: 'All homes', icon: RiHome4Line },
    { key: 'new', label: 'New today', icon: RiSparklingLine },
    { key: 'furnished', label: 'Furnished', icon: RiSofaLine },
    { key: 'pets', label: 'Pet friendly', icon: RiBearSmileLine },
    { key: 'rooms', label: 'Rooms', icon: RiHotelBedLine },
    { key: 'balcony', label: 'Balcony', icon: RiSunLine },
    { key: 'metro', label: 'Near metro', icon: RiSubwayLine },
    { key: 'coliving', label: 'Coliving', icon: RiCommunityLine },
    { key: 'accessible', label: 'Step-free', icon: RiStairsLine },
    { key: 'garden', label: 'Garden', icon: RiPlantLine },
  ],
  buy: [
    { key: 'all', label: 'All homes', icon: RiHome4Line },
    { key: 'drops', label: 'Price drops', icon: RiPriceTag3Line },
    { key: 'new-builds', label: 'New builds', icon: RiBuilding4Line },
    { key: 'garden', label: 'Garden', icon: RiFlowerLine },
    { key: 'penthouse', label: 'Penthouses', icon: RiBuilding2Line },
    { key: 'efficient', label: 'A–B energy', icon: RiLeafLine },
    { key: 'renovate', label: 'To renovate', icon: RiSeedlingLine },
    { key: 'historic', label: 'Historic', icon: RiAncientGateLine },
    { key: 'parking', label: 'With parking', icon: RiParkingBoxLine },
  ],
  stays: [
    { key: 'trending', label: 'Trending', icon: RiFireLine },
    { key: 'beach', label: 'Beachfront', icon: RiSunLine },
    { key: 'cabins', label: 'Cabins', icon: RiTreeLine },
    { key: 'views', label: 'Amazing views', icon: RiLandscapeLine },
    { key: 'lake', label: 'Lakefront', icon: RiSailboatLine },
    { key: 'camping', label: 'Camping', icon: RiTentLine },
    { key: 'countryside', label: 'Countryside', icon: RiPlantLine },
    { key: 'arctic', label: 'Arctic', icon: RiSnowflakeLine },
    { key: 'kitchens', label: 'Chef’s kitchens', icon: RiRestaurantLine },
  ],
  swap: [
    { key: 'all', label: 'All swaps', icon: RiHomeHeartLine },
    { key: 'city', label: 'City', icon: RiBuilding2Line },
    { key: 'coast', label: 'Coast', icon: RiSailboatLine },
    { key: 'countryside', label: 'Countryside', icon: RiTreeLine },
    { key: 'families', label: 'Family homes', icon: RiBearSmileLine },
    { key: 'remote', label: 'Work friendly', icon: RiBriefcase4Line },
    { key: 'summer', label: 'Summer', icon: RiSunLine },
  ],
};

// ---------------------------------------------------------------------------
//  Results
// ---------------------------------------------------------------------------

export const bedFact = (n: number): ListingFact => ({
  icon: RiHotelBedLine,
  label: String(n),
  accessibilityLabel: `${n} ${n === 1 ? 'bedroom' : 'bedrooms'}`,
});
export const bathFact = (n: number): ListingFact => ({
  icon: RiDropLine,
  label: String(n),
  accessibilityLabel: `${n} ${n === 1 ? 'bathroom' : 'bathrooms'}`,
});
export const areaFact = (n: number): ListingFact => ({ icon: RiRulerLine, label: `${n} m²` });
export const floorFact = (n: number): ListingFact => ({ icon: RiBuilding2Line, label: `Floor ${n}` });

export type EnergyClassLetter = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G';

export interface Home
  extends Omit<ListingCardProps, 'favorite' | 'onFavoriteChange' | 'onPress' | 'href' | 'badge' | 'style' | 'testID'> {
  id: string;
  mode: HomeSearchMode;
  /** The short price on the map marker. */
  short: string;
  /** Where the pin sits on the mock map, as fractions of its width and height. */
  map: { x: number; y: number };
  saved?: boolean;
  /** A text badge over the photo. */
  label?: string;
  /** The sale energy class, drawn as an `EnergyBadge` over the photo. */
  energy?: EnergyClassLetter;
  /** A private address: an approximate-area circle instead of an exact pin. */
  approximate?: boolean;
}

function rent(
  id: string,
  title: string,
  address: string,
  price: number,
  beds: number,
  baths: number,
  area: number,
  map: [number, number],
  extra: Partial<Home> = {},
): Home {
  return {
    id,
    mode: 'rent',
    photos: photos(`rent-${id}`, 5),
    title,
    address,
    offerings: ['long_term_rent'],
    priceLines: [{ price: euro(price), unit: '/ month' }],
    short: `${euro(price)}/mo`,
    facts: [bedFact(beds), bathFact(baths), areaFact(area)],
    map: { x: map[0], y: map[1] },
    ...extra,
  };
}

function sale(
  id: string,
  title: string,
  address: string,
  price: number,
  beds: number,
  baths: number,
  area: number,
  energy: EnergyClassLetter,
  map: [number, number],
  extra: Partial<Home> = {},
): Home {
  return {
    id,
    mode: 'buy',
    photos: photos(`sale-${id}`, 6),
    title,
    address,
    offerings: ['sale'],
    priceLines: [{ price: euro(price), secondary: `${euro(price / area)}/m²` }],
    short: euroShort(price),
    facts: [bedFact(beds), bathFact(baths), areaFact(area)],
    energy,
    map: { x: map[0], y: map[1] },
    ...extra,
  };
}

function stay(
  id: string,
  title: string,
  subtitle: string,
  dates: string,
  price: number,
  rating: number | null,
  reviews: number | undefined,
  map: [number, number],
  extra: Partial<Home> = {},
): Home {
  return {
    id,
    mode: 'stays',
    photos: photos(`stay-${id}`, 6),
    title,
    subtitle,
    dates,
    rating,
    reviewCount: reviews,
    offerings: ['short_term_rent'],
    priceLines: [{ price: euro(price), unit: 'night' }],
    total: `${euro(price * 5)} total`,
    short: euro(price),
    map: { x: map[0], y: map[1] },
    ...extra,
  };
}

function swap(
  id: string,
  title: string,
  address: string,
  dates: string,
  beds: number,
  baths: number,
  area: number,
  map: [number, number],
  extra: Partial<Home> = {},
): Home {
  return {
    id,
    mode: 'swap',
    photos: photos(`swap-${id}`, 4),
    title,
    address,
    approximateLocation: true,
    dates,
    offerings: ['exchange'],
    facts: [bedFact(beds), bathFact(baths), areaFact(area)],
    rating: null,
    short: 'Swap',
    approximate: true,
    map: { x: map[0], y: map[1] },
    ...extra,
  };
}

export const HOMES: Home[] = [
  rent('orel', 'Bright flat near Plaza Orel', 'Calle Senra, Old Halden', 950, 3, 2, 110, [0.2, 0.22], {
    facts: [bedFact(3), bathFact(2), areaFact(110), floorFact(4)],
    rating: 4.6,
    reviewCount: 18,
    label: 'New today',
  }),
  rent('tilia', 'Garden flat with a lemon tree', 'Tilia Row, Marrowfield', 1180, 2, 1, 74, [0.44, 0.16], { saved: true }),
  rent('quarry', 'Room in a shared house', 'Quarry Lane, Eastwold', 420, 1, 1, 14, [0.66, 0.3], {
    subtitle: 'Private room · 4 housemates',
    facts: [bedFact(1), { icon: RiDropLine, label: 'Shared bath' }, areaFact(14)],
  }),
  rent('saltmere', 'Dune house at Saltmere', 'Corvall coast', 1100, 3, 1, 92, [0.84, 0.18], { status: 'reserved' }),
  rent('ondel', 'Loft above the Ondel market', 'Plaça Ferran, Ondel', 1250, 2, 2, 75, [0.3, 0.5], {
    offerings: ['long_term_rent', 'sale'],
    priceLines: [
      { price: '€1,250', unit: '/ month' },
      { price: '€310,000', secondary: '€4,130/m²' },
    ],
    facts: [bedFact(2), bathFact(2), areaFact(75), floorFact(6)],
  }),
  rent('verel', 'Top-floor studio on Verel Square', 'Verel Square, Old Halden', 780, 1, 1, 38, [0.56, 0.58], {
    originalPrice: undefined,
    priceLines: [{ price: '€780', unit: '/ month', originalPrice: '€840' }],
  }),
  rent('brenn', 'Family house by the woods', 'Brenn Forest, Marrowfield', 1640, 4, 2, 148, [0.16, 0.76], { rating: 4.9, reviewCount: 7 }),
  rent('heron', 'Canal-side two-bed', 'Heron Quay, Varnholm', 1320, 2, 1, 81, [0.74, 0.72]),

  sale('talmar', 'Townhouse with a patio', 'Talmar Hill', 240000, 4, 2, 75, 'C', [0.24, 0.3], {
    priceLines: [{ price: '€240,000', secondary: '€3,200/m²', originalPrice: '€255,000' }],
    saved: true,
    approximate: true,
    approximateLocation: true,
    label: 'Price drop',
  }),
  sale('aurelle', 'Villa above the bay', 'Aurelle Heights, Solvia Bay', 1200000, 5, 4, 200, 'A', [0.7, 0.2]),
  sale('pellin', 'Pellin Bay apartment', 'Marrow Coast', 189000, 2, 1, 70, 'D', [0.5, 0.44], {
    facts: [bedFact(2), bathFact(1), areaFact(70), floorFact(2)],
  }),
  sale('lirio', 'Corner flat by the old harbour', 'Calle Lirio, Varnholm', 385000, 3, 2, 112, 'B', [0.34, 0.66]),
  sale('mill', 'Converted watermill', 'Tamsin Mill, Hollow Brook', 540000, 4, 3, 230, 'E', [0.12, 0.52]),
  sale('penthouse', 'Penthouse with a roof terrace', 'Verel Square, Old Halden', 725000, 3, 2, 128, 'A', [0.62, 0.7], {
    facts: [bedFact(3), bathFact(2), areaFact(128), floorFact(7)],
  }),
  sale('dune', 'Dune cottage to renovate', 'Saltmere Dunes, Corvall', 142000, 2, 1, 64, 'G', [0.86, 0.46], { status: 'reserved' }),
  sale('sold', 'Garden duplex in Eastwold', 'Quarry Lane, Eastwold', 298000, 3, 2, 96, 'C', [0.8, 0.82], { status: 'sold' }),

  stay('alvora', 'Alvora, Coast of Merin', 'Hosted by Ilse', '12 – 17 Oct', 124, 4.92, 128, [0.18, 0.22], { label: 'Guest favourite' }),
  stay('tessaly', 'Tessaly Hills, Varnholm', 'Cabin by the lake', '3 – 8 Nov', 88, null, undefined, [0.42, 0.14]),
  stay('brova', 'Brova Harbour, Kestrel Isles', 'Sea view', '20 – 25 Oct', 168, 4.81, 64, [0.7, 0.2], {
    saved: true,
    priceLines: [{ price: '€168', unit: 'night', originalPrice: '€210' }],
  }),
  stay('ondel-loft', 'Ondel Old Town, Rasmark', 'Loft near the square', '1 – 4 Dec', 96, 4.7, 312, [0.86, 0.34]),
  stay('saltmere-stay', 'Saltmere Dunes, Corvall', 'Hosted by Pim', '14 – 19 Jan', 204, 5, 18, [0.3, 0.42], { label: 'Guest favourite' }),
  stay('weyr', 'Weyr Valley, Hollin', 'Farmhouse with a garden', '9 – 12 Feb', 142, 4.88, 1204, [0.55, 0.38]),
  stay('lumen', 'Lumen Ridge, Aster Peaks', 'A-frame in the pines', '15 – 20 Oct', 156, null, undefined, [0.64, 0.62], { label: 'New' }),
  stay('isola', 'Isola Faro, Terracina Coast', 'Lighthouse keeper’s cottage', '18 – 23 Nov', 265, 4.99, 312, [0.2, 0.74]),

  swap('weyr-cottage', 'Garden cottage for a summer swap', 'Weyr Valley, Hollin', 'July – August', 2, 1, 64, [0.22, 0.26], { saved: true }),
  swap('harbour', 'Stone house by the harbour', 'Porto Lindo', 'Any time', 3, 2, 120, [0.62, 0.2]),
  swap('loft', 'Loft near the old market', 'Brevona', 'Weekends', 1, 1, 48, [0.44, 0.5]),
  swap('olive', 'Farmhouse with an olive grove', 'Valle Serra', 'Easter, summer', 4, 2, 180, [0.8, 0.44]),
  swap('canal', 'Canal flat with bikes included', 'Heron Quay, Varnholm', 'August', 2, 1, 70, [0.3, 0.72]),
  swap('chalet', 'Ski chalet above the village', 'Aster Peaks', 'December – March', 3, 2, 110, [0.7, 0.76]),
];

/** The listing page each mode's card opens. */
export const LISTING_PAGE_FOR_MODE: Record<HomeSearchMode, 'rent' | 'sale' | 'stay' | 'swap'> = {
  rent: 'rent',
  buy: 'sale',
  stays: 'stay',
  swap: 'swap',
};

export const RESULT_HEADINGS: Record<HomeSearchMode, string> = {
  rent: '1,240 homes to rent in Old Halden',
  buy: '586 homes for sale in Old Halden',
  stays: 'Over 1,000 places to stay',
  swap: '214 homes open to a swap',
};

// ---------------------------------------------------------------------------
//  Filters
// ---------------------------------------------------------------------------

/** 40 buckets of listing counts: a long-tailed hump, deterministic. */
export function priceBuckets(peak: number): number[] {
  return Array.from({ length: 40 }, (_, i) => {
    const x = i / 39;
    const hump = Math.exp(-((x - peak) ** 2) / 0.02) * 90;
    const tail = Math.exp(-x * 3) * 30;
    const wobble = ((i * 37) % 11) - 5;
    return Math.max(0, Math.round(hump + tail + wobble));
  });
}

export const PRICE_BOUNDS: Record<HomeSearchMode, { min: number; max: number; step: number; buckets: number[] }> = {
  rent: { min: 200, max: 4000, step: 50, buckets: priceBuckets(0.22) },
  buy: { min: 50000, max: 2000000, step: 5000, buckets: priceBuckets(0.4) },
  stays: { min: 20, max: 620, step: 5, buckets: priceBuckets(0.22) },
  swap: { min: 0, max: 0, step: 1, buckets: [] },
};

export type PlaceType = 'any' | 'room' | 'entire';
export const PLACE_TYPES: { value: PlaceType; label: string }[] = [
  { value: 'any', label: 'Any type' },
  { value: 'room', label: 'Room' },
  { value: 'entire', label: 'Entire home' },
];

export type SwapKind = 'any' | 'swap' | 'host';
export const SWAP_KINDS: { value: SwapKind; label: string }[] = [
  { value: 'any', label: 'Either' },
  { value: 'swap', label: 'Reciprocal' },
  { value: 'host', label: 'Guest points' },
];

export type StayAmenity = 'wifi' | 'kitchen' | 'washer' | 'parking' | 'ac' | 'tv' | 'fireplace' | 'workspace';
export const STAY_AMENITIES: ToggleChipOption<StayAmenity>[] = [
  { value: 'wifi', label: 'Wifi', icon: RiWifiLine },
  { value: 'kitchen', label: 'Kitchen', icon: RiRestaurantLine },
  { value: 'washer', label: 'Washer', icon: RiTShirtAirLine },
  { value: 'parking', label: 'Free parking', icon: RiParkingBoxLine },
  { value: 'ac', label: 'Air conditioning', icon: RiTempColdLine },
  { value: 'tv', label: 'TV', icon: RiTvLine },
  { value: 'fireplace', label: 'Indoor fireplace', icon: RiFireLine },
  { value: 'workspace', label: 'Workspace', icon: RiBriefcase4Line },
];

export interface Filters {
  price: [number, number];
  types: PropertyType[];
  placeType: PlaceType;
  swapKind: SwapKind;
  bedrooms: number | null;
  beds: number | null;
  bathrooms: number | null;
  area: [number | null, number | null];
  features: HousingFeature[];
  floors: FloorOption[];
  energy: EnergyRating | null;
  availableNow: boolean;
  availableFrom: Date | null;
  amenities: StayAmenity[];
  instant: boolean;
  verifiedOnly: boolean;
}

export function noFilters(mode: HomeSearchMode): Filters {
  const bounds = PRICE_BOUNDS[mode];
  return {
    price: [bounds.min, bounds.max],
    types: [],
    placeType: 'any',
    swapKind: 'any',
    bedrooms: null,
    beds: null,
    bathrooms: null,
    area: [null, null],
    features: [],
    floors: [],
    energy: null,
    availableNow: false,
    availableFrom: null,
    amenities: [],
    instant: false,
    verifiedOnly: false,
  };
}

export function appliedFilterCount(mode: HomeSearchMode, f: Filters): number {
  const bounds = PRICE_BOUNDS[mode];
  const price = mode !== 'swap' && (f.price[0] !== bounds.min || f.price[1] !== bounds.max) ? 1 : 0;
  const shared = (f.bedrooms != null ? 1 : 0) + (f.bathrooms != null ? 1 : 0);
  switch (mode) {
    case 'rent':
      return (
        price +
        shared +
        (f.types.length ? 1 : 0) +
        (f.area[0] != null || f.area[1] != null ? 1 : 0) +
        f.features.length +
        f.floors.length +
        (f.availableNow || f.availableFrom ? 1 : 0)
      );
    case 'buy':
      return (
        price +
        shared +
        (f.types.length ? 1 : 0) +
        (f.area[0] != null || f.area[1] != null ? 1 : 0) +
        (f.energy ? 1 : 0) +
        f.features.length +
        f.floors.length
      );
    case 'stays':
      return price + shared + (f.placeType !== 'any' ? 1 : 0) + (f.beds != null ? 1 : 0) + f.amenities.length + (f.instant ? 1 : 0);
    case 'swap':
      return shared + (f.swapKind !== 'any' ? 1 : 0) + f.features.length + (f.verifiedOnly ? 1 : 0);
  }
}

/** A stand-in for the result count an app would fetch. */
export function filterResultsLabel(mode: HomeSearchMode, f: Filters): string {
  const base = { rent: 1240, buy: 586, stays: 1000, swap: 214 }[mode];
  const n = Math.max(0, Math.round(base * Math.pow(0.72, appliedFilterCount(mode, f))));
  const noun = mode === 'stays' ? 'places' : 'homes';
  if (mode === 'stays' && n >= 1000) return 'Show 1,000+ places';
  return `Show ${n.toLocaleString('en-US')} ${noun}`;
}

// ---------------------------------------------------------------------------
//  Listing — shared
// ---------------------------------------------------------------------------

export const LISTING_PHOTOS: ListingPhoto[] = [
  { source: unsplash('1502672260266-1c1ef2d93688'), alt: 'Living room with a sofa by the window' },
  { source: unsplash('1522708323590-d24dbb6b0267'), alt: 'Open living and dining area' },
  { source: unsplash('1560448204-e02f11c3d0e2'), alt: 'Bright lounge' },
  { source: unsplash('1505691938895-1758d7feb511'), alt: 'Bedroom' },
  { source: unsplash('1484154218962-a197022b5858'), alt: 'Kitchen' },
  { source: unsplash('1493809842364-78817add7ffb'), alt: 'Reading corner' },
  { source: unsplash('1554995207-c18c203602cb'), alt: 'Sitting room' },
  { source: unsplash('1566665797739-1674de7a421a'), alt: 'Second bedroom' },
];

export const SALE_PHOTOS: ListingPhoto[] = [
  { source: unsplash('1600585154340-be6161a56a0c'), alt: 'Front of the house' },
  { source: unsplash('1512917774080-9991f1c4c750'), alt: 'Terrace' },
  { source: unsplash('1586023492125-27b2c045efd7'), alt: 'Dining table' },
  { source: unsplash('1507089947368-19c1da9775ae'), alt: 'Study by the window' },
  { source: unsplash('1484154218962-a197022b5858'), alt: 'Kitchen' },
];

export const NEIGHBOURHOOD: NeighbourhoodScore[] = [
  { label: 'Transport', value: 9.1, description: 'Metro 4 min, 6 bus lines', icon: RiSubwayLine },
  { label: 'Shops', value: 8.4, description: 'Market and two grocers nearby', icon: RiShoppingBasketLine },
  { label: 'Schools', value: 7.6, description: '3 primary schools within 1 km', icon: RiSchoolLine },
  { label: 'Quiet', value: 6.2, description: 'Busy on market days', icon: RiVolumeDownLine },
  { label: 'Green space', value: 7.9, description: 'Riverside park 6 min', icon: RiTreeLine },
  { label: 'Health', value: 8.8, description: 'Clinic and pharmacy on the street', icon: RiHeartPulseLine },
];

export const NEARBY: NearbyPlace[] = [
  { icon: RiSubwayLine, name: 'Plaza Orel', category: 'Metro station', time: '4 min' },
  { icon: RiSchoolLine, name: 'Senra Primary', category: 'Primary school', time: '7 min' },
  { icon: RiShoppingBasketLine, name: 'Orel covered market', category: 'Market', time: '5 min' },
  { icon: RiHospitalLine, name: 'Halden Health Centre', category: 'Clinic', time: '9 min' },
  { icon: RiTrainLine, name: 'Halden Central', category: 'Train station', time: '12 min', modeIcon: RiBikeLine },
  { icon: RiTreeLine, name: 'Riverside park', category: 'Park', time: '6 min', modeIcon: RiWalkLine },
];

export const VIEWING_DAYS: ViewingDay[] = [
  { value: '2026-09-21', weekday: 'Mon', day: '21' },
  { value: '2026-09-22', weekday: 'Tue', day: '22' },
  { value: '2026-09-23', weekday: 'Wed', day: '23', disabled: true },
  { value: '2026-09-24', weekday: 'Thu', day: '24' },
  { value: '2026-09-25', weekday: 'Fri', day: '25' },
  { value: '2026-09-26', weekday: 'Sat', day: '26' },
  { value: '2026-09-27', weekday: 'Sun', day: '27', disabled: true },
];

export const VIEWING_SLOTS: ViewingSlot[] = [
  { value: '09:00', label: '09:00' },
  { value: '09:30', label: '09:30', disabled: true },
  { value: '10:00', label: '10:00' },
  { value: '11:30', label: '11:30' },
  { value: '13:00', label: '13:00' },
  { value: '15:30', label: '15:30' },
  { value: '17:00', label: '17:00', disabled: true },
  { value: '18:30', label: '18:30' },
];

// ---------------------------------------------------------------------------
//  Listing — rent
// ---------------------------------------------------------------------------

export const RENT_LISTING = {
  title: 'Bright flat near Plaza Orel',
  subtitle: ['Apartment for rent', '3 bedrooms', '2 baths', '110 m²'],
  location: 'Calle Senra, Old Halden',
  rent: '€950',
  description:
    'A quiet three-bedroom flat on the fourth floor of a restored 1920s building, two minutes from Plaza Orel. Morning light comes through three tall windows in the living room, and the kitchen opens onto a small iron balcony over the courtyard.\n\nThe main bedroom fits a double bed and a wardrobe wall; the other two are good singles or a study. Heating is central, the windows were replaced in 2024, and there is a storage room in the basement.\n\nThe street is residential and walkable: bakeries, the covered market and the metro are all within five minutes.',
};

export const RENT_FACTS: PropertyFact[] = [
  { icon: RiRulerLine, label: 'Built area', value: '110 m²' },
  { icon: RiHotelBedLine, label: 'Bedrooms', value: '3' },
  { icon: RiDropLine, label: 'Bathrooms', value: '2' },
  { icon: RiBuilding2Line, label: 'Floor', value: '4th of 5' },
  { icon: RiStairsLine, label: 'Elevator', value: 'Yes' },
  { icon: RiArmchairLine, label: 'Furnished', value: 'Partly' },
  { icon: RiFireLine, label: 'Heating', value: 'Central' },
  { icon: RiLeafLine, label: 'Energy rating', value: 'C' },
];

export const RENT_KEY_FACTS: KeyFact[] = [
  { label: 'Deposit', value: '€1,900' },
  { label: 'Available from', value: 'Oct 1, 2026' },
  { label: 'Minimum stay', value: '12 months' },
  { label: 'Contract type', value: 'Long-term lease' },
];

export const RENT_HIGHLIGHTS: ListingHighlight[] = [
  { icon: RiKey2Line, title: 'Ready to move in', description: 'Available from 1 October, keys at signing.' },
  { icon: RiBearSmileLine, title: 'Pets considered', description: 'Small pets with a reference from a past landlord.' },
  { icon: RiShieldCheckLine, title: 'Verified landlord', description: 'Identity and ownership checked.' },
];

export const RENT_AMENITIES: Amenity[] = [
  { icon: RiWifiLine, label: 'Fibre internet', description: '1 Gb connection in the building' },
  { icon: RiFridgeLine, label: 'Fridge and oven' },
  { icon: RiTShirtAirLine, label: 'Washing machine' },
  { icon: RiSunLine, label: 'Balcony' },
  { icon: RiFireLine, label: 'Central heating' },
  { icon: RiStairsLine, label: 'Elevator' },
  { icon: RiBriefcase4Line, label: 'Storage room' },
  { icon: RiTempColdLine, label: 'Air conditioning', available: false },
  { icon: RiCarLine, label: 'Parking space', available: false },
];

export const RENT_PLANS: FloorPlanItem[] = [
  {
    source: plan([
      { x: 40, y: 40, w: 380, h: 300, label: 'Living · 32 m²' },
      { x: 420, y: 40, w: 340, h: 180, label: 'Kitchen' },
      { x: 420, y: 220, w: 340, h: 120, label: 'Bath' },
      { x: 40, y: 340, w: 260, h: 220, label: 'Bedroom' },
      { x: 300, y: 340, w: 230, h: 220, label: 'Bedroom' },
      { x: 530, y: 340, w: 230, h: 220, label: 'Study' },
    ]),
    label: 'Fourth floor · 110 m²',
    description: '3 bedrooms, 2 baths',
  },
  {
    source: plan([
      { x: 120, y: 120, w: 560, h: 360, label: 'Storage · 6 m²' },
    ]),
    label: 'Basement storage',
    description: 'Private, lockable',
  },
];

export const RENT_HISTORY: RentHistoryEntry[] = [
  { period: 'Since Sep 2026', amount: '€950 / month', note: 'Current listing', delta: '+3%' },
  { period: 'Oct 2023 – Aug 2026', amount: '€920 / month', note: 'Rented', delta: '+5%' },
  { period: 'Mar 2021 – Sep 2023', amount: '€875 / month', note: 'Rented' },
];

export const PLACE_REVIEW_CATEGORIES: ReviewCategory[] = [
  { label: 'Landlord responsiveness', value: 4.6, icon: RiChat3Line },
  { label: 'Repairs', value: 4.2, icon: RiCheckboxCircleLine },
  { label: 'Noise', value: 3.8, icon: RiVolumeDownLine },
  { label: 'Value', value: 4.4, icon: RiMoneyEuroBoxLine },
];

export const PLACE_REVIEWS = [
  {
    authorLabel: 'Tenant, 2023–2026',
    authorInitial: 'T',
    date: 'Reviewed August 2026',
    rating: 5,
    categories: [
      { label: 'Landlord responsiveness', value: 5 },
      { label: 'Repairs', value: 5 },
      { label: 'Noise', value: 4 },
      { label: 'Value', value: 4 },
    ],
    depositReturned: true,
    wouldRecommend: true,
    text: 'Three good years here. When the boiler failed in January it was fixed the next morning, and the deposit came back in full within two weeks of moving out. The flat is bright all day and the courtyard side is quiet at night.',
    helpfulCount: 14,
  },
  {
    authorLabel: 'Tenant, 2021–2023',
    authorInitial: 'R',
    date: 'Reviewed October 2023',
    rating: 4,
    categories: [
      { label: 'Landlord responsiveness', value: 4 },
      { label: 'Repairs', value: 3 },
      { label: 'Noise', value: 3 },
      { label: 'Value', value: 5 },
    ],
    depositReturned: true,
    wouldRecommend: true,
    text: 'Fair rent for the area and a landlord who answers messages. The street is loud on market days and the old windows (since replaced, I hear) let the cold in.',
    helpfulCount: 6,
  },
];

// ---------------------------------------------------------------------------
//  Listing — sale
// ---------------------------------------------------------------------------

export const SALE_LISTING = {
  title: 'Corner flat by the old harbour',
  subtitle: ['Apartment for sale', '3 bedrooms', '2 baths', '112 m²'],
  location: 'Calle Lirio, Varnholm',
  price: 385000,
  area: 112,
  description:
    'A corner flat on the third floor with light from two sides, a long balcony over the square and a kitchen that seats six. Renovated in 2021 with new wiring, plumbing and insulated windows. The harbour is a four-minute walk.',
};

export const SALE_FACTS: PropertyFact[] = [
  { icon: RiRulerLine, label: 'Built area', value: '112 m²' },
  { icon: RiHotelBedLine, label: 'Bedrooms', value: '3' },
  { icon: RiDropLine, label: 'Bathrooms', value: '2' },
  { icon: RiBuilding2Line, label: 'Floor', value: '3rd of 4' },
  { icon: RiCalendarLine, label: 'Built', value: '1978' },
  { icon: RiSparklingLine, label: 'Renovated', value: '2021' },
  { icon: RiSunLine, label: 'Orientation', value: 'South-west' },
  { icon: RiMoneyEuroBoxLine, label: 'Community fees', value: '€85 / month' },
];

export const SALE_KEY_FACTS: KeyFact[] = [
  { label: 'Living area', value: '112 m²' },
  { label: 'Built', value: '1978, renovated 2021' },
  { label: 'Energy rating', value: 'B' },
];

export const PRICE_HISTORY: PriceHistoryPeriod[] = [
  {
    id: '1y',
    label: '1Y',
    data: [
      { label: 'Oct', value: 410000, title: 'October 2025' },
      { label: 'Dec', value: 410000, title: 'December 2025' },
      { label: 'Feb', value: 398000, title: 'February 2026' },
      { label: 'Apr', value: 398000, title: 'April 2026' },
      { label: 'Jun', value: 392000, title: 'June 2026' },
      { label: 'Aug', value: 385000, title: 'August 2026' },
      { label: 'Sep', value: 385000, title: 'September 2026' },
    ],
    events: [
      { index: 0, kind: 'listed', label: 'Listed' },
      { index: 2, kind: 'price-drop', label: 'Price drop −3%' },
      { index: 4, kind: 'price-drop', label: 'Price drop −2%' },
      { index: 5, kind: 'price-drop', label: 'Price drop −2%' },
    ],
  },
  {
    id: 'all',
    label: 'All',
    data: [
      { label: '2017', value: 198000, title: '2017' },
      { label: '2019', value: 198000, title: '2019' },
      { label: '2021', value: 265000, title: '2021' },
      { label: '2023', value: 265000, title: '2023' },
      { label: '2025', value: 410000, title: '2025' },
      { label: '2026', value: 385000, title: '2026' },
    ],
    events: [
      { index: 0, kind: 'sold', label: 'Sold' },
      { index: 2, kind: 'sold', label: 'Sold' },
      { index: 4, kind: 'listed', label: 'Listed' },
    ],
  },
];

export const AREA_PRICES: AreaPriceRow[] = [
  { label: 'This home', value: 3438, display: '€3,438/m²', highlight: true },
  { label: 'Calle Lirio', value: 3610, display: '€3,610/m²' },
  { label: 'Old harbour', value: 3290, display: '€3,290/m²' },
  { label: 'Varnholm', value: 2840, display: '€2,840/m²' },
];

// ---------------------------------------------------------------------------
//  Listing — vacation rental
// ---------------------------------------------------------------------------

export const STAY_LISTING = {
  title: 'Sunlit flat above the river steps',
  subtitle: ['Entire rental unit in Porto Lume', '4 guests', '2 bedrooms', '3 beds', '1 bath'],
  location: 'Porto Lume, Coast of Merin',
  rating: 4.92,
  reviewCount: 128,
  nightly: 180,
  cleaningFee: 45,
  maxGuests: 4,
  description:
    'A quiet two-bedroom flat on the third floor of a restored townhouse, five minutes on foot from the river steps. Morning light comes through three tall windows in the living room, and the kitchen opens onto a small iron balcony with room for two chairs and a coffee.\n\nThe neighbourhood is residential and walkable: bakeries, a tram stop at the corner and the old harbour a ten-minute stroll downhill. The stairs are steep and there is no lift.',
};

export const STAY_HIGHLIGHTS: ListingHighlight[] = [
  { icon: RiDoorOpenLine, title: 'Self check-in', description: 'Check yourself in with the lockbox.' },
  { icon: RiBriefcase4Line, title: 'Dedicated workspace', description: 'A room with wifi that’s well suited for working.' },
  { icon: RiCalendarCloseLine, title: 'Free cancellation before Oct 5', description: 'Get a full refund if you change your mind.' },
];

export const STAY_AMENITY_LIST: Amenity[] = [
  { icon: RiWifiLine, label: 'Wifi' },
  { icon: RiRestaurantLine, label: 'Kitchen' },
  { icon: RiBriefcase4Line, label: 'Dedicated workspace' },
  { icon: RiTvLine, label: 'TV with streaming apps' },
  { icon: RiTShirtAirLine, label: 'Washer' },
  { icon: RiKey2Line, label: 'Lockbox' },
  { icon: RiSunLine, label: 'Balcony' },
  { icon: RiTempColdLine, label: 'Air conditioning', available: false },
];

export const STAY_REVIEW_CATEGORIES: ReviewCategory[] = [
  { label: 'Cleanliness', value: 4.9, icon: RiSparklingLine },
  { label: 'Accuracy', value: 4.9, icon: RiCheckboxCircleLine },
  { label: 'Check-in', value: 5, icon: RiKey2Line },
  { label: 'Communication', value: 4.8, icon: RiChat3Line },
  { label: 'Location', value: 4.7, icon: RiMapPin2Line },
  { label: 'Value', value: 4.6, icon: RiMedalLine },
];

export const STAY_REVIEW_DISTRIBUTION: ReviewDistributionRow[] = [
  { label: '5', value: 0.88 },
  { label: '4', value: 0.09 },
  { label: '3', value: 0.02 },
  { label: '2', value: 0.01 },
  { label: '1', value: 0 },
];

export const STAY_REVIEWS = [
  {
    name: 'Inês',
    avatar: unsplash('1502685104226-ee32379fefbe', 200),
    subtitle: 'Valdoria',
    rating: 5,
    date: 'August 2026',
    text: 'The flat is even brighter than the photos. Marta left a handwritten list of bakeries and a map of the river walk, and the lockbox made a late arrival painless. The bedroom stays quiet even on a Saturday night.',
    hostResponse: { title: 'Response from Marta', date: 'August 2026', text: 'Thank you, Inês — come back for the autumn festival!' },
  },
  { name: 'Tomás', subtitle: '3 years travelling', rating: 5, date: 'July 2026', text: 'Spotless, well located and exactly as described.' },
  {
    name: 'Hanna',
    subtitle: 'Kestrel Isles',
    rating: 4,
    date: 'June 2026',
    text: 'Lovely place in a great neighbourhood with trams at the door. The stairs are steep with luggage, which the listing does mention.',
  },
  {
    name: 'Rafael',
    subtitle: 'Old Halden',
    rating: 5,
    date: 'May 2026',
    text: 'Our second stay here. Communication was quick, the beds are comfortable and the street is full of small places to eat.',
  },
];

// ---------------------------------------------------------------------------
//  Swap
// ---------------------------------------------------------------------------

export const YOUR_HOME: ExchangeHome = {
  image: picsum('your-home-canal', 600, 450),
  title: 'Canal flat with bikes included',
  location: 'Heron Quay, Varnholm',
  details: '2 beds · 4 guests',
};

export const THEIR_HOME: ExchangeHome = {
  image: unsplash('1600585154340-be6161a56a0c', 600),
  title: 'Stone house by the harbour',
  location: 'Porto Lindo',
  details: '3 beds · 6 guests',
};

export const SWAP_LISTING = {
  title: 'Stone house by the harbour',
  subtitle: ['Entire house open to a swap', '6 guests', '3 bedrooms', '2 baths'],
  location: 'Porto Lindo',
  description:
    'Our family house sits two streets back from the harbour, with a walled garden, a big kitchen table and bikes for everyone. We would love a city flat for a couple of weeks in summer — somewhere with museums and a good bakery.',
};

export const SWAP_HIGHLIGHTS: ListingHighlight[] = [
  { icon: RiShieldCheckLine, title: 'Verified members', description: 'Both homes and identities checked.' },
  { icon: RiCalendarLine, title: 'Flexible dates', description: 'Any two weeks between June and September.' },
  { icon: RiBearSmileLine, title: 'Family friendly', description: 'Cot, high chair and a garden with a gate.' },
];

// ---------------------------------------------------------------------------
//  My home
// ---------------------------------------------------------------------------

export const LEASE: LeaseSummaryCardProps = {
  title: 'Calle Senra 14, 4º B',
  subtitle: 'Bright three-bedroom flat · Old Halden',
  parties: [
    { name: PEOPLE.landlord.name, role: 'Landlord', avatar: PEOPLE.landlord.avatar },
    { name: PEOPLE.you.name, role: 'Tenant (you)', avatar: PEOPLE.you.avatar },
  ],
  startDate: '1 Sep 2025',
  endDate: '31 Aug 2027',
  progress: 0.5,
  remainingLabel: '11 months left',
  rent: '€950',
  deposit: '€1,900',
  nextPayment: { date: '1 Oct', status: 'upcoming', statusLabel: 'Due in 14 days' },
};

export const PAYMENTS: RentPayment[] = [
  { id: 'sep', month: 'September 2026', dueDate: '1 Sep 2026', amount: '€950', method: 'Bank transfer', status: 'paid' },
  { id: 'aug', month: 'August 2026', dueDate: '1 Aug 2026', amount: '€950', method: 'Bank transfer', status: 'paid' },
  { id: 'jul', month: 'July 2026', dueDate: '1 Jul 2026', amount: '€500 of €950', method: 'Card ending 4417', status: 'partial', statusLabel: 'Partial' },
  { id: 'jun', month: 'June 2026', dueDate: '1 Jun 2026', amount: '€950', method: 'Bank transfer', status: 'paid', statusLabel: 'Paid 2 days late' },
  { id: 'may', month: 'May 2026', dueDate: '1 May 2026', amount: '€950', method: 'Bank transfer', status: 'paid' },
];

/** An offline snapshot drawn as an SVG data URI. */
function snapshot(wall: string, detail: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 240 240"><rect width="240" height="240" fill="${wall}"/><rect x="40" y="130" width="160" height="110" rx="6" fill="${detail}"/><circle cx="170" cy="70" r="26" fill="${detail}" opacity="0.5"/><rect x="60" y="40" width="70" height="60" rx="4" fill="#ffffff" opacity="0.55"/></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export const MAINTENANCE: Omit<MaintenanceRequestCardProps, 'onPressComments' | 'actions'>[] = [
  {
    title: 'Leak under the kitchen sink',
    category: 'plumbing',
    reference: '#1042',
    description: 'Water collects in the cabinet under the sink after using the dishwasher.',
    photos: [
      { source: snapshot('#dfe7ec', '#7a95a8'), alt: 'Pipe under the sink' },
      { source: snapshot('#ece3d8', '#a8876b'), alt: 'Water stain on the cabinet' },
    ],
    priority: 'high',
    stage: 'scheduled',
    stages: {
      reported: { date: '12 Sep', actor: 'You' },
      acknowledged: { date: '12 Sep', actor: 'Ilse (landlord)' },
      scheduled: { date: 'Thu 18 Sep, 9:00–11:00', actor: 'Brenn Plumbing' },
    },
    commentCount: 3,
  },
  {
    title: 'Bedroom radiator not heating',
    category: 'heating',
    reference: '#1017',
    priority: 'medium',
    stage: 'resolved',
    stages: {
      reported: { date: '2 Mar', actor: 'You' },
      acknowledged: { date: '3 Mar', actor: 'Ilse (landlord)' },
      scheduled: { date: '5 Mar' },
      resolved: { date: '5 Mar', actor: 'Valve replaced' },
    },
    commentCount: 1,
  },
];

export const DOCUMENTS: TenancyDocument[] = [
  { id: 'lease', name: 'Tenancy agreement.pdf', type: 'pdf', size: '412 KB', date: 'Signed 28 Aug 2025', status: 'signed' },
  { id: 'renewal', name: 'Rent review addendum 2026.pdf', type: 'pdf', size: '96 KB', date: 'Sent 10 Sep 2026', status: 'pending' },
  { id: 'inventory', name: 'Move-in inventory photos', type: 'image', size: '38 photos', date: '1 Sep 2025' },
  { id: 'energy', name: 'Energy certificate.docx', type: 'document', size: '1.2 MB', date: 'Valid until 3 Jun 2026', status: 'expired' },
];

export const TENANCY_EVENTS: TenancyTimelineEvent[] = [
  { title: 'Lease signed', date: '28 Aug 2025', actor: 'Ilse Marrow and Noor Halvik', icon: RiFileTextLine },
  { title: 'Moved in', date: '1 Sep 2025', actor: 'Keys handed over by Ilse', icon: RiKey2Line },
  { title: 'Deposit registered', date: '15 Sep 2025', actor: 'Regional housing office', icon: RiBankCardLine, tone: 'success' },
  { title: 'Rent review', date: '1 Sep 2026', description: 'The addendum is waiting for your signature.', icon: RiCalendarLine, state: 'current', tone: 'warning' },
  { title: 'Lease ends', date: '31 Aug 2027', icon: RiHome4Line, state: 'upcoming' },
];

export const APPLICATION: Omit<ApplicationItem, 'onAction'>[] = [
  { key: 'id', title: 'Proof of identity', description: 'Passport or national ID, both sides', status: 'verified' },
  { key: 'income', title: 'Proof of income', description: 'Last three payslips or a tax return', status: 'uploaded' },
  { key: 'reference', title: 'Landlord reference', status: 'rejected', reason: 'The letter is unsigned. Ask your previous landlord to sign it.' },
  { key: 'guarantor', title: 'Guarantor details', description: 'Only if your income is under 3× the rent', status: 'missing' },
];

// ---------------------------------------------------------------------------
//  Evictions
// ---------------------------------------------------------------------------

export type Report = Omit<EvictionReportCardProps, 'attending' | 'onAttendingChange' | 'onShare' | 'onContactSupport'> & {
  id: string;
  past: boolean;
};

export const REPORTS: Report[] = [
  {
    id: 'almond',
    past: false,
    date: 'Tuesday, 23 September',
    time: '09:00',
    relativeLabel: 'in 6 days',
    status: 'scheduled',
    area: 'Almond Street, Eastwold',
    household: ['Family with minors', 'Two children under 10'],
    description:
      'A mother and her two children face eviction from the flat they have rented for nine years after the building was sold. Social services have not offered alternative housing. The neighbourhood assembly is asking people to gather at the door from 08:30.',
    attendeesLabel: '48 people will attend',
    organisationsLabel: '3 organisations supporting',
    verified: true,
  },
  {
    id: 'pilar',
    past: false,
    date: 'Thursday, 2 October',
    time: '10:30',
    relativeLabel: 'in 15 days',
    status: 'postponed',
    area: 'North Quarter, Old Halden',
    household: ['Elderly person', 'Reduced mobility'],
    description: 'An 81-year-old neighbour with reduced mobility. The first date was postponed after a medical report; a new date has been set.',
    attendeesLabel: '17 people will attend',
    organisationsLabel: '1 organisation supporting',
    verified: true,
  },
  {
    id: 'reed',
    past: false,
    date: 'Monday, 29 September',
    time: '08:00',
    relativeLabel: 'in 12 days',
    status: 'scheduled',
    area: 'Reed Hollow, Marrowfield',
    household: ['Single-parent family'],
    description: 'Reported by a neighbour this morning. Waiting for the support group to confirm the details.',
    attendeesLabel: '5 people will attend',
  },
  {
    id: 'ribera',
    past: true,
    date: 'Wednesday, 10 September',
    time: '09:00',
    relativeLabel: '1 week ago',
    status: 'suspended',
    area: 'Riverside, Varnholm',
    household: ['Family with minors'],
    description: 'Suspended at the door after more than a hundred neighbours gathered and the court agreed to review the social services report.',
    attendeesLabel: '112 people attended',
    organisationsLabel: '4 organisations supporting',
    verified: true,
  },
  {
    id: 'usk',
    past: true,
    date: 'Friday, 29 August',
    time: '11:00',
    relativeLabel: '3 weeks ago',
    status: 'executed',
    area: 'Usk Park, Eastwold',
    household: ['Elderly couple'],
    description: 'The eviction went ahead. The support group is helping the couple with temporary accommodation.',
    attendeesLabel: '36 people attended',
    verified: true,
  },
  {
    id: 'latch',
    past: true,
    date: 'Tuesday, 19 August',
    relativeLabel: '1 month ago',
    status: 'cancelled',
    area: 'Latch Lane, Old Halden',
    description: 'The owner withdrew the claim after reaching an agreement with the tenants.',
    attendeesLabel: '22 people attended',
  },
];

export const CASE_HISTORY: EvictionEvent[] = [
  { kind: 'published', title: 'Report published', date: '2 Sep 2026', source: 'Neighbourhood assembly' },
  { kind: 'date-set', title: 'Eviction date set for 16 September', date: '4 Sep 2026', source: 'Court notice shared by the family' },
  { kind: 'mobilisation', title: 'Support call shared', date: '5 Sep 2026', description: 'Three housing groups joined the call.', source: 'Tenants’ union' },
  { kind: 'postponed', title: 'Postponed to 23 September', date: '15 Sep 2026', description: 'The court accepted a request to review the family’s situation.', source: 'Family’s lawyer' },
  { kind: 'date-set', title: 'Eviction scheduled', date: '23 Sep 2026, 09:00', upcoming: true },
];

// ---------------------------------------------------------------------------
//  Publish
// ---------------------------------------------------------------------------

export const PUBLISH_STEPS: WizardStep[] = [
  { key: 'type', title: 'What kind of home is it?', description: 'Pick the closest match. You can change it later.' },
  { key: 'address', title: 'Where is it?', description: 'Choose how precisely the listing shows the location.' },
  { key: 'details', title: 'The basics', description: 'Rooms, beds and floor area.' },
  { key: 'offerings', title: 'How is it offered?', description: 'Pick every way you would like to offer the home.' },
  { key: 'photos', title: 'Add photos', description: 'Add at least five. The first one is the cover — drag to reorder.' },
  { key: 'description', title: 'Describe the home' },
  { key: 'quality', title: 'Quality check', description: 'Complete listings get more replies.' },
  { key: 'publish', title: 'Ready to publish' },
];

export const PUBLISH_PHOTOS: SortablePhoto[] = [
  { id: 'living', uri: picsum('publish-living'), alt: 'Living room' },
  { id: 'kitchen', uri: picsum('publish-kitchen'), alt: 'Kitchen' },
  { id: 'bedroom', uri: picsum('publish-bedroom'), alt: 'Bedroom' },
  { id: 'balcony', uri: picsum('publish-balcony'), alt: 'Balcony' },
];

// ---------------------------------------------------------------------------
//  Saved
// ---------------------------------------------------------------------------

export const SAVED_SEARCHES = [
  {
    id: 'halden',
    title: '2-bed flats in Old Halden',
    criteria: ['Rent', '€800 – €1,200', '2+ bedrooms', 'Furnished'],
    newCount: 12,
    alertFrequency: 'Instant alerts',
    icon: RiBuilding2Line,
  },
  {
    id: 'marrow',
    title: 'Family houses by the lake in Marrowfield',
    criteria: ['Buy', '€300K – €600K', 'House', 'Garden', 'A–C energy'],
    newCount: 3,
    alertFrequency: 'Daily alerts',
    icon: RiHome4Line,
  },
  { id: 'solvia', title: 'Summer swap, Solvia Bay', criteria: ['Swap', 'Jul 4 – 25', 'Sleeps 4'], newCount: 0, icon: RiHomeHeartLine },
];

export const WISHLISTS = [
  { id: 'coast', name: 'Coast weekends', description: '12 saved', photos: [picsum('stay-isola-0', 600, 600), picsum('stay-brova-1', 600, 600), picsum('stay-alvora-2', 600, 600), picsum('stay-weyr-0', 600, 600)] },
  { id: 'rent', name: 'Flats to see', description: '5 saved', photos: [picsum('rent-tilia-0', 600, 600), picsum('rent-orel-1', 600, 600), picsum('rent-heron-2', 600, 600)] },
  { id: 'buy', name: 'Dream homes', description: '2 saved', photos: [picsum('sale-aurelle-0', 600, 600), picsum('sale-talmar-1', 600, 600)] },
  { id: 'someday', name: 'Someday', description: '1 saved', photos: [picsum('stay-lumen-0', 600, 600)] },
];

export interface Trip {
  id: string;
  image?: string;
  title: string;
  subtitle: string;
  dates: string;
  status: TripStatus;
}

export const TRIPS: Trip[] = [
  { id: 'porto', image: unsplash('1502672260266-1c1ef2d93688', 800), title: 'Sunlit flat above the river steps', subtitle: 'Porto Lume · Hosted by Marta', dates: 'Oct 12 – 17, 2026', status: 'confirmed' },
  { id: 'swap', image: unsplash('1600585154340-be6161a56a0c', 800), title: 'Swap: stone house by the harbour', subtitle: 'Porto Lindo · with the Oriel family', dates: 'Nov 2 – 16, 2026', status: 'pending' },
  { id: 'brenn', image: picsum('stay-isola-0', 800, 600), title: 'Lighthouse keeper’s cottage', subtitle: 'Isola Faro · Hosted by Idris', dates: 'Dec 8 – 13, 2026', status: 'confirmed' },
];
