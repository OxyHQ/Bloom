/**
 * The adaptive palette everywhere but Android and iOS: none.
 *
 * Material You and iOS dynamic colours are read from `expo-router`'s `Color`
 * proxy in `adaptive-colors.native.ts`, which Metro picks on a device. This
 * neutral default is what web and every non-Metro bundler resolve, and it names
 * no `expo-router` at all: an optional `require` is still linked whenever the
 * package is installed, so naming it here put the router into web bundles that
 * only asked for the theme or a menu, although web never reads it.
 */
export type { AdaptiveColors } from './adaptive-colors.native';

import type { AdaptiveColors } from './adaptive-colors.native';

export function getAdaptiveColors(): AdaptiveColors | null {
  return null;
}
