import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Text } from '../typography';
import { useTheme } from '../theme/use-theme';
import { AspectRatio } from './index';

const meta: Meta<typeof AspectRatio> = {
  argTypes: {
    "ratio": { control: 'number' }
  },
  title: 'Base/Aspect Ratio',
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
  parameters: { controls: { disable: true } },
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
  parameters: { controls: { disable: true } },
  render: function Responsive() {
    const theme = useTheme();
    return (
      <View style={{ width: '100%', maxWidth: 488, padding: 24, gap: 16 }}>
        {[200, 320, 440].map((width) => (
          <View key={width} style={{ width, maxWidth: '100%' }}>
            <AspectRatio
              ratio={16 / 9}
              style={{
                backgroundColor: theme.colors.backgroundSecondary,
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Text>Up to {width}px wide</Text>
            </AspectRatio>
          </View>
        ))}
      </View>
    );
  },
};

/** Edit the props in Controls; interactive state stays in sync. */
export const Playground: Story = {
  args: { ratio: 1.7777777778 },
  render: (args) => <View style={{ width: 360, maxWidth: '100%' }}><AspectRatio {...args} style={{ backgroundColor: 'steelblue', alignItems: 'center', justifyContent: 'center' }}><Text>Media placeholder</Text></AspectRatio></View>,
};
