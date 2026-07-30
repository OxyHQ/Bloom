// Web font URLs, resolved by whatever bundler is building the consuming app.
//
// WEB-ONLY. Each import below hands the `.woff2` to the app's asset pipeline,
// which emits it as a standalone file and gives us back its URL:
//
//   - Metro (Expo web) rewrites the import to the exported asset path — its
//     asset transformer emits a bare string module whenever the platform is
//     `web`, so the imported value is the URL itself, not an asset id.
//   - Vite, Rollup and webpack 5 resolve it through their own asset handling
//     and return a content-hashed URL.
//
// Either way the browser fetches the four families alongside the JS and caches
// them under their own URLs, instead of re-parsing ~310 KB of base64 out of the
// entry bundle on every cold load. No consumer ever writes an asset filename
// down, so a font swap here cannot leave a downstream app pointing at a file
// that no longer exists.
//
// Metro does not carry `woff2` in its default `assetExts`, so a consumer
// bundling for web with Metro has to register it; `@oxyhq/app-preset`'s Metro
// base already does that for every Oxy app.
//
// Native never reaches this module. The default `apply-font-faces.ts` is a
// no-op stub and `FontLoader.native.tsx` loads the `.ttf` variants through
// `useFonts` instead, so no web font bytes enter a native bundle.
import blomusModernusBold from './assets/BlomusModernus-Bold.woff2';
import blomusModernusRegular from './assets/BlomusModernus-Regular.woff2';
import geistMonoVariable from './assets/GeistMono-Variable.woff2';
import interVariable from './assets/InterVariable.woff2';

export { blomusModernusRegular, blomusModernusBold, interVariable, geistMonoVariable };
