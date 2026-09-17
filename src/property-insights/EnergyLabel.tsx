import React, { memo, useMemo } from 'react';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { RiTimeLine } from '../icons/remix';
import { useContainerWidth } from '../listing-details/use-container-width';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import {
  ENERGY_LABEL_INLINE_VALUES_MIN_WIDTH,
  ENERGY_LABEL_MIN_BAR_RATIO,
  ENERGY_LABEL_ROW_HEIGHT,
} from './constants';
import { ENERGY_CLASSES, resolveEnergyTones, resolveInsightPalette, type EnergyTone } from './shared';
import type { EnergyLabelProps, EnergyRating } from './types';

/**
 * The A–G energy efficiency scale of a home.
 *
 *   scale     seven bars, 24 tall, 4 apart, radius 6; bar A is 40% of the
 *             scale column and each class adds 10% (G is 100%). Each bar is
 *             its class colour (`resolveEnergyTones`: the success → warning →
 *             error hues on a fixed lightness curve) with the letter in body-2-semibold at 12
 *             in, white or neutral-950, whichever contrasts more
 *   columns   one per rating given (`consumption`, `emissions`), 16 right of
 *             the scale, each headed by its label (caption-1-medium,
 *             text-secondary). The rating is an arrow tag on its class's row:
 *             a left-pointing 8px tip + a body-2-semibold "C · 112 kWh/m²·year"
 *             in the class colour, radius 6 on the right
 *   narrow    with two columns below 560 wide the columns are 84 wide, the
 *             tags hold the letter only, and the values move under the scale
 *             as "Consumption  C · 412 kWh/m²·year" rows (body-2), so nothing
 *             truncates at phone width
 *   ends      "More efficient" over A, "Less efficient" under G
 *             (caption-1-regular, text-tertiary)
 *   pending   every bar neutral-200 (dark neutral-800) with a text-tertiary
 *             letter, no columns, and a clock + "Certificate in progress"
 *             (body-medium) under the scale
 *
 * The whole label is ONE image with a composed name — "Energy rating.
 * Consumption: C, 112 kWh/m²·year. Emissions: D, 24 kg CO₂/m²·year." — the
 * bars are a picture of a standard scale, not seven things to visit.
 */

const ROW_GAP = 4;
const TIP = 8;
const INLINE_COLUMN_WIDTH = 176;
const COMPACT_COLUMN_WIDTH = 84;

interface Column {
  key: 'consumption' | 'emissions';
  label: string;
  rating: EnergyRating;
}

function Tag({ tone, text, testID }: { tone: EnergyTone; text: string; testID?: string }) {
  return (
    <View style={{ flexDirection: 'row', height: ENERGY_LABEL_ROW_HEIGHT, maxWidth: '100%' }} testID={testID}>
      <Svg width={TIP} height={ENERGY_LABEL_ROW_HEIGHT}>
        <Path d={`M${TIP} 0L0 ${ENERGY_LABEL_ROW_HEIGHT / 2}L${TIP} ${ENERGY_LABEL_ROW_HEIGHT}Z`} fill={tone.fill} />
      </Svg>
      <View
        testID={testID ? `${testID}-body` : undefined}
        style={{
          flexShrink: 1,
          minWidth: 0,
          justifyContent: 'center',
          paddingLeft: 4,
          paddingRight: 8,
          borderTopRightRadius: 6,
          borderBottomRightRadius: 6,
          backgroundColor: tone.fill,
        }}
      >
        <Text
          variant="body-2-semibold"
          numberOfLines={1}
          style={{ color: tone.foreground, fontVariant: ['tabular-nums'] }}
        >
          {text}
        </Text>
      </View>
    </View>
  );
}

function EnergyLabelComponent({
  consumption,
  emissions,
  pending = false,
  pendingLabel = 'Certificate in progress',
  consumptionLabel = 'Consumption',
  emissionsLabel = 'Emissions',
  bestLabel = 'More efficient',
  worstLabel = 'Less efficient',
  accessibilityLabel,
  style,
  testID,
}: EnergyLabelProps) {
  const theme = useTheme();
  const palette = useMemo(() => resolveInsightPalette(theme), [theme]);
  const tones = useMemo(() => resolveEnergyTones(theme), [theme]);
  const { width, onLayout } = useContainerWidth();

  const columns: Column[] = pending
    ? []
    : [
        ...(consumption ? [{ key: 'consumption' as const, label: consumptionLabel, rating: consumption }] : []),
        ...(emissions ? [{ key: 'emissions' as const, label: emissionsLabel, rating: emissions }] : []),
      ];
  // One column always fits its value; two only once there is room for both.
  const inline = columns.length < 2 || (width != null && width >= ENERGY_LABEL_INLINE_VALUES_MIN_WIDTH);
  const columnWidth = inline ? INLINE_COLUMN_WIDTH : COMPACT_COLUMN_WIDTH;

  const name =
    accessibilityLabel ??
    (pending
      ? `Energy rating: ${pendingLabel}`
      : ['Energy rating', ...columns.map((c) => `${c.label}: ${[c.rating.rating, c.rating.value].filter(Boolean).join(', ')}`)]
          .join('. ') + '.');

  const caption = (text: string, testIDSuffix: string) => (
    <Text
      variant="caption-1-regular"
      numberOfLines={1}
      style={{ color: palette.muted }}
      testID={testID ? `${testID}-${testIDSuffix}` : undefined}
    >
      {text}
    </Text>
  );

  return (
    <View
      onLayout={onLayout}
      accessible
      accessibilityRole="image"
      accessibilityLabel={name}
      style={[{ width: '100%', gap: 8 }, style]}
      testID={testID}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 16 }}>
        <View style={{ flex: 1, minWidth: 0 }}>{caption(bestLabel, 'best')}</View>
        {columns.map((column) => (
          <View key={column.key} style={{ width: columnWidth, gap: 2 }} testID={testID ? `${testID}-${column.key}-header` : undefined}>
            <Text variant="caption-1-medium" numberOfLines={1} style={{ color: palette.textSecondary }}>
              {column.label}
            </Text>
          </View>
        ))}
      </View>

      <View style={{ gap: ROW_GAP }}>
        {ENERGY_CLASSES.map((letter, index) => {
          const tone = tones[index]!;
          const fill = pending ? palette.hairline : tone.fill;
          const ink = pending ? palette.muted : tone.foreground;
          return (
            <View key={letter} style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <View
                  testID={testID ? `${testID}-bar-${letter}` : undefined}
                  style={{
                    width: `${Math.round((ENERGY_LABEL_MIN_BAR_RATIO + index * 0.1) * 100)}%`,
                    height: ENERGY_LABEL_ROW_HEIGHT,
                    borderRadius: 6,
                    backgroundColor: fill,
                    justifyContent: 'center',
                    paddingLeft: 12,
                  }}
                >
                  <Text variant="body-2-semibold" style={{ color: ink }}>
                    {letter}
                  </Text>
                </View>
              </View>
              {columns.map((column) => (
                <View key={column.key} style={{ width: columnWidth, flexDirection: 'row' }}>
                  {column.rating.rating === letter ? (
                    <Tag
                      tone={tone}
                      text={inline && column.rating.value ? `${letter} · ${column.rating.value}` : letter}
                      testID={testID ? `${testID}-${column.key}-tag` : undefined}
                    />
                  ) : null}
                </View>
              ))}
            </View>
          );
        })}
      </View>

      {caption(worstLabel, 'worst')}

      {!inline ? (
        <View style={{ gap: 4, marginTop: 4 }} testID={testID ? `${testID}-values` : undefined}>
          {columns.map((column) =>
            column.rating.value ? (
              <View key={column.key} style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: 6 }}>
                <Text variant="body-2-regular" style={{ color: palette.textSecondary }}>
                  {column.label}
                </Text>
                <Text variant="body-2-semibold" style={{ color: palette.text, fontVariant: ['tabular-nums'] }}>
                  {`${column.rating.rating} · ${column.rating.value}`}
                </Text>
              </View>
            ) : null,
          )}
        </View>
      ) : null}

      {pending ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }} testID={testID ? `${testID}-pending` : undefined}>
          <RiTimeLine width={18} height={18} fill={palette.textSecondary} />
          <Text variant="body-medium" style={{ color: palette.text }}>
            {pendingLabel}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

export const EnergyLabel = memo(EnergyLabelComponent);
EnergyLabel.displayName = 'EnergyLabel';
