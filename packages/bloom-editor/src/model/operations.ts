/**
 * Atomic operations and transactions.
 *
 * Every user action becomes a transaction: a list of operations applied
 * together, the way Notion groups its record operations. Each operation
 * carries the state it replaces, so inverting it (undo) needs no document and
 * a persistence adapter can translate it without diffing.
 */
import type { Segment } from '@oxy.so/bloom-text/model';
import {
  type Block,
  type BlockId,
  childrenOf,
  type EditorDocument,
  getBlock,
  type Position,
} from './document';

/** The fields an update can change. A present key is set; `text: undefined` removes the text. */
export interface BlockFields {
  type?: string;
  text?: Segment[] | undefined;
  props?: Readonly<Record<string, unknown>>;
}

export type Operation =
  /** Insert a subtree: `blocks[0]` at `parent[index]`, the rest its descendants. */
  | { kind: 'insert'; parent: BlockId | null; index: number; blocks: Block[] }
  /** Remove the subtree at `parent[index]`; `blocks` is it, for the inverse. */
  | { kind: 'remove'; parent: BlockId | null; index: number; blocks: Block[] }
  /** Move a block (and its subtree). `to.index` counts after removal from `from`. */
  | { kind: 'move'; id: BlockId; from: Position; to: Position }
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

function setChildren(
  doc: EditorDocument,
  blocks: Record<BlockId, Block>,
  parent: BlockId | null,
  children: readonly BlockId[],
): readonly BlockId[] {
  if (parent === null) return children;
  blocks[parent] = { ...getBlock({ ...doc, blocks }, parent), children };
  return doc.root;
}

function splice(
  list: readonly BlockId[],
  index: number,
  remove: number,
  ...insert: BlockId[]
): BlockId[] {
  if (index < 0 || index > list.length)
    throw new Error(`Index ${index} out of range 0..${list.length}`);
  const next = list.slice();
  next.splice(index, remove, ...insert);
  return next;
}

/** Apply one operation. Throws when the document does not match it. */
export function applyOperation(doc: EditorDocument, op: Operation): EditorDocument {
  const blocks: Record<BlockId, Block> = { ...doc.blocks };
  switch (op.kind) {
    case 'insert': {
      const [top] = op.blocks;
      if (!top) throw new Error('Insert of an empty subtree');
      if (top.parent !== op.parent)
        throw new Error(
          `Inserted ${top.id} names parent ${top.parent}, inserted under ${op.parent}`,
        );
      for (const block of op.blocks) {
        if (blocks[block.id]) throw new Error(`Block ${block.id} already exists`);
        blocks[block.id] = block;
      }
      const root = setChildren(
        doc,
        blocks,
        op.parent,
        splice(childrenOf(doc, op.parent), op.index, 0, top.id),
      );
      return { root, blocks };
    }
    case 'remove': {
      const [top] = op.blocks;
      if (!top) throw new Error('Remove of an empty subtree');
      const siblings = childrenOf(doc, op.parent);
      if (siblings[op.index] !== top.id)
        throw new Error(`Block ${top.id} is not at ${op.parent ?? 'root'}[${op.index}]`);
      for (const block of op.blocks) delete blocks[block.id];
      const root = setChildren(doc, blocks, op.parent, splice(siblings, op.index, 1));
      return { root, blocks };
    }
    case 'move': {
      const moving = getBlock(doc, op.id);
      const fromSiblings = childrenOf(doc, op.from.parent);
      if (fromSiblings[op.from.index] !== op.id)
        throw new Error(`Block ${op.id} is not at its recorded position`);
      let root = setChildren(doc, blocks, op.from.parent, splice(fromSiblings, op.from.index, 1));
      const interim: EditorDocument = { root, blocks };
      root = setChildren(
        interim,
        blocks,
        op.to.parent,
        splice(childrenOf(interim, op.to.parent), op.to.index, 0, op.id),
      );
      blocks[op.id] = { ...moving, parent: op.to.parent };
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
      return { kind: 'remove', parent: op.parent, index: op.index, blocks: op.blocks };
    case 'remove':
      return { kind: 'insert', parent: op.parent, index: op.index, blocks: op.blocks };
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
    selectionBefore: tx.selectionAfter,
    selectionAfter: tx.selectionBefore,
  };
}
