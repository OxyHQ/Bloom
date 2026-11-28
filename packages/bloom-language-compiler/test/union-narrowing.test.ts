/**
 * `==` and `!=` on a literal union narrow it in both branches, through `||` and `&&`, and after a
 * guard that returns (lang-mention-10's union-eq-narrowing, Mention's appearance page).
 */

// A module, so its names are its own (tsc checks the tests together).
export {};

// Required, not imported: see bloom.cost.test.tsx.
const m = require('./packages/format-app/Sources/App/UnionNarrowing.bloom') as {
  appearanceTheme: (mode: string) => string;
  appearanceShade: (mode: string) => string | undefined;
  appearanceFallback: (mode: string) => string;
};

it('narrows a literal union by its tests', () => {
  expect(['light', 'dark', 'system', 'adaptive'].map(m.appearanceTheme)).toEqual([
    'light',
    'dark',
    'system',
    'system',
  ]);
  expect(['light', 'dark', 'system', 'adaptive'].map(m.appearanceShade)).toEqual([
    'light',
    'dark',
    undefined,
    undefined,
  ]);
  expect(['system', 'dark'].map(m.appearanceFallback)).toEqual(['light', 'dark']);
});
