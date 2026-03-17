import React, { createContext, useCallback, useEffect, useMemo } from 'react';
import { useColorScheme as useRNColorScheme, Platform } from 'react-native';
import { APP_COLOR_PRESETS, type AppColorName } from './color-presets';
import { getAdaptiveColors } from './adaptive-colors';
import { applyDarkClass } from './apply-dark-class';
import { setColorSchemeSafe } from './set-color-scheme-safe';
import type { Theme, ThemeColors, ThemeMode } from './types';

function hslVarToCSS(value: string): string {
  const parts = value.split('/').map((s) => s.trim());
  if (parts.length === 2) {
    const alpha = parseFloat(parts[1]!) / 100;
    return `hsla(${parts[0]!.replace(/ /g, ', ')}, ${alpha})`;
  }
  return `hsl(${value.replace(/ /g, ', ')})`;
}

function extractHue(hslVar: string): number {
  return parseInt(hslVar.split(' ')[0]!, 10);
}

function hsl(h: number, s: number, l: number): string {
  return `hsl(${h}, ${s}%, ${l}%)`;
}

export interface BloomThemeContextValue {
  theme: Theme;
  mode: ThemeMode;
  colorPreset: AppColorName;
  setMode: (mode: ThemeMode) => void;
  setColorPreset: (preset: AppColorName) => void;
}

export const BloomThemeContext = createContext<BloomThemeContextValue | null>(null);

export interface BloomThemeProviderProps {
  mode?: ThemeMode;
  colorPreset?: AppColorName;
  onModeChange?: (mode: ThemeMode) => void;
  onColorPresetChange?: (preset: AppColorName) => void;
  children: React.ReactNode;
}

export function BloomThemeProvider({
  mode: controlledMode,
  colorPreset: controlledPreset,
  onModeChange,
  onColorPresetChange,
  children,
}: BloomThemeProviderProps) {
  const rnScheme = useRNColorScheme();

  const mode = controlledMode ?? 'system';
  const appColor = controlledPreset ?? 'teal';

  const isAdaptive = mode === 'adaptive';
  const effectiveMode = isAdaptive ? 'system' : mode;
  const resolved: 'light' | 'dark' =
    effectiveMode === 'system'
      ? (rnScheme === 'dark' ? 'dark' : 'light')
      : effectiveMode;

  useEffect(() => {
    applyDarkClass(resolved);
  }, [resolved]);

  const setMode = useCallback(
    (newMode: ThemeMode) => {
      setColorSchemeSafe(newMode);
      onModeChange?.(newMode);
    },
    [onModeChange],
  );

  const setColorPreset = useCallback(
    (preset: AppColorName) => {
      onColorPresetChange?.(preset);
    },
    [onColorPresetChange],
  );

  const contextValue = useMemo<BloomThemeContextValue>(() => {
    const isDark = resolved === 'dark';

    let themeColors: ThemeColors;

    if (isAdaptive && Platform.OS !== 'web') {
      const adaptive = getAdaptiveColors();
      if (adaptive) {
        themeColors = adaptive;
      }
    }

    if (!themeColors!) {
      const preset = APP_COLOR_PRESETS[appColor];
      const vars = resolved === 'light' ? preset.light : preset.dark;
      const primaryHue = extractHue(vars['--primary']!);
      const destructiveHue = extractHue(vars['--destructive']!);

      const surface = hslVarToCSS(vars['--surface']!);
      const background = hslVarToCSS(vars['--background']!);
      const mutedForeground = hslVarToCSS(vars['--muted-foreground']!);

      themeColors = {
        background,
        backgroundSecondary: surface,
        backgroundTertiary: hslVarToCSS(vars['--muted']!),

        text: hslVarToCSS(vars['--foreground']!),
        textSecondary: mutedForeground,
        textTertiary: mutedForeground,

        border: hslVarToCSS(vars['--border']!),
        borderLight: hslVarToCSS(vars['--input']!),

        primary: preset.hex,
        primaryLight: surface,
        primaryDark: background,

        secondary: preset.hex,

        tint: preset.hex,
        icon: mutedForeground,
        iconActive: preset.hex,

        success: '#10B981',
        error: '#EF4444',
        warning: '#F59E0B',
        info: '#3B82F6',

        primarySubtle: isDark ? hsl(primaryHue, 50, 10) : hsl(primaryHue, 70, 93),
        primarySubtleForeground: isDark ? hsl(primaryHue, 70, 65) : hsl(primaryHue, 90, 25),
        negative: hsl(destructiveHue, 84, 45),
        negativeForeground: '#FFFFFF',
        negativeSubtle: isDark ? hsl(destructiveHue, 50, 10) : hsl(destructiveHue, 90, 95),
        negativeSubtleForeground: isDark ? hsl(destructiveHue, 70, 65) : hsl(destructiveHue, 80, 40),
        contrast50: isDark ? hsl(primaryHue, 15, 12) : hsl(primaryHue, 10, 93),

        card: surface,
        shadow: isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.1)',
        overlay: 'rgba(0, 0, 0, 0.5)',
      };
    }

    const theme: Theme = {
      mode: resolved,
      colors: themeColors,
      isDark,
      isLight: !isDark,
    };

    return { theme, mode, colorPreset: appColor, setMode, setColorPreset };
  }, [resolved, appColor, isAdaptive, mode, setMode, setColorPreset]);

  return (
    <BloomThemeContext.Provider value={contextValue}>
      {children}
    </BloomThemeContext.Provider>
  );
}
