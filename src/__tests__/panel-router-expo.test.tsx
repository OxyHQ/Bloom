import React from 'react';
import { Text, View } from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';
import { PanelNavigation } from '../app-shell/PanelNavigation';
import { PanelRouterProvider, useOptionalPanelRouter } from '../panel-routing/PanelRouter';
import { Link, useBackWithFallback, usePathname, useRouter } from '../panel-routing/expo-router';
const mockGlobal = { push: jest.fn(), back: jest.fn(), replace: jest.fn(), canGoBack: jest.fn() };
jest.mock('expo-router', () => ({
  Link: Object.assign((props: object) => React.createElement('Link', props), {
    resolveHref: (href: string) => href,
    Menu: (props: object) => React.createElement('Menu', props),
    Trigger: (props: object) => React.createElement('Trigger', props),
    Preview: (props: object) => React.createElement('Preview', props),
    MenuAction: (props: object) => React.createElement('MenuAction', props),
    AppleZoom: (props: object) => React.createElement('AppleZoom', props),
    AppleZoomTarget: (props: object) => React.createElement('AppleZoomTarget', props),
  }),
  useRouter: () => mockGlobal,
  usePathname: () => '/deck',
}));
function Page() {
  const pathname = usePathname();
  return (
    <View>
      <Text testID="path">{pathname}</Text>
      <Link testID="link" href="/@ana">
        Ana
      </Link>
    </View>
  );
}
const routes = [
  { path: '/', component: Page },
  { path: '/[username]', component: Page },
];
const options = {
  initialEntries: [{ key: 'root', name: '/' }],
  render: () => <PanelRouterProvider routes={routes} />,
};
it('forwards Expo Link system subcomponents without wrapping or remapping them', () => {
  const expoLink = jest.requireMock('expo-router').Link as typeof Link;
  for (const name of [
    'Menu',
    'Trigger',
    'Preview',
    'MenuAction',
    'AppleZoom',
    'AppleZoomTarget',
  ] as const) {
    expect(Link[name]).toBe(expoLink[name]);
  }
});
it.each([undefined, 'metaKey', 'ctrlKey', 'altKey', 'shiftKey'] as const)(
  'handles only ordinary panel links (%s)',
  (modifier) => {
    const screen = render(<PanelNavigation id="one" active options={options} />);
    const event = {
      defaultPrevented: false,
      preventDefault: jest.fn(),
      ...(modifier ? { [modifier]: true } : {}),
    };
    fireEvent.press(screen.getByTestId('link'), event);
    expect(event.preventDefault).toHaveBeenCalledTimes(modifier ? 0 : 1);
    expect(screen.getByTestId('path').props.children).toBe(modifier ? '/' : '/@ana');
    expect(screen.getByTestId('link').props.href).toBe('/@ana');
  },
);
it('retains the global router and normal Link outside a panel', () => {
  let captured: unknown;
  function Probe() {
    captured = useRouter();
    return <Page />;
  }
  const screen = render(<Probe />);
  expect(captured).toBe(mockGlobal);
  expect(screen.getByTestId('path').props.children).toBe('/deck');
  expect(screen.getByTestId('link').props.onPress).toBeUndefined();
});
it('goes back through the history while it has one, else replaces the page with the fallback', () => {
  let back = () => {};
  function Probe() {
    back = useBackWithFallback('/');
    return null;
  }
  render(<Probe />);
  mockGlobal.canGoBack.mockReturnValue(true);
  back();
  expect(mockGlobal.back).toHaveBeenCalledTimes(1);
  mockGlobal.canGoBack.mockReturnValue(false);
  back();
  expect(mockGlobal.replace).toHaveBeenCalledWith('/');
  expect(mockGlobal.back).toHaveBeenCalledTimes(1);
});

it('updates and clears a fragment without remounting the panel or leaking it into query params', () => {
  const router: { current: ReturnType<typeof useOptionalPanelRouter> } = { current: null };
  const mounted = jest.fn();
  function Probe() {
    router.current = useOptionalPanelRouter();
    React.useEffect(() => {
      mounted();
    }, []);
    return <Text testID="fragment-href">{router.current?.href}</Text>;
  }
  const panel = render(
    <PanelNavigation
      id="hash"
      active
      options={{
        initialEntries: [{ key: 'stable', name: '/plus?plan=month#payer%20capability' }],
        render: () => <PanelRouterProvider routes={[{ path: '/plus', component: Probe }]} />,
      }}
    />,
  );
  expect(router.current?.params['#']).toBe('payer capability');
  const originalKey = router.current?.key;
  act(() => router.current?.setParams({ '#': undefined }));
  expect(panel.getByTestId('fragment-href').props.children).toBe('/plus?plan=month');
  expect(router.current?.params['#']).toBeUndefined();
  expect(router.current?.key).toBe(originalKey);
  act(() => router.current?.setParams({ '#': 'new section', plan: 'year' }));
  expect(panel.getByTestId('fragment-href').props.children).toBe('/plus?plan=year#new%20section');
  expect(router.current?.params['#']).toBe('new section');
  expect(mounted).toHaveBeenCalledTimes(1);
});
