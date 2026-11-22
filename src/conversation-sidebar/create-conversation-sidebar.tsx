import { AvatarGroup } from '../avatar-group';
import type React from 'react';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '../button';
import type * as DropdownMenuModule from '../dropdown-menu';
import { useControllableState } from '../hooks/use-controllable-state';
import { RiAddLine } from '../icons/remix/RiAddLine';
import { RiPushpinLine } from '../icons/remix/RiPushpinLine';
import { RiStore2Line } from '../icons/remix/RiStore2Line';
import { useMessages } from '../locale/messages';
import { MULTI_AGENT_CHAT_MESSAGES } from '../multi-agent-chat/messages';
import { Sidebar, SidebarToolbar } from '../sidebar';
import { IS_WEB } from '../styles/platform';
import { createTokenStyles, useColorTokens } from '../theme/color-tokens';
import { TYPE_SCALE, Text } from '../typography';
import type { ConversationSidebarProps } from './types';

interface ConversationSidebarComponents {
  Dropdown: typeof DropdownMenuModule;
  List: typeof import('../list/List')['List'];
}

/** `text-text-white`: white whatever the theme. */
const WHITE = '#fff';

const styles = StyleSheet.create({
  toolButton: { borderWidth: 0, borderRadius: 999, width: '100%', minWidth: 0 },
  createButton: { height: 36, width: '100%', minWidth: 0, borderRadius: 999 },
  createMenu: { width: 323, borderRadius: 20, padding: 6 },
  // Longhands: a desktop row's own geometry is longhand, and a shorthand loses to it.
  createRow: { borderRadius: 14, paddingTop: 8, paddingRight: 8, paddingBottom: 8, paddingLeft: 8 },
  createCopy: { flex: 1, minWidth: 0, flexDirection: 'column' },
  noShadow: { boxShadow: 'none' },
});

const useStyles = createTokenStyles((t) => ({
  // Native: what the tool buttons' classes put on the Button's host.
  toolHost: {
    backgroundColor: t.popover,
    borderStyle: 'solid',
    boxShadow: [],
    color: t.mutedForeground,
  },
  toolHostPressed: { backgroundColor: t.accent },
  createHost: { backgroundColor: t.primary, color: WHITE },
  createLabel: { ...TYPE_SCALE['body-medium'], color: t.foreground },
  createDescription: { ...TYPE_SCALE['body-2-medium'], color: t.mutedForeground },
  // The class's 14px size lost to Text's own; its line height and weight held.
  empty: {
    paddingInline: 8,
    paddingBlock: 24,
    lineHeight: 20,
    fontWeight: 400,
    color: t.mutedForeground,
  },
}));

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
    const t = useColorTokens();
    const themed = useStyles();
    const [toolPressed, setToolPressed] = useState(false);
    // The buttons' old classes painted the Button's host on native (its own paint still inside)
    // and the button itself on the web, so each platform keeps what it drew.
    const toolPaint = IS_WEB
      ? {
          fill: t.popover,
          hoverFill: t.accent,
          color: t.mutedForeground,
          hoverColor: t.mutedForeground,
          style: [styles.toolButton, styles.noShadow],
        }
      : {
          style: [styles.toolButton, themed.toolHost, toolPressed && themed.toolHostPressed],
          onPressIn: () => setToolPressed(true),
          onPressOut: () => setToolPressed(false),
        };
    // The "+" keeps its fill and white glyph in every state.
    const createPaint = IS_WEB
      ? {
          fill: t.primary,
          hoverFill: t.primary,
          color: WHITE,
          hoverColor: WHITE,
          style: styles.createButton,
        }
      : { style: [styles.createButton, themed.createHost] };
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
          {...toolPaint}
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
              {...createPaint}
            />
          </D.DropdownMenuTrigger>
          <D.DropdownMenuContent label={l.createMenu} align="start" style={styles.createMenu}>
            {createOptions.map((option) => (
              <D.DropdownMenuItem
                key={option.key}
                onPress={option.onPress}
                accessibilityLabel={option.label}
                style={styles.createRow}
                leading={option.leading}
              >
                <View style={styles.createCopy}>
                  <Text style={themed.createLabel}>{option.label}</Text>
                  {option.description ? (
                    <Text style={themed.createDescription}>{option.description}</Text>
                  ) : null}
                </View>
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
          {...createPaint}
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
            empty={!after && l.empty ? <Text style={themed.empty}>{l.empty}</Text> : undefined}
            footer={after}
          />
        }
      />
    );
  };
}
