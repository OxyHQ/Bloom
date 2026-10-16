/**
 * Reading a `Y.Doc` as an editor document.
 *
 * Every device reads the same state the same way, so these rules give every
 * device the same tree:
 *
 * - siblings sort by `index`, then by id (two blocks given the same key at
 *   once still have one order);
 * - a block whose parent is gone (removed while someone added a child to
 *   it) is gone too, with everything under it — the removal wins;
 * - a cycle (two people each moving a block under the other) is broken at
 *   the block with the smallest id, which goes to the top level.
 *
 * Blocks that did not change keep their previous objects, so a view that
 * draws one row per block redraws only the rows that changed.
 */
import { segmentsEqual } from '@oxy.so/bloom-text/model';
import type * as Y from 'yjs';
import type { Block, BlockId, EditorDocument } from '../model/document';
import { blocksMap, FIELD, indexOf, parentOf, textOf } from './layout';
import { readSegments } from './text';

interface Decoded {
  type: string;
  parent: BlockId | null;
  index: string;
  text: Block['text'];
  props: Record<string, unknown>;
}

function decode(block: Y.Map<unknown>): Decoded {
  const type = block.get(FIELD.type);
  const props = block.get(FIELD.props) as Y.Map<unknown> | undefined;
  const text = textOf(block);
  return {
    type: typeof type === 'string' ? type : 'paragraph',
    parent: parentOf(block),
    index: indexOf(block),
    text: text ? readSegments(text) : undefined,
    props:
      props && typeof props.toJSON === 'function'
        ? (props.toJSON() as Record<string, unknown>)
        : {},
  };
}

function sameJson(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  return JSON.stringify(a) === JSON.stringify(b);
}

function sameIds(a: readonly BlockId[], b: readonly BlockId[]): boolean {
  return a.length === b.length && a.every((id, i) => id === b[i]);
}

function sameBlock(a: Block, b: Block): boolean {
  if (a.type !== b.type || a.parent !== b.parent || !sameIds(a.children, b.children)) return false;
  if ((a.text === undefined) !== (b.text === undefined)) return false;
  if (a.text && b.text && !segmentsEqual(a.text, b.text)) return false;
  const keys = new Set([...Object.keys(a.props), ...Object.keys(b.props)]);
  for (const key of keys) if (!sameJson(a.props[key], b.props[key])) return false;
  return true;
}

/** Break cycles: each loop's smallest id goes to the top level. */
function effectiveParents(decoded: ReadonlyMap<BlockId, Decoded>): Map<BlockId, BlockId | null> {
  const parent = new Map<BlockId, BlockId | null>();
  for (const [id, block] of decoded) parent.set(id, block.parent);
  const settled = new Set<BlockId>();
  for (const start of [...decoded.keys()].sort()) {
    const path: BlockId[] = [];
    const onPath = new Set<BlockId>();
    let current: BlockId | null = start;
    while (current !== null && !settled.has(current) && decoded.has(current)) {
      if (onPath.has(current)) {
        const loop = path.slice(path.indexOf(current));
        const breaker = [...loop].sort()[0] as BlockId;
        parent.set(breaker, null);
        break;
      }
      onPath.add(current);
      path.push(current);
      current = parent.get(current) ?? null;
    }
    for (const id of path) settled.add(id);
  }
  return parent;
}

/**
 * The editor document a `Y.Doc` holds. `previous` lends its block objects to
 * blocks that did not change.
 */
export function materialize(doc: Y.Doc, previous?: EditorDocument): EditorDocument {
  return new Materializer().read(doc, previous);
}

/**
 * Reads a `Y.Doc` again and again, decoding only the blocks named as changed
 * (their text above all, the costly part); the tree itself is rebuilt each
 * time, which is cheap.
 */
export class Materializer {
  private readonly decoded = new Map<BlockId, Decoded>();
  private readonly dirty = new Set<BlockId>();
  private primed = false;

  /** Note blocks that changed since the last read; they are decoded again on the next. */
  touch(ids: Iterable<BlockId>): void {
    for (const id of ids) this.dirty.add(id);
  }

  /** The document now: every block decoded the first time, then only those touched. */
  read(doc: Y.Doc, previous?: EditorDocument): EditorDocument {
    const map = blocksMap(doc);
    if (!this.primed) {
      map.forEach((block, id) => {
        this.decoded.set(id, decode(block));
      });
      this.primed = true;
    } else {
      for (const id of this.dirty) {
        const block = map.get(id);
        if (block) this.decoded.set(id, decode(block));
        else this.decoded.delete(id);
      }
    }
    this.dirty.clear();
    return build(this.decoded, previous);
  }
}

function build(decoded: ReadonlyMap<BlockId, Decoded>, previous?: EditorDocument): EditorDocument {
  const parent = effectiveParents(decoded);
  // Present: reachable from the top level through blocks that exist.
  const present = new Map<BlockId, boolean>();
  const isPresent = (id: BlockId): boolean => {
    const known = present.get(id);
    if (known !== undefined) return known;
    present.set(id, false);
    const p = parent.get(id) ?? null;
    const result = p === null ? true : decoded.has(p) && isPresent(p);
    present.set(id, result);
    return result;
  };

  const childrenOf = new Map<BlockId | null, BlockId[]>();
  for (const id of decoded.keys()) {
    if (!isPresent(id)) continue;
    const p = parent.get(id) ?? null;
    const list = childrenOf.get(p);
    if (list) list.push(id);
    else childrenOf.set(p, [id]);
  }
  const order = (a: BlockId, b: BlockId) => {
    const ia = decoded.get(a)?.index ?? '';
    const ib = decoded.get(b)?.index ?? '';
    if (ia !== ib) return ia < ib ? -1 : 1;
    return a < b ? -1 : a > b ? 1 : 0;
  };
  for (const list of childrenOf.values()) list.sort(order);

  const blocks: Record<BlockId, Block> = {};
  for (const [id, data] of decoded) {
    if (!isPresent(id)) continue;
    const block: Block = {
      id,
      type: data.type,
      parent: parent.get(id) ?? null,
      props: data.props,
      children: childrenOf.get(id) ?? [],
      ...(data.text !== undefined && { text: data.text }),
    };
    const before = previous?.blocks[id];
    blocks[id] = before && sameBlock(before, block) ? before : block;
  }
  const root = childrenOf.get(null) ?? [];
  return {
    root: previous && sameIds(previous.root, root) ? previous.root : root,
    blocks,
  };
}
