// Web variant of the `./loading` barrel.
//
// The default barrel (`./index.ts`) re-exports from `./Loading` and
// `./SpinnerIcon`, which statically import `react-native-reanimated` and
// `react-native-svg`. Reanimated has no web build — its worklets Babel plugin
// is native-only and importing it statically breaks every web bundler (Vite,
// webpack, Metro-web). The web forks (`./Loading.web`, `./SpinnerIcon.web`)
// render the same components with CSS keyframes/transitions and no native deps.
//
// Web bundlers select this file via the `"browser"` export condition in
// `package.json`'s `exports['./loading']`; native bundlers fall through to the
// React Native build above. Types are platform-agnostic, so they come straight
// from `./types`.
export { Loading } from './Loading.web';
export { SpinnerIcon } from './SpinnerIcon.web';
export type {
  LoadingProps,
  LoadingVariant,
  LoadingSize,
  SpinnerLoadingProps,
  TopLoadingProps,
  SkeletonLoadingProps,
  InlineLoadingProps,
} from './types';
