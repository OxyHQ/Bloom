/**
 * The cost gate for `.bloom`: each fixture, compiled by bloomc through the
 * Jest transformer, costs React no more fibers, hook slots or context reads
 * than its hand-written embedded-language equivalent (`bloom/equivalents.ts`).
 */
import { toElement, VStack } from '@oxy.so/bloom-language';

import { Counter } from './bloom/counter.bloom';
import * as Hand from './bloom/equivalents';
import { Row } from './bloom/row.bloom';
import { Banner } from './bloom/static.bloom';
import { type Cost, measured } from './support/fibers';

const TITLES = ['one', 'two', 'three', 'four', 'five'];

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
