import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { RiComputerLine, RiSmartphoneLine, RiTabletLine } from '../icons/remix';
import { BarListCard, type BarListTab } from './BarListCard';

const meta: Meta<typeof BarListCard> = {
  title: 'Charts/Bar List',
  component: BarListCard,
};

export default meta;

type Story = StoryObj<typeof BarListCard>;

// Demo data.
const TABS: BarListTab[] = [
  {
    id: 'devices',
    label: 'Devices',
    items: [
      { label: 'Desktop', value: 5980, icon: RiComputerLine },
      { label: 'Mobile', value: 3020, icon: RiSmartphoneLine },
      { label: 'Tablet', value: 820, icon: RiTabletLine },
    ],
  },
  {
    id: 'browsers',
    label: 'Browsers',
    items: [
      { label: 'Chrome', value: 5210 },
      { label: 'Safari', value: 2640 },
      { label: 'Firefox', value: 860 },
      { label: 'Edge', value: 610 },
      { label: 'Samsung Internet', value: 240 },
      { label: 'Opera', value: 160 },
      { label: 'Brave', value: 100 },
    ],
  },
  {
    id: 'os',
    label: 'Operating systems',
    items: [
      { label: 'Mac', value: 4320 },
      { label: 'iOS', value: 2550 },
      { label: 'Windows', value: 1670 },
      { label: 'Android', value: 880 },
      { label: 'GNU/Linux', value: 390 },
      { label: 'ChromeOS', value: 10 },
    ],
  },
  {
    id: 'screens',
    label: 'Screen sizes',
    items: [
      { label: '1920 × 1080', value: 3140 },
      { label: '1440 × 900', value: 2260 },
      { label: '390 × 844', value: 1980 },
      { label: '1536 × 864', value: 1120 },
      { label: '430 × 932', value: 760 },
      { label: '2560 × 1440', value: 560 },
    ],
  },
];

const PAGES = [
  { label: '/', value: 5210 },
  { label: '/pricing', value: 2640 },
  { label: '/docs', value: 860 },
  { label: '/blog', value: 10 },
];

const Frame = ({ children, width = 480 }: { children: React.ReactNode; width?: number }) => (
  <View style={{ padding: 40, gap: 24, width: width + 80 }}>{children}</View>
);

/** Tabbed lists; the strip scrolls and fades its hidden edge when the tabs outgrow the card. */
export const Tabbed: Story = {
  render: () => (
    <Frame>
      <BarListCard testID="barlist" tabs={TABS} />
    </Frame>
  ),
};

/** A long list: past `limit` rows it fades out behind the "more" pill, which grows the rest in. */
export const Overflow: Story = {
  render: () => (
    <Frame>
      <BarListCard testID="barlist" tabs={TABS} defaultTab="browsers" />
    </Frame>
  ),
};

/** One list with a title, raw values instead of shares. */
export const SingleList: Story = {
  render: () => (
    <Frame>
      <BarListCard testID="barlist" title="Top pages" metricLabel="Views" metric="value" items={PAGES} />
    </Frame>
  ),
};

/** The single-ink look. */
export const Mono: Story = {
  render: () => (
    <Frame>
      <BarListCard testID="barlist" tabs={TABS} mono defaultTab="browsers" />
    </Frame>
  ),
};

/** Per-row colours and a custom card tint; `<0.5%` for a sliver. */
export const Colors: Story = {
  render: () => (
    <Frame>
      <BarListCard
        testID="barlist"
        title="Referrers"
        metricLabel="Sessions"
        color="#f97316"
        limit={10}
        items={[
          { label: 'google.com', value: 8120 },
          { label: 'github.com', value: 2310, color: '#8b5cf6' },
          { label: 'news.ycombinator.com', value: 940 },
          { label: 'x.com', value: 12 },
        ]}
      />
    </Frame>
  ),
};

/** A phone-width card: the tab strip scrolls under the caption. */
export const Narrow: Story = {
  render: () => (
    <Frame width={320}>
      <BarListCard tabs={TABS} metricLabel="Sessions" />
    </Frame>
  ),
};
