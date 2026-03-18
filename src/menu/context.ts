import { createContext, useContext } from 'react';

import type { MenuContextType, ItemContextType } from './types';

export const MenuContext = createContext<MenuContextType | null>(null);
MenuContext.displayName = 'BloomMenuContext';

export const ItemContext = createContext<ItemContextType | null>(null);
ItemContext.displayName = 'BloomMenuItemContext';

export function useMenuContext(): MenuContextType {
  const context = useContext(MenuContext);
  if (!context) {
    throw new Error('useMenuContext must be used within a Menu.Root');
  }
  return context;
}

export function useMenuItemContext(): ItemContextType {
  const context = useContext(ItemContext);
  if (!context) {
    throw new Error('useMenuItemContext must be used within a Menu.Item');
  }
  return context;
}
