/**
 * Keeping a store in step with a server that orders transactions.
 *
 * The server numbers every transaction it applies (the document version) and
 * pushes each one to the other collaborators. This session:
 *
 * - sends local transactions in order, one in flight at a time;
 * - applies remote transactions in version order;
 * - keeps the document equal to "server state up to the last contiguous
 *   version, plus local transactions on top". A local transaction stays on
 *   top until every version before its own has arrived — an acknowledgement
 *   (over HTTP) can overtake an earlier remote change (over the socket);
 * - rebases when a remote transaction arrives under local ones: takes them
 *   off, applies the remote one, puts them back on — as one change, so
 *   nothing flickers. One that no longer applies is dropped (the server
 *   refuses it too).
 */
import type { EditorDocument } from './document';
import {
  applyOperation,
  invertTransaction,
  type Operation,
  rebaseOperations,
  type Transaction,
} from './operations';
import type { EditorStore, TransactionOrigin } from './store';

export type SendResult =
  | { ok: true; version: number }
  /** `retry`: a network or server failure worth trying again; otherwise the server refused it. */
  | { ok: false; retry: boolean };

export interface SyncTransport {
  /**
   * Send one transaction. `before` is the document it applies to — the
   * server's state as this client knows it plus the local transactions sent
   * ahead of it — for transports that place blocks by their neighbours.
   * `key` names the transaction and is the same on every retry of it, so a
   * server can answer a retry whose first attempt it already applied (the
   * response was lost) instead of applying it twice.
   */
  send(tx: Transaction, before: EditorDocument, key: string): Promise<SendResult>;
}

/** A transaction another collaborator applied, as the server reports it. */
export interface RemoteTransaction {
  version: number;
  /** Builds the editor operations against the document they apply to. */
  toOperations: (doc: EditorDocument) => Operation[];
}

export type SyncStatus = 'saved' | 'saving' | 'offline' | 'error';

export interface SyncSessionOptions {
  /** The server's version of the document the store was loaded from. */
  version: number;
  /** Delay before retrying a failed send; doubles up to 30s. */
  retryDelayMs?: number;
  /**
   * Mints transaction keys (`SyncTransport.send`). They must be unique among
   * everyone's transactions on the document; defaults to the store's id
   * factory, which mints block ids with that guarantee.
   */
  newKey?: () => string;
  onStatus?: (status: SyncStatus) => void;
  /** The server refused a local transaction; the session has undone it. */
  onRejected?: (tx: Transaction) => void;
  /**
   * Remote changes can no longer be reconciled locally (a skipped version, a
   * transaction that does not apply): the app should reload the document.
   */
  onDesync?: (reason: string) => void;
  /**
   * Corrections for servers whose notion of position is not the editor's
   * anchors (sibling order by number): two collaborators inserting into the
   * same gap are ordered by the server, while a rebased local insert lands
   * by its anchor. Called after every remote change and whenever every local
   * change is confirmed; return moves that put the document in the server's
   * order. They are local only (the server already has that order).
   */
  reconcile?: (doc: EditorDocument) => Operation[];
}

interface Entry {
  tx: Transaction;
  /** Stable across retries; see `SyncTransport.send`. */
  key: string;
  /** The version the server gave it, once acknowledged. */
  acked?: number;
}

function tryApply(doc: EditorDocument, ops: readonly Operation[]): EditorDocument | null {
  let next = doc;
  try {
    for (const op of ops) next = applyOperation(next, op);
    return next;
  } catch {
    return null;
  }
}

export class SyncSession {
  /** Local transactions not yet folded into the contiguous server state, oldest first. */
  private entries: Entry[] = [];
  /** Remote transactions that arrived ahead of a gap, by version. */
  private early = new Map<number, RemoteTransaction>();
  private sending: Entry | null = null;
  private version: number;
  private status: SyncStatus = 'saved';
  private retryDelay: number;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly unsubscribe: () => void;
  private disposed = false;

  constructor(
    private readonly store: EditorStore,
    private readonly transport: SyncTransport,
    private readonly options: SyncSessionOptions,
  ) {
    this.version = options.version;
    this.retryDelay = options.retryDelayMs ?? 1000;
    this.unsubscribe = store.onTransaction((tx, origin) => this.onLocal(tx, origin));
  }

  private newKey(): string {
    return (this.options.newKey ?? this.store.newId)();
  }

  /** The last server version the document reflects contiguously. */
  get currentVersion(): number {
    return this.version;
  }

  /** Whether local changes are still waiting for the server. */
  get hasPending(): boolean {
    return this.entries.some((entry) => entry.acked === undefined);
  }

  dispose(): void {
    this.disposed = true;
    this.unsubscribe();
    if (this.retryTimer) clearTimeout(this.retryTimer);
  }

  private setStatus(status: SyncStatus): void {
    if (status === this.status) return;
    this.status = status;
    this.options.onStatus?.(status);
  }

  private onLocal(tx: Transaction, origin: TransactionOrigin): void {
    if (origin === 'remote' || tx.ops.length === 0) return;
    this.entries.push({ tx, key: this.newKey() });
    this.flush();
  }

  private flush(): void {
    if (this.disposed || this.sending || this.retryTimer) return;
    const next = this.entries.find((entry) => entry.acked === undefined);
    if (!next) {
      this.setStatus('saved');
      return;
    }
    const before = this.documentBefore(next);
    if (!before) {
      this.desync('could not rebuild the document a pending transaction applies to');
      return;
    }
    this.sending = next;
    this.setStatus('saving');
    this.transport.send(next.tx, before, next.key).then(
      (result) => this.onResult(next, result),
      () => this.onResult(next, { ok: false, retry: true }),
    );
  }

  private onResult(entry: Entry, result: SendResult): void {
    this.sending = null;
    if (this.disposed) return;
    if (!this.entries.includes(entry)) {
      // Dropped by a rebase while in flight.
      this.flush();
      return;
    }
    if (result.ok) {
      entry.acked = result.version;
      this.retryDelay = this.options.retryDelayMs ?? 1000;
      this.advance();
      this.flush();
      return;
    }
    if (result.retry) {
      this.setStatus('offline');
      this.retryTimer = setTimeout(() => {
        this.retryTimer = null;
        this.flush();
      }, this.retryDelay);
      this.retryDelay = Math.min(this.retryDelay * 2, 30_000);
      return;
    }
    this.reject(entry);
  }

  /** The server refused `entry`: undo it and every unsent change built on it. */
  private reject(entry: Entry): void {
    const index = this.entries.indexOf(entry);
    const dropped = this.entries.slice(index).filter((e) => e.acked === undefined);
    const undo: Operation[] = [];
    for (const e of [...dropped].reverse()) undo.push(...invertTransaction(e.tx).ops);
    const undone = tryApply(this.store.doc, undo);
    this.entries = this.entries.filter((e) => !dropped.includes(e));
    if (undone) this.store.dispatch({ ops: [...undo, ...this.corrections(undone)] }, 'remote');
    else this.options.onDesync?.('could not undo a refused transaction');
    this.options.onRejected?.(entry.tx);
    this.setStatus('error');
    this.flush();
  }

  /** The document `entry` applies to: the current one with it and every later entry undone. */
  private documentBefore(entry: Entry): EditorDocument | null {
    let doc: EditorDocument | null = this.store.doc;
    const index = this.entries.indexOf(entry);
    for (let i = this.entries.length - 1; i >= index; i -= 1) {
      const later = this.entries[i];
      if (!later || !doc) return null;
      doc = tryApply(doc, invertTransaction(later.tx).ops);
    }
    return doc;
  }

  /**
   * The `reconcile` moves for `doc`, when they apply (anchored operations
   * survive any reordering, so pending entries still undo exactly).
   */
  private corrections(doc: EditorDocument): Operation[] {
    if (!this.options.reconcile) return [];
    const ops = this.options.reconcile(doc);
    return ops.length > 0 && tryApply(doc, ops) ? ops : [];
  }

  /** Fold acknowledged entries whose versions are next in line into the base. */
  private advance(): void {
    for (;;) {
      const expected = this.version + 1;
      const head = this.entries[0];
      if (head?.acked === expected) {
        this.entries.shift();
        this.version = expected;
        // Everything confirmed: put the document in the server's order.
        if (this.entries.length === 0) {
          const corrections = this.corrections(this.store.doc);
          if (corrections.length > 0) this.store.dispatch({ ops: corrections }, 'remote');
        }
        continue;
      }
      const early = this.early.get(expected);
      if (early) {
        this.early.delete(expected);
        this.applyRemote(early);
        continue;
      }
      return;
    }
  }

  /** A transaction another collaborator made. */
  receiveRemote(remote: RemoteTransaction): void {
    if (this.disposed || remote.version <= this.version) return;
    if (remote.version !== this.version + 1) {
      // A gap: either our own acknowledged transaction fills it, or a
      // remote one is still on its way. Hold this one until it is next.
      this.early.set(remote.version, remote);
      if (this.early.size > 100) {
        this.early.clear();
        this.options.onDesync?.(`missing version ${this.version + 1}`);
      }
      return;
    }
    this.applyRemote(remote);
    this.advance();
  }

  private applyRemote(remote: RemoteTransaction): void {
    // Take the local entries off, newest first.
    let doc: EditorDocument | null = this.store.doc;
    const ops: Operation[] = [];
    for (const entry of [...this.entries].reverse()) {
      const inverse = invertTransaction(entry.tx).ops;
      doc = tryApply(doc, inverse);
      if (!doc) {
        this.desync('could not take local changes off for a remote one');
        return;
      }
      ops.push(...inverse);
    }

    const remoteOps = remote.toOperations(doc);
    doc = tryApply(doc, remoteOps);
    if (!doc) {
      this.desync(`remote version ${remote.version} does not apply`);
      return;
    }
    ops.push(...remoteOps);
    this.version = remote.version;

    // Put them back on top, re-recorded against what they now apply to (so a
    // later rebase undoes them exactly). One that no longer applies is gone;
    // acknowledged ones always apply (the server applied them after this).
    const kept: Entry[] = [];
    const dropped: Entry[] = [];
    for (const entry of this.entries) {
      const rebased = rebaseOperations(doc, entry.tx.ops);
      if (rebased) {
        doc = rebased.doc;
        ops.push(...rebased.ops);
        entry.tx = { ...entry.tx, ops: rebased.ops };
        kept.push(entry);
      } else if (entry.acked !== undefined) {
        this.desync('an acknowledged local change no longer applies');
        return;
      } else {
        dropped.push(entry);
      }
    }
    this.entries = kept;
    const corrections = this.corrections(doc);
    ops.push(...corrections);
    if (ops.length > 0) this.store.dispatch({ ops }, 'remote');
    // Superseded by someone else's change: as good as refused.
    for (const entry of dropped) this.options.onRejected?.(entry.tx);
  }

  private desync(reason: string): void {
    this.entries = [];
    this.early.clear();
    this.options.onDesync?.(reason);
  }
}
