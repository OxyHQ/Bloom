import { createContext } from 'react';

import type { ShelfCell } from './types';

/** Where an item of a `paged` or `grid` shelf sits. `null` anywhere else. */
export const ShelfCellContext = createContext<ShelfCell | null>(null);
ShelfCellContext.displayName = 'ShelfCellContext';
