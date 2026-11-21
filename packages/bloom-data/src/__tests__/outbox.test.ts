import 'fake-indexeddb/auto';
import {
  action,
  actionStatus,
  createAccounts,
  entity,
  environment,
  list,
  model,
  type Persister,
  StoreClosedError,
  Store,
  setActiveStore,
} from '../index';
import { resetEnvironmentForTests } from '../environment';
import { indexedDbPersister } from '../indexeddb';
import { sqlitePersister } from '../sqlite';
import { openTestDatabase, resetFiles } from './support/sqlite';

// ── The server ────────────────────────────────────────────────

/** What reached the server, in order, and what it refuses. */
const server = {
  log: [] as string[],
  refused: new Set<string>(),
  /** Milliseconds a call takes. */
  latency: 0,
  /** While set, answers wait for it. */
  gate: undefined as Promise<void> | undefined,
  async call(name: string, id: string): Promise<{ ok: true }> {
    server.log.push(`start ${name} ${id}`);
    if (server.latency > 0) await new Promise((resolve) => setTimeout(resolve, server.latency));
    await server.gate;
    if (server.refused.has(`${name} ${id}`)) throw new Error(`refused ${name} ${id}`);
    server.log.push(`done ${name} ${id}`);
    return { ok: true };
  },
};
const started = () => server.log.filter((line) => line.startsWith('start'));

// ── Inbox ─────────────────────────────────────────────────────

interface Message {
  id: string;
  starred: boolean;
  read: boolean;
  pinned: boolean;
}
const Message = entity<Message>('outbox-message', { id: (m) => m.id, persist: true });
const Mailbox = list('outbox-mailbox', { of: Message, persist: true });

const star = action({
  name: 'inbox.star',
  durable: true,
  key: (id: string, _starred: boolean) => `star:${id}`,
  optimistic: (id: string, starred: boolean) => Message.merge(id, { starred }),
  run: (id: string) => server.call('star', id),
});
const markRead = action({
  name: 'inbox.read',
  durable: true,
  optimistic: (id: string, read: boolean) => Message.merge(id, { read }),
  run: (id: string) => server.call('read', id),
});
const archive = action({
  name: 'inbox.archive',
  durable: true,
  optimistic: (id: string) => Mailbox.remove('inbox', [id]),
  run: (id: string) => server.call('archive', id),
});
const remove = action({
  name: 'inbox.delete',
  durable: true,
  optimistic: (id: string) => Mailbox.remove('inbox', [id]),
  run: (id: string) => server.call('delete', id),
});
const pin = action({
  name: 'inbox.pin',
  durable: true,
  optimistic: (id: string) => {
    Message.merge(id, { pinned: true });
    Mailbox.move('inbox', id, 0);
  },
  run: (id: string) => server.call('pin', id),
});

// ── Atlas ─────────────────────────────────────────────────────

interface Review {
  id: string;
  text: string;
}
const Review = entity<Review>('outbox-review', { id: (r) => r.id, persist: true });
const OwnReviews = list('outbox-own-reviews', { of: Review, persist: true });

const writeReview = action({
  name: 'atlas.review.write',
  durable: true,
  optimistic: (review: Review) => {
    Review.put(review);
    OwnReviews.insert('mine', [review.id], 0);
  },
  run: (review: Review) => server.call('write', review.id),
});
const deleteReview = action({
  name: 'atlas.review.delete',
  durable: true,
  optimistic: (id: string) => OwnReviews.remove('mine', [id]),
  run: (id: string) => server.call('delete', id),
});

// ── Alia and Gemies ───────────────────────────────────────────

const Settings = model<{ emailAlerts: boolean; digest: string }>('outbox-settings', {
  persist: true,
});
const setEmailAlerts = action({
  name: 'alia.emailAlerts',
  durable: true,
  optimistic: (enabled: boolean) =>
    Settings.set((current) => ({ digest: 'daily', ...current, emailAlerts: enabled })),
  run: (enabled: boolean) => server.call('emailAlerts', String(enabled)),
});

// ── Harness ───────────────────────────────────────────────────

const stores: Store[] = [];
/** Opens a store on a durable copy, as an app does at launch. */
function launch(persister: Persister): Store {
  const store = new Store({ persister });
  stores.push(store);
  setActiveStore(store);
  return store;
}
const sqlite = (file: string) => sqlitePersister(async () => openTestDatabase(file));

/** Waits past the first frame, so the store has read its outbox and written what is queued. */
const nextFrames = () => new Promise((resolve) => setTimeout(resolve, 40));

/** Waits until every call of the store has settled. */
async function idle(store: Store): Promise<void> {
  for (let i = 0; i < 100; i += 1) {
    const { pending, paused } = actionStatus(store);
    if (pending === 0 && paused === 0) return;
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
  throw new Error('calls never settled');
}

/** Kills the app: the store closes with its calls unsettled. */
async function kill(store: Store, calls: Array<Promise<unknown>>): Promise<void> {
  await nextFrames();
  await store.close();
  for (const call of calls) await expect(call).rejects.toBeInstanceOf(StoreClosedError);
}

/** The calls the outbox of a SQLite file holds. */
function storedCalls(file: string): Array<{ name: string; args: unknown[] }> {
  const [row] = openTestDatabase(file).rows(
    "SELECT json FROM bloom_records WHERE type = 'bloom-outbox'",
  );
  return row ? JSON.parse(String(row.json)).calls : [];
}

const message = (id: string): Message => ({ id, starred: false, read: false, pinned: false });

beforeEach(() => {
  resetEnvironmentForTests();
  server.log = [];
  server.refused.clear();
  server.latency = 0;
  server.gate = undefined;
});
afterEach(async () => {
  await Promise.all(stores.splice(0).map((store) => store.close()));
  resetEnvironmentForTests();
  resetFiles();
});

describe('durable actions', () => {
  it('Inbox: changes made offline show after a restart, run when online, and a refusal rolls back', async () => {
    const first = launch(sqlite('inbox.db'));
    const ids = ['m1', 'm2', 'm3', 'm4', 'm5'];
    Message.put(ids.map(message));
    Mailbox.set('inbox', () => ({
      ids,
      extra: undefined,
      next: undefined,
      hasMore: false,
      visited: [],
      updatedAt: 1,
      origin: 'network',
    }));
    await first.flush();

    environment.setOnline(false);
    const calls = [star('m1', true), markRead('m2', true), archive('m3'), remove('m4'), pin('m5')];
    expect(Mailbox.get('inbox')?.ids).toEqual(['m5', 'm1', 'm2']);
    await kill(first, calls);
    expect(started()).toEqual([]);
    expect(storedCalls('inbox.db').map((call) => call.name)).toEqual([
      'inbox.star',
      'inbox.read',
      'inbox.archive',
      'inbox.delete',
      'inbox.pin',
    ]);

    // The app starts again, still offline.
    const second = launch(sqlite('inbox.db'));
    await nextFrames();
    // The replay read what the calls changed: no screen has read anything yet.
    expect(Message.get('m1')?.starred).toBe(true);
    expect(Message.get('m2')?.read).toBe(true);
    expect(Message.get('m5')?.pinned).toBe(true);
    expect(Mailbox.get('inbox')?.ids).toEqual(['m5', 'm1', 'm2']);
    expect(actionStatus(second)).toEqual({ pending: 0, paused: 5 });
    expect(started()).toEqual([]);

    server.refused.add('archive m3');
    environment.setOnline(true);
    await idle(second);
    expect(started()).toEqual([
      'start star m1',
      'start read m2',
      'start archive m3',
      'start delete m4',
      'start pin m5',
    ]);
    // The refused archive rolled back; the rest are written into the server copy.
    expect(Mailbox.get('inbox')?.ids).toEqual(['m5', 'm1', 'm2', 'm3']);
    expect(second.listSlot(Mailbox.definition, 'inbox')?.base?.ids).toEqual([
      'm5',
      'm1',
      'm2',
      'm3',
    ]);
    expect(second.slot(Message.definition, 'm1')?.base?.starred).toBe(true);
    await second.close();
    expect(storedCalls('inbox.db')).toEqual([]);
  });

  it('Atlas: a review written and deleted offline reaches the server in that order', async () => {
    launch(sqlite('atlas.db'));
    environment.setOnline(false);
    const calls = [writeReview({ id: 'r1', text: 'Great shop' }), deleteReview('r1')];
    expect(OwnReviews.get('mine')).toBeUndefined();
    await kill(stores[0] as Store, calls);

    const second = launch(sqlite('atlas.db'));
    await nextFrames();
    expect(actionStatus(second)).toEqual({ pending: 0, paused: 2 });
    // The write is slow: the delete still waits for it.
    server.latency = 20;
    environment.setOnline(true);
    await idle(second);
    expect(server.log).toEqual([
      'start write r1',
      'done write r1',
      'start delete r1',
      'done delete r1',
    ]);
  });

  it('Alia: an email-alerts change made offline is replayed after a restart (IndexedDB)', async () => {
    const name = 'outbox-alia';
    const first = launch(indexedDbPersister(name));
    Settings.set({ emailAlerts: true, digest: 'weekly' });
    await first.flush();
    environment.setOnline(false);
    const call = setEmailAlerts(false);
    expect(Settings.get()).toEqual({ emailAlerts: false, digest: 'weekly' });
    await kill(first, [call]);

    const second = launch(indexedDbPersister(name));
    await nextFrames();
    await Settings.load();
    expect(Settings.get()).toEqual({ emailAlerts: false, digest: 'weekly' });
    environment.setOnline(true);
    await idle(second);
    expect(started()).toEqual(['start emailAlerts false']);
    await second.close();

    const third = launch(indexedDbPersister(name));
    await nextFrames();
    await Settings.load();
    expect(Settings.get()).toEqual({ emailAlerts: false, digest: 'weekly' });
    expect(actionStatus(third)).toEqual({ pending: 0, paused: 0 });
    expect(started()).toEqual(['start emailAlerts false']);
  });

  it('keeps a call whose answer a restart cut off, and runs it again', async () => {
    const first = launch(sqlite('inflight.db'));
    Message.put(message('m1'));
    let answer!: () => void;
    server.gate = new Promise<void>((resolve) => {
      answer = resolve;
    });
    const call = star('m1', true);
    // The request is out, its answer not back, when the app is killed.
    await nextFrames();
    expect(started()).toEqual(['start star m1']);
    await first.close();
    server.gate = undefined;
    answer();
    // The late answer reaches a closed store: nothing is applied or written.
    await call;

    const second = launch(sqlite('inflight.db'));
    await nextFrames();
    await Message.load(['m1']);
    expect(Message.get('m1')?.starred).toBe(true);
    await idle(second);
    expect(started()).toEqual(['start star m1', 'start star m1']);
    await second.close();
    expect(storedCalls('inflight.db')).toEqual([]);
  });

  it("never replays one account's calls in another", async () => {
    const accounts = createAccounts({ persister: (account) => sqlite(`${account}.db`) });
    accounts.open('alice');
    environment.setOnline(false);
    const call = star('m1', true);
    await nextFrames();
    accounts.open('bob');
    await expect(call).rejects.toBeInstanceOf(StoreClosedError);
    const bob = accounts.store as Store;
    await nextFrames();
    environment.setOnline(true);
    await idle(bob);
    expect(started()).toEqual([]);
    expect(storedCalls('bob.db')).toEqual([]);

    const alice = accounts.open('alice');
    await nextFrames();
    await idle(alice);
    expect(started()).toEqual(['start star m1']);
    await accounts.close();
  });

  it('never runs a queued call after its account was left', async () => {
    const accounts = createAccounts({ persister: (account) => sqlite(`${account}.db`) });
    accounts.open('alice');
    let answer!: () => void;
    server.gate = new Promise<void>((resolve) => {
      answer = resolve;
    });
    // The first is at the server; the second waits for its turn.
    const first = star('m1', true);
    const second = markRead('m2', true);
    await nextFrames();
    accounts.open('bob');
    answer();
    await first;
    await expect(second).rejects.toBeInstanceOf(StoreClosedError);
    expect(started()).toEqual(['start star m1']);
    await accounts.close();
  });

  it('drops a call whose action an app update removed', async () => {
    const file = 'update.db';
    const persister = sqlite(file);
    await persister.open({ versions: { 'bloom-outbox': 1 }, maxAgeMs: 1e9, keep: [] });
    const entry = (name: string, args: unknown[]) => ({
      id: name,
      name,
      args,
      at: 1,
      layer: { records: [], lists: [] },
    });
    await persister.write({
      records: [
        {
          type: 'bloom-outbox',
          id: 'calls',
          json: JSON.stringify({
            id: 'calls',
            calls: [entry('inbox.retired', ['m1']), entry('inbox.read', ['m2', true])],
          }),
        },
      ],
      lists: [],
    });
    await persister.close();

    const store = launch(sqlite(file));
    await nextFrames();
    await idle(store);
    expect(started()).toEqual(['start read m2']);
    await store.close();
    expect(storedCalls(file)).toEqual([]);
  });

  it('leaves no outbox entry behind a call that settles', async () => {
    const store = launch(sqlite('settled.db'));
    Message.put(message('m1'));
    await expect(star('m1', true)).resolves.toEqual({ ok: true });
    await store.close();
    expect(storedCalls('settled.db')).toEqual([]);
  });

  it('refuses two durable actions with one name', () => {
    expect(() => action({ name: 'inbox.star', durable: true, run: async () => undefined })).toThrow(
      "two durable actions are named 'inbox.star'",
    );
    expect(() => action({ durable: true, run: async () => undefined })).toThrow('needs a name');
  });
});
