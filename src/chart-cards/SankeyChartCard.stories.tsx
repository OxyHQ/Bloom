import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { SankeyChartCard } from './SankeyChartCard';
import type { SankeyLinkDatum, SankeyNodeDatum, SankeyRange } from './SankeyChartCard';

const meta: Meta<typeof SankeyChartCard> = {
  title: 'Charts/Sankey Chart',
  component: SankeyChartCard,
};

export default meta;

type Story = StoryObj<typeof SankeyChartCard>;

// Demo data: a week of tracked time, category → app.
const NODES: SankeyNodeDatum[] = [
  // Sources carry the colour; sinks stay neutral so the ribbons paint them.
  { name: 'Focus', hue: 7 },
  { name: 'Meetings', hue: 5 },
  { name: 'Breaks', hue: 8 },
  { name: 'Admin', hue: 6 },
  { name: 'Learning', hue: 3 },
  { name: 'Browsing', color: 'neutral' },
  { name: 'Writing', color: 'neutral' },
  { name: 'Messaging', color: 'neutral' },
  { name: 'Productivity', color: 'neutral' },
  { name: 'Email', color: 'neutral' },
  { name: 'Video calls', color: 'neutral' },
  { name: 'Everything else', color: 'neutral' },
];

const LINKS: SankeyLinkDatum[] = [
  { source: 'Focus', target: 'Browsing', value: 10.4 },
  { source: 'Focus', target: 'Writing', value: 8.2 },
  { source: 'Focus', target: 'Messaging', value: 6.1 },
  { source: 'Focus', target: 'Productivity', value: 5.0 },
  { source: 'Focus', target: 'Email', value: 2.3 },
  { source: 'Meetings', target: 'Video calls', value: 9.6 },
  { source: 'Meetings', target: 'Everything else', value: 3.8 },
  { source: 'Meetings', target: 'Writing', value: 3.0 },
  { source: 'Meetings', target: 'Email', value: 1.6 },
  { source: 'Breaks', target: 'Everything else', value: 5.6 },
  { source: 'Breaks', target: 'Browsing', value: 3.6 },
  { source: 'Breaks', target: 'Video calls', value: 2.8 },
  { source: 'Admin', target: 'Productivity', value: 5.2 },
  { source: 'Admin', target: 'Writing', value: 4.0 },
  { source: 'Admin', target: 'Messaging', value: 3.2 },
  { source: 'Admin', target: 'Everything else', value: 1.6 },
  { source: 'Learning', target: 'Browsing', value: 4.6 },
  { source: 'Learning', target: 'Email', value: 3.4 },
  { source: 'Learning', target: 'Messaging', value: 2.0 },
];

const linksOf = (values: number[]): SankeyLinkDatum[] => LINKS.map((l, i) => ({ ...l, value: values[i]! }));

const RANGES: SankeyRange[] = [
  { id: 'this-week', label: 'This week', links: LINKS },
  {
    id: 'last-week',
    label: 'Last week',
    links: linksOf([8.6, 9.4, 4.8, 6.2, 3.1, 7.2, 4.4, 2.6, 1.8, 5.1, 4.9, 2.2, 4.8, 3.6, 3.3, 2.5, 3.9, 4.6, 1.5]),
  },
  {
    id: 'this-month',
    label: 'This month',
    links: linksOf([44.8, 36.2, 24.5, 22.6, 9.9, 38.4, 14.2, 12.6, 7.4, 28.8, 15.7, 10.9, 27.2, 17.6, 12.1, 6.5, 19.4, 14.8, 8.3]),
  },
];

const Frame = ({ children, width = 480 }: { children: React.ReactNode; width?: number }) => (
  <View style={{ padding: 40, gap: 24, width: width + 80 }}>{children}</View>
);

/** The card: coloured sources, neutral sinks, a period dropdown, column captions. */
export const Default: Story = {
  render: () => (
    <Frame>
      <SankeyChartCard testID="sankey" nodes={NODES} ranges={RANGES} axisLabels={['Category', 'App']} />
    </Frame>
  ),
};

/** Ribbons take their sink's colour instead, a static pill and a delta chip. */
export const TargetColoured: Story = {
  render: () => (
    <Frame>
      <SankeyChartCard
        nodes={NODES.map((n, i) => (i < 5 ? { name: n.name, color: 'neutral' } : { name: n.name }))}
        links={LINKS}
        linkColor="target"
        range="This week"
        delta={0.042}
      />
    </Frame>
  ),
};

/** Hovered node (controlled): its ribbons lift, unconnected nodes fade, the header swaps. */
export const HoveredNode: Story = {
  render: () => (
    <Frame>
      <SankeyChartCard nodes={NODES} ranges={RANGES} activeItem={{ type: 'node', index: 1 }} delta={0.12} />
    </Frame>
  ),
};

/** Hovered link (controlled): the one ribbon and its two ends. */
export const HoveredLink: Story = {
  render: () => (
    <Frame>
      <SankeyChartCard nodes={NODES} ranges={RANGES} activeItem={{ type: 'link', index: 5 }} />
    </Frame>
  ),
};

/** Three columns: pass-through nodes stay square on both sides; palette colours by index; small nodes drop the value line. */
export const ThreeColumns: Story = {
  render: () => (
    <Frame>
      <SankeyChartCard
        title="Signups"
        format={(v) => v.toLocaleString('en-US')}
        range="Q3"
        height={400}
        nodes={[
          { name: 'Organic' },
          { name: 'Paid' },
          { name: 'Referral' },
          { name: 'Trial' },
          { name: 'Direct', color: 'neutral' },
          { name: 'Paying', color: 'neutral' },
          { name: 'Churned', color: 'neutral' },
        ]}
        links={[
          { source: 0, target: 3, value: 820 },
          { source: 1, target: 3, value: 540 },
          { source: 2, target: 3, value: 90 },
          { source: 0, target: 4, value: 260 },
          { source: 3, target: 5, value: 910 },
          { source: 3, target: 6, value: 540 },
          { source: 4, target: 5, value: 260 },
        ]}
      />
    </Frame>
  ),
};
