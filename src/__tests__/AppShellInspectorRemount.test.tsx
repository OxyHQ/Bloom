import type React from 'react';
import { useEffect } from 'react';
import * as Native from 'react-native';
import { render } from '@testing-library/react-native';
import { AppShell } from '../app-shell';
import type { AppShellPanelLayout } from '../app-shell';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { mockWindowSize } from './support/window-size';

jest.mock('react-native-safe-area-context', () => {
  const actual = jest.requireActual('../../__mocks__/react-native-safe-area-context');
  const React = jest.requireActual('react');
  return {
    ...actual,
    useSafeAreaInsets: () =>
      React.useContext(actual.SafeAreaInsetsContext) ?? { top: 0, bottom: 0, left: 0, right: 0 },
  };
});
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <BloomThemeProvider mode="light" colorPreset="teal">
    {children}
  </BloomThemeProvider>
);

const mounts = jest.fn();
const unmounts = jest.fn();
function Main() {
  useEffect(() => {
    mounts();
    return unmounts;
  }, []);
  return <Native.Text testID="main">main</Native.Text>;
}
const main = <Main />;

// Mention's main panel: a split group of the content and a post-engagement
// inspector that floats below 990 px.
function layout(inspector: boolean, horizontal: boolean): AppShellPanelLayout {
  return {
    gap: 0,
    activePanel: 'main',
    widths: {},
    panels: [
      {
        id: 'main',
        role: 'main',
        visible: true,
        keepMounted: true,
        width: horizontal ? 978 : 620,
        group: {
          mode: 'split',
          axis: horizontal ? 'horizontal' : 'vertical',
          flow: 'bounded',
          appearance: 'separated',
          panels: [
            {
              id: 'main',
              role: 'main',
              content: main,
              keepMounted: true,
              testID: 'shell-main-content',
              errorBoundary: { resetKey: horizontal ? '/videos' : '/', onError: () => {} },
              span: horizontal ? 620 : 1,
              minWidth: horizontal ? 300 : undefined,
              minHeight: 224,
              resizable: !horizontal,
            },
            {
              id: 'main:engagement',
              role: 'inspector',
              visible: inspector,
              span: horizontal ? 350 : 1,
              minHeight: horizontal ? 224 : 128,
              resizable: !horizontal,
              floating: {
                below: horizontal ? 990 : 'md',
                whenConstrained: true,
                open: false,
                onOpenChange: () => {},
                placement: 'bottom',
                label: 'Replies',
              },
              errorBoundary: { onError: () => {} },
              onExitComplete: () => {},
              content: <Native.Text>replies</Native.Text>,
            },
          ],
        },
      },
      {
        id: 'context',
        role: 'context',
        visible: !horizontal,
        width: 350,
        hideBelow: 990,
        sticky: true,
        appearance: 'plain',
        chrome: 'none',
        scroll: 'content',
        errorBoundary: { onError: () => {} },
        content: <Native.Text>context</Native.Text>,
      },
    ],
  };
}

function Shell({ layout: panelLayout }: { layout: AppShellPanelLayout }) {
  return (
    <AppShell
      layout="feed"
      presentation="framed"
      drawer="reveal"
      header={null}
      gutter={8}
      bottomBarVisibility="compact"
      reserveBottomBarSpace={false}
      panelLayout={panelLayout}
    />
  );
}

beforeEach(() => {
  mockWindowSize({ width: 412, height: 915, scale: 2.625, fontScale: 1 });
  mounts.mockClear();
  unmounts.mockClear();
});

it.each([
  ['the inspector appears', false, true, false],
  ['the group turns horizontal', false, false, true],
  ['both', false, true, true],
])('keeps the main content mounted when %s on a phone', (_name, start, inspector, horizontal) => {
  const screen = render(<Shell layout={layout(start, false)} />, { wrapper });
  expect(mounts).toHaveBeenCalledTimes(1);
  screen.rerender(<Shell layout={layout(inspector, horizontal)} />);
  screen.rerender(<Shell layout={layout(start, false)} />);
  expect(unmounts).not.toHaveBeenCalled();
  expect(mounts).toHaveBeenCalledTimes(1);
});

it('keeps one scroll host for a group that does not scroll, whatever its axis', () => {
  // On Android a horizontal ScrollView is a different native component
  // (AndroidHorizontalScrollView) from a vertical one, so flipping `horizontal`
  // remounts every route inside the group. Jest's ScrollView cannot show that
  // swap, so the contract is asserted on the prop that causes it.
  const screen = render(<Shell layout={layout(false, false)} />, { wrapper });
  const hosts = () =>
    screen
      .UNSAFE_getAllByType(Native.ScrollView)
      .filter((view) => view.props.scrollEnabled === false)
      .map((view) => Boolean(view.props.horizontal));
  const before = hosts();
  expect(before.length).toBeGreaterThan(0);
  screen.rerender(<Shell layout={layout(true, true)} />);
  expect(hosts()).toEqual(before);
});
