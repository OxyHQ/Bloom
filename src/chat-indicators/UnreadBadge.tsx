import React, { memo, useMemo } from 'react';
import { View } from 'react-native';

import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import type { TypeScaleVariant } from '../typography/scale';
import {
  defaultUnreadLabel,
  formatUnreadCount,
  resolveChatIndicatorPaint,
  UNREAD_BADGE_HEIGHTS,
  UNREAD_DOT_SIZES,
} from './shared';
import type { UnreadBadgeProps, UnreadBadgeSize } from './types';

/**
 * The unread count pill on a conversation row, a tab or a header.
 *
 *            height   type                 min width
 *   small    16       caption-2-semibold   16 (a circle at one digit)
 *   medium   20       caption-1-semibold   20
 *
 * Accent fill with `primaryForeground` on it; `muted` swaps in the neutral
 * fill for a conversation whose notifications are off, so a muted chat still
 * shows a count without competing with the ones that matter.
 *
 * A count of 0 renders NOTHING (returns `null`) — an empty pill is a bug that
 * survives review because it looks deliberate. `dot` is the exception: it draws
 * the plain dot whatever the count, for "there is something here" without a
 * number.
 *
 * Accessibility: one `img` named "3 unread messages" — the digits alone
 * announce as "3", which is not a message count. Pass `formatLabel` to
 * translate it, or `accessibilityLabel` to replace it outright. The drawn text
 * is hidden so the name is not read twice.
 *
 * Above `max` the text reads "99+" while the NAME keeps the real count: the
 * clamp is a layout constraint, not information the caller wanted to lose.
 */

const SIZE_TYPE: Record<UnreadBadgeSize, TypeScaleVariant> = {
  small: 'caption-2-semibold',
  medium: 'caption-1-semibold',
};

function UnreadBadgeComponent({
  count = 0,
  max = 99,
  dot = false,
  muted = false,
  size = 'medium',
  formatLabel,
  accessibilityLabel,
  style,
  textStyle,
  testID,
}: UnreadBadgeProps) {
  const theme = useTheme();
  const paint = useMemo(() => resolveChatIndicatorPaint(theme), [theme]);

  const n = Number.isFinite(count) ? Math.floor(count) : 0;
  if (!dot && n <= 0) return null;

  const fill = muted ? paint.mutedFill : paint.accent;
  const on = muted ? paint.onMuted : paint.onAccent;
  const label = accessibilityLabel ?? (formatLabel ? formatLabel(n) : defaultUnreadLabel(n));

  if (dot) {
    const d = UNREAD_DOT_SIZES[size];
    return (
      <View
        role="img"
        accessibilityLabel={label}
        style={[
          { width: d, height: d, borderRadius: d / 2, backgroundColor: fill, flexShrink: 0 },
          style,
        ]}
        testID={testID}
      />
    );
  }

  const height = UNREAD_BADGE_HEIGHTS[size];
  const text = formatUnreadCount(n, max);
  // Longhands, not `paddingHorizontal`: react-native-web ranks the shorthand it
  // maps that to ABOVE `padding-left`, so a caller's longhand override would be
  // dropped on web and honoured on native.
  const pad = text.length > 1 ? Math.round(height * 0.3) : 0;

  return (
    <View
      role="img"
      accessibilityLabel={label}
      style={[
        {
          height,
          minWidth: height,
          borderRadius: height / 2,
          paddingLeft: pad,
          paddingRight: pad,
          backgroundColor: fill,
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        },
        style,
      ]}
      testID={testID}
    >
      <Text
        variant={SIZE_TYPE[size]}
        importantForAccessibility="no"
        accessibilityElementsHidden
        aria-hidden
        numberOfLines={1}
        style={[{ color: on, lineHeight: height, letterSpacing: 0 }, textStyle]}
      >
        {text}
      </Text>
    </View>
  );
}

export const UnreadBadge = memo(UnreadBadgeComponent);
UnreadBadge.displayName = 'UnreadBadge';
