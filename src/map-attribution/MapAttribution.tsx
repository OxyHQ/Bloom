import React, { memo, useMemo } from 'react';
import { View } from 'react-native';

import { Button } from '../button';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { MAP_ATTRIBUTION_GEOMETRY } from './constants';
import { MapAttributionShell } from './MapAttributionShell';
import { MapScaleBar } from './MapScaleBar';
import { resolveMapAttributionPaint } from './shared';
import type { MapAttributionProps } from './types';

/**
 * THE SMALL PRINT, which is not optional: who the map data belongs to, how big
 * the map is, and when the tiles were last refreshed.
 *
 *   shell    `island` by default — the credit has to stay legible over a
 *            satellite photo, a white street map and everything between, and
 *            the only way to promise that is not to put it ON the map. The
 *            island's fill is a surface Bloom owns; the tiles are not.
 *   scale    `MapScaleBar`, drawn `inline` so the pane is one pane rather than
 *            two stacked ones
 *   credit   `caption-2-regular`. With `onPressCredit` it is `Button`'s `link`
 *            variant at the same step — running text with the library's own
 *            focus ring and hover underline, rather than a second pressable
 *            with a ring of its own.
 *   updated  after a separator, at the same step, one rung quieter
 *
 * ── THE CREDIT IS REQUIRED AND NEVER DEFAULTED ──────────────────────────────
 *
 * Every other string here has a sensible English default. This one does not,
 * and that is the point: a component that invented a credit would put a WRONG
 * attribution on a map, and a wrong attribution is a licence problem rather
 * than a visual one. The app passes what its provider's licence says, verbatim.
 *
 * It reads no clock and knows no units. `updated` and every scale reading
 * arrive pre-formatted.
 */
function MapAttributionComponent({
  credit,
  onPressCredit,
  creditLabel,
  scales,
  scaleLabel,
  updated,
  variant = 'island',
  accessibilityLabel = 'Map data',
  style,
  testID,
}: MapAttributionProps) {
  const theme = useTheme();
  const paint = useMemo(() => resolveMapAttributionPaint(theme), [theme]);
  const g = MAP_ATTRIBUTION_GEOMETRY;

  return (
    <MapAttributionShell
      variant={variant}
      role="group"
      accessibilityLabel={accessibilityLabel}
      style={style}
      testID={testID}
    >
      {scales && scales.length > 0 ? (
        <MapScaleBar
          scales={scales}
          scaleLabel={scaleLabel}
          variant="inline"
          testID={testID ? `${testID}-scale` : undefined}
        />
      ) : null}
      {/*
        Wrapping, not truncating. A credit is a licence requirement, so the one
        thing it must never do is silently lose its second half on a narrow
        phone — it takes a second line instead.
      */}
      <View
        style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: g.scaleGap }}
      >
        {onPressCredit ? (
          <Button
            variant="link"
            linkTone="secondary"
            textVariant="caption-2-regular"
            underline="hover"
            onPress={onPressCredit}
            accessibilityLabel={creditLabel ?? credit}
            testID={testID ? `${testID}-credit` : undefined}
          >
            {credit}
          </Button>
        ) : (
          <Text
            variant="caption-2-regular"
            testID={testID ? `${testID}-credit` : undefined}
            style={{ color: paint.textSecondary }}
          >
            {credit}
          </Text>
        )}
        {updated ? (
          <>
            <Text
              aria-hidden
              accessibilityElementsHidden
              importantForAccessibility="no"
              variant="caption-2-regular"
              style={{ color: paint.textGraphical }}
            >
              ·
            </Text>
            <Text
              variant="caption-2-regular"
              testID={testID ? `${testID}-updated` : undefined}
              style={{ color: paint.textTertiary }}
            >
              {updated}
            </Text>
          </>
        ) : null}
      </View>
    </MapAttributionShell>
  );
}

export const MapAttribution = memo(MapAttributionComponent);
MapAttribution.displayName = 'MapAttribution';
