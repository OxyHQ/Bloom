import { AvatarGroup } from '../avatar-group';
import type React from 'react';
import { View } from 'react-native';

import { Button } from '../button';
import type * as DropdownMenuModule from '../dropdown-menu';
import { useControllableState } from '../hooks/use-controllable-state';
import { RiAddLine } from '../icons/remix/RiAddLine';
import { RiPushpinLine } from '../icons/remix/RiPushpinLine';
import { RiStore2Line } from '../icons/remix/RiStore2Line';
import { useMessages } from '../locale/messages';
import { MULTI_AGENT_CHAT_MESSAGES } from '../multi-agent-chat/messages';
import { Sidebar, SidebarToolbar } from '../sidebar';
import { StyledView } from '../styles/styled-primitives';
import { Text } from '../typography';
import type { ConversationSidebarProps } from './types';

interface ConversationSidebarComponents {
  Dropdown: typeof DropdownMenuModule;
  List: typeof import('../list/List')['List'];
}

const TOOL_BUTTON_CLASS =
  'w-full min-w-0 rounded-full border-0 bg-background-tertiary-default text-foreground-icon-secondary shadow-none hover:bg-background-tertiary-hover active:bg-background-tertiary-hover';

/**
 * `ConversationSidebar` for a platform: `Dropdown` and `ContextMenu` are platform-forked, so the
 * entry files (`index.ts` / `index.web.ts`) hand over the right ones; the body is single-source.
 */
export function createConversationSidebar({ Dropdown: D, List }: ConversationSidebarComponents) {
  return function ConversationSidebar({
    conversations,
    activeId,
    onSelect,
    query: queryProp,
    onQueryChange,
    searchOpen: searchOpenProp,
    onSearchOpenChange,
    onMarketplace,
    onCreate,
    createOptions,
    actions,
    onAction,
    labels: labelOverrides,
    heading,
    after,
    ...sidebar
  }: ConversationSidebarProps) {
    const { messages } = useMessages(MULTI_AGENT_CHAT_MESSAGES);
    const l = {
      conversations: messages.conversations,
      search: messages.searchConversations,
      searchPlaceholder: messages.searchConversations2,
      closeSearch: messages.closeSearch,
      marketplace: messages.marketplace,
      create: messages.createBotOrChat,
      createMenu: messages.create,
      list: messages.chatList,
      empty: messages.noConversationsFound,
      pinned: messages.pinnedChat,
      actions: messages.chatActions,
      ...labelOverrides,
    };
    const [query, setQuery] = useControllableState({
      value: queryProp,
      defaultValue: '',
      onChange: onQueryChange,
    });
    const [searchOpen, setSearchOpen] = useControllableState({
      value: searchOpenProp,
      defaultValue: false,
      onChange: onSearchOpenChange,
    });

    const toolButtons = [
      onMarketplace ? (
        <Button
          key="marketplace"
          appearance="subtle"
          tone="neutral"
          iconOnly
          leadingIcon={RiStore2Line}
          accessibilityLabel={l.marketplace}
          className={TOOL_BUTTON_CLASS}
          style={{ borderWidth: 0, borderRadius: 999, width: '100%' }}
          onPress={onMarketplace}
        />
      ) : null,
      createOptions?.length ? (
        <D.DropdownMenu key="create">
          <D.DropdownMenuTrigger asChild style={{ width: '100%' }}>
            <Button
              iconOnly
              leadingIcon={RiAddLine}
              accessibilityLabel={l.create}
              className="flex w-full min-w-0 items-center justify-center rounded-full bg-button-primary text-text-white"
              style={{ height: 36, width: '100%', borderRadius: 999 }}
            />
          </D.DropdownMenuTrigger>
          <D.DropdownMenuContent
            label={l.createMenu}
            align="start"
            className="w-[323px] rounded-[20px] p-1.5"
            style={{ width: 323, borderRadius: 20, padding: 6 }}
          >
            {createOptions.map((option) => (
              <D.DropdownMenuItem
                key={option.key}
                onPress={option.onPress}
                accessibilityLabel={option.label}
                className="rounded-[14px] p-2"
                style={{ borderRadius: 14, padding: 8 }}
                leading={option.leading}
              >
                <StyledView className="flex min-w-0 flex-1 flex-col">
                  <Text className="text-body-medium text-text-primary">{option.label}</Text>
                  {option.description ? (
                    <Text className="text-body-2-medium text-text-tertiary">
                      {option.description}
                    </Text>
                  ) : null}
                </StyledView>
              </D.DropdownMenuItem>
            ))}
          </D.DropdownMenuContent>
        </D.DropdownMenu>
      ) : onCreate ? (
        <Button
          key="create"
          iconOnly
          leadingIcon={RiAddLine}
          accessibilityLabel={l.create}
          className="flex w-full min-w-0 items-center justify-center rounded-full bg-button-primary text-text-white"
          style={{ height: 36, width: '100%', borderRadius: 999 }}
          onPress={onCreate}
        />
      ) : null,
    ].filter((button): button is React.ReactElement => button !== null);

    return (
      <Sidebar
        accessibilityLabel={l.conversations}
        contentPadding={7}
        showSearch={false}
        showThemeToggle={false}
        {...sidebar}
        // Under the panel's own header (logo, account, collapse control), which stays; a rail has
        // no room for the tools (search, then the store and "+" buttons the app passes).
        toolbar={({ collapsed }) =>
          collapsed ? null : (
            <SidebarToolbar
              search={{
                value: query,
                onValueChange: setQuery,
                open: searchOpen,
                onOpenChange: setSearchOpen,
                accessibilityLabel: l.search,
                placeholder: l.searchPlaceholder,
                closeLabel: l.closeSearch,
              }}
              actions={toolButtons}
            />
          )
        }
        content={
          <List
            accessibilityLabel={l.list}
            sections={[
              {
                id: 'conversations',
                title: heading,
                items: conversations.map((conversation) => ({
                  id: conversation.id,
                  label: [
                    conversation.title,
                    conversation.description,
                    conversation.pinned ? l.pinned : null,
                  ]
                    .filter(Boolean)
                    .join(', '),
                  title: conversation.title,
                  supporting: conversation.description,
                  leading: (
                    <View pointerEvents="none" aria-hidden>
                      <AvatarGroup
                        layout="conversation"
                        showInitials
                        items={conversation.agents.map((agent) => ({
                          id: agent.id,
                          name: agent.name,
                          kind: 'bot' as const,
                          character: agent.avatar,
                        }))}
                        size={36}
                      />
                    </View>
                  ),
                  trailing: conversation.pinned ? (
                    <View pointerEvents="none" aria-hidden>
                      <RiPushpinLine width={14} height={14} />
                    </View>
                  ) : undefined,
                  active: activeId === conversation.id,
                  onPress: () => onSelect(conversation.id),
                  actions: actions?.(conversation).map(({ key, label, icon, destructive }) => ({
                    key,
                    label,
                    icon,
                    tone: destructive ? ('negative' as const) : ('neutral' as const),
                    onPress: () => onAction?.(conversation, key),
                  })),
                })),
              },
            ]}
            empty={
              !after && l.empty ? (
                <Text className="px-2 py-6 text-body-regular text-text-secondary">{l.empty}</Text>
              ) : undefined
            }
            footer={after}
          />
        }
      />
    );
  };
}
