import { createContext, use, useContext } from 'react';

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
  contrast50: 'rgb(238 238 238)',
};
export const DARK: ThemeColors = {
  ...LIGHT,
  text: 'rgb(250 250 250)',
  textSecondary: 'rgb(160 160 160)',
  contrast50: 'rgb(38 38 38)',
};

/** Stands in for the provider: the theme a test renders under. */
export const PaintContext = createContext<ThemeColors>(LIGHT);
export function useThemePaint(): ThemeColors {
  return useContext(PaintContext);
}
export { parseRgb, parseRgba, withAlpha } from '../../../../../src/theme/color-utils';

/**
 * The theme's RGB palette when a test paints with another one: a web prepaint,
 * whose paints are `var(--bloom-paint-…)` while `useTheme().colors` stays RGB.
 */
export const RgbContext = createContext<ThemeColors | null>(null);

const themes = new WeakMap<ThemeColors, { colors: ThemeColors; isDark: boolean }>();
/**
 * Stands in for `useTheme`: the palette a test renders under, and whether it
 * is dark; one object per palette, as Bloom's provider keeps its theme.
 */
export function useTheme(): { colors: ThemeColors; isDark: boolean } {
  const paint = useContext(PaintContext);
  const colors = useContext(RgbContext) ?? paint;
  let theme = themes.get(colors);
  if (theme === undefined) {
    theme = { colors, isDark: colors === DARK };
    themes.set(colors, theme);
  }
  return theme;
}

/** Stands in for `readThemePaint`: `useTheme()` and `useThemePaint()` in one read, through `use`. */
export function readThemePaint(): {
  theme: { colors: ThemeColors; isDark: boolean };
  paint: ThemeColors;
} {
  const paint = use(PaintContext);
  const colors = use(RgbContext) ?? paint;
  let theme = themes.get(colors);
  if (theme === undefined) {
    theme = { colors, isDark: colors === DARK };
    themes.set(colors, theme);
  }
  return { theme, paint };
}
