/**
 * The list maths behind `SortablePhotoGrid`. Pure, so the drag and the move
 * buttons share one definition of "move" and a test can pin it without a DOM.
 */

/** A copy of `list` with the item at `from` moved to `to` (both clamped). */
export function moveItem<T>(list: ReadonlyArray<T>, from: number, to: number): T[] {
  const next = list.slice();
  if (list.length === 0) return next;
  const source = Math.min(Math.max(0, from), list.length - 1);
  const target = Math.min(Math.max(0, to), list.length - 1);
  if (source === target) return next;
  const [item] = next.splice(source, 1);
  next.splice(target, 0, item as T);
  return next;
}

/**
 * The slot under a point, for a grid of `count` equal square-ish cells laid
 * out left to right in `columns`, each `cellWidth` × `cellHeight` with `gap`
 * between them. `x`/`y` are relative to the grid's top-left. A point in a gap
 * or past the last row snaps to the nearest cell; the result is clamped to
 * `0..count-1`.
 */
export function slotAtPoint(
  x: number,
  y: number,
  options: { columns: number; cellWidth: number; cellHeight: number; gap: number; count: number },
): number {
  const { columns, cellWidth, cellHeight, gap, count } = options;
  if (count <= 0 || columns <= 0) return 0;
  const col = Math.min(columns - 1, Math.max(0, Math.floor((x + gap / 2) / (cellWidth + gap))));
  const row = Math.max(0, Math.floor((y + gap / 2) / (cellHeight + gap)));
  return Math.min(count - 1, row * columns + col);
}

/** The default column count for a grid `width` wide. */
export function sortableGridColumns(width: number): number {
  return width >= 640 ? 4 : 3;
}
