import { Text } from 'react-native';
import {
  AgentProfile,
  AgentReply,
  AgentReplyAction,
  AgentReplyActions,
  AgentReplyBubble,
  AgentReplyIdentity,
} from '@bloom/agent-reply';
import { RiFileCopyLine } from '@bloom/icons/remix/RiFileCopyLine';
import type { Cases } from '../support/cases';

const noop = () => {};
const ember = { id: 'e', name: 'Ember', avatar: { preset: 'blue_beret' as const } };
const atlas = { id: 'a', name: 'Atlas', label: 'At', avatar: { preset: 'alfred' as const } };

export const CASES: Cases = {
  'AgentReply loaded': () => (
    <AgentReply
      identity={<AgentReplyIdentity character={{ preset: 'blue_beret' }} name="Ember" />}
      actions={
        <AgentReplyActions>
          <AgentReplyAction icon={RiFileCopyLine} label="Copy" onPress={noop} />
        </AgentReplyActions>
      }
      style={{ marginHorizontal: 0 }}
    >
      <AgentReplyBubble>
        <Text>Hello</Text>
      </AgentReplyBubble>
    </AgentReply>
  ),
  'AgentReply plain': () => <AgentReply identity={null} />,
  'AgentReplyBubble text': () => (
    <AgentReplyBubble text={{ fontSize: 16, lineHeight: 28 }} style={{ margin: 2 }}>
      <Text>Hi</Text>
    </AgentReplyBubble>
  ),
  'AgentReplyIdentity thinking': () => (
    <AgentReplyIdentity
      character={{ preset: 'blue_beret' }}
      name="Ember"
      thinking
      reasoning={<Text>Because</Text>}
    />
  ),
  'AgentReplyIdentity pressable': () => (
    <AgentReplyIdentity character={{ preset: 'alfred' }} name="Atlas" onPress={noop} avatarHidden />
  ),
  'AgentProfile one': () => <AgentProfile agents={[ember]} onPress={noop} />,
  'AgentProfile many': () => (
    <AgentProfile agents={[ember, atlas, ember, atlas]} onPress={noop} expanded avatarHidden />
  ),
};
