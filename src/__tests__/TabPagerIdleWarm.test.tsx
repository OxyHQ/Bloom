import type React from 'react';
import { Text } from 'react-native';
import { act, render } from '@testing-library/react-native';
import { makeMutable } from 'react-native-reanimated';

import { TabPager } from '../tab-pager/expo-router/TabPager';
import { createPageModel } from '../tab-pager/pages';

/**
 * The resting page's preloading neighbours mount once the JS thread is idle, not on the
 * frame after it settled: at launch a neighbour mounted then (Mention's Videos tab next to
 * Home, with its reel and player) competed with the first page's first paint.
 */
jest.mock('react-native-screens', () => ({
  Screen: (props: { children: React.ReactNode }) => props.children,
}));
jest.mock('../tab-pager/expo-router/PredictiveBackHost', () => ({
  isPredictiveBackAvailable: () => false,
  PredictiveBackHost: (props: { children: React.ReactNode }) => props.children,
}));
jest.mock('../tab-pager/expo-router/pager-view-module', () => ({
  loadPagerView: () => {
    const { forwardRef, useImperativeHandle } = jest.requireActual('react');
    return forwardRef((props: { children: React.ReactNode }, ref: unknown) => {
      useImperativeHandle(ref, () => ({ setPage: () => {}, setPageWithoutAnimation: () => {} }));
      return props.children;
    });
  },
  warnPagerViewUnavailable: () => {},
}));

const model = createPageModel(
  ['a', 'b', 'c'].map((name) => ({ name, href: `/${name}`, bar: true, preload: true })),
);
const routes = model.pages.map((page) => ({ key: page.name, name: page.name }));
const descriptors = Object.fromEntries(
  routes.map((r) => [r.key, { render: () => <Text>{`page ${r.name}`}</Text> }]),
);

const idle: (() => void)[] = [];
const frames: (() => void)[] = [];
beforeAll(() => {
  globalThis.requestIdleCallback = ((cb: () => void) => idle.push(cb)) as never;
  globalThis.cancelIdleCallback = (() => {}) as never;
  globalThis.requestAnimationFrame = ((cb: () => void) => frames.push(cb)) as never;
  globalThis.cancelAnimationFrame = () => {};
});
afterAll(() => {
  // @ts-expect-error restoring the test environment
  delete globalThis.requestIdleCallback;
  // @ts-expect-error restoring the test environment
  delete globalThis.cancelIdleCallback;
});

it('mounts the resting page first, and its neighbours once the app is idle', () => {
  const tree = render(
    <TabPager
      model={model}
      state={{ index: 0, routes }}
      descriptors={descriptors}
      progress={makeMutable(0)}
      chromeProgress={makeMutable(0)}
      onCommit={() => {}}
    />,
  );
  expect(tree.queryByText('page a')).not.toBeNull();
  // Frames pass while the first page paints: the neighbour waits.
  act(() => {
    for (const frame of frames.splice(0)) frame();
  });
  expect(tree.queryByText('page b')).toBeNull();
  act(() => {
    for (const cb of idle.splice(0)) cb();
  });
  expect(tree.queryByText('page b')).not.toBeNull();
  // Only the neighbours: the page two away waits for its own turn.
  expect(tree.queryByText('page c')).toBeNull();
});
