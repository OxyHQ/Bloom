// Web variant of the `./composer-loader` barrel: the light band laps on CSS
// keyframes over a DOM `<svg>` instead of a react-native-svg frame clock.
export { ComposerLoader } from './ComposerLoader.web';
export { resolveComposerLoaderColors, DEFAULT_COMPOSER_LOADER_COLORS } from './shared';
export type { ComposerLoaderColors, ComposerLoaderProps } from './types';
