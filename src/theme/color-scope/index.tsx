import React, { useContext, useMemo } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { BloomThemeContext, type BloomThemeContextValue } from '../BloomThemeProvider';
import { buildTheme } from '../build-theme';
import type { AppColorName } from '../color-presets';
import { lazyRequire } from '../../utils/lazy-require';
import { buildScopeVars } from './style-builder';

interface NativeWindVarsModule {
  vars: (record: Record<string, string>) => StyleProp<ViewStyle>;
}

const getNativeWindVars = lazyRequire<NativeWindVarsModule>('nativewind');

function presetStyle(colorPreset: AppColorName, mode: 'light' | 'dark'): StyleProp<ViewStyle> {
  const module = getNativeWindVars();
  if (!module || typeof module.vars !== 'function') return undefined;
  return module.vars(buildScopeVars(colorPreset, mode));
}

export interface BloomColorScopeProps {
  /** Preset to apply within this subtree. */
  colorPreset: AppColorName;
  /**
   * When `true`, do not render a wrapping `<View>`. The caller owns the
   * element that receives the CSS vars (via `useColorScopeStyle`).
   */
  asChild?: boolean;
  /** Additional style applied to the wrapping `<View>`. Ignored with `asChild`. */
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
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
    () => presetStyle(colorPreset, resolvedMode),
    [colorPreset, resolvedMode],
  );

  return (
    <BloomThemeContext.Provider value={contextValue}>
      {asChild ? children : <View style={[{ flex: 1 }, varsStyle, style]}>{children}</View>}
    </BloomThemeContext.Provider>
  );
}

/**
 * Escape hatch for advanced cases where the wrapping element is owned by the
 * caller. Returns a stable native style object carrying the preset's CSS vars.
 * Returns `undefined` when nativewind is not installed.
 */
export function useColorScopeStyle(colorPreset: AppColorName): StyleProp<ViewStyle> {
  const parent = useContext(BloomThemeContext);
  if (!parent) {
    throw new Error('useColorScopeStyle must be used within a <BloomThemeProvider>');
  }
  const resolvedMode = parent.theme.mode;
  return useMemo(
    () => presetStyle(colorPreset, resolvedMode),
    [colorPreset, resolvedMode],
  );
}
