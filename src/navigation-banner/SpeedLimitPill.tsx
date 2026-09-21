import React, { memo, useMemo } from 'react';
import { View } from 'react-native';

import { bloomShadowStyle } from '../design-tokens/shadows';
import { resolveMapMarkerPaint } from '../map-marker/shared';
import { resolveAccentColors } from '../theme/accent-colors';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { NAVIGATION_BANNER_GEOMETRY } from './constants';
import { describeSpeedLimit, resolveNavigationPaint } from './shared';
import type { SpeedLimitPillProps } from './types';

/**
 * THE POSTED LIMIT: a round sign, small enough to sit beside the guidance and
 * legible enough to read off a windscreen mount.
 *
 *   sign      48 round with a 4 ring in the tone, on the SAME chrome surface
 *             every floating map piece paints, with `shadow-s` — so it reads on
 *             a satellite tile as well as on a pale street map
 *   number    `title-3-bold`, TABULAR, one line, never truncated
 *   unit      `caption-2-medium` under the sign, quiet
 *
 * ── `exceeded` FILLS THE SIGN, IT DOES NOT BRIGHTEN IT ──────────────────────
 *
 * A sign that only changed shade is a sign a driver reads as the same sign; the
 * change has to be one that survives a glance, in daylight, at an angle. So
 * over the limit the ring's tone becomes the FILL and the number takes that
 * fill's own on-colour, which is the pair `resolveAccentColors` already
 * guarantees is legible. Nothing moves, and nothing flashes: a warning that
 * animates in a car is a warning that asks for attention the road needs.
 *
 * The sign is a CIRCLE because it is a sign, not a capsule of text — the pill
 * rung is for button-like controls and this is not one.
 */
function SpeedLimitPillComponent({
  limit,
  unit,
  exceeded = false,
  tone = 'error',
  accessibilityLabel,
  exceededLabel,
  style,
  testID,
}: SpeedLimitPillProps) {
  const theme = useTheme();
  const paint = useMemo(() => resolveNavigationPaint(theme), [theme]);
  const map = useMemo(() => resolveMapMarkerPaint(theme), [theme]);
  const solid = resolveAccentColors(theme.colors, tone, 'solid');
  const g = NAVIGATION_BANNER_GEOMETRY;

  return (
    <View
      role="img"
      accessibilityLabel={
        accessibilityLabel ?? describeSpeedLimit({ limit, unit, exceeded, exceededLabel })
      }
      testID={testID}
      style={[{ alignItems: 'center', gap: 2 }, style]}
    >
      <View
        testID={testID ? `${testID}-sign` : undefined}
        style={{
          width: g.sign,
          height: g.sign,
          borderRadius: g.sign / 2,
          borderWidth: g.signRing,
          borderColor: solid.background,
          backgroundColor: exceeded ? solid.background : map.surface,
          alignItems: 'center',
          justifyContent: 'center',
          ...bloomShadowStyle('s'),
        }}
      >
        <Text
          variant="title-3-bold"
          numberOfLines={1}
          style={{
            color: exceeded ? solid.foreground : paint.text,
            fontVariant: ['tabular-nums'],
          }}
        >
          {limit}
        </Text>
      </View>
      {unit ? (
        <Text
          variant="caption-2-medium"
          numberOfLines={1}
          testID={testID ? `${testID}-unit` : undefined}
          style={{ color: paint.textTertiary }}
        >
          {unit}
        </Text>
      ) : null}
    </View>
  );
}

export const SpeedLimitPill = memo(SpeedLimitPillComponent);
SpeedLimitPill.displayName = 'SpeedLimitPill';
