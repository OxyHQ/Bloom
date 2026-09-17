import React, { memo, useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';

import { webDataSet } from '../styles/web-data';
import { UnreadBadge } from '../chat-indicators';
import { RiArchiveLine } from '../icons/remix/RiArchiveLine';
import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import type { WebCssStyle } from '../styles/web-view-style';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { RowLink } from './parts';
import {
  CHAT_LIST_CSS,
  CHAT_LIST_STYLE_ID,
  CHAT_ROW_GEOMETRY,
  CHAT_ROW_RADIUS,
  IS_WEB,
  resolveChatListPaint,
} from './shared';
import type { ArchivedRowProps } from './types';

/**
 * The archive folder, above the conversations.
 *
 * It is a chat row's geometry with a glyph disc where the avatar goes, so the
 * list keeps one rhythm — the folder is not a different KIND of thing to the
 * eye, just a destination rather than a person. The count is neutral by default:
 * the archive is somewhere you go, not a chat asking for attention.
 */

function ArchivedRowComponent({
  count,
  label = 'Archived',
  icon,
  onPress,
  href,
  density = 'comfortable',
  muted = true,
  style,
  testID,
}: ArchivedRowProps) {
  const theme = useTheme();
  useEffect(() => {
    adoptStyleSheet(CHAT_LIST_STYLE_ID, CHAT_LIST_CSS);
  }, []);
  const paint = useMemo(() => resolveChatListPaint(theme), [theme]);
  const [pressed, setPressed] = useState(false);
  const geo = CHAT_ROW_GEOMETRY[density];
  const showCount = (count ?? 0) > 0;
  const name = showCount
    ? `${label}, ${count} ${count === 1 ? 'chat' : 'chats'}`
    : label;

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
    <View
      {...webDataSet({ bloomChatRow: '', selected: 'false' })}
      style={[rowStyle, style]}
      testID={testID}
    >
      <RowLink
        name={name}
        onPress={onPress}
        href={href}
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
        <View
          style={{
            width: geo.avatar,
            height: geo.avatar,
            borderRadius: geo.avatar / 2,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: paint.hover,
          }}
        >
          {icon ?? (
            <RiArchiveLine
              width={Math.round(geo.avatar * 0.45)}
              height={Math.round(geo.avatar * 0.45)}
              fill={paint.heading}
            />
          )}
        </View>
        <View style={{ flex: 1, minWidth: 0, marginLeft: geo.gap }}>
          <Text
            variant={geo.nameVariant}
            numberOfLines={1}
            style={{ color: paint.text }}
            testID={testID ? `${testID}-label` : undefined}
          >
            {label}
          </Text>
        </View>
        {showCount ? (
          <UnreadBadge
            count={count}
            muted={muted}
            size={density === 'compact' ? 'small' : 'medium'}
            style={{ marginLeft: geo.gap }}
            testID={testID ? `${testID}-count` : undefined}
          />
        ) : null}
      </View>
    </View>
  );
}

export const ArchivedRow = memo(ArchivedRowComponent);
ArchivedRow.displayName = 'ArchivedRow';
