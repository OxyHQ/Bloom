// Web variant of the `./fonts` barrel.
//
// Every re-export below that has a platform fork names its `.web` source
// OUTRIGHT rather than letting the bundler pick. That is deliberate: web
// bundlers are not required to resolve `.web` extensions (Vite does not, out
// of the box), so an extensionless specifier here would quietly fall through
// to the default file.
//
// - `./apply-font-faces.web` performs the real `@font-face` injection using
//   inlined base64 data URLs (see `font-data.web.ts`); the default
//   `./apply-font-faces` is a no-op stub for native.
// - `./font-assets.web` is an empty map. The native map is built from Metro
//   asset `require()` calls, and importing it from an ES module throws
//   `ReferenceError: require is not defined` during module evaluation — which
//   white-screens the consumer before React mounts. Naming the `.web` file
//   here is what keeps it out of the web graph.
//
// Web bundlers select this file via the `"browser"` condition in
// `package.json`'s `exports['./fonts']`; native bundlers fall through to
// `./index.ts` via the `"react-native"` condition.
export { fontFamilies, fontCssVars } from './tokens';
export type { FontFamilyName } from './tokens';
export { applyFontFaces } from './apply-font-faces.web';
export { FONT_ASSETS } from './font-assets.web';
export { FontLoader } from './FontLoader';
export type { FontLoaderProps } from './FontLoader';
