import type { ThemeColors, ThemeMode } from './types';

/** Both values are computed with the normal colour engine before becoming CSS. */
export interface ThemePaintModes<T> {
  light: T;
  dark: T;
}

export { themePaintVars } from './prepaint';

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

/** Build variable references only after resolving both raw recipes. */
export function themePaintRecipe<T>(
  current: T,
  light: T,
  dark: T,
  prefix: string,
  lightVars: Record<string, string>,
  darkVars: Record<string, string>,
): T {
  if (typeof current === 'string' && typeof light === 'string' && typeof dark === 'string') {
    if (light === dark) return light as T;
    lightVars[prefix] = light;
    darkVars[prefix] = dark;
    return `var(${prefix})` as T;
  }
  if (Array.isArray(current) && Array.isArray(light) && Array.isArray(dark)) {
    return current.map((value, index) =>
      themePaintRecipe(value, light[index], dark[index], `${prefix}-${index}`, lightVars, darkVars),
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
        ),
      ]),
    ) as T;
  }
  return current;
}
