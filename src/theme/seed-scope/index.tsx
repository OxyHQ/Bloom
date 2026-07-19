import React, { Children, cloneElement, isValidElement, useContext, useMemo } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { BloomThemeContext, type BloomThemeContextValue } from '../BloomThemeProvider';
import { buildSeedScopeVars } from '../color-scope/seed-scope';
import { getVariableContextProvider } from '../color-scope/style-builder';
import { buildThemeFromSeed } from '../build-theme-from-seed';
import type { SchemeVariant } from '../color-engine';

export interface BloomSeedScopeProps {
  /**
   * The seed colour (`#rrggbb`) to derive this subtree's palette from. When
   * `undefined`, the scope is a no-op and children inherit the parent scope
   * unchanged — pass `undefined` to fall back to the app preset (e.g. on
   * mouse-leave/blur when restoring the default theme).
   */
  seed: string | undefined;
  /** Tonal scheme variant. Defaults to `'vibrant'` (matches Bloom presets). */
  variant?: SchemeVariant;
  /** −1 (low) … 0 (normal) … 1 (high). Defaults to 0. */
  contrastLevel?: number;
  /**
   * When `true`, do not render a wrapping `<View>`. The single child is cloned
   * with the caller's `style` merged into its `style` prop (Radix-style).
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
 * Native `<BloomSeedScope>`: scopes a subtree to an ARBITRARY seed colour's
 * palette (the dynamic counterpart of `<BloomColorScope>`, which takes a named
 * preset). Feeds the seed through the colour engine and (1) provides the
 * resulting canonical CSS vars to descendants via react-native-css's
 * `VariableContext` — so `bg-background` / `bg-card` / `var(--primary)` resolve
 * against the seed inside this subtree — and (2) publishes a matching JS `theme`
 * on `BloomThemeContext`, so `useTheme()`/`useBloomTheme()` consumers inside the
 * subtree also re-theme. The `colorPreset` field is left as the parent's (a seed
 * is not a named preset).
 */
export function BloomSeedScope({
  seed,
  variant,
  contrastLevel,
  asChild = false,
  style,
  children,
}: BloomSeedScopeProps) {
  // Hooks run unconditionally; conditional no-op/throw is applied afterwards.
  const parent = useContext(BloomThemeContext);
  const resolvedMode = parent?.theme.mode ?? 'light';

  const nativeVars = useMemo<Record<string, string> | null>(
    () => (seed ? buildSeedScopeVars({ seed, mode: resolvedMode, variant, contrastLevel }) : null),
    [seed, resolvedMode, variant, contrastLevel],
  );

  const contextValue = useMemo<BloomThemeContextValue | null>(() => {
    if (!parent || !seed) return null;
    const theme = buildThemeFromSeed(seed, resolvedMode, variant, contrastLevel);
    return { ...parent, theme };
  }, [parent, seed, resolvedMode, variant, contrastLevel]);

  if (!parent) {
    throw new Error('BloomSeedScope must be used within a <BloomThemeProvider>');
  }
  // `seed` undefined => no-op; children inherit the parent scope.
  if (!nativeVars || !contextValue) return <>{children}</>;

  const VariableProvider = getVariableContextProvider();

  let content: React.ReactNode;
  if (asChild) {
    const child = Children.only(children);
    if (!isValidElement<StyleableProps>(child)) {
      throw new Error(
        'BloomSeedScope with `asChild` requires a single React element child that accepts a `style` prop.',
      );
    }
    const childStyle = child.props.style;
    const mergedStyle: StyleProp<ViewStyle> = [style, childStyle];
    content = cloneElement(child, { style: mergedStyle });
  } else {
    content = <View style={[{ flex: 1 }, style]}>{children}</View>;
  }

  const scoped = VariableProvider ? (
    <VariableProvider value={nativeVars}>{content}</VariableProvider>
  ) : (
    content
  );

  return <BloomThemeContext.Provider value={contextValue}>{scoped}</BloomThemeContext.Provider>;
}
