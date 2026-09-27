import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Surface } from './Surface';
import { Button } from '../button/Button';
import { Text } from '../typography/Typography';

const meta: Meta<typeof Surface> = {
  title: 'Base/Surface',
  component: Surface,
  parameters: { layout: 'fullscreen' },
};
export default meta;
type Story = StoryObj<typeof Surface>;

export const Material: Story = {
  render: () => (
    <div style={{ padding: 40, minHeight: 520, background: 'url(https://raw.githubusercontent.com/lucasromerodb/liquid-glass-effect-macos/refs/heads/main/assets/flowers.jpg) center / 500px', display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start' }}>
      <Surface testID="surface-glass" style={{ padding: 24, width: 300, gap: 16 }}>
        <Text variant="title-3-semibold">A shared material</Text>
        <Text>One glass surface for your content. Buttons use the same paint without an extra layout wrapper.</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Button>Continue</Button>
          <Button variant="secondary" disabled>Later</Button>
        </View>
      </Surface>
      <Surface material="solid" testID="surface-solid" style={{ padding: 24, width: 300, gap: 16 }}>
        <Text variant="title-3-semibold">A solid surface</Text>
        <Text>Use a solid fill when the content needs a stable background.</Text>
        <Button variant="secondary">Explore</Button>
      </Surface>
    </div>
  ),
};
