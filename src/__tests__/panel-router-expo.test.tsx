import React from 'react';
import { Text, View } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import { PanelNavigation } from '../app-shell/PanelNavigation';
import { PanelRouterProvider } from '../panel-routing/PanelRouter';
import { Link, usePathname, useRouter } from '../panel-routing/expo-router';
const mockGlobal = { push: jest.fn(), back: jest.fn() };
jest.mock('expo-router', () => ({
  Link: Object.assign((props: object) => React.createElement('Link', props), {
    resolveHref: (href: string) => href,
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
