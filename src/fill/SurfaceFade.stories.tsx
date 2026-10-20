import React from 'react';
import { Image, View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { ContentPanel } from '../content-panel';
import { Text } from '../typography';
import { SurfaceFade } from './index';

const meta: Meta<typeof SurfaceFade> = {
  id: 'base-surface-fade',
  title: 'Components/Surfaces/Surface Fade',
  component: SurfaceFade,
};
export default meta;
type Story = StoryObj<typeof SurfaceFade>;

const PHOTO = 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=1200';

/** A hero photo that ends in the panel's own colour, light or dark, instead of a black scrim. */
export const Hero: Story = {
  args: { edge: 'bottom', size: 0.5 },
  render: (args) => (
    <View style={{ width: 520, maxWidth: '100%' }}>
      <ContentPanel>
        <View style={{ height: 300, overflow: 'hidden', position: 'relative' }}>
          <Image source={{ uri: PHOTO }} style={{ width: '100%', height: '100%' }} />
          <SurfaceFade {...args} testID="hero-fade" />
        </View>
        <View style={{ padding: 16 }}>
          <Text variant="title-3-semibold">Find your next home</Text>
        </View>
      </ContentPanel>
    </View>
  ),
};
