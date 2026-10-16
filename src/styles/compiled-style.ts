import { StyleSheet, type StyleProp } from 'react-native';

/**
 * A compiled-CSS style entry as react-native-web reads it: `{ $$css: true,
 * <key>: '<class names>' }`. On web, `styled(Component, { className: 'style' })`
 * delivers a caller's `className` to `Component` this way, appended to its
 * `style` array.
 */
export type CompiledStyle = { $$css: true } & Record<string, unknown>;

export function isCompiledStyle(entry: unknown): entry is CompiledStyle {
  return typeof entry === 'object' && entry !== null && (entry as CompiledStyle).$$css === true;
}

/**
 * Separate a caller's `style` into its compiled class entries and its inline
 * values, flattened.
 *
 * Never `StyleSheet.flatten` a style that may carry compiled CSS into ONE object
 * and render it: the `$$css` marker lands beside the inline numbers, so
 * react-native-web's styleq treats the whole object as class names, logs
 * `styleq: <prop> typeof <number> is not "string" or "null"` for every inline
 * value on every render, and drops them. Read values from `inline`, and render
 * `classes` as their own array entries next to the inline object.
 *
 * Native has no compiled entries — react-native-css resolves classes to style
 * objects there — so `classes` is empty and `inline` is the plain flatten.
 */
export function splitCompiledStyle<T extends object>(
  style: StyleProp<T>,
): { classes: StyleProp<T>; inline: T | undefined } {
  // Kept as the caller's own style entries, so they render where a style goes.
  const classes: StyleProp<T>[] = [];
  const rest: StyleProp<T>[] = [];
  const walk = (entry: StyleProp<T>): void => {
    if (Array.isArray(entry)) {
      for (const child of entry as readonly StyleProp<T>[]) walk(child);
    } else if (isCompiledStyle(entry)) {
      classes.push(entry as StyleProp<T>);
    } else if (entry) {
      rest.push(entry);
    }
  };
  walk(style);
  return {
    classes: classes as StyleProp<T>,
    inline: rest.length ? (StyleSheet.flatten(rest as StyleProp<T>) as T | undefined) : undefined,
  };
}
