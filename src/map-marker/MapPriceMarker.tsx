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
 *   geometry   28 tall, full pill, 10 side padding (8 before a heart), 1px hairline
 *   text       body-2-semibold, tabular
 *   default    surface, hairline, shadow-s; hover: the hairline darkens
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

const HEIGHT = 28;

function MapPriceMarkerComponent({
  price,
  state = 'default',
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
    gap: 4,
    height: HEIGHT,
    paddingLeft: saved ? 8 : 10,
    paddingRight: 10,
    borderRadius: HEIGHT / 2,
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
      hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
      testID={testID}
      style={[pillStyle, style]}
    >
      {saved ? (
        <View testID={testID ? `${testID}-saved` : undefined}>
          <RiHeart3Fill width={12} height={12} fill={active ? paint.activeHeart : paint.heart} />
        </View>
      ) : null}
      <Text
        variant="body-2-semibold"
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
