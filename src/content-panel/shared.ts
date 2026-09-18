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

import { BloomThemeContext } from '../theme/BloomThemeProvider';

/**
 * The exact fill the panel publishes, or `undefined` when it cannot know it.
 *
 * Three cases, in order:
 *
 *  - `surfaceColor` given — the caller stated it; nothing beats that.
 *  - `surfaceClassName` given — the caller REPAINTED the surface with a utility
 *    Bloom cannot resolve to a colour (that is the whole point of the prop), so
 *    publishing `card` would be a confident lie. The panel falls back to
 *    publishing the rung alone, which is the weaker answer it had before —
 *    `surfaceColor` is how a caller in this case gets the exact one back.
 *  - neither — the panel paints `bg-card`, so it publishes `colors.card`.
 *
 * Outside a `BloomThemeProvider` there is no palette to name, and the panel has
 * always rendered there on native, so this stays optional rather than throwing:
 * a panel does not start failing at the moment it gets more informative.
 */
export function usePanelSurfaceFill(
  surfaceClassName: string | undefined,
  surfaceColor: string | undefined,
): string | undefined {
  const ctx = useContext(BloomThemeContext);
  if (surfaceColor) return surfaceColor;
  if (surfaceClassName) return undefined;
  return ctx?.theme.colors.card;
}
