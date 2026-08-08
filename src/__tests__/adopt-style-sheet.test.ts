/**
 * @jest-environment jsdom
 */

import {
  installConstructedStyleSheets,
  type ConstructedStyleSheetsHarness,
} from './support/constructed-style-sheets';

type AdoptStyleSheetModule = typeof import('../styles/adopt-style-sheet');

/**
 * A fresh copy of the module per test. It keeps the sheets it has constructed in
 * a module-scope registry, so without this a later test would see the previous
 * one's sheet and the idempotence cases would prove nothing.
 */
function freshModule(): AdoptStyleSheetModule {
  let loaded: AdoptStyleSheetModule | undefined;
  jest.isolateModules(() => {
    loaded = require('../styles/adopt-style-sheet') as AdoptStyleSheetModule;
  });
  if (!loaded) throw new Error('adopt-style-sheet failed to load');
  return loaded;
}

describe('adoptStyleSheet — constructed stylesheets (the CSP-safe path)', () => {
  let harness: ConstructedStyleSheetsHarness;

  beforeEach(() => {
    document.head.innerHTML = '';
    harness = installConstructedStyleSheets();
  });

  afterEach(() => {
    harness.uninstall();
  });

  /* THE point of the whole change. A `<style>` element carrying text content is
   * what `style-src 'self'` blocks, silently — so "no style element" is the
   * assertion that fails if the adoption branch is ever removed, and it is the
   * only one a CSP can tell apart. */
  it('applies the CSS through an adopted sheet, creating no <style> element', () => {
    const { adoptStyleSheet } = freshModule();

    adoptStyleSheet('bloom-test', '.x { color: red; }');

    expect(document.querySelectorAll('style')).toHaveLength(0);
    expect(harness.adopted()).toHaveLength(1);
    expect(harness.adopted()[0]?.cssText).toBe('.x { color: red; }');
  });

  it('repeat calls with the same CSS re-parse nothing and adopt nothing twice', () => {
    const { adoptStyleSheet } = freshModule();

    adoptStyleSheet('bloom-test', '.x { color: red; }');
    adoptStyleSheet('bloom-test', '.x { color: red; }');
    adoptStyleSheet('bloom-test', '.x { color: red; }');

    expect(harness.adopted()).toHaveLength(1);
    expect(harness.adopted()[0]?.replaceSyncCalls).toBe(1);
  });

  it('new CSS under the same id replaces the sheet content in place', () => {
    const { adoptStyleSheet } = freshModule();

    adoptStyleSheet('bloom-test', '.x { color: red; }');
    const first = harness.adopted()[0];
    adoptStyleSheet('bloom-test', '.x { color: blue; }');

    expect(harness.adopted()).toHaveLength(1);
    expect(harness.adopted()[0]).toBe(first);
    expect(harness.adopted()[0]?.cssText).toBe('.x { color: blue; }');
  });

  it('keeps one sheet per id', () => {
    const { adoptStyleSheet } = freshModule();

    adoptStyleSheet('bloom-a', '.a {}');
    adoptStyleSheet('bloom-b', '.b {}');

    expect(harness.adopted()).toHaveLength(2);
  });

  /* A consumer that owns `document.adoptedStyleSheets` can reassign it — a
   * framework swapping its own sheets, a test resetting the document. Bloom's
   * CSS has to come back, and without re-parsing. */
  it('re-adopts the same sheet after the document list is reset', () => {
    const { adoptStyleSheet } = freshModule();

    adoptStyleSheet('bloom-test', '.x {}');
    const first = harness.adopted()[0];
    document.adoptedStyleSheets = [];
    adoptStyleSheet('bloom-test', '.x {}');

    expect(harness.adopted()).toHaveLength(1);
    expect(harness.adopted()[0]).toBe(first);
    expect(harness.adopted()[0]?.replaceSyncCalls).toBe(1);
  });

  it('dropStyleSheet un-adopts only its own sheet', () => {
    const { adoptStyleSheet, dropStyleSheet } = freshModule();

    adoptStyleSheet('bloom-a', '.a {}');
    adoptStyleSheet('bloom-b', '.b {}');
    dropStyleSheet('bloom-a');

    expect(harness.adopted()).toHaveLength(1);
    expect(harness.adopted()[0]?.cssText).toBe('.b {}');
  });

  it('a dropped id can be adopted again', () => {
    const { adoptStyleSheet, dropStyleSheet } = freshModule();

    adoptStyleSheet('bloom-test', '.x {}');
    dropStyleSheet('bloom-test');
    adoptStyleSheet('bloom-test', '.y {}');

    expect(harness.adopted()).toHaveLength(1);
    expect(harness.adopted()[0]?.cssText).toBe('.y {}');
  });
});

describe('adoptStyleSheet — <style> fallback', () => {
  beforeEach(() => {
    document.head.innerHTML = '';
  });

  /* Plain jsdom: no `adoptedStyleSheets`, no `replaceSync`. Same for a browser
   * older than Chrome 73 / Safari 16.4 / Firefox 101. The CSS still has to
   * apply — under a permissive CSP, which is what those pages have. */
  it('the environment under test genuinely lacks the constructed API', () => {
    expect('adoptedStyleSheets' in document).toBe(false);
  });

  it('creates one <style> element carrying the CSS', () => {
    const { adoptStyleSheet } = freshModule();

    adoptStyleSheet('bloom-test', '.x { color: red; }');

    const element = document.getElementById('bloom-test');
    expect(element?.tagName).toBe('STYLE');
    expect(element?.textContent).toBe('.x { color: red; }');
  });

  it('does not duplicate the element across calls, and updates its content', () => {
    const { adoptStyleSheet } = freshModule();

    adoptStyleSheet('bloom-test', '.x { color: red; }');
    adoptStyleSheet('bloom-test', '.x { color: blue; }');

    expect(document.querySelectorAll('style#bloom-test')).toHaveLength(1);
    expect(document.getElementById('bloom-test')?.textContent).toBe(
      '.x { color: blue; }',
    );
  });

  it('dropStyleSheet removes the element', () => {
    const { adoptStyleSheet, dropStyleSheet } = freshModule();

    adoptStyleSheet('bloom-test', '.x {}');
    dropStyleSheet('bloom-test');

    expect(document.getElementById('bloom-test')).toBeNull();
  });
});
