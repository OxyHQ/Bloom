/**
 * Shared context definitions and hooks for ContextMenu (native + web).
 */
import { createContext, useContext } from 'react';

import type { ContextMenuContextValue, ItemContextValue } from './types';

// ---------------------------------------------------------------------------
// ContextMenu context + hook
// ---------------------------------------------------------------------------

/**
 * Base context shared by both platforms. Each platform extends this with
 * additional fields (native adds `control`, web adds `position`) by
 * providing a compatible superset value.
 */
export const ContextMenuContext = createContext<ContextMenuContextValue | null>(null);
ContextMenuContext.displayName = 'ContextMenuContext';

export function useContextMenuContext(): ContextMenuContextValue {
  const ctx = useContext(ContextMenuContext);
  if (!ctx) {
    throw new Error(
      'ContextMenu components must be used within a ContextMenu.Root',
    );
  }
  return ctx;
}

// ---------------------------------------------------------------------------
// Item context + hook
// ---------------------------------------------------------------------------

export const ItemCtx = createContext<ItemContextValue | null>(null);
ItemCtx.displayName = 'ContextMenuItemContext';

export function useItemContext(): ItemContextValue {
  const ctx = useContext(ItemCtx);
  if (!ctx) {
    throw new Error(
      'ContextMenu.ItemText/ItemIcon must be used within a ContextMenu.Item',
    );
  }
  return ctx;
}
