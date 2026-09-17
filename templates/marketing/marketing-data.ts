import type {
  AreaPoint,
  AreaRange,
  AreaSeries,
  BarListTab,
  ComboPoint,
  ComboRange,
  ComboSeries,
  FunnelRange,
  RadialDatum,
  RadialRange,
} from '../../src/chart-cards';
import {
  RiCoinsLine,
  RiCursorLine,
  RiEyeLine,
  RiGlobalLine,
  RiGoogleFill,
  RiLinkedinBoxFill,
  RiMailLine,
  RiMetaFill,
  RiShakeHandsLine,
  RiTwitterXFill,
  RiUserFollowLine,
} from '../../src/icons/remix';
import type { StatCardsItem } from '../../src/stat-cards';
import { MONTHS } from '../shared/dashboard';

/**
 * Demo datasets for the marketing template — every
 * chart card reads from here, so the numbers agree with each other (the funnel
 * ends where the KPI conversions start, spend matches the combo chart, …).
 */

export const currency = (n: number) => `$${n.toLocaleString('en-US')}`;

export const compactCurrency = (n: number) =>
  n >= 1000 ? `$${(Math.round(n / 100) / 10).toLocaleString('en-US')}K`.replace('.0K', 'K') : `$${Math.round(n)}`;

export const compactNumber = (n: number) =>
  n >= 1_000_000
    ? `${Math.round(n / 100_000) / 10}M`.replace('.0M', 'M')
    : n >= 1000
      ? `${Math.round(n / 100) / 10}K`.replace('.0K', 'K')
      : String(Math.round(n));

export const multiplier = (n: number) => `${(Math.round(n * 10) / 10).toFixed(1)}x`;

export const MARKETING_STATS: StatCardsItem[] = [
  { icon: RiCoinsLine, label: 'Ad spend', value: '$24,380', delta: '+8.4%', deltaColor: 'lime' },
  { icon: RiEyeLine, label: 'Impressions', value: '1.94M', delta: '+12.6%', deltaColor: 'lime' },
  { icon: RiUserFollowLine, label: 'Conversions', value: '1,286', delta: '+5.2%', deltaColor: 'lime' },
  { icon: RiCursorLine, label: 'Cost per click', value: '$1.24', delta: '-3.1%', deltaColor: 'rose' },
];

/* ------------------------------------------------------ acquisition funnel */

// Starts at visits rather than impressions: an impressions-first funnel drops
// ~80% in the first taper and every later band renders as a sliver.
const funnelStages = (values: [number, number, number, number]) => [
  { label: 'Visits', value: values[0] },
  { label: 'Sign-ups', value: values[1] },
  { label: 'Trials', value: values[2] },
  { label: 'Customers', value: values[3] },
];

export const FUNNEL_RANGES: FunnelRange[] = [
  { id: '7d', label: 'Last 7 days', stages: funnelStages([21_600, 8_400, 3_050, 1_150]), delta: 0.031 },
  { id: '30d', label: 'Last 30 days', stages: funnelStages([96_400, 38_600, 14_100, 5_240]), delta: 0.058 },
  { id: '90d', label: 'Last 90 days', stages: funnelStages([262_000, 104_000, 38_500, 14_800]), delta: -0.021 },
];

/* ------------------------------------------------------- spend by channel */

const spendSplit = (values: [number, number, number, number]): RadialDatum[] => [
  { label: 'Paid search', value: values[0] },
  { label: 'Paid social', value: values[1] },
  { label: 'Email', value: values[2] },
  { label: 'Affiliates', value: values[3] },
];

export const SPEND_RANGES: RadialRange[] = [
  { id: '7d', label: 'Last 7 days', data: spendSplit([2_840, 1_920, 680, 620]), delta: 0.026 },
  { id: '30d', label: 'Last 30 days', data: spendSplit([11_400, 7_620, 3_180, 2_680]), delta: 0.084 },
  { id: '90d', label: 'Last 90 days', data: spendSplit([32_800, 24_100, 9_400, 8_100]), delta: -0.018 },
];

/* -------------------------------------------------------- traffic sources */

export const TRAFFIC_TABS: BarListTab[] = [
  {
    id: 'channels',
    label: 'Channels',
    items: [
      { label: 'Google Ads', value: 9_840, icon: RiGoogleFill },
      { label: 'Meta', value: 6_320, icon: RiMetaFill },
      { label: 'X Ads', value: 3_480, icon: RiTwitterXFill },
      { label: 'LinkedIn', value: 2_140, icon: RiLinkedinBoxFill },
      { label: 'Email', value: 1_860, icon: RiMailLine },
      { label: 'Affiliates', value: 940, icon: RiShakeHandsLine },
      { label: 'Referral', value: 620, icon: RiGlobalLine },
    ],
  },
  {
    id: 'campaigns',
    label: 'Campaigns',
    items: [
      { label: 'Brand search', value: 4_620 },
      { label: 'Spring launch', value: 3_940 },
      { label: 'Cart retargeting', value: 2_810 },
      { label: 'Competitor keywords', value: 1_930 },
      { label: 'Founder story video', value: 1_480 },
      { label: 'Newsletter promo', value: 1_120 },
      { label: 'Lookalike broad', value: 860 },
    ],
  },
  {
    id: 'pages',
    label: 'Landing pages',
    items: [
      { label: '/pricing', value: 5_240 },
      { label: '/templates', value: 4_180 },
      { label: '/', value: 3_360 },
      { label: '/components', value: 2_240 },
      { label: '/blog/launch-week', value: 1_410 },
      { label: '/docs/quickstart', value: 780 },
    ],
  },
];

/* -------------------------------------------------------- spend vs. ROAS */

const spendRows = (spend: number[], roas: number[]): ComboPoint[] =>
  spend.map((value, i) => ({ label: MONTHS[i] ?? '', spend: value, roas: roas[i] ?? 0 }));

export const SPEND_BAR: ComboSeries = { key: 'spend', label: 'Ad spend', format: compactCurrency };

/** The ROAS line; its colour (`chart-6`) is resolved on the theme by the template. */
export const ROAS_LINE: Omit<ComboSeries, 'color' | 'activeColor'> = {
  key: 'roas',
  label: 'ROAS',
  format: multiplier,
};

const SPEND_YEAR = spendRows(
  [12_400, 13_800, 15_200, 14_100, 16_800, 18_400, 17_600, 19_800, 21_400, 20_600, 23_200, 24_380],
  [2.8, 3.0, 3.2, 3.1, 3.4, 3.6, 3.5, 3.8, 4.0, 3.9, 4.2, 4.3],
);

export const SPEND_ROAS_RANGES: ComboRange[] = [
  { id: 'year', label: 'This year', data: SPEND_YEAR, delta: 0.094 },
  {
    id: 'h2',
    label: 'Last 6 months',
    data: spendRows([17_600, 19_800, 21_400, 20_600, 23_200, 24_380], [3.5, 3.8, 4.0, 3.9, 4.2, 4.3]).map((row, i) => ({
      ...row,
      label: MONTHS[i + 6] ?? '',
    })),
    delta: 0.126,
  },
  {
    id: 'prev',
    label: 'Last year',
    data: spendRows(
      [8_200, 8_900, 10_400, 9_800, 11_600, 12_100, 11_400, 13_200, 14_600, 13_900, 15_800, 16_400],
      [2.1, 2.2, 2.4, 2.3, 2.6, 2.7, 2.6, 2.9, 3.0, 2.9, 3.1, 3.2],
    ),
    delta: -0.042,
  },
];

/* ---------------------------------------------------- visitors by channel */

export const VISITOR_SERIES: AreaSeries[] = [
  { key: 'organic', label: 'Organic' },
  { key: 'paid', label: 'Paid' },
  { key: 'social', label: 'Social' },
];

const visitorRows = (organic: number[], paid: number[], social: number[]): AreaPoint[] =>
  organic.map((value, i) => ({
    label: MONTHS[i] ?? '',
    organic: value,
    paid: paid[i] ?? 0,
    social: social[i] ?? 0,
  }));

const VISITORS_YEAR = visitorRows(
  [4_200, 4_600, 5_100, 4_900, 5_600, 6_200, 6_000, 6_800, 7_400, 7_100, 8_000, 8_600],
  [2_100, 2_400, 2_600, 2_500, 2_900, 3_200, 3_100, 3_500, 3_800, 3_700, 4_200, 4_500],
  [1_100, 1_200, 1_400, 1_300, 1_600, 1_800, 1_700, 2_000, 2_200, 2_100, 2_400, 2_600],
);

export const VISITOR_RANGES: AreaRange[] = [
  { id: 'year', label: 'This year', data: VISITORS_YEAR, delta: 0.088 },
  {
    id: 'h2',
    label: 'Last 6 months',
    data: visitorRows(
      [6_000, 6_800, 7_400, 7_100, 8_000, 8_600],
      [3_100, 3_500, 3_800, 3_700, 4_200, 4_500],
      [1_700, 2_000, 2_200, 2_100, 2_400, 2_600],
    ).map((row, i) => ({ ...row, label: MONTHS[i + 6] ?? '' })),
    delta: 0.117,
  },
  {
    id: 'prev',
    label: 'Last year',
    data: visitorRows(
      [2_900, 3_100, 3_500, 3_300, 3_900, 4_300, 4_100, 4_700, 5_100, 4_900, 5_500, 5_900],
      [1_400, 1_600, 1_700, 1_600, 1_900, 2_100, 2_000, 2_300, 2_500, 2_400, 2_700, 2_900],
      [700, 800, 900, 850, 1_000, 1_200, 1_100, 1_300, 1_500, 1_400, 1_600, 1_800],
    ),
    delta: -0.034,
  },
];
