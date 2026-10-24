/**
 * The NATIVE portal carries the React context of the place `<Portal>` is
 * written, not the outlet's.
 *
 * Measured on Allo's Android release (Bloom 15.48.0): Settings → Account
 * crashed with `AlloSettingsProvider is missing`, because the settings modal
 * renders through this portal and its page read an app provider that sat
 * between the app-root outlet and the modal. The outlet bridged Bloom's theme
 * and nothing else. Web was fine: `createPortal` keeps the context.
 *
 * Every case puts the app provider AROUND the portal and the outlet OUTSIDE it,
 * which is the shape of every app root.
 */
import type React from 'react';
import { createContext, Profiler, useContext, useState } from 'react';
import * as ReactNative from 'react-native';
import { Pressable, Text } from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { Portal, PortalOutlet, PortalProvider } from '../portal';
import { excludeFromPortalBridge } from '../portal/context-bridge';
import { BlurTargetProvider, BlurWindow, useWindowedBlurTarget } from '../blur/blur-target';
import { RiSettings6Line } from '../icons/remix';
import { SettingsModal } from '../settings-modal';
import { Dialog } from '../dialog/Dialog';
import { useDialogControl } from '../dialog/context';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '../dropdown-menu/DropdownMenu';
import { findHost } from './support/rendered-style';

// The settings modal's NATIVE portal (Metro picks `modal-portal.native.tsx`;
// jest resolves no platform extensions, so name it).
jest.mock('../settings-modal/modal-portal', () => ({
  ModalPortal: jest.requireActual('../portal').Portal,
}));

const AppContext = createContext<string | null>(null);
AppContext.displayName = 'AppContext';

/** What an app hook does: throw when its provider is not above it. */
function useApp(): string {
  const value = useContext(AppContext);
  if (value === null) throw new Error('AppProvider is missing');
  return value;
}

function AppProbe({ testID = 'probe' }: { testID?: string }) {
  return <Text testID={testID}>{useApp()}</Text>;
}

function Root({ children }: { children: React.ReactNode }) {
  return (
    <BloomThemeProvider mode="light" colorPreset="teal">
      <PortalProvider>
        {children}
        <ReactNative.View testID="outlet">
          <PortalOutlet />
        </ReactNative.View>
      </PortalProvider>
    </BloomThemeProvider>
  );
}

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('native Portal context', () => {
  it('renders at the outlet with an app context provided between the outlet and the portal', () => {
    const screen = render(
      <Root>
        <AppContext.Provider value="from the app">
          <Portal>
            <AppProbe />
          </Portal>
        </AppContext.Provider>
      </Root>,
    );
    const outlet = findHost(screen.toJSON(), 'outlet');
    expect(findHost(outlet?.children, 'probe')).not.toBeNull();
    expect(screen.getByTestId('probe').props.children).toBe('from the app');
  });

  it('follows a new value of that context', () => {
    function Harness() {
      const [value, setValue] = useState('first');
      return (
        <AppContext.Provider value={value}>
          <Pressable testID="change" onPress={() => setValue('second')} />
          <Portal>
            <AppProbe />
          </Portal>
        </AppContext.Provider>
      );
    }
    const screen = render(
      <Root>
        <Harness />
      </Root>,
    );
    expect(screen.getByTestId('probe').props.children).toBe('first');
    fireEvent.press(screen.getByTestId('change'));
    expect(screen.getByTestId('probe').props.children).toBe('second');
  });

  it('gives the nearest provider, as in place', () => {
    const screen = render(
      <Root>
        <AppContext.Provider value="outer">
          <AppContext.Provider value="inner">
            <Portal>
              <AppProbe />
            </Portal>
          </AppContext.Provider>
        </AppContext.Provider>
      </Root>,
    );
    expect(screen.getByTestId('probe').props.children).toBe('inner');
  });

  it('keeps an excluded context at the outlet’s value', () => {
    const Position = createContext('outlet');
    excludeFromPortalBridge(Position);
    function PositionProbe() {
      return <Text testID="position">{useContext(Position)}</Text>;
    }
    const screen = render(
      <Root>
        <Position.Provider value="in place">
          <Portal>
            <PositionProbe />
          </Portal>
        </Position.Provider>
      </Root>,
    );
    expect(screen.getByTestId('position').props.children).toBe('outlet');
  });

  it('never carries a Modal window’s blur target into the root window', () => {
    jest.replaceProperty(ReactNative.Platform, 'OS', 'android');
    const seen: Record<string, boolean> = {};
    function BlurProbe({ name }: { name: string }) {
      seen[name] = useWindowedBlurTarget() !== undefined;
      return null;
    }
    const screen = render(
      <Root>
        <BlurTargetProvider>
          <BlurWindow>
            <BlurProbe name="inPlace" />
            <Portal>
              <BlurProbe name="portaled" />
            </Portal>
          </BlurWindow>
        </BlurTargetProvider>
      </Root>,
    );
    // Attach the target the way a layout pass would.
    act(() => {
      const target = screen.UNSAFE_root.findAll(
        (node) => typeof node.props.onLayout === 'function' && (node.type as unknown) !== 'View',
      )[0];
      target?.props.onLayout({ nativeEvent: { layout: { x: 0, y: 0, width: 1, height: 1 } } });
    });
    expect(seen.inPlace).toBe(true);
    expect(seen.portaled).toBe(false);
  });

  it('keeps mount order when an earlier portal updates', () => {
    // Hoisted: only the FIRST portal's content changes on the press.
    const second = <Text testID="second">b</Text>;
    function Harness() {
      const [label, setLabel] = useState('a1');
      return (
        <>
          <Pressable testID="change" onPress={() => setLabel('a2')} />
          <Portal>
            <Text testID="first">{label}</Text>
          </Portal>
          <Portal>{second}</Portal>
        </>
      );
    }
    const screen = render(
      <Root>
        <Harness />
      </Root>,
    );
    const order = () =>
      screen
        .getByTestId('outlet')
        .findAll((node) => node.props.testID === 'first' || node.props.testID === 'second')
        .filter((node) => typeof node.type === 'string')
        .map((node) => node.props.testID);
    expect(order()).toEqual(['first', 'second']);
    fireEvent.press(screen.getByTestId('change'));
    expect(screen.getByTestId('first').props.children).toBe('a2');
    expect(order()).toEqual(['first', 'second']);
  });

  it('settles: an append does not re-render the outlet again and again', () => {
    let commits = 0;
    function Harness() {
      const [count, setCount] = useState(0);
      return (
        <AppContext.Provider value={`v${count}`}>
          <Pressable testID="change" onPress={() => setCount((value) => value + 1)} />
          <Portal>
            <AppProbe />
          </Portal>
          <Portal>
            <Text>second</Text>
          </Portal>
        </AppContext.Provider>
      );
    }
    const screen = render(
      <BloomThemeProvider mode="light" colorPreset="teal">
        <PortalProvider>
          <Harness />
          <Profiler id="outlet" onRender={() => commits++}>
            <PortalOutlet />
          </Profiler>
        </PortalProvider>
      </BloomThemeProvider>,
    );
    const afterMount = commits;
    fireEvent.press(screen.getByTestId('change'));
    expect(screen.getByTestId('probe').props.children).toBe('v1');
    // One provider change: the portal reading it re-registers once.
    expect(commits - afterMount).toBeLessThanOrEqual(2);
  });
});

describe('surfaces see the app context on native', () => {
  const GROUPS = [
    {
      label: 'Settings',
      items: [{ key: 'account', label: 'Account', icon: RiSettings6Line, page: 'account' }],
    },
  ];

  it('SettingsModal: a page reading an app provider that wraps the modal', () => {
    jest.useFakeTimers();
    const screen = render(
      <Root>
        <AppContext.Provider value="settings value">
          <SettingsModal
            open
            onClose={() => {}}
            groups={GROUPS}
            pages={{ account: { title: 'Account', content: <AppProbe /> } }}
            initialView="page"
          />
        </AppContext.Provider>
      </Root>,
    );
    act(() => {
      jest.advanceTimersByTime(400);
    });
    const outlet = findHost(screen.toJSON(), 'outlet');
    expect(findHost(outlet?.children, 'probe')).not.toBeNull();
    expect(screen.getByTestId('probe').props.children).toBe('settings value');
  });

  it('Dialog: content reading an app provider that wraps the dialog', () => {
    function Harness() {
      const control = useDialogControl();
      return (
        <>
          <Pressable testID="open" onPress={() => control.open()} />
          <Dialog control={control} label="Dialog">
            <AppProbe />
          </Dialog>
        </>
      );
    }
    const screen = render(
      <Root>
        <AppContext.Provider value="dialog value">
          <Harness />
        </AppContext.Provider>
      </Root>,
    );
    fireEvent.press(screen.getByTestId('open'));
    expect(screen.getByTestId('probe').props.children).toBe('dialog value');
  });

  it('DropdownMenu: content reading an app provider that wraps the menu', () => {
    const screen = render(
      <Root>
        <AppContext.Provider value="menu value">
          <DropdownMenu defaultOpen>
            <DropdownMenuTrigger asChild>
              <Pressable testID="trigger" />
            </DropdownMenuTrigger>
            <DropdownMenuContent label="Menu">
              <AppProbe />
            </DropdownMenuContent>
          </DropdownMenu>
        </AppContext.Provider>
      </Root>,
    );
    expect(screen.getByTestId('probe').props.children).toBe('menu value');
  });
});
