import type React from 'react';
import { Platform, type StyleProp, type ViewStyle } from 'react-native';

import { getResolvedTokens } from '../token-registry';
import type { AppColorName } from '../color-presets';
import { lazyRequire } from '../../utils/lazy-require';

/**
 * Component that provides inline CSS variables to a subtree via NativeWind's
 * (react-native-css's) real `VariableContext`. The runtime strips the leading
 * `--` from each key internally, so we feed it the full `--name -> value`
 * record produced by `buildScopeVars`.
 */
export type VariableContextProviderComponent = React.ComponentType<{
  value: Record<string, string>;
  children: React.ReactNode;
}>;

interface NativeWindVarsModule {
  vars: (record: Record<string, string>) => StyleProp<ViewStyle>;
  VariableContextProvider?: VariableContextProviderComponent;
}

const getNativeWindVars = lazyRequire<NativeWindVarsModule>('nativewind');

/**
 * Build the CSS custom-property map for a preset, ready to be applied to a
 * subtree. Every token is resolved to an sRGB `rgb(...)` string via
 * `getResolvedTokens` — the single canonical token pipeline shared by web and
 * native — so Tailwind v4 `@theme` utilities (e.g. `bg-background`) and
 * `color-mix`-based alpha utilities (`bg-primary/10`) both resolve against the
 * same color values. Keys retain the leading `--`.
 */
export function buildScopeVars(
  colorPreset: AppColorName,
  mode: 'light' | 'dark',
): Record<string, string> {
  return getResolvedTokens(colorPreset, mode);
}

/**
 * Resolve NativeWind's `VariableContextProvider` — the canonical, non-deprecated
 * react-native-css v3 API for providing inline CSS variables to a subtree. It
 * reads the same `VariableContext` that interop className components consume, so
 * descendants resolve `var(--primary)` etc. correctly. Returns `null` on web or
 * when `nativewind` is not installed.
 *
 * This replaces the deprecated `vars()`-on-a-plain-`<View>`-style mechanism:
 * under react-native-css@3, `vars()` returns an inline-vars marker that is only
 * propagated to children when the host element matches className style rules
 * (`usesVariables`/`variables`). A plain `<View>` with no `className` drops the
 * vars silently, so the subtree renders without the preset palette.
 */
export function getVariableContextProvider(): VariableContextProviderComponent | null {
  if (Platform.OS === 'web') return null;
  const module = getNativeWindVars();
  if (!module || typeof module.VariableContextProvider !== 'function') return null;
  return module.VariableContextProvider;
}

/**
 * Build a native style object carrying every CSS var of the preset, using
 * NativeWind's `vars()` when available. Returns `undefined` on web (where the
 * provider writes vars to `documentElement` instead) or when `nativewind` is
 * not installed.
 *
 * @deprecated Under react-native-css@3, `vars()` only propagates to a subtree
 * when applied to an interop className component (the runtime gates propagation
 * on matched className style rules). Applied to a plain `<View>` the vars are
 * dropped silently. Prefer wrapping children in `getVariableContextProvider()`.
 * Retained only as the escape-hatch contract of `useColorScopeStyle`, where the
 * caller owns the host element and is expected to be a className component.
 */
export function buildNativePresetStyle(
  colorPreset: AppColorName,
  mode: 'light' | 'dark',
): StyleProp<ViewStyle> {
  if (Platform.OS === 'web') return undefined;
  const module = getNativeWindVars();
  if (!module || typeof module.vars !== 'function') return undefined;
  return module.vars(buildScopeVars(colorPreset, mode));
}
