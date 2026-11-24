import { createContext, useContext } from 'react';
import { render } from '@testing-library/react-native';
import { makeMutable } from 'react-native-reanimated';
import { TabPagerLayout } from '../tab-pager/expo-router/TabPagerLayout';
import type { TabPagerProps } from '../tab-pager/expo-router/TabPager';
import { createPageModel } from '../tab-pager/pages';

// Focus is a context, as React Navigation's is: a route pushed over the tabs changes it.
const mockFocus = createContext(true);
const mockRoutes = ['home', 'profile'].map((name) => ({ key: `${name}-1`, name }));
const mockState = {
  key: 'tabs-1',
  index: 0,
  routes: mockRoutes,
  routeNames: mockRoutes.map((route) => route.name),
  history: [{ type: 'route', key: 'home-1' }],
};
const mockNavigation = {
  preload: jest.fn(),
  navigate: jest.fn(),
  dispatch: jest.fn(),
  getState: () => mockState,
  isFocused: () => true,
  registerNativeBackNavigation: jest.fn(() => ({ remove: jest.fn() })),
  dispatchWithResult: jest.fn(() => ({ remove: jest.fn() })),
};
const MockNavigationContent = ({ children }: { children: unknown }) => children;
const mockNavigator = jest.fn(() => ({
  state: mockState,
  navigation: mockNavigation,
  descriptors: {},
  NavigationContent: MockNavigationContent,
}));
const mockPagers: TabPagerProps[] = [];
const lastPager = () => mockPagers[mockPagers.length - 1];
const mockContext = {
  model: createPageModel(mockRoutes.map((route) => ({ name: route.name, href: `/${route.name}` }))),
  progress: makeMutable(0),
  chromeProgress: makeMutable(0),
  selectTab: jest.fn(),
  registerCommitter: jest.fn(),
};
jest.mock('../tab-pager/context', () => ({ useTabPagerContext: () => mockContext }));
jest.mock('../panel-routing/expo-router', () => ({
  useIsFocused: () => useContext(mockFocus),
}));
jest.mock('../tab-pager/expo-router/PredictiveBackHost', () => ({
  isPredictiveBackAvailable: () => true,
}));
jest.mock('../tab-pager/expo-router/pager-view-module', () => ({
  loadPagerView: () => () => null,
}));
jest.mock('expo-router/ui', () => ({ useTabsWithTriggers: () => mockNavigator() }));
jest.mock('../tab-pager/expo-router/TabPager', () => ({
  TabPager: (props: TabPagerProps) => {
    mockPagers.push(props);
    return null;
  },
}));

it('does not run the navigator again when a route pushed over the tabs takes the focus', () => {
  // The element is created once, as a navigator renders a route's screen.
  const layout = <TabPagerLayout />;
  const view = render(<mockFocus.Provider value>{layout}</mockFocus.Provider>);
  const runs = mockNavigator.mock.calls.length;
  expect(lastPager()?.predictiveBackEnabled).toBe(true);
  view.rerender(<mockFocus.Provider value={false}>{layout}</mockFocus.Provider>);
  // The pager's Back follows the focus; the navigator above it is not run again.
  expect(lastPager()?.predictiveBackEnabled).toBe(false);
  expect(mockNavigator.mock.calls.length).toBe(runs);
  view.rerender(<mockFocus.Provider value>{layout}</mockFocus.Provider>);
  expect(lastPager()?.predictiveBackEnabled).toBe(true);
  expect(mockNavigator.mock.calls.length).toBe(runs);
});
