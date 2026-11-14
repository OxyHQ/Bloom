import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { View } from 'react-native';
import { AgentAvatar } from './AgentAvatar';
import { VectorStaticPortrait } from './VectorStaticPortrait';
import type { VectorFrame } from './vector-types';
import type { AgentAvatarMood } from './types';
import { CHARACTER_PRESETS, CHARACTER_TEMPLATES } from '../agent-creator/constants';
import { Button } from '../button/Button';
import { Text } from '../typography';
import portraits from '../../templates/agents/avatar-portraits.json';

type CharacterId = (typeof CHARACTER_PRESETS)[number]['id'];
const frames = portraits as Record<CharacterId, VectorFrame>;
function AvatarPlayer({ characterId }: { characterId: CharacterId }) {
  const [reaction, setReaction] = useState(0);
  const [working, setWorking] = useState(0);
  const [idle, setIdle] = useState(0);
  const [paused, setPaused] = useState(false);
  const [mood, setMood] = useState<AgentAvatarMood>('neutral');
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
        mood={mood}
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
        <Button onPress={() => setMood((value) => (value === 'sad' ? 'neutral' : 'sad'))}>
          {mood === 'sad' ? 'Animar' : 'Decir que no'}
        </Button>
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
/**
 * `mood="sad"` on every template: each shakes its head "no" once, then stays downcast. Replay
 * remounts them; reduced motion shows the settled pose with no shake.
 */
export const Sad: Story = {
  render: () => <SadGallery />,
  parameters: { controls: { disable: true } },
};
function SadGallery() {
  const [round, setRound] = useState(0);
  return (
    <View style={{ gap: 16, padding: 24 }}>
      <Button onPress={() => setRound((value) => value + 1)} style={{ alignSelf: 'flex-start' }}>
        Repetir
      </Button>
      <View key={round} style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 24 }}>
        {CHARACTER_PRESETS.map(({ id, title }) => {
          const character = CHARACTER_TEMPLATES[id];
          return character ? (
            <View key={id} style={{ width: 112, alignItems: 'center', gap: 6 }}>
              <AgentAvatar character={character} size={112} mood="sad" label={title} />
              <Text>{title}</Text>
            </View>
          ) : null;
        })}
      </View>
    </View>
  );
}
