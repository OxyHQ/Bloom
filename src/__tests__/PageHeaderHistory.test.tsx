/**
 * A window toolbar's history (OxyOS ADR 0016; a Mac's toolbar): the header of
 * a Screen in a panel with `navigation`, where it is the window's toolbar,
 * draws back AND forward as one group, each disabled while its direction has
 * nowhere to go, at the history's root too. Off a window the same header keeps
 * its lone Back, and an explicit `onBack` (or `null`) still wins.
 */
import type { ReactNode } from 'react';
import * as ReactNative from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';

import { AppShell } from '../app-shell';
import type { PanelNavigationEntry } from '../app-shell/panel-layout-types';
import { PageHeader } from '../page-header';
import type { PageHeaderProps } from '../page-header/types';
import { PlatformSurfaceProvider } from '../platform-surface/context';
import type { PlatformSurfaceAdapter } from '../platform-surface/types';
import { PortalOutlet, PortalProvider } from '../portal';
import { Screen } from '../screen';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { fakeWindow } from './support/fake-window';
import { mockWindowSize } from './support/window-size';

afterEach(() => {
  jest.restoreAllMocks();
});

function Page({
  entry,
  header,
}: {
  entry: PanelNavigationEntry;
  header?: Partial<PageHeaderProps>;
}) {
  return (
    <Screen header={<PageHeader title={entry.name} testID="bar" {...header} />}>
      <ReactNative.Text>{entry.name} body</ReactNative.Text>
    </Screen>
  );
}

function windowApp(adapter: PlatformSurfaceAdapter | null, header?: Partial<PageHeaderProps>) {
  mockWindowSize({ width: 1280, height: 800, scale: 1, fontScale: 1 });
  let push: ((name: string) => void) | null = null;
  const ui: ReactNode = (
    <AppShell
      header={null}
      navigationGap={0}
      contentMaxWidth="none"
      panelLayout={{
        mode: 'split',
        flow: 'bounded',
        panels: [
          {
            id: 'main',
            navigation: {
              initialEntries: [{ key: 'one', name: 'One' }],
              render: (entry, navigation) => {
                push = (name) => navigation.push({ name });
                return <Page entry={entry} header={header} />;
              },
            },
          },
        ],
      }}
    />
  );
  const screen = render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      <PlatformSurfaceProvider value={adapter}>
        <PortalProvider>
          {ui}
          <PortalOutlet />
        </PortalProvider>
      </PlatformSurfaceProvider>
    </BloomThemeProvider>,
  );
  return {
    screen,
    push: (name: string) => {
      const run = push;
      if (run) act(() => run(name));
    },
  };
}

const disabled = (node: { props: Record<string, unknown> }) =>
  (node.props.accessibilityState as { disabled?: boolean } | undefined)?.disabled === true;

describe('PageHeader history in a window toolbar', () => {
  it('is one group of back and forward, both disabled at the root', () => {
    const { screen } = windowApp(fakeWindow().adapter);
    const group = screen.getByTestId('bar-history');
    expect(group.props.accessibilityLabel).toBe('Back and forward');
    expect(disabled(screen.getByTestId('bar-history-back'))).toBe(true);
    expect(disabled(screen.getByTestId('bar-history-forward'))).toBe(true);
    expect(screen.queryByTestId('bar-back')).toBeNull();
  });

  it('follows the panel history: back and forward each enabled where there is somewhere to go', () => {
    const { screen, push } = windowApp(fakeWindow().adapter);
    push('Two');
    expect(screen.getByText('Two body')).toBeTruthy();
    expect(disabled(screen.getByTestId('bar-history-back'))).toBe(false);
    expect(disabled(screen.getByTestId('bar-history-forward'))).toBe(true);
    fireEvent.press(screen.getByTestId('bar-history-back'));
    expect(screen.getByText('One body')).toBeTruthy();
    expect(disabled(screen.getByTestId('bar-history-back'))).toBe(true);
    expect(disabled(screen.getByTestId('bar-history-forward'))).toBe(false);
    fireEvent.press(screen.getByTestId('bar-history-forward'));
    expect(screen.getByText('Two body')).toBeTruthy();
  });

  it('off a window keeps the lone Back of the history', () => {
    const { screen, push } = windowApp(null);
    expect(screen.queryByTestId('bar-history')).toBeNull();
    push('Two');
    expect(screen.queryByTestId('bar-history')).toBeNull();
    expect(screen.getByTestId('bar-back')).toBeTruthy();
    expect(screen.queryByLabelText('Forward')).toBeNull();
  });

  it('an explicit onBack, or null, wins over the history', () => {
    const onBack = jest.fn();
    const explicit = windowApp(fakeWindow().adapter, { onBack });
    expect(explicit.screen.queryByTestId('bar-history')).toBeNull();
    fireEvent.press(explicit.screen.getByTestId('bar-back'));
    expect(onBack).toHaveBeenCalledTimes(1);
    explicit.screen.unmount();
    const declined = windowApp(fakeWindow().adapter, { onBack: null });
    expect(declined.screen.queryByTestId('bar-history')).toBeNull();
    expect(declined.screen.queryByTestId('bar-back')).toBeNull();
  });
});
