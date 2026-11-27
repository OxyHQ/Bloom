/**
 * A narrowed binding is its source's dependency: inside `if sliceKey != none`, a child cached
 * on what it reads redraws when `sliceKey` changes, as a recycled feed row's does.
 */
import { type ComposedView, toElement } from '@oxy.so/bloom-language';
import * as RN from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';

// Required, not imported: see bloom.cost.test.tsx.
const { ThreadRow } = require('./bloom/narrowed.bloom') as {
  ThreadRow: (props: { sliceKey?: string; title: string }) => ComposedView;
};

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/** Every string the tree draws, in order. */
function drawn(renderer: TestRenderer.ReactTestRenderer): string[] {
  return renderer.root
    .findAll(
      (node) => typeof node.type === 'string' && node.children.every((c) => typeof c === 'string'),
    )
    .flatMap((node) => node.children as string[]);
}

it('redraws a child that reads a narrowed prop when the prop changes', () => {
  const row = (sliceKey: string | undefined) => (
    <RN.View>{toElement(ThreadRow({ sliceKey, title: 'Thread' }))}</RN.View>
  );
  let renderer!: TestRenderer.ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(row('a'));
  });
  expect(drawn(renderer)).toEqual(['a', 'Thread']);
  act(() => renderer.update(row('b')));
  expect(drawn(renderer)).toEqual(['b', 'Thread']);
  act(() => renderer.update(row(undefined)));
  expect(drawn(renderer)).toEqual([]);
  act(() => renderer.unmount());
});
