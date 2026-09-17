import React, { memo, useEffect, useMemo } from 'react';
import { Pressable, View } from 'react-native';

import { bloomShadowStyle } from '../design-tokens/shadows';
import { useInteractionState } from '../hooks/use-interaction-state';
import { RiHeart3Fill } from '../icons/remix/RiHeart3Fill';
import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import type { WebCssStyle } from '../styles/web-view-style';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { MAP_MARKER_CSS, MAP_MARKER_STYLE_ID, mapWebData, resolveMapMarkerPaint } from './shared';
import type { MapPriceMarkerProps } from './types';

/**
 * A price pill for the app's own map.
 *
 *   default    28 tall, 10 side padding (8 before a heart), body-2-semibold,
 *              12px heart
 *   compact    22 tall, 8 side padding (6 before a heart), caption-1-semibold,
 *              10px heart — for a dense map
 *   both       full pill, 1px hairline, tabular figures, never truncated: the
 *              app passes a SHORT price ("€240K", "€950/mo")
 *   at rest    surface, hairline, shadow-s; hover: the hairline darkens
 *   active     inverted fill and label, no hairline, shadow-m
 *   visited    muted fill and secondary label, shadow-s
 *   saved      a 12px heart before the price
 *
 * It paints no pointer and positions nothing: the app places it with its map
 * (centre it on the coordinate) and raises the active one above its
 * neighbours. It is a `button` whose `aria-pressed` (and native
 * `accessibilityState.selected`) is the active state, named by
 * `accessibilityLabel`.
 */

const GEOMETRY = {
  default: { height: 28, padding: 10, heartPadding: 8, heart: 12, gap: 4, type: 'body-2-semibold' },
  compact: { height: 22, padding: 8, heartPadding: 6, heart: 10, gap: 3, type: 'caption-1-semibold' },
} as const;

function MapPriceMarkerComponent({
  price,
  state = 'default',
  size = 'default',
  saved = false,
  onPress,
  accessibilityLabel,
  style,
  testID,
}: MapPriceMarkerProps) {
  const theme = useTheme();
  const paint = useMemo(() => resolveMapMarkerPaint(theme), [theme]);
  const { state: hovered, onIn, onOut } = useInteractionState();
  useEffect(() => {
    adoptStyleSheet(MAP_MARKER_STYLE_ID, MAP_MARKER_CSS);
  }, []);

  const geometry = GEOMETRY[size];
  const active = state === 'active';
  const visited = state === 'visited';

  const fill = active ? paint.activeFill : visited ? paint.visitedFill : paint.surface;
  const border = active
    ? paint.activeFill
    : hovered
      ? paint.hoverBorder
      : visited
        ? paint.visitedBorder
        : paint.border;
  const label = active ? paint.activeLabel : visited ? paint.visitedLabel : paint.label;

  const pillStyle: WebCssStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    gap: geometry.gap,
    height: geometry.height,
    paddingLeft: saved ? geometry.heartPadding : geometry.padding,
    paddingRight: geometry.padding,
    borderRadius: geometry.height / 2,
    borderWidth: 1,
    borderColor: border,
    backgroundColor: fill,
    '--bloom-map-ring': paint.ring,
    ...bloomShadowStyle(active ? 'm' : 's'),
  };

  return (
    <Pressable
      {...mapWebData({ bloomMapPressable: '', bloomMapMarker: state })}
      role="button"
      accessibilityLabel={accessibilityLabel ?? price}
      aria-pressed={active}
      accessibilityState={{ selected: active }}
      onPress={onPress}
      onHoverIn={onIn}
      onHoverOut={onOut}
      hitSlop={size === 'compact' ? { top: 11, bottom: 11, left: 4, right: 4 } : { top: 8, bottom: 8, left: 4, right: 4 }}
      testID={testID}
      style={[pillStyle, style]}
    >
      {saved ? (
        <View testID={testID ? `${testID}-saved` : undefined}>
          <RiHeart3Fill width={geometry.heart} height={geometry.heart} fill={active ? paint.activeHeart : paint.heart} />
        </View>
      ) : null}
      <Text
        variant={geometry.type}
        numberOfLines={1}
        style={{ color: label, fontVariant: ['tabular-nums'] }}
      >
        {price}
      </Text>
    </Pressable>
  );
}

export const MapPriceMarker = memo(MapPriceMarkerComponent);
MapPriceMarker.displayName = 'MapPriceMarker';
