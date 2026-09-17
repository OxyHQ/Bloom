import React, { memo, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { webDataSet } from '../checkbox/shared';
import { UnreadBadge } from '../chat-indicators';
import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import type { WebCssStyle } from '../styles/web-view-style';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import {
  CHAT_LIST_CSS,
  CHAT_LIST_STYLE_ID,
  IS_WEB,
  resolveChatListPaint,
} from './shared';
import type { ChatFolderTabsProps } from './types';

/**
 * All / Unread / Groups / Channels / Bots, with each folder's unread count.
 *
 * A horizontally scrolling tablist: the selected tab's label takes the text
 * colour and a 2px accent underline sits under it, flush with the strip's
 * hairline. Hover is a colour change only.
 *
 * WHY NOT `CategoryBar`. The two look adjacent and are not: `CategoryBar` is an
 * ICON over a label (its `icon` is required, and it sizes and tints it), it
 * carries no per-item count, and it marks the selection with a heavier label
 * rather than an underline. Adding a badge slot and an icon-less mode to it
 * would make one component answer two shapes; this is 90 lines and says what it
 * is. Both are `role="tablist"`, so an app that wants stays-style icon
 * categories still has one.
 *
 * ACCESSIBILITY: `role="tablist"` named by `accessibilityLabel`; each tab is a
 * `role="tab"` carrying BOTH `aria-selected` (which is all react-native-web
 * reads) and `accessibilityState.selected` (which is all React Native reads),
 * and a name that includes the count — "Unread, 12 unread" — because the badge
 * is a number with no label of its own.
 */

const TAB_HEIGHT = 44;
const UNDERLINE = 2;

function ChatFolderTabsComponent({
  folders,
  value,
  defaultValue,
  onValueChange,
  accessibilityLabel,
  gap = 4,
  paddingHorizontal = 8,
  divider = true,
  style,
  testID,
}: ChatFolderTabsProps) {
  const theme = useTheme();
  useEffect(() => {
    adoptStyleSheet(CHAT_LIST_STYLE_ID, CHAT_LIST_CSS);
  }, []);
  const paint = useMemo(() => resolveChatListPaint(theme), [theme]);
  const [inner, setInner] = useState(defaultValue ?? folders[0]?.key ?? '');
  const [hovered, setHovered] = useState<string | null>(null);
  const selected = value ?? inner;

  const select = (key: string) => {
    if (value === undefined) setInner(key);
    onValueChange?.(key);
  };

  return (
    <View
      style={[
        divider ? { borderBottomWidth: 1, borderBottomColor: paint.divider } : null,
        style,
      ]}
      testID={testID}
    >
      <ScrollView
        {...webDataSet({ bloomChatScrollX: '' })}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          gap,
          paddingLeft: paddingHorizontal,
          paddingRight: paddingHorizontal,
        }}
      >
        <View role="tablist" accessibilityLabel={accessibilityLabel} style={{ flexDirection: 'row', gap }}>
          {folders.map((folder) => {
            const active = folder.key === selected;
            const showCount = (folder.unreadCount ?? 0) > 0;
            const name = showCount
              ? `${folder.label}, ${folder.unreadCount} unread`
              : folder.label;
            const tabStyle: WebCssStyle = {
              height: TAB_HEIGHT,
              paddingLeft: 12,
              paddingRight: 12,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              borderBottomWidth: UNDERLINE,
              borderBottomColor: active ? paint.accent : 'transparent',
              '--bloom-chat-ring': paint.ring,
              ...(IS_WEB
                ? { transitionProperty: 'border-color, color', transitionDuration: '120ms' }
                : null),
            };
            return (
              <Pressable
                key={folder.key}
                {...webDataSet({ bloomChatFocusable: '' })}
                role="tab"
                accessibilityLabel={name}
                aria-selected={active}
                accessibilityState={{ selected: active }}
                onPress={() => select(folder.key)}
                onHoverIn={() => setHovered(folder.key)}
                onHoverOut={() => setHovered((current) => (current === folder.key ? null : current))}
                style={tabStyle}
                testID={testID ? `${testID}-tab-${folder.key}` : undefined}
              >
                <Text
                  variant={active ? 'body-semibold' : 'body-medium'}
                  numberOfLines={1}
                  style={{
                    color: active || hovered === folder.key ? paint.text : paint.textMuted,
                  }}
                >
                  {folder.label}
                </Text>
                {showCount ? (
                  // Hidden: the tab's own name already carries the count, and a
                  // badge that names itself makes the tab announce it twice.
                  <View aria-hidden importantForAccessibility="no-hide-descendants">
                    <UnreadBadge
                      count={folder.unreadCount}
                      muted={folder.muted ?? !active}
                      size="small"
                      testID={testID ? `${testID}-count-${folder.key}` : undefined}
                    />
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

export const ChatFolderTabs = memo(ChatFolderTabsComponent);
ChatFolderTabs.displayName = 'ChatFolderTabs';
