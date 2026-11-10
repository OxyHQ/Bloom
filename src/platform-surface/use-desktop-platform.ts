import type { PlatformSurfaceAdapter } from './types';
import { usePlatformSurfaces } from './context';

/**
 * Whether Bloom draws for a desktop PLATFORM: an adapter that reports `window`
 * (an application in a desktop window, OxyOS's) or `pointer` (a desktop's shell,
 * which is in no window). There Bloom takes the desktop's own chrome: the
 * desktop text styles (`typography/desktop-scale.ts`), neutral window surfaces,
 * compact menus with an accent highlight, one alert layout and the desktop's
 * interaction states.
 *
 * A browser is not a desktop platform by this test, whatever its pointer: a web
 * application keeps its own approved look, and `useTouchInput()` alone decides
 * its geometry. A phone never is.
 */
export function isDesktopPlatform(adapter: PlatformSurfaceAdapter | null | undefined): boolean {
  const capabilities = adapter?.capabilities;
  return capabilities?.has('window') === true || capabilities?.has('pointer') === true;
}

/** {@link isDesktopPlatform} for the adapter `BloomProvider` registered. */
export function useDesktopPlatform(): boolean {
  return isDesktopPlatform(usePlatformSurfaces());
}
