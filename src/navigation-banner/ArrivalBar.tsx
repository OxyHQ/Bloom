import React, { memo, useMemo } from 'react';
import { View } from 'react-native';

import { Button } from '../button';
import { GlassIsland } from '../glass';
import { RiCloseLine } from '../icons/remix/RiCloseLine';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { NAVIGATION_BANNER_GEOMETRY } from './constants';
import { describeArrival, resolveNavigationPaint } from './shared';
import type { ArrivalBarProps } from './types';

/**
 * THE STRIP AT THE BOTTOM while you are driving: when you get there, how long
 * is left, how far is left, and the way out.
 *
 *   pane      `GlassIsland` at the 16 rung, stretched — the same material the
 *             banner at the top is on, because they are two edges of one
 *             surface over the same tiles
 *   figures   THREE PEERS, `title-3-semibold` and TABULAR, each over its own
 *             quiet caption. Peers because the driver is asking a different
 *             question of each one and none of them is the answer to the other
 *             two; tabular because all three count down.
 *   end       the way out, on the right — `Button` in `destructive` at the 44
 *             rung, which keeps its own chrome inside the island on purpose (a
 *             glass control flush with the pane would be the quietest thing on
 *             a strip whose only action stops the navigation). 44 rather than
 *             the 32 that looks better in a screenshot: this is pressed in a
 *             moving car, by a thumb, at the bottom of the screen.
 *
 * ── WHY THIS IS NOT `OrderStatusBar` ────────────────────────────────────────
 *
 * They look alike and they answer differently shaped questions, and the shape
 * is the whole component. `OrderStatusBar` has ONE headline with an arrival
 * reading beside it, a tile, a quiet second line and a progress meter — it says
 * "here is what is happening, and here is how far along it is". This has THREE
 * readings of equal weight and no state at all: the journey is happening, and
 * the driver picks whichever of the three they wanted. Giving `OrderStatusBar`
 * a three-figure mode would be a second layout behind a prop, and giving this
 * one a status line and a meter would be a tracker for a journey the user is
 * ON rather than waiting for.
 *
 * They do share a surface rung and their tabular figures, and both take the app
 * a PRE-FORMATTED reading: neither reads a clock, computes an ETA or knows what
 * a kilometre is.
 */

interface FigureProps {
  label: string;
  value: string;
  color: string;
  labelColor: string;
  testID?: string;
}

function Figure({ label, value, color, labelColor, testID }: FigureProps) {
  return (
    // `minWidth: 0`: each figure is a nowrap one-liner, so without this its
    // min-content width becomes the strip's floor and three of them push the
    // pane past a 390 phone.
    <View style={{ flex: 1, minWidth: 0, gap: 1 }}>
      <Text
        variant="title-3-semibold"
        numberOfLines={1}
        testID={testID}
        style={{ color, fontVariant: ['tabular-nums'] }}
      >
        {value}
      </Text>
      <Text variant="caption-2-medium" numberOfLines={1} style={{ color: labelColor }}>
        {label}
      </Text>
    </View>
  );
}

function ArrivalBarComponent({
  arrival,
  remainingTime,
  remainingDistance,
  onEnd,
  action,
  labels,
  accessibilityLabel,
  style,
  testID,
}: ArrivalBarProps) {
  const theme = useTheme();
  const paint = useMemo(() => resolveNavigationPaint(theme), [theme]);
  const g = NAVIGATION_BANNER_GEOMETRY;
  const endWord = labels?.end ?? 'End';

  return (
    <GlassIsland
      radius={g.radius}
      style={[{ alignSelf: 'stretch', flexDirection: 'column' }, style]}
      testID={testID}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          padding: g.padding,
        }}
      >
        <View
          role="img"
          accessibilityLabel={
            accessibilityLabel ??
            describeArrival({ arrival, remainingTime, remainingDistance, labels })
          }
          style={{ flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 12 }}
        >
          <View
            aria-hidden
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={{ flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 12 }}
          >
            <Figure
              label={labels?.arrival ?? 'Arrival'}
              value={arrival}
              color={paint.text}
              labelColor={paint.textTertiary}
              testID={testID ? `${testID}-arrival` : undefined}
            />
            <Figure
              label={labels?.time ?? 'Left'}
              value={remainingTime}
              color={paint.text}
              labelColor={paint.textTertiary}
              testID={testID ? `${testID}-time` : undefined}
            />
            <Figure
              label={labels?.distance ?? 'Distance'}
              value={remainingDistance}
              color={paint.text}
              labelColor={paint.textTertiary}
              testID={testID ? `${testID}-distance` : undefined}
            />
          </View>
        </View>
        {action ??
          (onEnd ? (
            <Button
              variant="destructive"
              size="lg"
              icon={RiCloseLine}
              onPress={onEnd}
              testID={testID ? `${testID}-end` : undefined}
            >
              {endWord}
            </Button>
          ) : null)}
      </View>
    </GlassIsland>
  );
}

export const ArrivalBar = memo(ArrivalBarComponent);
ArrivalBar.displayName = 'ArrivalBar';
