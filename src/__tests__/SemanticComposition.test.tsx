import { useEffect, useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import { AppShell, AppShellPanels, useAppShellPanel } from '../app-shell';
import type { AppShellLayout, AppShellPanelLayout } from '../app-shell';
import { AppShellCompositionContext } from '../app-shell/context';
import { AppShellRegionContext, useAppShellRegion } from '../layout/app-shell-region';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { Screen, ScreenContent } from '../screen';
import { mockWindowSize } from './support/window-size';
import { resolvedStyle } from './support/rendered-style';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <BloomThemeProvider>{children}</BloomThemeProvider>
);
beforeEach(() => mockWindowSize({ width: 1440, height: 900 }));
afterEach(() => jest.restoreAllMocks());

it('keeps the main draft and mount when a semantic inspector opens and the family changes', () => {
  const mounts = jest.fn();
  const unmounts = jest.fn();
  function Editor() {
    const [text, setText] = useState('');
    useEffect(() => {
      mounts();
      return unmounts;
    }, []);
    return <TextInput testID="draft" value={text} onChangeText={setText} />;
  }
  function Example({
    open,
    family,
    presentation = 'continuous',
  }: {
    open: boolean;
    family: AppShellLayout;
    presentation?: 'continuous' | 'framed';
  }) {
    const panels: AppShellPanelLayout = {
      panels: [
        { id: 'main', role: 'main', content: <Editor /> },
        {
          id: 'inspector',
          role: 'inspector',
          open,
          onOpenChange: jest.fn(),
          label: 'Details',
          content: <Text>Inspector</Text>,
        },
      ],
    };
    return <AppShell layout={family} presentation={presentation} panelLayout={panels} />;
  }
  const screen = render(<Example open={false} family="workspace" />, { wrapper });
  fireEvent.changeText(screen.getByTestId('draft'), 'Kept draft');
  screen.rerender(<Example open family="workspace" />);
  screen.rerender(<Example open family="deck" />);
  screen.rerender(<Example open={false} family="feed" />);
  screen.rerender(<Example open={false} family="feed" presentation="framed" />);
  screen.rerender(<Example open={false} family="feed" />);
  expect(screen.getByTestId('draft').props.value).toBe('Kept draft');
  expect(mounts).toHaveBeenCalledTimes(1);
  expect(unmounts).not.toHaveBeenCalled();
});

it('renders two eligible regions on a continuous desktop without a sidebar', () => {
  function Probe() {
    const panel = useAppShellPanel();
    return <Text testID={panel.id}>{String(panel.alone)}</Text>;
  }
  const screen = render(
    <AppShell
      layout="workspace"
      presentation="continuous"
      panelLayout={{
        panels: [
          { id: 'main', role: 'main', content: <Probe /> },
          { id: 'detail', role: 'detail', content: <Probe /> },
        ],
      }}
    />,
    { wrapper },
  );
  expect(screen.getByTestId('main').props.children).toBe('false');
  expect(screen.getByTestId('detail').props.children).toBe('false');
});

it('isolates a local framed surface from a continuous workspace frame', () => {
  function Probe() {
    return <Text testID="region">{JSON.stringify(useAppShellRegion())}</Text>;
  }
  const screen = render(
    <AppShellCompositionContext.Provider
      value={{ family: 'workspace', presentation: 'continuous' }}
    >
      <AppShellRegionContext.Provider
        value={{
          flow: 'bounded',
          framed: false,
          presentation: 'continuous',
          gutter: 0,
          viewportInset: { top: 60, bottom: 20 },
          bottomReserve: 80,
          underBottomBar: false,
          revealed: false,
          maskColor: '#ffffff',
        }}
      >
        <AppShellPanels
          scope="local"
          layout={{
            presentation: 'framed',
            panels: [{ id: 'local', role: 'main', content: <Probe /> }],
          }}
        />
      </AppShellRegionContext.Provider>
    </AppShellCompositionContext.Provider>,
    { wrapper },
  );
  expect(JSON.parse(screen.getByTestId('region').props.children)).toMatchObject({
    presentation: 'framed',
    framed: true,
    gutter: 12,
    viewportInset: { top: 0, bottom: 0 },
    bottomReserve: 0,
  });
});

it('measures document body in its own region and preserves the cover outside the body', () => {
  const screen = render(
    <Screen kind="document">
      <View testID="cover" />
      <ScreenContent testID="body">
        <Text>Document</Text>
      </ScreenContent>
    </Screen>,
    { wrapper },
  );
  const body = screen.getByTestId('body');
  // The measurement owner is the outer body box, not the window or scroller.
  const owner = body.parent!;
  fireEvent(owner, 'layout', { nativeEvent: { layout: { width: 400, height: 500, x: 0, y: 0 } } });
  expect(resolvedStyle(screen.getByTestId('body').props.style)).toMatchObject({
    maxWidth: 768,
    paddingLeft: 24,
  });
  fireEvent(owner, 'layout', { nativeEvent: { layout: { width: 1000, height: 500, x: 0, y: 0 } } });
  expect(resolvedStyle(screen.getByTestId('body').props.style)).toMatchObject({ paddingLeft: 40 });
  expect(resolvedStyle(screen.getByTestId('cover').props.style).maxWidth).toBeUndefined();
  screen.rerender(
    <Screen kind="canvas">
      <ScreenContent testID="body">
        <Text>Canvas</Text>
      </ScreenContent>
    </Screen>,
  );
  expect(resolvedStyle(screen.getByTestId('body').props.style).maxWidth).toBeUndefined();
});
