// Native, with the app's content running under a floating bottom bar
// (`reserveBottomBarSpace={false}`): a group of panels inside a panel lays out
// under the bar as the shell's own group does. Its screens read the bar's
// occupied height and clear it; a stacked panel sits above the group's own
// clearance instead, and a lone one is never cleared twice.
import * as ReactNative from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';

import { AppShell, type AppShellPanelDefinition } from '../app-shell';
import { BottomEdgeProvider } from '../layout/bottom-edge';
import { PortalOutlet, PortalProvider } from '../portal';
import { Screen, useScreen } from '../screen';
import type { ScreenContextValue } from '../screen/context';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { resolvedStyle } from './support/rendered-style';
import { mockWindowSize } from './support/window-size';

const BAR = 92;

type Seen = Record<string, ScreenContextValue>;

function Probe({ id, seen }: { id: string; seen: Seen }) {
  seen[id] = useScreen();
  return null;
}

/** A full-bleed route: the reel, which lays its own controls clear of the bar. */
function Route({ id, seen }: { id: string; seen: Seen }) {
  return (
    <Screen scroll="auto" headerPlacement="overlay" contentClearance={0}>
      <Probe id={id} seen={seen} />
    </Screen>
  );
}

function renderShell(panels: AppShellPanelDefinition[], axis?: 'horizontal' | 'vertical') {
  const view = render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      <PortalProvider>
        {/* BloomProvider's: the app-wide registry the shell's bar claims. */}
        <BottomEdgeProvider>
          <AppShell
            testID="shell"
            layout="feed"
            presentation="framed"
            header={null}
            gutter={8}
            reserveBottomBarSpace={false}
            bottomBar={<ReactNative.View testID="tabs" />}
            panelLayout={{ axis, panels }}
          />
        </BottomEdgeProvider>
        <PortalOutlet />
      </PortalProvider>
    </BloomThemeProvider>,
  );
  act(() => {
    fireEvent(view.getByTestId('shell-bottom-bar'), 'layout', {
      nativeEvent: { layout: { height: BAR } },
    });
  });
  return view;
}

/** What a route's content clears at the bottom: Bloom's rule, as screens apply it. */
const clearance = (screen: ScreenContextValue | undefined) =>
  (screen?.bottomInsetHandled ?? screen?.contentInsetsHandled) ? 0 : screen?.bottomInset;

const scrollPadding = (view: ReturnType<typeof renderShell>, testID: string) =>
  resolvedStyle(view.getByTestId(testID).props.contentContainerStyle).paddingBottom ?? 0;

beforeEach(() => {
  jest.replaceProperty(ReactNative.Platform, 'OS', 'android');
  mockWindowSize({ width: 412, height: 900, scale: 1, fontScale: 1 });
});
afterEach(() => jest.restoreAllMocks());

describe('a group inside a panel, under the bottom bar', () => {
  it.each(['horizontal', 'vertical'] as const)(
    'its route clears the bar the shell measured (%s)',
    (axis) => {
      const seen: Seen = {};
      const view = renderShell([
        {
          id: 'main',
          role: 'main',
          group: {
            mode: 'split',
            axis,
            flow: 'bounded',
            appearance: 'separated',
            panels: [
              { id: 'main', role: 'main', content: <Route id="main" seen={seen} /> },
              { id: 'main:engagement', role: 'inspector', visible: false, content: null },
            ],
          },
        },
      ]);
      expect(clearance(seen.main)).toBe(BAR);
      // The group reaches under the bar: it reserves nothing itself.
      expect(scrollPadding(view, 'shell-panels-main-group-scroll')).toBe(0);
    },
  );
});

describe('the shell’s own vertical group, under the bottom bar', () => {
  it('a lone panel reaches under the bar and clears it once', () => {
    const seen: Seen = {};
    const view = renderShell(
      [{ id: 'main', role: 'main', content: <Route id="main" seen={seen} /> }],
      'vertical',
    );
    expect(clearance(seen.main)).toBe(BAR);
    expect(scrollPadding(view, 'shell-panels-scroll')).toBe(0);
  });

  it('stacked panels sit above the group’s clearance, which clears the bar once', () => {
    const seen: Seen = {};
    const view = renderShell(
      [
        { id: 'main', role: 'main', content: <Route id="main" seen={seen} /> },
        { id: 'detail', role: 'inspector', content: <Route id="detail" seen={seen} /> },
      ],
      'vertical',
    );
    expect(scrollPadding(view, 'shell-panels-scroll')).toBe(BAR);
    expect(clearance(seen.main)).toBe(0);
    expect(clearance(seen.detail)).toBe(0);
  });
});
