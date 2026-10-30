/**
 * `useWindowKeys` (OxyOS ADR 0027): an application's own keys from the
 * window's key source, after a menu's shortcuts, never while a text field or a
 * menu has the keys unless the field's owner asks; and `isCommandKey`, the
 * platform's command modifier.
 */
import { useState } from 'react';
import * as ReactNative from 'react-native';
import { Platform, TextInput, View } from 'react-native';
import { act, render } from '@testing-library/react-native';

import { isCommandKey, useWindowKeys } from '../kbd';
import { Menubar, MenubarContent, MenubarItem, MenubarMenu, MenubarTrigger } from '../menubar';
import { PlatformSurfaceProvider } from '../platform-surface/context';
import { PortalOutlet, PortalProvider } from '../portal';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { fakeKeyboard, menuBarAdapter } from './support/fake-menu-bar';

function Probe({
  log,
  whileTyping,
  enabled,
}: {
  log: string[];
  whileTyping?: boolean;
  enabled?: boolean;
}) {
  useWindowKeys(
    (event) => {
      if (event.key === 'x') return false;
      log.push(event.key);
      return true;
    },
    { whileTyping, enabled },
  );
  return null;
}

const originalOS = ReactNative.Platform.OS;
const originalState = (ReactNative.TextInput as { State?: unknown }).State;
beforeEach(() => {
  ReactNative.Platform.OS = 'android';
});
afterEach(() => {
  ReactNative.Platform.OS = originalOS;
  (ReactNative.TextInput as { State?: unknown }).State = originalState;
});

/** Lets the menus' registry settle (a microtask), as a commit does. */
const settle = () => act(async () => undefined);

function press(
  keyboard: ReturnType<typeof fakeKeyboard>,
  event: Parameters<ReturnType<typeof fakeKeyboard>['press']>[0],
) {
  let taken = false;
  act(() => {
    taken = keyboard.press(event);
  });
  return taken;
}

function app(ui: React.ReactElement, keyboard = fakeKeyboard()) {
  const screen = render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      <PlatformSurfaceProvider value={menuBarAdapter(undefined, keyboard)}>
        <PortalProvider>
          {ui}
          <PortalOutlet />
        </PortalProvider>
      </PlatformSurfaceProvider>
    </BloomThemeProvider>,
  );
  return { screen, keyboard };
}

it("hears the window's keys and takes those its handler takes", () => {
  const log: string[] = [];
  const { keyboard } = app(<Probe log={log} />);
  expect(press(keyboard, { key: 'ArrowDown' })).toBe(true);
  expect(press(keyboard, { key: 'Enter' })).toBe(true);
  // What it does not take goes on to the focused view.
  expect(press(keyboard, { key: 'x' })).toBe(false);
  expect(log).toEqual(['ArrowDown', 'Enter']);
});

it('hears nothing when it is not enabled, and nothing once it is gone', () => {
  const log: string[] = [];
  const keyboard = fakeKeyboard();
  const { screen } = app(<Probe log={log} enabled={false} />, keyboard);
  expect(press(keyboard, { key: 'a' })).toBe(false);
  screen.unmount();
  expect(press(keyboard, { key: 'a' })).toBe(false);
  expect(log).toEqual([]);
});

it("comes after a menu's shortcut, which runs its item and goes no further", async () => {
  const log: string[] = [];
  const opened: string[] = [];
  function Window() {
    return (
      <View>
        <Probe log={log} />
        <Menubar>
          <MenubarMenu value="file">
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent>
              <MenubarItem shortcut="Mod+O" onPress={() => opened.push('open')}>
                Open
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      </View>
    );
  }
  const { keyboard } = app(<Window />);
  await settle();
  // The application's hook was added first; the menu's chord is still the menu's.
  expect(press(keyboard, { key: 'o', ctrlKey: true })).toBe(true);
  expect(opened).toEqual(['open']);
  expect(log).toEqual([]);
  expect(press(keyboard, { key: 'o' })).toBe(true);
  expect(log).toEqual(['o']);
});

it("leaves a focused text field its keys, unless the field's owner asks for them", () => {
  const log: string[] = [];
  const typing: string[] = [];
  let focused: object | null = {};
  (ReactNative.TextInput as { State?: unknown }).State = { currentlyFocusedInput: () => focused };
  function Window() {
    const [, setText] = useState('');
    return (
      <View>
        <TextInput onChangeText={setText} />
        <Probe log={log} />
        <Probe log={typing} whileTyping />
      </View>
    );
  }
  const { keyboard } = app(<Window />);
  expect(press(keyboard, { key: 'Escape' })).toBe(true);
  expect(log).toEqual([]);
  expect(typing).toEqual(['Escape']);
  focused = null;
  expect(press(keyboard, { key: 'Escape' })).toBe(true);
  expect(log).toEqual(['Escape']);
});

it("names the command modifier: Ctrl off Apple's platforms, ⌘ on them", () => {
  const os = Platform.OS;
  try {
    Object.defineProperty(Platform, 'OS', { value: 'android', configurable: true });
    expect(isCommandKey({ ctrlKey: true })).toBe(true);
    expect(isCommandKey({ metaKey: true })).toBe(false);
    Object.defineProperty(Platform, 'OS', { value: 'ios', configurable: true });
    expect(isCommandKey({ metaKey: true })).toBe(true);
    expect(isCommandKey({ ctrlKey: true })).toBe(false);
  } finally {
    Object.defineProperty(Platform, 'OS', { value: os, configurable: true });
  }
});
