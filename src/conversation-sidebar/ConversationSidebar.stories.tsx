import { AvatarGroup } from '../avatar-group';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { View } from 'react-native';
import { AgentAvatar } from '../agent-avatar';
import type { AgentReplyAgent } from '../agent-reply';
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

/** The conversations of an account, with all three tools on top and a context menu on each row. */
export const Default: Story = {
  render: () => {
    const [activeId, setActiveId] = useState('1');
    const [query, setQuery] = useState('');
    const [conversations, setConversations] = useState(CONVERSATIONS);
    const create = (agents: AgentReplyAgent[]) => {
      const id = `chat-${Date.now()}`;
      setConversations((items) => [...items, { id, title: 'New conversation', agents }]);
      setActiveId(id);
      setQuery('');
    };
    const visible = conversations.filter((c) =>
      `${c.title} ${c.description}`.toLowerCase().includes(query.toLowerCase()),
    );
    return (
      <View style={{ height: 560, width: '100%', maxWidth: 360 }}>
        <ConversationSidebar
          conversations={visible}
          activeId={activeId}
          onSelect={setActiveId}
          query={query}
          onQueryChange={setQuery}
          createOptions={[
            {
              key: 'agent',
              label: 'Create an agent',
              description: 'Customize a new teammate.',
              leading: (
                <AgentAvatar character={{ preset: 'blue_beret', color: 'violet' }} size={32} />
              ),
              onPress: () => create([AGENTS[0]!]),
            },
            {
              key: 'team',
              label: 'Chat with your agents',
              description: 'Bring your agents into one chat.',
              leading: (
                <AvatarGroup
                  layout="conversation"
                  showInitials
                  items={AGENTS.map((agent) => ({
                    id: agent.id,
                    name: agent.name,
                    kind: 'bot',
                    character: agent.avatar,
                  }))}
                  accessibilityLabel={AGENTS.map((agent) => agent.name).join(', ')}
                  size={32}
                />
              ),
              onPress: () => create(AGENTS),
            },
          ]}
          actions={() => [
            { key: 'pin', label: 'Pin', icon: RiPushpinLine },
            { key: 'rename', label: 'Rename', icon: RiEditLine },
            { key: 'delete', label: 'Delete', icon: RiDeleteBinLine, destructive: true },
          ]}
          onAction={(conversation, key) =>
            setConversations((items) =>
              key === 'delete'
                ? items.filter((item) => item.id !== conversation.id)
                : items.map((item) =>
                    item.id !== conversation.id
                      ? item
                      : key === 'pin'
                        ? { ...item, pinned: !item.pinned }
                        : { ...item, title: `${item.title} (renamed)` },
                  ),
            )
          }
        />
      </View>
    );
  },
};

/**
 * As Alia and Gemies draw it: search and "+" only (no store button), and the conversations as
 * titled tree sections, one of contacts (an avatar, a name and their last line) and one of
 * title-only chats, one longer than the sidebar. Each section's title starts where its rows' content does.
 */
export const Sections: Story = {
  render: () => {
    const [selected, setSelected] = useState('c1');
    const [query, setQuery] = useState('');
    return (
      <View style={{ height: 560, width: '100%', maxWidth: 360 }}>
        <ConversationSidebar
          testID="conversation-sidebar"
          conversations={[]}
          query={query}
          onQueryChange={setQuery}
          onSelect={setSelected}
          labels={{ empty: '' }}
          tree={[
            {
              key: 'agents',
              label: 'Your gemies',
              items: AGENTS.map((agent) => ({
                key: agent.id,
                label: agent.name,
                description: 'Last message from them.',
                leading: <AgentAvatar character={agent.avatar} size={32} />,
              })),
            },
            {
              key: 'chats',
              label: 'Chats',
              items: [
                { key: 'c1', label: 'Launch plan', icon: RiPushpinLine, meta: '2h' },
                { key: 'c2', label: 'Landing page', meta: '1d' },
                { key: 'c3', label: 'Security review', meta: '3d' },
                // Longer than the sidebar: one line, cut, and its time still at the row's end.
                {
                  key: 'c4',
                  label: 'Notes from the quarterly planning session with the whole design team',
                  meta: '5d',
                },
              ],
            },
          ]}
          selectedTreeItem={selected}
          onTreeItemPress={(item) => setSelected(item.key)}
        />
      </View>
    );
  },
};
