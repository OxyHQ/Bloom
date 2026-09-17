import React, { memo, useCallback, useState } from 'react';
import { View } from 'react-native';

import { RangeSlider } from '../slider';
import { TextFieldInput } from '../text-field';
import { PriceHistogram } from './PriceHistogram';
import type { PriceRangeFilterProps } from './types';

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
 */

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

function snap(v: number, min: number, step: number): number {
  if (step <= 0) return v;
  const snapped = min + Math.round((v - min) / step) * step;
  const decimals = (String(step).split('.')[1] ?? '').length;
  return decimals > 0 ? Number(snapped.toFixed(decimals)) : snapped;
}

/** Parse a typed price ("$1,200" → 1200); `null` when there is no number in it. */
export function parsePriceInput(text: string): number | null {
  const cleaned = text.replace(/[^0-9.]/g, '');
  if (cleaned === '' || cleaned === '.') return null;
  const n = Number.parseFloat(cleaned);
  return Number.isFinite(n) ? n : null;
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
  minLabel = 'Minimum',
  maxLabel = 'Maximum',
  accessibilityLabel = 'Price range',
  histogramHeight = 64,
  disabled = false,
  style,
  testID,
}: PriceRangeFilterProps) {
  const [draft, setDraft] = useState<{ index: 0 | 1; text: string } | null>(null);
  const hasHistogram = buckets != null && buckets.length > 0;

  const commitDraft = useCallback(() => {
    if (!draft) return;
    const parsed = parsePriceInput(draft.text);
    setDraft(null);
    if (parsed == null) return;
    const [low, high] = value;
    const next: [number, number] =
      draft.index === 0
        ? [clamp(snap(parsed, min, step), min, high), high]
        : [low, clamp(snap(parsed, min, step), low, max)];
    if (next[0] !== low || next[1] !== high) onValueChange(next);
    onValueCommit?.(next);
  }, [draft, value, min, max, step, onValueChange, onValueCommit]);

  const field = (index: 0 | 1) => {
    const label = index === 0 ? minLabel : maxLabel;
    const editing = draft?.index === index;
    return (
      <View style={{ flex: 1, minWidth: 0 }}>
        <TextFieldInput
          floatingLabel
          label={label}
          accessibilityLabel={label}
          value={editing ? draft.text : formatPrice(value[index])}
          onChangeText={(text) => setDraft({ index, text })}
          onFocus={() => setDraft({ index, text: String(value[index]) })}
          onBlur={commitDraft}
          onSubmitEditing={commitDraft}
          keyboardType="numeric"
          inputMode="numeric"
          returnKeyType="done"
          disabled={disabled}
          testID={testID ? `${testID}-${index === 0 ? 'min' : 'max'}` : undefined}
        />
      </View>
    );
  };

  return (
    <View testID={testID} style={[{ width: '100%' }, style]}>
      {hasHistogram ? (
        <PriceHistogram
          buckets={buckets}
          min={min}
          max={max}
          value={value}
          height={histogramHeight}
          testID={testID ? `${testID}-histogram` : undefined}
        />
      ) : null}
      <RangeSlider
        value={value}
        onValueChange={onValueChange}
        onSlidingComplete={onValueCommit}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        showTooltip={false}
        accessibilityLabel={accessibilityLabel}
        thumbLabels={[minLabel, maxLabel]}
        testID={testID ? `${testID}-slider` : undefined}
        style={hasHistogram ? { marginTop: -RAIL_OFFSET } : undefined}
      />
      <View style={{ flexDirection: 'row', gap: 16, marginTop: 24 }}>
        {field(0)}
        {field(1)}
      </View>
    </View>
  );
}

export const PriceRangeFilter = memo(PriceRangeFilterComponent);
PriceRangeFilter.displayName = 'PriceRangeFilter';
