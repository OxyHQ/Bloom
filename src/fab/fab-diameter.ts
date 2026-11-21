import { createContext } from 'react';

/**
 * The diameter a FAB takes from the bar it stands beside: the bar's own height, so the two read as one
 * row. `undefined` outside such a bar: the FAB keeps its size's diameter.
 */
export const FabDiameterContext = createContext<number | undefined>(undefined);
FabDiameterContext.displayName = 'BloomFabDiameterContext';
