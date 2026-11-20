/**
 * iOS, NOT VERIFIED on a device: the contract with expo-glass-effect, @expo/ui
 * and expo-router, against stand-ins of each.
 */
import { createContext, createElement, type ReactNode } from 'react';

import { DARK, LIGHT } from './support/bloom-theme';
import { act, Glyph, hosts, mount, only, quietRenderer } from './support/mount';
import { Button, Header, HStack, Icon, Item, Menu, menu, Section, Text } from '../primitives';
import { clear } from '../glass';
import { toElement } from '../render';

const host = (name: string) => (props: { children?: ReactNode }) =>
  createElement(name, props, props.children);
jest.mock('expo-glass-effect', () => ({
  GlassView: 'GlassView',
  isLiquidGlassAvailable: () => true,
}));
jest.mock('@expo/ui/swift-ui', () => ({
  Host: host('Host'),
  Menu: (props: { label: ReactNode; children?: ReactNode }) =>
    createElement('SwiftMenu', props, props.label, props.children),
  Button: 'SwiftButton',
  Toggle: 'SwiftToggle',
  Section: host('SwiftSection'),
  Divider: 'SwiftDivider',
  RNHostView: host('RNHostView'),
}));
jest.mock('@expo/ui/swift-ui/modifiers', () => ({
  disabled: (value?: boolean) => ({ disabled: value }),
  menuActionDismissBehavior: (value: string) => ({ dismiss: value }),
}));
jest.mock('expo-router', () => ({
  Stack: {
    Screen: 'StackScreen',
    Toolbar: Object.assign(host('Toolbar'), {
      Button: host('ToolbarButton'),
      Menu: host('ToolbarMenu'),
      MenuAction: host('ToolbarMenuAction'),
      View: host('ToolbarView'),
    }),
  },
}));
/** The screen's navigator: a native stack's. */
const mockNavigation = createContext({ getState: () => ({ type: 'stack' }) });
jest.mock('expo-router/react-navigation', () => ({ NavigationContext: mockNavigation }));

quietRenderer();

describe('glass is Liquid Glass', () => {
  it('the material’s style, the tint at its transparency, interactive under a control', () => {
    const r = mount(
      toElement(Button(Icon(Glyph)).shape('circle').glass(clear.tint('primary', 'medium'))),
      DARK,
    );
    expect(only(r, 'GlassView').props).toMatchObject({
      glassEffectStyle: 'clear',
      isInteractive: true,
      colorScheme: 'dark',
    });
    expect(only(r, 'GlassView').props.tintColor).not.toBe(LIGHT.primary);
    expect(only(r, 'BloomButton').props.material).toBe('shared');
  });

  it('a view on untinted glass is not interactive', () => {
    const r = mount(toElement(HStack(Text('a')).glass()));
    expect(only(r, 'GlassView').props).toMatchObject({
      glassEffectStyle: 'regular',
      isInteractive: false,
    });
  });
});

describe('the menu is the system menu', () => {
  it('the trigger is the React view it opens from; rows are SwiftUI buttons, toggles and sections', () => {
    const pin = jest.fn();
    const r = mount(
      toElement(
        Menu(
          Icon(Glyph),
          Item('Pin').checked(true).onPress(pin),
          Section(Item('Delete').destructive().disabled()).title('Danger'),
        ),
      ),
    );
    expect(only(r, 'RNHostView')).toBeTruthy();
    act(() => only(r, 'SwiftToggle').props.onIsOnChange(false));
    expect(pin).toHaveBeenCalledTimes(1);
    expect(only(r, 'SwiftSection').props.title).toBe('Danger');
    expect(only(r, 'SwiftButton').props).toMatchObject({
      label: 'Delete',
      role: 'destructive',
      modifiers: [{ disabled: true }],
    });
    expect(hosts(r, 'DropdownMenu')).toHaveLength(0);
  });
});

const Rows = menu(function Rows() {
  return Item('Copy');
});

describe('a menu built on open is Bloom’s menu on iOS', () => {
  it('the system menu needs its rows before it opens; a menu() content builds them only while open', () => {
    const r = mount(toElement(Menu(Icon(Glyph), Rows())));
    expect(hosts(r, 'SwiftMenu')).toHaveLength(0);
    expect(hosts(r, 'DropdownMenu')).toHaveLength(1);
  });
});

describe('the header is the navigation bar', () => {
  it('in a native stack, sets its screen’s options and toolbar: the large title, the bar items, the system back', () => {
    const r = mount(
      toElement(
        Header('Home')
          .titleDisplay('large')
          .toolbar(Button(Icon(Glyph))),
      ),
    );
    expect(only(r, 'StackScreen').props.options).toMatchObject({
      headerShown: true,
      title: 'Home',
      headerLargeTitle: true,
      headerBackVisible: true,
    });
    expect(only(r, 'Toolbar').props.placement).toBe('right');
    // A glyph without an SF Symbol keeps Bloom's own button, in the bar.
    expect(only(r, 'ToolbarView')).toBeTruthy();
    expect(hosts(r, 'BloomButton')).toHaveLength(1);
    expect(hosts(r, 'PageHeader')).toHaveLength(0);
  });
});
