import { Platform, type StyleProp, type ViewStyle } from 'react-native';
// eslint-disable-next-line @typescript-eslint/no-deprecated -- `vars()` backs `useColorScopeStyle` only; see below.
import { vars, VariableContextProvider } from 'react-native-css';

import { getResolvedTokens } from '../token-registry';
import type { AppColorName } from '../color-presets';
import type { ExplicitAccents } from '../preset-vars';
import { withScopeAliases } from './seed-scope';

/**
 * `react-native-css` (NativeWind 5's runtime) is a REQUIRED peer, imported
 * statically. It is a peer rather than a dependency on purpose: the scope has
 * to publish into the SAME `VariableContext` the app's className components
 * read, and a second copy of the package would carry a second context that
 * nothing reads — the subtree would keep rendering the app-wide palette.
 */

/**
 * Build the CSS custom-property map for a preset, ready to be applied to a
 * subtree. Every canonical `--x` token is resolved to an sRGB `rgb(...)` string
 * via `getResolvedTokens` — the single token pipeline shared by web and native.
 *
 * The returned map also includes Tailwind v4 `--color-x` aliases generated from
 * those same canonical values. Scoped aliases are required on web because
 * inherited custom properties like `--color-primary: var(--primary)` compute at
 * the document root and would otherwise keep pointing at the app-wide preset.
 */
export function buildScopeVars(
  colorPreset: AppColorName,
  mode: 'light' | 'dark',
  accents?: ExplicitAccents,
): Record<string, string> {
  return withScopeAliases(getResolvedTokens(colorPreset, mode, accents));
}

/**
 * The component that provides CSS variables to a NATIVE subtree through
 * react-native-css's `VariableContext`, or `null` on web — where the vars are
 * written onto a DOM element instead, and a `display: contents` wrapper would
 * only add a node.
 *
 * Under react-native-css@3 this is the only form that propagates: an inline
 * `vars()` style reaches children only when the host matches className rules,
 * so on a plain `<View>` it is dropped silently.
 */
export function getVariableContextProvider(): typeof VariableContextProvider | null {
  return Platform.OS === 'web' ? null : VariableContextProvider;
}

/**
 * A native style carrying every CSS var of the preset, via `vars()`;
 * `undefined` on web (the provider writes vars to `documentElement` instead).
 *
 * Caveat — prefer `getVariableContextProvider()`: under react-native-css@3,
 * `vars()` only propagates to a subtree when applied to an interop className
 * component. Applied to a plain `<View>` the vars are dropped silently. This is
 * retained as the escape-hatch contract of `useColorScopeStyle`, where the
 * caller owns the host element and is expected to be a className component.
 */
export function buildNativePresetStyle(
  colorPreset: AppColorName,
  mode: 'light' | 'dark',
): StyleProp<ViewStyle> {
  if (Platform.OS === 'web') return undefined;
  // eslint-disable-next-line @typescript-eslint/no-deprecated
  return vars(buildScopeVars(colorPreset, mode)) as StyleProp<ViewStyle>;
}
