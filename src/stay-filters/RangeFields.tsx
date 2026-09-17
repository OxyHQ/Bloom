import React, { memo, useCallback, useState } from 'react';
import { View } from 'react-native';

import { TextFieldInput } from '../text-field';

/**
 * The "Minimum" / "Maximum" pair of floating-label fields every range filter
 * shares (`PriceRangeFilter`, `AreaRangeFilter`, the search `BudgetPicker`).
 * Internal.
 *
 * At rest a field shows `format(value)`; focused it shows the bare number, and
 * the typed text is a local draft until blur or submit. The draft is then
 * parsed, snapped to `step`, clamped to its own side of the range (the minimum
 * can not pass the maximum, nor leave `min`..`max`) and handed to `onCommit`.
 *
 * `nullable`: an EMPTY draft commits `null` ("no minimum") and a `null` value
 * shows an empty field, so the floating label sits inside it as the
 * placeholder. Otherwise a draft that does not parse restores the committed
 * value and commits nothing.
 */

export type RangeFieldsValue = readonly [number | null, number | null];

export interface RangeFieldsProps {
  value: RangeFieldsValue;
  /** The committed pair, after parsing, snapping and clamping. */
  onCommit: (next: [number | null, number | null]) => void;
  format: (value: number) => string;
  labels: readonly [string, string];
  min?: number;
  max?: number;
  step?: number;
  nullable?: boolean;
  disabled?: boolean;
  /** Derives `-min` and `-max`. */
  testID?: string;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

/** Snap `v` to the `step` grid anchored at `origin`, keeping the step's decimals. */
export function snapToStep(v: number, origin: number, step: number): number {
  if (step <= 0) return v;
  const snapped = origin + Math.round((v - origin) / step) * step;
  const decimals = (String(step).split('.')[1] ?? '').length;
  return decimals > 0 ? Number(snapped.toFixed(decimals)) : snapped;
}

/** Parse a typed amount ("$1,200" → 1200); `null` when there is no number in it. */
export function parseAmountInput(text: string): number | null {
  const cleaned = text.replace(/[^0-9.]/g, '');
  if (cleaned === '' || cleaned === '.') return null;
  const n = Number.parseFloat(cleaned);
  return Number.isFinite(n) ? n : null;
}

/**
 * Where a typed amount lands: snapped, then clamped between its bound and the
 * other side of the range. Pure; exported for the tests.
 */
export function commitRangeField(
  value: RangeFieldsValue,
  index: 0 | 1,
  parsed: number,
  { min = -Infinity, max = Infinity, step = 0 }: { min?: number; max?: number; step?: number },
): [number | null, number | null] {
  const [low, high] = value;
  const origin = Number.isFinite(min) ? min : 0;
  const snapped = snapToStep(parsed, origin, step);
  return index === 0
    ? [clamp(snapped, min, high ?? max), high]
    : [low, clamp(snapped, low ?? min, max)];
}

function RangeFieldsComponent({
  value,
  onCommit,
  format,
  labels,
  min,
  max,
  step,
  nullable = false,
  disabled = false,
  testID,
}: RangeFieldsProps) {
  const [draft, setDraft] = useState<{ index: 0 | 1; text: string } | null>(null);

  const commitDraft = useCallback(() => {
    if (!draft) return;
    const parsed = parseAmountInput(draft.text);
    setDraft(null);
    if (parsed == null) {
      if (!nullable || draft.text.trim() !== '') return;
      const next: [number | null, number | null] = draft.index === 0 ? [null, value[1]] : [value[0], null];
      onCommit(next);
      return;
    }
    onCommit(commitRangeField(value, draft.index, parsed, { min, max, step }));
  }, [draft, value, min, max, step, nullable, onCommit]);

  const field = (index: 0 | 1) => {
    const label = labels[index];
    const editing = draft?.index === index;
    const current = value[index];
    return (
      <View style={{ flex: 1, minWidth: 0 }}>
        <TextFieldInput
          floatingLabel
          label={label}
          accessibilityLabel={label}
          value={editing ? draft.text : current == null ? '' : format(current)}
          onChangeText={(text) => setDraft({ index, text })}
          onFocus={() => setDraft({ index, text: current == null ? '' : String(current) })}
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
    <View style={{ flexDirection: 'row', gap: 16 }}>
      {field(0)}
      {field(1)}
    </View>
  );
}

export const RangeFields = memo(RangeFieldsComponent);
RangeFields.displayName = 'RangeFields';
