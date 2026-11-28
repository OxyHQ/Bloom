/** A file-scope `private var` keeps its value across calls, as a JS module `let` does. */

// Required, not imported: see bloom.cost.test.tsx.
const { bump, listen } = require('./bloom/module-var.bloom') as {
  bump: () => number;
  listen: (f: () => void) => void;
};

it('keeps the value between calls and calls the stored closure when there is one', () => {
  expect(bump()).toBe(1);
  let ticks = 0;
  listen(() => {
    ticks += 1;
  });
  expect(bump()).toBe(2);
  expect(ticks).toBe(1);
});
