import React from 'react';

type Insets = { top: number; right: number; bottom: number; left: number };

export const useSafeAreaInsets = () => ({
  top: 0,
  bottom: 0,
  left: 0,
  right: 0,
});

export const SafeAreaProvider = ({ children }: { children: React.ReactNode }) => children;

/**
 * A REAL context, not a component — consumers read it with `useContext` (the
 * toast positioner does, so it can fall back when no provider is mounted) and a
 * function stub would silently yield `undefined` insets instead of `null`.
 */
export const SafeAreaInsetsContext = React.createContext<Insets | null>(null);
SafeAreaInsetsContext.displayName = 'SafeAreaInsetsContext';

/**
 * `null` matches the real value on web and before the native provider measures.
 * Code reading it must handle null (`initialWindowMetrics?.insets ?? fallback`).
 */
export const initialWindowMetrics: {
  insets: Insets;
  frame: { x: number; y: number; width: number; height: number };
} | null = null;
