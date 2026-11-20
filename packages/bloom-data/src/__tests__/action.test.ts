import { action, realtime, setActiveStore, Store } from '../index';
import { Post, post } from './fixtures';

let store: Store;
beforeEach(() => {
  store = new Store();
  setActiveStore(store);
});

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function likeAction(server: { promise: Promise<{ likes: number }> }) {
  return action({
    key: (id: string) => `like:${id}`,
    optimistic: (id: string) =>
      Post.patch(id, (p) => ({
        viewerState: { isLiked: true },
        engagement: { likes: p.engagement.likes + 1 },
      })),
    run: () => server.promise,
    settle: (result, id: string) =>
      Post.merge(id, { viewerState: { isLiked: true }, engagement: { likes: result.likes } }),
  });
}

describe('action', () => {
  it('shows the change at once and settles to the server answer', async () => {
    Post.put(post('1', { engagement: { likes: 10, boosts: 0 } }));
    const server = deferred<{ likes: number }>();
    const like = likeAction(server);
    const done = like('1');
    expect(Post.get('1')?.engagement.likes).toBe(11);
    expect(Post.get('1')?.viewerState.isLiked).toBe(true);
    server.resolve({ likes: 12 });
    await done;
    expect(Post.get('1')?.engagement.likes).toBe(12);
  });

  it('rolls back on failure to the current server copy, not a stale snapshot', async () => {
    Post.put(post('1', { engagement: { likes: 10, boosts: 0 } }));
    const server = deferred<{ likes: number }>();
    const done = likeAction(server)('1');
    // Realtime moves the server copy while the like is in flight.
    Post.merge('1', { engagement: { boosts: 4 } });
    server.reject(new Error('offline'));
    await expect(done).rejects.toThrow('offline');
    expect(Post.get('1')?.engagement).toEqual({ likes: 10, boosts: 4 });
    expect(Post.get('1')?.viewerState.isLiked).toBe(false);
  });

  it('holds its fields while a server echo arrives mid-flight', async () => {
    Post.put(post('1', { engagement: { likes: 10, boosts: 0 } }));
    const server = deferred<{ likes: number }>();
    const done = likeAction(server)('1');
    // An anonymous refresh says "not liked, 10" before the server has counted the like.
    Post.put(post('1', { engagement: { likes: 10, boosts: 0 } }));
    expect(Post.get('1')?.engagement.likes).toBe(11);
    server.resolve({ likes: 11 });
    await done;
    expect(Post.get('1')?.engagement.likes).toBe(11);
  });

  it('keeps the change when the answer carries nothing to settle', async () => {
    Post.put(post('1', { engagement: { likes: 0, boosts: 2 } }));
    const boost = action({
      optimistic: (id: string) =>
        Post.patch(id, (p) => ({ engagement: { boosts: p.engagement.boosts + 1 } })),
      run: async () => ({ success: true }),
    });
    await boost('1');
    expect(Post.get('1')?.engagement.boosts).toBe(3);
    // Written into the server copy: a later server write builds on it.
    Post.merge('1', { engagement: { likes: 1 } });
    expect(Post.get('1')?.engagement).toEqual({ likes: 1, boosts: 3 });
  });

  it('ignores a second call with the same key while the first is in flight', async () => {
    Post.put(post('1'));
    const server = deferred<{ likes: number }>();
    const like = likeAction(server);
    const first = like('1');
    await expect(like('1')).resolves.toBeUndefined();
    expect(Post.get('1')?.engagement.likes).toBe(1);
    server.resolve({ likes: 1 });
    await first;
  });

  it('shares keys across actions, so an action and its undo exclude each other', async () => {
    Post.put(post('1'));
    const server = deferred<{ likes: number }>();
    const like = likeAction(server);
    const unlike = action({ key: (id: string) => `like:${id}`, run: async () => ({ likes: 0 }) });
    const first = like('1');
    await expect(unlike('1')).resolves.toBeUndefined();
    server.resolve({ likes: 1 });
    await first;
  });

  it('applies nothing when its account was left before the answer', async () => {
    Post.put(post('1'));
    const server = deferred<{ likes: number }>();
    const done = likeAction(server)('1');
    await store.close();
    const next = new Store();
    setActiveStore(next);
    next.put(Post.definition, post('1') as never);
    server.resolve({ likes: 99 });
    await done;
    expect(next.read(Post.definition, '1')?.engagement).toEqual({ likes: 0, boosts: 0 });
  });
});

describe('realtime', () => {
  function fakeSocket() {
    const handlers = new Map<string, (payload: never) => void>();
    return {
      on: (event: string, fn: (payload: never) => void) => handlers.set(event, fn),
      off: (event: string) => handlers.delete(event),
      emit: (event: string, payload: unknown) => handlers.get(event)?.(payload as never),
      handlers,
    };
  }

  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('applies a burst after the frame, in order, with one notification', () => {
    Post.put(post('1'));
    const socket = fakeSocket();
    const stop = realtime(socket, {
      engagement: (e: { id: string; likes: number }) =>
        Post.merge(e.id, { engagement: { likes: e.likes } }),
    });
    let notified = 0;
    store.listen(store.slot(Post.definition, '1', true), () => {
      notified += 1;
    });
    socket.emit('engagement', { id: '1', likes: 3 });
    socket.emit('engagement', { id: '1', likes: 5 });
    expect(Post.get('1')?.engagement.likes).toBe(0);
    jest.advanceTimersByTime(20);
    expect(Post.get('1')?.engagement.likes).toBe(5);
    expect(notified).toBe(1);
    stop();
    expect(socket.handlers.size).toBe(0);
  });

  it('drops events that arrived for a store closed before the frame', async () => {
    Post.put(post('1'));
    const socket = fakeSocket();
    realtime(socket, {
      engagement: (e: { id: string; likes: number }) =>
        Post.merge(e.id, { engagement: { likes: e.likes } }),
    });
    socket.emit('engagement', { id: '1', likes: 3 });
    const closing = store.close();
    const next = new Store();
    setActiveStore(next);
    next.put(Post.definition, post('1') as never);
    jest.advanceTimersByTime(20);
    await closing;
    expect(next.read(Post.definition, '1')).toMatchObject({ engagement: { likes: 0 } });
  });
});
