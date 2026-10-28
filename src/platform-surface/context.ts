import { type ComponentType, createContext, useContext } from 'react';
import type { PlatformSurfaceAdapter, PopupSurfaceProps } from './types';

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
