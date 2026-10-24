/**
 * The adaptive palette everywhere but Android and iOS: none.
 *
 * Material You and iOS dynamic colours are read from `expo-router`'s `Color`
 * proxy in `adaptive-colors.native.ts`, which Metro picks on a device. This
 * neutral default is what web and every non-Metro bundler resolve, and it names
 * no `expo-router` at all: the optional `require` there still put the whole
 * router (and react-native-screens) into web bundles that only asked for the
 * theme or a menu, although web never reads it.
 */
export type { AdaptiveColors } from './adaptive-colors.native';

import type { AdaptiveColors } from './adaptive-colors.native';

export function getAdaptiveColors(): AdaptiveColors | null {
  return null;
}
