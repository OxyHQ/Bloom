/**
 * Web variant of the `motion` barrel. Only the three layout-animation presets
 * fork — see `motion.web.ts` for why. `ScreenTransition` is universal: it already
 * branches on `Platform.OS` internally.
 */
export { ScaleAndFadeIn, ScaleAndFadeOut, ShrinkAndPop } from './motion.web';
export { ScreenTransition } from './ScreenTransition';
export type { ScreenTransitionProps, ScreenTransitionDirection } from './types';
