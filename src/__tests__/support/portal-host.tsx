import type React from 'react';
import { BackHandler, Platform } from 'react-native';
import { render as rtlRender } from '@testing-library/react-native';

import { PortalOutlet, PortalProvider } from '../../portal';

/**
 * The native host a portaled surface needs to appear: the app root mounts one
 * `PortalProvider` and one `PortalOutlet`, and a native `BottomSheet`/`Dialog`
 * presents through them (as the side drawers always did). A test that renders
 * a sheet wraps its tree in this, the way the app root would.
 */
export function PortalHost({ children }: { children?: React.ReactNode }) {
  return (
    <PortalProvider>
      {children}
      <PortalOutlet />
    </PortalProvider>
  );
}

type RenderOptions = Parameters<typeof rtlRender>[1];

/**
 * `render` with the portal host around the tree (and around every `rerender`),
 * outside any wrapper the test passes itself.
 */
export function render(ui: React.ReactElement, options?: RenderOptions) {
  const Inner = options && 'wrapper' in options ? options.wrapper : undefined;
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <PortalHost>{Inner ? <Inner>{children}</Inner> : children}</PortalHost>
  );
  return rtlRender(ui, { ...options, wrapper: Wrapper });
}

const originalOS = Platform.OS;
afterEach(() => {
  Platform.OS = originalOS;
});

/**
 * Capture the Android hardware-Back listeners registered from here on (call it
 * before rendering; it also makes the platform Android for the test). Returns a function that presses Back the way the OS does:
 * the most recently registered listener first, until one handles it.
 */
export function captureAndroidBack() {
  Platform.OS = 'android';
  let listeners: Array<Parameters<typeof BackHandler.addEventListener>[1]> = [];
  jest.spyOn(BackHandler, 'addEventListener').mockImplementation((_name, listener) => {
    listeners.push(listener);
    return {
      remove: () => {
        listeners = listeners.filter((l) => l !== listener);
      },
    };
  });
  return () => {
    for (const listener of [...listeners].reverse())
      if (listener({ type: 'hardwareBackPress', timeStamp: 0 })) return;
  };
}
