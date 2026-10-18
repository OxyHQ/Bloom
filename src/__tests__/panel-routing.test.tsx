import React, { useEffect } from 'react';
import { Text, View, Pressable } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { PanelNavigation } from '../app-shell/PanelNavigation';
import {
  PanelRouterProvider,
  PanelRouteSlot,
  useOptionalPanelRouter,
} from '../panel-routing/PanelRouter';
import {
  matchPanelRoute,
  resolvePanelHref,
  type PanelRouteDefinition,
} from '../panel-routing/routes';

const mounted = jest.fn();
function Layout() {
  useEffect(() => {
    mounted();
  }, []);
  return (
    <View>
      <Text>profile chrome</Text>
      <PanelRouteSlot />
    </View>
  );
}
function Page() {
  const router = useOptionalPanelRouter()!;
  return (
    <View>
      <Text testID="path">{router.pathname}</Text>
      <Text testID="params">{JSON.stringify(router.params)}</Text>
      <Pressable testID="profile" onPress={() => router.push('/@ana')} />
      <Pressable testID="replies" onPress={() => router.push('/@ana/replies')} />
      <Pressable
        testID="post"
        onPress={() => router.push({ pathname: '/p/[id]', params: { id: '123', q: 'a b' } })}
      />
      <Pressable testID="back" onPress={router.back} />
      <Pressable testID="forward" onPress={router.forward} />
      <Pressable testID="dismiss" onPress={router.dismissAll} />
    </View>
  );
}
const routes: PanelRouteDefinition[] = [
  { path: '/', component: Page },
  { path: '/[username]', component: Page, layouts: [Layout] },
  { path: '/[username]/replies', component: Page, layouts: [Layout] },
  { path: '/p/[id]', component: Page },
];
const options = {
  initialEntries: [{ key: 'root', name: '/' }],
  render: () => <PanelRouterProvider routes={routes} />,
};
it('routes profiles, nested tabs and post URLs inside one independent panel history', () => {
  mounted.mockClear();
  const screen = render(
    <View>
      <PanelNavigation id="left" active options={options} />
      <PanelNavigation id="right" active options={options} />
    </View>,
  );
  fireEvent.press(screen.getAllByTestId('profile')[0]!);
  expect(screen.getAllByTestId('path').map((n) => n.props.children)).toEqual(['/@ana', '/']);
  expect(screen.getAllByTestId('params')[0]!.props.children).toBe('{"username":"@ana"}');
  fireEvent.press(screen.getAllByTestId('replies')[0]!);
  expect(mounted).toHaveBeenCalledTimes(1);
  fireEvent.press(screen.getAllByTestId('post')[0]!);
  expect(screen.getAllByTestId('params')[0]!.props.children).toBe('{"id":"123","q":"a b"}');
  fireEvent.press(screen.getAllByTestId('back')[0]!);
  expect(screen.getAllByTestId('path')[0]!.props.children).toBe('/@ana/replies');
  fireEvent.press(screen.getAllByTestId('forward')[0]!);
  expect(screen.getAllByTestId('path')[0]!.props.children).toBe('/p/123');
  fireEvent.press(screen.getAllByTestId('dismiss')[0]!);
  expect(screen.getAllByTestId('path').map((n) => n.props.children)).toEqual(['/', '/']);
});
it('resolves canonical hrefs and preserves external URLs', () => {
  expect(
    resolvePanelHref({ pathname: '/(app)/p/[id]', params: { id: 'x/y', tag: ['one', 'two'] } }),
  ).toBe('/p/x%2Fy?tag=one&tag=two');
  expect(resolvePanelHref('../@ana', '/p/123')).toBe('/@ana');
  expect(resolvePanelHref('https://example.com/@ana')).toBe('https://example.com/@ana');
  expect(matchPanelRoute(routes, '/p/123?tag=a&tag=b')?.params).toEqual({
    id: '123',
    tag: ['a', 'b'],
  });
  expect(matchPanelRoute(routes, '/unknown/path/missing')).toBeNull();
});
it('prefers static routes over dynamic candidates', () => {
  const staticRoute = { path: '/saved', component: Page };
  expect(matchPanelRoute([...routes, staticRoute], '/saved')?.route).toBe(staticRoute);
});
