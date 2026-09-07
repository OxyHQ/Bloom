import React, { Children, cloneElement, isValidElement, useContext, useMemo } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { BloomThemeContext, type BloomThemeContextValue } from '../BloomThemeProvider';
import { buildTheme } from '../build-theme';
import type { AppColorName } from '../color-presets';
import { buildNativePresetStyle, buildScopeVars, getVariableContextProvider } from './style-builder';

/**
 * The variables a scope publishes when it carries no preset of its own.
 *
 * Empty and shared at module scope, both deliberately: react-native-css's
 * `VariableContextProvider` MERGES its value over the inherited one, so an empty
 * record leaves the parent scope's variables exactly as they were, and one
 * shared identity keeps that provider's `useMemo` from recomputing every render.
 */
const NO_VARS: Record<string, string> = Object.freeze({});

export interface BloomColorScopeProps {
  /**
   * Preset to apply within this subtree. When `undefined`, the scope publishes
   * nothing of its own and children inherit the parent scope's preset unchanged.
   *
   * It is a no-op in what it PUBLISHES, never in what it RENDERS — see the
   * component's own comment: the element tree this returns is identical whether
   * or not a preset is set, because a preset that arrives late must not remount
   * the subtree.
   */
  colorPreset: AppColorName | undefined;
  /**
   * When `true`, do not render a wrapping `<View>`. The single child is cloned
   * with the scope's CSS vars merged into its `style` prop (Radix-style).
   */
  asChild?: boolean;
  /** Additional style applied to the wrapping `<View>` (or merged into the cloned child with `asChild`). */
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

interface StyleableProps {
  style?: StyleProp<ViewStyle>;
}

/**
 * A subtree themed by one color preset.
 *
 * THE SHAPE OF WHAT THIS RETURNS DOES NOT DEPEND ON `colorPreset`. Both
 * providers are mounted unconditionally, and an absent preset is expressed as
 * pass-through VALUES ({@link NO_VARS}, the parent's own theme) rather than as a
 * shorter tree. That is a correctness requirement, not a tidiness one, and it
 * cost a real bug to learn:
 *
 * The no-preset path used to be `return <>{children}</>` — two provider levels
 * shallower than the preset path. React reconciles by POSITION, so the first
 * render after a preset arrives finds different element types at that position
 * and unmounts the whole subtree to mount a new one. Every consumer that resolves
 * its preset asynchronously — a profile screen learning the account's color a
 * few hundred milliseconds after it opens — therefore remounted everything below
 * the scope, including its own navigator.
 *
 * In Mention that scope sits above the app's route stack: the remount rebuilt
 * the `[username]` navigator from scratch, which dropped the pushed child route
 * AND its `username` param, and the profile a reader had just tapped rendered
 * itself as "Profile not found" (mention#…, reproduced from the reel on a Pixel
 * 10 Pro; the A/B was pinning `colorPreset` and watching the collapse stop).
 * Remounting also throws away scroll positions, video players and in-flight
 * state, so the same bug was costing far more than the one visible symptom.
 *
 * If a future change wants the no-preset case to render less, it has to keep the
 * element types at this position identical across a preset change, or the
 * remount comes back.
 */
export function BloomColorScope({
  colorPreset,
  asChild = false,
  style,
  children,
}: BloomColorScopeProps) {
  // All hooks are called UNCONDITIONALLY, in the same order on every render —
  // never gate a hook behind an early return (rules of hooks). The throw below
  // happens AFTER every hook has run. `resolvedMode` falls back harmlessly when
  // the provider is absent (that render path throws anyway).
  const parent = useContext(BloomThemeContext);
  const resolvedMode = parent?.theme.mode ?? 'light';

  const contextValue = useMemo<BloomThemeContextValue | null>(() => {
    if (!parent || !colorPreset) return null;
    const theme = buildTheme(colorPreset, resolvedMode);
    return { ...parent, theme, colorPreset };
  }, [colorPreset, resolvedMode, parent]);

  // Preset vars flow to the subtree through react-native-css's real
  // VariableContext (`VariableContextProvider`), NOT via an inline `vars()`
  // style — under react-native-css@3 inline vars applied to a plain `<View>`
  // (no matched className rules) are dropped silently. See `style-builder.ts`.
  const nativeVars = useMemo<Record<string, string> | null>(
    () => (colorPreset ? buildScopeVars(colorPreset, resolvedMode) : null),
    [colorPreset, resolvedMode],
  );

  if (!parent) {
    throw new Error('BloomColorScope must be used within a <BloomThemeProvider>');
  }

  const VariableProvider = getVariableContextProvider();

  let content: React.ReactNode;
  if (asChild) {
    const child = Children.only(children);
    if (!isValidElement<StyleableProps>(child)) {
      throw new Error(
        'BloomColorScope with `asChild` requires a single React element child that accepts a `style` prop.',
      );
    }
    // The vars no longer ride on the child's `style`; merge only the caller's
    // `style` and the child's own `style` (child last so its styles win).
    const childStyle = child.props.style;
    const mergedStyle: StyleProp<ViewStyle> = [style, childStyle];
    content = cloneElement(child, { style: mergedStyle });
  } else {
    content = <View style={[{ flex: 1 }, style]}>{children}</View>;
  }

  // Wrap the subtree in the variable provider when NativeWind is available;
  // otherwise render as-is so we never crash on web/non-NativeWind hosts.
  const scoped = VariableProvider ? (
    <VariableProvider value={nativeVars ?? NO_VARS}>{content}</VariableProvider>
  ) : (
    content
  );

  return (
    <BloomThemeContext.Provider value={contextValue ?? parent}>{scoped}</BloomThemeContext.Provider>
  );
}

/**
 * Escape hatch for advanced cases where the wrapping element is owned by the
 * caller. Returns a stable native style object carrying the preset's CSS vars
 * via NativeWind's `vars()`. Returns `undefined` on web or when `nativewind`
 * is not installed.
 *
 * NOTE: subject to the react-native-css@3 limitation — the returned style only
 * propagates vars to descendants when applied to an interop className component
 * (the runtime gates propagation on matched className style rules). It is a
 * no-op on a plain `<View>` with no `className`. For the common case prefer
 * `<BloomColorScope>`, which wraps children in `VariableContextProvider`.
 */
export function useColorScopeStyle(colorPreset: AppColorName): StyleProp<ViewStyle> {
  // Hooks first, unconditionally; throw only after they have all run.
  const parent = useContext(BloomThemeContext);
  const resolvedMode = parent?.theme.mode ?? 'light';
  const scopeStyle = useMemo(
    () => buildNativePresetStyle(colorPreset, resolvedMode),
    [colorPreset, resolvedMode],
  );
  if (!parent) {
    throw new Error('useColorScopeStyle must be used within a <BloomThemeProvider>');
  }
  return scopeStyle;
}
