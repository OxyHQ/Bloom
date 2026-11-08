/**
 * The `files` part of the platform adapter (the person's places and the Trash,
 * the file chooser's request, the tags on the person's files and their backups) and who registers an adapter: the runtime wraps the application, and the
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
  PlatformBackup,
  PlatformFileBackups,
  PlatformFileChooser,
  PlatformFiles,
  PlatformFileTag,
  PlatformFileTags,
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

describe('the tags on the person’s files', () => {
  it('reach the application through its files, where the platform keeps them', async () => {
    const red: PlatformFileTag = { name: 'Red', color: 'red' };
    const changes: string[] = [];
    const tags: PlatformFileTags = {
      inFolder: async (folderUri) => ({ [`${folderUri}/a.txt`]: [red] }),
      ofItems: async (uris) => uris.map((uri) => (uri.endsWith('gone') ? null : [red])),
      change: async (uris, change) => {
        changes.push(
          `${uris.join(' ')} +${(change.add ?? []).map((tag) => tag.name).join(',')} -${(change.remove ?? []).join(',')}`,
        );
        return uris.map((uri) => ({ uri, ok: true, result: uri }));
      },
      tagged: async () => [],
      names: async () => [{ name: 'Red', count: 1 }],
      watch: () => () => {},
    };
    const adapter: PlatformSurfaceAdapter = {
      platform: 'runtime',
      capabilities: new Set(),
      files: { ...files, tags },
    };
    const { result } = renderHook(() => usePlatformFiles()?.tags, {
      wrapper: ({ children }) =>
        runtime(<BloomProvider fonts={false}>{children}</BloomProvider>, adapter),
    });
    expect(result.current).toBe(tags);
    await expect(result.current?.inFolder('file:///home/ada')).resolves.toEqual({
      'file:///home/ada/a.txt': [red],
    });
    await expect(
      result.current?.ofItems(['file:///home/ada/a.txt', 'file:///home/ada/gone']),
    ).resolves.toEqual([[red], null]);
    await result.current?.change(['file:///home/ada/a.txt'], { add: [red], remove: ['Blue'] });
    expect(changes).toEqual(['file:///home/ada/a.txt +Red -Blue']);
  });

  it('are absent where the platform keeps none', () => {
    const { result } = renderHook(() => usePlatformFiles()?.tags, {
      wrapper: ({ children }) => runtime(children),
    });
    expect(result.current).toBeUndefined();
  });
});

describe('the person’s backups', () => {
  const backup: PlatformBackup = { destination: 'disk', id: '30742fd0', time: 1_767_348_000_000 };

  it('reach the application through its files, where the platform makes them', async () => {
    const asked: string[] = [];
    const backups: PlatformFileBackups = {
      state: async () => ({
        destinations: [
          {
            id: 'disk',
            name: 'Backup Disk',
            kind: 'disk',
            available: true,
            lastBackup: backup.time,
            oldestBackup: backup.time,
          },
        ],
        lastBackup: backup.time,
        backingUp: false,
      }),
      watch: () => () => {},
      versions: async (uri) => [
        { backup, isDirectory: uri.endsWith('/'), size: 6, lastModified: backup.time - 1000 },
      ],
      contents: async (from, folderUri) => [
        {
          uri: `${folderUri}notes.txt`,
          name: 'notes.txt',
          isDirectory: false,
          size: 6,
          lastModified: from.time,
        },
      ],
      restore: async (from, uri, options) => {
        asked.push(
          `${from.id} ${uri} to=${options?.to ?? '-'} replace=${options?.replace ?? false}`,
        );
        options?.onProgress?.({ bytesWritten: 6, totalBytes: 6 });
        return { uri: uri.replace('notes.txt', 'notes (original).txt'), skipped: 0 };
      },
    };
    const adapter: PlatformSurfaceAdapter = {
      platform: 'runtime',
      capabilities: new Set(),
      files: { ...files, backups },
    };
    const { result } = renderHook(() => usePlatformFiles()?.backups, {
      wrapper: ({ children }) =>
        runtime(<BloomProvider fonts={false}>{children}</BloomProvider>, adapter),
    });
    expect(result.current).toBe(backups);
    const state = await result.current?.state();
    expect(state?.destinations.map((destination) => destination.name)).toEqual(['Backup Disk']);
    const [version] = (await result.current?.versions('file:///home/ada/notes.txt')) ?? [];
    expect(version?.backup).toEqual(backup);
    const [item] = (await result.current?.contents(backup, 'file:///home/ada/')) ?? [];
    expect(item?.uri).toBe('file:///home/ada/notes.txt');
    const progress: number[] = [];
    const restored = await result.current?.restore(backup, 'file:///home/ada/notes.txt', {
      onProgress: ({ bytesWritten }) => progress.push(bytesWritten),
    });
    expect(restored).toEqual({ uri: 'file:///home/ada/notes (original).txt', skipped: 0 });
    await result.current?.restore(backup, 'file:///home/ada/notes.txt', {
      to: 'file:///home/ada/Restored/',
      replace: true,
    });
    expect(asked).toEqual([
      '30742fd0 file:///home/ada/notes.txt to=- replace=false',
      '30742fd0 file:///home/ada/notes.txt to=file:///home/ada/Restored/ replace=true',
    ]);
    expect(progress).toEqual([6]);
  });

  it('are absent where the platform makes none', () => {
    const { result } = renderHook(() => usePlatformFiles()?.backups, {
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
