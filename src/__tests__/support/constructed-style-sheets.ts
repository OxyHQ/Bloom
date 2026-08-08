/**
 * A spec-shaped stand-in for constructed stylesheets, for the jsdom suites.
 *
 * jsdom 26 ships the `CSSStyleSheet` CONSTRUCTOR but neither `replaceSync` nor
 * `document.adoptedStyleSheets`, so every jsdom test takes Bloom's `<style>`
 * fallback. That makes the whole CSP-safe path — the reason
 * `styles/adopt-style-sheet.ts` exists — invisible to jest unless a test
 * installs the API itself. Without this, a mutation that deleted the adoption
 * branch entirely would leave the suite green.
 *
 * Not collected as a suite: jest's `testMatch` wants `*.test.ts` / `*.spec.ts`.
 */

export interface FakeStyleSheet {
  /** The CSS most recently handed to `replaceSync`. */
  cssText: string;
  /** How many times the sheet has been re-parsed, so a test can prove it wasn't. */
  replaceSyncCalls: number;
  replaceSync(css: string): void;
}

export interface ConstructedStyleSheetsHarness {
  /** The document's adopted sheets, read live (the code reassigns the array). */
  adopted(): readonly FakeStyleSheet[];
  /** Drop the API again, restoring jsdom's own `CSSStyleSheet`. */
  uninstall(): void;
}

export function installConstructedStyleSheets(): ConstructedStyleSheetsHarness {
  class FakeCSSStyleSheet implements FakeStyleSheet {
    cssText = '';
    replaceSyncCalls = 0;

    replaceSync(css: string): void {
      this.cssText = css;
      this.replaceSyncCalls += 1;
    }
  }

  const previousConstructor = Object.getOwnPropertyDescriptor(
    globalThis,
    'CSSStyleSheet',
  );

  Object.defineProperty(globalThis, 'CSSStyleSheet', {
    value: FakeCSSStyleSheet,
    writable: true,
    configurable: true,
  });
  Object.defineProperty(document, 'adoptedStyleSheets', {
    value: [],
    writable: true,
    configurable: true,
  });

  return {
    adopted: () =>
      document.adoptedStyleSheets as unknown as readonly FakeStyleSheet[],
    uninstall: () => {
      Reflect.deleteProperty(document, 'adoptedStyleSheets');
      if (previousConstructor) {
        Object.defineProperty(globalThis, 'CSSStyleSheet', previousConstructor);
      } else {
        Reflect.deleteProperty(globalThis, 'CSSStyleSheet');
      }
    },
  };
}
