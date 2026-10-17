import { StyleSheet } from 'react-native';

/**
 * RNW compiles box-none/box-only into parent + child CSS rules only for
 * StyleSheet.create entries. Raw inline CSS drops those RN-only values.
 * Shared compiled styles avoid the deprecated View prop without losing hit testing.
 */
export const pointerEventsStyles = StyleSheet.create({
  auto: { pointerEvents: 'auto' },
  none: { pointerEvents: 'none' },
  'box-none': { pointerEvents: 'box-none' },
  'box-only': { pointerEvents: 'box-only' },
});

/** Keep an omitted prop omitted: inheriting a portal's policy differs from explicit auto. */
export function pointerEventsStyle(value: keyof typeof pointerEventsStyles | undefined) {
  return value === undefined ? undefined : pointerEventsStyles[value];
}
