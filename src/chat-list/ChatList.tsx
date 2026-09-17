import React, { memo, useEffect, useMemo } from 'react';
import { View } from 'react-native';

import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { ArchivedRow } from './ArchivedRow';
import { ChatListItem } from './ChatListItem';
import { ChatListItemSkeleton } from './ChatListItemSkeleton';
import { SectionHeading } from './parts';
import {
  CHAT_EMPTY_ICON,
  CHAT_LIST_CSS,
  CHAT_LIST_STYLE_ID,
  CHAT_ROW_GEOMETRY,
  resolveChatListPaint,
} from './shared';
import type { ChatListProps, ChatListSection } from './types';

/**
 * The conversations screen's list: sections, an archive row, the rows, and the
 * empty and loading states.
 *
 * `sections` renders each group under its own heading ("Pinned", "All"); the
 * `chats` shorthand is one unlabelled run. The `archived` row is pinned above
 * the first section — it is a destination, not a conversation, so it never sorts
 * in among them.
 *
 * It MAPS every chat, which is right for the few hundred a phone shows. For a
 * longer list render `ChatListItem` yourself inside a virtualised list; every
 * row prop is on `ChatSummary` and nothing here holds list state.
 *
 * `header` and `footer` are where the stories row, the folder tabs and the
 * search field go — they belong to the SCREEN, and putting them inside the list
 * is the only reason the whole thing scrolls as one.
 *
 * ACCESSIBILITY: a `role="list"` named `accessibilityLabel`, each section a
 * nested list named by its heading. While `loading` the region is `aria-busy`
 * and the placeholder rows are hidden, so "loading" is announced once rather
 * than eight times.
 */

function ChatListComponent({
  sections,
  chats,
  density = 'comfortable',
  selectedId,
  onChatPress,
  onChatLongPress,
  onChatAction,
  swipeEnabled,
  archived,
  loading = false,
  loadingCount = 8,
  header,
  footer,
  empty,
  labels,
  accessibilityLabel = 'Chats',
  style,
  testID,
}: ChatListProps) {
  const theme = useTheme();
  useEffect(() => {
    adoptStyleSheet(CHAT_LIST_STYLE_ID, CHAT_LIST_CSS);
  }, []);
  const paint = useMemo(() => resolveChatListPaint(theme), [theme]);
  const geo = CHAT_ROW_GEOMETRY[density];

  const resolved: readonly ChatListSection[] = useMemo(() => {
    if (sections !== undefined) return sections;
    if (chats !== undefined) return [{ key: 'all', chats }];
    return [];
  }, [chats, sections]);

  const total = resolved.reduce((sum, section) => sum + section.chats.length, 0);
  const EmptyIcon = CHAT_EMPTY_ICON;

  const body = loading ? (
    <ChatListItemSkeleton
      count={loadingCount}
      density={density}
      testID={testID ? `${testID}-skeleton` : undefined}
    />
  ) : total === 0 ? (
    (empty ?? (
      <View
        style={{
          paddingLeft: geo.paddingHorizontal,
          paddingRight: geo.paddingHorizontal,
          paddingTop: 48,
          paddingBottom: 48,
          alignItems: 'center',
          gap: 8,
        }}
        testID={testID ? `${testID}-empty` : undefined}
      >
        <EmptyIcon width={32} height={32} fill={paint.heading} />
        <Text variant="headline-semibold" style={{ color: paint.text, textAlign: 'center' }}>
          {labels?.emptyTitle ?? 'No conversations yet'}
        </Text>
        <Text
          variant="body-regular"
          style={{ color: paint.textMuted, textAlign: 'center', maxWidth: 260 }}
        >
          {labels?.emptyDescription ?? 'Start a chat and it will show up here.'}
        </Text>
      </View>
    ))
  ) : (
    resolved.map((section) => (
      <View key={section.key}>
        {section.title !== undefined ? (
          <SectionHeading
            title={section.title}
            paint={paint}
            paddingHorizontal={geo.paddingHorizontal}
            testID={testID ? `${testID}-heading-${section.key}` : undefined}
          />
        ) : null}
        <View
          {...(section.title !== undefined
            ? { role: 'list' as const, accessibilityLabel: section.title }
            : null)}
        >
          {section.chats.map(({ id, ...chat }) => (
            <ChatListItem
              key={id}
              {...chat}
              density={density}
              selected={selectedId === id}
              swipeEnabled={swipeEnabled ?? chat.swipeEnabled}
              onPress={onChatPress ? () => onChatPress(id) : undefined}
              onLongPress={onChatLongPress ? () => onChatLongPress(id) : undefined}
              onAction={onChatAction ? (key) => onChatAction(key, id) : undefined}
              testID={testID ? `${testID}-chat-${id}` : undefined}
            />
          ))}
        </View>
      </View>
    ))
  );

  return (
    <View
      role="list"
      accessibilityLabel={accessibilityLabel}
      {...(loading ? { 'aria-busy': true, accessibilityState: { busy: true } } : null)}
      style={style}
      testID={testID}
    >
      {header}
      {archived !== undefined ? (
        <ArchivedRow
          {...archived}
          density={archived.density ?? density}
          testID={testID ? `${testID}-archived` : undefined}
        />
      ) : null}
      {body}
      {footer}
    </View>
  );
}

export const ChatList = memo(ChatListComponent);
ChatList.displayName = 'ChatList';
