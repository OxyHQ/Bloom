import React, { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { AgentAvatar } from './AgentAvatar';
import { ALIEN_PRESETS, EYES, FOLD_CONFIG, FOLD_PRESETS, FOLD_SHAPES, PRESETS } from './model';
import { Button } from '../button/Button';

const meta: Meta<typeof AgentAvatar> = {
  title: 'Application/Agent Avatar', component: AgentAvatar,
  args: { config: FOLD_CONFIG, size: 96 },
};
export default meta;
type Story = StoryObj<typeof AgentAvatar>;
export const Basic: Story = {};
export const Presets: Story = {
  render: () => <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
    {[...PRESETS, ...FOLD_PRESETS, ...ALIEN_PRESETS].map(preset => <AgentAvatar key={preset.name} label={preset.name} config={preset.config} size={96} />)}
  </View>,
};
export const Expressions: Story = {
  render: () => <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
    {EYES.map(eyes => <AgentAvatar key={eyes} label={eyes} config={{ ...FOLD_CONFIG, eyes }} size={72} />)}
  </View>,
};
export const FoldShapes: Story = {
  render: () => <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
    {FOLD_SHAPES.map(foldShape => <AgentAvatar key={foldShape} label={foldShape} config={{ ...FOLD_CONFIG, foldShape }} size={96} />)}
  </View>,
};
function MotionDemo() {
  const [entrance, setEntrance] = useState(0), [working, setWorking] = useState(0);
  return <View style={{ gap: 16, alignItems: 'center' }}>
    <AgentAvatar config={FOLD_CONFIG} size={144} entranceKey={entrance} workingKey={working} workingCycles={2} />
    <Button onPress={() => setEntrance(key => key + 1)}>Entrance</Button>
    <Button onPress={() => setWorking(key => key + 1)}>Working</Button>
  </View>;
}
export const Motion: Story = { render: () => <MotionDemo /> };
