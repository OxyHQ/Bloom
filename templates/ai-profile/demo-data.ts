import type { AgentsPoint } from '../../src/chart-cards/AgentsChartCard';
import type { TokensPoint } from '../../src/chart-cards/TokensChartCard';
import type { ContributionCell } from '../../src/chart-cards/contributions-cells';
import { hashContributionCell } from '../../src/chart-cards/contributions-cells';
import type { AiProfileCardStat } from '../../src/ai-profile-card';
import type { ImageSourcePropType } from 'react-native';

import coverAsset from './assets/cover.png';

/**
 * Demo data for the AI profile template and the profile card's constants,
 * deterministic (no Math.random / Date.now).
 */

const image = (asset: unknown): ImageSourcePropType =>
  typeof asset === 'string' ? { uri: asset } : (asset as ImageSourcePropType);

// ---------------------------------------------------------------------------
//  Profile card
// ---------------------------------------------------------------------------

export const PROFILE = {
  name: 'Maya Collins',
  handle: '@sitenley',
  badge: 'PRO',
  cover: image(coverAsset),
  contributions: 7462,
  delta: '+14.8%',
};

export const STATS: AiProfileCardStat[] = [
  { value: '9B', label: 'Lifetime tokens' },
  { value: '562.7M', label: 'Peak tokens' },
  { value: '12h 54m', label: 'Longest task' },
  { value: '62 days', label: 'Top streak' },
];

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const COUNT_BANDS: [number, number][] = [[0, 0], [1, 4], [5, 9], [10, 15], [16, 24], [25, 40]];

/** Hash-scattered activity tiers. */
function tierFor(row: number, col: number) {
  const seed = hashContributionCell(row, col) % 20;
  if (seed < 6) return 0;
  if (seed < 11) return 1;
  if (seed < 15) return 2;
  if (seed < 18) return 3;
  if (seed < 19) return 4;
  return 5;
}

/** The heatmap: `columns × 7` cells, column-major, dated through 2026. */
export function contributionCells(columns: number, year = 2026): ContributionCell[] {
  return Array.from({ length: columns * 7 }, (_, index) => {
    const col = Math.floor(index / 7);
    const row = index % 7;
    const tier = tierFor(row, col);
    const [lo, hi] = COUNT_BANDS[tier]!;
    const count = hi === 0 ? 0 : lo + ((hashContributionCell(row, col) >>> 3) % (hi - lo + 1));
    const dayOfYear = Math.round((index / (columns * 7 - 1)) * 364);
    const d = new Date(Date.UTC(year, 0, 1 + dayOfYear));
    return { count, tier: tier as ContributionCell['tier'], date: `${MONTH_SHORT[d.getUTCMonth()]} ${d.getUTCDate()}` };
  });
}

export const CELLS = contributionCells(38);

// ---------------------------------------------------------------------------
//  Agents
// ---------------------------------------------------------------------------

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** December's bar heights straight from Figma, px in a 206 track. */
const DECEMBER_BARS = [
  73, 141, 118, 0, 118, 18, 0, 0, 0, 95,
  0, 158, 78, 45, 0, 45, 135, 88, 0, 0,
  107, 21, 45, 105, 87, 66, 19, 128, 98, 34,
];

function hash(a: number, b: number) {
  let h = a * 374761393 + b * 668265263;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return (h ^ (h >>> 16)) >>> 0;
}

function barsFor(month: number): number[] {
  if (month === 11) return DECEMBER_BARS;
  return Array.from({ length: 30 }, (_, day) => {
    const seed = hash(month + 1, day + 7);
    if (seed % 4 === 0) return 0;
    return 18 + (seed % (158 - 18));
  });
}

/**
 * A month of agent runs. Bar heights read ~5px per agent, so a day's value
 * is its height ÷ 5 — the tallest bar of every month stands for 158px, the
 * hovered count rounds.
 */
export function agentsFor(month: number): { data: AgentsPoint[]; headline: number; max: number } {
  const bars = barsFor(month);
  return {
    data: bars.map((h, day) => ({ label: `${MONTH_NAMES[month]!.slice(0, 3)} ${day + 1}`, value: h / 5 })),
    headline: month === 11 ? 32 : 22 + (hash(month + 3, 17) % 27),
    max: 158 / 5,
  };
}

// ---------------------------------------------------------------------------
//  Tokens — Jun 14 → Jul 13
// ---------------------------------------------------------------------------

const TOKENS = [
  34.2, 28.6, 6.1, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 31.4, 4.8, 2.2, 1.1, 5.6, 1.4, 0.8, 42.1,
  51.8, 48.3, 33.6, 9.2, 3.4, 18.7, 25.3, 37.9, 30.2, 24.6,
];

export const TOKENS_SERIES: TokensPoint[] = TOKENS.map((value, day) => {
  const d = new Date(Date.UTC(2026, 5, 14 + day));
  return { label: `${MONTH_SHORT[d.getUTCMonth()]} ${d.getUTCDate()}`, value };
});

/** The resting headline, per the design. */
export const TOKENS_TOTAL = 667.7;
