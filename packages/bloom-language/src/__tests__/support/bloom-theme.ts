import { createContext, useContext } from 'react';

export type ThemeColors = Record<string, string>;
export type AccentTone = 'default' | 'primary' | 'success' | 'error';

export const LIGHT: ThemeColors = {
  text: 'rgb(10 10 10)',
  textSecondary: 'rgb(100 100 100)',
  primary: 'rgb(0 0 255)',
  background: 'rgb(255 255 255)',
  backgroundSecondary: 'rgb(245 245 245)',
  border: 'rgb(220 220 220)',
  error: 'rgb(255 0 0)',
};
export const DARK: ThemeColors = {
  ...LIGHT,
  text: 'rgb(250 250 250)',
  textSecondary: 'rgb(160 160 160)',
};

/** Stands in for the provider: the theme a test renders under. */
export const PaintContext = createContext<ThemeColors>(LIGHT);
export function useThemePaint(): ThemeColors {
  return useContext(PaintContext);
}
export { withAlpha } from '../../../../../src/theme/color-utils';
