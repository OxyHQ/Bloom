import React, { memo, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';

import { resolveButtonRamps } from '../button/shared';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { DEVICE_GLYPHS } from './device-icons';
import type { ConnectBannerProps } from './types';

export const CONNECT_BANNER_HEIGHT = 28;

/**
 * The thin accent strip that says playback is on another device:
 * "Listening on Living Room Speaker".
 *
 *   28 tall, full width, accent-500 fill (hover accent-600, dark 400),
 *   `primaryForeground` glyph (16) and `caption-1-medium` label, centred.
 *
 * With `onPress` it is a button (it opens the device picker) whose name is the
 * sentence it draws; without, a plain text strip.
 */
function ConnectBannerComponent({
  deviceName,
  kind = 'speaker',
  label = 'Listening on',
  onPress,
  style,
  testID,
}: ConnectBannerProps) {
  const theme = useTheme();
  const { accent } = useMemo(() => resolveButtonRamps(theme), [theme]);
  const [hovered, setHovered] = useState(false);
  const Glyph = DEVICE_GLYPHS[kind];
  const text = `${label} ${deviceName}`;
  const fg = theme.colors.primaryForeground;
  const bg = hovered && onPress ? (theme.isDark ? accent[400] : accent[600]) : accent[500];

  const body = (
    <View
      style={{
        height: CONNECT_BANNER_HEIGHT,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingLeft: 16,
        paddingRight: 16,
        backgroundColor: bg,
      }}
    >
      <View pointerEvents="none">
        <Glyph width={16} height={16} fill={fg} />
      </View>
      <Text variant="caption-1-medium" numberOfLines={1} style={{ color: fg, flexShrink: 1 }}>
        {text}
      </Text>
    </View>
  );

  if (!onPress) {
    return (
      <View style={style} testID={testID}>
        {body}
      </View>
    );
  }
  return (
    <Pressable
      role="button"
      accessibilityLabel={text}
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={style}
      testID={testID}
    >
      {body}
    </Pressable>
  );
}

export const ConnectBanner = memo(ConnectBannerComponent);
ConnectBanner.displayName = 'ConnectBanner';
