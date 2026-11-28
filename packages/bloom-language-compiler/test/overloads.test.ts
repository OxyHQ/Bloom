/**
 * Swift's overloading by argument labels: free functions, static functions and instance methods
 * of one name, each called by the labels it takes (a default left out, a trailing closure), from
 * another file of the module.
 */

// A module, so its names are its own (tsc checks the tests together).
export {};

// Required, not imported: see bloom.cost.test.tsx.
const m = require('./packages/format-app/Sources/App/OverloadsUse.bloom') as {
  overloadedFree: () => string[];
  overloadedMembers: () => string[];
};

it('calls the free function its labels name', () => {
  expect(m.overloadedFree()).toEqual(['3 items', 'named x', '7/100', '7/10']);
});

it('calls the static function and the method their labels name', () => {
  expect(m.overloadedMembers()).toEqual(['20 C', '0!', '2 items', '007']);
});
