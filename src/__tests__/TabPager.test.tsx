import { act, render } from '@testing-library/react-native';
import { BottomBar } from '../bottom-bar';
import { useTabPager, type AppDestination, type TabPagerState } from '../tab-pager';
import { TabPagerBottomBar } from '../tab-pager/TabPagerBottomBar';
import { useTabPagerContext, type TabCommitter } from '../tab-pager/context';
import { createPageModel, valueAtPage } from '../tab-pager/pages';
import { TabPagerLayout } from '../tab-pager/expo-router/TabPagerLayout';
import { TabPagerProvider } from '../tab-pager/expo-router/TabPagerProvider';
import { stateLeavingTab } from '../tab-pager/expo-router/leave-tab';

let mockPathname = '/';
const mockRouter = {
  canDismiss: jest.fn(() => false),
  dismissAll: jest.fn(),
  navigate: jest.fn(),
  prefetch: jest.fn(),
  replace: jest.fn(),
};
jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
  useNavigation: () => {
    throw new Error('A binary without the native host must not require a navigation context');
  },
  usePathname: () => mockPathname,
  useIsFocused: () => true,
}));
jest.mock('../bottom-bar', () => ({ BottomBar: jest.fn(() => null) }));
// The layout's navigator: one call per layout render.
jest.mock('expo-router/ui', () => ({
  useTabsWithTriggers: jest.fn(() => ({
    state: { index: 0, routes: [], routeNames: ['camera', 'index', 'write', 'you'] },
    descriptors: {},
    navigation: { preload: () => {}, navigate: () => {} },
    NavigationContent: ({ children }: { children: unknown }) => children,
  })),
}));
jest.mock('../tab-pager/expo-router/TabPager', () => ({ TabPager: () => null }));

const Glyph = () => null;
/**
 * A page without a bar item sits left of Home, so page and bar indices differ;
 * Explore is a sidebar row and no page at all.
 */
const DESTINATIONS: AppDestination[] = [
  { name: 'camera', href: '/camera', page: true },
  { name: 'index', href: '/', preload: true, bar: true, label: 'Home', icon: Glyph },
  { name: 'explore', href: '/explore', label: 'Explore', icon: Glyph },
  { name: 'write', href: '/write', page: true },
  { name: 'you', href: '/you', preload: true, bar: true, label: 'You', icon: Glyph },
];
const PAGES = DESTINATIONS.filter((destination) => destination.name !== 'explore');

function mount() {
  type Seen = TabPagerState & { register: (committer: TabCommitter) => void };
  const seen = { current: undefined as unknown as Seen };
  function Probe() {
    const context = useTabPagerContext();
    seen.current = { ...useTabPager(), register: context.registerCommitter };
    return <TabPagerBottomBar />;
  }
  const onReselect = jest.fn();
  const tree = () => (
    <TabPagerProvider destinations={DESTINATIONS} onReselect={onReselect}>
      <Probe />
    </TabPagerProvider>
  );
  const view = render(tree());
  const committer = { commit: jest.fn(), leave: jest.fn() };
  return {
    get pager() {
      return seen.current;
    },
    navigator() {
      act(() => seen.current.register(committer));
      return committer;
    },
    landOn(pathname: string) {
      mockPathname = pathname;
      view.rerender(tree());
    },
    bar() {
      const [props] = jest.mocked(BottomBar).mock.lastCall ?? [];
      if (!props) throw new Error('the bar never rendered');
      return props;
    },
    onReselect,
  };
}

beforeEach(() => {
  mockPathname = '/';
  jest.clearAllMocks();
  mockRouter.canDismiss.mockReturnValue(false);
});

it('parks the highlight on the nearest bar item and hides the bar over a page without one', () => {
  const { barPositions, chromeHidden } = createPageModel(PAGES);
  expect(barPositions).toEqual([0, 0, 0, 1]);
  expect(chromeHidden).toEqual([1, 0, 1, 0]);
  // Interpolated between the two pages under the finger.
  expect(valueAtPage(barPositions, 2.5)).toBe(0.5);
  expect(valueAtPage(chromeHidden, 0.25)).toBe(0.75);
});

it('binds the bar to the pages: items, selection, presence and reselect', () => {
  const tabs = mount();
  const bar = tabs.bar();
  expect(bar.items.map((item) => item.name)).toEqual(['index', 'you']);
  expect(bar.value).toBe('index');
  expect(bar.activeProgress).toBe(tabs.pager.progress);
  expect(bar.hideProgress).toBe(tabs.pager.chromeProgress);
  act(() => bar.onValueChange('index'));
  expect(tabs.onReselect).toHaveBeenCalledWith('index');
  tabs.landOn('/camera');
  expect(tabs.bar().value).toBe('');
});

it('presses a destination the same way from anywhere: a page, a place, an action', () => {
  const tabs = mount();
  tabs.navigator();
  act(() => tabs.pager.selectDestination('explore'));
  expect(mockRouter.navigate).toHaveBeenCalledWith('/explore');
  tabs.landOn('/explore');
  act(() => tabs.pager.selectDestination('explore'));
  expect(tabs.onReselect).toHaveBeenCalledWith('explore');
  expect(tabs.bar().value).toBe('');
});

it('navigates by href and moves the highlight in bar units without a navigator', () => {
  const tabs = mount();
  act(() => tabs.pager.selectTab('you'));
  expect(mockRouter.navigate).toHaveBeenCalledWith('/you');
  expect(tabs.pager.progress.value).toBe(1);
  expect(mockRouter.dismissAll).not.toHaveBeenCalled();
});

it('commits through the navigator, dismissing only a pushed route', () => {
  mockRouter.canDismiss.mockReturnValue(true);
  const tabs = mount();
  const navigator = tabs.navigator();
  tabs.landOn('/camera');
  act(() => tabs.pager.selectTab('index'));
  expect(mockRouter.dismissAll).not.toHaveBeenCalled();
  tabs.landOn('/p/1');
  act(() => tabs.pager.selectTab('index'));
  expect(mockRouter.dismissAll).toHaveBeenCalledTimes(1);
  expect(navigator.commit).toHaveBeenCalledWith('index');
  expect(mockRouter.navigate).not.toHaveBeenCalled();
});

it('leaves a page through the navigator, or replaces it without one', () => {
  const tabs = mount();
  act(() => tabs.pager.leaveTab('write', 'index'));
  expect(mockRouter.replace).toHaveBeenCalledWith('/');
  const navigator = tabs.navigator();
  act(() => tabs.pager.leaveTab('write', 'index'));
  expect(navigator.leave).toHaveBeenCalledWith('write', 'index');
});

it('shows the bar on a route pushed over a page that hides it, pager or not', () => {
  const tabs = mount();
  tabs.navigator();
  tabs.landOn('/write');
  expect(tabs.pager.chromeProgress.value).toBe(1);
  tabs.landOn('/p/1');
  expect(tabs.pager.activePage).toBeNull();
  expect(tabs.pager.chromeProgress.value).toBe(0);
});

it('does not re-render the tabs layout when only the page in front changes', () => {
  const { useTabsWithTriggers } = jest.requireMock('expo-router/ui');
  const layout = <TabPagerLayout />;
  const tree = () => <TabPagerProvider destinations={DESTINATIONS}>{layout}</TabPagerProvider>;
  const view = render(tree());
  const renders = jest.mocked(useTabsWithTriggers).mock.calls.length;
  expect(renders).toBeGreaterThan(0);
  for (const pathname of ['/you', '/p/1', '/camera']) {
    mockPathname = pathname;
    view.rerender(tree());
  }
  expect(useTabsWithTriggers).toHaveBeenCalledTimes(renders);
});

it('drops the page being left from the back history', () => {
  const state = {
    key: 'tabs',
    index: 2,
    routes: [
      { key: 'i', name: 'index' },
      { key: 'w', name: 'write' },
      { key: 'y', name: 'you' },
    ],
    history: [
      { type: 'route', key: 'i' },
      { type: 'route', key: 'w' },
      { type: 'route', key: 'y' },
    ],
  };
  expect(stateLeavingTab(state, 'write', 'index')).toEqual({
    ...state,
    index: 0,
    history: [
      { type: 'route', key: 'y' },
      { type: 'route', key: 'i' },
    ],
  });
  expect(stateLeavingTab(state, 'write', 'missing')).toBeNull();
});
