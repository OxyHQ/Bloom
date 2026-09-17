import React from 'react';
import { Image, View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { RiHome4Line } from '../icons/remix';
import type { Offering } from '../listing-card/types';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { OfferingBadge } from './OfferingBadge';

const meta: Meta<typeof OfferingBadge> = {
  title: 'Base/Offering Badge',
  component: OfferingBadge,
  args: { offering: 'long_term_rent', size: 'medium', variant: 'tinted' },
  argTypes: {
    offering: { control: 'select', options: ['long_term_rent', 'sale', 'short_term_rent', 'exchange'] },
    size: { control: 'inline-radio', options: ['small', 'medium'] },
    variant: { control: 'inline-radio', options: ['tinted', 'onMedia'] },
  },
};

export default meta;

type Story = StoryObj<typeof OfferingBadge>;

const OFFERINGS: Offering[] = ['long_term_rent', 'sale', 'short_term_rent', 'exchange'];

/** One badge, driven by the controls. */
export const Playground: Story = {};

function Caption({ children }: { children: string }) {
  const theme = useTheme();
  return (
    <Text variant="caption-1-medium" style={{ color: theme.colors.textSecondary }}>
      {children}
    </Text>
  );
}

function MatrixBody() {
  const theme = useTheme();
  return (
    <View style={{ gap: 16, padding: 24, backgroundColor: theme.colors.background }}>
      <Caption>Tinted — medium · small · no icon</Caption>
      {(['medium', 'small'] as const).map((size) => (
        <View key={size} style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {OFFERINGS.map((offering) => (
            <OfferingBadge key={offering} offering={offering} size={size} testID={`tinted-${size}-${offering}`} />
          ))}
        </View>
      ))}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {OFFERINGS.map((offering) => (
          <OfferingBadge key={offering} offering={offering} icon={false} />
        ))}
      </View>
      <Caption>Custom label and icon</Caption>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        <OfferingBadge offering="long_term_rent" label="En alquiler" />
        <OfferingBadge offering="sale" label="Rent to own" icon={RiHome4Line} />
        <OfferingBadge offering="short_term_rent" label="Weekly stays" size="small" />
      </View>
      <Caption>On media — medium · small</Caption>
      <View style={{ width: 360, maxWidth: '100%', height: 200, borderRadius: 16, overflow: 'hidden' }}>
        <Image
          source={{ uri: 'https://picsum.photos/seed/offering-badge/720/400' }}
          style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
        />
        <View style={{ padding: 12, gap: 8 }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {OFFERINGS.map((offering) => (
              <OfferingBadge key={offering} offering={offering} variant="onMedia" testID={`media-${offering}`} />
            ))}
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {OFFERINGS.map((offering) => (
              <OfferingBadge key={offering} offering={offering} variant="onMedia" size="small" />
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

/** Every offering × size × variant. */
export const Matrix: Story = {
  render: () => <MatrixBody />,
};

/** The matrix in dark mode. */
export const Dark: Story = {
  globals: { theme: 'dark' },
  render: () => <MatrixBody />,
};
