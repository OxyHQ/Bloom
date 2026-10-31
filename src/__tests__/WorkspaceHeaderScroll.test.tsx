import React from 'react';
import { View, Text, Platform, FlatList } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { AppShell } from '../app-shell';
import { Screen, ScreenScrollView, useScreen } from '../screen';
import { resolvedStyle } from './support/rendered-style';
import { ScreenScope } from '../layout/screen-scope';
import { VirtualList } from '../list';
import { WorkspaceHeaderInsetContext } from '../screen/workspace-header-context';
import { PortalProvider, PortalOutlet } from '../portal';

const originalOS = Platform.OS;
beforeAll(() => Object.defineProperty(Platform, 'OS', { configurable: true, value: 'ios' }));
afterAll(() => Object.defineProperty(Platform, 'OS', { configurable: true, value: originalOS }));

function Route({ active = true }: { active?: boolean }) {
  return (
    <Screen scroll="content" active={active} testID="route">
      <Reader />
      <ScreenScrollView testID="body">
        <Text>First row</Text>
      </ScreenScrollView>
    </Screen>
  );
}
function Reader() {
  const screen = useScreen();
  return <Text testID="inset">{screen.topInset}</Text>;
}
function wrap(children: React.ReactNode) {
  return <BloomThemeProvider fonts={false}>{children}</BloomThemeProvider>;
}
const header = (
  <View style={{ height: 64 }}>
    <Text>Persistent workspace header</Text>
  </View>
);

it('control: one Screen gives its scroller 64 points of header clearance', () => {
  const tree = render(
    wrap(
      <Screen scroll="content" header={header} headerHeight={64}>
        <ScreenScrollView testID="body">
          <Text>First row</Text>
        </ScreenScrollView>
      </Screen>,
    ),
  );
  const scroll = tree.getByTestId('body');
  expect(resolvedStyle(scroll.props.contentContainerStyle).paddingTop).toBe(64);
});

it('public workspace header currently insets the entire native panel instead of its scrolling content', () => {
  const tree = render(
    wrap(
      <AppShell
        testID="shell"
        scroll="page"
        header={null}
        panelLayout={{
          flow: 'document',
          header,
          headerPlacement: 'scroll-under',
          panels: [{ id: 'main', content: <Route /> }],
        }}
      />,
    ),
  );
  fireEvent(tree.getByTestId('shell-panels-workspace-header'), 'layout', {
    nativeEvent: { layout: { width: 390, height: 64, x: 0, y: 0 } },
  });
  const workspace = tree.getByTestId('shell-panels-workspace-content');
  const scroll = tree.getByTestId('body');
  expect(resolvedStyle(workspace.props.style).paddingTop ?? 0).toBe(0);
  expect(resolvedStyle(scroll.props.contentContainerStyle).paddingTop).toBe(64);
});

it('an unrelated outer Screen does not hand its header to independent panels', () => {
  const tree = render(
    wrap(
      <Screen scroll="content" header={header} headerHeight={64}>
        <AppShell
          scroll="page"
          header={null}
          panelLayout={{ flow: 'document', panels: [{ id: 'main', content: <Route /> }] }}
        />
      </Screen>,
    ),
  );
  const scroll = tree.getByTestId('body');
  expect(resolvedStyle(scroll.props.contentContainerStyle).paddingTop).toBe(0);
});

it('keeps route chrome below the workspace header and its viewport under both', () => {
  const route = (
    <Screen testID="route" scroll="auto" header={<Text>Route header</Text>} headerHeight={40}>
      <ScreenScrollView testID="body">
        <Text>First row</Text>
      </ScreenScrollView>
    </Screen>
  );
  const tree = render(
    wrap(
      <AppShell
        testID="shell"
        scroll="page"
        header={null}
        panelLayout={{
          flow: 'bounded',
          header,
          headerPlacement: 'scroll-under',
          panels: [{ id: 'main', content: route }],
        }}
      />,
    ),
  );
  fireEvent(tree.getByTestId('shell-panels-workspace-header'), 'layout', {
    nativeEvent: { layout: { width: 390, height: 64, x: 0, y: 0 } },
  });
  expect(resolvedStyle(tree.getByTestId('route-header').props.style).top).toBe(64);
  expect(resolvedStyle(tree.getByTestId('body').props.contentContainerStyle).paddingTop).toBe(64);
  expect(resolvedStyle(tree.getByTestId('route-content').props.style).paddingTop).toBe(40);
});

it('preserves the route while switching between inset and scroll-under ownership', () => {
  const mounted = jest.fn();
  const unmounted = jest.fn();
  function RetainedRoute() {
    React.useEffect(() => {
      mounted();
      return unmounted;
    }, []);
    return <Route />;
  }
  const app = (placement: 'inset' | 'scroll-under', visibleHeader: boolean) =>
    wrap(
      <AppShell
        testID="shell"
        scroll="page"
        header={null}
        panelLayout={{
          flow: 'bounded',
          header: visibleHeader ? header : null,
          headerPlacement: placement,
          panels: [{ id: 'main', content: <RetainedRoute /> }],
        }}
      />,
    );
  const tree = render(app('inset', true));
  const measure = () =>
    fireEvent(tree.getByTestId('shell-panels-workspace-header'), 'layout', {
      nativeEvent: { layout: { width: 390, height: 64, x: 0, y: 0 } },
    });
  const padding = () =>
    resolvedStyle(tree.getByTestId('body').props.contentContainerStyle).paddingTop;
  measure();
  expect(
    resolvedStyle(tree.getByTestId('shell-panels-workspace-content').props.style).paddingTop,
  ).toBe(64);
  expect(padding()).toBe(0);
  tree.rerender(app('scroll-under', true));
  expect(padding()).toBe(64);
  tree.rerender(app('scroll-under', false));
  expect(padding()).toBe(0);
  tree.rerender(app('scroll-under', true));
  expect(padding()).toBe(64);
  expect(mounted).toHaveBeenCalledTimes(1);
  expect(unmounted).not.toHaveBeenCalled();
});

it('keeps a retained panel mounted and clears only a top-edge panel', () => {
  const mounted = jest.fn();
  const unmounted = jest.fn();
  function RetainedRoute() {
    React.useEffect(() => {
      mounted();
      return unmounted;
    }, []);
    return <Route />;
  }
  const app = (visible: boolean, visibleHeader = true) =>
    wrap(
      <AppShell
        testID="shell"
        scroll="page"
        header={null}
        panelLayout={{
          retain: true,
          flow: 'bounded',
          header: visibleHeader ? header : null,
          headerPlacement: 'scroll-under',
          panels: [{ id: 'main', visible, content: <RetainedRoute /> }],
        }}
      />,
    );
  const tree = render(app(true));
  fireEvent(tree.getByTestId('shell-panels-workspace-header'), 'layout', {
    nativeEvent: { layout: { width: 390, height: 64, x: 0, y: 0 } },
  });
  expect(resolvedStyle(tree.getByTestId('body').props.contentContainerStyle).paddingTop).toBe(64);
  tree.rerender(app(false));
  tree.rerender(app(true));
  expect(resolvedStyle(tree.getByTestId('body').props.contentContainerStyle).paddingTop).toBe(64);
  tree.rerender(app(true, false));
  expect(resolvedStyle(tree.getByTestId('body').props.contentContainerStyle).paddingTop).toBe(0);
  tree.rerender(app(true));
  expect(resolvedStyle(tree.getByTestId('body').props.contentContainerStyle).paddingTop).toBe(64);
  expect(mounted).toHaveBeenCalledTimes(1);
  expect(unmounted).not.toHaveBeenCalled();
});

it('does not carry workspace header clearance into an isolated Screen scope', () => {
  function ContextProbe() {
    return (
      <Text testID="isolated-workspace">
        {String(React.useContext(WorkspaceHeaderInsetContext))}
      </Text>
    );
  }
  const tree = render(
    wrap(
      <AppShell
        testID="shell"
        scroll="page"
        header={null}
        panelLayout={{
          header,
          headerPlacement: 'scroll-under',
          panels: [
            {
              id: 'main',
              content: (
                <>
                  <Route />
                  <ScreenScope>
                    <ContextProbe />
                    <Screen scroll="content">
                      <ScreenScrollView testID="modal-body">
                        <Text>Modal</Text>
                      </ScreenScrollView>
                    </Screen>
                  </ScreenScope>
                </>
              ),
            },
          ],
        }}
      />,
    ),
  );
  fireEvent(tree.getByTestId('shell-panels-workspace-header'), 'layout', {
    nativeEvent: { layout: { width: 390, height: 64, x: 0, y: 0 } },
  });
  expect(resolvedStyle(tree.getByTestId('body').props.contentContainerStyle).paddingTop).toBe(64);
  expect(resolvedStyle(tree.getByTestId('modal-body').props.contentContainerStyle).paddingTop).toBe(
    0,
  );
  expect(tree.getByTestId('isolated-workspace').props.children).toBe('null');
});

it('moves vertical clearance to the first visible panel without remounting routes', () => {
  const mounted = jest.fn();
  const unmounted = jest.fn();
  function Page({ id }: { id: string }) {
    React.useEffect(() => {
      mounted(id);
      return () => unmounted(id);
    }, [id]);
    return (
      <Screen scroll="content">
        <ScreenScrollView testID={`body-${id}`}>
          <Text>{id}</Text>
        </ScreenScrollView>
      </Screen>
    );
  }
  const app = (firstVisible: boolean, reversed = false) =>
    wrap(
      <AppShell
        testID="shell"
        scroll="page"
        header={null}
        panelLayout={{
          axis: 'vertical',
          flow: 'bounded',
          header,
          headerPlacement: 'scroll-under',
          panels: reversed
            ? [
                { id: 'two', content: <Page id="two" /> },
                { id: 'one', visible: firstVisible, content: <Page id="one" /> },
              ]
            : [
                { id: 'one', visible: firstVisible, content: <Page id="one" /> },
                { id: 'two', content: <Page id="two" /> },
              ],
        }}
      />,
    );
  const tree = render(app(true));
  fireEvent(tree.getByTestId('shell-panels-workspace-header'), 'layout', {
    nativeEvent: { layout: { width: 390, height: 64, x: 0, y: 0 } },
  });
  const padding = (id: string) =>
    resolvedStyle(
      tree.getByTestId(`body-${id}`, { includeHiddenElements: true }).props.contentContainerStyle,
    ).paddingTop;
  expect(padding('one')).toBe(64);
  expect(padding('two')).toBe(0);
  tree.rerender(app(true, true));
  expect(padding('two')).toBe(64);
  expect(padding('one')).toBe(0);
  tree.rerender(app(false));
  expect(padding('two')).toBe(64);
  tree.rerender(app(true));
  expect(padding('one')).toBe(64);
  expect(padding('two')).toBe(0);
  expect(mounted).toHaveBeenCalledTimes(2);
  expect(unmounted).not.toHaveBeenCalled();
});

it('passes workspace clearance to a bound native VirtualList once', () => {
  const tree = render(
    wrap(
      <AppShell
        testID="shell"
        scroll="page"
        header={null}
        panelLayout={{
          header,
          headerPlacement: 'scroll-under',
          panels: [
            {
              id: 'main',
              content: (
                <Screen scroll="content">
                  <VirtualList screen={{}} data={[]} contentContainerStyle={{ paddingTop: 8 }} />
                </Screen>
              ),
            },
          ],
        }}
      />,
    ),
  );
  fireEvent(tree.getByTestId('shell-panels-workspace-header'), 'layout', {
    nativeEvent: { layout: { width: 390, height: 64, x: 0, y: 0 } },
  });
  expect(
    resolvedStyle(tree.UNSAFE_getByType(FlatList).props.contentContainerStyle).paddingTop,
  ).toBe(72);
});

it('does not apply workspace clearance to a floating panel', () => {
  const tree = render(
    wrap(
      <PortalProvider>
        <AppShell
          testID="shell"
          scroll="page"
          header={null}
          panelLayout={{
            header,
            headerPlacement: 'scroll-under',
            panels: [
              { id: 'main', content: <Route /> },
              {
                id: 'details',
                content: (
                  <Screen scroll="content">
                    <ScreenScrollView testID="floating-body">
                      <Text>Details</Text>
                    </ScreenScrollView>
                  </Screen>
                ),
                floating: { below: 'xl', open: true, label: 'Details', onOpenChange() {} },
              },
            ],
          }}
        />
        <PortalOutlet />
      </PortalProvider>,
    ),
  );
  fireEvent(tree.getByTestId('shell-panels-workspace-header'), 'layout', {
    nativeEvent: { layout: { width: 390, height: 64, x: 0, y: 0 } },
  });
  expect(resolvedStyle(tree.getByTestId('body').props.contentContainerStyle).paddingTop).toBe(64);
  expect(
    resolvedStyle(tree.getByTestId('floating-body').props.contentContainerStyle).paddingTop,
  ).toBe(0);
});
