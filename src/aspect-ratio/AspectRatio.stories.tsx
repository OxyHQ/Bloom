import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Text } from '../typography';
import { useTheme } from '../theme/use-theme';
import { AspectRatio } from './index';

const meta: Meta<typeof AspectRatio> = {
  title: 'Components/AspectRatio',
  component: AspectRatio,
};

export default meta;

type Story = StoryObj<typeof AspectRatio>;

function Well({ ratio, label }: { ratio: number; label: string }) {
  const theme = useTheme();
  return (
    <View style={{ width: 260 }}>
      <AspectRatio
        ratio={ratio}
        style={{
          backgroundColor: theme.colors.backgroundSecondary,
          borderRadius: 12,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <Text>{label}</Text>
      </AspectRatio>
    </View>
  );
}

export const Ratios: Story = {
  render: () => (
    <View style={{ gap: 16, padding: 24 }}>
      <Well ratio={16 / 9} label="16 / 9" />
      <Well ratio={1} label="1 / 1" />
      <Well ratio={4 / 3} label="4 / 3" />
    </View>
  ),
};

/**
 * The box fills its parent's width and derives its height, which is what keeps a
 * media well from jumping as an image loads.
 */
export const FillsParentWidth: Story = {
  render: function Responsive() {
    const theme = useTheme();
    return (
      <View style={{ padding: 24, gap: 16 }}>
        {[200, 320, 440].map((width) => (
          <View key={width} style={{ width }}>
            <AspectRatio
              ratio={16 / 9}
              style={{
                backgroundColor: theme.colors.backgroundSecondary,
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Text>{width}px wide</Text>
            </AspectRatio>
          </View>
        ))}
      </View>
    );
  },
};
