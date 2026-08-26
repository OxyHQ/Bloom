/**
 * react-native-teleport, vendored.
 *
 * COPIED FROM react-native-teleport 1.2.0 — `src/index.ts`. MIT, Copyright (c)
 * 2025 Kiryl Ziusko; the full licence is in `NOTICE` at the repository root and
 * every file in this directory names the file it came from.
 *
 * It is here rather than as a dependency because Bloom needs its NATIVE
 * re-parenting — moving one platform view between hosts instead of mounting a
 * second one — and that arrives as Fabric components, not as JavaScript.
 *
 * WHAT IS DIFFERENT FROM UPSTREAM, and it is not their code: **Bloom mounts
 * these portals from its ROOT LAYER, never from the origin screen.** Their own
 * recipe mounts the `<Portal>` inside the screen the media starts on, which is
 * correct for a navigator that keeps that screen alive — and measured against
 * expo-router on web, where the origin route unmounts on the URL change, it
 * takes the media with it (`count 1 -> 0 -> 0`). The portal is not what fails
 * there; the ownership is. Same piece, mounted where it does not die.
 *
 * Changed: import paths only, for this flat directory. Their file layout uses
 * `index.tsx` per component, which Bloom's family-layout gate reserves for pure
 * barrels, so each one is named after what it exports.
 */
export { default as PortalHost } from './PortalHost';
export { default as Portal } from './Portal';
export { default as PortalProvider } from './PortalProvider';
export { default as usePortal } from './use-portal';
export type {
  PortalHostProps,
  PortalProps,
  PortalProviderProps,
} from './types';
