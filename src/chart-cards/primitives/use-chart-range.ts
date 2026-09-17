import { useCallback, useState } from 'react';

/** One selectable period of a chart card's pill. */
export interface ChartRangeOption {
  id: string;
  label: string;
}

/**
 * A card's selectable period: the pill label plus whichever of the card's data
 * props that period overrides (data, series, delta, headline…). Fields left
 * out fall back to the card's top-level props.
 */
export type ChartRange<T extends object = object> = ChartRangeOption & Partial<T>;

/**
 * `useChartRange`: selection state for `ranges`. Uncontrolled (the
 * first range, or `defaultId`); `onChange` reports each selection so a host can
 * fetch real data for the new period.
 */
export function useChartRange<T extends object>(
  ranges: readonly ChartRange<T>[] | undefined,
  defaultId?: string,
  onChange?: (id: string) => void,
): { selected: ChartRange<T> | undefined; selectedId: string | undefined; select: (id: string) => void } {
  const [selectedId, setSelectedId] = useState<string | undefined>(defaultId);
  const selected = ranges?.find((r) => r.id === selectedId) ?? ranges?.[0];
  const select = useCallback(
    (id: string) => {
      setSelectedId(id);
      onChange?.(id);
    },
    [onChange],
  );
  return { selected, selectedId: selected?.id, select };
}
