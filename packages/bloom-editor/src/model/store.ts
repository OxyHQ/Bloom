/**
 * The editor store: the document, the selection, and the one path every edit
 * takes — `dispatch(transaction)`.
 *
 * Listeners on `onTransaction` see every applied transaction with its origin,
 * which is how persistence (REST today, a CRDT later) follows the document
 * without diffing it. `subscribe`/`getSnapshot` fit React's
 * `useSyncExternalStore`.
 */
import type { CommandContext, IdFactory } from './commands';
import type { Block, EditorDocument } from './document';
import { History, type HistoryOptions } from './history';
import {
  applyTransaction,
  type EditorSelection,
  invertTransaction,
  type Transaction,
} from './operations';
import { DEFAULT_SCHEMA, type Schema } from './schema';

/**
 * Where a transaction came from. `local` edits enter the undo history;
 * `remote` ones (another collaborator, a server refresh) do not; `history`
 * is an undo or redo being applied.
 */
export type TransactionOrigin = 'local' | 'remote' | 'history';

export type TransactionListener = (tx: Transaction, origin: TransactionOrigin) => void;

export interface EditorSnapshot {
  doc: EditorDocument;
  selection: EditorSelection | null;
  canUndo: boolean;
  canRedo: boolean;
}

export interface EditorStoreOptions {
  document: EditorDocument;
  schema?: Schema;
  newId: IdFactory;
  /** Hides a block's children from keyboard navigation (closed toggles). */
  isCollapsed?: (block: Block) => boolean;
  history?: HistoryOptions;
}

export type Command = (ctx: CommandContext) => Transaction | null;

export class EditorStore {
  readonly schema: Schema;
  /** Mints block ids (and, by default, sync transaction keys). */
  readonly newId: IdFactory;
  private readonly isCollapsed: (block: Block) => boolean;
  private readonly history: History;
  private snapshot: EditorSnapshot;
  private readonly listeners = new Set<() => void>();
  private readonly transactionListeners = new Set<TransactionListener>();

  constructor(options: EditorStoreOptions) {
    this.schema = options.schema ?? DEFAULT_SCHEMA;
    this.newId = options.newId;
    this.isCollapsed = options.isCollapsed ?? ((block) => block.props.expanded === false);
    this.history = new History(options.history);
    this.snapshot = { doc: options.document, selection: null, canUndo: false, canRedo: false };
  }

  readonly subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  readonly getSnapshot = (): EditorSnapshot => this.snapshot;

  get doc(): EditorDocument {
    return this.snapshot.doc;
  }

  get selection(): EditorSelection | null {
    return this.snapshot.selection;
  }

  /** Follow every applied transaction (persistence, collaboration, analytics). */
  onTransaction(listener: TransactionListener): () => void {
    this.transactionListeners.add(listener);
    return () => this.transactionListeners.delete(listener);
  }

  /** The context commands read: current document, schema and id factory. */
  context(): CommandContext {
    return { doc: this.doc, schema: this.schema, newId: this.newId, isCollapsed: this.isCollapsed };
  }

  /** Run a command; returns whether it changed anything. */
  run(command: Command): boolean {
    return this.dispatch(command(this.context()));
  }

  dispatch(tx: Transaction | null, origin: TransactionOrigin = 'local'): boolean {
    if (!tx || tx.ops.length === 0) {
      if (tx?.selectionAfter !== undefined) this.setSelection(tx.selectionAfter);
      return false;
    }
    const doc = applyTransaction(this.doc, tx);
    if (origin === 'local') this.history.record(tx);
    const selection =
      origin === 'remote'
        ? this.snapshot.selection
        : tx.selectionAfter !== undefined
          ? tx.selectionAfter
          : this.snapshot.selection;
    this.commit({ doc, selection });
    for (const listener of this.transactionListeners) listener(tx, origin);
    return true;
  }

  setSelection(selection: EditorSelection | null): void {
    if (selection === this.snapshot.selection) return;
    this.commit({ doc: this.doc, selection });
  }

  /** Close the current typing group (on blur, on caret jumps). */
  sealHistory(): void {
    this.history.seal();
  }

  undo(): boolean {
    const tx = this.history.popUndo();
    if (!tx) return false;
    return this.applyHistory(invertTransaction(tx));
  }

  redo(): boolean {
    const tx = this.history.popRedo();
    if (!tx) return false;
    return this.applyHistory(tx);
  }

  /**
   * Replace the whole document (initial load, a full server refresh). Clears
   * the history, whose operations describe the old document.
   */
  reset(doc: EditorDocument): void {
    this.history.clear();
    this.commit({ doc, selection: null });
  }

  private applyHistory(tx: Transaction): boolean {
    try {
      const doc = applyTransaction(this.doc, tx);
      this.commit({ doc, selection: tx.selectionAfter ?? this.snapshot.selection });
      for (const listener of this.transactionListeners) listener(tx, 'history');
      return true;
    } catch {
      // A remote edit changed what this entry describes; it can no longer be
      // undone safely, and neither can anything older.
      this.history.clear();
      this.commit({ doc: this.doc, selection: this.snapshot.selection });
      return false;
    }
  }

  private commit(next: { doc: EditorDocument; selection: EditorSelection | null }): void {
    this.snapshot = {
      doc: next.doc,
      selection: next.selection,
      canUndo: this.history.canUndo,
      canRedo: this.history.canRedo,
    };
    for (const listener of this.listeners) listener();
  }
}
