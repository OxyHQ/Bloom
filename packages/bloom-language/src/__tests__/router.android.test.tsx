/**
 * Android and OxyOS: the router's navigators are Bloom's and expo-router's
 * ExperimentalStack; the shell's bottom bar is the language BottomBar with its
 * FAB. Against stand-ins (support/bloom-router.ts, an ExperimentalStack mock).
 */
import { createElement, type ReactNode } from 'react';

import { act, Glyph, hosts, mount, only, OtherGlyph, quietRenderer } from './support/mount';
import { pager, router } from './support/bloom-router';
import { Button, Embed, FAB, Header, Icon, ScrollView, Text, VStack } from '../primitives';
import { AppLayout, layout, navigate, screen, Sheet, Stack, TabView } from '../router';
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

  it('navigate() pushes through the screen’s navigator', () => {
    const Feed = screen(() => Text('open').onPress(navigate('/p/[id]', { id: '7' })));
    const r = mount(createElement(Feed));
    const text = hosts(r, 'Text').find((t) => typeof t.props.onPress === 'function');
    act(() => text?.props.onPress());
    expect(router.push).toHaveBeenCalledWith({ pathname: '/p/[id]', params: { id: '7' } });
  });
});
