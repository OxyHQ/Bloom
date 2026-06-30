import React, { Children, cloneElement, isValidElement, useContext, useMemo } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { BloomThemeContext, type BloomThemeContextValue } from '../BloomThemeProvider';
import { buildTheme } from '../build-theme';
import type { AppColorName } from '../color-presets';
import { buildNativePresetStyle, buildScopeVars, getVariableContextProvider } from './style-builder';

export interface BloomColorScopeProps {
  /**
   * Preset to apply within this subtree. When `undefined`, the scope is a
   * no-op and children inherit the parent scope's preset unchanged.
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

export function BloomColorScope({
  colorPreset,
  asChild = false,
  style,
  children,
}: BloomColorScopeProps) {
  // All hooks are called UNCONDITIONALLY, in the same order on every render —
  // never gate a hook behind an early return (rules of hooks). The conditional
  // no-op/throw behavior is applied AFTER every hook has run, using the values
  // the hooks produced. `resolvedMode` falls back harmlessly when the provider
  // is absent (that render path throws below anyway).
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
  // `colorPreset` undefined => the scope is a no-op; children inherit the
  // parent scope. With `parent` present, `contextValue`/`nativeVars` are null
  // iff `colorPreset` is absent, so this guard also narrows them to non-null.
  if (!contextValue || !nativeVars) return <>{children}</>;

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
    <VariableProvider value={nativeVars}>{content}</VariableProvider>
  ) : (
    content
  );

  return <BloomThemeContext.Provider value={contextValue}>{scoped}</BloomThemeContext.Provider>;
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
