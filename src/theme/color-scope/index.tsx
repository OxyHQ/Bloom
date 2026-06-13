import React, { Children, cloneElement, isValidElement, useContext, useMemo } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { BloomThemeContext, type BloomThemeContextValue } from '../BloomThemeProvider';
import { buildTheme } from '../build-theme';
import type { AppColorName } from '../color-presets';
import { buildNativePresetStyle } from './style-builder';

export interface BloomColorScopeProps {
  /** Preset to apply within this subtree. */
  colorPreset: AppColorName;
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
  const parent = useContext(BloomThemeContext);
  if (!parent) {
    throw new Error('BloomColorScope must be used within a <BloomThemeProvider>');
  }

  const resolvedMode = parent.theme.mode;

  const contextValue = useMemo<BloomThemeContextValue>(() => {
    const theme = buildTheme(colorPreset, resolvedMode);
    return { ...parent, theme, colorPreset };
  }, [colorPreset, resolvedMode, parent]);

  const varsStyle = useMemo(
    () => buildNativePresetStyle(colorPreset, resolvedMode),
    [colorPreset, resolvedMode],
  );

  let content: React.ReactNode;
  if (asChild) {
    const child = Children.only(children);
    if (!isValidElement<StyleableProps>(child)) {
      throw new Error(
        'BloomColorScope with `asChild` requires a single React element child that accepts a `style` prop.',
      );
    }
    const childStyle = child.props.style;
    const mergedStyle: StyleProp<ViewStyle> = [varsStyle, style, childStyle];
    content = cloneElement(child, { style: mergedStyle });
  } else {
    content = <View style={[{ flex: 1 }, varsStyle, style]}>{children}</View>;
  }

  return <BloomThemeContext.Provider value={contextValue}>{content}</BloomThemeContext.Provider>;
}

/**
 * Escape hatch for advanced cases where the wrapping element is owned by the
 * caller. Returns a stable native style object carrying the preset's CSS vars.
 * Returns `undefined` on web or when `nativewind` is not installed.
 */
export function useColorScopeStyle(colorPreset: AppColorName): StyleProp<ViewStyle> {
  const parent = useContext(BloomThemeContext);
  if (!parent) {
    throw new Error('useColorScopeStyle must be used within a <BloomThemeProvider>');
  }
  const resolvedMode = parent.theme.mode;
  return useMemo(
    () => buildNativePresetStyle(colorPreset, resolvedMode),
    [colorPreset, resolvedMode],
  );
}
