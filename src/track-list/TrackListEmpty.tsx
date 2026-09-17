import React, { useMemo } from 'react';
import { View } from 'react-native';

import { Button } from '../button';
import { resolveButtonRamps } from '../button/shared';
import { RiMusic2Line } from '../icons/remix/RiMusic2Line';
import { borderRadius } from '../styles/tokens';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { resolveTrackListPaint } from './shared';
import type { TrackListEmptyProps } from './types';

/**
 * What a track list shows with nothing in it: a 64px round neutral well with
 * an icon, a `title-3-semibold` title, a muted description and an optional
 * primary button. Centred, 360 wide at most.
 */
export function TrackListEmpty({
  icon: Icon = RiMusic2Line,
  title,
  description,
  actionLabel,
  onAction,
  style,
  testID,
}: TrackListEmptyProps) {
  const theme = useTheme();
  const paint = useMemo(() => resolveTrackListPaint(theme), [theme]);
  const { neutral } = resolveButtonRamps(theme);
  return (
    <View
      style={[
        {
          alignItems: 'center',
          paddingTop: 48,
          paddingBottom: 48,
          paddingLeft: 16,
          paddingRight: 16,
        },
        style,
      ]}
      testID={testID}
    >
      <View
        aria-hidden
        importantForAccessibility="no-hide-descendants"
        style={{
          width: 64,
          height: 64,
          borderRadius: borderRadius.full,
          backgroundColor: theme.isDark ? neutral[800] : neutral[100],
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16,
        }}
      >
        <Icon width={28} height={28} fill={paint.textMuted} />
      </View>
      <Text
        variant="title-3-semibold"
        role="heading"
        aria-level={2}
        style={{ color: paint.text, textAlign: 'center', maxWidth: 360 }}
      >
        {title}
      </Text>
      {description ? (
        <Text
          variant="body-regular"
          style={{ color: paint.textMuted, textAlign: 'center', maxWidth: 360, marginTop: 8 }}
        >
          {description}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <Button variant="primary" size="medium" onPress={onAction} style={{ marginTop: 20 }}>
          {actionLabel}
        </Button>
      ) : null}
    </View>
  );
}
