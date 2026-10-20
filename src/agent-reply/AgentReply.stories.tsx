import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { View } from 'react-native';
import { RiVolumeUpLine } from '../icons/remix/RiVolumeUpLine';
import { Text } from '../typography';
import {
  AgentProfile,
  AgentReply,
  AgentReplyAction,
  AgentReplyActions,
  AgentReplyBubble,
  AgentReplyIdentity,
  AgentStack,
  type AgentReplyAgent,
} from './index';

const meta: Meta = { id: 'agents-agent-reply', title: 'Components/Agents/Agent Reply' };
export default meta;

const TEAM: AgentReplyAgent[] = [
  {
    id: 'design',
    name: 'Landing page designer',
    label: 'Design',
    avatar: { shape: 'slender', eyes: 'oval', eyewear: 'none', accessory: 'none', color: 'teal' },
  },
  {
    id: 'seo',
    name: 'SEO bot',
    label: 'SEO',
    avatar: {
      shape: 'six_lobed_flower',
      eyes: 'oval',
      eyewear: 'none',
      accessory: 'none',
      color: 'violet',
    },
  },
  {
    id: 'security',
    name: 'Security agent',
    label: 'Security',
    avatar: { shape: 'shield', eyes: 'oval', eyewear: 'none', accessory: 'none', color: 'teal' },
  },
  {
    id: 'data',
    name: 'Data analyst',
    label: 'Analytics',
    avatar: { shape: 'pocket', eyes: 'oval', eyewear: 'none', accessory: 'none', color: 'cyan' },
  },
];

const ANSWERS = [
  'Give the hero one clear action. Lead with the outcome, pair it with a focused product preview, and move the secondary links below the fold.',
  'Start with a practical guide to the core topic, and support it with focused articles that answer the next questions readers are likely to ask.',
  'Review access permissions before inviting testers, and confirm that every request checks the current user’s access.',
];

function Reply({
  agent,
  text,
  thinking,
}: {
  agent: AgentReplyAgent;
  text: string;
  thinking?: boolean;
}) {
  return (
    <AgentReply
      identity={
        <AgentReplyIdentity
          character={agent.avatar}
          name={agent.name}
          thinking={thinking}
          onPress={() => undefined}
          pressLabel={`Edit ${agent.name}`}
        />
      }
      actions={thinking ? undefined : <AgentReplyActions onCopy={() => undefined} />}
    >
      {thinking ? null : (
        <AgentReplyBubble>
          <Text variant="body-regular">{text}</Text>
        </AgentReplyBubble>
      )}
    </AgentReply>
  );
}

/** Three agents answering in turn, each in its own bubble, under a header that names them. */
export const Team: StoryObj = {
  render: () => (
    <View style={{ maxWidth: 560, alignSelf: 'center', paddingVertical: 24 }}>
      <View style={{ alignItems: 'center' }}>
        <AgentProfile agents={TEAM.slice(0, 3)} onPress={() => undefined} />
      </View>
      {TEAM.slice(0, 3).map((agent, i) => (
        <Reply key={agent.id} agent={agent} text={ANSWERS[i]!} />
      ))}
    </View>
  ),
};

/** The avatar grows and the name gives way to "Thinking…" while an agent works. */
export const Thinking: StoryObj = {
  render: () => {
    const [thinking, setThinking] = useState(true);
    return (
      <View style={{ maxWidth: 560, alignSelf: 'center', paddingVertical: 24 }}>
        <Reply agent={TEAM[1]!} text={ANSWERS[1]!} thinking={thinking} />
        <View style={{ marginTop: 16, alignItems: 'flex-start', marginStart: 12 }}>
          <Text
            variant="body-2-medium"
            onPress={() => setThinking((value) => !value)}
            accessibilityRole="button"
          >
            {thinking ? 'Finish the reply' : 'Start thinking again'}
          </Text>
        </View>
      </View>
    );
  },
};

/** Votes are kept by the row; extra tiles (read aloud, retry…) follow copy. */
export const Actions: StoryObj = {
  render: () => (
    <View style={{ padding: 24, gap: 16 }}>
      <AgentReplyActions onCopy={() => undefined} />
      <AgentReplyActions vote="up" onCopy={() => undefined} />
      <AgentReplyActions onCopy={() => undefined}>
        <AgentReplyAction icon={RiVolumeUpLine} label="Read aloud" onPress={() => undefined} />
      </AgentReplyActions>
    </View>
  ),
};

/** The header target for one agent, a pair, a trio, and a long team. */
export const Profiles: StoryObj = {
  render: () => (
    <View style={{ padding: 24, gap: 24, alignItems: 'center' }}>
      {[1, 2, 3, 4].map((count) => (
        <AgentProfile key={count} agents={TEAM.slice(0, count)} onPress={() => undefined} />
      ))}
    </View>
  ),
};

/** A list row's leading art: up to three avatars overlapped. */
export const Stack: StoryObj = {
  render: () => (
    <View style={{ padding: 24, flexDirection: 'row', gap: 24 }}>
      {[1, 2, 3].map((count) => (
        <AgentStack key={count} agents={TEAM.slice(0, count)} size={48} />
      ))}
    </View>
  ),
};
