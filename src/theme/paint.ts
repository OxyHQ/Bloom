import type { ThemeColors, ThemeMode } from './types';
import type { AppColorName } from './color-presets';

/** Both values are computed with the normal colour engine before becoming CSS. */
export interface ThemePaintModes<T> {
  light: T;
  dark: T;
  resolvePreset?: (preset: AppColorName, mode: 'light' | 'dark') => T;
}

export function resolvePaintMode<T>(
  modes: ThemePaintModes<T>,
  mode: 'light' | 'dark',
  preset?: AppColorName,
): T {
  return preset && modes.resolvePreset ? modes.resolvePreset(preset, mode) : modes[mode];
}

/** Raw semantic colors stay numeric; only final web paint reads these variables. */
export function themePaintVars(colors: ThemeColors): Record<string, string> {
  return Object.fromEntries(
    Object.entries(colors).map(([name, value]) => [`--bloom-paint-${name}`, value]),
  );
}

export function themePaintColors(colors: ThemeColors): ThemeColors {
  return Object.fromEntries(
    Object.keys(colors).map((key) => [key, `var(--bloom-paint-${key})`]),
  ) as unknown as ThemeColors;
}

/** Escape declaration delimiters; a custom colour must never become a CSS rule. */
export function paintDeclarations(vars: Record<string, string>): string {
  return Object.entries(vars)
    .map(
      ([key, value]) =>
        `${key}:${value.replace(/[{};]/g, (c) => `\\${c.charCodeAt(0).toString(16)} `)};`,
    )
    .join('');
}

/** Ordinary rules select complete paint values, including gradients and shadows. */
export function themePaintCss(
  selector: string,
  light: Record<string, string>,
  dark: Record<string, string>,
  defaultMode: ThemeMode = 'system',
  fixedMode?: 'light' | 'dark',
): string {
  const l = paintDeclarations(light);
  const d = paintDeclarations(dark);
  if (fixedMode) return `${selector}{${fixedMode === 'dark' ? d : l}}`;
  const prefix = ':root';
  const suffix = selector === ':root' ? '' : ` ${selector}`;
  const system = defaultMode === 'system' || defaultMode === 'adaptive';
  return `${selector}{${defaultMode === 'dark' ? d : l}}${system ? `@media(prefers-color-scheme:dark){${prefix}:not([data-bloom-theme-mode])${suffix}{${d}}}` : ''}${prefix}[data-bloom-theme-mode="light"]${suffix}{${l}}${prefix}[data-bloom-theme-mode="dark"]${suffix}{${d}}`;
}

export interface PresetPaintVars {
  preset: AppColorName;
  light: Record<string, string>;
  dark: Record<string, string>;
}

/** Share aliases only when their complete preset/mode vectors are identical. */
export function presetPaintCss(
  variants: readonly PresetPaintVars[],
  defaultPreset: AppColorName,
  defaultMode: ThemeMode = 'system',
): string {
  const base = variants.find((variant) => variant.preset === defaultPreset);
  if (!base) throw new Error('Bloom prepaint requires its default preset.');
  const vectors = new Map<string, string>();
  const aliases: Record<string, string> = {};
  for (const key of Object.keys(base.light)) {
    const vector = JSON.stringify(variants.flatMap((value) => [value.light[key], value.dark[key]]));
    const canonical = vectors.get(vector);
    if (canonical) aliases[key] = `var(${canonical})`;
    else vectors.set(vector, key);
  }
  const independent = (values: Record<string, string>) =>
    Object.fromEntries(Object.entries(values).filter(([key]) => !(key in aliases)));
  let css = Object.keys(aliases).length ? `:root{${paintDeclarations(aliases)}}` : '';
  css += themePaintCss(':root', independent(base.light), independent(base.dark), defaultMode);
  for (const variant of variants) {
    if (variant === base) continue;
    for (const mode of ['light', 'dark'] as const) {
      const delta = Object.fromEntries(
        Object.entries(independent(variant[mode])).filter(
          ([key, value]) => value !== base[mode][key],
        ),
      );
      if (Object.keys(delta).length) {
        css += `:root[data-bloom-theme-preset="${variant.preset}"][data-bloom-theme-mode="${mode}"]{${paintDeclarations(delta)}}`;
      }
    }
  }
  return css;
}

/** Build variable references only after resolving both raw recipes. */
export function themePaintRecipe<T>(
  current: T,
  light: T,
  dark: T,
  prefix: string,
  lightVars: Record<string, string>,
  darkVars: Record<string, string>,
  variableStrings = false,
): T {
  if (typeof current === 'string' && typeof light === 'string' && typeof dark === 'string') {
    if (light === dark && !variableStrings) return light as T;
    lightVars[prefix] = light;
    darkVars[prefix] = dark;
    return `var(${prefix})` as T;
  }
  if (Array.isArray(current) && Array.isArray(light) && Array.isArray(dark)) {
    return current.map((value, index) =>
      themePaintRecipe(
        value,
        light[index],
        dark[index],
        `${prefix}-${index}`,
        lightVars,
        darkVars,
        variableStrings,
      ),
    ) as T;
  }
  if (current && light && dark && typeof current === 'object') {
    return Object.fromEntries(
      Object.keys(current).map((key) => [
        key,
        themePaintRecipe(
          current[key as keyof T],
          light[key as keyof T],
          dark[key as keyof T],
          `${prefix}-${key.replace(/[^a-zA-Z0-9_-]/g, '_')}`,
          lightVars,
          darkVars,
          variableStrings,
        ),
      ]),
    ) as T;
  }
  return current;
}
