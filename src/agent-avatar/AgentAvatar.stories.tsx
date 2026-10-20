import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { View } from 'react-native';
import { Button } from '../button/Button';
import { Text } from '../typography';
import { AgentAvatar } from './AgentAvatar';
import {
  AVATAR_ACCESSORIES,
  AVATAR_COLORS,
  AVATAR_EYES,
  AVATAR_EYEWEAR,
  AVATAR_PRESETS,
  AVATAR_SHAPES,
} from './catalog-ids';

const meta: Meta<typeof AgentAvatar> = {
  id: 'agents-agent-avatar',
  title: 'Components/Agents/Agent Avatar',
  component: AgentAvatar,
  args: { character: { preset: 'blue_beret' }, size: 96 },
};
export default meta;
type Story = StoryObj<typeof AgentAvatar>;

const wrap = { flexDirection: 'row', flexWrap: 'wrap', gap: 16 } as const;
const cell = { alignItems: 'center', gap: 6 } as const;

/** A preset is a complete character. */
export const Basic: Story = {};

export const Presets: Story = {
  render: () => (
    <View style={wrap}>
      {AVATAR_PRESETS.map((preset) => (
        <View key={preset} style={cell}>
          <AgentAvatar character={{ preset }} label={preset} size={96} />
          <Text variant="caption-2-regular">{preset}</Text>
        </View>
      ))}
    </View>
  ),
};

/** Every body, in the same preset's face, accessory and paint. */
export const Shapes: Story = {
  render: () => (
    <View style={wrap}>
      {AVATAR_SHAPES.map((shape) => (
        <View key={shape} style={cell}>
          <AgentAvatar character={{ preset: 'blue_beret', shape }} label={shape} size={96} />
          <Text variant="caption-2-regular">{shape}</Text>
        </View>
      ))}
    </View>
  ),
};

/** Named paint, and an exact `#rrggbb` that wins over it. */
export const Paint: Story = {
  render: () => (
    <View style={wrap}>
      {AVATAR_COLORS.map((color) => (
        <AgentAvatar
          key={color}
          character={{ preset: 'blue_beret', color }}
          label={color}
          size={72}
        />
      ))}
      <AgentAvatar
        character={{ preset: 'blue_beret', color: 'blue', bodyColor: '#ff9547' }}
        label="exact"
        size={72}
      />
    </View>
  ),
};

/** Each part on its own, over a plain circle. */
export const Parts: Story = {
  render: () => (
    <View style={{ gap: 16 }}>
      {(
        [
          ['eyes', AVATAR_EYES],
          ['eyewear', AVATAR_EYEWEAR],
          ['accessory', AVATAR_ACCESSORIES],
        ] as const
      ).map(([part, ids]) => (
        <View key={part} style={wrap}>
          {ids.map((id) => (
            <View key={id} style={cell}>
              <AgentAvatar
                character={{
                  shape: 'circle',
                  eyes: 'oval',
                  eyewear: 'none',
                  accessory: 'none',
                  color: 'orchid',
                  [part]: id,
                }}
                label={id}
                size={72}
              />
              <Text variant="caption-2-regular">{id}</Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  ),
};

/**
 * The preset plays its own authored animation while the character is exactly the preset
 * (paint aside). Change a part and the animation is retargeted onto the new parts. Tap both.
 */
function AnimationDemo() {
  const [reaction, setReaction] = useState(0);
  return (
    <View style={{ gap: 16, alignItems: 'center' }}>
      <View style={wrap}>
        {(
          [
            ['authored', { preset: 'blue_beret' }],
            ['paint only', { preset: 'blue_beret', color: 'orchid' }],
            ['retargeted: no hat', { preset: 'blue_beret', accessory: 'none', color: 'orchid' }],
          ] as const
        ).map(([name, character]) => (
          <View key={name} style={cell}>
            <AgentAvatar character={character} size={120} reactionKey={reaction} />
            <Text variant="caption-2-regular">{name}</Text>
          </View>
        ))}
      </View>
      <Button onPress={() => setReaction((key) => key + 1)}>React</Button>
    </View>
  );
}
export const Animation: Story = { render: () => <AnimationDemo /> };

function MotionDemo() {
  const [entrance, setEntrance] = useState(0),
    [working, setWorking] = useState(0);
  return (
    <View style={{ gap: 16, alignItems: 'center' }}>
      <AgentAvatar
        character={{ preset: 'blue_beret' }}
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
