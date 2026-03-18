/**
 * Shared utilities for Select (native + web).
 */
import { createContext, useContext } from 'react';

import type { SelectItemContextValue } from './types';

// ---------------------------------------------------------------------------
// defaultItemValueExtractor
// ---------------------------------------------------------------------------

export function defaultItemValueExtractor(item: unknown): string {
  if (item != null && typeof item === 'object' && 'value' in item) {
    return String((item as { value: string }).value);
  }
  return String(item);
}

// ---------------------------------------------------------------------------
// Item context
// ---------------------------------------------------------------------------

export const ItemContext = createContext<SelectItemContextValue>({
  selected: false,
  hovered: false,
  focused: false,
  pressed: false,
});
ItemContext.displayName = 'SelectItemContext';

export function useItemContext(): SelectItemContextValue {
  return useContext(ItemContext);
}
