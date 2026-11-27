/**
 * The cost gate for `.bloom`: each fixture, compiled by bloomc through the
 * Jest transformer, costs React no more fibers, hook slots or context reads
 * than its hand-written embedded-language equivalent (`bloom/equivalents.ts`).
 */
import { toElement, VStack } from '@oxy.so/bloom-language';

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

const TITLES = ['one', 'two', 'three', 'four', 'five'];
const ENTRIES = TITLES.map((label) => ({ id: label, label, extra: label.length }));

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
];

describe('a .bloom view costs what its hand-written equivalent does', () => {
  it.each(CASES)('$name', ({ bloom, hand }) => {
    const compiled: Cost = measured(toElement(bloom()));
    const written: Cost = measured(toElement(hand()));
    expect(compiled.fibers).toBeGreaterThan(0);
    expect(compiled.fibers).toBeLessThanOrEqual(written.fibers);
    expect(compiled.hooks).toBeLessThanOrEqual(written.hooks);
    expect(compiled.contexts).toBeLessThanOrEqual(written.contexts);
  });
});
