import * as ReactNative from 'react-native';
import { fireEvent, render, within } from '@testing-library/react-native';

import { AppShell } from '../app-shell';
import { RiCompass3Line, RiHomeLine, RiQuillPenLine, RiUserLine } from '../icons/remix';
import { PortalOutlet, PortalProvider } from '../portal';
import { Screen, useScreenReselectHandler } from '../screen';
import type { AppDestination } from '../tab-pager';
import { TabPagerProvider } from '../tab-pager/expo-router/TabPagerProvider';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

const mockRouter = {
  canDismiss: () => false,
  dismissAll: jest.fn(),
  navigate: jest.fn(),
  prefetch: jest.fn(),
  replace: jest.fn(),
};
jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
  usePathname: () => '/',
}));

/** Declared once: a swipe-only page, two bar pages, and a sidebar-only place. */
const DESTINATIONS: AppDestination[] = [
  { name: 'camera', href: '/camera', page: true },
  { name: 'index', href: '/', bar: true, label: 'Home', icon: RiHomeLine },
  { name: 'explore', href: '/explore', label: 'Explore', icon: RiCompass3Line },
  { name: 'you', href: '/you', bar: true, label: 'You', icon: RiUserLine, badge: 2 },
];

const refresh = jest.fn();
function Home() {
  useScreenReselectHandler({ refresh });
  return null;
}

function renderShell(width: number, drawer?: { onDrawerOpenChange: (open: boolean) => void }) {
  jest
    .spyOn(ReactNative, 'useWindowDimensions')
    .mockReturnValue({ width, height: 900, scale: 1, fontScale: 1 });
  return render(
    <BloomThemeProvider mode="light">
      <PortalProvider>
        <TabPagerProvider destinations={DESTINATIONS}>
          <AppShell
            testID="shell"
            variant="feed"
            sidebar={{}}
            drawerOpen={drawer !== undefined}
            onDrawerOpenChange={drawer?.onDrawerOpenChange}
            primaryAction={{ icon: RiQuillPenLine, label: 'Compose', onPress: () => {} }}
          >
            <Screen scroll="none">
              <Home />
            </Screen>
          </AppShell>
        </TabPagerProvider>
        <PortalOutlet />
      </PortalProvider>
    </BloomThemeProvider>,
  );
}

afterEach(() => jest.restoreAllMocks());

it('draws the sidebar from the destinations: rows, selection, compose and navigation', () => {
  const screen = renderShell(1440);
  expect(screen.getByTestId('sidebar-item-index')).toBeTruthy();
  expect(screen.queryByTestId('sidebar-item-camera')).toBeNull();
  expect(screen.getByLabelText('Compose')).toBeTruthy();
  fireEvent.press(screen.getByTestId('sidebar-item-explore'));
  expect(mockRouter.navigate).toHaveBeenCalledWith('/explore');
});

it('draws the bottom bar from the same destinations, with the action as its FAB', () => {
  const screen = renderShell(390);
  const bar = within(screen.getByTestId('shell-bottom-bar'));
  expect(bar.getByLabelText('Home')).toBeTruthy();
  expect(bar.getByLabelText('You')).toBeTruthy();
  expect(bar.queryByLabelText('Explore')).toBeNull();
  expect(bar.getByLabelText('Compose')).toBeTruthy();
});

it('closes the drawer once a destination is chosen in it', () => {
  const onDrawerOpenChange = jest.fn();
  const screen = renderShell(390, { onDrawerOpenChange });
  fireEvent.press(screen.getByTestId('sidebar-item-explore'));
  expect(onDrawerOpenChange).toHaveBeenCalledWith(false);
  expect(mockRouter.navigate).toHaveBeenCalledWith('/explore');
});

it('reselects the screen in front when its destination is pressed again', () => {
  const screen = renderShell(1440);
  fireEvent.press(screen.getByTestId('sidebar-item-index'));
  expect(refresh).toHaveBeenCalledTimes(1);
  expect(mockRouter.navigate).not.toHaveBeenCalledWith('/');
});
