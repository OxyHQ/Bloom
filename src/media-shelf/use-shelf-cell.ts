import { useContext } from 'react';

import { ShelfCellContext } from './context';
import type { ShelfCell } from './types';

/**
 * Where this item sits in the `paged` or `grid` shelf around it — its row, its
 * column and whether it is the last of its column — or `null` outside one.
 * An item that separates itself from the item below it (a list row's hairline)
 * reads `lastInColumn` instead of asking its caller to count.
 */
export function useShelfCell(): ShelfCell | null {
  return useContext(ShelfCellContext);
}
