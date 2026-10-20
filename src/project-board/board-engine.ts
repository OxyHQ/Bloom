import type { BoardColumn, BoardMove } from './types';
import type { BoardRect } from './shared';

/** A row can occur in several groups; its occurrence, not its id, owns a gesture. */
export function boardOccurrence(columnId: string, itemId: string) {
  return JSON.stringify([columnId, itemId]);
}

export function projectBoardMove<Item>(
  columns: readonly BoardColumn<Item>[],
  getItemId: (item: Item) => string,
  move: BoardMove | null,
): readonly BoardColumn<Item>[] {
  if (!move) return columns;
  const source = columns.find((column) => column.id === move.fromColumnId);
  const destination = columns.find((column) => column.id === move.toColumnId);
  const item = source?.items.find((item) => getItemId(item) === move.itemId);
  if (!item || !destination) return columns;
  return columns.map((column) => {
    if (column.id !== source?.id && column.id !== destination.id) return column;
    const items = column.items.filter((item) => getItemId(item) !== move.itemId);
    if (column.id === destination.id) {
      const anchor = move.beforeItemId
        ? items.findIndex((item) => getItemId(item) === move.beforeItemId)
        : -1;
      items.splice(
        Math.max(0, Math.min(items.length, anchor >= 0 ? anchor : (move.toIndex ?? items.length))),
        0,
        item,
      );
    }
    return { ...column, items };
  });
}

/** Resolve the containing column before its insertion slot; adjacent cards cannot steal drops. */
export function boardDropTarget<Item>(
  x: number,
  y: number,
  columns: readonly BoardColumn<Item>[],
  columnRects: Record<string, BoardRect>,
  itemRects: Record<string, BoardRect>,
  getItemId: (item: Item) => string,
  moving: { itemId: string; fromColumnId: string },
) {
  const column = columns.find((candidate) => {
    const rect = columnRects[candidate.id];
    return (
      rect && x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height
    );
  });
  if (!column) return null;
  const items = column.items.filter((item) => getItemId(item) !== moving.itemId);
  let index = items.length;
  for (let i = 0; i < items.length; i++) {
    const rect = itemRects[boardOccurrence(column.id, getItemId(items[i]!))];
    if (rect && y < rect.y + rect.height / 2) {
      index = i;
      break;
    }
  }
  return {
    columnId: column.id,
    index,
    beforeItemId: items[index] ? getItemId(items[index]!) : undefined,
  };
}
