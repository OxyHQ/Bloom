import { useMemo } from 'react';
import { Platform } from 'react-native';
import { themePaintColors } from '../paint';
import type { ThemeColors } from '../types';
import { usePrepaintTheme } from './context';

/**
 * The colours a final style paints with. Under a prepainted web document they are
 * the CSS variables `themePaintColors` names, so the server's first paint and
 * the client's agree; everywhere else they are the theme's own colours.
 *
 * Native resolves `use-paint-colors.native.ts`, which returns the colours as
 * they are: prepaint exists only on the web, so native reads no prepaint
 * context and holds no memo for every `useThemePaint` call (every Bloom `Text`
 * makes one).
 */
export function usePaintColors(colors: ThemeColors | undefined): ThemeColors | undefined {
  const prepaint = usePrepaintTheme();
  return useMemo(
    () => (colors && Platform.OS === 'web' && prepaint ? themePaintColors(colors) : colors),
    [colors, prepaint],
  );
}
