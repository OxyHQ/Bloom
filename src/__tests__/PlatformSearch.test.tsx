/**
 * The `search` part of the platform adapter: an application asks the
 * platform's index (files, applications, Settings, applications' own items),
 * hears it change, says what the person opened, and donates its own items; and
 * has none where the platform keeps no index. The fixtures are typed, so `tsc`
 * holds the shapes as well as Jest.
 */
import type React from 'react';
import { renderHook } from '@testing-library/react-native';

import { PlatformSurfaceProvider, usePlatformSearch } from '../platform-surface/context';
import type {
  PlatformSearch,
  PlatformSearchableItem,
  PlatformSearchCategory,
  PlatformSearchItem,
  PlatformSearchQuery,
  PlatformSearchResults,
  PlatformSearchToken,
  PlatformSurfaceAdapter,
} from '../platform-surface';
import { BloomProvider } from '../provider';

const report: PlatformSearchItem = {
  id: 'file:///home/ada/Documents/Work/report.pdf',
  category: 'pdf',
  title: 'report.pdf',
  uri: 'file:///home/ada/Documents/Work/report.pdf',
  contentType: 'application/pdf',
  size: 48_213,
  modified: 1_762_473_600_000,
  created: 1_762_387_200_000,
  lastUsed: 1_762_480_000_000,
  tags: ['Work'],
  snippet: '… the quarterly report …',
  location: 'Documents › Work',
};
const settings: PlatformSearchItem = {
  id: 'settings:displays',
  category: 'settings',
  title: 'Displays',
  url: 'oxyos-settings://displays',
  application: 'so.oxy.settings',
  icon: 'file:///usr/share/oxyos/icons/settings.png',
};

const asked: PlatformSearchQuery[] = [];
const opened: string[] = [];
const donated: PlatformSearchableItem[] = [];
const listeners = new Set<() => void>();
const search: PlatformSearch = {
  query: async (query) => {
    asked.push(query);
    const results: PlatformSearchResults = {
      items: [report, settings],
      topHit: report.id,
      indexing: false,
    };
    return results;
  },
  watch: (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  used: (id) => opened.push(id),
  index: {
    donate: async (items) => {
      donated.push(...items);
    },
    remove: async (ids) => {
      const kept = donated.filter((item) => !ids.includes(item.id));
      donated.splice(0, donated.length, ...kept);
    },
    removeAll: async () => {
      donated.length = 0;
    },
  },
};

const RUNTIME: PlatformSurfaceAdapter = { platform: 'runtime', capabilities: new Set(), search };
const OTHER: PlatformSurfaceAdapter = { platform: 'other', capabilities: new Set() };

function runtime(children: React.ReactNode, adapter: PlatformSurfaceAdapter | null = RUNTIME) {
  return <PlatformSurfaceProvider value={adapter}>{children}</PlatformSurfaceProvider>;
}

beforeEach(() => {
  asked.length = 0;
  opened.length = 0;
  donated.length = 0;
  listeners.clear();
});

describe('usePlatformSearch', () => {
  it('is the adapter’s search when the platform keeps an index, through the application’s own provider', () => {
    const { result } = renderHook(() => usePlatformSearch(), {
      wrapper: ({ children }) => runtime(<BloomProvider fonts={false}>{children}</BloomProvider>),
    });
    expect(result.current).toBe(search);
  });

  it('is null without an adapter, and with one that keeps no index', () => {
    expect(renderHook(() => usePlatformSearch()).result.current).toBeNull();
    const { result } = renderHook(() => usePlatformSearch(), {
      wrapper: ({ children }) => runtime(children, OTHER),
    });
    expect(result.current).toBeNull();
  });
});

describe('asking the index', () => {
  it('passes the query, its tokens and its bounds to the platform, and gives back its order and top hit', async () => {
    const { result } = renderHook(() => usePlatformSearch(), {
      wrapper: ({ children }) => runtime(children),
    });
    const tokens: PlatformSearchToken[] = [
      { kind: 'category', value: 'pdf' },
      { kind: 'tag', value: 'Work' },
      { kind: 'date', value: 'week' },
      { kind: 'name', value: 'report' },
    ];
    const categories: PlatformSearchCategory[] = ['pdf', 'document'];
    const query: PlatformSearchQuery = {
      text: 'quarterly "the report" kind:pdf',
      tokens,
      within: ['file:///home/ada/Documents'],
      categories,
      limit: 20,
      language: 'es-ES',
    };
    const results = await result.current?.query(query);
    expect(asked).toEqual([query]);
    expect(results?.items.map((item) => item.id)).toEqual([report.id, settings.id]);
    expect(results?.topHit).toBe(report.id);
    expect(results?.indexing).toBe(false);
  });

  it('needs only the text', async () => {
    await search.query({ text: 'disp' });
    expect(asked).toEqual([{ text: 'disp' }]);
  });

  it('tells its watchers when the index changed, until they unsubscribe', () => {
    const heard: string[] = [];
    const unsubscribe = search.watch(() => heard.push('changed'));
    for (const listener of listeners) listener();
    unsubscribe();
    for (const listener of listeners) listener();
    expect(heard).toEqual(['changed']);
  });

  it('hears what the person opened', () => {
    search.used(settings.id);
    expect(opened).toEqual(['settings:displays']);
  });
});

describe('an application’s own items', () => {
  it('are donated, removed by id and removed all', async () => {
    const ada: PlatformSearchableItem = {
      id: 'ada',
      title: 'Ada Lovelace',
      category: 'contact',
      text: 'Analytical Engine',
      keywords: ['mathematician'],
      url: 'oxy-contacts://ada',
      modified: 1_762_473_600_000,
    };
    const lunch: PlatformSearchableItem = {
      id: 'lunch',
      title: 'Lunch',
      category: 'event',
      url: 'oxy-calendar://lunch',
    };
    await search.index.donate([ada, lunch]);
    expect(donated.map((item) => item.id)).toEqual(['ada', 'lunch']);
    await search.index.remove(['ada']);
    expect(donated.map((item) => item.id)).toEqual(['lunch']);
    await search.index.removeAll();
    expect(donated).toEqual([]);
  });

  it('are only an application’s kinds of item, never a file’s', () => {
    const file: PlatformSearchableItem = {
      id: 'x',
      title: 'x',
      // @ts-expect-error A file is the platform's to index, never donated.
      category: 'pdf',
      url: 'oxy-notes://x',
    };
    expect(file.id).toBe('x');
  });
});
