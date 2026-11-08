import type { HeaderAction } from './types';

/** Measured control widths, including its own padding and target floor. */
export interface HeaderActionMeasurement {
  full: number;
  compact: number;
}

export interface HeaderActionLayout {
  inline: readonly string[];
  compact: readonly string[];
  overflow: readonly string[];
  /** Essential controls need the owning row's explicit scroll/wrap policy. */
  requiredWidth: number;
}

/**
 * Pure packing policy. Neither labels nor array positions become identities.
 * Full labels yield before commands; essential commands never yield. Selection,
 * busy and disabled do not change geometry or reorder a command.
 */
export function resolveHeaderActionLayout(
  actions: readonly HeaderAction[],
  measurements: ReadonlyMap<string, HeaderActionMeasurement>,
  availableWidth: number,
  overflowWidth: number,
  gap = 0,
): HeaderActionLayout {
  const ids = new Set<string>();
  for (const action of actions) {
    if (!action.id || ids.has(action.id)) {
      throw new Error(`HeaderActions requires unique nonempty IDs: ${action.id}`);
    }
    if (!action.label.trim()) throw new Error(`HeaderActions requires a label: ${action.id}`);
    ids.add(action.id);
  }
  const visible = actions.filter((action) => action.visible !== false);
  const pinned = (action: HeaderAction) => action.essential || action.overflow === 'never';
  const overflow = new Set(
    visible.filter((action) => !pinned(action) && action.overflow === 'always').map(({ id }) => id),
  );
  const compact = new Set(
    visible
      .filter((action) => action.icon && action.labelVisibility === 'hidden')
      .map(({ id }) => id),
  );
  const width = (action: HeaderAction) => {
    const measured = measurements.get(action.id);
    // Until measured, optional commands belong in overflow. Essential commands
    // remain mounted and the row measures them before claiming its final size.
    if (!measured) return Number.POSITIVE_INFINITY;
    return Math.max(0, compact.has(action.id) ? measured.compact : measured.full);
  };
  const total = () => {
    const inline = visible.filter(({ id }) => !overflow.has(id));
    const count = inline.length + (overflow.size ? 1 : 0);
    return (
      inline.reduce((sum, action) => sum + width(action), 0) +
      (overflow.size ? overflowWidth : 0) +
      Math.max(0, count - 1) * gap
    );
  };
  const budget = Number.isFinite(availableWidth) ? Math.max(0, availableWidth) : 0;
  // Low-priority labels/commands yield first. Later equal-priority commands
  // yield first; the visible order is always the caller's original order.
  const yielding = visible
    .map((action, index) => ({ action, index }))
    .sort((a, b) => (a.action.priority ?? 0) - (b.action.priority ?? 0) || b.index - a.index);
  for (const { action } of yielding) {
    if (total() <= budget) break;
    if (overflow.has(action.id)) continue;
    if (action.icon && (action.labelVisibility ?? 'auto') === 'auto') compact.add(action.id);
  }
  for (const { action } of yielding) {
    if (total() <= budget) break;
    if (!pinned(action)) overflow.add(action.id);
  }
  return {
    inline: visible.filter(({ id }) => !overflow.has(id)).map(({ id }) => id),
    compact: visible.filter(({ id }) => !overflow.has(id) && compact.has(id)).map(({ id }) => id),
    overflow: visible.filter(({ id }) => overflow.has(id)).map(({ id }) => id),
    requiredWidth: total(),
  };
}
