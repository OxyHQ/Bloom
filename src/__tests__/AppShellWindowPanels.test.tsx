/**
 * The window's chrome where nothing of the shell's own is at the window's
 * corner (OxyOS ADR 0016, decisions 3–4, as a desktop application's panes are
 * its title area): the shell hands it to its panel layout, the panel at the
 * window's top leading corner keeps the controls' room in its header, every
 * panel header along the window's top edge moves the window, and the frame
 * and the panels do not move. A `Screen` that is the window's content is the
 * same chrome on its own. Without the capability nothing changes.
 */
import { useEffect, type ReactNode } from 'react';
import * as ReactNative from 'react-native';
import { act, render } from '@testing-library/react-native';

import { AppShell, AppShellPanel, AppShellPanels } from '../app-shell';
import type { AppShellPanelLayout } from '../app-shell/panel-layout-types';
import type { AppShellProps } from '../app-shell/types';
import { RiHomeLine } from '../icons/remix';
import { PageHeader } from '../page-header';
import { PlatformSurfaceProvider } from '../platform-surface/context';
import type { PlatformSurfaceAdapter } from '../platform-surface/types';
import { PortalOutlet, PortalProvider } from '../portal';
import { Screen } from '../screen';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { useWindowHeaderRoom } from '../window';
import { fakeWindow, WINDOW_METRICS } from './support/fake-window';
import { resolvedStyle } from './support/rendered-style';

const NAV = [{ key: 'home', label: 'Home', icon: RiHomeLine, href: '/' }];
const i18n = ReactNative.I18nManager as { isRTL: boolean };

function setWidth(width: number) {
  jest
    .spyOn(ReactNative, 'useWindowDimensions')
    .mockReturnValue({ width, height: 900, scale: 1, fontScale: 1 });
}

afterEach(() => {
  i18n.isRTL = false;
  jest.restoreAllMocks();
});

let mounts: Record<string, number> = {};
beforeEach(() => {
  mounts = {};
});

/** A route: a Screen with a PageHeader, counting its mounts. */
function Page({ id, title }: { id: string; title: string }) {
  useEffect(() => {
    mounts[id] = (mounts[id] ?? 0) + 1;
  }, [id]);
  return (
    <Screen testID={id} header={<PageHeader title={title} testID={`${id}-bar`} />}>
      <ReactNative.Text>{title} body</ReactNative.Text>
    </Screen>
  );
}

/** The owner's mail window: a 340 inbox beside a detail, each a Screen. */
const SPLIT: AppShellPanelLayout = {
  mode: 'split',
  gap: 8,
  panels: [
    { id: 'inbox', width: 340, content: <Page id="inbox" title="Inbox" /> },
    { id: 'detail', content: <Page id="detail" title="Detail" /> },
  ],
};

function mount(adapter: PlatformSurfaceAdapter | null | undefined, ui: ReactNode) {
  const tree = (
    <PortalProvider>
      {ui}
      <PortalOutlet />
    </PortalProvider>
  );
  return render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      {adapter === undefined ? (
        tree
      ) : (
        <PlatformSurfaceProvider value={adapter}>{tree}</PlatformSurfaceProvider>
      )}
    </BloomThemeProvider>,
  );
}

const shell = (adapter: PlatformSurfaceAdapter | null | undefined, props: Partial<AppShellProps>) =>
  mount(adapter, <AppShell testID="shell" {...props} />);

type Rendered = ReturnType<typeof render>;
const style = (screen: Rendered, id: string) => resolvedStyle(screen.getByTestId(id).props.style);
/** A Screen's header slot moves the window: it claims the press it is offered. */
const moves = (screen: Rendered, id: string) =>
  screen.getByTestId(`${id}-header`).props.onStartShouldSetResponder?.() === true;
/** Where the PageHeader's row starts, from its own leading edge. */
const barStart = (screen: Rendered, id: string) => {
  const bar = style(screen, `${id}-bar-bar`);
  return bar.paddingInlineStart ?? bar.paddingLeft;
};
/** Where the controls' centre line is, from the window's top: 26 on OxyOS. */
const CONTROLS_CENTRE = WINDOW_METRICS.controls.top + WINDOW_METRICS.controls.height / 2;
/**
 * Where a PageHeader's row is centred, from the window's top: every top
 * offset of the boxes above it (padding, margin, `top`) plus half its row,
 * which has no vertical padding of its own as the window's toolbar.
 */
const titleRowCentre = (screen: Rendered, id: string) => {
  const bar = screen.getByTestId(`${id}-bar-bar`);
  const own = resolvedStyle(bar.props.style);
  let offset = 0;
  for (let node = bar.parent; node; node = node.parent) {
    if (typeof node.type !== 'string') continue;
    const box = resolvedStyle(node.props.style);
    const value = (key: string) => (typeof box[key] === 'number' ? (box[key] as number) : 0);
    offset +=
      (typeof box.paddingTop === 'number' ? box.paddingTop : value('padding')) +
      (typeof box.marginTop === 'number' ? box.marginTop : value('margin')) +
      value('top');
  }
  return offset + (own.minHeight as number) / 2;
};
/** The physical corners a panel's surface is drawn with. */
const corners = (screen: Rendered, panel: string) => {
  const surface = screen
    .getByTestId(`shell-panels-${panel}-surface-bounds`)
    .findByProps({ testID: 'content-panel-surface' });
  const box = resolvedStyle(surface.props.style);
  return [
    box.borderTopLeftRadius ?? box.borderRadius,
    box.borderTopRightRadius ?? box.borderRadius,
    box.borderBottomRightRadius ?? box.borderRadius,
    box.borderBottomLeftRadius ?? box.borderRadius,
  ];
};
/** The host tree as markup, with React's per-root `useId` values made comparable. */
const markup = (screen: Rendered) =>
  JSON.stringify(screen.toJSON()).replace(/-r[0-9a-z]+-/g, '-r-');

describe('a split panel layout with nothing else at the corner', () => {
  it('draws the controls once, in the window corner', () => {
    setWidth(1440);
    const screen = shell(fakeWindow().adapter, { panelLayout: SPLIT });
    expect(screen.getAllByLabelText('Close')).toHaveLength(1);
    expect(style(screen, 'shell-window-controls')).toMatchObject({
      position: 'absolute',
      top: 16,
      insetInlineStart: 14,
    });
  });

  it("the first panel's header keeps the room inside its bar and moves the window", () => {
    setWidth(1440);
    const screen = shell(fakeWindow().adapter, { panelLayout: SPLIT });
    // The panel starts at the frame's 16 inset, so 72 of the 88 are its own;
    // the room holds the gap after the controls, so it replaces the 24 inset.
    expect(style(screen, 'inbox-bar-bar')).toMatchObject({
      paddingInlineStart: 72,
      paddingInlineEnd: 24,
    });
    expect(style(screen, 'inbox-bar-bar').paddingLeft).toBeUndefined();
    expect(moves(screen, 'inbox')).toBe(true);
    // As chrome the slot takes presses nothing inside takes.
    expect(screen.getByTestId('inbox-header').props.pointerEvents).toBeUndefined();
  });

  it('every other panel header along the top edge moves the window and keeps no room', () => {
    setWidth(1440);
    const screen = shell(fakeWindow().adapter, { panelLayout: SPLIT });
    expect(moves(screen, 'detail')).toBe(true);
    expect(barStart(screen, 'detail')).toBe(24);
  });

  it("the panes start at the window's top edge; the other frame insets stay", () => {
    setWidth(1440);
    const windowed = shell(fakeWindow().adapter, { panelLayout: SPLIT });
    expect(style(windowed, 'shell')).toMatchObject({
      paddingTop: 0,
      paddingBottom: 16,
      paddingInlineStart: 16,
      paddingInlineEnd: 16,
    });
    // The first panel starts at the region's edge, with no room of the controls'.
    const panel = style(windowed, 'shell-panels-inbox');
    expect(panel.marginInlineStart ?? 0).toBe(0);
    expect(panel.paddingInlineStart).toBeUndefined();
    expect(style(windowed, 'inbox-content').paddingInlineStart).toBeUndefined();
    windowed.unmount();
    // Without windows the frame is the same on every side.
    expect(style(shell(undefined, { panelLayout: SPLIT }), 'shell')).toMatchObject({ padding: 16 });
  });

  it("every pane's title row is the window's toolbar, centred on the controls", () => {
    setWidth(1440);
    const screen = shell(fakeWindow().adapter, { panelLayout: SPLIT });
    expect(CONTROLS_CENTRE).toBe(26);
    for (const id of ['inbox', 'detail']) {
      expect(style(screen, `${id}-bar-bar`).minHeight).toBe(52);
      expect(titleRowCentre(screen, id)).toBe(CONTROLS_CENTRE);
    }
  });

  it("the panes' top corners are concentric with the window's; the bottom ones stay", () => {
    setWidth(1440);
    const windowed = shell(fakeWindow().adapter, { panelLayout: SPLIT });
    // Top gap 0: the window's own 16 radius. The panel's own radius below.
    const [, , bottom] = corners(windowed, 'inbox');
    expect(bottom).not.toBe(WINDOW_METRICS.radius);
    expect(corners(windowed, 'inbox')).toEqual([16, 16, bottom, bottom]);
    expect(corners(windowed, 'detail')).toEqual([16, 16, bottom, bottom]);
    // The content's clip and the material follow the same corners.
    const content = resolvedStyle(
      windowed
        .getByTestId('shell-panels-inbox-surface-bounds')
        .findByProps({ testID: 'content-panel-content' }).props.style,
    );
    expect(content).toMatchObject({ borderTopLeftRadius: 16, borderTopRightRadius: 16 });
    windowed.unmount();
    const page = shell(undefined, { panelLayout: SPLIT });
    expect(corners(page, 'inbox')).toEqual([bottom, bottom, bottom, bottom]);
  });

  it('the panels fill the window rather than centring a reading envelope in it', () => {
    setWidth(1440);
    const windowed = shell(fakeWindow().adapter, { panelLayout: SPLIT });
    // The whole window less the frame's two 16 insets, as React lays it out at
    // rest (the animated keys defer to it: `useRestingSize`).
    const resting = { flexBasis: 'auto', maxWidth: '100%', flexGrow: 0 };
    expect(style(windowed, 'shell-content')).toMatchObject({ ...resting, width: 1408 });
    windowed.unmount();
    // Without windows the envelope is the panels' own widths (340 + 8 + 360).
    const page = shell(undefined, { panelLayout: SPLIT });
    expect(style(page, 'shell-content')).toMatchObject({ ...resting, width: 708 });
  });

  it("keeps the room of the platform's own controls without drawing any", () => {
    setWidth(1440);
    const screen = shell(fakeWindow({ controls: 'platform' }).adapter, { panelLayout: SPLIT });
    expect(screen.queryByTestId('shell-window-controls')).toBeNull();
    expect(barStart(screen, 'inbox')).toBe(72);
    expect(moves(screen, 'inbox')).toBe(true);
  });

  it('`overlay`: the panels keep no room and move nothing; the controls float on a plate', () => {
    setWidth(1440);
    const screen = shell(fakeWindow().adapter, { panelLayout: SPLIT, windowControls: 'overlay' });
    expect(barStart(screen, 'inbox')).toBe(24);
    expect(moves(screen, 'inbox')).toBe(false);
    expect(screen.getByTestId('shell-window-controls')).toBeTruthy();
  });
});

describe('full screen', () => {
  it('no controls, no room, no drag; leaving it brings them back without a remount', () => {
    setWidth(1440);
    const { window, adapter } = fakeWindow({ state: { fullscreen: true } });
    const screen = shell(adapter, { panelLayout: SPLIT });
    expect(screen.queryByTestId('shell-window-controls')).toBeNull();
    // Full screen is laid out as without windows: the frame and the bars as before.
    expect(style(screen, 'shell')).toMatchObject({ padding: 16 });
    expect(style(screen, 'inbox-bar-bar').minHeight).toBeUndefined();
    expect(barStart(screen, 'inbox')).toBe(24);
    expect(moves(screen, 'inbox')).toBe(false);
    expect(moves(screen, 'detail')).toBe(false);
    // Not the chrome, the slot lets presses through to the content as before.
    expect(screen.getByTestId('inbox-header').props.pointerEvents).toBe('box-none');

    act(() => window.set({ fullscreen: false }));
    expect(screen.getByTestId('shell-window-controls')).toBeTruthy();
    expect(style(screen, 'shell').paddingTop).toBe(0);
    expect(titleRowCentre(screen, 'inbox')).toBe(CONTROLS_CENTRE);
    expect(barStart(screen, 'inbox')).toBe(72);
    expect(moves(screen, 'inbox')).toBe(true);
    expect(moves(screen, 'detail')).toBe(true);
    // The panels' routes were not remounted.
    expect(mounts).toEqual({ inbox: 1, detail: 1 });
  });
});

describe('other panel shapes', () => {
  it('a deck: the first panel keeps the room, every panel moves the window', () => {
    setWidth(1440);
    const screen = shell(fakeWindow().adapter, {
      panelLayout: {
        mode: 'deck',
        panels: [
          { id: 'one', width: 360, content: <Page id="one" title="One" /> },
          { id: 'two', width: 360, content: <Page id="two" title="Two" /> },
          { id: 'three', width: 360, content: <Page id="three" title="Three" /> },
        ],
      },
    });
    expect(barStart(screen, 'one')).toBe(72);
    expect(barStart(screen, 'two')).toBe(24);
    expect(barStart(screen, 'three')).toBe(24);
    expect(['one', 'two', 'three'].map((id) => moves(screen, id))).toEqual([true, true, true]);
  });

  it('collapsed to one panel: the shown one is at the corner, full-bleed', () => {
    setWidth(600);
    const screen = shell(fakeWindow().adapter, {
      panelLayout: { ...SPLIT, collapseBelow: 'lg', activePanel: 'detail' },
    });
    // A compact region has no frame inset: the whole room is the panel's.
    expect(barStart(screen, 'detail')).toBe(88);
    expect(moves(screen, 'detail')).toBe(true);
    // The other one is not shown (nor mounted).
    expect(screen.queryByTestId('inbox-header')).toBeNull();
  });

  it('stacked: only the top panel is along the window edge', () => {
    setWidth(1440);
    const screen = shell(fakeWindow().adapter, {
      panelLayout: { ...SPLIT, axis: 'vertical' },
    });
    expect(barStart(screen, 'inbox')).toBe(72);
    expect(moves(screen, 'inbox')).toBe(true);
    expect(barStart(screen, 'detail')).toBe(24);
    expect(moves(screen, 'detail')).toBe(false);
    // Only the top pane touches the window's top: its toolbar and corners are
    // the window's; the one below keeps its own bar and corners.
    expect(titleRowCentre(screen, 'inbox')).toBe(CONTROLS_CENTRE);
    expect(style(screen, 'detail-bar-bar').minHeight).toBeUndefined();
    const [, , bottom] = corners(screen, 'inbox');
    expect(corners(screen, 'inbox')).toEqual([16, 16, bottom, bottom]);
    expect(corners(screen, 'detail')).toEqual([bottom, bottom, bottom, bottom]);
  });

  it('retained panels: the corner panel keeps the room, its neighbour moves the window', () => {
    setWidth(1440);
    const screen = shell(fakeWindow().adapter, {
      panelLayout: { ...SPLIT, retain: true, flow: 'bounded' },
    });
    expect(barStart(screen, 'inbox')).toBe(72);
    expect(moves(screen, 'inbox')).toBe(true);
    expect(barStart(screen, 'detail')).toBe(24);
    expect(moves(screen, 'detail')).toBe(true);
  });

  it("the layout's own header spans the panels: it is the chrome, the panels are below it", () => {
    setWidth(1440);
    const screen = shell(fakeWindow().adapter, {
      panelLayout: {
        ...SPLIT,
        header: <PageHeader title="Mail" testID="workspace-bar" />,
      },
    });
    expect(style(screen, 'workspace-bar-bar').paddingInlineStart).toBe(72);
    expect(moves(screen, 'shell-panels-workspace')).toBe(true);
    expect(moves(screen, 'inbox')).toBe(false);
    expect(barStart(screen, 'inbox')).toBe(24);
  });

  it('a panel with no Screen of its own reads the room for its own toolbar', () => {
    setWidth(1440);
    function Toolbar({ id }: { id: string }) {
      const room = useWindowHeaderRoom();
      return <ReactNative.Text testID={`${id}-room`}>{String(room)}</ReactNative.Text>;
    }
    const screen = shell(fakeWindow().adapter, {
      panelLayout: {
        mode: 'split',
        panels: [
          { id: 'a', width: 300, content: <Toolbar id="a" /> },
          { id: 'b', content: <Toolbar id="b" /> },
        ],
      },
    });
    expect(screen.getByTestId('a-room').props.children).toBe('72');
    expect(screen.getByTestId('b-room').props.children).toBe('0');
  });
});

describe('the corner has one owner', () => {
  it('a sidebar in flow keeps it: the panels keep no room and move nothing', () => {
    setWidth(1440);
    const screen = shell(fakeWindow().adapter, { panelLayout: SPLIT, sidebar: { items: NAV } });
    expect(screen.getByTestId('sidebar-window-band')).toBeTruthy();
    expect(barStart(screen, 'inbox')).toBe(24);
    expect(moves(screen, 'inbox')).toBe(false);
    expect(moves(screen, 'detail')).toBe(false);
  });

  it('a shell header keeps it: the panels below it keep nothing', () => {
    setWidth(1440);
    const screen = shell(fakeWindow().adapter, { panelLayout: SPLIT, title: 'Mail' });
    expect(screen.getByTestId('shell-header-drag')).toBeTruthy();
    expect(moves(screen, 'inbox')).toBe(false);
    expect(barStart(screen, 'inbox')).toBe(24);
  });

  it("panels inside a panel's Screen are below its header: they keep nothing", () => {
    setWidth(1440);
    const screen = shell(fakeWindow().adapter, {
      panelLayout: {
        mode: 'split',
        panels: [
          {
            id: 'outer',
            content: (
              <Screen testID="outer" header={<PageHeader title="Outer" testID="outer-bar" />}>
                <AppShellPanels scope="local" testID="local">
                  <AppShellPanel id="nested">
                    <Page id="nested" title="Nested" />
                  </AppShellPanel>
                </AppShellPanels>
              </Screen>
            ),
          },
        ],
      },
    });
    expect(screen.getAllByLabelText('Close')).toHaveLength(1);
    expect(barStart(screen, 'outer')).toBe(72);
    expect(barStart(screen, 'nested')).toBe(24);
    expect(moves(screen, 'nested')).toBe(false);
  });

  it('a shell inside the window-owning Screen is not at the corner', () => {
    setWidth(1440);
    const screen = mount(
      fakeWindow().adapter,
      <Screen testID="root" header={<PageHeader title="Root" testID="root-bar" />}>
        <AppShell testID="inner" panelLayout={SPLIT} />
      </Screen>,
    );
    expect(screen.getAllByLabelText('Close')).toHaveLength(1);
    expect(screen.queryByTestId('inner-window-controls')).toBeNull();
    expect(barStart(screen, 'inbox')).toBe(24);
    expect(moves(screen, 'inbox')).toBe(false);
  });
});

describe('a Screen that is the window', () => {
  const app = (body?: ReactNode) => (
    <Screen testID="root" header={<PageHeader title="Notes" testID="root-bar" />}>
      {body ?? <ReactNative.Text>Body</ReactNative.Text>}
    </Screen>
  );

  it('draws the controls in its corner; its header keeps the whole room and moves the window', () => {
    setWidth(1440);
    const screen = mount(fakeWindow().adapter, app());
    expect(screen.getAllByLabelText('Close')).toHaveLength(1);
    expect(style(screen, 'root-window-controls')).toMatchObject({ top: 16, insetInlineStart: 14 });
    expect(barStart(screen, 'root')).toBe(88);
    expect(moves(screen, 'root')).toBe(true);
    expect(titleRowCentre(screen, 'root')).toBe(CONTROLS_CENTRE);
  });

  it('a screen nested in its content is not at the corner', () => {
    setWidth(1440);
    const screen = mount(
      fakeWindow().adapter,
      app(
        <Screen testID="inner" header={<PageHeader title="Inner" testID="inner-bar" />}>
          <ReactNative.Text>Inner</ReactNative.Text>
        </Screen>,
      ),
    );
    expect(screen.getAllByLabelText('Close')).toHaveLength(1);
    expect(screen.queryByTestId('inner-window-controls')).toBeNull();
    expect(barStart(screen, 'inner')).toBe(24);
    expect(moves(screen, 'inner')).toBe(false);
  });

  it("a shell's Screen is not the window: the shell already holds the corner", () => {
    setWidth(1440);
    const screen = shell(fakeWindow().adapter, {
      title: 'Inbox',
      children: <Page id="route" title="Route" />,
    });
    expect(screen.getAllByLabelText('Close')).toHaveLength(1);
    expect(screen.queryByTestId('route-window-controls')).toBeNull();
    expect(moves(screen, 'route')).toBe(false);
  });

  it('full screen: no controls, no room, no drag', () => {
    setWidth(1440);
    const { window, adapter } = fakeWindow({ state: { fullscreen: true } });
    const screen = mount(adapter, app());
    expect(screen.queryByTestId('root-window-controls')).toBeNull();
    expect(barStart(screen, 'root')).toBe(24);
    expect(moves(screen, 'root')).toBe(false);
    act(() => window.set({ fullscreen: false }));
    expect(barStart(screen, 'root')).toBe(88);
  });

  it('a centred title clears the room as well', () => {
    setWidth(1440);
    const screen = mount(
      fakeWindow().adapter,
      <Screen
        testID="root"
        header={<PageHeader title="Notes" titleAlign="center" testID="root-bar" />}
      />,
    );
    // The centre slot is inset past the room (88 − the 24 side inset) + the row gap.
    expect(style(screen, 'root-bar-center')).toMatchObject({ marginLeft: 72, marginRight: 72 });
  });
});

describe('right to left', () => {
  it('the room is logical: the leading edge is the right, and the first panel is there', () => {
    i18n.isRTL = true;
    setWidth(1440);
    const screen = shell(fakeWindow().adapter, { panelLayout: SPLIT });
    const bar = style(screen, 'inbox-bar-bar');
    expect(bar).toMatchObject({ paddingInlineStart: 72, paddingInlineEnd: 24 });
    expect(bar.paddingLeft).toBeUndefined();
    expect(bar.paddingRight).toBeUndefined();
    expect(style(screen, 'shell-window-controls')).toMatchObject({ insetInlineStart: 14 });
    expect(style(screen, 'shell')).toMatchObject({ paddingInlineStart: 16, paddingInlineEnd: 16 });
    // Both top corners take the window's radius, so they mirror unchanged.
    expect(corners(screen, 'inbox').slice(0, 2)).toEqual([16, 16]);
  });
});

describe('without the window capability', () => {
  const SHAPES: Record<string, () => ReactNode> = {
    split: () => <AppShell testID="shell" panelLayout={SPLIT} />,
    deck: () => (
      <AppShell
        testID="shell"
        panelLayout={{
          mode: 'deck',
          panels: [
            { id: 'one', width: 360, content: <Page id="one" title="One" /> },
            { id: 'two', width: 360, content: <Page id="two" title="Two" /> },
          ],
        }}
      />
    ),
    collapsed: () => <AppShell testID="shell" panelLayout={{ ...SPLIT, collapseBelow: 'xl' }} />,
    stacked: () => <AppShell testID="shell" panelLayout={{ ...SPLIT, axis: 'vertical' }} />,
    retained: () => (
      <AppShell testID="shell" panelLayout={{ ...SPLIT, retain: true, flow: 'bounded' }} />
    ),
    'group header': () => (
      <AppShell
        testID="shell"
        panelLayout={{ ...SPLIT, header: <PageHeader title="Mail" testID="workspace-bar" /> }}
      />
    ),
    'centred title': () => (
      <Screen
        testID="root"
        header={<PageHeader title="Notes" titleAlign="center" testID="root-bar" />}
      />
    ),
    'single screen': () => (
      <Screen testID="root" header={<PageHeader title="Notes" testID="root-bar" />}>
        <Screen testID="inner" header={<PageHeader title="Inner" testID="inner-bar" />} />
      </Screen>
    ),
  };

  it.each(Object.entries(SHAPES))('renders %s exactly as before', (_shape, ui) => {
    setWidth(1440);
    const before = markup(mount(undefined, ui()));
    for (const adapter of [null, { platform: 'test', capabilities: new Set<never>() }]) {
      const screen = mount(adapter, ui());
      expect(markup(screen)).toBe(before);
      expect(screen.queryByLabelText('Close')).toBeNull();
      screen.unmount();
    }
  });
});
