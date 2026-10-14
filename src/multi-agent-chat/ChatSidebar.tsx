import { MULTI_AGENT_CHAT_MESSAGES } from './messages';
import { useMessages } from '../locale/messages';
import { THEME_TOGGLE_MESSAGES } from '../theme-toggle/messages';
import { RiBankLine } from '../icons/remix/RiBankLine';
import { RiFolder6Line } from '../icons/remix/RiFolder6Line';
import { RiMessage2Line } from '../icons/remix/RiMessage2Line';
import { RiBankCardLine } from '../icons/remix/RiBankCardLine';
import { RiSchoolLine } from '../icons/remix/RiSchoolLine';
import { RiBox3Line } from '../icons/remix/RiBox3Line';
import { RiNotification3Line } from '../icons/remix/RiNotification3Line';
import { RiShieldUserLine } from '../icons/remix/RiShieldUserLine';
import { RiLogoutBoxRLine } from '../icons/remix/RiLogoutBoxRLine';
import { RiPaletteLine } from '../icons/remix/RiPaletteLine';
import React from 'react';
import { Button } from '../button';
import { AgentAvatar } from '../agent-avatar';
import { RiAddLine } from '../icons/remix/RiAddLine';
import { RiStore2Line } from '../icons/remix/RiStore2Line';
import { RiCustomerService2Line } from '../icons/remix/RiCustomerService2Line';
import { AgentStack } from '../agent-reply';
import { RiSettings3Line } from '../icons/remix/RiSettings3Line';
import { RiPushpinLine } from '../icons/remix/RiPushpinLine';
import { RiEditLine } from '../icons/remix/RiEditLine';
import { RiGroupLine } from '../icons/remix/RiGroupLine';
import { RiFileCopyLine } from '../icons/remix/RiFileCopyLine';
import { RiHashtag } from '../icons/remix/RiHashtag';
import { RiDeleteBinLine } from '../icons/remix/RiDeleteBinLine';
import { StyledView } from '../styles/styled-primitives';
import { Text } from '../typography';
import { Sidebar, SidebarItem, SidebarToolbar } from '../sidebar';
import { ThemeToggle } from '../theme-toggle';
import { useChatComponents } from './context';
import type { Agent, Conversation } from './data';

export interface ChatSidebarProps {
  agents: Agent[];
  chats: Conversation[];
  activeId: string;
  pending: Record<string, string>;
  query: string;
  searchOpen: boolean;
  onQuery: (query: string) => void;
  onSearch: (open: boolean) => void;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onPicker: () => void;
  onMarketplace: () => void;
  onSettings: () => void;
  onSupport: () => void;
  onAction: (
    chat: Conversation,
    action: 'pin' | 'rename' | 'edit' | 'copy' | 'copy-id' | 'remove',
  ) => void;
}
export function ChatSidebar(props: ChatSidebarProps) {
  const { messages } = useMessages(MULTI_AGENT_CHAT_MESSAGES);
  const { messages: themeMessages } = useMessages(THEME_TOGGLE_MESSAGES);
  const { ConversationSidebar } = useChatComponents();
  const chats = new Map(props.chats.map((chat) => [chat.id, chat]));
  const items = props.chats.map((chat) => {
    const agents = props.agents.filter((a) => chat.agentIds.includes(a.id));
    const last = chat.messages[chat.messages.length - 1];
    return {
      id: chat.id,
      title: chat.customTitle || (agents.length === 1 ? agents[0]!.name : chat.title),
      description: props.pending[chat.id]
        ? messages.thinkingTogether
        : last
          ? last.text
          : messages.startAConversation,
      agents,
      pinned: chat.pinned,
    };
  });
  return (
    <ConversationSidebar
      testID="multi-agent-chat-sidebar"
      // The template's panel has no logo or collapse control: the tools are its whole top.
      header={false}
      // The template's card: a 260 wide, rounded, bordered panel with its own shadow.
      className="flex h-full min-h-0 w-[260px] shrink-0 flex-col rounded-3xl border border-border-button-white bg-background-secondary-default p-[7px] shadow-sidebar"
      style={{ height: '100%', width: 260, borderRadius: 24 }}
      conversations={items}
      activeId={props.activeId}
      onSelect={props.onSelect}
      query={props.query}
      onQueryChange={props.onQuery}
      searchOpen={props.searchOpen}
      onSearchOpenChange={props.onSearch}
      onMarketplace={props.onMarketplace}
      createOptions={[
        {
          key: 'create',
          label: messages.createANewBot,
          description: messages.customizeANewTeammate,
          leading: <AgentAvatar character={{ preset: 'blue_beret', color: 'violet' }} size={32} />,
          onPress: props.onCreate,
        },
        {
          key: 'picker',
          label: messages.chatWithYourAgents,
          description: messages.bringYourAgentsIntoOneChat,
          leading: <AgentStack agents={props.agents.slice(0, 3)} size={32} />,
          onPress: props.onPicker,
        },
      ]}
      actions={(item) => {
        const chat = chats.get(item.id);
        const group = (chat?.agentIds.length ?? 0) > 1;
        return [
          {
            key: 'pin',
            label: chat?.pinned ? messages.unpinChat : messages.pinChat,
            icon: RiPushpinLine,
          },
          { key: 'rename', label: messages.renameChat, icon: RiEditLine },
          { key: 'edit', label: group ? messages.editGroup : messages.editBot, icon: RiGroupLine },
          { key: 'copy', label: messages.copyConversation, icon: RiFileCopyLine },
          { key: 'copy-id', label: messages.copyConversationID, icon: RiHashtag },
          { key: 'remove', label: messages.removeChat, icon: RiDeleteBinLine, destructive: true },
        ];
      }}
      onAction={(item, action) => {
        const chat = chats.get(item.id);
        if (chat) props.onAction(chat, action as Parameters<ChatSidebarProps['onAction']>[1]);
      }}
      secondaryItems={[
        {
          key: 'support',
          label: messages.support,
          icon: RiCustomerService2Line,
          onPress: props.onSupport,
          style: { height: 36, minHeight: 36, paddingTop: 8, paddingBottom: 8 },
          className:
            'justify-start bg-transparent text-text-secondary hover:bg-background-secondary-hover active:bg-background-secondary-hover',
        },
        {
          key: 'settings',
          label: messages.settings,
          icon: RiSettings3Line,
          onPress: props.onSettings,
          style: { height: 36, minHeight: 36, paddingTop: 8, paddingBottom: 8 },
          className:
            'justify-start bg-transparent text-text-secondary hover:bg-background-secondary-hover active:bg-background-secondary-hover',
        },
      ]}
      team={{
        name: 'Bloom team',
        email: 'team@oxy.so',
        avatar: { initials: 'B', color: 'blue' },
        footer: { label: messages.bloom },
        groups: [
          {
            id: 'workspace',
            items: [
              {
                key: 'profile',
                label: messages.viewTeamProfile,
                icon: RiBankLine,
              },
              { key: 'folders', label: messages.folders, icon: RiFolder6Line },
              {
                key: 'messages',
                label: messages.messages,
                icon: RiMessage2Line,
                badge: '94',
              },
              { key: 'people', label: messages.people, icon: RiGroupLine },
            ],
          },
          {
            id: 'company',
            label: messages.company,
            items: [
              { key: 'billing', label: messages.billing, icon: RiBankCardLine },
              {
                key: 'details',
                label: messages.companyDetails,
                icon: RiSchoolLine,
              },
              {
                key: 'integrations',
                label: messages.integrations,
                icon: RiBox3Line,
              },
            ],
          },
          {
            id: 'personal',
            label: messages.personal,
            items: [
              {
                key: 'notifications',
                label: messages.notifications,
                icon: RiNotification3Line,
              },
              {
                key: 'account',
                label: messages.accountDetails,
                icon: RiShieldUserLine,
              },
              {
                key: 'sign-out',
                label: messages.signOut,
                icon: RiLogoutBoxRLine,
              },
            ],
            content: (
              <StyledView className="flex w-full items-center justify-between gap-2.5 rounded-2lg px-2 py-1 flex-row">
                <StyledView className="flex min-w-0 flex-1 items-center gap-2 flex-row">
                  <RiPaletteLine width={20} height={20} />
                  <Text className="truncate text-body-medium text-text-primary">
                    {themeMessages.theme}
                  </Text>
                </StyledView>
                <ThemeToggle variant="segmented" />
              </StyledView>
            ),
          },
        ],
      }}
    />
  );
}
