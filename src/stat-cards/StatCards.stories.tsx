import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { RiBox3Line } from '../icons/remix/RiBox3Line';
import { RiChatSmile2Line } from '../icons/remix/RiChatSmile2Line';
import { RiCoinsFill } from '../icons/remix/RiCoinsFill';
import { RiGroupFill } from '../icons/remix/RiGroupFill';
import { RiGroupLine } from '../icons/remix/RiGroupLine';
import { RiRefund2Fill } from '../icons/remix/RiRefund2Fill';
import { RiShoppingBasket2Fill } from '../icons/remix/RiShoppingBasket2Fill';
import { RiShoppingBasketLine } from '../icons/remix/RiShoppingBasketLine';
import { StatCard, StatCards } from './index';
import type { StatCardsItem } from './types';

const meta: Meta<typeof StatCards> = {
  title: 'Blocks/Stat Cards',
  component: StatCards,
};

export default meta;

type Story = StoryObj<typeof StatCards>;

/** Demo metrics for the plain row. */
const PLAIN_STATS: StatCardsItem[] = [
  { icon: RiGroupLine, label: 'Customers', value: '14,592', delta: '+5.3%', deltaColor: 'lime' },
  { icon: RiBox3Line, label: 'Unit sold', value: '385', delta: '-2.1%', deltaColor: 'rose' },
  { icon: RiShoppingBasketLine, label: 'Orders', value: '1,394', delta: '0.00%', deltaColor: 'neutral' },
  { icon: RiChatSmile2Line, label: 'Support tickets', value: '708', delta: '+12.8%', deltaColor: 'lime' },
];

/** Demo metrics for the footer row. */
const FOOTER_STATS: StatCardsItem[] = [
  {
    icon: RiCoinsFill,
    label: 'Total revenue',
    value: '$152,313.92',
    delta: '16%',
    deltaColor: 'lime',
    tone: 'blue',
    hint: 'Gross revenue across every channel this month, before refunds. The change is against the same days last month.',
  },
  {
    icon: RiShoppingBasket2Fill,
    label: 'Total orders',
    value: '25,162',
    delta: '20%',
    deltaColor: 'lime',
    tone: 'orange',
    hint: 'Checkouts completed this month, repeat purchases included. The change is against the same days last month.',
  },
  {
    icon: RiGroupFill,
    label: 'New customers',
    value: '3,847',
    delta: '8.1%',
    deltaColor: 'lime',
    tone: 'purple',
    hint: 'People who bought for the first time this month. The change is against the same days last month.',
  },
  {
    icon: RiRefund2Fill,
    label: 'Refunds',
    value: '$4,209.44',
    delta: '2.4%',
    deltaColor: 'rose',
    tone: 'pink',
    hint: 'Value of orders refunded this month. Down is good here, so the change reads in red when refunds rise.',
  },
];

const frame = { padding: 40, width: '100%' as const, maxWidth: 1200 };

/** The compact dashboard row: icon tile, label, value and a delta chip. */
export const Plain: Story = {
  render: () => (
    <View style={frame}>
      <StatCards testID="stat-cards" stats={PLAIN_STATS} />
    </View>
  ),
};

/** Gradient tiles, info tooltips, display-size values and the footer band. */
export const Footer: Story = {
  render: () => (
    <View style={frame}>
      <StatCards testID="stat-cards" variant="footer" stats={FOOTER_STATS} />
    </View>
  ),
};

/** `columns={2}` keeps the grid two-up at every width (split layouts, docs previews). */
export const TwoColumns: Story = {
  render: () => (
    <View style={[frame, { maxWidth: 720 }]}>
      <StatCards stats={PLAIN_STATS} columns={2} />
    </View>
  ),
};

/** `count` renders the first N; a short last row keeps the grid's columns. */
export const Count: Story = {
  render: () => (
    <View style={frame}>
      <StatCards variant="footer" stats={FOOTER_STATS} count={3} columns={2} />
    </View>
  ),
};

/** Every footer tone, the neutral delta, a custom caption, and no hint. */
export const Tones: Story = {
  render: () => (
    <View style={[frame, { gap: 16 }]}>
      <StatCards
        variant="footer"
        columns={4}
        stats={(['blue', 'orange', 'purple', 'pink', 'sky', 'emerald'] as const).map((tone, i) => ({
          icon: RiCoinsFill,
          label: tone,
          value: '1,024',
          delta: i % 3 === 0 ? '0.0%' : i % 3 === 1 ? '4.2%' : '1.3%',
          deltaColor: i % 3 === 0 ? 'neutral' : i % 3 === 1 ? 'lime' : 'rose',
          tone,
          caption: i === 5 ? 'From last quarter' : undefined,
        }))}
      />
      <View style={{ width: 280 }}>
        <StatCard stat={PLAIN_STATS[0]!} />
      </View>
    </View>
  ),
};
