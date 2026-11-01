import { type ComponentType, createContext, useContext } from 'react';
import type {
  PlatformAppearance,
  PlatformDrag,
  PlatformDropTargetProps,
  PlatformFiles,
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

/**
 * The person's places and the Trash (and, in an application the platform
 * started as the file chooser, its request: `chooser`), or null when the
 * platform supplies none (`PlatformFiles`).
 */
export function usePlatformFiles(): PlatformFiles | null {
  return useContext(PlatformSurfaceContext)?.files ?? null;
}

/** The adapter, when it reports `drag-and-drop`; it throws if it lacks either part. */
function dragAndDrop(adapter: PlatformSurfaceAdapter | null): PlatformSurfaceAdapter | null {
  if (!adapter?.capabilities.has('drag-and-drop')) return null;
  if (!adapter.DropTarget || !adapter.drag) {
    throw new Error(
      `Bloom: the ${adapter.platform} platform adapter reports 'drag-and-drop' without a DropTarget and a drag.`,
    );
  }
  return adapter;
}

/**
 * The adapter's drop target when it reports `drag-and-drop`, otherwise null (a
 * `DropZone` then takes HTML5's drops on the web, and nothing on a phone).
 */
export function usePlatformDropTarget(): ComponentType<PlatformDropTargetProps> | null {
  return dragAndDrop(useContext(PlatformSurfaceContext))?.DropTarget ?? null;
}

/**
 * Dragging the application's own content to another application, when the
 * adapter reports `drag-and-drop`; otherwise null, and the application keeps
 * its drags inside itself.
 */
export function usePlatformDrag(): PlatformDrag | null {
  return dragAndDrop(useContext(PlatformSurfaceContext))?.drag ?? null;
}
