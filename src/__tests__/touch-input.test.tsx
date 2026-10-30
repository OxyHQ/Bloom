/**
 * Whether controls take a finger's geometry: native is touch, except in a
 * desktop window, which a pointer drives (an OxyOS window reports `window`).
 */
import type React from 'react';
import { renderHook } from '@testing-library/react-native';

import { resolveMenuDensity, useMenuDensity } from '../floating/use-menu-density';
import { PlatformSurfaceProvider } from '../platform-surface/context';
import type { PlatformSurfaceAdapter } from '../platform-surface/types';
import { useTouchInput } from '../styles/pointer';

const DESKTOP_WINDOW: PlatformSurfaceAdapter = {
  platform: 'desktop',
  capabilities: new Set(['window', 'popup-surface']),
};
const POPUPS_ONLY: PlatformSurfaceAdapter = {
  platform: 'popups',
  capabilities: new Set(['popup-surface']),
};

function on(adapter: PlatformSurfaceAdapter | null) {
  return ({ children }: { children: React.ReactNode }) => (
    <PlatformSurfaceProvider value={adapter}>{children}</PlatformSurfaceProvider>
  );
}

describe('useTouchInput on native', () => {
  it('is touch on a phone, with or without a platform adapter that has no window', () => {
    expect(renderHook(() => useTouchInput()).result.current).toBe(true);
    expect(renderHook(() => useTouchInput(), { wrapper: on(POPUPS_ONLY) }).result.current).toBe(
      true,
    );
  });

  it('is not touch in a desktop window, which a pointer drives', () => {
    expect(renderHook(() => useTouchInput(), { wrapper: on(DESKTOP_WINDOW) }).result.current).toBe(
      false,
    );
  });

  it('gives a desktop window compact menu rows, not 44pt ones', () => {
    const phone = renderHook(() => useMenuDensity()).result.current;
    const desktop = renderHook(() => useMenuDensity(), { wrapper: on(DESKTOP_WINDOW) }).result
      .current;
    expect(phone.height).toBe(44);
    expect(desktop).toEqual(resolveMenuDensity('md', false));
    expect(desktop.height).toBeLessThan(44);
  });
});
