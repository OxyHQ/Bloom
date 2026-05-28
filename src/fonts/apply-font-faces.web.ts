import {
  blomusModernusRegular,
  blomusModernusBold,
  interVariable,
  geistMonoVariable,
} from './font-data.web';
import { fontFamilies } from './tokens';

const STYLE_ID = 'bloom-fonts';

/**
 * Inject @font-face rules and font CSS variables onto :root.
 *
 * Web-only. The native counterpart in `apply-font-faces.ts` is a no-op
 * stub — Metro cannot parse `.woff2` imports, so the file split keeps
 * the font payload out of the native bundle entirely. Idempotent: safe to
 * call multiple times; subsequent calls early-return after the
 * `<style id="bloom-fonts">` tag has been mounted. SSR-safe via the
 * `typeof document === 'undefined'` guard.
 *
 * The font URLs come from `./font-data.web`, a generated module that
 * embeds the woff2 bytes as base64 data URLs. Inlining (rather than
 * relying on bundler asset loaders for `.woff2`) means consumers do not
 * have to extend Metro's `assetExts` or add a webpack/Vite asset rule —
 * the published JS is self-contained. See `scripts/generate-font-data.mjs`
 * for the rationale and trade-offs.
 */
export function applyFontFaces(): void {
  if (typeof document === 'undefined') return;
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    @font-face { font-family: 'BlomusModernus'; src: url(${blomusModernusRegular}) format('woff2'); font-weight: 400; font-style: normal; font-display: swap; }
    @font-face { font-family: 'BlomusModernus'; src: url(${blomusModernusBold}) format('woff2'); font-weight: 700; font-style: normal; font-display: swap; }
    @font-face { font-family: 'Inter'; src: url(${interVariable}) format('woff2-variations'); font-weight: 100 900; font-style: normal; font-display: swap; }
    @font-face { font-family: 'Geist Mono'; src: url(${geistMonoVariable}) format('woff2-variations'); font-weight: 100 900; font-style: normal; font-display: swap; }
    :root {
      --bloom-font-display: ${fontFamilies.display};
      --bloom-font-sans: ${fontFamilies.sans};
      --bloom-font-mono: ${fontFamilies.mono};
    }
  `;
  document.head.appendChild(style);
}
