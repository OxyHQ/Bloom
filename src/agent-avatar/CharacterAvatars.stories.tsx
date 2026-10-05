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
export const Editor: Story = {
  render: () => <UniversalCustomizationLab />,
};
export const SingleEye: Story = {
  render: () => <UniversalCustomizationLab singleEye />,
};
