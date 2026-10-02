import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { View } from 'react-native';
import { Button } from '../button/Button';
import { AgentAvatar } from './AgentAvatar';
import {
  DEFAULT_CONFIG,
  FOLD_CONFIG,
  FOLD_PRESETS,
  FOLD_SHAPES,
  PRESETS,
} from './model';

const meta: Meta<typeof AgentAvatar> = {
  title: 'Application/Agent Avatar',
  component: AgentAvatar,
  args: { config: FOLD_CONFIG, size: 96 },
};
export default meta;
type Story = StoryObj<typeof AgentAvatar>;
export const Basic: Story = {};
export const Presets: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
      {[...PRESETS, ...FOLD_PRESETS].map((preset) => (
        <AgentAvatar
          key={preset.name}
          label={preset.name}
          config={preset.config}
          size={96}
        />
      ))}
    </View>
  ),
};
export const FoldShapes: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
      {FOLD_SHAPES.map((foldShape) => (
        <AgentAvatar
          key={foldShape}
          label={foldShape}
          config={{ ...FOLD_CONFIG, foldShape }}
          size={96}
        />
      ))}
    </View>
  ),
};
function MotionDemo() {
  const [entrance, setEntrance] = useState(0),
    [working, setWorking] = useState(0);
  return (
    <View style={{ gap: 16, alignItems: 'center' }}>
      <AgentAvatar
        config={FOLD_CONFIG}
        size={144}
        entranceKey={entrance}
        workingKey={working}
        workingCycles={2}
      />
      <Button onPress={() => setEntrance((key) => key + 1)}>Entrance</Button>
      <Button onPress={() => setWorking((key) => key + 1)}>Working</Button>
    </View>
  );
}
export const Motion: Story = { render: () => <MotionDemo /> };

/** Frozen recipes for pixel comparison with the unchanged source canvas. */
export const SourceParity: Story = {
  render: () => (
    <View
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
        padding: 16,
        backgroundColor: '#e7e7e7',
        width: 900,
      }}
    >
      {[DEFAULT_CONFIG, FOLD_CONFIG].flatMap((config, family) =>
        (['solid', 'mist', 'ribbons', 'prism'] as const).map((material) =>
          [32, 64, 96, 200].map((size) => (
            <View
              key={`${family}-${material}-${size}`}
              {...{ 'data-avatar': `${family}-${material}-${size}` }}
              style={{ width: size, height: size }}
            >
              <AgentAvatar
                config={{ ...config, material, motion: 0, lookAt: 'center' }}
                size={size}
                paused
              />
            </View>
          )),
        ),
      )}
    </View>
  ),
};
