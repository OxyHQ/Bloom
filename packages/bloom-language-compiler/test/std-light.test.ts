/**
 * Counting a string never loads the UI runtime (lang-mention-16's std-loads-ui-runtime): the
 * standard library's string helpers are its own copy of the language's `text.ts`, so a package
 * file that only counts characters, and the standard library itself, load neither the
 * language's index nor a Bloom component. A test that mocks a Bloom component keeps its mock.
 */

// A module, so its names are its own (tsc checks the tests together).
export {};

jest.mock('@oxy.so/bloom-language', () => {
  throw new Error('the UI runtime was loaded');
});

it('counts characters without the UI runtime', () => {
  // Required, not imported: see bloom.cost.test.tsx.
  const m = require('./packages/format-app/Sources/App/Characters.bloom') as {
    [name: string]: unknown;
  };
  expect(m).toBeDefined();
});
