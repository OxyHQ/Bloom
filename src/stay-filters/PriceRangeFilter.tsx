import React, { memo, useCallback, useMemo } from 'react';
import { View } from 'react-native';

import { RangeSlider } from '../slider';
import { PriceHistogram } from './PriceHistogram';
import { parseAmountInput, RangeFields, snapToStep } from './RangeFields';
import type { PriceRangeFilterProps, PriceScale } from './types';

/**
 * A price range: the histogram, a `RangeSlider` whose rail meets the bars'
 * baseline, and a "Minimum" / "Maximum" pair of fields.
 *
 *   histogram   full width, 64 tall (see `PriceHistogram`)
 *   slider      Bloom's `RangeSlider`, no value bubbles, pulled up 13px so its
 *               6px rail sits directly under the bars. The slider maps
 *               `min`..`max` across its full width and the buckets split the
 *               same span evenly, so each bar sits over the prices it counts.
 *   fields      two floating-label `TextField`s, 16 apart, 24 under the slider
 *
 * THE FIELDS AND THE SLIDER ARE ONE VALUE. At rest a field shows
 * `formatPrice(value)`; focused it shows the bare number for editing, and the
 * typed text is a local draft until blur or submit, when it is parsed, clamped
 * to its own side of the range (the minimum can not pass the maximum), snapped
 * to `step`, and committed through `onValueChange` + `onValueCommit`. A draft
 * that does not parse restores the committed value.
 *
 * SALE PRICES: `scale="log"`. A linear slider over 50,000 – 2,000,000 spends
 * nearly all of its width above the prices most people search, so the log
 * scale moves by RATIO instead — equal slider distance is an equal percentage
 * change. The slider then runs over {@link PRICE_SCALE_POSITIONS} positions,
 * the buckets split that POSITION span evenly (so the app buckets its counts
 * in log space too), and every value the slider reports is snapped to `step`
 * in price space (pass a round step such as 5,000). With `min` above 0 the
 * scale is geometric; with `min` of 0 it is offset by one (`log(1 + p)`), so 0
 * stays reachable.
 */

/** Parse a typed price ("$1,200" → 1200); `null` when there is no number in it. */
export const parsePriceInput = parseAmountInput;

/** How many slider positions a `log` scale runs over. */
export const PRICE_SCALE_POSITIONS = 200;

export interface PriceScaleMapping {
  /** The slider's own bounds. */
  sliderMin: number;
  sliderMax: number;
  /** A price → its slider position. */
  toPosition: (price: number) => number;
  /** A slider position → its price, snapped to `step` and kept in `min`..`max`. */
  toPrice: (position: number) => number;
}

/** The price ↔ slider mapping for a scale. Pure; exported for the tests. */
export function priceScaleMapping(scale: PriceScale, min: number, max: number, step: number): PriceScaleMapping {
  if (scale !== 'log' || max <= min) {
    return { sliderMin: min, sliderMax: max, toPosition: (p) => p, toPrice: (p) => p };
  }
  const n = PRICE_SCALE_POSITIONS;
  const clampPrice = (p: number) => Math.min(max, Math.max(min, p));
  const geometric = min > 0;
  const span = geometric ? Math.log(max / min) : Math.log(max - min + 1);
  return {
    sliderMin: 0,
    sliderMax: n,
    toPosition: (price) => {
      const p = clampPrice(price);
      const t = geometric ? Math.log(p / min) / span : Math.log(p - min + 1) / span;
      return Math.round(t * n);
    },
    toPrice: (position) => {
      if (position <= 0) return min;
      if (position >= n) return max;
      const t = position / n;
      const raw = geometric ? min * Math.exp(t * span) : min + Math.exp(t * span) - 1;
      return clampPrice(snapToStep(raw, min, step));
    },
  };
}

const RAIL_OFFSET = 13; // (32px track region − 6px rail) / 2

function PriceRangeFilterComponent({
  buckets,
  min,
  max,
  value,
  onValueChange,
  onValueCommit,
  formatPrice = String,
  step = 1,
  scale = 'linear',
  minLabel = 'Minimum',
  maxLabel = 'Maximum',
  accessibilityLabel = 'Price range',
  histogramHeight = 64,
  disabled = false,
  style,
  testID,
}: PriceRangeFilterProps) {
  const hasHistogram = buckets != null && buckets.length > 0;
  const mapping = useMemo(() => priceScaleMapping(scale, min, max, step), [scale, min, max, step]);
  const linear = scale !== 'log';
  const positions: [number, number] = [mapping.toPosition(value[0]), mapping.toPosition(value[1])];

  const fromPositions = useCallback(
    ([a, b]: [number, number]): [number, number] => {
      const low = mapping.toPrice(a);
      return [low, Math.max(low, mapping.toPrice(b))];
    },
    [mapping],
  );

  const onSlide = useCallback(
    (next: [number, number]) => onValueChange(linear ? next : fromPositions(next)),
    [linear, fromPositions, onValueChange],
  );
  const onSlideEnd = useMemo(
    () => (onValueCommit ? (next: [number, number]) => onValueCommit(linear ? next : fromPositions(next)) : undefined),
    [linear, fromPositions, onValueCommit],
  );

  const onFieldCommit = useCallback(
    ([low, high]: [number | null, number | null]) => {
      const next: [number, number] = [low ?? min, high ?? max];
      if (next[0] !== value[0] || next[1] !== value[1]) onValueChange(next);
      onValueCommit?.(next);
    },
    [min, max, value, onValueChange, onValueCommit],
  );

  return (
    <View testID={testID} style={[{ width: '100%' }, style]}>
      {hasHistogram ? (
        <PriceHistogram
          buckets={buckets}
          min={mapping.sliderMin}
          max={mapping.sliderMax}
          value={positions}
          height={histogramHeight}
          testID={testID ? `${testID}-histogram` : undefined}
        />
      ) : null}
      <RangeSlider
        value={positions}
        onValueChange={onSlide}
        onSlidingComplete={onSlideEnd}
        min={mapping.sliderMin}
        max={mapping.sliderMax}
        step={linear ? step : 1}
        disabled={disabled}
        showTooltip={false}
        accessibilityLabel={accessibilityLabel}
        thumbLabels={[minLabel, maxLabel]}
        testID={testID ? `${testID}-slider` : undefined}
        style={hasHistogram ? { marginTop: -RAIL_OFFSET } : undefined}
      />
      <View style={{ marginTop: 24 }}>
        <RangeFields
          value={value}
          onCommit={onFieldCommit}
          format={formatPrice}
          labels={[minLabel, maxLabel]}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          testID={testID}
        />
      </View>
    </View>
  );
}

export const PriceRangeFilter = memo(PriceRangeFilterComponent);
PriceRangeFilter.displayName = 'PriceRangeFilter';
