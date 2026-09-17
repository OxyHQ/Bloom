import { hashContributionCell, type ContributionCell } from '../../src/chart-cards/contributions-cells';
import type { ContributionsStat, EarningsPoint, EarningsRange, LinePoint, LineRange } from '../../src/chart-cards';
import type { ChipHue } from '../../src/chip';
import type { DataTableSelectOption } from '../../src/data-table';
import { RiBox3Line, RiChatSmile2Line, RiGroupLine, RiShoppingBasketLine } from '../../src/icons/remix';
import type { RecentHire } from '../../src/recent-hires-card';
import type { StatCardsItem } from '../../src/stat-cards';
import { AVATARS, MONTHS, PHOTO_PEOPLE, assetUri, makeRng } from '../shared/dashboard';

/**
 * Demo data for the Home Dashboard template. The sidebar, header and photo
 * people are the dashboard family's shared demo data (`../shared/dashboard`);
 * the recent hires are shared with the HR template.
 */

// ---------------------------------------------------------------------------
//  Recent hires
// ---------------------------------------------------------------------------

export const RECENT_HIRES: RecentHire[] = [
  { name: 'Livia Saris', joined: 'Joined today', role: 'Backend Engineer', avatar: assetUri(AVATARS.liviaSaris) },
  { name: 'Jaydon Aminoff', joined: '2 days ago', role: 'UI Designer', avatar: assetUri(AVATARS.jaydonAminoff) },
  { name: 'Maria Lubin', joined: '5 days ago', role: 'User Researcher', avatar: assetUri(AVATARS.mariaLubin) },
  { name: 'Ann Press', joined: 'A week ago', role: 'DevOps Engineer', avatar: assetUri(AVATARS.annPress) },
];

// ---------------------------------------------------------------------------
//  Charts (earnings, line, contributions)
// ---------------------------------------------------------------------------


const earnings = (values: number[]): EarningsPoint[] => values.map((value, i) => ({ label: MONTHS[i]!, value }));

export const EARNINGS_RANGES: EarningsRange[] = [
  {
    id: 'weekly',
    label: 'Weekly',
    headline: 7462,
    delta: 0.148,
    data: earnings([3240, 7420, 9650, 7130, 3670, 2300, 3820, 5040, 6840, 4540, 11520, 8210]),
  },
  {
    id: 'monthly',
    label: 'Monthly',
    headline: 32180,
    delta: 0.082,
    data: earnings([5200, 6100, 7300, 8900, 9600, 10800, 11200, 9800, 8600, 7400, 6900, 8100]),
  },
  {
    id: 'yearly',
    label: 'Yearly',
    headline: 389204,
    delta: 0.214,
    data: earnings([4200, 4800, 5600, 6100, 6800, 7500, 8200, 8900, 9600, 10300, 11000, 11600]),
  },
];

/** The Figma ticks and ceiling. */
export const EARNINGS_Y_TICKS = [0, 3000, 5000, 10000];
export const EARNINGS_Y_MAX = 12000;

const revenue = (values: number[]): LinePoint[] => values.map((value, i) => ({ label: MONTHS[i]!, value }));

export const REVENUE_RANGES: LineRange[] = [
  {
    id: 'weekly',
    label: 'Weekly',
    headline: 18240,
    delta: 0.094,
    data: revenue([1400, 1900, 2600, 2300, 3400, 3100, 2700, 3800, 4600, 4200, 3600, 5200]),
  },
  {
    id: 'monthly',
    label: 'Monthly',
    headline: 64820,
    delta: 0.126,
    data: revenue([3200, 4100, 3800, 5200, 6400, 5900, 5100, 6800, 8100, 7600, 8400, 9600]),
  },
  {
    id: 'yearly',
    label: 'Yearly',
    headline: 512400,
    delta: -0.032,
    data: revenue([28000, 34000, 46000, 41000, 52000, 49000, 61000, 55000, 68000, 72000, 64000, 83000]),
  },
];

const COUNT_BANDS: [number, number][] = [[0, 0], [1, 4], [5, 9], [10, 15], [16, 24], [25, 40]];

function tierFor(row: number, col: number) {
  const seed = hashContributionCell(row, col) % 20;
  if (seed < 6) return 0;
  if (seed < 11) return 1;
  if (seed < 15) return 2;
  if (seed < 18) return 3;
  if (seed < 19) return 4;
  return 5;
}

/** A hash-scattered year: 37 columns × 7 rows, column-major. */
export const CONTRIBUTION_CELLS: ContributionCell[] = Array.from({ length: 37 * 7 }, (_, index) => {
  const col = Math.floor(index / 7);
  const row = index % 7;
  const tier = tierFor(row, col);
  const [lo, hi] = COUNT_BANDS[tier]!;
  const count = hi === 0 ? 0 : lo + ((hashContributionCell(row, col) >>> 3) % (hi - lo + 1));
  const dayOfYear = Math.round((index / (37 * 7 - 1)) * 364);
  const d = new Date(Date.UTC(2026, 0, 1 + dayOfYear));
  return { count, tier, date: `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}` };
});

export const CONTRIBUTION_STATS: ContributionsStat[] = [
  { value: '9B', label: 'Lifetime tokens' },
  { value: '562.7M', label: 'Peak tokens' },
  { value: '12h 54m', label: 'Longest task' },
  { value: '62 days', label: 'Top streak' },
];

// ---------------------------------------------------------------------------
//  KPI cards
// ---------------------------------------------------------------------------

export const DASHBOARD_STATS: StatCardsItem[] = [
  { icon: RiGroupLine, label: 'Customers', value: '14,592', delta: '+5.3%', deltaColor: 'lime' },
  { icon: RiBox3Line, label: 'Unit sold', value: '385', delta: '-2.1%', deltaColor: 'rose' },
  { icon: RiShoppingBasketLine, label: 'Orders', value: '1,394', delta: '0.00%', deltaColor: 'neutral' },
  { icon: RiChatSmile2Line, label: 'Support tickets', value: '708', delta: '+12.8%', deltaColor: 'lime' },
];

// ---------------------------------------------------------------------------
//  Customers table — 660 rows from a seeded PRNG.
// ---------------------------------------------------------------------------

export interface CustomerStatus {
  label: string;
  color: ChipHue;
}

export type Purchase = 'completed' | 'waiting' | 'processing';

export interface Customer {
  id: string;
  name: string;
  avatar?: string | number;
  initialsColor: 'neutral' | 'blue';
  purchase: Purchase;
  status: CustomerStatus;
  product: string;
  region: string;
  price: number;
  updated: string;
  updatedTs: number;
}

const STATUSES: CustomerStatus[] = [
  { label: 'Shipped', color: 'lime' },
  { label: 'Delivery waiting', color: 'yellow' },
  { label: 'Delivery failed', color: 'rose' },
  { label: 'Confirmed', color: 'cyan' },
];

export const PRODUCTS = ['Sneakers', 'Backpack', 'Smart watch', 'Headphones', 'Sunglasses', 'Wallet'];
export const REGIONS = ['North America', 'Europe', 'Asia', 'Oceania'];

export const PRICE_BUCKETS: { id: string; label: string; test: (p: number) => boolean }[] = [
  { id: 'all', label: 'All prices', test: () => true },
  { id: 'under-100', label: 'Under $100', test: (p) => p < 100 },
  { id: '100-500', label: '$100 – $500', test: (p) => p >= 100 && p <= 500 },
  { id: '500-1000', label: '$500 – $1,000', test: (p) => p > 500 && p <= 1000 },
  { id: 'over-1000', label: 'Over $1,000', test: (p) => p > 1000 },
];

export const PURCHASES: DataTableSelectOption[] = [
  { value: 'completed', label: 'Completed', dot: 'success' },
  { value: 'waiting', label: 'Waiting', dot: 'warning' },
  { value: 'processing', label: 'Processing', dot: 'info' },
];

const FIRST_NAMES = ['Marcus', 'Cheyenne', 'Alfredo', 'Talan', 'Roger', 'Cristofer', 'Emery', 'Kadin', 'Nolan', 'Ruben', 'Skylar', 'Hanna', 'Corey', 'Miracle', 'Zaire', 'Cooper', 'Leilani', 'Alena', 'Terry', 'Jaxson', 'Kaiya', 'Omar', 'Phoenix', 'Adison', 'Gretchen', 'Marcus', 'Nova', 'Ellis', 'Dulce', 'Wilson'];
const LAST_NAMES = ['Culhane', 'Herwitz', 'Septimus', 'Bergson', 'Curtis', 'Vetrovs', 'Rhiel', 'Dokidis', 'Kenter', 'Stanton', 'Baptista', 'Workman', 'Torff', 'Calzoni', 'Rosser', 'Geidt', 'Bator', 'Vaccaro', 'Lipshutz', 'Botosh'];

export function formatPrice(n: number) {
  return n >= 1000 ? `$${Math.floor(n / 1000)}.${String(n % 1000).padStart(3, '0')}` : `$${n}`;
}

export const CUSTOMERS: Customer[] = (() => {
  const rng = makeRng(42);
  const pick = <T,>(arr: T[]) => arr[Math.floor(rng() * arr.length)]!;
  return Array.from({ length: 660 }, (_, i) => {
    const status = pick(STATUSES);
    const purchase: Purchase =
      rng() < 0.24
        ? 'processing'
        : status.label === 'Shipped' || status.label === 'Confirmed'
          ? 'completed'
          : 'waiting';
    const price = 20 + Math.floor(rng() * 3980);
    const monthIdx = Math.floor(rng() * 12);
    const day = 1 + Math.floor(rng() * 28);
    const base = {
      id: String(i),
      purchase,
      status,
      product: pick(PRODUCTS),
      region: pick(REGIONS),
      price,
      updated: `${MONTHS[monthIdx]} ${String(day).padStart(2, '0')}, 2026`,
      updatedTs: Date.UTC(2026, monthIdx, day),
    };
    const person = PHOTO_PEOPLE[i];
    if (person) return { ...base, name: person.name, avatar: person.avatar, initialsColor: 'neutral' as const };
    const name = `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
    return { ...base, name, initialsColor: rng() > 0.5 ? ('blue' as const) : ('neutral' as const) };
  });
})();

/** Rows 1 and 2 start selected. */
export const DEFAULT_SELECTED_CUSTOMERS = ['1', '2'];
