import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { View } from 'react-native';
import { Button } from '../button/Button';
import { StyledView } from '../styles/styled-primitives';
import { Text } from '../typography';
import { AgentCreator } from '../agent-creator/AgentCreator.web';
import type { AgentCreatorAgent } from '../agent-creator/types';
import { AgentAvatar } from './AgentAvatar';
import { AgentAvatarProvider } from './AgentAvatarProvider';
import { FOLD_CONFIG, FOLD_SHAPES, DEFAULT_CONFIG, SHAPES } from './model';

const characters = [
  ['blue_beret', 'Felipe'],
  ['alfred', 'Alfred'],
  ['purple_heart', 'Jojo'],
  ['lime_frog', 'Todd'],
  ['coral_monocle', 'Iris'],
  ['gus', 'Thelma'],
  ['blue_spectacles', 'Josh'],
  ['lime_headphones', 'Iggy'],
] as const;
const runtimeUrl = '/bloom-character/runtime.mjs?v=render-budget-4';
const meta = {
  title: 'Application/Agent Avatar/Characters',
  parameters: { layout: 'padded' },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;
function CharacterLab() {
  const [preset, setPreset] = useState<string>('blue_beret');
  const [paused, setPaused] = useState(false);
  const [working, setWorking] = useState(0);
  const [reaction, setReaction] = useState(0);
  return (
    <AgentAvatarProvider runtimeUrl={runtimeUrl}>
      <View style={{ gap: 24, alignItems: 'center', padding: 24 }}>
        <AgentAvatar
          config={{
            ...FOLD_CONFIG,
            eyeSize: 18,
            eyeGap: 50,
            character: { preset },
          }}
          label={preset}
          size={280}
          paused={paused}
          interactive
          workingKey={working}
          reactionKey={reaction}
          testID="character-preview"
        />
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 8,
            justifyContent: 'center',
          }}
        >
          {characters.map(([id, name]) => (
            <Button key={id} onPress={() => setPreset(id)}>
              {name}
            </Button>
          ))}
        </View>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Button onPress={() => setPaused(!paused)}>{paused ? 'Resume' : 'Pause'}</Button>
          <Button onPress={() => setWorking((key) => key + 1)}>Working</Button>
          <Button onPress={() => setReaction((key) => key + 1)}>Reaction</Button>
        </View>
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 16,
            justifyContent: 'center',
          }}
        >
          {FOLD_SHAPES.map((foldShape) => (
            <AgentAvatar
              key={foldShape}
              config={{ ...FOLD_CONFIG, foldShape }}
              portrait
              paused
              size={64}
              label={foldShape}
            />
          ))}
          {SHAPES.map((shape) => (
            <AgentAvatar
              key={shape}
              config={{ ...DEFAULT_CONFIG, shape }}
              portrait
              paused
              size={64}
              label={shape}
            />
          ))}
        </View>
      </View>
    </AgentAvatarProvider>
  );
}
export const Playground: Story = { render: () => <CharacterLab /> };
function CharacterEditor() {
  const [agent, setAgent] = useState<AgentCreatorAgent>({
    id: 'character',
    name: 'Felipe',
    label: 'Design',
    description: '',
    avatar: {
      ...FOLD_CONFIG,
      eyeSize: 18,
      eyeGap: 50,
      character: { preset: 'blue_beret' },
    },
  });
  return (
    <AgentAvatarProvider runtimeUrl={runtimeUrl}>
      <View style={{ width: 360, height: 900 }}>
        <AgentCreator agent={agent} onChange={setAgent} />
      </View>
    </AgentAvatarProvider>
  );
}
export const Editor: Story = { render: () => <CharacterEditor /> };

const legacyCharacters = [
  ...FOLD_SHAPES.filter((shape) => !['heart', 'flower', 'diamond'].includes(shape)).map(
    (foldShape) => ({
      id: `fold-${foldShape}`,
      config: { ...FOLD_CONFIG, foldShape },
    }),
  ),
  ...SHAPES.filter((shape) => !['circle', 'triangle', 'flower', 'diamond'].includes(shape)).map(
    (shape) => ({
      id: `blob-${shape}`,
      config: { ...DEFAULT_CONFIG, shape },
    }),
  ),
];
function MigratedCharacters() {
  const [selected, setSelected] = useState(
    legacyCharacters.find((item) => item.id === 'fold-cloud')!,
  );
  const [working, setWorking] = useState(0);
  const [reaction, setReaction] = useState(0);
  return (
    <AgentAvatarProvider runtimeUrl={runtimeUrl}>
      <View style={{ gap: 24, alignItems: 'center' }}>
        <AgentAvatar
          config={selected.config}
          size={280}
          interactive
          label={selected.id}
          workingKey={working}
          reactionKey={reaction}
          testID="migrated-preview"
        />
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Button onPress={() => setWorking((key) => key + 1)}>Working</Button>
          <Button onPress={() => setReaction((key) => key + 1)}>Wave</Button>
        </View>
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 16,
            maxWidth: 900,
          }}
        >
          {legacyCharacters.map((item) => (
            <View key={item.id} style={{ alignItems: 'center', width: 130, gap: 8 }}>
              <AgentAvatar config={item.config} size={100} portrait paused label={item.id} />
              <Button onPress={() => setSelected(item)}>{item.id}</Button>
            </View>
          ))}
        </View>
      </View>
    </AgentAvatarProvider>
  );
}
export const Migrated: Story = { render: () => <MigratedCharacters /> };
function MigratedEditor() {
  const [agent, setAgent] = useState<AgentCreatorAgent>({
    id: 'migrated',
    name: 'Cloud',
    label: 'Design',
    description: '',
    avatar: { ...FOLD_CONFIG, foldShape: 'cloud' },
  });
  return (
    <AgentAvatarProvider runtimeUrl={runtimeUrl}>
      <View style={{ width: 360, height: 900 }}>
        <AgentCreator agent={agent} onChange={setAgent} />
      </View>
    </AgentAvatarProvider>
  );
}
export const LegacyEditor: Story = { render: () => <MigratedEditor /> };

const stressCharacters = Array.from({ length: 48 }, (_, index) => {
  const variant = Math.floor(index / 2) % 8;
  const migrated = index % 2 === 1;
  const original = characters[variant]!;
  const legacy = legacyCharacters[variant]!;
  return {
    id: `stress-avatar-${index + 1}`,
    name: migrated ? legacy.id : original[1],
    kind: migrated ? 'Migrated' : 'Original',
    config: migrated ? legacy.config : { ...FOLD_CONFIG, character: { preset: original[0] } },
  };
});

function StressAvatar({
  item,
  paused,
}: {
  item: (typeof stressCharacters)[number];
  paused: boolean;
}) {
  const [workingKey, setWorking] = useState(0);
  const [reactionKey, setReaction] = useState(0);
  return (
    <StyledView
      testID={item.id}
      className="w-[148px] items-center gap-2 rounded-2xl border border-border-button-default p-3"
      style={{ width: 148 }}
    >
      <AgentAvatar
        config={item.config}
        size={96}
        paused={paused}
        interactive
        workingKey={workingKey}
        reactionKey={reactionKey}
        label={`${item.kind} ${item.name}`}
      />
      <Text variant="body-medium" numberOfLines={1}>
        {item.name}
      </Text>
      <Text variant="caption-2-regular">{item.kind}</Text>
      <StyledView className="flex-row gap-2">
        <Button
          size="xs"
          disabled={paused}
          accessibilityLabel={`React ${item.id}`}
          onPress={() => setReaction((key) => key + 1)}
        >
          React
        </Button>
        <Button
          size="xs"
          disabled={paused}
          accessibilityLabel={`Work ${item.id}`}
          onPress={() => setWorking((key) => key + 1)}
        >
          Work
        </Button>
      </StyledView>
    </StyledView>
  );
}

function ManyAvatarGallery() {
  const [paused, setPaused] = useState(false);
  return (
    <AgentAvatarProvider runtimeUrl={runtimeUrl}>
      <StyledView className="w-full max-w-[1020px] gap-5 p-4">
        <Text variant="title-2-medium">48 original and migrated avatars</Text>
        <Text variant="body-regular">
          Scroll the gallery and use each avatar’s React or Work button. Overflow avatars retain
          their painted 3D image and reclaim a renderer when you interact.
        </Text>
        <Button onPress={() => setPaused((value) => !value)}>
          {paused ? 'Resume all' : 'Pause all'}
        </Button>
        <StyledView className="flex-row flex-wrap gap-4">
          {stressCharacters.map((item) => (
            <StressAvatar key={item.id} item={item} paused={paused} />
          ))}
        </StyledView>
      </StyledView>
    </AgentAvatarProvider>
  );
}

export const ManyAvatars: Story = {
  parameters: { layout: 'fullscreen', bloomScroll: 'document' },
  render: () => <ManyAvatarGallery />,
};
