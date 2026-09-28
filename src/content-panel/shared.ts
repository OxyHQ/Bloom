/**
 * What the panel tells its subtree it is painted in — shared by both forks, so
 * web and native cannot answer the question differently.
 *
 * `ContentPanel` is the surface an app's routed content sits on, which makes it
 * the container most often asked "what colour are you?" — by a sticky header
 * that has to be opaque over the scrolling column, a tab rail, a search field's
 * backing, a reply bar pinned to the bottom. Every one of those had to repeat
 * the panel's own `bg-card` at its call site, and repeating it is what makes a
 * change to the panel's surface a sweep through the app instead of one prop.
 *
 * So the panel publishes it: `styles/surface-levels.ts` carries the mechanism
 * (the ambient rung, the exact `fill`, and the web variable), and this decides
 * WHICH colour is the honest answer for a given set of props.
 */
import { useContext } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { BloomThemeContext } from '../theme/BloomThemeProvider';

/**
 * Whether a caller's `surfaceStyle` repaints the surface.
 *
 * Walked by hand rather than with `StyleSheet.flatten` for the reason
 * `styles/flatten-web-style.ts` records: this repo's `react-native` jest mock
 * stubs `flatten` as an identity no-op, so an array style would pass through
 * unflattened and the answer would silently differ between a test and an app.
 * Later entries win, mirroring React-Native array-style precedence; falsy holes
 * and registered-style ids (bare numbers, unresolvable without the RN runtime)
 * are skipped, and an id is treated as "cannot know" rather than "no colour".
 */
function repaintedByStyle(style: StyleProp<ViewStyle>): boolean {
  if (!style) return false;
  if (Array.isArray(style)) {
    return style.some((entry) => repaintedByStyle(entry as StyleProp<ViewStyle>));
  }
  if (typeof style === 'number') return true;
  return typeof style === 'object' && 'backgroundColor' in style && style.backgroundColor != null;
}

/**
 * The exact fill the panel publishes, or `undefined` when it cannot know it.
 *
 * The explicit surfaceColor wins, followed by a string background in
 * surfaceStyle. A class-only repaint is unknown unless its caller supplies
 * surfaceColor. Otherwise the default card token is the raw fill.
 * Framed hosts move this fill into translucent paint and publish its composite;
 * unframed hosts retain the unmodified fill.
 *
 * Outside a `BloomThemeProvider` there is no palette to name, and the panel has
 * always rendered there on native, so this stays optional rather than throwing:
 * a panel does not start failing at the moment it gets more informative.
 */
export function usePanelSurfaceFill(
  surfaceClassName: string | undefined,
  surfaceStyle: StyleProp<ViewStyle>,
  surfaceColor: string | undefined,
): string | undefined {
  const ctx = useContext(BloomThemeContext);
  if (surfaceColor) return surfaceColor;
  const background = StyleSheet.flatten(surfaceStyle)?.backgroundColor;
  if (typeof background === 'string') return background;
  if (surfaceClassName) return undefined;
  if (repaintedByStyle(surfaceStyle)) return undefined;
  return ctx?.theme.colors.card;
}
