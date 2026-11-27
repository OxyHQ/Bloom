/**
 * A protocol composition constrains a type parameter: each protocol's witness is passed, written
 * `<T: P & Q>`, `where T: P & Q` or through a `type PQ = P & Q`.
 */

// Required, not imported: see bloom.cost.test.tsx.
const { all } = require('./bloom/composition.bloom') as { all: () => string };

it("reads each protocol's requirement through its own witness", () => {
  expect(all()).toBe('a 1b 2c 3');
});
