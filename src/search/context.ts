import { createContext } from 'react';

/** A compact toolbar can lend its row to Search without owning an input implementation. */
export const SearchPresentationContext = createContext<{
  compact: boolean;
  onActiveChange: (active: boolean) => void;
} | null>(null);

/** Shared capsule motion and the lifetime of a borrowed compact toolbar row. */
export const SEARCH_EXPAND = { response: 0.34, dampingRatio: 1 } as const;
