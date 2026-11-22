import {
  environment,
  type Page,
  setActiveStore,
  skip,
  source,
  Store,
  useList,
  useListState,
} from '../index';
import { resetEnvironmentForTests } from '../environment';
import { Feed, Post, post } from './fixtures';
import { render, settle, update } from './support/render';

let store: Store;
beforeEach(() => {
  resetEnvironmentForTests();
  store = new Store();
  setActiveStore(store);
});
// Closing aborts reads still in flight and clears gc timers.
afterEach(() => store.close());

type TestPage = Page<ReturnType<typeof post>, { cards: string[] }>;

interface Call {
  cursor: string | undefined;
  type: string;
  signal: AbortSignal;
  resolve: (page: TestPage) => void;
  reject: (error: unknown) => void;
}

function server() {
  const calls: Call[] = [];
  const feed = source(Feed, {
    key: (type: string) => type,
    load: ({ cursor, signal }, type: string) =>
      new Promise<TestPage>((resolve, reject) =>
        calls.push({ cursor, type, signal, resolve, reject }),
      ),
    fold: (current, extra, mode) => ({
      cards: [...(mode === 'next' ? (current?.cards ?? []) : []), ...(extra?.cards ?? [])],
    }),
    retry: 2,
    gcTime: 1000,
    stale: 10_000,
  });
  return { calls, feed };
}

const page = (ids: string[], next?: string) => ({
  items: ids.map((id) => post(id)),
  next,
  extra: { cards: ids.slice(0, 1) },
});

describe('source', () => {
  it('shares one read between callers of the same key', async () => {
    const { calls, feed } = server();
    const a = feed.fetch('home');
    const b = feed.fetch('home');
    expect(calls).toHaveLength(1);
    calls[0]?.resolve(page(['1', '2'], 'c2'));
    await Promise.all([a, b]);
    expect(Feed.get('home')?.ids).toEqual(['1', '2']);
    expect(Feed.get('home')?.extra).toEqual({ cards: ['1'] });
    expect(feed.state('home').status).toBe('success');
  });

  it('pages with the cursor, appending unique ids and folding the extra', async () => {
    const { calls, feed } = server();
    const first = feed.fetch('home');
    calls[0]?.resolve(page(['1', '2'], 'c2'));
    await first;
    const more = feed.more('home');
    expect(calls[1]?.cursor).toBe('c2');
    calls[1]?.resolve(page(['2', '3']));
    await more;
    expect(Feed.get('home')?.ids).toEqual(['1', '2', '3']);
    expect(Feed.get('home')?.extra).toEqual({ cards: ['1', '2'] });
    expect(Feed.get('home')?.hasMore).toBe(false);
    await feed.more('home');
    expect(calls).toHaveLength(2);
  });

  it('stops paging when the server repeats a cursor', async () => {
    const { calls, feed } = server();
    const first = feed.fetch('home');
    calls[0]?.resolve(page(['1'], 'c2'));
    await first;
    const more = feed.more('home');
    calls[1]?.resolve(page(['2'], 'c2'));
    await more;
    expect(Feed.get('home')?.hasMore).toBe(false);
  });

  it('lets a refresh supersede a continuation, whose late page is dropped', async () => {
    const { calls, feed } = server();
    const first = feed.fetch('home');
    calls[0]?.resolve(page(['1'], 'c2'));
    await first;
    const more = feed.more('home');
    const refresh = feed.refresh('home');
    expect(calls[1]?.signal.aborted).toBe(true);
    calls[1]?.resolve(page(['late']));
    calls[2]?.resolve(page(['fresh'], 'f2'));
    await Promise.all([more, refresh]);
    expect(Feed.get('home')?.ids).toEqual(['fresh']);
  });

  it('joins a first page in flight instead of continuing past it', async () => {
    const { calls, feed } = server();
    const first = feed.fetch('home');
    const more = feed.more('home');
    expect(calls).toHaveLength(1);
    calls[0]?.resolve(page(['1'], 'c2'));
    await Promise.all([first, more]);
    expect(Feed.get('home')?.ids).toEqual(['1']);
  });

  it('keeps the rows on screen until a refresh lands, and on its failure', async () => {
    jest.useFakeTimers();
    try {
      const { calls, feed } = server();
      const first = feed.fetch('home');
      calls[0]?.resolve(page(['1']));
      await first;
      const refresh = feed.refresh('home');
      expect(Feed.get('home')?.ids).toEqual(['1']);
      calls[1]?.reject(new Error('down'));
      await jest.advanceTimersByTimeAsync(1000);
      calls[2]?.reject(new Error('down'));
      await jest.advanceTimersByTimeAsync(2000);
      calls[3]?.reject(new Error('down'));
      await refresh;
      expect(calls).toHaveLength(4);
      expect(feed.state('home').status).toBe('error');
      expect(Feed.get('home')?.ids).toEqual(['1']);
    } finally {
      jest.useRealTimers();
    }
  });

  it('retries with exponential backoff and recovers', async () => {
    jest.useFakeTimers();
    try {
      const { calls, feed } = server();
      const read = feed.fetch('home');
      calls[0]?.reject(new Error('blip'));
      await jest.advanceTimersByTimeAsync(999);
      expect(calls).toHaveLength(1);
      await jest.advanceTimersByTimeAsync(1);
      expect(calls).toHaveLength(2);
      expect(feed.state('home').failureCount).toBe(1);
      calls[1]?.resolve(page(['1']));
      await read;
      expect(feed.state('home')).toMatchObject({ status: 'success', failureCount: 0, error: null });
    } finally {
      jest.useRealTimers();
    }
  });

  it('pauses offline and resumes on reconnect', async () => {
    const { calls, feed } = server();
    environment.setOnline(false);
    const read = feed.fetch('home');
    await Promise.resolve();
    expect(calls).toHaveLength(0);
    expect(feed.state('home').fetchStatus).toBe('paused');
    environment.setOnline(true);
    await Promise.resolve();
    expect(calls).toHaveLength(1);
    calls[0]?.resolve(page(['1']));
    await read;
    expect(feed.state('home').fetchStatus).toBe('idle');
  });

  it('holds a retry while the app is in the background', async () => {
    jest.useFakeTimers();
    try {
      const { calls, feed } = server();
      const read = feed.fetch('home');
      calls[0]?.reject(new Error('blip'));
      environment.setFocused(false);
      await jest.advanceTimersByTimeAsync(5000);
      expect(calls).toHaveLength(1);
      expect(feed.state('home').fetchStatus).toBe('paused');
      environment.setFocused(true);
      await jest.advanceTimersByTimeAsync(0);
      expect(calls).toHaveLength(2);
      calls[1]?.resolve(page(['1']));
      await read;
    } finally {
      jest.useRealTimers();
    }
  });

  it('does not read fresh data again on mount, and reads stale data again', async () => {
    jest.useFakeTimers();
    try {
      const { calls, feed } = server();
      const read = feed.fetch('home');
      calls[0]?.resolve(page(['1']));
      await read;
      await feed.fetch('home');
      expect(calls).toHaveLength(1);
      jest.advanceTimersByTime(10_000);
      void feed.fetch('home');
      expect(calls).toHaveLength(2);
    } finally {
      jest.useRealTimers();
    }
  });

  it('judges staleness by a rule when given one', async () => {
    let changedAt = 0;
    const calls: Call[] = [];
    const feed = source(Feed, {
      key: (type: string) => `rule:${type}`,
      load: ({ cursor, signal }, type: string) =>
        new Promise<TestPage>((resolve, reject) =>
          calls.push({ cursor, type, signal, resolve, reject }),
        ),
      stale: (read) => changedAt > read.updatedAt,
    });
    const read = feed.fetch('home');
    calls[0]?.resolve(page(['1']));
    await read;
    await feed.fetch('home');
    expect(calls).toHaveLength(1);
    changedAt = Date.now() + 1;
    void feed.fetch('home');
    expect(calls).toHaveLength(2);
  });

  it('reads stale, observed keys again on focus and reconnect, and only those', async () => {
    jest.useFakeTimers();
    try {
      const { calls, feed } = server();
      const stop = feed.observe(store, ['home']);
      calls[0]?.resolve(page(['1']));
      await jest.advanceTimersByTimeAsync(0);
      environment.setFocused(false);
      environment.setFocused(true);
      expect(calls).toHaveLength(1);
      jest.advanceTimersByTime(10_000);
      environment.setFocused(false);
      environment.setFocused(true);
      expect(calls).toHaveLength(2);
      calls[1]?.resolve(page(['1']));
      await jest.advanceTimersByTimeAsync(0);
      stop();
      jest.advanceTimersByTime(10_000);
      environment.setOnline(false);
      environment.setOnline(true);
      expect(calls).toHaveLength(2);
    } finally {
      jest.useRealTimers();
    }
  });

  it('forgets an unobserved key after gcTime, from memory only', async () => {
    jest.useFakeTimers();
    try {
      const { calls, feed } = server();
      const stop = feed.observe(store, ['home']);
      calls[0]?.resolve(page(['1']));
      await jest.advanceTimersByTimeAsync(0);
      stop();
      jest.advanceTimersByTime(999);
      expect(Feed.get('home')?.ids).toEqual(['1']);
      jest.advanceTimersByTime(1);
      expect(Feed.get('home')).toBeUndefined();
      expect(feed.state('home').status).toBe('idle');
    } finally {
      jest.useRealTimers();
    }
  });

  it('drops a late answer for a closed store', async () => {
    const { calls, feed } = server();
    const read = feed.fetch('home');
    const closing = store.close();
    calls[0]?.resolve(page(['1']));
    await Promise.all([read, closing]);
    expect(store.listSlot(Feed.definition, 'home')?.state).toBeUndefined();
  });

  it('re-renders the list only when its ids or state change, not when a record does', async () => {
    const { calls, feed } = server();
    let renders = 0;
    function Home() {
      renders += 1;
      const view = useList(feed, 'home');
      return <>{view.isLoading ? 'loading' : view.ids.join(',')}</>;
    }
    const tree = render(<Home />);
    expect(tree.toJSON()).toBe('loading');
    await settle(() => calls[0]?.resolve(page(['1', '2'])));
    expect(tree.toJSON()).toBe('1,2');
    const before = renders;
    update(() => Post.merge('1', { engagement: { likes: 5 } }));
    expect(renders).toBe(before);
    // An identical answer changes nothing either.
    await settle(() => {
      const refresh = feed.refresh('home');
      calls[1]?.resolve(page(['1', '2']));
      return refresh;
    });
    expect(tree.toJSON()).toBe('1,2');
  });

  it('removes a record whose record source answers null', async () => {
    const posts = source(Post, {
      key: (id: string) => id,
      load: async (_request: { signal: AbortSignal }, id: string) =>
        id === 'gone' ? null : post(id),
    });
    await posts.fetch('1');
    expect(Post.get('1')?.text).toBe('post 1');
    Post.put(post('gone'));
    await posts.refresh('gone');
    expect(Post.has('gone')).toBe(false);
  });
});

describe('source extras', () => {
  it('stores a page’s related records without listing them', async () => {
    const feed = source(Feed, {
      key: (type: string) => `related:${type}`,
      load: async () => ({ items: [post('1')], related: [post('side')] }),
    });
    await feed.fetch('home');
    expect(Feed.get('related:home')?.ids).toEqual(['1']);
    expect(Post.has('side')).toBe(true);
  });

  it('observes nothing while skipped, then reads once given arguments', async () => {
    const calls: string[] = [];
    const feed = source(Feed, {
      key: (type: string) => `skip:${type}`,
      load: async (_request, type: string) => {
        calls.push(type);
        return { items: [post('1')] };
      },
    });
    function Home({ ready }: { ready: boolean }) {
      const view = useList(feed, ...(ready ? (['home'] as [string]) : ([skip] as [typeof skip])));
      return <>{`${view.isLoading}:${view.ids.join(',')}`}</>;
    }
    const tree = render(<Home ready={false} />);
    expect(tree.toJSON()).toBe('false:');
    expect(calls).toEqual([]);
    await settle(() => tree.update(<Home ready />));
    expect(calls).toEqual(['home']);
    expect(tree.toJSON()).toBe('false:1');
  });

  it('reads a held list without reading it from the server', async () => {
    const feed = source(Feed, {
      key: (type: string) => `passive:${type}`,
      load: async () => ({ items: [post('1')] }),
    });
    function Reader() {
      const list = useListState(Feed, 'passive:home');
      return <>{list ? list.ids.join(',') : 'none'}</>;
    }
    const tree = render(<Reader />);
    expect(tree.toJSON()).toBe('none');
    expect(feed.state('home').status).toBe('idle');
    await settle(() => feed.fetch('home'));
    expect(tree.toJSON()).toBe('1');
  });
});

describe('environment events', () => {
  it('tells every change, and reads again only on coming online or to the front', async () => {
    const { environment, source, setActiveStore, Store } = await import('../index');
    const { Post, post } = await import('./fixtures');
    const events: string[] = [];
    const stop = environment.subscribe((event) => events.push(event));
    environment.setOnline(false);
    environment.setFocused(false);
    environment.setFocused(true);
    environment.setOnline(true);
    stop();
    expect(events).toEqual(['offline', 'blur', 'focus', 'online']);
    const store = new Store();
    setActiveStore(store);
    const load = jest.fn(async (_request: unknown, id: string) => post(id));
    const byId = source(Post, { key: (id: string) => id, load });
    const off = byId.observe(store, ['e1']);
    await Promise.resolve();
    await Promise.resolve();
    const calls = load.mock.calls.length;
    environment.setOnline(false);
    environment.setFocused(false);
    expect(load.mock.calls.length).toBe(calls);
    off();
    await store.close();
  });

  describe('invalidate', () => {
    function Home({ feed }: { feed: ReturnType<typeof server>['feed'] }) {
      return <>{useList(feed, 'home').ids.join(',')}</>;
    }

    it('reads an observed key again now, though its stale age has not passed', async () => {
      const { calls, feed } = server(); // stale: 10 s
      const tree = render(<Home feed={feed} />);
      await settle(() => calls[0]?.resolve(page(['1'])));
      expect(tree.toJSON()).toBe('1');
      update(() => feed.invalidate('home'));
      expect(calls).toHaveLength(2);
      await settle(() => calls[1]?.resolve(page(['2', '1'])));
      expect(tree.toJSON()).toBe('2,1');
      update(() => tree.unmount());
    });

    it('reads an unobserved key again when it is next observed', async () => {
      const { calls, feed } = server();
      const read = feed.fetch('home');
      calls[0]?.resolve(page(['1']));
      await read;
      // Fresh: mounting reads nothing.
      let tree = render(<Home feed={feed} />);
      update(() => tree.unmount());
      expect(calls).toHaveLength(1);
      feed.invalidate('home');
      expect(calls).toHaveLength(1);
      tree = render(<Home feed={feed} />);
      expect(calls).toHaveLength(2);
      await settle(() => calls[1]?.resolve(page(['3'])));
      expect(tree.toJSON()).toBe('3');
      // Answered since: fresh again.
      update(() => tree.unmount());
      tree = render(<Home feed={feed} />);
      expect(calls).toHaveLength(2);
      update(() => tree.unmount());
    });

    it('invalidateAll marks every key of the source, even one that never goes stale', async () => {
      const keys: string[] = [];
      const feed = source(Feed, {
        key: (type: string) => type,
        stale: Number.POSITIVE_INFINITY,
        load: async (_request, type: string) => {
          keys.push(type);
          return page([`${type}-${keys.length}`]);
        },
      });
      function Following() {
        return <>{useList(feed, 'following').ids.join(',')}</>;
      }
      await feed.fetch('home');
      const tree = render(<Following />);
      await settle();
      expect(keys).toEqual(['home', 'following']);
      await settle(() => feed.invalidateAll());
      // The observed key read again at once; the other waits to be observed.
      expect(keys).toEqual(['home', 'following', 'following']);
      expect(tree.toJSON()).toBe('following-3');
      await feed.fetch('home');
      expect(keys).toEqual(['home', 'following', 'following', 'home']);
      // Read since: the rule is back, and it never goes stale.
      await feed.fetch('home');
      expect(keys).toHaveLength(4);
      update(() => tree.unmount());
    });
  });
});
