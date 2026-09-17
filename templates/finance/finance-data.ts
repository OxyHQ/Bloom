import type {
  HeatmapRange,
  HeatmapRow,
  RadialRange,
  SankeyLinkDatum,
  SankeyNodeDatum,
  SankeyRange,
  ScatterRange,
  ScatterSeries,
} from '../../src/chart-cards';
import { RiBankCard2Line, RiHandCoinLine, RiStockLine, RiWallet3Line } from '../../src/icons/remix';
import type { StatCardsItem } from '../../src/stat-cards';

/**
 * Demo datasets for the finance template — the cash-flow
 * sankey, spending rings, portfolio scatter and spending heatmap all read from
 * here so the numbers agree (the sankey's income matches the KPI row, the rings
 * match the sankey's spending side, and so on).
 */

export const currency = (n: number) => `$${n.toLocaleString('en-US')}`;

export const percent = (n: number) => `${Math.round(n * 10) / 10}%`;

export const FINANCE_STATS: StatCardsItem[] = [
  { icon: RiWallet3Line, label: 'Total balance', value: '$84,230', delta: '+3.2%', deltaColor: 'lime' },
  { icon: RiHandCoinLine, label: 'Income', value: '$18,420', delta: '+6.1%', deltaColor: 'lime' },
  { icon: RiBankCard2Line, label: 'Expenses', value: '$9,140', delta: '+2.4%', deltaColor: 'rose' },
  { icon: RiStockLine, label: 'Invested', value: '$32,400', delta: '+8.4%', deltaColor: 'lime' },
];

/* -------------------------------------------------------------- cash flow */

export const CASH_FLOW_NODES: SankeyNodeDatum[] = [
  // Income sources carry the colour; spending sinks stay neutral so the
  // ribbons paint them.
  { name: 'Salary', hue: 7 },
  { name: 'Freelance', hue: 6 },
  { name: 'Dividends', hue: 5 },
  { name: 'Housing', color: 'neutral' },
  { name: 'Groceries', color: 'neutral' },
  { name: 'Transport', color: 'neutral' },
  { name: 'Subscriptions', color: 'neutral' },
  { name: 'Dining', color: 'neutral' },
  { name: 'Investing', color: 'neutral' },
  { name: 'Savings', color: 'neutral' },
];

const CASH_FLOW_LINKS: SankeyLinkDatum[] = [
  { source: 'Salary', target: 'Housing', value: 2650 },
  { source: 'Salary', target: 'Groceries', value: 1240 },
  { source: 'Salary', target: 'Transport', value: 620 },
  { source: 'Salary', target: 'Savings', value: 4200 },
  { source: 'Salary', target: 'Investing', value: 3690 },
  { source: 'Freelance', target: 'Dining', value: 840 },
  { source: 'Freelance', target: 'Subscriptions', value: 460 },
  { source: 'Freelance', target: 'Investing', value: 1400 },
  { source: 'Freelance', target: 'Savings', value: 1100 },
  { source: 'Dividends', target: 'Investing', value: 1480 },
  { source: 'Dividends', target: 'Savings', value: 740 },
];

const scaleLinks = (factor: number): SankeyLinkDatum[] =>
  CASH_FLOW_LINKS.map((l) => ({ ...l, value: Math.round(l.value * factor) }));

export const CASH_FLOW_RANGES: SankeyRange[] = [
  { id: 'month', label: 'This month', nodes: CASH_FLOW_NODES, links: CASH_FLOW_LINKS, delta: 0.061 },
  { id: 'quarter', label: 'This quarter', nodes: CASH_FLOW_NODES, links: scaleLinks(2.9), delta: 0.043 },
  { id: 'year', label: 'This year', nodes: CASH_FLOW_NODES, links: scaleLinks(11.6), delta: -0.018 },
];

/* --------------------------------------------------- spending by category */

const spendingRings = (values: [number, number, number, number, number]) => [
  { label: 'Dining', value: values[0] },
  { label: 'Subscriptions', value: values[1] },
  { label: 'Transport', value: values[2] },
  { label: 'Groceries', value: values[3] },
  { label: 'Housing', value: values[4] },
];

export const SPENDING_RANGES: RadialRange[] = [
  { id: 'month', label: 'This month', data: spendingRings([840, 460, 620, 1_240, 2_650]), delta: 0.024 },
  { id: 'quarter', label: 'This quarter', data: spendingRings([2_430, 1_380, 1_790, 3_620, 7_950]), delta: 0.051 },
  { id: 'year', label: 'This year', data: spendingRings([9_700, 5_520, 7_180, 14_400, 31_800]), delta: -0.012 },
];

/* --------------------------------------------------------------- holdings */

export const PORTFOLIO_SERIES: ScatterSeries[] = [
  {
    label: 'Stocks',
    points: [
      { x: 32, y: 8.4, z: 8_200, label: 'NVDA' },
      { x: 24, y: 6.1, z: 5_400, label: 'AAPL' },
      { x: 41, y: 11.2, z: 3_100, label: 'TSLA' },
      { x: 19, y: 4.8, z: 2_600, label: 'MSFT' },
    ],
  },
  {
    label: 'Funds',
    points: [
      { x: 9, y: 3.6, z: 9_800, label: 'S&P 500 ETF' },
      { x: 12, y: 4.2, z: 4_400, label: 'Global index' },
      { x: 6, y: 2.1, z: 3_200, label: 'Bond fund' },
    ],
  },
  {
    label: 'Crypto',
    points: [
      { x: 68, y: 14.6, z: 2_400, label: 'BTC' },
      { x: 79, y: 9.8, z: 1_300, label: 'ETH' },
    ],
  },
];

const scaleReturns = (factor: number): ScatterSeries[] =>
  PORTFOLIO_SERIES.map((s) => ({
    ...s,
    points: s.points.map((p) => ({ ...p, y: Math.round(p.y * factor * 10) / 10 })),
  }));

export const PORTFOLIO_RANGES: ScatterRange[] = [
  { id: 'ytd', label: 'Year to date', series: PORTFOLIO_SERIES, delta: 0.062 },
  { id: '1y', label: 'Last 12 months', series: scaleReturns(1.4), delta: 0.088 },
  { id: '3y', label: 'Last 3 years', series: scaleReturns(2.6), delta: -0.021 },
];

/* ------------------------------------------------------- spending rhythm */

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const SPENDING_WEEK_COLUMNS = Array.from({ length: 12 }, (_, i) => `W${i + 1}`);

const heatRows = (rows: number[][]): HeatmapRow[] =>
  rows.map((values, i) => ({ label: DAYS[i] ?? '', values }));

// Weekday spending clusters around groceries (Wed) and weekends (Fri–Sun).
const SPENDING_HEAT = heatRows([
  [24, 18, 32, 21, 28, 35, 22, 30, 26, 38, 29, 33],
  [18, 22, 16, 25, 19, 28, 24, 21, 30, 24, 27, 22],
  [52, 46, 58, 49, 62, 55, 64, 58, 70, 61, 66, 72],
  [21, 26, 19, 30, 24, 27, 22, 32, 25, 29, 34, 26],
  [64, 58, 72, 66, 78, 70, 82, 74, 88, 79, 84, 92],
  [88, 76, 94, 82, 102, 90, 108, 96, 118, 104, 112, 124],
  [46, 40, 52, 44, 56, 50, 60, 52, 64, 56, 61, 68],
]);

export const SPENDING_HEAT_RANGES: HeatmapRange[] = [
  { id: '12w', label: 'Last 12 weeks', rows: SPENDING_HEAT, columns: SPENDING_WEEK_COLUMNS, delta: 0.036 },
  {
    id: 'prev',
    label: 'Previous 12 weeks',
    rows: SPENDING_HEAT.map((r) => ({ ...r, values: r.values.map((v) => Math.round(v * 0.84)) })),
    columns: SPENDING_WEEK_COLUMNS,
    delta: -0.022,
  },
];
