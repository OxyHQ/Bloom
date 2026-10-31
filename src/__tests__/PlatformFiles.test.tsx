/**
 * The `files` part of the platform adapter (the person's places and the Trash,
 * and the file chooser's request) and who registers an adapter: the runtime wraps the application, and the
 * application's own `BloomProvider`, with no `platform` of its own, keeps it.
 */
import type React from 'react';
import { renderHook } from '@testing-library/react-native';

import {
  PlatformSurfaceProvider,
  usePlatformFiles,
  usePlatformSurfaces,
} from '../platform-surface/context';
import type {
  PlatformFileChooser,
  PlatformFiles,
  PlatformSurfaceAdapter,
} from '../platform-surface/types';
import { BloomProvider } from '../provider';

const files: PlatformFiles = {
  places: async () => [{ kind: 'home', name: 'ada', uri: 'file:///home/ada' }],
  watchPlaces: () => () => {},
  trash: async (uris) => uris.map((uri) => ({ uri, ok: true, result: `${uri}.trashed` })),
  trashed: async () => [],
  watchTrash: () => () => {},
  restore: async () => [],
  erase: async () => [],
  emptyTrash: async () => {},
};

const RUNTIME: PlatformSurfaceAdapter = { platform: 'runtime', capabilities: new Set(), files };
const OTHER: PlatformSurfaceAdapter = { platform: 'other', capabilities: new Set() };

function runtime(children: React.ReactNode, adapter: PlatformSurfaceAdapter | null = RUNTIME) {
  return <PlatformSurfaceProvider value={adapter}>{children}</PlatformSurfaceProvider>;
}

describe('usePlatformFiles', () => {
  it('is the adapter’s files when the platform has them', () => {
    const { result } = renderHook(() => usePlatformFiles(), {
      wrapper: ({ children }) => runtime(children),
    });
    expect(result.current).toBe(files);
  });

  it('is null without an adapter, and with one that has no files', () => {
    expect(renderHook(() => usePlatformFiles()).result.current).toBeNull();
    const { result } = renderHook(() => usePlatformFiles(), {
      wrapper: ({ children }) => runtime(children, OTHER),
    });
    expect(result.current).toBeNull();
  });
});

describe('the file chooser’s request', () => {
  it('reaches the application the platform started as the chooser, through its files', () => {
    const answers: string[] = [];
    const chooser: PlatformFileChooser = {
      request: {
        mode: 'open',
        multiple: false,
        directory: false,
        types: ['image/*', '.png'],
        title: null,
        suggestedName: null,
        folder: 'file:///home/ada/Pictures',
        application: { id: 'so.oxy.astro', name: 'Astro' },
      },
      choose: (uris) => answers.push(`chose ${uris.join(' ')}`),
      cancel: () => answers.push('cancelled'),
    };
    const adapter: PlatformSurfaceAdapter = {
      platform: 'runtime',
      capabilities: new Set(),
      files: { ...files, chooser },
    };
    const { result } = renderHook(() => usePlatformFiles()?.chooser, {
      wrapper: ({ children }) =>
        runtime(<BloomProvider fonts={false}>{children}</BloomProvider>, adapter),
    });
    expect(result.current).toBe(chooser);
    result.current?.choose(['file:///home/ada/Pictures/a.png']);
    expect(answers).toEqual(['chose file:///home/ada/Pictures/a.png']);
  });

  it('is absent from an application the platform did not start as the chooser', () => {
    const { result } = renderHook(() => usePlatformFiles()?.chooser, {
      wrapper: ({ children }) => runtime(children),
    });
    expect(result.current).toBeUndefined();
  });
});

describe('BloomProvider and the runtime’s adapter', () => {
  it('keeps the adapter around it when given no platform of its own', () => {
    const { result } = renderHook(() => usePlatformSurfaces(), {
      wrapper: ({ children }) => runtime(<BloomProvider fonts={false}>{children}</BloomProvider>),
    });
    expect(result.current).toBe(RUNTIME);
  });

  it('replaces it for its subtree when given a platform', () => {
    const { result } = renderHook(() => usePlatformSurfaces(), {
      wrapper: ({ children }) =>
        runtime(
          <BloomProvider fonts={false} platform={OTHER}>
            {children}
          </BloomProvider>,
        ),
    });
    expect(result.current).toBe(OTHER);
  });

  it('has none when nothing registered one', () => {
    const { result } = renderHook(() => usePlatformSurfaces(), {
      wrapper: ({ children }) => <BloomProvider fonts={false}>{children}</BloomProvider>,
    });
    expect(result.current).toBeNull();
  });
});
