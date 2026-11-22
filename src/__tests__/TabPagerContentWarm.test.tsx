import type React from 'react';
import { Text } from 'react-native';
import { act, render } from '@testing-library/react-native';
import { makeMutable } from 'react-native-reanimated';

import { TabPager } from '../tab-pager/expo-router/TabPager';
import { createPageModel } from '../tab-pager/pages';
import { useTabPageContentPainted } from '../tab-pager/page-content';

/**
 * The resting page's preloading neighbours mount once that page has painted its first content,
 * as the page says (`useTabPageContentPainted`), not in a gap between its startup tasks: at
 * launch a neighbour mounted earlier (Mention's Videos tab next to Home, with its reel and
 * player) competed with the first page's first paint. A page that says nothing counts as
 * painted when it mounts.
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

function Feed({ painted }: { painted: boolean }) {
  useTabPageContentPainted(painted);
  return <Text>{painted ? 'page a' : 'page a loading'}</Text>;
}

function descriptorsWith(first: () => React.ReactNode) {
  return Object.fromEntries(
    routes.map((r) => [
      r.key,
      { render: r.name === 'a' ? first : () => <Text>{`page ${r.name}`}</Text> },
    ]),
  );
}

const frames = new Map<number, () => void>();
let lastFrame = 0;
const flushFrames = () =>
  act(() => {
    const due = [...frames.values()];
    frames.clear();
    for (const frame of due) frame();
  });
beforeAll(() => {
  globalThis.requestAnimationFrame = ((cb: () => void) => {
    lastFrame += 1;
    frames.set(lastFrame, cb);
    return lastFrame;
  }) as never;
  globalThis.cancelAnimationFrame = ((id: number) => {
    frames.delete(id);
  }) as never;
});

function pager(descriptors: ReturnType<typeof descriptorsWith>) {
  return (
    <TabPager
      model={model}
      state={{ index: 0, routes }}
      descriptors={descriptors}
      progress={makeMutable(0)}
      chromeProgress={makeMutable(0)}
      onCommit={() => {}}
    />
  );
}

it('mounts the resting page first, and its neighbours once it has painted its content', () => {
  const tree = render(pager(descriptorsWith(() => <Feed painted={false} />)));
  expect(tree.queryByText('page a loading')).not.toBeNull();
  // Frames pass while the first page is still loading its content: the neighbour waits.
  flushFrames();
  flushFrames();
  expect(tree.queryByText('page b')).toBeNull();

  tree.rerender(pager(descriptorsWith(() => <Feed painted />)));
  expect(tree.queryByText('page b')).toBeNull();
  flushFrames();
  expect(tree.queryByText('page b')).not.toBeNull();
  // Only the neighbours: the page two away waits for its own turn.
  expect(tree.queryByText('page c')).toBeNull();
});

it('mounts the neighbours on the next frame when the page says nothing about its content', () => {
  const tree = render(pager(descriptorsWith(() => <Text>page a</Text>)));
  expect(tree.queryByText('page b')).toBeNull();
  flushFrames();
  expect(tree.queryByText('page b')).not.toBeNull();
});
