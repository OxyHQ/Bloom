/**
 * Atomic operations and transactions.
 *
 * Every user action becomes a transaction: a list of operations applied
 * together, the way Notion groups its record operations. Each operation
 * carries the state it replaces, so inverting it (undo) needs no document and
 * a persistence adapter can translate it without diffing.
 *
 * Positions are anchors — "under this parent, after that sibling" — never
 * indices, as Notion's `listAfter` is: an operation replayed after someone
 * else's concurrent change still lands next to the block it was placed by.
 * An anchor that no longer exists puts the block at the end of its parent.
 */
import { mergeText, type Segment, segmentsEqual } from '@oxy.so/bloom-text/model';
import {
  type Block,
  type BlockId,
  childrenOf,
  type EditorDocument,
  getBlock,
  isWithin,
  subtreeIds,
} from './document';

/** The fields an update can change. A present key is set; `text: undefined` removes the text. */
export interface BlockFields {
  type?: string;
  text?: Segment[] | undefined;
  props?: Readonly<Record<string, unknown>>;
}

/** A place in the tree: under `parent` (the root when null), right after `after` (first when null). */
export interface Anchor {
  parent: BlockId | null;
  after: BlockId | null;
}

export type Operation =
  /** Insert a subtree, `blocks[0]` at the anchor, the rest its descendants. */
  | ({ kind: 'insert'; blocks: Block[] } & Anchor)
  /** Remove a subtree; `blocks` and the anchor are what the inverse restores. */
  | ({ kind: 'remove'; blocks: Block[] } & Anchor)
  /** Move a block and its subtree. */
  | { kind: 'move'; id: BlockId; from: Anchor; to: Anchor }
  | { kind: 'update'; id: BlockId; before: BlockFields; after: BlockFields };

/** Where the caret or selection is: in one block's text, or over whole blocks. */
export type EditorSelection =
  | { kind: 'text'; blockId: BlockId; start: number; end: number }
  | { kind: 'blocks'; ids: readonly BlockId[] };

export interface Transaction {
  ops: readonly Operation[];
  selectionBefore?: EditorSelection | null;
  selectionAfter?: EditorSelection | null;
}

/** The anchor a block currently sits at. */
export function anchorOf(doc: EditorDocument, id: BlockId): Anchor {
  const { parent } = getBlock(doc, id);
  const siblings = childrenOf(doc, parent);
  const index = siblings.indexOf(id);
  return { parent, after: index > 0 ? (siblings[index - 1] ?? null) : null };
}

/** The anchor for `parent[index]` in `doc`, as if `moving` were not in the list. */
export function anchorAt(
  doc: EditorDocument,
  parent: BlockId | null,
  index: number,
  moving?: BlockId,
): Anchor {
  const siblings = childrenOf(doc, parent).filter((id) => id !== moving);
  return { parent, after: index > 0 ? (siblings[index - 1] ?? null) : null };
}

function indexFor(siblings: readonly BlockId[], after: BlockId | null): number {
  if (after === null) return 0;
  const at = siblings.indexOf(after);
  return at < 0 ? siblings.length : at + 1;
}

function withChildren(
  root: readonly BlockId[],
  blocks: Record<BlockId, Block>,
  parent: BlockId | null,
  children: BlockId[],
): readonly BlockId[] {
  if (parent === null) return children;
  const block = blocks[parent];
  if (!block) throw new Error(`Unknown parent ${parent}`);
  blocks[parent] = { ...block, children };
  return root;
}

function requireParent(doc: EditorDocument, parent: BlockId | null): void {
  if (parent !== null && !doc.blocks[parent]) throw new Error(`Unknown parent ${parent}`);
}

/** Apply one operation. Throws when it cannot apply to this document. */
export function applyOperation(doc: EditorDocument, op: Operation): EditorDocument {
  const blocks: Record<BlockId, Block> = { ...doc.blocks };
  switch (op.kind) {
    case 'insert': {
      const [top] = op.blocks;
      if (!top) throw new Error('Insert of an empty subtree');
      requireParent(doc, op.parent);
      for (const block of op.blocks) {
        if (blocks[block.id]) throw new Error(`Block ${block.id} already exists`);
        blocks[block.id] = block.id === top.id ? { ...block, parent: op.parent } : block;
      }
      const siblings = childrenOf(doc, op.parent).slice();
      siblings.splice(indexFor(siblings, op.after), 0, top.id);
      return { root: withChildren(doc.root, blocks, op.parent, siblings), blocks };
    }
    case 'remove': {
      const [top] = op.blocks;
      if (!top) throw new Error('Remove of an empty subtree');
      const current = getBlock(doc, top.id);
      // Delete what is there now, including children added concurrently.
      for (const id of subtreeIds(doc, top.id)) delete blocks[id];
      const siblings = childrenOf(doc, current.parent).filter((id) => id !== top.id);
      return { root: withChildren(doc.root, blocks, current.parent, siblings), blocks };
    }
    case 'move': {
      const moving = getBlock(doc, op.id);
      requireParent(doc, op.to.parent);
      if (op.to.parent !== null && isWithin(doc, op.to.parent, op.id)) {
        throw new Error(`Cannot move ${op.id} inside itself`);
      }
      const fromSiblings = childrenOf(doc, moving.parent).filter((id) => id !== op.id);
      let root = withChildren(doc.root, blocks, moving.parent, fromSiblings);
      const interim: EditorDocument = { root, blocks };
      const toSiblings = childrenOf(interim, op.to.parent).slice();
      toSiblings.splice(indexFor(toSiblings, op.to.after), 0, op.id);
      root = withChildren(root, blocks, op.to.parent, toSiblings);
      blocks[op.id] = { ...(blocks[op.id] ?? moving), parent: op.to.parent };
      return { root, blocks };
    }
    case 'update': {
      const block = getBlock(doc, op.id);
      const next: Block = { ...block };
      if ('type' in op.after && op.after.type !== undefined) next.type = op.after.type;
      if ('props' in op.after && op.after.props !== undefined) next.props = op.after.props;
      if ('text' in op.after) {
        if (op.after.text === undefined) delete next.text;
        else next.text = op.after.text;
      }
      blocks[op.id] = next;
      return { root: doc.root, blocks };
    }
  }
}

export function invertOperation(op: Operation): Operation {
  switch (op.kind) {
    case 'insert':
      return { kind: 'remove', parent: op.parent, after: op.after, blocks: op.blocks };
    case 'remove':
      return { kind: 'insert', parent: op.parent, after: op.after, blocks: op.blocks };
    case 'move':
      return { kind: 'move', id: op.id, from: op.to, to: op.from };
    case 'update':
      return { kind: 'update', id: op.id, before: op.after, after: op.before };
  }
}

export function applyTransaction(doc: EditorDocument, tx: Transaction): EditorDocument {
  let next = doc;
  for (const op of tx.ops) next = applyOperation(next, op);
  return next;
}

export function invertTransaction(tx: Transaction): Transaction {
  return {
    ops: tx.ops.map(invertOperation).reverse(),
    ...(tx.selectionAfter !== undefined && { selectionBefore: tx.selectionAfter }),
    ...(tx.selectionBefore !== undefined && { selectionAfter: tx.selectionBefore }),
  };
}

/**
 * The same operations, re-recorded against `doc`: each one's "before" state
 * (old fields, removed subtree, origin anchor) is read from the document it
 * now applies to, so inverting it later restores what was really there.
 * A text change made against an older text is merged into the block's text
 * as it is now (`mergeText`): someone else's words in the same block stay.
 * Returns null when an operation no longer applies.
 */
export function rebaseOperations(
  doc: EditorDocument,
  ops: readonly Operation[],
): { ops: Operation[]; doc: EditorDocument } | null {
  let current = doc;
  const out: Operation[] = [];
  try {
    for (const op of ops) {
      let next: Operation = op;
      if (op.kind === 'update') {
        const block = getBlock(current, op.id);
        const before: BlockFields = {};
        if ('type' in op.after) before.type = block.type;
        if ('text' in op.after) before.text = block.text;
        if ('props' in op.after) before.props = block.props;
        let after = op.after;
        if (
          op.after.text !== undefined &&
          op.before.text !== undefined &&
          block.text !== undefined &&
          !segmentsEqual(op.before.text, block.text)
        ) {
          after = { ...op.after, text: mergeText(op.before.text, op.after.text, block.text) };
        }
        next = { ...op, before, after };
      } else if (op.kind === 'remove') {
        const top = op.blocks[0];
        if (!top) return null;
        const anchor = anchorOf(current, top.id);
        next = {
          kind: 'remove',
          ...anchor,
          blocks: subtreeIds(current, top.id).map((id) => getBlock(current, id)),
        };
      } else if (op.kind === 'move') {
        next = { ...op, from: anchorOf(current, op.id) };
      }
      current = applyOperation(current, next);
      out.push(next);
    }
  } catch {
    return null;
  }
  return { ops: out, doc: current };
}
