import React, { memo, useEffect, useMemo } from 'react';
import { Pressable } from 'react-native';

import { bloomShadowStyle } from '../design-tokens/shadows';
import { useInteractionState } from '../hooks/use-interaction-state';
import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import type { WebCssStyle } from '../styles/web-view-style';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { MAP_MARKER_CSS, MAP_MARKER_STYLE_ID, mapWebData, resolveMapMarkerPaint } from './shared';
import type { MapClusterMarkerProps } from './types';

/**
 * A round count bubble standing for several listings.
 *
 *   geometry   36 round (grows sideways for "99+"), 1px hairline
 *   text       body-2-semibold, tabular
 *   default    surface, hairline, shadow-s; hover: the hairline darkens
 *   active     inverted, shadow-m
 *
 * A `button` whose `aria-pressed` is the active state; named
 * "<count> stays" unless `accessibilityLabel` says otherwise.
 */

const SIZE = 36;

function MapClusterMarkerComponent({
  count,
  state = 'default',
  onPress,
  accessibilityLabel,
  style,
  testID,
}: MapClusterMarkerProps) {
  const theme = useTheme();
  const paint = useMemo(() => resolveMapMarkerPaint(theme), [theme]);
  const { state: hovered, onIn, onOut } = useInteractionState();
  useEffect(() => {
    adoptStyleSheet(MAP_MARKER_STYLE_ID, MAP_MARKER_CSS);
  }, []);

  const active = state === 'active';

  const bubbleStyle: WebCssStyle = {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: SIZE,
    height: SIZE,
    paddingLeft: 8,
    paddingRight: 8,
    borderRadius: SIZE / 2,
    borderWidth: 1,
    borderColor: active ? paint.activeFill : hovered ? paint.hoverBorder : paint.border,
    backgroundColor: active ? paint.activeFill : paint.surface,
    '--bloom-map-ring': paint.ring,
    ...bloomShadowStyle(active ? 'm' : 's'),
  };

  return (
    <Pressable
      {...mapWebData({ bloomMapPressable: '', bloomMapCluster: active ? 'active' : 'default' })}
      role="button"
      accessibilityLabel={accessibilityLabel ?? `${count} stays`}
      aria-pressed={active}
      accessibilityState={{ selected: active }}
      onPress={onPress}
      onHoverIn={onIn}
      onHoverOut={onOut}
      hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
      testID={testID}
      style={[bubbleStyle, style]}
    >
      <Text
        variant="body-2-semibold"
        numberOfLines={1}
        style={{ color: active ? paint.activeLabel : paint.label, fontVariant: ['tabular-nums'] }}
      >
        {count}
      </Text>
    </Pressable>
  );
}

export const MapClusterMarker = memo(MapClusterMarkerComponent);
MapClusterMarker.displayName = 'MapClusterMarker';
