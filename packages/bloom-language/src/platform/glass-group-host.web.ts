import type { PlatformGlassGroup } from './glass-group-host.types';

/**
 * The web has no glass container: each glass in a group is its own frosted
 * `Surface`, side by side. Shapes do not blend or share one sampling of what
 * is behind them (Bloom draws no SVG filters, masks or clip paths on a
 * material host), and a `glassID` morph is the motion engine's matched geometry.
 */
export function getPlatformGlassGroup(): PlatformGlassGroup {
  return null;
}
