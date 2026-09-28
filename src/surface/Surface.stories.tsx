import React, { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Surface } from './Surface';
import { Button } from '../button/Button';
import { Card } from '../card';
import { LinkPreviewCard } from '../link-preview';
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
      <Surface testID="surface-solid" style={{ padding: 24, width: 300, gap: 16 }}>
        <Text variant="title-3-semibold">Solid surface</Text>
        <Text>Opaque fill with the shared gradient and rim. No blur, transparency or refraction.</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Button>Continue</Button>
          <Button variant="secondary" disabled>Later</Button>
        </View>
      </Surface>
      <Surface material="glass" testID="surface-glass" style={{ padding: 24, width: 300, gap: 16 }}>
        <Text variant="title-3-semibold">Glass comparison</Text>
        <Text>The previous translucent material, kept here for comparison.</Text>
        <Button variant="secondary">Explore</Button>
      </Surface>
    </div>
  ),
};

/** Only the exterior bands change; the background directly under the pane stays gray. */
export const BackdropReflection: Story = {
  render: function Render() {
    const [alternate, setAlternate] = useState(false);
    const side = alternate ? '#22c55e' : '#f43f5e';
    return <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 600 }}>
      <div style={{ position: 'relative', height: 180, borderRadius: 20, background: `linear-gradient(90deg, ${side} 0 calc(50% - 100px), #888888 calc(50% - 100px) calc(50% + 100px), ${side} calc(50% + 100px))` }}>
        <Surface material="glass" testID="side-reflection" radius={20} style={{ position: 'absolute', left: '50%', marginLeft: -100, top: 50, width: 200, height: 80, alignItems: 'center', justifyContent: 'center' }}>
          <span>Glass</span>
        </Surface>
      </div>
      <Button appearance="subtle" tone="neutral" onPress={() => setAlternate(value => !value)}>Change only the sides</Button>
    </div>;
  },
};


export const Nested: Story = {
  render: () => <View style={{ padding: 32, maxWidth: 640 }}>
    <Surface testID="nested-outer" style={{ padding: 24, gap: 20 }}>
      <Text variant="title-3-semibold">Panel</Text>
      <Card testID="nested-card" style={{ padding: 20, gap: 16 }}>
        <Text>Card on the panel</Text>
        <LinkPreviewCard url="https://example.com" title="A link inside the card" description="Each surface derives its fill from its actual parent." />
      </Card>
      <Card appearance="plain" style={{ gap: 16 }}>
        <Text>A plain container keeps the panel's level</Text>
        <Surface testID="nested-plain-child" style={{ padding: 20 }}><Text>Surface on the panel</Text></Surface>
      </Card>
    </Surface>
  </View>,
};
