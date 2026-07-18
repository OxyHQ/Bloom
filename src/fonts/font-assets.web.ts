// Web has no bundled font assets.
//
// `useFonts()` is native-only — the web `FontLoader` (`FontLoader.tsx`) calls
// `applyFontFaces()` instead, which injects the same four families as
// `@font-face` rules from base64 data URLs (`apply-font-faces.web.ts` /
// `font-data.web.ts`). So the map is empty by design, not by omission.
//
// This file exists so `index.web.ts` can name its font-asset source
// explicitly, exactly as it already does for `./apply-font-faces.web`. The
// native map (`font-assets.native.ts`) is built from Metro asset `require()`
// calls, which throw `ReferenceError: require is not defined` the moment an
// ES module bundler evaluates them — an explicit `./font-assets.web` import
// keeps that file out of the web graph without depending on the consumer's
// bundler being configured to resolve `.web` extensions (Vite, for one, does
// not do so by default).
import type { FontAssetMap } from './tokens';

export const FONT_ASSETS: FontAssetMap = {};
