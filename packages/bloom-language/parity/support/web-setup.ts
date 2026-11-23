// Bloom's root `__mocks__/react-native.ts` stands in for React Native in every
// suite; the web suite renders react-native-web itself, as Bloom's web suites do.
jest.mock('react-native', () => jest.requireActual('react-native-web'));

// jsdom lays nothing out and has no ResizeObserver; a measured reveal (an
// accordion's) observes its content, which here never resizes. Both sides of a
// case observe the same nothing.
class NoResize {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}
(globalThis as { ResizeObserver?: unknown }).ResizeObserver ??= NoResize;

// jsdom lays nothing out and has no ResizeObserver; a component that observes
// its size (a collapsible's body) gets one that never reports, on both sides.
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
}

// jsdom knows `font-variant` as CSS 2 wrote it (`normal | small-caps`) and drops
// `font-variant: tabular-nums` (react-native-web's `fontVariant`), inline or read
// from a rule. The browser takes the shorthand's numeric keywords as the
// longhand they belong to (Chrome computes `font-variant-numeric: tabular-nums`
// for both), so here they are written to that longhand.
const NUMERIC = new Set([
  'lining-nums',
  'oldstyle-nums',
  'proportional-nums',
  'tabular-nums',
  'diagonal-fractions',
  'stacked-fractions',
  'ordinal',
  'slashed-zero',
]);
for (const name of ['fontVariant', 'font-variant']) {
  const own = Object.getOwnPropertyDescriptor(CSSStyleDeclaration.prototype, name);
  if (own?.set === undefined) continue;
  const set = own.set;
  Object.defineProperty(CSSStyleDeclaration.prototype, name, {
    ...own,
    set(this: CSSStyleDeclaration, value: unknown) {
      if (typeof value === 'string' && value.split(' ').every((word) => NUMERIC.has(word)))
        this.fontVariantNumeric = value;
      else set.call(this, value);
    },
  });
}
