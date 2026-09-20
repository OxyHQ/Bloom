import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { FunnelChartCard, type FunnelRange, type FunnelStage } from './FunnelChartCard';

const meta: Meta<typeof FunnelChartCard> = {
  argTypes: {
    "shape": { control: 'select', options: ["curved","sharp"] },
    "mono": { control: 'boolean' },
    "title": { control: 'text' },
    "headline": { control: 'number' },
    "delta": { control: 'number' },
    "range": { control: 'text' },
    "defaultRange": { control: 'text' },
    "activeIndex": { control: 'number' }
  },
  title: 'Charts/Funnel Chart',
  component: FunnelChartCard,
};

export default meta;

type Story = StoryObj<typeof FunnelChartCard>;

// The demo data.
const STAGES: FunnelStage[] = [
  { label: 'Link opened', value: 197 },
  { label: 'Started', value: 110 },
  { label: 'Completed', value: 77 },
  { label: 'Converted', value: 38 },
];

const stagesOf = (values: number[]): FunnelStage[] => STAGES.map((s, i) => ({ label: s.label, value: values[i]! }));

const RANGES: FunnelRange[] = [
  { id: '7d', label: 'Last 7 days', stages: STAGES, delta: 0.052 },
  { id: '30d', label: 'Last 30 days', stages: stagesOf([842, 463, 301, 152]), delta: 0.034 },
  { id: '90d', label: 'Last 90 days', stages: stagesOf([2510, 1380, 902, 455]), delta: -0.018 },
];

const Frame = ({ children, width = 480 }: { children: React.ReactNode; width?: number }) => (
  <View style={{ maxWidth: '100%', gap: 24, width }}>{children}</View>
);

/** Default look: S-curve bands with layered edges, a period dropdown, one tile per stage. */
export const Curved: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Frame>
      <FunnelChartCard testID="funnel" ranges={RANGES} />
    </Frame>
  ),
};

/** Straight trapezoids over a faint backing band. */
export const Sharp: Story = {
  args: { shape: "sharp" },
  parameters: { controls: { include: ["shape","mono","title","headline","delta","range","defaultRange","activeIndex"] } },
  render: (args) => (
    <Frame>
      <FunnelChartCard {...args} testID="funnel"  ranges={RANGES} />
    </Frame>
  ),
};

/** Single ink, a static pill and a falling delta. */
export const Mono: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Frame>
      <FunnelChartCard testID="funnel" mono stages={STAGES} range="Last 30 days" delta={-0.02} />
      <FunnelChartCard mono shape="sharp" stages={STAGES} range="Last 30 days" delta={-0.02} />
    </Frame>
  ),
};

/** "Started" hovered (controlled): its band darkens, every other column fades. */
export const Hovered: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Frame>
      <FunnelChartCard ranges={RANGES} activeIndex={1} />
      <FunnelChartCard shape="sharp" ranges={RANGES} activeIndex={1} />
    </Frame>
  ),
};

/** Six stages in a narrow card: pills that do not fit their column are dropped, tiles go two per row below `sm`. */
export const ManyStages: Story = {
  args: { title: "Acquisition funnel", range: "Q3", delta: 0.11 },
  parameters: { controls: { include: ["title","range","delta","shape","mono","headline","defaultRange","activeIndex"] } },
  render: (args) => (
    <Frame width={360}>
      <FunnelChartCard {...args}



        format={(v) => (v >= 1000 ? `${Math.round(v / 100) / 10}K` : String(v))}
        stages={[
          { label: 'Impressions', value: 48200 },
          { label: 'Clicks', value: 9100 },
          { label: 'Visits', value: 7400 },
          { label: 'Sign-ups', value: 1800, color: '#f97316' },
          { label: 'Trials', value: 640 },
          { label: 'Paid', value: 210 },
        ]}
      />
    </Frame>
  ),
};
