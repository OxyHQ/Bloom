import React, { useEffect } from 'react';
import * as Native from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { AppShell, useAppShellPanel, usePanelNavigation } from '../app-shell';
import type { AppShellPanelLayout } from '../app-shell';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { AiChatResizeHandle } from '../ai-chat/AiChatResizeHandle';
import { resolvedStyle } from './support/rendered-style';
import { Screen } from '../screen';
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <BloomThemeProvider mode="light" colorPreset="teal">
    {children}
  </BloomThemeProvider>
);
beforeEach(() =>
  jest
    .spyOn(Native, 'useWindowDimensions')
    .mockReturnValue({ width: 1440, height: 900, scale: 1, fontScale: 1 }),
);
afterEach(() => jest.restoreAllMocks());
describe('root modular panels', () => {
  it('retains keyed subtrees through expansion, compact selection, mode and flow changes', () => {
    const mounts = jest.fn(),
      unmounts = jest.fn();
    function Probe() {
      const panel = useAppShellPanel();
      useEffect(() => {
        mounts(panel.id);
        return () => unmounts(panel.id);
      }, []);
      return <Native.Text testID={`probe-${panel.id}`}>{String(panel.visible)}</Native.Text>;
    }
    const layout: AppShellPanelLayout = {
      panels: [
        { id: 'main', width: 620, content: <Probe /> },
        { id: 'side', width: 350, content: <Probe /> },
      ],
    };
    const screen = render(<AppShell testID="shell" panelLayout={layout} />, { wrapper });
    expect(mounts).toHaveBeenCalledTimes(2);
    screen.rerender(<AppShell testID="shell" panelLayout={{ ...layout, expandedPanel: 'main' }} />);
    expect(
      screen.getByTestId('shell-panels-side', { includeHiddenElements: true }).props
        .accessibilityElementsHidden,
    ).toBe(true);
    expect(screen.getByTestId('probe-side', { includeHiddenElements: true }).props.children).toBe(
      'false',
    );
    screen.rerender(<AppShell testID="shell" panelLayout={{ ...layout, mode: 'deck' }} />);
    screen.rerender(<AppShell testID="shell" panelLayout={{ ...layout, flow: 'document' }} />);
    expect(mounts).toHaveBeenCalledTimes(2);
    expect(unmounts).not.toHaveBeenCalled();
  });
  it('lazily mounts a panel once eligible and retains it when hidden again', () => {
    const mount = jest.fn();
    function Side() {
      useEffect(mount, []);
      return <Native.Text>Side content</Native.Text>;
    }
    const layout: AppShellPanelLayout = {
      panels: [
        { id: 'main', content: <Native.Text>Main</Native.Text> },
        { id: 'side', hideBelow: 1500, content: <Side /> },
      ],
    };
    const screen = render(<AppShell testID="shell" panelLayout={layout} />, { wrapper });
    expect(mount).not.toHaveBeenCalled();
    const shown = {
      ...layout,
      panels: [layout.panels[0]!, { ...layout.panels[1]!, hideBelow: 1000 }],
    };
    screen.rerender(<AppShell testID="shell" panelLayout={shown} />);
    expect(mount).toHaveBeenCalledTimes(1);
    screen.rerender(<AppShell testID="shell" panelLayout={layout} />);
    expect(mount).toHaveBeenCalledTimes(1);
    expect(
      screen.getByTestId('shell-panels-side', { includeHiddenElements: true }).props
        .importantForAccessibility,
    ).toBe('no-hide-descendants');
  });
  it('resizes both adjacent tracks and reports controlled widths', () => {
    const onWidthsChange = jest.fn();
    const layout: AppShellPanelLayout = {
      widths: { a: 400, b: 400 },
      onWidthsChange,
      gap: 0,
      panels: [
        { id: 'a', width: 400, minWidth: 200, maxWidth: 600, resizable: true },
        { id: 'b', width: 400, minWidth: 300, maxWidth: 500 },
      ],
    };
    const screen = render(<AppShell testID="shell" panelLayout={layout} />, { wrapper });
    fireEvent(screen.getByTestId('shell-panels'), 'layout', {
      nativeEvent: { layout: { width: 800, height: 600, x: 0, y: 0 } },
    });
    fireEvent(screen.UNSAFE_getByType(AiChatResizeHandle), 'nudge', 300);
    expect(onWidthsChange).toHaveBeenCalledWith({ a: 500, b: 300 });
  });
  it('retains content when responsive axis changes and reports height resizing', () => {
    const mounts = jest.fn();
    function Probe() {
      useEffect(mounts, []);
      return <Native.Text>Persistent panel</Native.Text>;
    }
    const onHeightsChange = jest.fn();
    const layout: AppShellPanelLayout = {
      axis: { base: 'vertical', lg: 'horizontal' },
      gap: 0,
      onHeightsChange,
      panels: [
        {
          id: 'a',
          width: 400,
          height: 300,
          minHeight: 200,
          maxHeight: 450,
          resizable: true,
          content: <Probe />,
        },
        { id: 'b', width: 400, minHeight: 250 },
      ],
    };
    const screen = render(<AppShell testID="shell" panelLayout={layout} />, { wrapper });
    expect(mounts).toHaveBeenCalledTimes(1);
    jest
      .spyOn(Native, 'useWindowDimensions')
      .mockReturnValue({ width: 900, height: 900, scale: 1, fontScale: 1 });
    screen.rerender(<AppShell testID="shell" panelLayout={layout} />);
    fireEvent(screen.getByTestId('shell-panels'), 'layout', {
      nativeEvent: { layout: { width: 800, height: 700, x: 0, y: 0 } },
    });
    const grip = screen.UNSAFE_getByType(AiChatResizeHandle);
    expect(grip.props.orientation).toBe('horizontal');
    fireEvent(grip, 'nudge', 500);
    expect(onHeightsChange).toHaveBeenCalledWith({ a: 450, b: 250 });
    expect(mounts).toHaveBeenCalledTimes(1);
  });
  it('sticks short document panels at the top and lets tall ones reach their bottom', () => {
    const previous = Native.Platform.OS;
    Native.Platform.OS = 'web';
    try {
      const screen = render(
        <AppShell
          testID="shell"
          gutter={8}
          panelLayout={{
            flow: 'document',
            panels: [
              { id: 'main', width: 620 },
              { id: 'context', width: 350, sticky: true },
            ],
          }}
        />,
        { wrapper },
      );
      const context = () => screen.getByTestId('shell-panels-context');
      fireEvent(context(), 'layout', {
        nativeEvent: { layout: { width: 350, height: 200, x: 0, y: 0 } },
      });
      expect(resolvedStyle(context().props.style)).toMatchObject({
        position: 'sticky',
        alignSelf: 'flex-start',
        top: 8,
      });
      fireEvent(context(), 'layout', {
        nativeEvent: { layout: { width: 350, height: 1000, x: 0, y: 0 } },
      });
      expect(resolvedStyle(context().props.style).top).toBe(-108);
    } finally {
      Native.Platform.OS = previous;
    }
  });
  it('mounts persistent router panels while hidden and retains them through semantic visibility changes', () => {
    const mounts = jest.fn();
    function Router() {
      useEffect(() => {
        mounts();
      }, []);
      return <Native.Text>Persistent router</Native.Text>;
    }
    const layout = (deck: boolean): AppShellPanelLayout => ({
      mode: deck ? 'deck' : 'split',
      panels: [
        { id: 'main', width: 620, visible: !deck, keepMounted: true, content: <Router /> },
        { id: 'deck', width: 360, visible: deck, content: <Native.Text>Deck</Native.Text> },
      ],
    });
    const screen = render(<AppShell testID="shell" panelLayout={layout(true)} />, { wrapper });
    expect(mounts).toHaveBeenCalledTimes(1);
    expect(
      screen.getByTestId('shell-panels-main', { includeHiddenElements: true }).props
        .accessibilityElementsHidden,
    ).toBe(true);
    screen.rerender(<AppShell testID="shell" panelLayout={layout(false)} />);
    expect(screen.getByText('Persistent router')).toBeTruthy();
    screen.rerender(<AppShell testID="shell" panelLayout={layout(true)} />);
    expect(mounts).toHaveBeenCalledTimes(1);
  });
  it('makes the same navigation controller available to header and body', () => {
    function Header() {
      const nav = usePanelNavigation();
      return <Native.Pressable testID="push" onPress={() => nav.push({ name: 'detail' })} />;
    }
    const screen = render(
      <AppShell
        panelLayout={{
          mode: 'deck',
          panels: [
            {
              id: 'a',
              scroll: 'panel',
              header: <Header />,
              navigation: {
                initialEntries: [{ key: 'home', name: 'home' }],
                render: (entry) => <Native.Text>{entry.name}</Native.Text>,
              },
            },
          ],
        }}
      />,
      { wrapper },
    );
    fireEvent.press(screen.getByTestId('push'));
    expect(screen.getByText('detail')).toBeTruthy();
  });
});

it('composes descriptor footer chrome into the retained route Screen', () => {
  const mounts = jest.fn();
  function Route() {
    useEffect(mounts, []);
    return (
      <Screen scroll="auto" testID="route-screen">
        <Native.View />
      </Screen>
    );
  }
  const ui = (footer: boolean, deck = false) => (
    <AppShell
      panelLayout={{
        mode: deck ? 'deck' : 'split',
        panels: [
          {
            id: 'main',
            width: 620,
            bottomBar: footer ? <Native.View testID="panel-footer" /> : undefined,
            content: <Route />,
          },
        ],
      }}
    />
  );
  const tree = render(ui(true), { wrapper });
  expect(tree.getByTestId('route-screen-bottom')).toBeTruthy();
  expect(tree.getAllByTestId('panel-footer')).toHaveLength(1);
  tree.rerender(ui(true, true));
  expect(tree.getAllByTestId('panel-footer')).toHaveLength(1);
  tree.rerender(ui(false));
  expect(tree.queryByTestId('route-screen-bottom')).toBeNull();
  expect(mounts).toHaveBeenCalledTimes(1);
});
