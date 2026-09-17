import React, { memo, useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';

import { webDataSet } from '../styles/web-data';
import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import type { WebCssStyle } from '../styles/web-view-style';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { ChatListItemSkeleton } from './ChatListItemSkeleton';
import { HighlightedText } from './HighlightedText';
import { ChatAvatar, RowLink, SectionHeading } from './parts';
import {
  CHAT_LIST_CSS,
  CHAT_LIST_STYLE_ID,
  CHAT_ROW_GEOMETRY,
  CHAT_ROW_RADIUS,
  DEFAULT_ITEM_LABELS,
  DEFAULT_SEARCH_LABELS,
  IS_WEB,
  chatMarker,
  groupSearchResults,
  resolveChatListPaint,
} from './shared';
import type { ChatSearchResult, ChatSearchResultsProps } from './types';

/**
 * Search hits, grouped Chats / Messages / Contacts.
 *
 * The groups are in a fixed order and an EMPTY group is dropped — a heading over
 * nothing is a dead end. Inside a group the app's own order is kept, so
 * relevance stays the backend's decision.
 *
 * Each row is `ChatListItem`'s compact geometry with the matched run of the name
 * and of the detail line marked in the accent colour (`HighlightedText`). The
 * highlight is COLOUR only; see that component for why.
 *
 * ACCESSIBILITY: a region named `accessibilityLabel`, each group a `role="list"`
 * named by its heading, each row one link/button carrying "name, detail, time".
 */

function ResultRow({
  result,
  query,
  density,
  onPress,
  testID,
}: {
  result: ChatSearchResult;
  query: string;
  density: 'comfortable' | 'compact';
  onPress?: (id: string) => void;
  testID?: string;
}) {
  const theme = useTheme();
  const paint = useMemo(() => resolveChatListPaint(theme), [theme]);
  const [pressed, setPressed] = useState(false);
  const geo = CHAT_ROW_GEOMETRY[density];
  const marker = chatMarker(result.chatKind, result.verified, DEFAULT_ITEM_LABELS);
  const name = [result.name, marker?.label, result.detail, result.time]
    .filter((part): part is string => typeof part === 'string' && part.length > 0)
    .join(', ');

  const rowStyle: WebCssStyle = {
    position: 'relative',
    height: geo.height,
    borderRadius: CHAT_ROW_RADIUS,
    justifyContent: 'center',
    '--bloom-chat-hover': paint.hover,
    '--bloom-chat-selected': paint.selected,
    ...(IS_WEB
      ? { transitionProperty: 'background-color', transitionDuration: '120ms' }
      : { backgroundColor: pressed ? paint.hover : 'transparent' }),
  };

  return (
    <View {...webDataSet({ bloomChatRow: '', selected: 'false' })} style={rowStyle} testID={testID}>
      <RowLink
        name={name}
        onPress={onPress ? () => onPress(result.id) : undefined}
        href={result.href}
        paint={paint}
        onPressedChange={setPressed}
        testID={testID ? `${testID}-link` : undefined}
      />
      <View
        pointerEvents="none"
        aria-hidden
        importantForAccessibility="no-hide-descendants"
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          height: geo.height,
          paddingLeft: geo.paddingHorizontal,
          paddingRight: geo.paddingHorizontal,
        }}
      >
        <ChatAvatar
          name={result.name}
          avatar={result.avatar}
          faces={result.faces}
          status={result.status}
          size={geo.avatar}
          paint={paint}
        />
        <View style={{ flex: 1, minWidth: 0, marginLeft: geo.gap, gap: geo.lineGap }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, minWidth: 0 }}>
            <HighlightedText
              text={result.name}
              query={query}
              variant={geo.nameVariant}
              numberOfLines={1}
              style={{ flexShrink: 1, minWidth: 0 }}
              testID={testID ? `${testID}-name` : undefined}
            />
            {marker ? (
              <marker.icon
                width={geo.glyph}
                height={geo.glyph}
                fill={marker.accent ? paint.accent : paint.textMuted}
              />
            ) : null}
          </View>
          {result.detail !== undefined ? (
            <HighlightedText
              text={result.detail}
              query={query}
              variant={geo.previewVariant}
              color={paint.textMuted}
              numberOfLines={1}
              testID={testID ? `${testID}-detail` : undefined}
            />
          ) : null}
        </View>
        {result.time !== undefined ? (
          <Text
            variant={geo.timeVariant}
            numberOfLines={1}
            style={{ color: paint.textMuted, marginLeft: geo.gap }}
          >
            {result.time}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function ChatSearchResultsComponent({
  query,
  results,
  labels,
  onResultPress,
  loading = false,
  loadingCount = 6,
  density = 'comfortable',
  accessibilityLabel = 'Search results',
  style,
  testID,
}: ChatSearchResultsProps) {
  const theme = useTheme();
  useEffect(() => {
    adoptStyleSheet(CHAT_LIST_STYLE_ID, CHAT_LIST_CSS);
  }, []);
  const paint = useMemo(() => resolveChatListPaint(theme), [theme]);
  const text = useMemo(() => ({ ...DEFAULT_SEARCH_LABELS, ...labels }), [labels]);
  const groups = useMemo(() => groupSearchResults(results), [results]);
  const geo = CHAT_ROW_GEOMETRY[density];

  if (loading) {
    return (
      <View
        role="region"
        accessibilityLabel={accessibilityLabel}
        aria-busy
        accessibilityState={{ busy: true }}
        style={style}
        testID={testID}
      >
        <ChatListItemSkeleton
          count={loadingCount}
          density={density}
          testID={testID ? `${testID}-skeleton` : undefined}
        />
      </View>
    );
  }

  return (
    <View role="region" accessibilityLabel={accessibilityLabel} style={style} testID={testID}>
      {groups.length === 0 ? (
        <View
          style={{
            paddingLeft: geo.paddingHorizontal,
            paddingRight: geo.paddingHorizontal,
            paddingTop: 24,
            paddingBottom: 24,
            alignItems: 'center',
          }}
          testID={testID ? `${testID}-empty` : undefined}
        >
          <Text variant="body-regular" style={{ color: paint.textMuted }}>
            {text.empty}
          </Text>
        </View>
      ) : (
        groups.map((group) => (
          <View key={group.kind}>
            <SectionHeading
              title={text[group.kind]}
              paint={paint}
              paddingHorizontal={geo.paddingHorizontal}
              testID={testID ? `${testID}-heading-${group.kind}` : undefined}
            />
            <View role="list" accessibilityLabel={text[group.kind]}>
              {group.results.map((result) => (
                <ResultRow
                  key={result.id}
                  result={result}
                  query={query}
                  density={density}
                  onPress={onResultPress}
                  testID={testID ? `${testID}-result-${result.id}` : undefined}
                />
              ))}
            </View>
          </View>
        ))
      )}
    </View>
  );
}

export const ChatSearchResults = memo(ChatSearchResultsComponent);
ChatSearchResults.displayName = 'ChatSearchResults';
