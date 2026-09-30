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
import { AgentAvatar, FOLD_CONFIG } from '../agent-avatar';
import { RiAddLine } from '../icons/remix/RiAddLine';
import { RiStore2Line } from '../icons/remix/RiStore2Line';
import { RiCustomerService2Line } from '../icons/remix/RiCustomerService2Line';
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

export function AgentStack({
  agents,
  size = 40,
}: {
  agents: Agent[];
  size?: number;
}) {
  if (agents.length === 1)
    return (
      <AgentAvatar
        config={agents[0]!.avatar}
        size={size}
        label={agents[0]!.name}
      />
    );
  return (
    <StyledView
      className="relative shrink-0"
      style={{ width: size, height: size }}
      accessibilityLabel={agents.map((a) => a.name).join(', ')}
    >
      {agents.slice(0, 3).map((agent, i) => (
        <StyledView
          key={agent.id}
          className="absolute"
          style={{
            left: i === 1 ? size * 0.4 : i === 2 ? size * 0.2 : 0,
            top: i === 2 ? size * 0.4 : 0,
          }}
        >
          <AgentAvatar
            config={agent.avatar}
            size={size * 0.65}
            label={agent.name}
          />
        </StyledView>
      ))}
    </StyledView>
  );
}
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
  const { Dropdown: D, ContextMenu: C } = useChatComponents();
  const { messages: themeMessages } = useMessages(THEME_TOGGLE_MESSAGES);
  return (
    <Sidebar
      accessibilityLabel={messages.conversations}
      testID="multi-agent-chat-sidebar"
      contentPadding={7}
      showSearch={false}
      showThemeToggle={false}
      className="flex h-full min-h-0 w-[260px] shrink-0 flex-col rounded-3xl border border-border-button-white bg-background-secondary-default p-[7px] shadow-sidebar"
      style={{ height: '100%', width: 260, borderRadius: 24 }}
      header={
        <SidebarToolbar
          testID="multi-agent-chat-toolbar"
          search={{
            value: props.query,
            onValueChange: props.onQuery,
            open: props.searchOpen,
            onOpenChange: props.onSearch,
            accessibilityLabel: messages.searchConversations,
            placeholder: messages.searchConversations2,
            closeLabel: messages.closeSearch,
          }}
          actions={[
            <Button
              key="marketplace"
              appearance="subtle"
              tone="neutral"
              iconOnly
              leadingIcon={RiStore2Line}
              accessibilityLabel={messages.marketplace}
              className="w-full min-w-0 rounded-full border-0 bg-background-tertiary-default text-foreground-icon-secondary shadow-none hover:bg-background-tertiary-hover active:bg-background-tertiary-hover"
              style={{ borderWidth: 0, borderRadius: 999, width: '100%' }}
              onPress={props.onMarketplace}
            />,
            <D.DropdownMenu>
              <D.DropdownMenuTrigger asChild style={{ width: '100%' }}>
                <Button
                  iconOnly
                  leadingIcon={RiAddLine}
                  accessibilityLabel={messages.createBotOrChat}
                  className="flex w-full min-w-0 items-center justify-center rounded-full bg-button-primary text-text-white"
                  style={{ height: 36, width: '100%', borderRadius: 999 }}
                />
              </D.DropdownMenuTrigger>
              <D.DropdownMenuContent
                label={messages.create}
                align="start"
                className="w-[323px] rounded-[20px] p-1.5"
                style={{ width: 323, borderRadius: 20, padding: 6 }}
              >
                <D.DropdownMenuItem
                  onPress={props.onCreate}
                  accessibilityLabel={messages.createANewBot}
                  className="rounded-[14px] p-2"
                  style={{ borderRadius: 14, padding: 8 }}
                  leading={
                    <AgentAvatar
                      config={{ ...FOLD_CONFIG, hue: 254, saturation: 66 }}
                      size={32}
                    />
                  }
                >
                  <StyledView className="flex min-w-0 flex-1 flex-col">
                    <Text className="text-body-medium text-text-primary">
                      {messages.createANewBot}
                    </Text>
                    <Text className="text-body-2-medium text-text-tertiary">
                      {messages.customizeANewTeammate}
                    </Text>
                  </StyledView>
                </D.DropdownMenuItem>
                <D.DropdownMenuItem
                  onPress={props.onPicker}
                  accessibilityLabel={messages.chatWithYourAgents}
                  className="rounded-[14px] p-2"
                  style={{ borderRadius: 14, padding: 8 }}
                  leading={
                    <AgentStack agents={props.agents.slice(0, 3)} size={32} />
                  }
                >
                  <StyledView className="flex min-w-0 flex-1 flex-col">
                    <Text className="text-body-medium text-text-primary">
                      {messages.chatWithYourAgents}
                    </Text>
                    <Text className="text-body-2-medium text-text-tertiary">
                      {messages.bringYourAgentsIntoOneChat}
                    </Text>
                  </StyledView>
                </D.DropdownMenuItem>
              </D.DropdownMenuContent>
            </D.DropdownMenu>,
          ]}
        />
      }
      content={
        <StyledView
          className="flex flex-col gap-2"
          accessibilityLabel={messages.chatList}
        >
          {props.chats.map((chat) => {
            const agents = props.agents.filter((a) =>
                chat.agentIds.includes(a.id),
              ),
              last = chat.messages[chat.messages.length - 1];
            const items = [
              [
                'pin',
                chat.pinned ? messages.unpinChat : messages.pinChat,
                RiPushpinLine,
              ],
              ['rename', messages.renameChat, RiEditLine],
              [
                'edit',
                agents.length > 1 ? messages.editGroup : messages.editBot,
                RiGroupLine,
              ],
              ['copy', messages.copyConversation, RiFileCopyLine],
              ['copy-id', messages.copyConversationID, RiHashtag],
              ['remove', messages.removeChat, RiDeleteBinLine],
            ] as const;
            return (
              <C.ContextMenu key={chat.id}>
                <C.ContextMenuTrigger asChild style={{ width: '100%' }}>
                  <SidebarItem
                    accessibilityLabel={chat.customTitle || chat.title}
                    label={
                      chat.customTitle ||
                      (agents.length === 1 ? agents[0]!.name : chat.title)
                    }
                    leading={<AgentStack agents={agents} />}
                    description={
                      props.pending[chat.id]
                        ? messages.thinkingTogether
                        : last
                          ? last.text
                          : messages.startAConversation
                    }
                    selected={props.activeId === chat.id}
                    selectedAppearance="neutral"
                    onPress={() => props.onSelect(chat.id)}
                    badge={
                      chat.pinned ? (
                        <RiPushpinLine
                          accessibilityLabel={messages.pinnedChat}
                          width={14}
                          height={14}
                        />
                      ) : undefined
                    }
                    labelClassName="truncate text-body-medium text-text-primary"
                    descriptionClassName="truncate text-body-regular text-text-tertiary"
                    className={`flex h-[54px] shrink-0 items-center gap-2.5 rounded-xl p-1.5 text-start outline-none focus-visible:ring-2 focus-visible:ring-border-focus-ring ${props.activeId === chat.id ? 'bg-background-tertiary-default' : 'hover:bg-background-secondary-hover'} flex-row`}
                    style={{
                      height: 54,
                      minHeight: 54,
                      borderRadius: 12,
                      paddingLeft: 6,
                      paddingRight: 6,
                      paddingTop: 6,
                      paddingBottom: 6,
                    }}
                  />
                </C.ContextMenuTrigger>
                <C.ContextMenuContent
                  label={messages.chatActions}
                  className="w-52 rounded-[14px] p-1"
                  style={{ width: 208, borderRadius: 14, padding: 4 }}
                >
                  {items.map(([action, label, Icon]) => (
                    <C.ContextMenuItem
                      key={action}
                      onPress={() => props.onAction(chat, action)}
                      leading={<Icon width={20} height={20} />}
                      variant={action === 'remove' ? 'destructive' : undefined}
                      className="px-2 py-1.5 text-body-medium"
                    >
                      {label}
                    </C.ContextMenuItem>
                  ))}
                </C.ContextMenuContent>
              </C.ContextMenu>
            );
          })}
          {!props.chats.length && (
            <Text className="px-2 py-6 text-body-regular text-text-secondary">
              {messages.noConversationsFound}
            </Text>
          )}
        </StyledView>
      }
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
