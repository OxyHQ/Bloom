import { type ComponentType, createContext, useContext } from 'react';
import type {
  PlatformAppearance,
  PlatformKeyboard,
  PlatformMenuBar,
  PlatformSurfaceAdapter,
  PlatformWindow,
  PopupSurfaceProps,
} from './types';

const PlatformSurfaceContext = createContext<PlatformSurfaceAdapter | null>(null);

/** `BloomProvider` mounts this with its `platform` prop (null when unset). */
export const PlatformSurfaceProvider = PlatformSurfaceContext.Provider;

/** The registered adapter, or null when the app registered none. */
export function usePlatformSurfaces(): PlatformSurfaceAdapter | null {
  return useContext(PlatformSurfaceContext);
}

/**
 * The adapter's popup component when it reports `popup-surface`, otherwise
 * null. An adapter that reports the capability without the component is a
 * contract violation and throws, rather than silently falling back.
 */
export function usePopupSurface(): ComponentType<PopupSurfaceProps> | null {
  const adapter = useContext(PlatformSurfaceContext);
  if (!adapter?.capabilities.has('popup-surface')) return null;
  if (!adapter.PopupSurface) {
    throw new Error(
      `Bloom: the ${adapter.platform} platform adapter reports 'popup-surface' without a PopupSurface component.`,
    );
  }
  return adapter.PopupSurface;
}

/**
 * The adapter's window when it reports `window`, otherwise null (a browser
 * tab, a phone). An adapter that reports the capability without the window
 * throws, as `usePopupSurface` does.
 */
export function usePlatformWindow(): PlatformWindow | null {
  const adapter = useContext(PlatformSurfaceContext);
  if (!adapter?.capabilities.has('window')) return null;
  if (!adapter.window) {
    throw new Error(
      `Bloom: the ${adapter.platform} platform adapter reports 'window' without a window.`,
    );
  }
  return adapter.window;
}

/**
 * The platform's menu bar when the adapter reports `menu-bar`, otherwise null
 * (a `Menubar` draws itself in the window). An adapter that reports the
 * capability without the bar throws, as `usePopupSurface` does.
 */
export function usePlatformMenuBar(): PlatformMenuBar | null {
  const adapter = useContext(PlatformSurfaceContext);
  if (!adapter?.capabilities.has('menu-bar')) return null;
  if (!adapter.menuBar) {
    throw new Error(
      `Bloom: the ${adapter.platform} platform adapter reports 'menu-bar' without a menuBar.`,
    );
  }
  return adapter.menuBar;
}

/**
 * The platform's appearance when the adapter reports `appearance`, otherwise
 * null (the application keeps its own accent, and transparency follows only
 * `reduceTransparency` and the web's media query). An adapter that reports the
 * capability without the appearance throws, as `usePopupSurface` does.
 */
export function usePlatformAppearance(): PlatformAppearance | null {
  const adapter = useContext(PlatformSurfaceContext);
  if (!adapter?.capabilities.has('appearance')) return null;
  if (!adapter.appearance) {
    throw new Error(
      `Bloom: the ${adapter.platform} platform adapter reports 'appearance' without an appearance.`,
    );
  }
  return adapter.appearance;
}

/** The adapter's source of the window's key presses, or null when it supplies none. */
export function usePlatformKeyboard(): PlatformKeyboard | null {
  return useContext(PlatformSurfaceContext)?.keyboard ?? null;
}
