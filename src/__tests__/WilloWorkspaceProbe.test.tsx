import React from 'react';
import { View, Text, Platform } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { AppShell } from '../app-shell';
import { Screen, ScreenScrollView, useScreen } from '../screen';
import { resolvedStyle } from './support/rendered-style';

const originalOS = Platform.OS;
beforeAll(() => Object.defineProperty(Platform, 'OS', { configurable: true, value: 'ios' }));
afterAll(() => Object.defineProperty(Platform, 'OS', { configurable: true, value: originalOS }));

function Route({ active = true }: { active?: boolean }) {
  return <Screen scroll="content" active={active} testID="route"><Reader /><ScreenScrollView testID="body"><Text>First row</Text></ScreenScrollView></Screen>;
}
function Reader() {
  const screen = useScreen();
  return <Text testID="inset">{screen.topInset}</Text>;
}
function wrap(children: React.ReactNode) {
  return <BloomThemeProvider fonts={false}>{children}</BloomThemeProvider>;
}
const header = <View style={{ height: 64 }}><Text>Persistent workspace header</Text></View>;

it('control: one Screen gives its scroller 64 points of header clearance', () => {
  const tree = render(wrap(<Screen scroll="content" header={header} headerHeight={64}><ScreenScrollView testID="body"><Text>First row</Text></ScreenScrollView></Screen>));
  const scroll = tree.getByTestId('body');
  expect(resolvedStyle(scroll.props.contentContainerStyle).paddingTop).toBe(64);
});

it('public workspace header currently insets the entire native panel instead of its scrolling content', () => {
  const tree = render(wrap(<AppShell testID="shell" scroll="page" header={null} panelLayout={{ flow:'document', header, panels:[{id:'main', content:<Route />} ] }} />));
  fireEvent(tree.getByTestId('shell-panels-workspace-header'), 'layout', { nativeEvent: { layout: { width: 390, height: 64, x: 0, y: 0 } } });
  const workspace = tree.getByTestId('shell-panels-workspace-content');
  const scroll = tree.getByTestId('body');
  console.log('workspace recipe', { workspacePadding: resolvedStyle(workspace.props.style).paddingTop, routePadding: resolvedStyle(scroll.props.contentContainerStyle).paddingTop, routeInset: tree.getByTestId('inset').props.children });
  expect(resolvedStyle(workspace.props.style).paddingTop).toBe(0);
  expect(resolvedStyle(scroll.props.contentContainerStyle).paddingTop).toBe(64);
});

it('a persistent Screen around the panel cannot hand its measured header to route Screens', () => {
  const tree = render(wrap(<Screen scroll="content" header={header} headerHeight={64}><AppShell scroll="page" header={null} panelLayout={{flow:'document',panels:[{id:'main',content:<Route />}]}} /></Screen>));
  const scroll = tree.getByTestId('body');
  console.log('outer Screen recipe', { routePadding: resolvedStyle(scroll.props.contentContainerStyle).paddingTop, routeInset: tree.getByTestId('inset').props.children });
  expect(resolvedStyle(scroll.props.contentContainerStyle).paddingTop).toBe(64);
});
