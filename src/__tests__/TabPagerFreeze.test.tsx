import type React from 'react';
import { Text } from 'react-native';
import { act, render } from '@testing-library/react-native';
import { makeMutable } from 'react-native-reanimated';

import { TabPager } from '../tab-pager/expo-router/TabPager';
import { createPageModel } from '../tab-pager/pages';

/**
 * A page out of the finger's reach is frozen (react-native-screens' `shouldFreeze`, honoured
 * where the app calls `enableFreeze`): it keeps its state and its last picture and renders
 * nothing more until it can be seen. Before, every preloading bar page stayed live behind the
 * one in front, re-rendering and animating while nobody could see it.
 */
type ScreenProps = { activityState: number; shouldFreeze?: boolean; children: React.ReactNode };
jest.mock('react-native-screens', () => ({
  Screen: (props: ScreenProps) => props.children,
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

// Five bar pages that all preload, as an app's root tabs do.
const model = createPageModel(
  ['a', 'b', 'c', 'd', 'e'].map((name) => ({ name, href: `/${name}`, bar: true, preload: true })),
);
const routes = model.pages.map((page) => ({ key: page.name, name: page.name }));

beforeAll(() => {
  globalThis.requestAnimationFrame = (cb) => setTimeout(cb, 0) as unknown as number;
  globalThis.cancelAnimationFrame = (id) => clearTimeout(id);
});

it('freezes the pages out of reach and keeps the reachable ones live and painted', async () => {
  const { Screen } = jest.requireMock('react-native-screens') as { Screen: unknown };
  const descriptors = Object.fromEntries(
    routes.map((r) => [r.key, { render: () => <Text>{r.name}</Text> }]),
  );
  const ui = (index: number) => (
    <TabPager
      model={model}
      state={{ index, routes }}
      descriptors={descriptors}
      progress={makeMutable(0)}
      chromeProgress={makeMutable(0)}
      onCommit={() => {}}
    />
  );
  const tree = render(ui(0));
  // A page is admitted once visited; visit them all, then come back to the first.
  for (const index of [1, 2, 3, 4, 0]) {
    tree.rerender(ui(index));
    await act(() => new Promise((resolve) => setTimeout(resolve, 0)));
  }
  // One Screen per page, in pager order.
  const screens = tree.UNSAFE_root.findAll((node) => node.type === Screen).map((node) => ({
    activityState: (node.props as ScreenProps).activityState,
    frozen: (node.props as ScreenProps).shouldFreeze,
  }));
  expect(screens).toEqual([
    // In front.
    { activityState: 2, frozen: false },
    // The neighbour a swipe reveals: live.
    { activityState: 1, frozen: false },
    // One tap away: laid out and painted, but frozen until it can be seen.
    { activityState: 1, frozen: true },
    { activityState: 1, frozen: true },
    { activityState: 1, frozen: true },
  ]);
});
