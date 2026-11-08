import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { View } from 'react-native';
import { AgentAvatar } from '../../src/agent-avatar/AgentAvatar';
import { VectorStaticPortrait } from '../../src/agent-avatar/VectorStaticPortrait';
import type { VectorFrame } from '../../src/agent-avatar/vector-types';
import { CHARACTER_PRESETS, CHARACTER_TEMPLATES } from '../../src/agent-creator/constants';
import { Button } from '../../src/button/Button';
import { Text } from '../../src/typography';
import portraits from './avatar-portraits.json';

type CharacterId = (typeof CHARACTER_PRESETS)[number]['id'];
const frames = portraits as Record<CharacterId, VectorFrame>;
function AvatarPlayer({ characterId }: { characterId: CharacterId }) {
  const [reaction, setReaction] = useState(0);
  const [working, setWorking] = useState(0);
  const [idle, setIdle] = useState(0);
  const [paused, setPaused] = useState(false);
  const name = CHARACTER_PRESETS.find(({ id }) => id === characterId)!.title;
  return (
    <View style={{ width: 320, alignItems: 'center', gap: 16 }}>
      <Text variant="title-2-medium">{name}</Text>
      <AgentAvatar
        character={CHARACTER_TEMPLATES[characterId]!}
        renderer="svg"
        size={320}
        interactive
        paused={paused}
        reactionKey={reaction}
        workingKey={working}
        idleKey={idle}
        label={name}
        testID="avatar-playground-preview"
      />
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: 8,
        }}
      >
        <Button onPress={() => setIdle((value) => value + 1)}>Reposo</Button>
        <Button onPress={() => setReaction((value) => value + 1)}>Reacción</Button>
        <Button onPress={() => setWorking((value) => value + 1)}>Trabajar</Button>
        <Button onPress={() => setPaused((value) => !value)}>
          {paused ? 'Continuar' : 'Pausar'}
        </Button>
      </View>
    </View>
  );
}
function AvatarGallery() {
  const [selected, setSelected] = useState<CharacterId>('peri');
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 32, padding: 24 }}>
      <AvatarPlayer key={selected} characterId={selected} />
      <View
        style={{
          maxWidth: 720,
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        {CHARACTER_PRESETS.map(({ id, title }) => (
          <Button
            key={id}
            onPress={() => setSelected(id)}
            accessibilityLabel={title}
            appearance={selected === id ? 'subtle' : 'plain'}
            tone="neutral"
            style={{ height: 126 }}
          >
            <View style={{ width: 100, alignItems: 'center', gap: 6 }}>
              <VectorStaticPortrait frame={frames[id]} size={80} label={title} />
              <Text>{title}</Text>
            </View>
          </Button>
        ))}
      </View>
    </View>
  );
}
const meta = {
  id: 'agents-agent-avatar',
  title: 'Components/Agents/Agent Avatar',
  parameters: { layout: 'padded' },
  args: { characterId: 'peri' as CharacterId },
  argTypes: {
    characterId: {
      control: 'select',
      options: CHARACTER_PRESETS.map(({ id }) => id),
    },
  },
  render: ({ characterId }: { characterId: CharacterId }) => (
    <AvatarPlayer key={characterId} characterId={characterId} />
  ),
} satisfies Meta<{ characterId: CharacterId }>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Gallery: Story = {
  render: () => <AvatarGallery />,
  parameters: { controls: { disable: true } },
};
export const Playground: Story = {};
