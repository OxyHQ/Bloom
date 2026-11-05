/**
 * The `sounds` part of the platform adapter: an application asks for the
 * platform's own sound by its meaning (putting items in the Trash, emptying
 * it), and plays nothing where the platform has none.
 */
import type React from 'react';
import { renderHook } from '@testing-library/react-native';

import { PlatformSurfaceProvider, usePlatformSounds } from '../platform-surface/context';
import type {
  PlatformSounds,
  PlatformSurfaceAdapter,
  PlatformSystemSound,
} from '../platform-surface/types';
import { BloomProvider } from '../provider';

const played: PlatformSystemSound[] = [];
const sounds: PlatformSounds = { play: (sound) => played.push(sound) };

const RUNTIME: PlatformSurfaceAdapter = { platform: 'runtime', capabilities: new Set(), sounds };
const OTHER: PlatformSurfaceAdapter = { platform: 'other', capabilities: new Set() };

function runtime(children: React.ReactNode, adapter: PlatformSurfaceAdapter | null = RUNTIME) {
  return <PlatformSurfaceProvider value={adapter}>{children}</PlatformSurfaceProvider>;
}

describe('usePlatformSounds', () => {
  beforeEach(() => {
    played.length = 0;
  });

  it('is the adapter’s sounds when the platform has them, through the application’s own provider', () => {
    const { result } = renderHook(() => usePlatformSounds(), {
      wrapper: ({ children }) => runtime(<BloomProvider fonts={false}>{children}</BloomProvider>),
    });
    expect(result.current).toBe(sounds);
    result.current?.play('move-to-trash');
    result.current?.play('empty-trash');
    expect(played).toEqual(['move-to-trash', 'empty-trash']);
  });

  it('is null without an adapter, and with one that has no sounds', () => {
    expect(renderHook(() => usePlatformSounds()).result.current).toBeNull();
    const { result } = renderHook(() => usePlatformSounds(), {
      wrapper: ({ children }) => runtime(children, OTHER),
    });
    expect(result.current).toBeNull();
  });
});
