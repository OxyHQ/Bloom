import { useCallback, useMemo, useState } from 'react';
import type { LayoutRectangle } from 'react-native';

interface Entry {
  checked: boolean;
  disabled: boolean;
  layout?: LayoutRectangle;
}

/** Measure real buttons so variable labels, density and RTL share one capsule. */
export function useGroupSelection() {
  const [entries, setEntries] = useState<Record<string, Entry>>({});
  const register = useCallback((id: string, checked: boolean, disabled: boolean) => {
    setEntries((previous) => {
      const entry = previous[id];
      if (entry?.checked === checked && entry.disabled === disabled) return previous;
      return { ...previous, [id]: { ...entry, checked, disabled } };
    });
  }, []);
  const measure = useCallback((id: string, layout: LayoutRectangle) => {
    setEntries((previous) => {
      const entry = previous[id] ?? { checked: false, disabled: false };
      const old = entry.layout;
      if (
        old &&
        old.x === layout.x &&
        old.y === layout.y &&
        old.width === layout.width &&
        old.height === layout.height
      )
        return previous;
      return { ...previous, [id]: { ...entry, layout } };
    });
  }, []);
  const unregister = useCallback((id: string) => {
    setEntries((previous) => {
      if (!previous[id]) return previous;
      const next = { ...previous };
      delete next[id];
      return next;
    });
  }, []);
  const selected = Object.values(entries).filter((entry) => entry.checked);
  const selection = selected.length === 1 ? selected[0] : undefined;
  const layout = selection?.layout;
  const moving = Boolean(layout && layout.width > 0 && layout.height > 0);
  const registry = useMemo(
    () => ({ register, measure, unregister, moving }),
    [register, measure, unregister, moving],
  );
  return { registry, layout: moving ? layout : undefined, disabled: selection?.disabled ?? false };
}
