/**
 * Undo history. Each entry is a transaction; undo applies its inverse.
 *
 * Typing is grouped: consecutive text edits to the same block within
 * `groupWindowMs` merge into one entry, so undo removes a word or a phrase,
 * not a character.
 */
import type { Operation, Transaction } from './operations';

interface Entry {
  tx: Transaction;
  at: number;
  textBlock: string | null;
}

export interface HistoryOptions {
  limit?: number;
  groupWindowMs?: number;
}

/** The block a transaction only edits the text of, or null. */
function onlyTextOf(tx: Transaction): string | null {
  let id: string | null = null;
  for (const op of tx.ops) {
    if (op.kind !== 'update' || !('text' in op.after) || 'type' in op.after || 'props' in op.after)
      return null;
    if (id !== null && id !== op.id) return null;
    id = op.id;
  }
  return id;
}

function mergeTransactions(first: Transaction, second: Transaction): Transaction {
  // Two text replacements of one block collapse into one: the first's
  // `before` and the second's `after`.
  const firstOp = first.ops[0];
  const lastOp = second.ops[second.ops.length - 1];
  let ops: Operation[];
  if (firstOp?.kind === 'update' && lastOp?.kind === 'update') {
    ops = [{ kind: 'update', id: firstOp.id, before: firstOp.before, after: lastOp.after }];
  } else {
    ops = [...first.ops, ...second.ops];
  }
  return { ops, selectionBefore: first.selectionBefore, selectionAfter: second.selectionAfter };
}

export class History {
  private undoStack: Entry[] = [];
  private redoStack: Transaction[] = [];
  private readonly limit: number;
  private readonly groupWindowMs: number;

  constructor(options: HistoryOptions = {}) {
    this.limit = options.limit ?? 500;
    this.groupWindowMs = options.groupWindowMs ?? 750;
  }

  record(tx: Transaction, now: number = Date.now()): void {
    if (tx.ops.length === 0) return;
    this.redoStack = [];
    const textBlock = onlyTextOf(tx);
    const last = this.undoStack[this.undoStack.length - 1];
    if (
      last &&
      textBlock !== null &&
      last.textBlock === textBlock &&
      now - last.at <= this.groupWindowMs
    ) {
      last.tx = mergeTransactions(last.tx, tx);
      last.at = now;
      return;
    }
    this.undoStack.push({ tx, at: now, textBlock });
    if (this.undoStack.length > this.limit) this.undoStack.shift();
  }

  /** Close the current typing group, so the next edit starts a new entry. */
  seal(): void {
    const last = this.undoStack[this.undoStack.length - 1];
    if (last) last.textBlock = null;
  }

  /** The transaction to undo; moves it to the redo stack. */
  popUndo(): Transaction | null {
    const entry = this.undoStack.pop();
    if (!entry) return null;
    this.redoStack.push(entry.tx);
    return entry.tx;
  }

  /** The transaction to redo; moves it back to the undo stack. */
  popRedo(): Transaction | null {
    const tx = this.redoStack.pop();
    if (!tx) return null;
    this.undoStack.push({ tx, at: 0, textBlock: null });
    return tx;
  }

  get canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  get canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
  }
}
