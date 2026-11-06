/**
 * The maths behind `SortableChipRow`: which chip a point is over. The list
 * maths (`moveItem`) is shared with every other reorder surface: `hooks/list-reorder`.
 */

export interface ChipRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * The index of the chip whose centre is nearest the point `(x, y)`, in the
 * row's coordinates. `0` for an empty list.
 */
export function nearestChipIndex(rects: readonly ChipRect[], x: number, y: number): number {
  let best = 0;
  let bestDistance = Number.POSITIVE_INFINITY;
  rects.forEach((rect, index) => {
    const dx = rect.x + rect.width / 2 - x;
    const dy = rect.y + rect.height / 2 - y;
    const distance = dx * dx + dy * dy;
    if (distance < bestDistance) {
      bestDistance = distance;
      best = index;
    }
  });
  return best;
}
