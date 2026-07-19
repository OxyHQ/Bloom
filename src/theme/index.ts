export { BloomThemeProvider } from './BloomThemeProvider';
export type {
  BloomThemeProviderProps,
  BloomThemeContextValue,
} from './BloomThemeProvider';
export { BloomColorScope, useColorScopeStyle } from './color-scope';
export type { BloomColorScopeProps } from './color-scope';
export { BloomSeedScope } from './seed-scope';
export type { BloomSeedScopeProps } from './seed-scope';
export { buildSeedScopeVars, roleColorsToPresetTokens } from './color-scope/seed-scope';
export type { SeedScopeOptions } from './color-scope/seed-scope';
// Colour engine — the dependency-free tonal system that turns ANY seed colour
// into a full role set. Surfaced here so consumers can derive dynamic themes
// (e.g. from artwork) without reaching into the internal color-engine path.
export {
  generateRoleColors,
  seedHexFromImagePixels,
  seedsFromImagePixels,
  quantizeImage,
  argbFromHex,
  hexFromArgb,
  argbFromRgb,
  redFromArgb,
  greenFromArgb,
  blueFromArgb,
} from './color-engine';
export type { RoleColors, GenerateOptions, RoleName, SchemeVariant } from './color-engine';
export { buildTheme, STATUS_COLORS } from './build-theme';
export { buildThemeFromSeed, buildColorsFromSeed } from './build-theme-from-seed';
export { THEME_GRADIENTS } from './gradients';
export { useTheme, useThemeColor, useBloomTheme } from './use-theme';
export { useNavigationTheme } from './use-navigation-theme';
export type { NavigationTheme, NavigationThemeFont } from './use-navigation-theme';
export type { Theme, ThemeColors, ThemeMode, ThemeGradient, ThemeGradients } from './types';
export type { AppColorName, AppColorPreset, PresetTokens } from './color-presets';
export {
  APP_COLOR_NAMES,
  PREMIUM_COLOR_NAMES,
  APP_COLOR_PRESETS,
  HEX_TO_APP_COLOR,
  hexToAppColorName,
} from './color-presets';
export { parseRgb, withAlpha } from './color-utils';
export type { RgbChannels } from './color-utils';
export { getPresetVars, applyPresetVarsToDocument } from './preset-vars';
export { applyDarkClass } from './apply-dark-class';
export { setColorSchemeSafe } from './set-color-scheme-safe';
export { initCssInteropDarkMode } from './init-css-interop';
export type { BloomThemeStorage, PersistedThemeState } from './persistence';
export { webLocalStorage } from './persistence';
