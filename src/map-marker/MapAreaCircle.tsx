import React, { memo, useMemo } from 'react';
import { View, type ViewStyle } from 'react-native';

import { bloomShadowStyle } from '../design-tokens/shadows';
import { borderRadius } from '../styles/tokens';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { AREA_BORDER_WIDTH, AREA_FILL_OPACITY, resolveMapMarkerPaint } from './shared';
import type { MapAreaCircleProps } from './types';

/**
 * The approximate location of a listing whose exact address is private: a
 * circle the app sizes from its own map projection.
 *
 *   circle   2 × radius square, round; the accent at 15% as the fill and a
 *            1.5px accent edge (accent-500; dark accent-400)
 *   label    optional, centred: a 24 tall surface pill, caption-1-semibold,
 *            hairline and shadow-s — the price pill's family
 *
 * The fill is a separate layer at `opacity: 0.15` rather than a colour with
 * alpha, so the edge stays solid and no colour is derived from a token.
 *
 * It never takes a press (`pointerEvents="none"`): the map under it keeps its
 * gestures. Like the markers it positions nothing — centre it on the
 * coordinate. With `accessibilityLabel` it is an `img`; otherwise decorative.
 */

const LABEL_HEIGHT = 24;

function MapAreaCircleComponent({ radius, label, accessibilityLabel, style, testID }: MapAreaCircleProps) {
  const theme = useTheme();
  const paint = useMemo(() => resolveMapMarkerPaint(theme), [theme]);
  const r = Math.max(0, radius);
  const size = r * 2;

  const circleStyle: ViewStyle = {
    width: size,
    height: size,
    borderRadius: r,
    alignItems: 'center',
    justifyContent: 'center',
  };
  const layer: ViewStyle = {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: r,
  };

  return (
    <View
      pointerEvents="none"
      {...(accessibilityLabel ? { role: 'img' as const, accessibilityLabel } : null)}
      style={[circleStyle, style]}
      testID={testID}
    >
      <View
        style={[layer, { backgroundColor: paint.area, opacity: AREA_FILL_OPACITY }]}
        testID={testID ? `${testID}-fill` : undefined}
      />
      <View
        style={[layer, { borderWidth: AREA_BORDER_WIDTH, borderColor: paint.area }]}
        testID={testID ? `${testID}-edge` : undefined}
      />
      {label ? (
        <View
          style={{
            height: LABEL_HEIGHT,
            justifyContent: 'center',
            paddingLeft: 10,
            paddingRight: 10,
            borderRadius: borderRadius.full,
            borderWidth: 1,
            borderColor: paint.border,
            backgroundColor: paint.surface,
            ...bloomShadowStyle('s'),
          }}
          testID={testID ? `${testID}-label` : undefined}
        >
          <Text variant="caption-1-semibold" numberOfLines={1} style={{ color: paint.label }}>
            {label}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

export const MapAreaCircle = memo(MapAreaCircleComponent);
MapAreaCircle.displayName = 'MapAreaCircle';
