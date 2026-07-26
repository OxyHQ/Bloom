/**
 * Derived from sonner-native v0.26.4 — src/context.tsx
 * (MIT © Gunnar Torfi Steinarsson). See the top-level NOTICE.
 *
 * Two contexts, split by change frequency: the resolved `Toaster` configuration
 * (stable for the lifetime of the outlet) and the live stack state (changes on
 * every measurement). Splitting them keeps a height measurement from
 * re-rendering every row's config-derived memo.
 *
 * Upstream also passes `addToast` through the stable context; Bloom's rows talk
 * to `toastStore` directly, which is the single authority.
 */
import * as React from 'react';
import type {
  DynamicToastContextType,
  StableToastContextType,
} from './types';

export const ToastContext = React.createContext<StableToastContextType | null>(
  null,
);
ToastContext.displayName = 'BloomToastContext';

export const DynamicToastContext =
  React.createContext<DynamicToastContextType | null>(null);
DynamicToastContext.displayName = 'BloomDynamicToastContext';

export const useToastContext = (): StableToastContextType => {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToastContext must be used within a <ToastOutlet>');
  }
  return context;
};

export const useDynamicToastContext = (): DynamicToastContextType => {
  const context = React.useContext(DynamicToastContext);
  if (!context) {
    throw new Error(
      'useDynamicToastContext must be used within a <ToastOutlet>',
    );
  }
  return context;
};
