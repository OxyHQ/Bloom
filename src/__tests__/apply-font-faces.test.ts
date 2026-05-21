/**
 * @jest-environment jsdom
 */

// Import the web variant directly. The default `apply-font-faces.ts` is a
// no-op stub that exists only so Metro never sees a module-level `.woff2`
// import on native — the real font-face injection lives in
// `apply-font-faces.web.ts`. Web bundlers select that file via extension
// resolution; here we reach for it explicitly so the test exercises the
// actual implementation under jsdom.
import { applyFontFaces } from '../fonts/apply-font-faces.web';

describe('applyFontFaces (web)', () => {
  beforeEach(() => {
    document.head.innerHTML = '';
    document.body.innerHTML = '';
  });

  it('injects a <style id="bloom-fonts"> element on first call', () => {
    expect(document.getElementById('bloom-fonts')).toBeNull();
    applyFontFaces();
    const style = document.getElementById('bloom-fonts');
    expect(style).not.toBeNull();
    expect(style?.tagName).toBe('STYLE');
  });

  it('is idempotent — calling twice does not duplicate the <style>', () => {
    applyFontFaces();
    applyFontFaces();
    applyFontFaces();
    const styles = document.querySelectorAll('style#bloom-fonts');
    expect(styles.length).toBe(1);
  });

  it('emits four @font-face rules', () => {
    applyFontFaces();
    const cssText = document.getElementById('bloom-fonts')?.textContent ?? '';
    const matches = cssText.match(/@font-face\s*{/g) ?? [];
    expect(matches.length).toBe(4);
  });

  it('declares the three Bloom font CSS variables on :root', () => {
    applyFontFaces();
    const cssText = document.getElementById('bloom-fonts')?.textContent ?? '';
    expect(cssText).toMatch(/--bloom-font-display:/);
    expect(cssText).toMatch(/--bloom-font-sans:/);
    expect(cssText).toMatch(/--bloom-font-mono:/);
  });

  it('references all four font families by name', () => {
    applyFontFaces();
    const cssText = document.getElementById('bloom-fonts')?.textContent ?? '';
    expect(cssText).toMatch(/font-family: 'BlomusModernus'/);
    expect(cssText).toMatch(/font-family: 'Inter'/);
    expect(cssText).toMatch(/font-family: 'Geist Mono'/);
  });
});
