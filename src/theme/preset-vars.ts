import { Platform } from 'react-native';
import { APP_COLOR_PRESETS, type AppColorName, type PresetTokens } from './color-presets';

function extractHue(hslVar: string): number {
  return parseInt(hslVar.split(' ')[0] ?? '0', 10);
}

function extractSat(hslVar: string): number {
  return parseInt(hslVar.split(' ')[1] ?? '0', 10);
}

const RESOLVED_COLOR_MAP: Record<string, string> = {
  '--background': '--color-background',
  '--foreground': '--color-foreground',
  '--primary': '--color-primary',
  '--primary-foreground': '--color-primary-foreground',
  '--secondary': '--color-secondary',
  '--secondary-foreground': '--color-secondary-foreground',
  '--muted': '--color-muted',
  '--muted-foreground': '--color-muted-foreground',
  '--accent': '--color-accent',
  '--accent-foreground': '--color-accent-foreground',
  '--destructive': '--color-destructive',
  '--border': '--color-border',
  '--input': '--color-input',
  '--ring': '--color-ring',
  '--popover': '--color-popover',
  '--popover-foreground': '--color-popover-foreground',
  '--surface': '--color-surface',
  '--surface-foreground': '--color-surface-foreground',
  '--card': '--color-card',
  '--card-foreground': '--color-card-foreground',
};

export interface PresetVarsOptions {
  /**
   * Also emit Tailwind v4 resolved `--color-*` vars (wrapped in `hsl(...)`)
   * alongside the raw HSL triples. Needed when scoping a subtree where
   * Tailwind's `@theme` block has already precomputed `--color-*` at `:root`,
   * so overriding `--background` alone wouldn't cascade to `bg-background`.
   * Default `false`.
   */
  includeResolvedColorVars?: boolean;
}

/**
 * Bloom's base preset tokens extended with the surface/card/chart/sidebar
 * tokens that apps layer on top of the core shadcn palette. Synthesized from
 * the preset's primary hue so every preset stays in sync automatically.
 *
 * This is the single source of truth for extended theming vars — consumer apps
 * must not redefine these per-app.
 */
export function getPresetVars(
  colorName: AppColorName,
  mode: 'light' | 'dark',
  options: PresetVarsOptions = {},
): PresetTokens {
  const preset = APP_COLOR_PRESETS[colorName];
  const base = mode === 'light' ? preset.light : preset.dark;
  const get = (key: string): string => base[key] ?? '0 0% 0%';
  const primary = get('--primary');
  const foreground = get('--foreground');
  const hue = extractHue(primary);
  const sat = Math.min(extractSat(primary), 80);
  const isDark = mode === 'dark';

  const extended: PresetTokens = {
    ...base,
    '--card': isDark ? `${hue} 30% 10%` : '0 0% 100%',
    '--card-foreground': foreground,
    '--chart-1': `${hue} ${sat}% 85%`,
    '--chart-2': `${hue} ${sat}% 75%`,
    '--chart-3': `${hue} ${sat}% 65%`,
    '--chart-4': `${hue} ${sat}% ${isDark ? 55 : 75}%`,
    '--chart-5': `${hue} ${sat}% ${isDark ? 45 : 65}%`,
    '--content-area': isDark ? `${hue} 30% 8%` : get('--surface'),
    '--sidebar-foreground': foreground,
    '--sidebar-primary': primary,
    '--sidebar-primary-foreground': get('--primary-foreground'),
    '--sidebar-accent': isDark ? get('--sidebar') : get('--accent'),
    '--sidebar-accent-foreground': isDark ? foreground : get('--accent-foreground'),
    '--sidebar-border': get('--border'),
    '--sidebar-ring': get('--ring'),
  };

  if (!options.includeResolvedColorVars) return extended;

  const resolved: PresetTokens = { ...extended };
  for (const [rawKey, colorKey] of Object.entries(RESOLVED_COLOR_MAP)) {
    const value = extended[rawKey];
    if (value) resolved[colorKey] = `hsl(${value})`;
  }
  return resolved;
}

/**
 * Apply a preset's extended vars to `document.documentElement`. Web-only no-op
 * on native. `BloomThemeProvider` already writes the base preset vars on web;
 * call this only when an app needs the extended (card/chart/sidebar) tokens on
 * the document root.
 */
export function applyPresetVarsToDocument(
  colorName: AppColorName,
  mode: 'light' | 'dark',
  options?: PresetVarsOptions,
): void {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;

  const vars = getPresetVars(colorName, mode, options);
  const root = document.documentElement.style;
  for (const [key, value] of Object.entries(vars)) {
    root.setProperty(key, value);
  }
}
