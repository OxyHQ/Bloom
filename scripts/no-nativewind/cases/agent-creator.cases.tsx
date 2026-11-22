import { Text } from 'react-native';
import { AgentCreator, AgentCreatorField, AgentCreatorSection } from '@bloom/agent-creator';
import { CHARACTER_TEMPLATES } from '@bloom/agent-creator/constants';
import { CustomColorPicker } from '@bloom/agent-creator/CustomColorPicker';
import { GlossArt } from '@bloom/agent-creator/GlossArt';
import type { AgentCreatorAgent } from '@bloom/agent-creator/types';
import type { Cases } from '../support/cases';

// Reanimated exports `createAnimatedComponent` by name, which react-native-css calls for a
// class with a transition; Bloom's Jest mock has it on the default export only.
const reanimated = require('react-native-reanimated');
reanimated.createAnimatedComponent ??= reanimated.default.createAnimatedComponent;

const noop = () => {};
const plain: AgentCreatorAgent = {
  id: 'a',
  name: '',
  label: '',
  description: '',
  avatar: CHARACTER_TEMPLATES.lime_frog ?? {},
  color: 'green',
};
const loaded: AgentCreatorAgent = {
  id: 'b',
  name: 'Designer',
  label: 'Design',
  description: 'Clear layouts',
  avatar: { preset: 'blue_beret' },
  color: '#3366aa',
  preferences: { voice: 'local', speed: 1.25, language: 'en', notifications: false },
};

export const CASES: Cases = {
  'AgentCreator plain': () => <AgentCreator agent={plain} onChange={noop} />,
  'AgentCreator loaded': () => (
    <AgentCreator
      agent={loaded}
      onChange={noop}
      onClose={noop}
      voices={[{ id: 'local', name: 'Local', language: 'en-US' }]}
      onPreviewVoice={noop}
      style={{ margin: 2 }}
      sections={
        <AgentCreatorSection title="Heartbeat">
          <AgentCreatorField label="Check" divider={false}>
            <Text>On</Text>
          </AgentCreatorField>
        </AgentCreatorSection>
      }
    >
      <AgentCreatorField label="Extra" multiline>
        <Text>Row</Text>
      </AgentCreatorField>
    </AgentCreator>
  ),
  'AgentCreator no preferences': () => (
    <AgentCreator agent={plain} onChange={noop} showPreferences={false} />
  ),
  'AgentCreatorField variants': () => (
    <>
      <AgentCreatorField label="A">
        <Text>a</Text>
      </AgentCreatorField>
      <AgentCreatorField label="B" divider={false} multiline>
        <Text>b</Text>
      </AgentCreatorField>
    </>
  ),
  CustomColorPicker: () => <CustomColorPicker value="#ff8800" onChange={noop} />,
  'GlossArt variants': () => (
    <>
      <GlossArt />
      <GlossArt rainbow size={32} />
      <GlossArt active center="#111111" edge="#222222" />
    </>
  ),
};
