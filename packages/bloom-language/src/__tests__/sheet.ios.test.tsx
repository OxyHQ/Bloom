/**
 * iOS, NOT VERIFIED on a device: a `.sheet()` is the system sheet through
 * `@expo/ui`'s BottomSheet, its content a React view inside it, a
 * `BottomSheet` node's options the presentation's.
 */
import { createContext, createElement, useState, type ReactNode } from 'react';

import { act, hosts, mount, only, quietRenderer } from './support/mount';
import { BottomSheet, Text } from '../primitives';
import { screen } from '../router';

function host(name: string) {
  return (props: { children?: ReactNode }) => createElement(name, props, props.children);
}

const mockNavigation = createContext<{ getState: () => { type: string } } | undefined>(undefined);
jest.mock('expo-router', () => ({ Stack: { Screen: 'StackScreen' } }));
jest.mock('expo-router/react-navigation', () => ({ NavigationContext: mockNavigation }));
jest.mock('expo-router/native-tabs', () => ({ NativeTabs: 'NativeTabs' }));
jest.mock('@expo/ui/swift-ui', () => ({
  Host: host('Host'),
  BottomSheet: host('SwiftBottomSheet'),
  Group: host('SwiftGroup'),
  RNHostView: host('RNHostView'),
}));
jest.mock('@expo/ui/swift-ui/modifiers', () => ({
  presentationDetents: (detents: unknown) => ({ detents }),
  presentationDragIndicator: (visibility: string) => ({ indicator: visibility }),
  interactiveDismissDisabled: (value = true) => ({ dismissDisabled: value }),
  accessibilityLabel: (label: string) => ({ label }),
}));

quietRenderer();

describe('a sheet on iOS is the system sheet', () => {
  it('a plain sheet fits its content, named by its title; the reader’s swipe tells the host', () => {
    const dismiss = jest.fn();
    let setOpen!: (open: boolean) => void;
    const Saved = screen(function saved() {
      const [open, set] = useState(true);
      setOpen = set;
      return Text('a').sheet(open, () => Text('filters'), { onDismiss: dismiss, title: 'Filters' });
    });
    const r = mount(createElement(Saved));
    const sheet = only(r, 'SwiftBottomSheet');
    expect(sheet.props).toMatchObject({ isPresented: true, fitToContents: true });
    expect(only(r, 'SwiftGroup').props.modifiers).toEqual([{ label: 'Filters' }]);
    expect(hosts(r, 'Dialog')).toHaveLength(0);
    const inside = only(r, 'RNHostView');
    expect(inside.findAll((i) => (i.type as unknown) === 'Text').map((t) => t.props.children)).toEqual([
      'filters',
    ]);
    act(() => sheet.props.onIsPresentedChange(false));
    expect(dismiss).toHaveBeenCalledTimes(1);
    // The host's own close is not news.
    act(() => setOpen(false));
    expect(only(r, 'SwiftBottomSheet').props.isPresented).toBe(false);
    act(() => only(r, 'SwiftBottomSheet').props.onIsPresentedChange(false));
    expect(dismiss).toHaveBeenCalledTimes(1);
  });

  it('a BottomSheet’s options are the presentation’s; its footer follows its body', () => {
    const Sheet = screen(() =>
      Text('a').sheet(true, () =>
        BottomSheet(Text('list'))
          .sizing('fill')
          .dragIndicator('visible')
          .interactiveDismissDisabled()
          .footer(Text('apply')),
      ),
    );
    const r = mount(createElement(Sheet));
    expect(only(r, 'SwiftBottomSheet').props.fitToContents).toBe(false);
    expect(only(r, 'SwiftGroup').props.modifiers).toEqual([
      { indicator: 'visible' },
      { dismissDisabled: true },
      { detents: ['large'] },
    ]);
    const inside = only(r, 'RNHostView');
    expect(inside.findAll((i) => (i.type as unknown) === 'Text').map((t) => t.props.children)).toEqual([
      'list',
      'apply',
    ]);
    expect(hosts(r, 'BottomSheet')).toHaveLength(0);
  });
});
