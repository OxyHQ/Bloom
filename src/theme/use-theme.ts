import { useContext } from 'react';
import { BloomThemeContext } from './BloomThemeProvider';
import type { Theme, ThemeColors } from './types';

export function useTheme(): Theme {
  const ctx = useContext(BloomThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a <BloomThemeProvider>');
  }
  return ctx.theme;
}

export function useThemeColor(colorKey: keyof ThemeColors): string {
  const theme = useTheme();
  return theme.colors[colorKey];
}

export function useBloomTheme() {
  const ctx = useContext(BloomThemeContext);
  if (!ctx) {
    throw new Error('useBloomTheme must be used within a <BloomThemeProvider>');
  }
  return ctx;
}
