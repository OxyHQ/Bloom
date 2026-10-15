import {
  anchorOf,
  applyOperation,
  type BlockId,
  documentFromSnapshot,
  documentToSnapshot,
  type EditorDocument,
  EditorStore,
  getBlock,
  indent,
  insertBlockAfter,
  type Operation,
  rebaseOperations,
  removeBlocks,
  splitBlock,
  type Transaction,
  validateDocument,
} from '../index';
import { type SendResult, SyncSession } from '../sync';

/**
 * A server that orders transactions: it applies each one to its own document
 * (re-recorded against it, as the real server re-validates) or refuses it,
 * and pushes what it applied to everyone else.
 */
class FakeServer {
  doc: EditorDocument;
  version = 0;
  clients: { session: SyncSession; id: string; inbox: (() => void)[] }[] = [];
  /** Acknowledgements waiting to be delivered, per client. */
  acks = new Map<string, (() => void)[]>();
  /** Versions of applied transactions by key, to answer retries. */
  applied = new Map<string, number>();
  /** Lose the response to the next transaction applied (once). */
  loseNextResponse = false;

  constructor(doc: EditorDocument) {
    this.doc = doc;
  }

  receive(clientId: string, tx: Transaction, key?: string): Promise<SendResult> {
    const seen = key === undefined ? undefined : this.applied.get(key);
    if (seen !== undefined) return Promise.resolve({ ok: true, version: seen });
    const applied = rebaseOperations(this.doc, tx.ops);
    if (!applied) return Promise.resolve({ ok: false, retry: false });
    this.doc = applied.doc;
    this.version += 1;
    const version = this.version;
    if (key !== undefined) this.applied.set(key, version);
    const ops = applied.ops;
    for (const client of this.clients) {
      if (client.id === clientId) continue;
      client.inbox.push(() =>
        client.session.receiveRemote({
          version,
          toOperations: (doc) => rebaseOperations(doc, ops)?.ops ?? [],
        }),
      );
    }
    if (this.loseNextResponse) {
      this.loseNextResponse = false;
      return Promise.resolve({ ok: false, retry: true });
    }
    return new Promise((resolve) => {
      const queue = this.acks.get(clientId) ?? [];
      queue.push(() => resolve({ ok: true, version }));
      this.acks.set(clientId, queue);
    });
  }
}

let seq = 0;
function makeClient(server: FakeServer, id: string) {
  const store = new EditorStore({ document: server.doc, newId: () => `${id}-${++seq}` });
  const client = {
    id,
    store,
    inbox: [] as (() => void)[],
    session: null as unknown as SyncSession,
  };
  client.session = new SyncSession(
    store,
    { send: (tx, _before, key) => server.receive(id, tx, key) },
    { version: server.version, retryDelayMs: 1 },
  );
  server.clients.push(client);
  return client;
}

/** Deliver everything outstanding in a given order. */
async function settle(server: FakeServer, order: 'remote-first' | 'acks-first' = 'remote-first') {
  for (let round = 0; round < 20; round += 1) {
    const work: (() => void)[] = [];
    const acks = [...server.acks.values()].flatMap((queue) => queue.splice(0));
    const remotes = server.clients.flatMap((c) => c.inbox.splice(0));
    if (acks.length === 0 && remotes.length === 0) return;
    if (order === 'remote-first') work.push(...remotes, ...acks);
    else work.push(...acks, ...remotes);
    for (const job of work) job();
    await new Promise((r) => setTimeout(r, 0));
  }
}

const snapshot = (doc: EditorDocument) => JSON.stringify(documentToSnapshot(doc));

function start() {
  seq = 0;
  const doc = documentFromSnapshot(
    [
      { type: 'paragraph', text: [{ text: 'one' }] },
      { type: 'paragraph', text: [{ text: 'two' }] },
      { type: 'paragraph', text: [{ text: 'three' }] },
    ],
    () => `b${++seq}`,
  );
  const server = new FakeServer(doc);
  return { server, a: makeClient(server, 'a'), b: makeClient(server, 'b') };
}

function edit(store: EditorStore, id: BlockId, text: string) {
  const block = getBlock(store.doc, id);
  store.dispatch({
    ops: [{ kind: 'update', id, before: { text: block.text }, after: { text: [{ text }] } }],
  });
}

describe('SyncSession', () => {
  it.each(['remote-first', 'acks-first'] as const)(
    'converges when two people edit different blocks (%s)',
    async (order) => {
      const { server, a, b } = start();
      edit(a.store, 'b1', 'ONE');
      edit(b.store, 'b3', 'THREE');
      await settle(server, order);
      expect(snapshot(a.store.doc)).toBe(snapshot(server.doc));
      expect(snapshot(b.store.doc)).toBe(snapshot(server.doc));
      expect(server.version).toBe(2);
    },
  );

  it.each(['remote-first', 'acks-first'] as const)(
    'resolves edits to the same block in server order (%s)',
    async (order) => {
      const { server, a, b } = start();
      edit(a.store, 'b2', 'from a');
      edit(b.store, 'b2', 'from b');
      await settle(server, order);
      expect(snapshot(a.store.doc)).toBe(snapshot(server.doc));
      expect(snapshot(b.store.doc)).toBe(snapshot(server.doc));
    },
  );

  it('sends a retry under the same key, so a lost response does not apply it twice', async () => {
    const { server, a, b } = start();
    server.loseNextResponse = true;
    a.store.run((c) => insertBlockAfter(c, 'b1', 'paragraph'));
    await new Promise((r) => setTimeout(r, 20));
    await settle(server);
    expect(server.version).toBe(1);
    expect(a.session.hasPending).toBe(false);
    expect(snapshot(a.store.doc)).toBe(snapshot(server.doc));
    expect(snapshot(b.store.doc)).toBe(snapshot(server.doc));
  });

  it('drops a local edit to a block someone else deleted', async () => {
    const { server, a, b } = start();
    const rejected: Transaction[] = [];
    a.session.dispose();
    a.session = new SyncSession(
      a.store,
      { send: (tx) => server.receive('a', tx) },
      {
        version: 0,
        onRejected: (tx) => rejected.push(tx),
      },
    );
    // Both act before hearing from the other: b deletes, a edits the same block.
    b.store.run((c) => removeBlocks(c, ['b2']));
    edit(a.store, 'b2', 'too late');
    await settle(server);
    expect(rejected).toHaveLength(1);
    expect(snapshot(a.store.doc)).toBe(snapshot(server.doc));
    expect(validateDocument(a.store.doc)).toEqual([]);
  });

  it('converges under interleaved structural edits from both sides', async () => {
    const { server, a, b } = start();
    a.store.run((c) => splitBlock(c, 'b1', 1));
    b.store.run((c) => insertBlockAfter(c, 'b3', 'heading_1'));
    a.store.run((c) => insertBlockAfter(c, 'b2', 'todo'));
    b.store.run((c) => removeBlocks(c, ['b1']));
    await settle(server, 'acks-first');
    for (const client of [a, b]) {
      expect(validateDocument(client.store.doc)).toEqual([]);
      expect(snapshot(client.store.doc)).toBe(snapshot(server.doc));
      expect(client.session.hasPending).toBe(false);
    }
  });
});

describe('SyncSession under random concurrent editing', () => {
  it('always converges with the server, whatever the delivery order', async () => {
    let rnd = 11;
    const random = () => {
      rnd = (rnd * 1103515245 + 12345) % 2 ** 31;
      return rnd / 2 ** 31;
    };
    const pick = <T>(items: readonly T[]): T => items[Math.floor(random() * items.length)] as T;

    for (let round = 0; round < 25; round += 1) {
      const { server, a, b } = start();
      const c = makeClient(server, 'c');
      const clients = [a, b, c];
      for (let step = 0; step < 30; step += 1) {
        const client = pick(clients);
        const ids = Object.keys(client.store.doc.blocks);
        if (ids.length === 0) continue;
        const id = pick(ids);
        const action = pick(['edit', 'split', 'insert', 'remove', 'indent', 'deliver'] as const);
        if (action === 'edit') edit(client.store, id, `t${step}`);
        else if (action === 'split') client.store.run((ctx) => splitBlock(ctx, id, 1));
        else if (action === 'insert') client.store.run((ctx) => insertBlockAfter(ctx, id, 'todo'));
        else if (action === 'remove' && ids.length > 1)
          client.store.run((ctx) => removeBlocks(ctx, [id]));
        else if (action === 'indent') client.store.run((ctx) => indent(ctx, id));
        // Deliver a random share of what is in flight, in random order.
        const jobs = [
          ...[...server.acks.values()].flatMap((queue) =>
            queue.splice(0, Math.floor(random() * (queue.length + 1))),
          ),
          ...clients.flatMap((cl) =>
            cl.inbox.splice(0, Math.floor(random() * (cl.inbox.length + 1))),
          ),
        ].sort(() => random() - 0.5);
        for (const job of jobs) job();
        await new Promise((r) => setTimeout(r, 0));
      }
      await settle(server);
      for (const client of clients) {
        expect(validateDocument(client.store.doc)).toEqual([]);
        expect(snapshot(client.store.doc)).toBe(snapshot(server.doc));
      }
    }
  });
});

describe('SyncSession with a server that orders siblings itself', () => {
  /** Moves that sort the top level by id: the server's order in this test. */
  const sortRoot = (doc: EditorDocument): Operation[] => {
    const ops: Operation[] = [];
    let current = doc;
    [...doc.root].sort().forEach((id, i, wanted) => {
      if (current.root[i] === id) return;
      const op: Operation = {
        kind: 'move',
        id,
        from: anchorOf(current, id),
        to: { parent: null, after: i === 0 ? null : (wanted[i - 1] as BlockId) },
      };
      current = applyOperation(current, op);
      ops.push(op);
    });
    return ops;
  };

  it('ends in the server order, through reconcile, when both insert into the same gap', async () => {
    seq = 0;
    const doc = documentFromSnapshot(
      [{ type: 'paragraph' }, { type: 'paragraph' }],
      () => `m${++seq}`,
    );
    const server = new FakeServer(doc);
    const receive = server.receive.bind(server);
    server.receive = (clientId, tx) => {
      const result = receive(clientId, tx);
      server.doc = { ...server.doc, root: [...server.doc.root].sort() };
      return result;
    };
    const client = (id: string) => {
      const store = new EditorStore({ document: server.doc, newId: () => `${id}${++seq}` });
      const entry = {
        id,
        store,
        inbox: [] as (() => void)[],
        session: null as unknown as SyncSession,
      };
      entry.session = new SyncSession(
        store,
        { send: (tx) => server.receive(id, tx) },
        { version: server.version, reconcile: sortRoot },
      );
      server.clients.push(entry);
      return entry;
    };
    const a = client('z');
    const b = client('a');
    a.store.run((c) => insertBlockAfter(c, 'm1', 'paragraph'));
    b.store.run((c) => insertBlockAfter(c, 'm1', 'paragraph'));
    await settle(server);
    expect(a.store.doc.root).toEqual(server.doc.root);
    expect(b.store.doc.root).toEqual(server.doc.root);
  });
});
