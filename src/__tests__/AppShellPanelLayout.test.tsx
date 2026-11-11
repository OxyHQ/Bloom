import type React from 'react';
import { useEffect } from 'react';
import * as Native from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { AppShell, useAppShellPanel, usePanelNavigation } from '../app-shell';
import type { AppShellPanelLayout } from '../app-shell';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { useBloomTheme } from '../theme';
import { ResizeHandle } from '../layout/ResizeHandle';
import { resolvedStyle } from './support/rendered-style';
import { Screen } from '../screen';
import { buildThemeFromSeed } from '../theme/build-theme-from-seed';
import { mockWindowSize } from './support/window-size';
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <BloomThemeProvider mode="light" colorPreset="teal">
    {children}
  </BloomThemeProvider>
);
beforeEach(() => mockWindowSize({ width: 1440, height: 900, scale: 1, fontScale: 1 }));
afterEach(() => jest.restoreAllMocks());
describe('root modular panels', () => {
  it('reports visibility as resolved on native layout hosts', () => {
    function Probe() {
      const panel = useAppShellPanel();
      return <Native.Text testID="resolved">{String(panel.visibilityReady)}</Native.Text>;
    }
    const layout: AppShellPanelLayout = { panels: [{ id: 'main', content: <Probe /> }] };
    const screen = render(<AppShell panelLayout={layout} />, { wrapper });
    expect(screen.getByTestId('resolved').props.children).toBe('true');
  });
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
    fireEvent(screen.UNSAFE_getByType(ResizeHandle), 'nudge', 300);
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
    mockWindowSize({ width: 900, height: 900, scale: 1, fontScale: 1 });
    screen.rerender(<AppShell testID="shell" panelLayout={layout} />);
    fireEvent(screen.getByTestId('shell-panels'), 'layout', {
      nativeEvent: { layout: { width: 800, height: 700, x: 0, y: 0 } },
    });
    const grip = screen.UNSAFE_getByType(ResizeHandle);
    expect(grip.props.orientation).toBe('horizontal');
    fireEvent(grip, 'nudge', 500);
    expect(onHeightsChange).toHaveBeenCalledWith({ a: 450, b: 250 });
    expect(mounts).toHaveBeenCalledTimes(1);
  });
  it.each([true, false])('keeps document bottom clearance inside panel paint (%s)', (reserve) => {
    const previous = Native.Platform.OS;
    Native.Platform.OS = 'web';
    mockWindowSize({ width: 390, height: 844, scale: 1, fontScale: 1 });
    try {
      const screen = render(
        <AppShell
          testID="shell"
          contentMaxWidth="none"
          reserveBottomBarSpace={reserve}
          bottomBar={<Native.Text>Navigation</Native.Text>}
          panelLayout={{
            flow: 'document',
            panels: [
              {
                id: 'main',
                content: (
                  <Screen>
                    <Native.Text>Body</Native.Text>
                  </Screen>
                ),
              },
            ],
          }}
        />,
        { wrapper },
      );
      fireEvent(screen.getByTestId('shell-bottom-bar'), 'layout', {
        nativeEvent: { layout: { x: 0, y: 770, width: 390, height: 74 } },
      });
      expect(resolvedStyle(screen.getByTestId('shell-panels').props.style).paddingBottom).toBe(0);
      const spacer = screen.queryByTestId('app-shell-panel-reserve');
      if (reserve) {
        expect(resolvedStyle(spacer?.props.style)).toMatchObject({ height: 74, flexShrink: 0 });
        expect(resolvedStyle(spacer?.props.style).backgroundColor).toBeUndefined();
        let ancestor = spacer?.parent;
        while (ancestor && ancestor.props.testID !== 'content-panel-content')
          ancestor = ancestor.parent;
        expect(ancestor).toBeTruthy();
      } else expect(spacer).toBeNull();
    } finally {
      Native.Platform.OS = previous;
    }
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

describe('a screen colour preset', () => {
  function Preset({ testID }: { testID: string }) {
    return <Native.Text testID={testID}>{useBloomTheme().colorPreset}</Native.Text>;
  }
  function Primary({ testID }: { testID: string }) {
    return <Native.Text testID={testID}>{useBloomTheme().theme.colors.primary}</Native.Text>;
  }
  const ui = (mode: 'split' | 'deck') => (
    <AppShell
      sidebar={{ render: () => <Preset testID="sidebar" /> }}
      panelLayout={{
        mode,
        panels: [
          {
            id: 'main',
            width: 620,
            content: (
              <Screen scroll="content" colorPreset="rose">
                <Preset testID="main" />
              </Screen>
            ),
          },
          { id: 'side', width: 350, content: <Preset testID="side" /> },
        ],
      }}
    />
  );

  it('themes the whole shell, not only the panel that claimed it', () => {
    const tree = render(ui('split'), { wrapper });
    for (const id of ['sidebar', 'main', 'side'])
      expect(tree.getByTestId(id).props.children).toBe('rose');
  });

  it('themes only its own column in a deck', () => {
    const tree = render(ui('deck'), { wrapper });
    expect(tree.getByTestId('main').props.children).toBe('rose');
    expect(tree.getByTestId('side').props.children).toBe('teal');
    expect(tree.getByTestId('sidebar').props.children).toBe('teal');
  });

  it('themes the whole shell from an exact seed too', () => {
    const tree = render(
      <AppShell
        sidebar={{ render: () => <Primary testID="sidebar" /> }}
        panelLayout={{
          mode: 'split',
          panels: [
            {
              id: 'main',
              width: 620,
              content: (
                <Screen scroll="content" seed="#8e5137">
                  <Primary testID="main" />
                </Screen>
              ),
            },
            { id: 'side', width: 350, content: <Primary testID="side" /> },
          ],
        }}
      />,
      { wrapper },
    );
    const seeded = buildThemeFromSeed('#8e5137', 'light').colors.primary;
    for (const id of ['sidebar', 'main', 'side'])
      expect(tree.getByTestId(id).props.children).toBe(seeded);
  });
});

describe('nested panel groups', () => {
  it('keeps the main content mounted through split insertion, closure and flow changes', () => {
    const mounts = jest.fn();
    function Main() {
      useEffect(mounts, []);
      const panel = useAppShellPanel();
      return <Native.Text testID="nested-main">{panel.id}</Native.Text>;
    }
    const layout = (visible: boolean, mode: 'split' | 'flow' = 'split'): AppShellPanelLayout => ({
      panels: [
        {
          id: 'workspace',
          group: {
            mode,
            axis: 'vertical',
            panels: [
              { id: 'post', content: <Main /> },
              { id: 'likes', visible, content: <Native.Text>Likes</Native.Text> },
            ],
          },
        },
      ],
    });
    const screen = render(<AppShell panelLayout={layout(false)} />, { wrapper });
    expect(screen.getByTestId('nested-main').props.children).toBe('post');
    screen.rerender(<AppShell panelLayout={layout(true)} />);
    expect(screen.getByText('Likes')).toBeTruthy();
    screen.rerender(<AppShell panelLayout={layout(false)} />);
    screen.rerender(<AppShell panelLayout={layout(true, 'flow')} />);
    expect(mounts).toHaveBeenCalledTimes(1);
  });

  it('composes horizontal and vertical groups recursively without replacing leaf identity', () => {
    function Leaf() {
      return <Native.Text>{useAppShellPanel().id}</Native.Text>;
    }
    const screen = render(
      <AppShell
        panelLayout={{
          panels: [
            {
              id: 'row',
              group: {
                axis: 'horizontal',
                panels: [
                  {
                    id: 'column',
                    group: { axis: 'vertical', panels: [{ id: 'leaf', content: <Leaf /> }] },
                  },
                ],
              },
            },
          ],
        }}
      />,
      { wrapper },
    );
    expect(screen.getByText('leaf')).toBeTruthy();
  });
});

it('deactivates retained leaves when their transparent group closes', () => {
  function Leaf() {
    return <Native.Text testID="group-active">{String(useAppShellPanel().active)}</Native.Text>;
  }
  const layout = (visible: boolean): AppShellPanelLayout => ({
    panels: [
      {
        id: 'group',
        visible,
        keepMounted: true,
        group: {
          panels: [{ id: 'leaf', content: <Leaf /> }],
        },
      },
    ],
  });
  const screen = render(<AppShell panelLayout={layout(true)} />, { wrapper });
  expect(screen.getByTestId('group-active').props.children).toBe('true');
  screen.rerender(<AppShell panelLayout={layout(false)} />);
  expect(screen.getByTestId('group-active', { includeHiddenElements: true }).props.children).toBe(
    'false',
  );
});
