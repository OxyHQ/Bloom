// Native font asset map for `useFonts(FONT_ASSETS)`.
//
// We ship variable .ttf files for Inter and Geist Mono (extracted from the
// official rsms/inter and vercel/geist-font releases) so the same family name
// covers all weights at runtime. `@fontsource(-variable)?/*` packages only
// publish .woff2 for their variable axes — modern react-native font loading
// requires .ttf, so we use the upstream variable TTFs instead.
//
// METRO-ONLY. The calls below are Metro asset requires: they resolve to
// asset-registry ids and only exist because Metro rewrites them at bundle
// time. Reaching a web or Node ESM bundler with them is fatal — `require` is
// not defined in an ES module, so merely importing this file throws
// `ReferenceError: require is not defined` at module-evaluation time and takes
// the whole app down before React can mount. That is why this map lives behind
// a platform split (`font-assets.web.ts` and the default `font-assets.ts` are
// both empty) and why the web barrel reaches for `./font-assets.web`
// explicitly rather than relying on bundler extension resolution.
import type { FontAssetMap } from './tokens';

export const FONT_ASSETS: FontAssetMap = {
  BlomusModernus: require('./assets/BlomusModernus-Regular.ttf'),
  'BlomusModernus-Bold': require('./assets/BlomusModernus-Bold.ttf'),
  Inter: require('./assets/InterVariable.ttf'),
  'Geist Mono': require('./assets/GeistMono-Variable.ttf'),
};
