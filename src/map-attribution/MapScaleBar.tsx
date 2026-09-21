import React, { memo, useMemo } from 'react';
import { View } from 'react-native';

import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { MAP_ATTRIBUTION_GEOMETRY } from './constants';
import { MapAttributionShell } from './MapAttributionShell';
import { describeScale, resolveMapAttributionPaint } from './shared';
import type { MapScaleBarProps } from './types';

/**
 * HOW BIG THE MAP IS: a measured span with a tick at each end, and what that
 * span is worth.
 *
 *   bar      the app's own width in pixels, a 1px rule along the bottom and a
 *            5px tick rising from each end — the ticks are what make it read as
 *            a measurement BETWEEN TWO MARKS rather than as an underline
 *   reading  `caption-2-medium`, at the end of the bar, on the baseline
 *   two bars  metric over imperial, sharing a left edge, so the eye compares
 *            them as one instrument rather than reading two
 *
 * The rule takes the GRAPHICAL contrast rung and the reading a TEXT one. They
 * are different jobs: a line has to be seen, a number has to be read, and
 * flooring the line at text contrast would make the quietest thing on the map
 * the loudest thing on the strip.
 *
 * It converts nothing. Every width and every reading comes from the app,
 * because the projection does — see `MapScale`.
 *
 * The whole thing is one `img` named by `describeScale`: a bar and two ticks
 * say nothing aloud, and "500 m" on its own is as likely to be a distance to
 * somewhere as a scale.
 */
function MapScaleBarComponent({
  scales,
  variant = 'island',
  scaleLabel,
  accessibilityLabel,
  style,
  testID,
}: MapScaleBarProps) {
  const theme = useTheme();
  const paint = useMemo(() => resolveMapAttributionPaint(theme), [theme]);
  const g = MAP_ATTRIBUTION_GEOMETRY;

  return (
    <MapAttributionShell variant={variant} style={style} testID={testID}>
      <View
        role="img"
        accessibilityLabel={accessibilityLabel ?? describeScale(scales, scaleLabel)}
        style={{ gap: g.scaleStack }}
      >
        {scales.map((scale, index) => (
          <View
            key={scale.id ?? index}
            testID={testID ? `${testID}-bar-${index}` : undefined}
            style={{ flexDirection: 'row', alignItems: 'flex-end', gap: g.scaleGap }}
          >
            <View style={{ width: Math.max(0, scale.width), height: g.tick }}>
              <View
                testID={testID ? `${testID}-rule-${index}` : undefined}
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  bottom: 0,
                  height: g.rule,
                  backgroundColor: paint.rule,
                }}
              />
              <View
                style={{
                  position: 'absolute',
                  left: 0,
                  bottom: 0,
                  width: g.rule,
                  height: g.tick,
                  backgroundColor: paint.rule,
                }}
              />
              <View
                style={{
                  position: 'absolute',
                  right: 0,
                  bottom: 0,
                  width: g.rule,
                  height: g.tick,
                  backgroundColor: paint.rule,
                }}
              />
            </View>
            <Text
              variant="caption-2-medium"
              numberOfLines={1}
              style={{ color: paint.textSecondary, fontVariant: ['tabular-nums'] }}
            >
              {scale.label}
            </Text>
          </View>
        ))}
      </View>
    </MapAttributionShell>
  );
}

export const MapScaleBar = memo(MapScaleBarComponent);
MapScaleBar.displayName = 'MapScaleBar';
