/**
 * iOS, NOT VERIFIED on a device: the router's contract with expo-router's
 * native Stack, NativeTabs and Stack.Toolbar, against stand-ins of each.
 */
import { createContext, createElement } from 'react';
import { RiLinkM } from '@oxy.so/bloom/icons/RiLinkM';
import { RiMoreFill } from '@oxy.so/bloom/icons/RiMoreFill';
import { RiNotification3Fill } from '@oxy.so/bloom/icons/RiNotification3Fill';
import { RiNotification3Line } from '@oxy.so/bloom/icons/RiNotification3Line';
import { RiQuillPenLine } from '@oxy.so/bloom/icons/RiQuillPenLine';
import { RiSearchLine } from '@oxy.so/bloom/icons/RiSearchLine';

import { act, Glyph, hosts, mount, only, quietRenderer } from './support/mount';
import { pager } from './support/bloom-router';
import { actions, Button, Icon, Item, Menu, Section, Text } from '../primitives';
import { AppLayout, layout, screen, Sheet, Stack, TabView } from '../router';

/** The screen's navigator, as expo-router's fork provides it. */
const mockNavigation = createContext<{ getState: () => { type: string } } | undefined>(undefined);

jest.mock('expo-router', () => {
  const { createElement: make } = jest.requireActual<typeof import('react')>('react');
  const named = (name: string) => (props: { children?: unknown }) =>
    make(name, props, props.children as never);
  const Stack = Object.assign(named('NativeStack'), {
    Screen: 'StackScreen',
    Toolbar: Object.assign(named('Toolbar'), {
      Button: named('ToolbarButton'),
      Menu: named('ToolbarMenu'),
      MenuAction: named('ToolbarMenuAction'),
      View: named('ToolbarView'),
    }),
  });
  return { Stack };
});
jest.mock('expo-router/react-navigation', () => ({ NavigationContext: mockNavigation }));
jest.mock('expo-router/native-tabs', () => {
  const { createElement: make } = jest.requireActual<typeof import('react')>('react');
  const named = (name: string) => (props: { children?: unknown }) =>
    make(name, props, props.children as never);
  const Trigger = Object.assign(named('TabTrigger'), {
    Label: named('TabLabel'),
    Icon: 'TabIcon',
    Badge: named('TabBadge'),
  });
  return { NativeTabs: Object.assign(named('NativeTabs'), { Trigger }) };
});

quietRenderer();

beforeEach(() => {
  pager.pages = [
    { name: 'camera', href: '/camera' },
    { name: 'index', href: '/', label: 'Home', icon: RiSearchLine, bar: true },
    {
      name: 'notifications',
      href: '/notifications',
      label: 'Alerts',
      icon: RiNotification3Line,
      activeIcon: RiNotification3Fill,
      badge: 3,
      bar: true,
    },
    { name: 'you', href: '/you', label: 'Profile', icon: Glyph, bar: true },
    { name: 'write', href: '/write' },
  ];
});

function inStack(type: string, element: ReturnType<typeof createElement>) {
  return createElement(mockNavigation.Provider, { value: { getState: () => ({ type }) } }, element);
}

describe('the tabs are the system tab bar', () => {
  const App = layout(function app() {
    return AppLayout(TabView()).primaryAction(RiQuillPenLine, 'Compose', 'write');
  });

  it('bar pages are tabs, with their SF Symbols; the primary destination is the prominent tab', () => {
    const r = mount(createElement(App));
    const triggers = hosts(r, 'TabTrigger');
    expect(triggers.map((t) => [t.props.name, t.props.hidden, t.props.prominent])).toEqual([
      ['camera', true, false],
      ['index', false, false],
      ['notifications', false, false],
      ['you', false, false],
      ['write', false, true],
    ]);
    const icons = hosts(r, 'TabIcon').map((icon) => icon.props.sf);
    expect(icons).toEqual([
      'magnifyingglass',
      { default: 'bell', selected: 'bell.fill' },
      'square.and.pencil',
    ]);
    expect(only(r, 'TabBadge').props.children).toBe('3');
    expect(hosts(r, 'TabLabel').map((label) => label.props.children)).toContain('Compose');
  });

  it('the shell draws no bar of its own', () => {
    const r = mount(createElement(App));
    expect(only(r, 'AppShell').props.bottomBar).toBeNull();
    expect(hosts(r, 'BottomBar')).toHaveLength(0);
  });
});

describe('stacks are the native stack', () => {
  it('a Sheet is the system page sheet; every screen starts without a bar', () => {
    const Root = layout(() => Stack('(tabs)', Sheet('compose')));
    const r = mount(createElement(Root));
    expect(only(r, 'NativeStack').props.screenOptions).toEqual({ headerShown: false });
    expect(hosts(r, 'StackScreen').map((s) => [s.props.name, s.props.options])).toEqual([
      ['(tabs)', undefined],
      ['compose', { presentation: 'modal' }],
    ]);
  });
});

describe('a screen’s header is the system navigation bar', () => {
  const copy = jest.fn();
  const PostActions = actions(function postActions() {
    return { copy };
  });
  const Notifications = screen(function notifications() {
    return Text('rows')
      .title('Notifications')
      .titleDisplay('large')
      .toolbar(
        Button(Icon(RiSearchLine)).label('Search'),
        Button(Icon(Glyph)).label('Custom'),
        Menu(
          Button(Icon(RiMoreFill)).label('More'),
          Item('Copy link').icon(RiLinkM).tag('copy'),
          Section(Item('Mute').icon(Glyph)),
        ).actions(PostActions()),
      );
  });

  it('in a native stack: the screen’s options and its toolbar, no PageHeader in the page', () => {
    const r = mount(inStack('stack', createElement(Notifications)));
    expect(hosts(r, 'PageHeader')).toHaveLength(0);
    expect(only(r, 'Screen').props.header).toBeUndefined();
    expect(only(r, 'StackScreen').props.options).toMatchObject({
      headerShown: true,
      title: 'Notifications',
      headerLargeTitle: true,
      headerTransparent: true,
    });
    expect(only(r, 'Toolbar').props.placement).toBe('right');
    expect(only(r, 'ToolbarButton').props).toMatchObject({
      icon: 'magnifyingglass',
      accessibilityLabel: 'Search',
    });
    // A glyph without an SF Symbol keeps Bloom's own button, in the bar.
    expect(hosts(r, 'ToolbarView')).toHaveLength(1);
    const menu = hosts(r, 'ToolbarMenu').find((m) => m.props.icon === 'ellipsis');
    expect(menu?.props.accessibilityLabel).toBe('More');
    const rows = hosts(r, 'ToolbarMenuAction');
    expect(rows.map((row) => [row.props.children, row.props.icon])).toEqual([
      ['Copy link', 'link'],
      ['Mute', undefined],
    ]);
    act(() => rows[0]?.props.onPress());
    expect(copy).toHaveBeenCalledTimes(1);
  });

  it('outside a native stack (a tab page without its own stack): Bloom’s PageHeader in the page', () => {
    const r = mount(inStack('tab', createElement(Notifications)));
    expect(hosts(r, 'StackScreen')).toHaveLength(0);
    expect(only(r, 'PageHeader').props.title).toBe('Notifications');
  });
});
