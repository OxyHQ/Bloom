import { CHARACTER_TEMPLATES } from '../../src/agent-creator/constants';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { View } from 'react-native';
import { Button } from '../../src/button/Button';
import { StyledView } from '../../src/styles/styled-primitives';
import { Text } from '../../src/typography';
import { AgentCreator } from '../../src/agent-creator/AgentCreator.web';
import type { AgentCreatorAgent } from '../../src/agent-creator/types';
import { AgentAvatar } from '../../src/agent-avatar/AgentAvatar';
import { AgentAvatarProvider } from '../../src/agent-avatar/AgentAvatarProvider';
import { CHARACTER_SHAPES } from '../../src/agent-avatar/character-shapes';
import { type AvatarCharacter } from '../../src/agent-avatar/character';
import type { AvatarEyesId, AvatarShapeId } from '../../src/agent-avatar/catalog-ids';

const meta = {
  id: 'agents-agent-avatar-characters',
  title: 'Internal/Avatar Regression/Characters',
  parameters: { layout: 'padded' },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;
function ShapeProportionsGallery() {
  const [eyes, setEyes] = useState<AvatarEyesId>('todd');
  const [glasses, setGlasses] = useState(false);
  const [paused, setPaused] = useState(false);
  const [reaction, setReaction] = useState(0);
  const [working, setWorking] = useState(0);
  return (
    <AgentAvatarProvider>
      <View style={{ gap: 20, padding: 16 }}>
        <Text>Shape proportions · eyes: {eyes}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {(['oval', 'todd', 'crescent_inset', 'cyclops'] as const).map((id) => (
            <Button key={id} onPress={() => setEyes(id)}>
              {id}
            </Button>
          ))}
          <Button onPress={() => setGlasses(!glasses)}>
            {glasses ? 'Remove glasses' : 'Add glasses'}
          </Button>
          <Button onPress={() => setPaused(!paused)}>{paused ? 'Resume' : 'Pause'}</Button>
          <Button onPress={() => setReaction((key) => key + 1)}>Reaction</Button>
          <Button onPress={() => setWorking((key) => key + 1)}>Computer</Button>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
          {CHARACTER_SHAPES.filter(([shape]) => shape !== 'todd').map(([shape, label]) => (
            <View key={shape} style={{ width: 180, alignItems: 'center', gap: 8 }}>
              <AgentAvatar
                character={{
                  preset: 'lime_frog',
                  shape,
                  eyes: shape === 'clippo' ? 'clippo' : eyes,
                  accessory: 'three_lobe',
                  eyewear: glasses ? (eyes === 'cyclops' ? 'monocle' : 'tall_oval_frames') : 'none',
                  color: 'lime',
                }}
                size={180}
                label={label}
                paused={paused}
                interactive
                reactionKey={reaction}
                workingKey={working}
                testID={`shape-proportions-${shape}`}
              />
              <Text>{label}</Text>
            </View>
          ))}
        </View>
      </View>
    </AgentAvatarProvider>
  );
}
export const ShapeProportions: Story = {
  render: () => <ShapeProportionsGallery />,
};
// Alternate each original preset with the same preset refitted to a shape, so
// the gallery exercises both catalog bodies and the shared shape geometry.
function UniversalCustomizationLab({ singleEye = false }: { singleEye?: boolean }) {
  const [agent, setAgent] = useState<AgentCreatorAgent>({
    id: 'todd-customization',
    name: singleEye ? 'Single eye' : 'Todd',
    label: 'Assistant',
    description: '',
    avatar: singleEye
      ? { preset: 'lime_frog', eyes: 'cyclops' }
      : (CHARACTER_TEMPLATES.lime_frog as AvatarCharacter),
  });
  const [reaction, setReaction] = useState(0);
  const [working, setWorking] = useState(0);
  return (
    <AgentAvatarProvider>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 32, padding: 24 }}>
        <View style={{ width: 320, alignItems: 'center', gap: 16 }}>
          <AgentAvatar
            character={agent.avatar}
            size={280}
            interactive
            reactionKey={reaction}
            workingKey={working}
            label="Todd customization"
            testID="universal-avatar-preview"
          />
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Button onPress={() => setReaction((key) => key + 1)}>Reaction</Button>
            <Button onPress={() => setWorking((key) => key + 1)}>Working</Button>
          </View>
          <Text testID="universal-avatar-config">{JSON.stringify(agent.avatar, null, 2)}</Text>
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
                  character={{
                    preset: 'lime_frog',
                    shape: shape as AvatarShapeId,
                    eyes: 'cyclops',
                    color: 'lime',
                    eyewear: 'none',
                    accessory: 'none',
                  }}
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
