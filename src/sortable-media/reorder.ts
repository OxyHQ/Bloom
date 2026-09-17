/**
 * The GRID maths behind `SortablePhotoGrid` — where a point falls and how many
 * columns fit. The list maths (`moveItem`) is shared: `hooks/list-reorder`.
 */

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
