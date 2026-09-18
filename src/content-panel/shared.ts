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
import type { StyleProp, ViewStyle } from 'react-native';

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
 * Four cases, in order:
 *
 *  - `surfaceColor` given — the caller stated it; nothing beats that.
 *  - `surfaceClassName` given — the caller REPAINTED the surface with a utility
 *    Bloom cannot resolve to a colour (that is the whole point of the prop), so
 *    publishing `card` would be a confident lie. The panel falls back to
 *    publishing the rung alone, which is the weaker answer it had before —
 *    `surfaceColor` is how a caller in this case gets the exact one back.
 *  - `surfaceStyle` carrying a `backgroundColor` — the same repaint by the other
 *    door, and the panel has to stop claiming `card` for it too. The colour is
 *    right there, but WHICH of the two paints is a platform question the panel
 *    must not guess at: `styled()` appends the class descriptor AFTER the style
 *    prop, so on native the class wins the array, while on web the inline style
 *    wins the cascade. Publishing either one would be right on one platform and
 *    quietly wrong on the other, so the panel publishes neither and the caller
 *    names it with `surfaceColor`.
 *  - none of them — the panel paints `bg-card`, so it publishes `colors.card`.
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
  if (surfaceClassName) return undefined;
  if (repaintedByStyle(surfaceStyle)) return undefined;
  return ctx?.theme.colors.card;
}
