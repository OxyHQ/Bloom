import React, { memo, useMemo } from 'react';
import { Pressable, View } from 'react-native';

import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { resolveMessageBubblePaint } from './shared';
import type { SystemMessageProps } from './types';

/**
 * A service line in the transcript — "Ana joined the group", "You pinned a
 * message", a channel notice. Centred, on the same quiet pill as
 * `DateSeparator`, because they are the same KIND of thing: something the app
 * says about the conversation rather than something a person said in it.
 *
 * It takes `children` as well as `text`, so a line with a bold name or a link
 * inside it does not need a second component.
 *
 * Pressable service lines exist ("tap to view the pinned message"), and when
 * they draw no text of their own — an `icon` and `children` the caller
 * composed — ARIA has nothing to name the button with, so `accessibilityLabel`
 * is required on that branch.
 */
function SystemMessageComponent({
  children,
  text,
  icon,
  onPress,
  accessibilityLabel,
  style,
  testID,
}: SystemMessageProps) {
  const theme = useTheme();
  const paint = useMemo(() => resolveMessageBubblePaint(theme), [theme]);

  const body = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        borderRadius: 999,
        backgroundColor: paint.pillFill,
        paddingTop: 4,
        paddingBottom: 4,
        paddingLeft: 10,
        paddingRight: 10,
        maxWidth: '90%',
      }}
    >
      {icon}
      {children ?? (
        <Text variant="caption-1-regular" style={{ color: paint.pillText, textAlign: 'center' }}>
          {text}
        </Text>
      )}
    </View>
  );

  return (
    <View
      style={[{ alignItems: 'center', paddingTop: 6, paddingBottom: 6 }, style]}
      testID={testID}
    >
      {onPress === undefined ? (
        body
      ) : (
        <Pressable
          role="button"
          accessibilityLabel={accessibilityLabel ?? text}
          onPress={onPress}
          style={{ borderRadius: 999, maxWidth: '90%' }}
        >
          {body}
        </Pressable>
      )}
    </View>
  );
}

export const SystemMessage = memo(SystemMessageComponent);
SystemMessage.displayName = 'SystemMessage';
