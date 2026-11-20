import type { PlatformGlass } from './glass-host.types';

/**
 * The web has no glass: a glass view draws Bloom's `Surface`, whose web
 * material is a frosted backdrop (`blur(24px)` with Bloom's measured
 * saturation and contrast) under the tint.
 */
export function getPlatformGlass(): PlatformGlass {
  return null;
}
