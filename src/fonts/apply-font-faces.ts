// No-op on native. The web variant lives in apply-font-faces.web.ts and
// is selected by bundlers via the package.json conditions. RN consumers
// never need font-face injection — useFonts handles loading on native.
//
// The split is load-bearing, not decorative: the web variant reaches
// `font-urls.web.ts`, whose module-level `.woff2` imports would otherwise
// drag a second, unusable copy of every font into the native bundle
// (Metro resolves an asset import on native to a registry id, not a URL).
// Keeping this stub empty is what guarantees native pays nothing for them.
export function applyFontFaces(): void {
  // intentionally empty
}
