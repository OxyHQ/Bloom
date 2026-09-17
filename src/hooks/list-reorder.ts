/**
 * The list maths behind every drag-to-reorder surface: a track list, a queue, a
 * photo grid. Pure, so the drag, the keyboard path and the move buttons share
 * one definition of "move" and a test can pin it without a DOM.
 *
 * Three families had grown their own copy (`track-list`, `queue-panel`,
 * `sortable-media`), and they disagreed about the degenerate inputs. What the
 * shared pair does with those is spelled out on each function.
 */

/** `index` rounded and clamped into `0..count-1`; `0` for an empty list. */
function clampIndex(index: number, count: number): number {
  if (count <= 0) return 0;
  return Math.min(count - 1, Math.max(0, Math.round(index)));
}

/**
 * A copy of `list` with the item at `from` moved to `to`. Always a new array;
 * a no-op move returns an unchanged copy rather than the same reference.
 *
 * `to` is rounded and clamped into range — a drag lands where it lands.
 * `from` is NOT clamped: an out-of-range `from` is a stale or wrong index, and
 * clamping it would silently move the wrong item, so the list comes back
 * unchanged.
 */
export function moveItem<T>(list: readonly T[], from: number, to: number): T[] {
  const next = list.slice();
  if (list.length === 0 || from < 0 || from >= list.length) return next;
  const target = clampIndex(to, list.length);
  if (target === from) return next;
  const [item] = next.splice(from, 1);
  next.splice(target, 0, item as T);
  return next;
}

/**
 * The index a row dragged `dy` px from `from` lands on: the nearest whole row,
 * clamped into `0..count-1`.
 *
 * Without a measured row (`rowHeight <= 0`) or without rows (`count <= 0`) the
 * answer is `from` — "it has not moved". Returning `0` instead, as one of the
 * two copies did, sends the row to the top of a list nobody has measured yet.
 */
export function dragTarget(from: number, dy: number, rowHeight: number, count: number): number {
  if (count <= 0 || rowHeight <= 0) return from;
  return clampIndex(from + dy / rowHeight, count);
}

/**
 * How far row `index` shifts while row `from` is dragged over `to`: the rows
 * between the two close the gap the dragged row left and open one where it
 * will land. The dragged row itself does not shift — it follows the pointer.
 */
export function dragShift(index: number, from: number, to: number, rowHeight: number): number {
  if (index === from) return 0;
  if (from < to && index > from && index <= to) return -rowHeight;
  if (to < from && index >= to && index < from) return rowHeight;
  return 0;
}
