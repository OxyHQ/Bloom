import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import { FONT_FACE_CSS } from './font-face-css.web';

const STYLE_ID = 'bloom-fonts';

/**
 * Inject @font-face rules and font CSS variables onto :root.
 *
 * Web-only. The native counterpart in `apply-font-faces.ts` is a no-op
 * stub — native loads its fonts through `useFonts(FONT_ASSETS)`, so the file
 * split keeps the web font payload out of the native bundle entirely.
 * Idempotent: safe to call multiple times; `adoptStyleSheet` keys the sheet by
 * id, so repeat calls re-parse nothing. SSR-safe via its `typeof document`
 * guard. Imperative consumers share the exact sheet used by `FontLoader`,
 * including on pages whose CSP forbids inline styles — see
 * `styles/adopt-style-sheet.ts`.
 *
 * The URLs come from `./font-urls.web`, which imports the `.woff2` files so
 * the consuming bundler emits them as separate, cacheable assets. See that
 * module for the per-bundler details and for the one thing a consumer has to
 * provide (Metro needs `woff2` in `assetExts`).
 */
export function applyFontFaces(): void {
  // A provider's authorized SSR sheet already owns loaded FontFace objects.
  // Re-declaring them in a constructed sheet would restart font loading.
  const serverSheet =
    typeof document === 'undefined'
      ? null
      : document.querySelector<HTMLStyleElement>('[data-bloom-server-style="bloom-fonts"]');
  if (serverSheet?.sheet && serverSheet.textContent === FONT_FACE_CSS) return;
  adoptStyleSheet(STYLE_ID, FONT_FACE_CSS);
}
