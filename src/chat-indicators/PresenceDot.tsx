import React, { memo, useMemo } from 'react';
import { View } from 'react-native';

import { useTheme } from '../theme/use-theme';
import { PRESENCE_DOT_SIZES, PRESENCE_LABELS, resolveChatIndicatorPaint } from './shared';
import type { PresenceDotProps, PresenceStatus } from './types';

/**
 * The status dot beside a name or on an avatar.
 *
 * Four states, told apart by hue AND shape: `online` a filled success dot,
 * `idle` warning, `busy` negative, `offline` a HOLLOW neutral ring — colour
 * alone is not a distinction for everyone reading the row.
 *
 * The dot draws a ring of the SURFACE colour around itself so it survives over
 * a photo. That ring is outside the dot, so the footprint is
 * `size + 2 * ringWidth`; `AvatarPresence` reserves the same box.
 *
 * Accessibility: one `img` named per status ("Online", "Away", "Offline",
 * "Busy"). Pass `accessibilityLabel=""` where the row already says it.
 */

function fillFor(status: PresenceStatus, paint: ReturnType<typeof resolveChatIndicatorPaint>) {
  switch (status) {
    case 'online':
      return paint.online;
    case 'idle':
      return paint.idle;
    case 'busy':
      return paint.busy;
    case 'offline':
    default:
      return paint.offline;
  }
}

function PresenceDotComponent({
  status,
  size = 'medium',
  ringColor,
  ringWidth = 2,
  accessibilityLabel,
  style,
  testID,
}: PresenceDotProps) {
  const theme = useTheme();
  const paint = useMemo(() => resolveChatIndicatorPaint(theme), [theme]);

  const dot = PRESENCE_DOT_SIZES[size] ?? PRESENCE_DOT_SIZES.medium;
  const ring = Math.max(0, ringWidth);
  const outer = dot + ring * 2;
  const surface = ringColor ?? paint.surface;
  const hollow = status === 'offline';
  // The hollow ring has to stay visible at 8px: a 1px stroke disappears on a
  // 2x screen, so it scales with the dot and never goes under 1.5.
  const strokeWidth = Math.max(1.5, Math.round(dot * 0.2 * 2) / 2);

  const label = accessibilityLabel ?? PRESENCE_LABELS[status];
  const hidden = label === '';

  return (
    <View
      accessible={!hidden}
      aria-hidden={hidden || undefined}
      role={hidden ? undefined : 'img'}
      accessibilityLabel={hidden ? undefined : label}
      style={[
        {
          width: outer,
          height: outer,
          borderRadius: outer / 2,
          backgroundColor: surface,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
      testID={testID}
    >
      <View
        style={{
          width: dot,
          height: dot,
          borderRadius: dot / 2,
          backgroundColor: hollow ? surface : fillFor(status, paint),
          borderWidth: hollow ? strokeWidth : 0,
          borderColor: hollow ? paint.offline : undefined,
        }}
      />
    </View>
  );
}

export const PresenceDot = memo(PresenceDotComponent);
PresenceDot.displayName = 'PresenceDot';
