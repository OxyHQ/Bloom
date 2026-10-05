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
import { CHARACTER_SHAPES, createConfigForShape } from './character-shapes';
import { FOLD_CONFIG, parsePreset } from './model';

const characters = [
  ['clippo', 'Clippo'],
  ['blue_beret', 'Felipe'],
  ['alfred', 'Alfred'],
  ['purple_heart', 'Jojo'],
  ['lime_frog', 'Todd'],
  ['coral_monocle', 'Iris'],
  ['gus', 'Thelma'],
  ['blue_spectacles', 'Josh'],
  ['lime_headphones', 'Iggy'],
] as const;
const runtimeUrl = '/bloom-character/runtime.mjs?v=shape-eye-layout-5';
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
          {CHARACTER_SHAPES.map(([shape, label]) => (
            <AgentAvatar
              key={shape}
              config={createConfigForShape(
                { ...FOLD_CONFIG, character: { preset } },
                shape,
              )}
              portrait
              paused
              size={64}
              label={label}
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

const shapeCharacters = CHARACTER_SHAPES.map(([id, name]) => ({
  id,
  name,
  config: createConfigForShape(
    {
      ...FOLD_CONFIG,
      character: {
        preset: 'blue_beret',
        selections: {
          color: 'blue',
          eyes: 'oval',
          eyewear: 'none',
          accessory: 'none',
        },
      },
    },
    id,
  ),
}));
function MigratedCharacters() {
  const [selected, setSelected] = useState(
    shapeCharacters.find((item) => item.id === 'cloud')!,
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
          <Button onPress={() => setReaction((key) => key + 1)}>React</Button>
        </View>
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 16,
            maxWidth: 900,
          }}
        >
          {shapeCharacters.map((item) => (
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
              <Button onPress={() => setSelected(item)}>{item.name}</Button>
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
    avatar: shapeCharacters.find((item) => item.id === 'cloud')!.config,
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
  const legacy =
    shapeCharacters[Math.floor(index / 2) % shapeCharacters.length]!;
  return {
    id: `stress-avatar-${index + 1}`,
    name: migrated ? legacy.name : original[1],
    kind: migrated ? 'Shape' : 'Preset',
    config: migrated
      ? legacy.config
      : { ...FOLD_CONFIG, character: { preset: original[0] } },
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
        <Text variant="title-2-medium">48 avatars sharing one renderer</Text>
        <Text variant="body-regular">
          Each visible avatar animates independently. Scroll the gallery and use
          each avatar’s React or Work button.
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

function SharedPartsLab() {
  const [eyes, setEyes] = useState<string | undefined>('todd');
  const [accessory, setAccessory] = useState('felipe_beret');
  const [paused, setPaused] = useState(false);
  const [reaction, setReaction] = useState(0);
  const [working, setWorking] = useState(0);
  const appearance = {
    ...FOLD_CONFIG,
    character: {
      preset: 'blue_beret',
      selections: {
        color: 'blue',
        eyes: eyes ?? 'oval',
        eyewear: 'none',
        accessory,
      },
    },
  };
  const shapes = CHARACTER_SHAPES.map(([id, name]) => ({
    id,
    name,
    config: createConfigForShape(appearance, id),
  }));
  return (
    <AgentAvatarProvider runtimeUrl={runtimeUrl}>
      <View style={{ gap: 20, padding: 16, maxWidth: 980 }}>
        <Text>Todd’s eyes and Felipe’s beret on every shape</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          <Button onPress={() => setPaused((value) => !value)}>
            {paused ? 'Resume' : 'Pause'}
          </Button>
          <Button onPress={() => setEyes('todd')}>Todd eyes</Button>
          <Button onPress={() => setEyes(undefined)}>Default eyes</Button>
          <Button onPress={() => setAccessory('felipe_beret')}>
            Felipe’s beret
          </Button>
          <Button onPress={() => setAccessory('none')}>No hat</Button>
          <Button onPress={() => setReaction((value) => value + 1)}>
            React
          </Button>
          <Button onPress={() => setWorking((value) => value + 1)}>Work</Button>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
          {shapes.map(({ id, name, config }) => (
            <View key={id} style={{ width: 128, alignItems: 'center', gap: 8 }}>
              <AgentAvatar
                config={config}
                label={name}
                size={96}
                interactive
                paused={paused}
                reactionKey={reaction}
                workingKey={working}
                testID={`shared-part-${id}`}
              />
              <Text>{name}</Text>
            </View>
          ))}
        </View>
      </View>
    </AgentAvatarProvider>
  );
}
export const SharedParts: Story = { render: () => <SharedPartsLab /> };

function ClippoLab() {
  const [agent, setAgent] = useState<AgentCreatorAgent>({
    id: 'clippo',
    name: 'Clippo',
    label: 'Assistant',
    description: '',
    avatar: { ...FOLD_CONFIG, character: { preset: 'clippo' } },
  });
  const [reaction, setReaction] = useState(0);
  const [working, setWorking] = useState(0);
  return (
    <AgentAvatarProvider runtimeUrl={runtimeUrl}>
      <StyledView className="flex flex-row flex-wrap gap-8 p-6">
        <StyledView className="items-center gap-4">
          <AgentAvatar
            config={agent.avatar}
            size={280}
            interactive
            reactionKey={reaction}
            workingKey={working}
            label="Clippo"
            testID="clippo-preview"
          />
          <StyledView className="flex flex-row gap-3">
            <Button onPress={() => setReaction((key) => key + 1)}>
              Reaction
            </Button>
            <Button onPress={() => setWorking((key) => key + 1)}>
              Working
            </Button>
            <Button
              onPress={() => {
                const saved = JSON.parse(
                  JSON.stringify({ name: agent.name, config: agent.avatar }),
                );
                setAgent({ ...agent, avatar: parsePreset(saved).config });
              }}
            >
              Reload saved avatar
            </Button>
          </StyledView>
          <StyledView
            testID="clippo-shared-eyes"
            className="flex max-w-[480px] flex-row flex-wrap gap-4"
          >
            {CHARACTER_SHAPES.filter(([id]) => id !== 'clippo').map(
              ([id, title]) => (
                <AgentAvatar
                  key={id}
                  config={createConfigForShape(
                    {
                      ...FOLD_CONFIG,
                      character: {
                        preset: 'clippo',
                        selections: {
                          eyes: 'clippo',
                          eyewear: 'none',
                          accessory: 'none',
                        },
                      },
                    },
                    id,
                  )}
                  size={64}
                  portrait
                  paused
                  label={title}
                />
              ),
            )}
          </StyledView>
        </StyledView>
        <StyledView style={{ width: 360, height: 900 }}>
          <AgentCreator agent={agent} onChange={setAgent} />
        </StyledView>
      </StyledView>
    </AgentAvatarProvider>
  );
}
export const Clippo: Story = { render: () => <ClippoLab /> };

function UniversalCustomizationLab({
  singleEye = false,
}: {
  singleEye?: boolean;
}) {
  const [agent, setAgent] = useState<AgentCreatorAgent>({
    id: 'todd-customization',
    name: singleEye ? 'Single eye' : 'Todd',
    label: 'Assistant',
    description: '',
    avatar: {
      ...FOLD_CONFIG,
      character: {
        preset: 'lime_frog',
        ...(singleEye ? { selections: { eyes: 'cyclops' } } : {}),
      },
    },
  });
  const [reaction, setReaction] = useState(0);
  const [working, setWorking] = useState(0);
  return (
    <AgentAvatarProvider runtimeUrl={runtimeUrl}>
      <View
        style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 32, padding: 24 }}
      >
        <View style={{ width: 320, alignItems: 'center', gap: 16 }}>
          <AgentAvatar
            config={agent.avatar}
            size={280}
            interactive
            reactionKey={reaction}
            workingKey={working}
            label="Todd customization"
            testID="universal-avatar-preview"
          />
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Button onPress={() => setReaction((key) => key + 1)}>
              Reaction
            </Button>
            <Button onPress={() => setWorking((key) => key + 1)}>
              Working
            </Button>
          </View>
          <Text testID="universal-avatar-config">
            {JSON.stringify(
              agent.avatar.character ?? { preset: 'bloom' },
              null,
              2,
            )}
          </Text>
          {singleEye && (
            <View
              testID="cyclops-shared-eyes"
              style={{
                width: 320,
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: 16,
              }}
            >
              {CHARACTER_SHAPES.map(([shape, label]) => (
                <AgentAvatar
                  key={label}
                  config={createConfigForShape(
                    {
                      ...FOLD_CONFIG,
                      character: {
                        preset: 'lime_frog',
                        selections: {
                          eyes: 'cyclops',
                          color: 'lime',
                          eyewear: 'none',
                          accessory: 'none',
                        },
                      },
                    },
                    shape,
                  )}
                  size={64}
                  portrait
                  paused
                  label={label}
                />
              ))}
            </View>
          )}
        </View>
        <View style={{ width: 360, height: 960 }}>
          <AgentCreator agent={agent} onChange={setAgent} />
        </View>
      </View>
    </AgentAvatarProvider>
  );
}
export const UniversalCustomization: Story = {
  render: () => <UniversalCustomizationLab />,
};
export const SingleEye: Story = {
  render: () => <UniversalCustomizationLab singleEye />,
};
