/**
 * A `.task`'s setup and teardown (`defer { stop() }; await Task.cancellation`): the `defer` runs
 * when the task is cancelled (its id changes, the view leaves), as React's effect cleanup did, not
 * as soon as the body returns. And `sleep(for:)` in a `.task` takes the task's cancellation, so a
 * superseded debounce never fires.
 */
import { toElement } from '@oxy.so/bloom-language';
import TestRenderer, { act } from 'react-test-renderer';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// Required, not imported: see bloom.cost.test.tsx.
const m = require('./packages/format-app/Sources/App/TaskCancellation.bloom') as {
  Subscription: (props: {
    room: string;
    onStart: (room: string) => void;
    onStop: (room: string) => void;
  }) => Parameters<typeof toElement>[0];
  Debounced: (props: {
    query: string;
    onSearch: (query: string) => void;
  }) => Parameters<typeof toElement>[0];
};

const settle = () => act(async () => {});

it('runs a task’s defer when it is cancelled, not when its body returns', async () => {
  const log: string[] = [];
  const props = (room: string) => ({
    room,
    onStart: (r: string) => log.push(`start ${r}`),
    onStop: (r: string) => log.push(`stop ${r}`),
  });
  let r!: TestRenderer.ReactTestRenderer;
  act(() => {
    r = TestRenderer.create(toElement(m.Subscription(props('a'))));
  });
  await settle();
  expect(log).toEqual(['start a']);
  act(() => r.update(toElement(m.Subscription(props('b')))));
  await settle();
  expect(log).toEqual(['start a', 'stop a', 'start b']);
  act(() => r.unmount());
  await settle();
  expect(log).toEqual(['start a', 'stop a', 'start b', 'stop b']);
});

it('cancels a superseded sleep', async () => {
  const searched: string[] = [];
  const onSearch = (q: string) => searched.push(q);
  let r!: TestRenderer.ReactTestRenderer;
  act(() => {
    r = TestRenderer.create(toElement(m.Debounced({ query: 'b', onSearch })));
  });
  act(() => r.update(toElement(m.Debounced({ query: 'bl', onSearch }))));
  act(() => r.update(toElement(m.Debounced({ query: 'blo', onSearch }))));
  await act(() => new Promise((resolve) => setTimeout(resolve, 120)));
  expect(searched).toEqual(['blo']);
  act(() => r.unmount());
});
