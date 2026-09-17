import React, { memo, useMemo } from 'react';
import { View } from 'react-native';

import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { resolveMessageBubblePaint } from './shared';
import type { UnreadSeparatorProps } from './types';

/**
 * The rule that marks where reading stopped: a hairline in the accent with the
 * label centred on it.
 *
 * It is drawn ONCE, above the first unread message, and it does not move while
 * the transcript is open — the position is the caller's (`unreadBefore` on a
 * list item), because a marker that chased the read state would vanish as soon
 * as it was seen, which is the one moment it is useful.
 */
function UnreadSeparatorComponent({
  label = 'Unread messages',
  style,
  testID,
}: UnreadSeparatorProps) {
  const theme = useTheme();
  const paint = useMemo(() => resolveMessageBubblePaint(theme), [theme]);
  return (
    <View
      accessible
      accessibilityLabel={label}
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          paddingTop: 10,
          paddingBottom: 6,
        },
        style,
      ]}
      testID={testID}
    >
      <View style={{ flex: 1, height: 1, backgroundColor: paint.unreadLine }} />
      <Text variant="caption-1-medium" style={{ color: paint.unread }}>
        {label}
      </Text>
      <View style={{ flex: 1, height: 1, backgroundColor: paint.unreadLine }} />
    </View>
  );
}

export const UnreadSeparator = memo(UnreadSeparatorComponent);
UnreadSeparator.displayName = 'UnreadSeparator';
