import type React from 'react';
import { View } from 'react-native';
import { render } from '@testing-library/react-native';
import { makeMutable } from 'react-native-reanimated';

import { TabPager } from '../tab-pager/expo-router/TabPager';
import { createPageModel } from '../tab-pager/pages';

const mockSetPage = jest.fn();
const mockCut = jest.fn();
jest.mock('../tab-pager/expo-router/pager-view-module', () => ({
  // A pager that records how it was asked to move.
  loadPagerView: () => {
    const { forwardRef, useImperativeHandle } = jest.requireActual('react');
    return forwardRef(({ children }: { children: React.ReactNode }, ref: unknown) => {
      useImperativeHandle(ref, () => ({ setPage: mockSetPage, setPageWithoutAnimation: mockCut }));
      return children;
    });
  },
  warnPagerViewUnavailable: () => {},
}));
jest.mock('react-native-screens', () => ({
  Screen: ({ children }: { children: React.ReactNode }) => children,
}));

const model = createPageModel(
  ['a', 'b', 'c', 'd'].map((name) => ({ name, href: `/${name}`, preload: true })),
);
const routes = model.pages.map((page) => ({ key: page.name, name: page.name }));
const descriptors = Object.fromEntries(routes.map((r) => [r.key, { render: () => <View /> }]));

function pager(index: number) {
  return (
    <TabPager
      model={model}
      state={{ index, routes }}
      descriptors={descriptors}
      progress={makeMutable(0)}
      chromeProgress={makeMutable(0)}
      onCommit={() => {}}
    />
  );
}

beforeAll(() => {
  // The pager warms neighbours on the next frame; this environment has no frames.
  globalThis.requestAnimationFrame = (cb) => setTimeout(cb, 0) as unknown as number;
  globalThis.cancelAnimationFrame = (id) => clearTimeout(id);
});
beforeEach(() => jest.clearAllMocks());

it('slides to the page next door, as a swipe would', () => {
  const tree = render(pager(0));
  tree.rerender(pager(1));
  expect(mockSetPage).toHaveBeenCalledWith(1);
  expect(mockCut).not.toHaveBeenCalled();
});

it('fades through to a page further away instead of scrolling past the pages between', () => {
  const tree = render(pager(0));
  tree.rerender(pager(3));
  expect(mockSetPage).not.toHaveBeenCalled();
  expect(mockCut).toHaveBeenCalledWith(3);
});
