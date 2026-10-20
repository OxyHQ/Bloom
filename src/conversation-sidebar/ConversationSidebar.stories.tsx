import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { View } from 'react-native';
import { AgentAvatar } from '../agent-avatar';
import { AgentStack, type AgentReplyAgent } from '../agent-reply';
import { RiDeleteBinLine } from '../icons/remix/RiDeleteBinLine';
import { RiEditLine } from '../icons/remix/RiEditLine';
import { RiPushpinLine } from '../icons/remix/RiPushpinLine';
import { ConversationSidebar, type ConversationSidebarItem } from './index';

const meta: Meta = {
  id: 'agents-conversation-sidebar',
  title: 'Patterns/Agents/Conversation Sidebar',
  parameters: { controls: { disable: true } },
};
export default meta;
type Story = StoryObj;

const AGENTS: AgentReplyAgent[] = [
  {
    id: 'lumi',
    name: 'Lumi',
    avatar: { shape: 'slender', eyes: 'oval', eyewear: 'none', accessory: 'none', color: 'teal' },
  },
  {
    id: 'atlas',
    name: 'Atlas',
    avatar: { shape: 'shield', eyes: 'oval', eyewear: 'none', accessory: 'none', color: 'violet' },
  },
  {
    id: 'sol',
    name: 'Sol',
    avatar: { shape: 'pocket', eyes: 'oval', eyewear: 'none', accessory: 'none', color: 'cyan' },
  },
];

const CONVERSATIONS: ConversationSidebarItem[] = [
  {
    id: '1',
    title: 'Launch plan',
    description: 'Atlas: two days, one page.',
    agents: AGENTS,
    pinned: true,
  },
  {
    id: '2',
    title: 'Landing page',
    description: 'Give the hero one clear action.',
    agents: [AGENTS[0]!],
  },
  {
    id: '3',
    title: 'Security review',
    description: 'Review access permissions.',
    agents: [AGENTS[1]!],
  },
  { id: '4', title: 'Weekly metrics', description: 'Start a conversation', agents: [AGENTS[2]!] },
];

/** The conversations of an account, with the three tools on top and a context menu on each row. */
export const Default: Story = {
  render: () => {
    const [activeId, setActiveId] = useState('1');
    const [query, setQuery] = useState('');
    const visible = CONVERSATIONS.filter((c) =>
      `${c.title} ${c.description}`.toLowerCase().includes(query.toLowerCase()),
    );
    return (
      <View style={{ height: 560, width: 280 }}>
        <ConversationSidebar
          conversations={visible}
          activeId={activeId}
          onSelect={setActiveId}
          query={query}
          onQueryChange={setQuery}
          onMarketplace={() => {}}
          createOptions={[
            {
              key: 'agent',
              label: 'Create an agent',
              description: 'Customize a new teammate.',
              leading: (
                <AgentAvatar character={{ preset: 'blue_beret', color: 'violet' }} size={32} />
              ),
              onPress: () => {},
            },
            {
              key: 'team',
              label: 'Chat with your agents',
              description: 'Bring your agents into one chat.',
              leading: <AgentStack agents={AGENTS} size={32} />,
              onPress: () => {},
            },
          ]}
          actions={() => [
            { key: 'pin', label: 'Pin', icon: RiPushpinLine },
            { key: 'rename', label: 'Rename', icon: RiEditLine },
            { key: 'delete', label: 'Delete', icon: RiDeleteBinLine, destructive: true },
          ]}
          onAction={() => {}}
        />
      </View>
    );
  },
};
