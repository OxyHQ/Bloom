import React, { memo, useMemo } from 'react';
import { View } from 'react-native';

import { Meter } from '../stat-bar';
import {
  SurfaceLevelProvider,
  surfaceFillVars,
  useSurfaceLevel,
  useSurfaceLevelValue,
  type SurfaceLevel,
} from '../styles/surface-levels';
import { resolveAccentColors } from '../theme/accent-colors';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import {
  ORDER_STATUS_BAR_GLYPH,
  ORDER_STATUS_BAR_METER_HEIGHT,
  ORDER_STATUS_BAR_PADDING,
  ORDER_STATUS_BAR_TILE,
} from './constants';
import { resolveOrderStatusPaint } from './shared';
import type { OrderStatusBarProps } from './types';

/**
 * The compact live strip: where the thing is RIGHT NOW, when it arrives, how
 * far along it is, and one action.
 *
 * It is the companion of `OrderStatusTimeline` and not a shorter version of it:
 * a timeline answers "what is the whole journey", this answers "what is
 * happening" and is what a card, a header or a sticky footer carries while the
 * journey is in progress.
 *
 *   tile     40 round, the tone's tint, a 20 glyph in the tone's own accent
 *   status   headline-semibold, one line; `eta` body-medium in TABULAR figures
 *            at the end of the same line so a counting-down reading does not
 *            jitter the layout
 *   detail   body-2-regular, secondary, under the status
 *   meter    6 tall, full width, 12 under the row — `Meter`, never a hand-rolled
 *            track, so the one progressbar contract applies here too
 *   surface  one rung above whatever it was dropped on, 16 radius, a hairline;
 *            `variant="plain"` draws the content and no chrome, for a strip
 *            that is already inside a card that paints
 *
 * Nothing here computes an ETA or a percentage: `eta` is a string the app
 * formatted and `progress` is a value it measured.
 */
function OrderStatusBarComponent({
  status,
  eta,
  detail,
  progress,
  tone = 'primary',
  icon: Icon,
  leading,
  action,
  variant = 'surface',
  style,
  testID,
}: OrderStatusBarProps) {
  const theme = useTheme();
  const level = useSurfaceLevelValue();
  const own = useSurfaceLevel(variant === 'surface' ? 1 : 0);
  const paint = useMemo(
    () => resolveOrderStatusPaint(theme, own.background),
    [theme, own.background],
  );
  const accent = resolveAccentColors(theme.colors, tone, 'subtle');
  const fill = resolveAccentColors(theme.colors, tone, 'solid').background;

  const tile =
    leading ??
    (Icon ? (
      <View
        testID={testID ? `${testID}-tile` : undefined}
        style={{
          width: ORDER_STATUS_BAR_TILE,
          height: ORDER_STATUS_BAR_TILE,
          borderRadius: ORDER_STATUS_BAR_TILE / 2,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: accent.background,
        }}
      >
        <Icon width={ORDER_STATUS_BAR_GLYPH} height={ORDER_STATUS_BAR_GLYPH} fill={accent.foreground} />
      </View>
    ) : null);

  const body = (
    <View style={{ gap: progress ? 12 : 0 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        {tile}
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          {/*
            `minWidth: 0` on the ROW, not only on the texts inside it. A
            `numberOfLines={1}` Text is `white-space: nowrap` on web, so its
            MIN-CONTENT width is the whole string — and a flex row without
            `min-width: 0` takes its child's min-content as its own floor and
            pushes the page wider. Measured: the strip forced 396px of content
            into a 390px viewport, on a card that looked perfectly ordinary.
          */}
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, minWidth: 0 }}>
            <Text
              variant="headline-semibold"
              numberOfLines={1}
              testID={testID ? `${testID}-status` : undefined}
              style={{ flex: 1, minWidth: 0, color: paint.text }}
            >
              {status}
            </Text>
            {eta ? (
              <Text
                variant="body-medium"
                numberOfLines={1}
                testID={testID ? `${testID}-eta` : undefined}
                style={{
                  // The arrival reading is SHORT ("12 min", "Arrives 14:35"),
                  // and it never truncates at that length. The cap is there for
                  // the hostile case: a window ("between 15:00 and 17:00")
                  // ellipsizes rather than crushing the status beside it down
                  // to nothing, which is what an uncapped reading did.
                  maxWidth: '60%',
                  flexShrink: 1,
                  // …and `minWidth: 0`, or the reading's MIN-CONTENT (the whole
                  // nowrap string) becomes the strip's floor. A percentage
                  // `maxWidth` does not participate in intrinsic sizing, so it
                  // caps the drawn width and not the width the strip demands:
                  // without this the whole bar refused to go below ~330px and
                  // overflowed a 390 phone inside two levels of padding.
                  minWidth: 0,
                  color: paint.textSecondary,
                  fontVariant: ['tabular-nums'],
                }}
              >
                {eta}
              </Text>
            ) : null}
          </View>
          {detail ? (
            <Text
              variant="body-2-regular"
              numberOfLines={2}
              testID={testID ? `${testID}-detail` : undefined}
              style={{ color: paint.textSecondary }}
            >
              {detail}
            </Text>
          ) : null}
        </View>
        {action}
      </View>
      {progress ? (
        <Meter
          value={progress.value}
          max={progress.max}
          height={ORDER_STATUS_BAR_METER_HEIGHT}
          fill={fill}
          track={own.raised}
          accessibilityLabel={progress.accessibilityLabel}
          valueText={progress.valueText}
          testID={testID ? `${testID}-meter` : undefined}
        />
      ) : null}
    </View>
  );

  if (variant === 'plain') {
    return (
      <View testID={testID} style={style}>
        {body}
      </View>
    );
  }

  const raised = Math.min(3, level + 1) as SurfaceLevel;
  return (
    <View
      testID={testID}
      style={[
        {
          padding: ORDER_STATUS_BAR_PADDING,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: own.border,
          backgroundColor: own.background,
        },
        surfaceFillVars(own.background),
        style,
      ]}
    >
      <SurfaceLevelProvider level={raised} fill={own.background}>
        {body}
      </SurfaceLevelProvider>
    </View>
  );
}

export const OrderStatusBar = memo(OrderStatusBarComponent);
OrderStatusBar.displayName = 'OrderStatusBar';
