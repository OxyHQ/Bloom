import { act, render } from '@testing-library/react-native';
import { makeMutable } from 'react-native-reanimated';
import { TabPagerLayout } from '../tab-pager/expo-router/TabPagerLayout';
import type { TabPagerProps } from '../tab-pager/expo-router/TabPager';
import { createPageModel } from '../tab-pager/pages';
import { acquireBackOwnership } from '../overlay/back-ownership';
import { registerOverlayRank, releaseOverlayRank } from '../overlay/stack';

const mockRoutes = ['home', 'camera', 'profile'].map((name) => ({ key: `${name}-1`, name }));
let mockState = {
  key: 'tabs-1',
  index: 2,
  routes: mockRoutes,
  routeNames: mockRoutes.map((route) => route.name),
  history: [
    { type: 'route', key: 'home-1' },
    { type: 'route', key: 'profile-1' },
  ],
};
let mockScope = 'account-1';
let mockFocused = true;
let mockNativeAvailable = true;
let mockPagerAvailable = true;
let mockPager: TabPagerProps;
let mockResult: ((result: { status: string }) => void) | undefined;
const mockNavigation = {
  preload: jest.fn(),
  navigate: jest.fn(),
  dispatch: jest.fn(),
  getState: () => mockState,
  isFocused: () => mockFocused,
  registerNativeBackNavigation: jest.fn(() => ({ remove: jest.fn() })),
  dispatchWithResult: jest.fn((_action: object, _options: object, callback: typeof mockResult) => {
    mockResult = callback;
    return { remove: jest.fn() };
  }),
};
const mockModel = createPageModel(
  mockRoutes.map((route) => ({ name: route.name, href: `/${route.name}` })),
);
const mockContext = {
  model: mockModel,
  progress: makeMutable(0),
  chromeProgress: makeMutable(0),
  selectTab: jest.fn(),
  registerCommitter: jest.fn(),
};
jest.mock('../tab-pager/context', () => ({
  useTabPagerContext: () => ({ ...mockContext, navigationScopeKey: mockScope }),
}));
jest.mock('../panel-routing/expo-router', () => ({ useIsFocused: () => mockFocused }));
jest.mock('../tab-pager/expo-router/PredictiveBackHost', () => ({
  isPredictiveBackAvailable: () => mockNativeAvailable,
}));
jest.mock('../tab-pager/expo-router/pager-view-module', () => ({
  loadPagerView: () => (mockPagerAvailable ? () => null : null),
}));
jest.mock('expo-router/ui', () => ({
  useTabsWithTriggers: () => ({
    state: mockState,
    navigation: mockNavigation,
    descriptors: Object.fromEntries(
      mockRoutes.map((route) => [route.key, { navigation: mockNavigation }]),
    ),
    NavigationContent: ({ children }: { children: unknown }) => children,
  }),
}));
jest.mock('../tab-pager/expo-router/TabPager', () => ({
  TabPager: (props: TabPagerProps) => {
    mockPager = props;
    return null;
  },
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockFocused = true;
  mockNativeAvailable = true;
  mockScope = 'account-1';
  mockPagerAvailable = true;
  mockContext.model = mockModel;
  mockState = {
    ...mockState,
    history: [
      { type: 'route', key: 'home-1' },
      { type: 'route', key: 'profile-1' },
    ],
  };
});

it('keeps the existing JS Back owner when the native binary lacks the opt-in host', () => {
  mockNativeAvailable = false;
  render(<TabPagerLayout />);
  expect(mockPager.predictiveBackEnabled).toBe(false);
  expect(mockNavigation.registerNativeBackNavigation).not.toHaveBeenCalled();
  expect(
    mockPager.onBackPreviewCommit?.(mockPager.backPreview?.sessionKey ?? '', 99, jest.fn()),
  ).toBe(false);
  expect(mockNavigation.dispatchWithResult).not.toHaveBeenCalled();
});

it('invalidates identical-history resets and viewer scope without external mutable memo state', () => {
  const view = render(<TabPagerLayout />);
  const original = mockPager.backPreview?.sessionKey;
  view.rerender(<TabPagerLayout />);
  expect(mockPager.backPreview?.sessionKey).toBe(original);
  mockState = { ...mockState };
  view.rerender(<TabPagerLayout />);
  const reset = mockPager.backPreview?.sessionKey;
  expect(reset).not.toBe(original);
  mockScope = 'account-2';
  view.rerender(<TabPagerLayout />);
  expect(mockPager.backPreview?.sessionKey).not.toBe(reset);
  expect(mockNavigation.dispatch).not.toHaveBeenCalled();
});

it('cancels the queued transaction when authority changes without changing the navigation state', () => {
  const view = render(<TabPagerLayout />);
  expect(
    mockPager.onBackPreviewCommit?.(mockPager.backPreview?.sessionKey ?? '', 70, jest.fn()),
  ).toBe(true);
  const subscription = mockNavigation.dispatchWithResult.mock.results[0]?.value;
  mockScope = 'account-2';
  view.rerender(<TabPagerLayout />);
  expect(subscription.remove).toHaveBeenCalledTimes(1);
});

it('yields to compact drawers, overlays, and pushed routes and rejects the old token afterwards', () => {
  const view = render(<TabPagerLayout />);
  const original = mockPager.backPreview?.sessionKey ?? '';
  let release = () => {};
  act(() => {
    release = acquireBackOwnership();
  });
  expect(mockPager.predictiveBackEnabled).toBe(false);
  act(release);
  expect(mockPager.predictiveBackEnabled).toBe(true);
  expect(mockPager.onBackPreviewCommit?.(original, 1, jest.fn())).toBe(false);
  act(() => registerOverlayRank(900));
  expect(mockPager.predictiveBackEnabled).toBe(false);
  act(() => releaseOverlayRank(900));
  mockFocused = false;
  view.rerender(<TabPagerLayout />);
  expect(mockPager.predictiveBackEnabled).toBe(false);
  expect(mockNavigation.dispatch).not.toHaveBeenCalled();
});

it('uses GO_BACK, settles a prevented gesture, and permits retry against unchanged history', () => {
  render(<TabPagerLayout />);
  const token = mockPager.backPreview?.sessionKey ?? '';
  const reject = jest.fn();
  expect(mockPager.onBackPreviewCommit?.(token, 10, reject)).toBe(true);
  expect(mockNavigation.dispatchWithResult).toHaveBeenCalledWith(
    {
      type: 'GO_BACK',
      source: 'profile-1',
      target: 'tabs-1',
    },
    { expectedState: mockState },
    expect.any(Function),
  );
  act(() => mockResult?.({ status: 'prevented' }));
  expect(reject).toHaveBeenCalledTimes(1);
  expect(mockPager.onBackPreviewCommit?.(token, 10, reject)).toBe(false);
  expect(mockPager.onBackPreviewCommit?.(token, 11, jest.fn())).toBe(true);
  expect(mockNavigation.dispatchWithResult).toHaveBeenCalledTimes(2);
});

it.each(['stale', 'unhandled', 'noop'])(
  'settles %s actions without waiting for a route change',
  (status) => {
    render(<TabPagerLayout />);
    const reject = jest.fn();
    expect(
      mockPager.onBackPreviewCommit?.(mockPager.backPreview?.sessionKey ?? '', 50, reject),
    ).toBe(true);
    act(() => mockResult?.({ status }));
    expect(reject).toHaveBeenCalledTimes(1);
  },
);

it('keeps JS Back for tab history when the optional pager is unavailable', () => {
  mockPagerAvailable = false;
  render(<TabPagerLayout />);
  expect(mockNavigation.registerNativeBackNavigation).not.toHaveBeenCalled();
  expect(mockPager.predictiveBackEnabled).toBe(false);
});

it('still delegates an empty root history to native/system Back without a pager', () => {
  mockPagerAvailable = false;
  mockState = { ...mockState, history: [{ type: 'route', key: 'profile-1' }] };
  render(<TabPagerLayout />);
  expect(mockNavigation.registerNativeBackNavigation).toHaveBeenCalledTimes(1);
  expect(mockPager.backPreview).toBeNull();
});

it('keeps JS ownership for malformed nonempty history', () => {
  mockState = {
    ...mockState,
    history: [
      { type: 'route', key: 'removed-1' },
      { type: 'route', key: 'profile-1' },
    ],
  };
  render(<TabPagerLayout />);
  expect(mockNavigation.registerNativeBackNavigation).not.toHaveBeenCalled();
});

it('releases ownership if a retained destination leaves the page model', () => {
  const view = render(<TabPagerLayout />);
  const registration = mockNavigation.registerNativeBackNavigation.mock.results[0]?.value;
  mockContext.model = createPageModel(mockModel.pages.filter((page) => page.name !== 'home'));
  view.rerender(<TabPagerLayout />);
  expect(registration.remove).toHaveBeenCalledTimes(1);
  expect(mockPager.predictiveBackEnabled).toBe(false);
});
