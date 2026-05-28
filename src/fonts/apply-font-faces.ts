// No-op on native. The web variant lives in apply-font-faces.web.ts and
// is selected by bundlers via the package.json conditions. RN consumers
// never need font-face injection — useFonts handles loading on native.
//
// The web variant does NOT pull in any `.woff2` files via asset imports —
// it imports base64 data URLs from `font-data.web.ts`. This stub stays
// here so the file split (`*.ts` vs `*.web.ts`) makes the platform
// intent explicit and so the runtime API surface matches across platforms.
export function applyFontFaces(): void {
  // intentionally empty
}
