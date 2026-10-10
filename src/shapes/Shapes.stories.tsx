import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Card } from '../card';
import { Avatar } from '../avatar';
import { Border } from './Border';
import { surfaceStyle } from './surface-style';

const meta = {
  title: 'Base/Shapes',
  component: Border,
  args: { size: 64, width: 2, colors: '#ff0000' },
} satisfies Meta<typeof Border>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Fixed colors expose edge coverage independently of theme and alpha. */
export const Geometry: Story = {
  render: () => (
    <View style={{ padding: 40, gap: 32, backgroundColor: '#ffffff' }}>
      <View
        testID="shape-border-probe"
        style={{ width: 256, height: 256, backgroundColor: '#ffffff' }}
      >
        <Border shape="squircle" size={256} width={8} colors="#ff0000" />
      </View>
      <View style={{ flexDirection: 'row', gap: 24 }}>
        <Avatar
          shape="squircle"
          name="Ada"
          size={64}
          testID="shape-initials"
          ring={{ colors: '#ff0000', width: 2 }}
        />
        <Avatar shape="heart" name="Ada" size={64} testID="shape-heart" />
      </View>
      <Card clipContent radius="radius-24" testID="shape-card" style={{ width: 260 }}>
        <View style={{ height: 96, backgroundColor: '#0055ff' }} />
      </Card>
      <Card clipContent testID="shape-fixed-card" style={{ width: 200, height: 120 }}>
        <View testID="shape-fixed-child" style={{ flex: 1, backgroundColor: '#0055ff' }} />
      </Card>
      <View
        testID="shape-rtl"
        style={{
          width: 180,
          height: 80,
          backgroundColor: '#0055ff',
          ...surfaceStyle({ radius: { topStart: 32 }, curve: 'smooth' }, 'rtl'),
        }}
      />
    </View>
  ),
};

/** Mount/resize instrumentation can target these stable IDs without network images. */
export const Many: Story = {
  render: () => (
    <View
      testID="shape-many"
      style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, width: 720 }}
    >
      {Array.from({ length: 100 }, (_, i) => (
        <Avatar
          key={i}
          name={String(i)}
          shape="squircle"
          size={40}
          ring={{ colors: '#ff0000', width: 2 }}
        />
      ))}
    </View>
  ),
};
