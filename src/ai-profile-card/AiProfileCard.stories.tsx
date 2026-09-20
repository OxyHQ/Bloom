import React, { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from '../button';
import { hashContributionCell, type ContributionCell } from '../chart-cards/contributions-cells';
import { RiEditBoxLine, RiShare2Line } from '../icons/remix';
import { AiProfileCard } from './index';
import type { AiProfileCardStat } from './types';

const meta: Meta<typeof AiProfileCard> = {
  argTypes: {
    "name": { control: 'text' },
    "handle": { control: 'text' },
    "badge": { control: 'text' },
    "initials": { control: 'text' },
    "contributionsLabel": { control: 'text' },
    "contributions": { control: 'number' },
    "countUpDuration": { control: 'number' },
    "delta": { control: 'text' },
    "activityLabel": { control: 'text' },
    "period": { control: 'text' },
    "defaultPeriod": { control: 'text' },
    "columns": { control: 'number' },
    "color": { control: 'text' },
    "animateIn": { control: 'boolean' },
    "activeCell": { control: 'number' }
  },
  title: 'Blocks/AI Profile Card',
  component: AiProfileCard,
};

export default meta;

type Story = StoryObj<typeof AiProfileCard>;

// Demo data: the four stat tiles and the hash-scattered heatmap, 38 columns
// dated through the year.
const STATS: AiProfileCardStat[] = [
  { value: '9B', label: 'Lifetime tokens' },
  { value: '562.7M', label: 'Peak tokens' },
  { value: '12h 54m', label: 'Longest task' },
  { value: '62 days', label: 'Top streak' },
];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const BANDS: [number, number][] = [[0, 0], [1, 4], [5, 9], [10, 15], [16, 24], [25, 40]];

function tierFor(row: number, col: number) {
  const seed = hashContributionCell(row, col) % 20;
  return seed < 6 ? 0 : seed < 11 ? 1 : seed < 15 ? 2 : seed < 18 ? 3 : seed < 19 ? 4 : 5;
}

function cells(columns: number): ContributionCell[] {
  return Array.from({ length: columns * 7 }, (_, index) => {
    const col = Math.floor(index / 7);
    const row = index % 7;
    const tier = tierFor(row, col);
    const [lo, hi] = BANDS[tier]!;
    const count = hi === 0 ? 0 : lo + ((hashContributionCell(row, col) >>> 3) % (hi - lo + 1));
    const d = new Date(Date.UTC(2026, 0, 1 + Math.round((index / (columns * 7 - 1)) * 364)));
    return { count, tier: tier as ContributionCell['tier'], date: `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}` };
  });
}

const CELLS = cells(38);
const COVER = 'https://images.unsplash.com/photo-1614728263952-84ea256f9679?w=1400&h=340&fit=crop';

const Frame = ({ children, width = 680 }: { children: React.ReactNode; width?: number }) => (
  <View style={{ maxWidth: '100%', padding: 40, width: width + 80 }}>{children}</View>
);

const actions = (
  <>
    <Button size="sm" leadingIcon={RiShare2Line} appearance="outline" tone="neutral">
      Share
    </Button>
    <Button size="sm" leadingIcon={RiEditBoxLine} appearance="outline" tone="neutral">
      Edit
    </Button>
  </>
);

/** Cover, overlapping avatar, count-up headline, tiles and the heatmap popping in. */
export const Default: Story = {
  args: { name: "Maya Collins", handle: "@maya", badge: "PRO", contributions: 7462, delta: "+14.8%" },
  parameters: { controls: { include: ["name","handle","badge","contributions","delta","initials","contributionsLabel","countUpDuration","activityLabel","defaultPeriod","columns","color","animateIn","activeCell"] } },
  render: function Render(args) {
    const [period, setPeriod] = useState('weekly');
    return (
      <Frame>
        <AiProfileCard {...args}
          testID="profile"



          coverSource={COVER}
          actions={actions}


          stats={STATS}
          cells={CELLS}
          period={period}
          onPeriodChange={setPeriod}
        />
      </Frame>
    );
  },
};

/** No photo (the tertiary band), no actions, badge or chip; the number shows at once; no pop-in. */
export const Minimal: Story = {
  args: { name: "Maya Collins", contributions: 958, countUpDuration: 0, animateIn: false },
  parameters: { controls: { include: ["name","contributions","countUpDuration","animateIn","handle","badge","initials","contributionsLabel","delta","activityLabel","period","defaultPeriod","columns","color","activeCell"] } },
  render: (args) => (
    <Frame>
      <AiProfileCard {...args}




        stats={STATS.slice(0, 2)}
        cells={CELLS}
        periods={[]}
      />
    </Frame>
  ),
};

/** Below 640 the tiles go two by two and the heatmap scrolls sideways with 13px cells (resize the viewport). */
export const Phone: Story = {
  args: { name: "Maya Collins", handle: "@maya", badge: "PRO", contributions: 7462, delta: "+14.8%", color: "#10b981" },
  parameters: { controls: { include: ["name","handle","badge","contributions","delta","color","initials","contributionsLabel","countUpDuration","activityLabel","period","defaultPeriod","columns","animateIn","activeCell"] } },
  render: (args) => (
    <Frame width={358}>
      <AiProfileCard {...args}



        coverSource={COVER}
        actions={actions}


        stats={STATS}
        cells={CELLS}

      />
    </Frame>
  ),
};
