import { moveItem } from '../hooks/list-reorder';

/** Reorder eligible slots only; fixed and hidden descriptors keep their indices. */
export function reorderPanelIds(
  ids: readonly string[],
  movable: readonly string[],
  id: string,
  target: string,
): string[] {
  'worklet';
  const from = movable.indexOf(id);
  const to = movable.indexOf(target);
  if (from < 0 || to < 0 || from === to) return [...ids];
  const moved = moveItem([...movable], from, to);
  const eligible = new Set(movable);
  let index = 0;
  return ids.map((key) => (eligible.has(key) ? (moved[index++] ?? key) : key));
}

export interface PanelReorderGeometry {
  id: string;
  start: number;
  size: number;
}
/** Shared by the native UI worklet and the web transform adapter. */
export function panelReorderPreview(
  ids: readonly string[],
  movable: readonly string[],
  items: readonly PanelReorderGeometry[],
  id: string,
  delta: number,
  direction: number,
  followDragged = true,
): { target: string; shifts: Array<{ id: string; delta: number }> } {
  'worklet';
  const source = items.find((item) => item.id === id);
  if (!source) return { target: id, shifts: [] };
  const center = source.start + source.size / 2 + delta;
  const nearest = items
    .filter((item) => movable.includes(item.id))
    .reduce<PanelReorderGeometry | undefined>(
      (best, item) =>
        !best ||
        Math.abs(item.start + item.size / 2 - center) <
          Math.abs(best.start + best.size / 2 - center)
          ? item
          : best,
      undefined,
    );
  const target = nearest?.id ?? id;
  const order = reorderPanelIds(ids, movable, id, target);
  const [first, second] = items;
  const gap =
    first && second
      ? Math.max(
          0,
          direction === 1
            ? second.start - first.start - first.size
            : first.start - second.start - second.size,
        )
      : 0;
  let position = (first?.start ?? 0) + (direction === -1 ? (first?.size ?? 0) : 0);
  const shifts = [];
  for (const key of order) {
    const item = items.find((item) => item.id === key);
    if (!item) continue;
    const next = direction === 1 ? position : position - item.size;
    shifts.push({ id: key, delta: key === id && followDragged ? delta : next - item.start });
    position += direction * (item.size + gap);
  }
  return { target, shifts };
}
