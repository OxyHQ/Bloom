/**
 * A closure may write a `var` of its function, as Swift's does: the function reads every write
 * once the closure has run, and a write is a new value, not a change to one another name holds.
 */

// Required, not imported: see bloom.cost.test.tsx.
const { tagged } = require('./bloom/captured.bloom') as {
  tagged: (
    tags: readonly string[],
    run: (tag: string) => void,
  ) => { tags: readonly string[]; actions: Readonly<Record<string, () => void>> };
};

it('reads the table its closure wrote', () => {
  const ran: string[] = [];
  const { tags, actions } = tagged(['a', 'b'], (tag) => ran.push(tag));
  expect(tags).toEqual(['row:a', 'row:b']);
  expect(Object.keys(actions)).toEqual(['a', 'b']);
  actions.b?.();
  expect(ran).toEqual(['b']);
});
