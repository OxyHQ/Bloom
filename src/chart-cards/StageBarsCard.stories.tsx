import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { RiBuilding2Line, RiEyeLine, RiFlashlightLine, RiGroupLine, RiUserAddLine, RiVipCrownLine } from '../icons/remix';
import { StageBarsCard, type StageBar, type StageBarsRange } from './StageBarsCard';

const meta: Meta<typeof StageBarsCard> = {
  title: 'Charts/Stage Bars',
  component: StageBarsCard,
};

export default meta;

type Story = StoryObj<typeof StageBarsCard>;

// Demo data.
const STAGES: StageBar[] = [
  { label: 'Visits', value: 4820, icon: RiEyeLine },
  { label: 'Sign-up', value: 3260, icon: RiUserAddLine },
  { label: 'Active', value: 2010, icon: RiFlashlightLine },
  { label: 'Pro', value: 1160, icon: RiVipCrownLine },
  { label: 'Team', value: 540, icon: RiGroupLine },
  { label: 'Enterprise', value: 180, icon: RiBuilding2Line },
];

const stagesOf = (values: number[]): StageBar[] => STAGES.map((s, i) => ({ ...s, value: values[i]! }));

const RANGES: StageBarsRange[] = [
  { id: '7d', label: 'Last 7 days', stages: stagesOf([1180, 790, 460, 250, 120, 40]), delta: 0.024 },
  { id: '30d', label: 'Last 30 days', stages: STAGES, delta: 0.061 },
  { id: '90d', label: 'Last 90 days', stages: stagesOf([13900, 9410, 5720, 3300, 1520, 510]), delta: -0.012 },
];

const Frame = ({ children, width = 480 }: { children: React.ReactNode; width?: number }) => (
  <View style={{ padding: 40, gap: 24, width: width + 80 }}>{children}</View>
);

/** Default look: palette pills with icons, a period dropdown, the tile grid. */
export const Default: Story = {
  render: () => (
    <Frame>
      <StageBarsCard testID="stage" ranges={RANGES} />
    </Frame>
  ),
};

/** Single ink, no icons, a static pill and a flat delta. */
export const Mono: Story = {
  render: () => (
    <Frame>
      <StageBarsCard testID="stage" mono showIcons={false} stages={STAGES} range="Last 30 days" delta={0} />
    </Frame>
  ),
};

/** "Active" hovered (controlled): header, darker pill, dimmed rows and tiles. */
export const Hovered: Story = {
  render: () => (
    <Frame>
      <StageBarsCard testID="stage" ranges={RANGES} activeIndex={2} />
      <StageBarsCard mono stages={STAGES} range="Last 30 days" activeIndex={2} />
    </Frame>
  ),
};

/** Three stages with custom colours: the card keeps its 329px floor and centres the rows. */
export const FewStages: Story = {
  render: () => (
    <Frame>
      <StageBarsCard
        title="Checkout"
        delta={-0.034}
        range="This week"
        stages={[
          { label: 'Cart', value: 920, color: '#f97316' },
          { label: 'Payment', value: 610 },
          { label: 'Paid', value: 402 },
        ]}
      />
    </Frame>
  ),
};

/** A phone-width card. */
export const Narrow: Story = {
  render: () => (
    <Frame width={320}>
      <StageBarsCard ranges={RANGES} />
    </Frame>
  ),
};
