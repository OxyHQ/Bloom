import type { StyleProp, TextStyle } from 'react-native';

/**
 * Bloom typography defaults are applied via inline `style` only when the caller
 * does not pass `className`. When `className` is present, NativeWind compiles
 * font-size / line-height / weight / color utilities into `style` first; inline
 * defaults that repeat those keys would win the merge and silently override the
 * utilities (the Homiio hero-title bug).
 */
export function typographyDefaultsWhenNoClassName(
  className: string | undefined,
  defaults: TextStyle,
): TextStyle | undefined {
  return className?.trim() ? undefined : defaults;
}

export function mergeTypographyStyle(
  className: string | undefined,
  defaults: TextStyle | undefined,
  base: StyleProp<TextStyle>,
  style: StyleProp<TextStyle> | undefined,
): StyleProp<TextStyle> {
  const resolvedDefaults = defaults
    ? typographyDefaultsWhenNoClassName(className, defaults)
    : undefined;

  return [resolvedDefaults, base, style];
}
