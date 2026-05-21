/// <reference path="../assets.d.ts" />
import blomusReg from './assets/BlomusModernus-Regular.woff2';
import blomusBold from './assets/BlomusModernus-Bold.woff2';
import interVar from './assets/InterVariable.woff2';
import geistMono from './assets/GeistMono-Variable.woff2';
import { fontFamilies } from './tokens';

const STYLE_ID = 'bloom-fonts';

/**
 * Inject @font-face rules and font CSS variables onto :root.
 *
 * Web-only. The native counterpart in `apply-font-faces.ts` is a no-op
 * stub — Metro cannot parse `.woff2` imports, so the file split keeps
 * those imports out of the native bundle entirely. Idempotent: safe to
 * call multiple times; subsequent calls early-return after the
 * `<style id="bloom-fonts">` tag has been mounted. SSR-safe via the
 * `typeof document === 'undefined'` guard.
 */
export function applyFontFaces(): void {
  if (typeof document === 'undefined') return;
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    @font-face { font-family: 'BlomusModernus'; src: url(${blomusReg}) format('woff2'); font-weight: 400; font-style: normal; font-display: swap; }
    @font-face { font-family: 'BlomusModernus'; src: url(${blomusBold}) format('woff2'); font-weight: 700; font-style: normal; font-display: swap; }
    @font-face { font-family: 'Inter'; src: url(${interVar}) format('woff2-variations'); font-weight: 100 900; font-style: normal; font-display: swap; }
    @font-face { font-family: 'Geist Mono'; src: url(${geistMono}) format('woff2-variations'); font-weight: 100 900; font-style: normal; font-display: swap; }
    :root {
      --bloom-font-display: ${fontFamilies.display};
      --bloom-font-sans: ${fontFamilies.sans};
      --bloom-font-mono: ${fontFamilies.mono};
    }
  `;
  document.head.appendChild(style);
}
