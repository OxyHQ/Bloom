import type React from 'react';
import { View } from 'react-native';
import { act, render } from '@testing-library/react-native';
import { makeMutable } from 'react-native-reanimated';

import { TabPager, type TabPagerProps } from '../tab-pager/expo-router/TabPager';
import type { PredictiveBackHostProps } from '../tab-pager/expo-router/PredictiveBackHost';
import { Screen, useScreen } from '../screen';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { createPageModel } from '../tab-pager/pages';

const mockSetPage = jest.fn();
const mockCut = jest.fn();
let mockHost: PredictiveBackHostProps;
let mockPagerProps: {
  onPageSelected: (event: { nativeEvent: { position: number } }) => void;
  offscreenPageLimit: number;
};
jest.mock('../tab-pager/expo-router/PredictiveBackHost', () => ({
  isPredictiveBackAvailable: () => true,
  PredictiveBackHost: (props: PredictiveBackHostProps) => {
    mockHost = props;
    return props.children;
  },
}));
jest.mock('../tab-pager/expo-router/pager-view-module', () => ({
  // A pager that records how it was asked to move.
  loadPagerView: () => {
    const { forwardRef, useImperativeHandle } = jest.requireActual('react');
    return forwardRef(
      (props: { children: React.ReactNode } & typeof mockPagerProps, ref: unknown) => {
        mockPagerProps = props;
        useImperativeHandle(ref, () => ({
          setPage: mockSetPage,
          setPageWithoutAnimation: mockCut,
        }));
        return props.children;
      },
    );
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

function pager(index: number, overrides: Partial<TabPagerProps> = {}) {
  return (
    <TabPager
      model={model}
      state={{ index, routes }}
      descriptors={descriptors}
      progress={makeMutable(0)}
      chromeProgress={makeMutable(0)}
      onCommit={() => {}}
      {...overrides}
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

function completeBack(gestureId: number, sessionKey = 'visit-1') {
  act(() => mockHost.onBackCommitted({ nativeEvent: { gestureId, sessionKey } } as never));
}

it('retains a nonadjacent back destination and cuts only after successful completion', () => {
  const commit = jest.fn(() => true);
  const onCommit = jest.fn();
  const preview = { sessionKey: 'visit-1', from: 'd', to: 'a' };
  const tree = render(
    pager(3, {
      backPreview: preview,
      predictiveBackEnabled: true,
      onBackPreviewCommit: commit,
      onCommit,
    }),
  );
  expect(mockPagerProps.offscreenPageLimit).toBe(3);
  expect(mockCut).not.toHaveBeenCalled();
  completeBack(10);
  expect(commit).toHaveBeenCalledTimes(1);
  expect(mockCut).not.toHaveBeenCalled();
  completeBack(10);
  expect(commit).toHaveBeenCalledTimes(1);
  tree.rerender(pager(0, { predictiveBackEnabled: true, onBackPreviewCommit: commit, onCommit }));
  expect(mockCut).toHaveBeenCalledWith(0);
  expect(mockSetPage).not.toHaveBeenCalled();
  expect(mockHost.sessionKey).toBe('visit-1');
  act(() => mockPagerProps.onPageSelected({ nativeEvent: { position: 0 } }));
  expect(mockHost.settledGestureId).toBe(10);
  expect(onCommit).not.toHaveBeenCalled();
});

it('settles a prevented gesture and allows a new gesture with unchanged history', () => {
  let reject: (() => void) | undefined;
  const commit = jest.fn((_session: string, _id: number, onReject: () => void) => {
    reject = onReject;
    return true;
  });
  render(
    pager(3, {
      backPreview: { sessionKey: 'visit-1', from: 'd', to: 'a' },
      predictiveBackEnabled: true,
      onBackPreviewCommit: commit,
    }),
  );
  completeBack(20);
  act(() => reject?.());
  expect(mockHost.settledGestureId).toBe(20);
  completeBack(21);
  expect(commit).toHaveBeenCalledTimes(2);
  expect(mockCut).not.toHaveBeenCalled();
});

it('settles stale completions without navigation and cancels pending work when ownership changes', () => {
  const commit = jest.fn(() => true);
  const preview = { sessionKey: 'visit-1', from: 'd', to: 'a' };
  const tree = render(
    pager(3, { backPreview: preview, predictiveBackEnabled: true, onBackPreviewCommit: commit }),
  );
  completeBack(30, 'old-account');
  expect(commit).not.toHaveBeenCalled();
  expect(mockHost.settledGestureId).toBe(30);
  completeBack(31);
  tree.rerender(
    pager(3, { backPreview: preview, predictiveBackEnabled: false, onBackPreviewCommit: commit }),
  );
  expect(mockHost.settledGestureId).toBe(31);
  expect(mockHost.enabled).toBe(false);
  expect(mockCut).not.toHaveBeenCalled();
});

it('keeps only the page in front active', async () => {
  const activity: Record<string, boolean> = {};
  function Probe({ name }: { name: string }) {
    activity[name] = useScreen().active;
    return null;
  }
  const screens = Object.fromEntries(
    routes.map((r) => [
      r.key,
      {
        render: () => (
          <Screen scroll="none">
            <Probe name={r.name} />
          </Screen>
        ),
      },
    ]),
  );
  const ui = (index: number) => (
    <BloomThemeProvider mode="light">
      <TabPager
        model={model}
        state={{ index, routes }}
        descriptors={screens}
        progress={makeMutable(0)}
        chromeProgress={makeMutable(0)}
        onCommit={() => {}}
        backPreview={{ sessionKey: 'preview-only', from: routes[index]?.name ?? '', to: 'd' }}
        predictiveBackEnabled
      />
    </BloomThemeProvider>
  );
  const tree = render(ui(1));
  // Neighbours are admitted on the next frame.
  await act(() => new Promise((resolve) => setTimeout(resolve, 0)));
  expect(activity.b).toBe(true);
  expect(activity.d).toBe(false);
  tree.rerender(ui(2));
  await act(() => new Promise((resolve) => setTimeout(resolve, 0)));
  expect(activity.c).toBe(true);
  expect(activity.b).toBe(false);
});
