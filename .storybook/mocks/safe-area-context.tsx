/**
 * Web stub for `react-native-safe-area-context` used by Storybook. Returns
 * zero insets and a frame matching the window.
 */
import React, { type ReactNode } from 'react';
import { View, type ViewProps } from 'react-native';

const ZERO_INSETS = { top: 0, right: 0, bottom: 0, left: 0 } as const;
const ZERO_FRAME = { x: 0, y: 0, width: 0, height: 0 } as const;

export function useSafeAreaInsets() {
  return ZERO_INSETS;
}

export function useSafeAreaFrame() {
  return ZERO_FRAME;
}

export function SafeAreaProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function SafeAreaView({ children, ...props }: ViewProps) {
  return <View {...props}>{children}</View>;
}

export function SafeAreaInsetsContext() {
  return null;
}

export const initialWindowMetrics = {
  insets: ZERO_INSETS,
  frame: ZERO_FRAME,
};
