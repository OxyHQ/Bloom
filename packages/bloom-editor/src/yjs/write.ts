/**
 * Writing the editor's transactions into a `Y.Doc`.
 *
 * Each operation is translated as itself: an insert creates block maps, a
 * removal deletes them, a move writes `parent`, an update writes only the
 * fields it changes (props one key at a time, text by `updateSegments`).
 * Places are then written from the document the transaction produced: the
 * blocks it placed get a key between their neighbours', and any sibling left
 * out of order (two keys chosen at once can tie) gets a new one.
 */
import * as Y from 'yjs';
import type { Block, BlockId, EditorDocument } from '../model/document';
import type { Operation, Transaction } from '../model/operations';
import { isFractionalKey, keyBetween } from './fractional';
import { blocksMap, FIELD, indexOf, parentOf, propsOf, textOf } from './layout';
import { updateSegments, writeSegments } from './text';

function sameJson(a: unknown, b: unknown): boolean {
  return a === b || JSON.stringify(a) === JSON.stringify(b);
}

function createBlock(map: Y.Map<Y.Map<unknown>>, block: Block, parent: BlockId | null): void {
  const entry = new Y.Map<unknown>();
  // Integrated first, so the nested types below belong to the document.
  map.set(block.id, entry);
  entry.set(FIELD.type, block.type);
  entry.set(FIELD.parent, parent);
  const props = new Y.Map<unknown>();
  entry.set(FIELD.props, props);
  for (const [key, value] of Object.entries(block.props)) {
    if (value !== undefined) props.set(key, value);
  }
  if (block.text !== undefined) {
    const text = new Y.Text();
    entry.set(FIELD.text, text);
    writeSegments(text, block.text);
  }
}

/** `id` and every block under it, by the `parent` fields the document holds now. */
function subtreeInDoc(map: Y.Map<Y.Map<unknown>>, id: BlockId): BlockId[] {
  const children = new Map<BlockId, BlockId[]>();
  map.forEach((block, childId) => {
    const parent = parentOf(block);
    if (parent === null) return;
    const list = children.get(parent);
    if (list) list.push(childId);
    else children.set(parent, [childId]);
  });
  const out: BlockId[] = [];
  const visit = (current: BlockId) => {
    if (out.includes(current)) return;
    out.push(current);
    for (const child of children.get(current) ?? []) visit(child);
  };
  visit(id);
  return out;
}

function writeOperation(map: Y.Map<Y.Map<unknown>>, op: Operation, placed: Set<BlockId>): void {
  switch (op.kind) {
    case 'insert': {
      const [top] = op.blocks;
      for (const block of op.blocks) {
        createBlock(map, block, block.id === top?.id ? op.parent : block.parent);
        placed.add(block.id);
      }
      return;
    }
    case 'remove': {
      const [top] = op.blocks;
      // What is there now, children added by others included: the removal wins.
      if (top) for (const id of subtreeInDoc(map, top.id)) map.delete(id);
      return;
    }
    case 'move': {
      const block = map.get(op.id);
      if (!block) return;
      block.set(FIELD.parent, op.to.parent);
      placed.add(op.id);
      return;
    }
    case 'update': {
      const block = map.get(op.id);
      if (!block) return;
      const fields = op.after;
      if (fields.type !== undefined && block.get(FIELD.type) !== fields.type) {
        block.set(FIELD.type, fields.type);
      }
      if (fields.props !== undefined) {
        const props = propsOf(block);
        for (const key of [...props.keys()]) {
          if (!(key in fields.props) || fields.props[key] === undefined) props.delete(key);
        }
        for (const [key, value] of Object.entries(fields.props)) {
          if (value !== undefined && !sameJson(props.get(key), value)) props.set(key, value);
        }
      }
      if ('text' in fields) {
        if (fields.text === undefined) {
          if (block.has(FIELD.text)) block.delete(FIELD.text);
        } else {
          const text = textOf(block);
          if (text) updateSegments(text, fields.text);
          else {
            const created = new Y.Text();
            block.set(FIELD.text, created);
            writeSegments(created, fields.text);
          }
        }
      }
      return;
    }
  }
}

/**
 * Give `parent`'s children in `after` keys in their order: each keeps its key
 * when that is still in order and it was not just placed, otherwise it gets
 * one between the previous key and the next one that is kept.
 */
function writePlaces(
  map: Y.Map<Y.Map<unknown>>,
  siblings: readonly BlockId[],
  placed: ReadonlySet<BlockId>,
): void {
  const existing = siblings.map((id) => {
    const block = map.get(id);
    if (!block || placed.has(id)) return null;
    const key = indexOf(block);
    return isFractionalKey(key) ? key : null;
  });
  let previous: string | null = null;
  siblings.forEach((id, i) => {
    const block = map.get(id);
    if (!block) return;
    const own = existing[i] ?? null;
    if (own !== null && (previous === null || own > previous)) {
      previous = own;
      return;
    }
    let bound: string | null = null;
    for (let j = i + 1; j < siblings.length; j += 1) {
      const key = existing[j] ?? null;
      if (key !== null && (previous === null || key > previous)) {
        bound = key;
        break;
      }
    }
    const key = keyBetween(previous, bound);
    if (indexOf(block) !== key) block.set(FIELD.index, key);
    previous = key;
  });
}

/**
 * Write a transaction the store applied into `doc`, as one Yjs transaction
 * tagged `origin`. `after` is the store's document once it was applied.
 */
export function writeTransaction(
  doc: Y.Doc,
  tx: Transaction,
  after: EditorDocument,
  origin: unknown,
): void {
  doc.transact(() => {
    const map = blocksMap(doc);
    const placed = new Set<BlockId>();
    for (const op of tx.ops) writeOperation(map, op, placed);
    const parents = new Set<BlockId | null>();
    for (const id of placed) {
      const block = after.blocks[id];
      if (block) parents.add(block.parent);
    }
    for (const parent of parents) {
      const siblings = parent === null ? after.root : (after.blocks[parent]?.children ?? []);
      writePlaces(map, siblings, placed);
    }
  }, origin);
}

/** Fill an empty `doc` with `document`: how a page that predates Yjs is first stored. */
export function writeDocument(doc: Y.Doc, document: EditorDocument, origin: unknown): void {
  doc.transact(() => {
    const map = blocksMap(doc);
    const visit = (parent: BlockId | null, ids: readonly BlockId[]) => {
      let previous: string | null = null;
      for (const id of ids) {
        const block = document.blocks[id];
        if (!block) continue;
        createBlock(map, block, parent);
        const key = keyBetween(previous, null);
        map.get(id)?.set(FIELD.index, key);
        previous = key;
        visit(id, block.children);
      }
    };
    visit(null, document.root);
  }, origin);
}
