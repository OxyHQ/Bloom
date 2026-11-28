/**
 * The cost gate for `.bloom`: each fixture, compiled by bloomc through the
 * Jest transformer, costs React no more fibers, hook slots or context reads
 * than its hand-written embedded-language equivalent (`bloom/equivalents.ts`).
 */
import { Text, toElement, VStack } from '@oxy.so/bloom-language';

import * as Hand from './bloom/equivalents';
import { type Cost, measured } from './support/fibers';

// Required, not imported: TypeScript types a `.bloom` module from the
// `.d.bloom.ts` bloomc writes beside it, which fixtures do not commit. Each
// module must have its hand-written equivalent's surface.
type Views = typeof Hand;
const { Counter } = require('./bloom/counter.bloom') as Pick<Views, 'Counter'>;
const { Row } = require('./bloom/row.bloom') as Pick<Views, 'Row'>;
const { Banner } = require('./bloom/static.bloom') as Pick<Views, 'Banner'>;
const { Titled } = require('./bloom/list.bloom') as Pick<Views, 'Titled'>;
const { Grid } = require('./bloom/grid.bloom') as Pick<Views, 'Grid'>;
const { Tagged } = require('./bloom/tagged.bloom') as Pick<Views, 'Tagged'>;
const { PostErrorBoundary } = require('./bloom/error-boundary.bloom') as Pick<
  Views,
  'PostErrorBoundary'
>;

const TITLES = ['one', 'two', 'three', 'four', 'five'];
const ENTRIES = TITLES.map((label) => ({ id: label, label, extra: label.length }));
const open = (_title: string) => {};

const CASES = [
  {
    name: 'a view with state, a derived value and a handler',
    bloom: () => Counter(),
    hand: () => Hand.Counter(),
  },
  {
    name: 'a list of rows',
    bloom: () => VStack(...TITLES.map((title, i) => Row({ title, pinned: i % 2 === 0 }))),
    hand: () => VStack(...TITLES.map((title, i) => Hand.Row({ title, pinned: i % 2 === 0 }))),
  },
  { name: 'a static view', bloom: () => Banner(), hand: () => Hand.Banner() },
  {
    name: 'a builder `for` as the last child of its stack',
    bloom: () => Titled({ titles: TITLES }),
    hand: () => Hand.Titled({ titles: TITLES }),
  },
  {
    name: 'a generic view bounded by a shape (no witness)',
    bloom: () => Grid({ entries: ENTRIES }),
    hand: () => Hand.Grid({ entries: ENTRIES }),
  },
  {
    name: "a hook function's useMemo/useCallback (one memo cache, no hook slot each)",
    bloom: () => Tagged({ title: 'one', tags: TITLES, onOpen: open }),
    hand: () => Hand.Tagged({ title: 'one', tags: TITLES, onOpen: open }),
    // The hand-written hook holds three slots; bloomc's cache is none (`$c` is the fiber's).
    fewerHooks: true,
  },
  {
    // Mention's feed rows (`__perf__/budgets.json`): TS's boundary class was the row's one
    // extra fiber, and the struct around Bloom's boundary costs no more (`inlineView`). As a
    // `view()` it was 1 fiber, 1 hook slot and 3 context reads more per row.
    name: 'a stateless view around one node (an error boundary) has no fiber of its own',
    bloom: () => VStack(Text('row'), PostErrorBoundary({ children: Text('a post'), postId: 'p1' })),
    hand: () =>
      VStack(Text('row'), Hand.PostErrorBoundary({ children: Text('a post'), postId: 'p1' })),
    same: true,
  },
];

describe('a .bloom view costs what its hand-written equivalent does', () => {
  it.each(CASES)('$name', ({ bloom, hand, fewerHooks, same }) => {
    const compiled: Cost = measured(toElement(bloom()));
    const written: Cost = measured(toElement(hand()));
    expect(compiled.fibers).toBeGreaterThan(0);
    expect(compiled.fibers).toBeLessThanOrEqual(written.fibers);
    expect(compiled.hooks).toBeLessThanOrEqual(written.hooks - (fewerHooks ? 3 : 0));
    expect(compiled.contexts).toBeLessThanOrEqual(written.contexts);
    if (same) expect(compiled).toEqual(written);
  });
});
