/**
 * Android and OxyOS: the router's navigators are Bloom's and expo-router's
 * ExperimentalStack; the shell's bottom bar is the language BottomBar with its
 * FAB. Against stand-ins (support/bloom-router.ts, an ExperimentalStack mock).
 */
import { createElement, useState, type ReactNode } from 'react';

import { act, Glyph, hosts, mount, only, OtherGlyph, quietRenderer } from './support/mount';
import { pager, router } from './support/bloom-router';
import {
  BottomSheet,
  Button,
  Embed,
  FAB,
  Header,
  Icon,
  NavItem,
  ScrollView,
  Sidebar,
  Text,
  VStack,
} from '../primitives';
import {
  AppLayout,
  Destination,
  layout,
  navigate,
  Panel,
  screen,
  Sheet,
  Stack,
  TabView,
} from '../router';
import { InPagerContext } from '../router/pager';

jest.mock('expo-router', () => {
  const ExperimentalStack = Object.assign(
    (props: { children?: ReactNode }) => createElement('ExperimentalStack', props, props.children),
    { Screen: 'ExperimentalStackScreen' },
  );
  return { ExperimentalStack };
});
jest.mock('../router/stack', () => jest.requireActual('../router/stack.tsx'));
jest.mock('../router/tabs', () => jest.requireActual('../router/tabs.tsx'));
jest.mock('../router/bar', () => jest.requireActual('../router/bar.tsx'));
jest.mock('../router/screen-header', () => jest.requireActual('../router/screen-header.tsx'));
jest.mock('../router/sheet-host', () => jest.requireActual('../router/sheet-host.tsx'));
jest.mock('../platform/header-host', () => jest.requireActual('../platform/header-host.tsx'));

quietRenderer();

/** A route drawn inside Bloom's pager, as TabView provides it. */
function TabPagerContextProbe({ children }: { children?: ReactNode }) {
  return createElement(InPagerContext.Provider, { value: true }, children);
}

beforeEach(() => {
  pager.pages = [
    { name: 'camera', href: '/camera' },
    { name: 'index', href: '/', label: 'Home', icon: Glyph, activeIcon: OtherGlyph, bar: true },
    {
      name: 'notifications',
      href: '/notifications',
      label: 'Alerts',
      icon: Glyph,
      badge: 3,
      bar: true,
    },
    { name: 'write', href: '/write' },
  ];
  pager.activePage = 'index';
  pager.selectDestination.mockReset();
  router.push.mockReset();
});

const app = (shown = true) =>
  layout(function app() {
    return AppLayout(Stack('(tabs)', Sheet('compose'), 'p/[id]/boost'))
      .primaryAction(Glyph, 'Compose', 'write')
      .bottomBar(shown);
  });

describe('AppLayout on Android', () => {
  it('the shell holds the predictive-back stack, its routes in order, each a Bloom scene', () => {
    const r = mount(createElement(app()));
    const stack = only(r, 'ExperimentalStack');
    expect(stack.props.screenOptions).toEqual({ headerShown: false });
    expect(typeof stack.props.screenLayout).toBe('function');
    expect(hosts(r, 'ExperimentalStackScreen').map((s) => s.props.name)).toEqual([
      '(tabs)',
      'compose',
      'p/[id]/boost',
    ]);
    // A sheet is pushed on Android, as before: no presentation of its own.
    expect(hosts(r, 'ExperimentalStackScreen')[1]?.props.options).toBeUndefined();
  });

  it('the bottom bar is the pager’s bar pages, the FAB the primary action, which selects its destination', () => {
    const r = mount(createElement(app()));
    const bar = only(r, 'BottomBar');
    expect(bar.props.items.map((item: { name: string }) => item.name)).toEqual([
      'index',
      'notifications',
    ]);
    expect(bar.props.items[1].badge).toBe(3);
    expect(bar.props.value).toBe('index');
    const fab = only(mount(bar.props.action), 'BloomFab');
    expect(fab.props.accessibilityLabel).toBe('Compose');
    act(() => fab.props.onPress());
    expect(pager.selectDestination).toHaveBeenCalledWith('write');
    // The sidebar's compose row is the same action.
    const shell = only(r, 'AppShell');
    expect(shell.props.primaryAction.accessibilityLabel).toBe('Compose');
  });

  it('a route without the bar gives the shell none', () => {
    const r = mount(createElement(app(false)));
    expect(only(r, 'AppShell').props.bottomBar).toBeNull();
    expect(hosts(r, 'BottomBar')).toHaveLength(0);
  });

  it('the shell’s own options place the navigator in the panel the app names', () => {
    const Shell = layout(function shell() {
      return AppLayout(Stack()).shell((navigator) => ({
        testID: 'shell',
        panelLayout: { panels: [{ id: 'main', role: 'main', content: navigator }] },
      }));
    });
    const r = mount(createElement(Shell));
    const shell = only(r, 'AppShell');
    expect(shell.props.testID).toBe('shell');
    // The navigator is the panel's content, not the shell's child.
    expect(hosts(r, 'ExperimentalStack')).toHaveLength(0);
    expect(shell.props.panelLayout.panels[0].content).toBeTruthy();
  });

  it('the app runs edge to edge: the shell draws no safe-area frame, whatever layout it names', () => {
    // A semantic layout frames the top by default, which painted a band behind
    // the status bar (Mention, Pixel 8a); the pages own their edges instead.
    expect(only(mount(createElement(app())), 'AppShell').props.safeArea).toBe(false);
    const Feed = layout(function feed() {
      return AppLayout(Stack()).shell(() => ({ layout: 'feed' }));
    });
    expect(only(mount(createElement(Feed)), 'AppShell').props.safeArea).toBe(false);
  });

  it('an app that wants the safe-area frame asks for it', () => {
    const Framed = layout(function framed() {
      return AppLayout(Stack()).shell(() => ({ layout: 'feed', safeArea: true }));
    });
    expect(only(mount(createElement(Framed)), 'AppShell').props.safeArea).toBe(true);
  });

  it('the shell’s semantic layout and panels: a panel without content holds the navigator', () => {
    const open = jest.fn();
    const Root = layout(() =>
      AppLayout(Stack())
        .shellLayout('deck')
        .shellPresentation('floating')
        .panels(
          Panel('main').panelRole('main'),
          Panel('details', Text('details'))
            .panelRole('inspector')
            .label('Details')
            .presented(true)
            .onPresentedChange(open)
            .width('320')
            .minWidth('280')
            .resizable(),
          Panel('later', Text('later')).hidden(),
        ),
    );
    const r = mount(createElement(Root));
    const shell = only(r, 'AppShell');
    expect(shell.props).toMatchObject({ layout: 'deck', presentation: 'floating' });
    const panels = shell.props.panelLayout.panels;
    expect(panels.map((panel: { id: string }) => panel.id)).toEqual(['main', 'details', 'later']);
    expect(panels[0].content).toBeTruthy();
    expect(panels[1]).toMatchObject({
      role: 'inspector',
      label: 'Details',
      open: true,
      onOpenChange: open,
      width: 320,
      minWidth: 280,
      resizable: true,
    });
    expect(panels[2].visible).toBe(false);
    // The navigator is the main panel's content, not the shell's child.
    expect(hosts(r, 'ExperimentalStack')).toHaveLength(0);
  });

  it('destinations put Bloom’s pager above the shell', () => {
    const reselect = jest.fn();
    const Root = layout(() =>
      AppLayout(TabView())
        .destinations(
          Destination('index', '/').label('Home').icon(Glyph).activeIcon(OtherGlyph).bar(),
          Destination('write', '/write').page().sidebar(false),
        )
        .onReselect(reselect),
    );
    const r = mount(createElement(Root));
    const provider = only(r, 'TabPagerProvider');
    expect(provider.props.destinations).toEqual([
      { name: 'index', href: '/', label: 'Home', icon: Glyph, activeIcon: OtherGlyph, bar: true },
      { name: 'write', href: '/write', page: true, sidebar: false },
    ]);
    expect(provider.props.onReselect).toBe(reselect);
    expect(provider.findAll((i) => (i.type as unknown) === 'AppShell')).toHaveLength(1);
  });

  it('a stack in a page of the pager is the page in place: the pager’s pages are not fragments', () => {
    const Page = layout(() => Stack());
    const r = mount(createElement(TabPagerContextProbe, null, createElement(Page)));
    expect(hosts(r, 'ExperimentalStack')).toHaveLength(0);
    expect(only(r, 'Slot')).toBeTruthy();
  });

  it('the tabs are Bloom’s pager', () => {
    const Tabs = layout(() => TabView());
    expect(only(mount(createElement(Tabs)), 'TabPagerLayout')).toBeTruthy();
  });
});

describe('screen() on Android', () => {
  it('the root’s chrome is Bloom’s Screen and PageHeader; its view is the content', () => {
    const refresh = jest.fn();
    const Notifications = screen(function notifications() {
      return VStack(Text('row'))
        .title('Notifications')
        .titleDisplay('large')
        .toolbar(Button(Icon(Glyph)).label('Settings'))
        .onReselect(refresh);
    });
    const r = mount(createElement(Notifications));
    const s = only(r, 'Screen');
    // Bloom's own default: the screen's viewport scrolls (`auto`) when the body names no kind.
    expect(s.props.scroll).toBeUndefined();
    expect(s.props.reselect.refresh).toBe(refresh);
    const header = only(r, 'PageHeader');
    expect(header.props).toMatchObject({ title: 'Notifications', presentation: 'floating' });
    expect(header.props.titleVariant).toBe('title-1-bold');
    expect(header.props.actions).toBeTruthy();
    expect(hosts(r, 'Text').some((t) => t.props.children === 'row')).toBe(true);
  });

  it('no header, or a header node of the screen’s own', () => {
    const Bare = screen(() => Text('a').header(false));
    expect(only(mount(createElement(Bare)), 'Screen').props.header).toBeUndefined();
    const Own = screen(() => Text('a').header(Header('Own').presentation('bar')));
    expect(only(mount(createElement(Own)), 'PageHeader').props).toMatchObject({
      title: 'Own',
      presentation: 'bar',
    });
    const Custom = screen(() => Text('a').header(Embed(createElement('MyHeader'))));
    const r = mount(createElement(Custom));
    expect(hosts(r, 'MyHeader')).toHaveLength(1);
    expect(hosts(r, 'PageHeader')).toHaveLength(0);
  });

  it('a back of the screen’s own, and the footer over the content following the keyboard', () => {
    const back = jest.fn();
    const Post = screen(() =>
      Text('post')
        .title('Post')
        .onBack(back)
        .footer(Embed(createElement('Composer')), { placement: 'overlay', keyboard: 'follow' }),
    );
    const r = mount(createElement(Post));
    expect(only(r, 'PageHeader').props.onBack).toBe(back);
    const s = only(r, 'Screen');
    expect(s.props).toMatchObject({
      bottomBarPlacement: 'overlay',
      bottomBarKeyboardBehavior: 'follow',
    });
    expect(s.props.bottomBar).toBeTruthy();
  });

  it('the root’s testID names the Screen; a screen takes props; the back’s name and the heading level reach PageHeader', () => {
    const back = jest.fn();
    const Post = screen(function post(props: { id: string }) {
      return VStack(Text(props.id))
        .testID('post-screen')
        .title('Post')
        .onBack(back)
        .backLabel('Back to the feed')
        .headingLevel(2);
    });
    const r = mount(createElement(Post, { id: 'p7' }));
    expect(only(r, 'Screen').props.testID).toBe('post-screen');
    // The content does not carry it too: one host has it, the Screen.
    const named = r.root.findAll(
      (i) => typeof i.type === 'string' && i.props.testID === 'post-screen',
    );
    expect(named.map((i) => i.type)).toEqual(['Screen']);
    expect(only(r, 'PageHeader').props).toMatchObject({
      backLabel: 'Back to the feed',
      headingLevel: 2,
      onBack: back,
    });
    expect(hosts(r, 'Text').some((t) => t.props.children === 'p7')).toBe(true);
  });

  it('the root’s scroll, kind, insets, underlay, floating action and scroll edge reach Screen and PageHeader', () => {
    const Feed = screen(() =>
      ScrollView(Text('row'))
        .title('Feed')
        .scrollEdge('always')
        .screenKind('collection')
        .screenScroll('content')
        .documentScroll()
        .headerPlacement('overlay')
        .underlay(Embed(createElement('Wallpaper')))
        .floatingAction(FAB(Icon(Glyph)).label('New'), { placement: 'center', visibility: 'alone' })
        .contentClearance('2xl')
        .navigationScope('isolated'),
    );
    const r = mount(createElement(Feed));
    const s = only(r, 'Screen');
    expect(s.props).toMatchObject({
      kind: 'collection',
      scroll: 'content',
      documentScroll: true,
      headerPlacement: 'overlay',
      primaryActionPlacement: 'center',
      primaryActionVisibility: 'alone',
      contentClearance: 24,
      navigationScope: 'isolated',
    });
    expect(s.props.underlay).toBeTruthy();
    expect(s.props.primaryAction).toBeTruthy();
    expect(only(r, 'PageHeader').props.scrim).toBe('always');
    expect(hosts(r, 'ScreenScrollView')).toHaveLength(1);
  });

  it('the root’s colour, activity and starting chrome heights reach Screen', () => {
    const Tinted = screen(() =>
      Text('a')
        .colorPreset('rose')
        .seed('#8e5137')
        .screenActive(false)
        .initialHeaderHeight('64')
        .initialFooterHeight('96'),
    );
    expect(only(mount(createElement(Tinted)), 'Screen').props).toMatchObject({
      colorPreset: 'rose',
      seed: '#8e5137',
      active: false,
      headerHeight: 64,
      bottomBarHeight: 96,
    });
    // What the chain leaves out stays Bloom's default.
    const plain = only(mount(createElement(screen(() => Text('a')))), 'Screen').props;
    for (const name of ['colorPreset', 'seed', 'active', 'headerHeight', 'bottomBarHeight'])
      expect(plain[name]).toBeUndefined();
  });

  it('a ScrollView is Bloom’s ScreenScrollView: its margins, gap, indicators, keyboard and end', () => {
    const more = jest.fn();
    const Feed = screen(() =>
      ScrollView(Text('a'), Text('b'))
        .contentMargins('horizontal', 'lg')
        .contentMargins('top', 'sm')
        .spacing('md')
        .scrollIndicators('hidden')
        .scrollDismissesKeyboard('interactively')
        .keyboardTaps('handled')
        .onEndReached(more, 3),
    );
    const scroll = only(mount(createElement(Feed)), 'ScreenScrollView');
    expect(scroll.props).toMatchObject({
      contentContainerStyle: { paddingHorizontal: 16, paddingTop: 8, gap: 12 },
      showsVerticalScrollIndicator: false,
      showsHorizontalScrollIndicator: false,
      keyboardDismissMode: 'interactive',
      keyboardShouldPersistTaps: 'handled',
      onEndReached: more,
      onEndReachedThreshold: 3,
    });
    // Nothing the chain leaves out reaches it, so Bloom's own defaults hold.
    expect(
      Object.keys(only(mount(createElement(screen(() => ScrollView()))), 'ScreenScrollView').props),
    ).toEqual(['children']);
  });

  it('pull to refresh shows until what the action returns settles', async () => {
    let settle!: () => void;
    const refresh = jest.fn(() => new Promise<void>((resolve) => (settle = resolve)));
    const r = mount(createElement(screen(() => ScrollView(Text('a')).refreshable(refresh))));
    const control = () => only(r, 'ScreenScrollView').props.refreshControl;
    expect(control().props.refreshing).toBe(false);
    act(() => control().props.onRefresh());
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(control().props.refreshing).toBe(true);
    await act(async () => settle());
    expect(control().props.refreshing).toBe(false);
  });

  it('a sheet is Bloom’s Dialog: built while open, kept while it closes', () => {
    const built = jest.fn(() => Text('filters'));
    const dismiss = jest.fn();
    const saved = (open: boolean) =>
      screen(() => Text('a').sheet(open, built, { onDismiss: dismiss, title: 'Filters' }));
    const closed = mount(createElement(saved(false)));
    expect(built).not.toHaveBeenCalled();
    expect(only(closed, 'Dialog').props).toMatchObject({ open: false, title: 'Filters' });
    expect(only(closed, 'Dialog').props.placement).toEqual({ base: 'bottom', md: 'center' });
    const r = mount(createElement(saved(true)));
    expect(built).toHaveBeenCalledTimes(1);
    expect(only(r, 'Dialog').props.onClose).toBe(dismiss);
    expect(hosts(r, 'Text').some((t) => t.props.children === 'filters')).toBe(true);
  });

  it('a BottomSheet content is Bloom’s BottomSheet with its options, held open by open', () => {
    const dismiss = jest.fn();
    const attempt = () => false;
    const sheetOf = (open: boolean) =>
      Text('a').sheet(
        open,
        () =>
          BottomSheet(Text('filters'))
            .detached()
            .dragIndicator('hidden')
            .material('flat')
            .scrollable(false)
            .sizing('fill')
            .interactiveDismissDisabled()
            .onDismissAttempt(attempt)
            .manualActivation()
            .footer(Text('apply'), { behavior: 'viewport' })
            .label('Filters'),
        { onDismiss: dismiss },
      );
    let setOpen!: (open: boolean) => void;
    const Filters = screen(function filters() {
      const [open, set] = useState(true);
      setOpen = set;
      return sheetOf(open);
    });
    const r = mount(createElement(Filters));
    const sheet = only(r, 'BottomSheet');
    expect(hosts(r, 'Dialog')).toHaveLength(0);
    expect(sheet.props).toMatchObject({
      open: true,
      detached: true,
      showHandle: false,
      material: 'flat',
      scrollable: false,
      sizing: 'fill',
      enablePanDownToClose: false,
      onDismissAttempt: attempt,
      manualActivation: true,
      footerBehavior: 'viewport',
      accessibilityLabel: 'Filters',
    });
    expect(hosts(r, 'Text').map((t) => t.props.children)).toEqual(['a', 'filters', 'apply']);
    // A close the sheet made itself, while the host still says open, tells the host.
    act(() => sheet.props.onDismiss());
    expect(dismiss).toHaveBeenCalledTimes(1);
    // The host closes it: the sheet keeps its content while it leaves, and its own close is not news.
    act(() => setOpen(false));
    expect(only(r, 'BottomSheet').props.open).toBe(false);
    expect(hosts(r, 'Text').some((t) => t.props.children === 'filters')).toBe(true);
    act(() => only(r, 'BottomSheet').props.onDismiss());
    expect(dismiss).toHaveBeenCalledTimes(1);
  });

  it('a BottomSheet with no options hands Bloom none, so its defaults hold', () => {
    const r = mount(
      createElement(screen(() => Text('a').sheet(true, () => BottomSheet(Text('b'))))),
    );
    const props = only(r, 'BottomSheet').props;
    for (const name of [
      'detached',
      'showHandle',
      'material',
      'scrollable',
      'sizing',
      'enablePanDownToClose',
      'manualActivation',
      'footer',
    ])
      expect(props[name]).toBeUndefined();
  });

  it('a sidebar row’s navigate() goes through the screen’s navigator', () => {
    const Nav = screen(() =>
      Sidebar(NavItem('Post', Glyph).onPress(navigate('/p/[id]', { id: '7' }))).header(false),
    );
    const r = mount(createElement(Nav));
    only(r, 'Sidebar').props.items[0].onPress();
    expect(router.push).toHaveBeenCalledWith({ pathname: '/p/[id]', params: { id: '7' } });
    expect(only(r, 'Sidebar').props.header).toBe(false);
  });

  it('navigate() pushes through the screen’s navigator', () => {
    const Feed = screen(() => Text('open').onPress(navigate('/p/[id]', { id: '7' })));
    const r = mount(createElement(Feed));
    const text = hosts(r, 'Text').find((t) => typeof t.props.onPress === 'function');
    act(() => text?.props.onPress());
    expect(router.push).toHaveBeenCalledWith({ pathname: '/p/[id]', params: { id: '7' } });
  });
});
