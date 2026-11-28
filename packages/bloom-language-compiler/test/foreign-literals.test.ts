/** A literal typed by a TS type keeps each element as written. */

// Required, not imported: see bloom.cost.test.tsx.
const { collapsed } = require('./bloom/foreign-literals.bloom') as {
  collapsed: (y: number) => { transform?: object[]; opacity?: number };
};

it('builds each transform as written', () => {
  expect(collapsed(8)).toEqual({ transform: [{ scale: 0.5 }, { translateY: 8 }], opacity: 1 });
});
