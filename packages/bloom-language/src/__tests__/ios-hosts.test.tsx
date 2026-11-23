/**
 * iOS, NOT VERIFIED on a device: the contract with expo-glass-effect, @expo/ui
 * and expo-router, against stand-ins of each.
 */
import { createContext, createElement, type ReactNode } from 'react';

import { DARK, LIGHT, withAlpha } from './support/bloom-theme';
import { act, Glyph, hosts, mount, only, quietRenderer } from './support/mount';
import { Button, Header, HStack, Icon, Item, Menu, menu, Section, Text } from '../primitives';
import { clear, regular } from '../glass';
import { GlassGroup } from '../controls/glass-group';
import { ToolbarGroup, ToolbarSpacer } from '../controls/toolbar-group';
import { ConfirmationDialog } from '../controls/confirmation-dialog';
import { resolveSpace } from '../tokens';
import { useNamespace } from '../motion/namespace';
import { RiDeleteBinLine } from '@oxy.so/bloom/icons/RiDeleteBinLine';
import { RiLinkM } from '@oxy.so/bloom/icons/RiLinkM';
import { toElement } from '../render';

const host = (name: string) => (props: { children?: ReactNode }) =>
  createElement(name, props, props.children);
jest.mock('expo-glass-effect', () => ({
  GlassView: 'GlassView',
  GlassContainer: 'GlassContainer',
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
  ConfirmationDialog: Object.assign(host('SwiftConfirmationDialog'), {
    Trigger: host('SwiftConfirmationTrigger'),
    Actions: host('SwiftConfirmationActions'),
    Message: host('SwiftConfirmationMessage'),
  }),
  Text: host('SwiftText'),
  GlassEffectContainer: host('SwiftGlassEffectContainer'),
  Namespace: host('SwiftNamespace'),
  HStack: host('SwiftHStack'),
  VStack: host('SwiftVStack'),
}));
jest.mock('@expo/ui/swift-ui/modifiers', () => ({
  disabled: (value?: boolean) => ({ disabled: value }),
  menuActionDismissBehavior: (value: string) => ({ dismiss: value }),
  glassEffect: (options: object) => ({ glassEffect: options }),
  glassEffectId: (id: string, namespace: string) => ({ glassEffectId: [id, namespace] }),
  labelStyle: (style: string) => ({ labelStyle: style }),
  animation: (animation: unknown, value: unknown) => ({ animation, value }),
  Animation: { spring: () => 'spring' },
}));
jest.mock('expo-router', () => ({
  Stack: {
    Screen: 'StackScreen',
    Toolbar: Object.assign(host('Toolbar'), {
      Button: host('ToolbarButton'),
      Menu: host('ToolbarMenu'),
      MenuAction: host('ToolbarMenuAction'),
      View: host('ToolbarView'),
      Spacer: 'ToolbarSpacer',
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

  it('a glass’s fill and corner vary as its tintColor and radius, its frame as its style', () => {
    const r = mount(
      toElement(
        HStack(Text('a'))
          .onPress(() => {})
          .glass()
          .corner('lg')
          .when('pressed', (v) => v.background('primary/40').corner('xl').frame({ width: '4xl' })),
      ),
    );
    const glass = () => only(r, 'GlassView');
    expect(glass().props.tintColor).toBeUndefined();
    expect(glass().props.style).toEqual([undefined, { borderRadius: 16 }]);
    act(() => only(r, 'Pressable').props.onPressIn());
    expect(glass().props.tintColor).toBe(withAlpha(LIGHT.primary as string, 0.4));
    expect(glass().props.style).toEqual([{ width: 40 }, { borderRadius: 20 }]);
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

  it('in the page, stays Bloom’s PageHeader in a native stack: no system bar', () => {
    const r = mount(toElement(Header('Home').inPage().titleAlign('center').safeArea(false)));
    expect(hosts(r, 'StackScreen')).toHaveLength(0);
    expect(only(r, 'PageHeader').props).toMatchObject({
      title: 'Home',
      titleAlign: 'center',
      safeArea: false,
    });
  });
});

describe('glass groups and glass styles on iOS', () => {
  it('a glass group is UIKit’s glass container, its spacing the blend', () => {
    const r = mount(
      toElement(
        GlassGroup(HStack(HStack(Text('a')).glass(), HStack(Text('b')).glass())).blend('xl'),
      ),
    );
    expect(only(r, 'GlassContainer').props.spacing).toBe(resolveSpace('xl'));
    expect(hosts(r, 'GlassView')).toHaveLength(2);
  });

  it('a glass that says it is not interactive is not, even under a control', () => {
    const r = mount(
      toElement(Button(Icon(Glyph)).shape('circle').label('Add').glass(regular.interactive(false))),
    );
    expect(only(r, 'GlassView').props.isInteractive).toBe(false);
  });

  it('a prominent glass button in the system bar is the bar’s prominent item', () => {
    const r = mount(
      toElement(Header('Edit').toolbar(Button(Text('Done')).style('glassProminent'))),
    );
    expect(only(r, 'ToolbarButton').props.variant).toBe('prominent');
  });
});

describe('a confirmation dialog is SwiftUI’s', () => {
  it('presented from the view, its rows SwiftUI buttons, its message under the title', () => {
    const remove = jest.fn();
    const setOpen = jest.fn();
    const r = mount(
      toElement(
        Button(Text('Delete')).confirmationDialog(
          [true, setOpen],
          ConfirmationDialog('Delete this post?', Item('Delete').destructive().onPress(remove))
            .message('It cannot be undone.')
            .titleVisibility('visible'),
        ),
      ),
    );
    expect(only(r, 'SwiftConfirmationDialog').props).toMatchObject({
      title: 'Delete this post?',
      isPresented: true,
      titleVisibility: 'visible',
    });
    expect(only(r, 'SwiftButton').props).toMatchObject({ label: 'Delete', role: 'destructive' });
    expect(hosts(r, 'SwiftText')).toHaveLength(1);
    expect(hosts(r, 'RNHostView')).toHaveLength(1);
  });
});

describe('toolbar groups in the system bar', () => {
  it('a group’s items sit side by side, and a spacer separates groups', () => {
    const r = mount(
      toElement(
        Header('Edit').toolbar(
          ToolbarGroup(Button(Text('Bold')), Button(Text('Italic'))),
          ToolbarSpacer('fixed'),
          Button(Text('Done')).style('glassProminent'),
        ),
      ),
    );
    expect(hosts(r, 'ToolbarButton')).toHaveLength(3);
    expect(only(r, 'ToolbarSpacer').props.width).toBe(resolveSpace('sm'));
  });
});

describe('a group of glass icon buttons is SwiftUI’s own glass', () => {
  function Tools({ erasing }: { erasing: boolean }) {
    const ns = useNamespace();
    return toElement(
      GlassGroup(
        HStack(
          Button(Icon(RiLinkM)).label('Link').glass().glassID('link', ns),
          erasing
            ? Button(Icon(RiDeleteBinLine)).label('Erase').glass().glassID('erase', ns)
            : null,
        ).spacing('xl'),
      ).blend('xl'),
    );
  }

  it('each button has glassEffect and its glassEffectId in the group’s namespace', () => {
    const r = mount(createElement(Tools, { erasing: true }));
    expect(only(r, 'SwiftGlassEffectContainer').props.spacing).toBe(resolveSpace('xl'));
    const namespace = only(r, 'SwiftNamespace').props.id;
    const buttons = hosts(r, 'SwiftButton');
    expect(buttons.map((button) => button.props.label)).toEqual(['Link', 'Erase']);
    expect(buttons[1]?.props.modifiers).toContainEqual({ glassEffectId: ['erase', namespace] });
    expect(hosts(r, 'GlassContainer')).toHaveLength(0);
  });

  it('a group of anything else is UIKit’s container around Bloom’s views', () => {
    const r = mount(
      toElement(GlassGroup(HStack(HStack(Text('a')).glass(), HStack(Text('b')).glass()))),
    );
    expect(hosts(r, 'SwiftGlassEffectContainer')).toHaveLength(0);
    expect(hosts(r, 'GlassContainer')).toHaveLength(1);
  });
});
