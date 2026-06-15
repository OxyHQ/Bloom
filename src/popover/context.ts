import { createContext, useContext } from 'react';
import type { View } from 'react-native';

import type { PopoverControlProps } from './types';

export interface PopoverContextValue {
  control: PopoverControlProps;
  /** Whether the popover is currently open. Drives web rendering. */
  isOpen: boolean;
  /**
   * Ref to the trigger wrapper. Web uses it to anchor the floating panel.
   * Native ignores it (it presents a bottom sheet).
   */
  triggerRef: React.RefObject<View | null>;
}

export const PopoverContext = createContext<PopoverContextValue | null>(null);
PopoverContext.displayName = 'PopoverContext';

export function usePopoverContext(): PopoverContextValue {
  const ctx = useContext(PopoverContext);
  if (!ctx) {
    throw new Error('Popover components must be used within a <Popover.Root>');
  }
  return ctx;
}
