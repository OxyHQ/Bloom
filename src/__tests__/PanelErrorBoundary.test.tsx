import React, { useState } from 'react';
import { ScrollView, Text } from 'react-native';
import * as ReactNative from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { AppShell, AppShellSplitPanes } from '../app-shell';
import { ErrorBoundary, PanelErrorBoundary } from '../error-boundary';
import { ContentPanel as NativePanel } from '../content-panel/ContentPanel';
import { ContentPanel as WebPanel } from '../content-panel/ContentPanel.web';
import { BottomEdgeProvider, useClaimBottomEdge } from '../layout/bottom-edge';
import { SettingsProfilePage } from '../settings-modal';
import { RiHomeLine } from '../icons/remix';
import { pressHost } from './support/press-host';
import { LocaleProvider, loadBloomLocale } from '../locale';
import { resolvedStyle } from './support/rendered-style';

function Provider({ children }: React.PropsWithChildren) {
  return <BloomThemeProvider mode="light" colorPreset="teal">{children}</BloomThemeProvider>;
}
function Bomb({ fail = true, name = 'ok' }: { fail?: boolean; name?: string }) {
  if (fail) throw new Error(name);
  return <Text>{name}</Text>;
}
function Counter() {
  const [count, setCount] = useState(0);
  return <Text testID="count" onPress={() => setCount(count + 1)}>{count}</Text>;
}
beforeEach(() => jest.spyOn(console, 'error').mockImplementation(() => {}));
afterEach(() => jest.restoreAllMocks());

it('isolates list, detail and info independently while keeping shell navigation usable', () => {
  jest.spyOn(ReactNative, 'useWindowDimensions').mockReturnValue({ width: 1440, height: 900, scale: 1, fontScale: 1 });
  const view = render(<Provider><AppShell header={null} bottomBarVisibility="always" bottomBar={<Text>Bottom navigation</Text>} sidebar={{ items: [{ key: 'home', label: 'Home', icon: RiHomeLine }] }}>
    <AppShellSplitPanes paneScroll={false}
      list={<Counter />} detail={<Bomb name="detail" />} info={<Bomb name="info" />}
      detailErrorBoundary={{ emptyState: { title: 'Detail failed' } }}
      infoErrorBoundary={{ emptyState: { title: 'Info failed' } }} />
  </AppShell></Provider>);
  expect(view.getByText('Detail failed')).toBeTruthy();
  expect(view.getByText('Info failed')).toBeTruthy();
  expect(view.getByText('Bottom navigation')).toBeTruthy();
  expect(view.getByText('Home')).toBeTruthy();
  fireEvent.press(view.getByTestId('count'));
  expect(view.getByText('1')).toBeTruthy();
});

it('retries only the failed pane and preserves sibling state', () => {
  let fail = true;
  function Recoverable() { return <Bomb fail={fail} name="Message" />; }
  const tree = (route: string) => <Provider><AppShellSplitPanes paneScroll={false} list={<Counter />} detail={<Recoverable />}
    detailErrorBoundary={{ resetKey: route, emptyState: { action: { testID: 'reload', label: 'Reload message', onPress: () => { fail = false; } } } }} /></Provider>;
  const view = render(tree('one'));
  fireEvent.press(view.getByTestId('count'));
  pressHost(view.getByTestId('reload'));
  expect(view.getByText('Message')).toBeTruthy();
  expect(view.getByText('1')).toBeTruthy();
  // A route identity update does not remount a healthy pane.
  view.rerender(tree('two'));
  expect(view.getByText('1')).toBeTruthy();
});

it('resets a failed pane on navigation while healthy pane state survives', () => {
  const tree = (route: string) => <Provider><AppShellSplitPanes paneScroll={false} list={<Counter />} detail={<Bomb fail={route === 'bad'} name="Opened message" />} detailErrorBoundary={{ resetKey: route }} /></Provider>;
  const view = render(tree('bad'));
  fireEvent.press(view.getByTestId('count'));
  view.rerender(tree('good'));
  expect(view.getByText('Opened message')).toBeTruthy();
  expect(view.getByText('1')).toBeTruthy();
});

it('keeps retry for an omitted action and scrolls fallback clear of occupied bottom chrome', () => {
  function Claim() { useClaimBottomEdge(94); return null; }
  const view = render(<Provider><BottomEdgeProvider><Claim /><PanelErrorBoundary emptyState={{ testID: 'recovery', action: undefined }}><Bomb /></PanelErrorBoundary></BottomEdgeProvider></Provider>);
  expect(view.getByTestId('recovery-action')).toBeTruthy();
  expect(view.getByText('Try Again')).toBeTruthy();
  const scroll = view.UNSAFE_getByType(ScrollView);
  expect(resolvedStyle(scroll.props.contentContainerStyle)).toMatchObject({ flexGrow: 1, paddingBottom: 94 });
});

it.each([NativePanel, WebPanel])('recovers content inside the panel surface without replacing its frame', Panel => {
  const view = render(<Provider><Panel framed errorBoundary={{ emptyState: { title: 'Panel failed' } }}><Bomb /></Panel></Provider>);
  expect(view.getByTestId('content-panel-surface')).toBeTruthy();
  expect(view.getByText('Panel failed')).toBeTruthy();
});

it('lets fallback failures escape to the provider-free catastrophic boundary', () => {
  const view = render(<ErrorBoundary fallback={<Text>Root recovery</Text>}><Provider><PanelErrorBoundary fallback={() => <Bomb />}><Bomb /></PanelErrorBoundary></Provider></ErrorBoundary>);
  expect(view.getByText('Root recovery')).toBeTruthy();
});

it('can delegate pane failure to an outer boundary', () => {
  const view = render(<ErrorBoundary fallback={<Text>Outer recovery</Text>}><Provider><AppShellSplitPanes detailErrorBoundary={false} detail={<Bomb />} /></Provider></ErrorBoundary>);
  expect(view.getByText('Outer recovery')).toBeTruthy();
});

it('renders section empty data only for empty rows, preserving headings and actions', () => {
  const view = render(<Provider><SettingsProfilePage sections={[
    { key: 'empty', label: 'Rules', action: <Text>New rule</Text>, rows: [], emptyState: { title: 'No rules', illustration: <Text>Sticker</Text> } },
    { key: 'filled', rows: [{ key: 'name', label: 'Name', control: <Text>Current value</Text> }], emptyState: { title: 'Should not appear' } },
  ]} /></Provider>);
  for (const label of ['Rules', 'New rule', 'No rules', 'Sticker', 'Current value']) expect(view.getByText(label)).toBeTruthy();
  expect(view.queryByText('Should not appear')).toBeNull();
});

it('localizes default panel recovery through the Bloom locale', async () => {
  await loadBloomLocale('es');
  const view = render(<Provider><LocaleProvider locale="es"><PanelErrorBoundary><Bomb /></PanelErrorBoundary></LocaleProvider></Provider>);
  expect(view.getByText('Algo salió mal')).toBeTruthy();
  expect(view.getByText('Se ha producido un error inesperado')).toBeTruthy();
  expect(view.getByText('Volver a intentarlo')).toBeTruthy();
});

it('does not remount healthy content when its own reset key changes', () => {
  const tree = (route: string) => <Provider><PanelErrorBoundary resetKey={route}><Counter /></PanelErrorBoundary></Provider>;
  const view = render(tree('one'));
  fireEvent.press(view.getByTestId('count'));
  view.rerender(tree('two'));
  expect(view.getByText('1')).toBeTruthy();
});
