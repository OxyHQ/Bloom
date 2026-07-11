import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { ProfileCard } from './index';
import type { AvatarGroupItem } from '../avatar-group';
import { BloomThemeProvider } from '../theme';
import { Star_Filled_Corner0_Rounded as StarIcon } from '../icons/Star';

/** Small colored square as a data-URI so stories are self-contained. */
function token(color: string): string {
  return `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40'><rect width='40' height='40' rx='20' fill='${color}'/></svg>`;
}

const TOP_TOKENS: AvatarGroupItem[] = [
  { id: 'a', uri: token('gold') },
  { id: 'b', uri: token('tomato') },
  { id: 'c', uri: token('mediumseagreen') },
  { id: 'd', uri: token('royalblue') },
  { id: 'e', uri: token('orchid') },
];

const HERO = token('slateblue');

function Badge() {
  return (
    <View
      style={{
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: 'gold',
        borderWidth: 2,
        borderColor: '#111',
      }}
    />
  );
}

const trophy = <StarIcon size="sm" style={{ color: '#F5B301' }} />;

function Gallery() {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 20, maxWidth: 780 }}>
      {/* wallet — dot-grid meter */}
      <ProfileCard
        variant="wallet"
        avatar={{ source: HERO, badge: <Badge />, name: 'Wallet' }}
        value="$167,395"
        subtitle="*5bF5"
        headlineIcon={trophy}
        metric={{ kind: 'dots', label: 'Token diversity', filled: 34, total: 50 }}
        footer={{ label: 'Top tokens', items: TOP_TOKENS }}
      />

      {/* wallet — progress + trophy */}
      <ProfileCard
        variant="wallet"
        avatar={{ source: HERO, badge: <Badge />, name: 'Wallet' }}
        value="$167,395"
        subtitle="*5bF5"
        metric={{
          kind: 'progress',
          label: 'TX count 24h',
          value: 192,
          max: 350,
          minLabel: '32',
          maxLabel: '350',
          icon: trophy,
        }}
        footer={{ label: 'Top tokens', items: TOP_TOKENS }}
      />

      {/* wallet — split bar % */}
      <ProfileCard
        variant="wallet"
        avatar={{ source: HERO, badge: <Badge />, name: 'Wallet' }}
        value="$167,395"
        subtitle="*5bF5"
        metric={{
          kind: 'split',
          label: 'Net flow 24h',
          percent: 62,
          leftValue: '+$4,210',
          rightValue: '-$2,560',
        }}
        footer={{ label: 'Top tokens', items: TOP_TOKENS }}
      />

      {/* social */}
      <ProfileCard
        variant="social"
        avatar={{ source: HERO, badge: <Badge />, name: 'Ada' }}
        value="12,480"
        subtitle="@ada"
        metric={{ kind: 'progress', label: 'Weekly goal', value: 5, max: 7 }}
        footer={{ label: 'Mutuals', items: TOP_TOKENS }}
      />

      {/* shopping */}
      <ProfileCard
        variant="shopping"
        avatar={{ source: HERO, name: 'Store' }}
        value="48 orders"
        subtitle="This month"
        metric={{ kind: 'dots', label: 'Categories', filled: 6, total: 12 }}
        footer={{ label: 'Recent buyers', items: TOP_TOKENS }}
      />

      {/* stat (default) */}
      <ProfileCard
        variant="stat"
        avatar={{ source: HERO, name: 'Score' }}
        value="820"
        subtitle="Trust score"
        headlineIcon={trophy}
        metric={{
          kind: 'split',
          label: 'Positive vs negative',
          percent: 88,
          leftValue: '880',
          rightValue: '60',
        }}
      />
    </View>
  );
}

function WideGallery() {
  return (
    <View style={{ gap: 16, width: 420 }}>
      <ProfileCard
        layout="wide"
        variant="wallet"
        avatar={{ source: HERO, badge: <Badge />, name: 'Wallet' }}
        value="$167,395"
        subtitle="*5bF5"
        headlineIcon={trophy}
        metric={{ kind: 'dots', label: 'Token diversity', filled: 34, total: 50 }}
        footer={{ label: 'Top tokens', items: TOP_TOKENS }}
      />
      <ProfileCard
        layout="wide"
        variant="social"
        avatar={{ source: HERO, badge: <Badge />, name: 'Ada' }}
        value="12,480"
        subtitle="@ada"
        metric={{
          kind: 'progress',
          label: 'TX count 24h',
          value: 192,
          max: 350,
          minLabel: '32',
          maxLabel: '350',
          icon: trophy,
        }}
        footer={{ label: 'Mutuals', items: TOP_TOKENS }}
      />
    </View>
  );
}

const meta: Meta<typeof ProfileCard> = {
  title: 'Data Display/ProfileCard',
  component: ProfileCard,
};

export default meta;

type Story = StoryObj<typeof ProfileCard>;

export const WidgetLight: Story = {
  render: () => (
    <BloomThemeProvider mode="light">
      <View style={{ padding: 24 }}>
        <Gallery />
      </View>
    </BloomThemeProvider>
  ),
};

export const WidgetDark: Story = {
  render: () => (
    <BloomThemeProvider mode="dark">
      <View style={{ padding: 24, backgroundColor: '#000' }}>
        <Gallery />
      </View>
    </BloomThemeProvider>
  ),
};

export const WideLight: Story = {
  render: () => (
    <BloomThemeProvider mode="light">
      <View style={{ padding: 24 }}>
        <WideGallery />
      </View>
    </BloomThemeProvider>
  ),
};

export const WideDark: Story = {
  render: () => (
    <BloomThemeProvider mode="dark">
      <View style={{ padding: 24, backgroundColor: '#000' }}>
        <WideGallery />
      </View>
    </BloomThemeProvider>
  ),
};
