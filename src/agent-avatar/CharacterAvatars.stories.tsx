import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { View } from 'react-native';
import { Button } from '../button/Button';
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
const runtimeUrl = '/bloom-character/runtime.mjs?v=unified-native-eyes-2';
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
          <Button onPress={() => setPaused(!paused)}>
            {paused ? 'Resume' : 'Pause'}
          </Button>
          <Button onPress={() => setWorking((key) => key + 1)}>Working</Button>
          <Button onPress={() => setReaction((key) => key + 1)}>
            Reaction
          </Button>
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
  ...FOLD_SHAPES.filter(
    (shape) => !['heart', 'flower', 'diamond'].includes(shape),
  ).map((foldShape) => ({
    id: `fold-${foldShape}`,
    config: { ...FOLD_CONFIG, foldShape },
  })),
  ...SHAPES.filter(
    (shape) => !['circle', 'triangle', 'flower', 'diamond'].includes(shape),
  ).map((shape) => ({
    id: `blob-${shape}`,
    config: { ...DEFAULT_CONFIG, shape },
  })),
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
            <View
              key={item.id}
              style={{ alignItems: 'center', width: 130, gap: 8 }}
            >
              <AgentAvatar
                config={item.config}
                size={100}
                portrait
                paused
                label={item.id}
              />
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
