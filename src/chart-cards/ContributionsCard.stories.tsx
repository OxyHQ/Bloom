import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { ContributionsCard, ContributionsGrid } from './ContributionsCard';
import type { ContributionsPeriod, ContributionsStat } from './ContributionsCard';
import { contributionCellsFromDays, hashContributionCell, type ContributionCell } from './contributions-cells';

const meta: Meta<typeof ContributionsCard> = {
  title: 'Charts/Contributions Card',
  component: ContributionsCard,
};

export default meta;

type Story = StoryObj<typeof ContributionsCard>;

// Demo data: hash-scattered tiers, a plausible count per tier, each cell
// dated column-major through the year.
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
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

function demoCells(columns: number, year = 2026): ContributionCell[] {
  return Array.from({ length: columns * 7 }, (_, index) => {
    const col = Math.floor(index / 7);
    const row = index % 7;
    const tier = tierFor(row, col);
    const [lo, hi] = COUNT_BANDS[tier]!;
    const count = hi === 0 ? 0 : lo + ((hashContributionCell(row, col) >>> 3) % (hi - lo + 1));
    const dayOfYear = Math.round((index / (columns * 7 - 1)) * 364);
    const d = new Date(Date.UTC(year, 0, 1 + dayOfYear));
    return { count, tier, date: `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}` };
  });
}

const CELLS = demoCells(37);

const STATS: ContributionsStat[] = [
  { value: '9B', label: 'Lifetime tokens' },
  { value: '562.7M', label: 'Peak tokens' },
  { value: '12h 54m', label: 'Longest task' },
  { value: '62 days', label: 'Top streak' },
];

const Frame = ({ children, width = 720 }: { children: React.ReactNode; width?: number }) => (
  <View style={{ padding: 40, gap: 24, width: width + 80 }}>{children}</View>
);

/** The card: header + chip, four stat cards, the Weekly / Monthly / Yearly control, the year grid. */
export const Default: Story = {
  render: () => (
    <Frame>
      <ContributionsCard testID="contrib" total={958} delta={0.148} stats={STATS} cells={CELLS} />
    </Frame>
  ),
};

/** A hovered day (controlled): the tooltip above the cell. */
export const Hovered: Story = {
  render: () => (
    <Frame>
      <View style={{ height: 40 }} />
      <ContributionsCard total={958} delta={0.148} stats={STATS} cells={CELLS} activeCell={3 * 7 + 2} />
    </Frame>
  ),
};

/** Cells pop in on mount in a scattered order (reload the story to replay). */
export const AnimateIn: Story = {
  render: () => (
    <Frame>
      <ContributionsCard total={958} delta={0.148} stats={STATS} cells={CELLS} animateIn />
    </Frame>
  ),
};

/** Periods that carry their own data; a custom ramp colour and a falling delta. */
export const Periods: Story = {
  render: () => {
    const periods: ContributionsPeriod[] = [
      { id: 'weekly', label: 'Weekly', total: 958, delta: 0.148 },
      { id: 'monthly', label: 'Monthly', cells: demoCells(37, 2025).map((c) => ({ ...c, tier: undefined, count: c.count * 2 })), total: 4120, delta: -0.032 },
      { id: 'yearly', label: 'Yearly', total: 11870, delta: 0 },
    ];
    return (
      <Frame>
        <ContributionsCard stats={STATS} cells={CELLS} periods={periods} color="#10b981" />
      </Frame>
    );
  },
};

/** Real per-day data folded into the grid with `contributionCellsFromDays`, no stats. */
export const FromDays: Story = {
  render: () => {
    const days = Array.from({ length: 365 }, (_, i) => {
      const d = new Date(Date.UTC(2025, 0, 1 + i));
      const iso = d.toISOString().slice(0, 10);
      const weekday = d.getUTCDay();
      return { date: iso, count: weekday === 0 || weekday === 6 ? (i % 3) : ((i * 7) % 11) };
    });
    return (
      <Frame>
        <ContributionsCard title="Commits in 2025" cells={contributionCellsFromDays(days, 2025)} delta={0.021} />
      </Frame>
    );
  },
};

/** The bare grid at 38 columns (the AI profile). */
export const Grid: Story = {
  render: () => (
    <Frame width={600}>
      <ContributionsGrid testID="grid" cells={demoCells(38)} columns={38} />
    </Frame>
  ),
};
