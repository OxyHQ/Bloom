import { Platform } from 'react-native';
import { APP_COLOR_PRESETS, type AppColorName, type PresetTokens } from './color-presets';

function extractHue(hslVar: string): number {
  return parseInt(hslVar.split(' ')[0] ?? '0', 10);
}

function extractSat(hslVar: string): number {
  return parseInt(hslVar.split(' ')[1] ?? '0', 10);
}

/**
 * Convert a shadcn-style HSL triple (`'H S% L%'`, optionally with an alpha tail
 * `'H S% L% / A'`) into an sRGB `rgb(...)` string.
 *
 * Why rgb and not hsl (the native alpha-utility bug this fixes)
 * -------------------------------------------------------------
 * Tailwind v4 compiles an alpha-on-theme-color utility (`bg-primary/10`) into a
 * `color-mix(... var(--color-primary) 10%, transparent)` declaration. On native,
 * react-native-css resolves that `color-mix` at runtime via `colorjs.io/fn`, but
 * its `color-mix` implementation registers ONLY the `sRGB`, `P3`, and `OKLab`
 * color spaces — never `HSL`. So if `--color-primary` resolves to an `hsl(...)`
 * string, `parse('hsl(...)')` throws, the mix is swallowed, and the utility
 * silently produces no color. Emitting the resolved var as `rgb(...)` (a space
 * colorjs.io always has registered) makes the alpha utilities resolve on native,
 * matching web. Full (non-alpha) utilities already worked because React Native's
 * native color parser handles `hsl()` directly; only `color-mix` was affected.
 *
 * Output is space-separated channels (`rgb(31 153 239)`), the modern CSS syntax
 * parsed by both `colorjs.io/fn` (with only sRGB/P3/OKLab registered) and
 * react-native-web / browsers. An alpha tail emits `rgb(r g b / a)`, likewise
 * parsed by both.
 *
 * Pure function — standard HSL→sRGB conversion, channels rounded to integers.
 * Tolerates a `deg` suffix on the hue and `%` suffixes on saturation/lightness.
 */
export function hslTripletToRgb(triplet: string): string {
  const [colorPart, alphaPart] = triplet.split('/').map((part) => part.trim());
  const channels = (colorPart ?? '').split(/\s+/).filter(Boolean);

  const hue = parseFloat((channels[0] ?? '0').replace(/deg$/i, ''));
  const sat = parseFloat((channels[1] ?? '0').replace('%', '')) / 100;
  const light = parseFloat((channels[2] ?? '0').replace('%', '')) / 100;

  const h = Number.isFinite(hue) ? hue : 0;
  const s = Number.isFinite(sat) ? sat : 0;
  const l = Number.isFinite(light) ? light : 0;

  const chroma = (1 - Math.abs(2 * l - 1)) * s;
  const huePrime = ((((h % 360) + 360) % 360) / 60);
  const second = chroma * (1 - Math.abs((huePrime % 2) - 1));

  let r = 0;
  let g = 0;
  let b = 0;
  if (huePrime < 1) {
    [r, g, b] = [chroma, second, 0];
  } else if (huePrime < 2) {
    [r, g, b] = [second, chroma, 0];
  } else if (huePrime < 3) {
    [r, g, b] = [0, chroma, second];
  } else if (huePrime < 4) {
    [r, g, b] = [0, second, chroma];
  } else if (huePrime < 5) {
    [r, g, b] = [second, 0, chroma];
  } else {
    [r, g, b] = [chroma, 0, second];
  }

  const match = l - chroma / 2;
  const red = Math.round((r + match) * 255);
  const green = Math.round((g + match) * 255);
  const blue = Math.round((b + match) * 255);

  if (alphaPart !== undefined && alphaPart !== '') {
    const alpha = alphaPart.endsWith('%')
      ? parseFloat(alphaPart) / 100
      : parseFloat(alphaPart);
    const safeAlpha = Number.isFinite(alpha) ? alpha : 1;
    return `rgb(${red} ${green} ${blue} / ${safeAlpha})`;
  }

  return `rgb(${red} ${green} ${blue})`;
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
   * Also emit Tailwind v4 resolved `--color-*` vars (as sRGB `rgb(...)` strings)
   * alongside the raw HSL triples. Needed when scoping a subtree where
   * Tailwind's `@theme` block has already precomputed `--color-*` at `:root`,
   * so overriding `--background` alone wouldn't cascade to `bg-background`.
   *
   * The resolved vars are emitted as `rgb(...)` rather than `hsl(...)` so the
   * alpha-on-theme-color utilities (`bg-primary/10`, `text-foreground/50`)
   * resolve on native: Tailwind compiles those to a runtime `color-mix(...)` that
   * react-native-css evaluates via `colorjs.io/fn`, which only registers the
   * sRGB/P3/OKLab spaces (not HSL) — so an `hsl(...)` var would throw and the
   * utility would silently render no color. See `hslTripletToRgb`. Default
   * `false`.
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
    // Light cards carry the same bold preset tint as `--popover` (H 55% 97%)
    // so they read as part of the preset family rather than a pure-white slab —
    // mirroring how dark cards (H 30% 10%) carry the accent hue into near-black.
    '--card': isDark ? `${hue} 30% 10%` : `${hue} 55% 97%`,
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
    if (value) resolved[colorKey] = hslTripletToRgb(value);
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
