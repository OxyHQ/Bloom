/**
 * The document: a normalized block tree.
 *
 * Every block is addressed by id, knows its parent, and lists its children in
 * order — the shape Notion uses (an upward `parent` pointer for permissions
 * and lookups, a downward `children` array for order). Documents are
 * immutable; operations return a new document that shares every block they
 * did not touch.
 */
import type { Segment } from '@oxy.so/bloom-text/model';

export type BlockId = string;

export interface Block {
  id: BlockId;
  type: string;
  /** The parent block, or null for a top-level block. */
  parent: BlockId | null;
  /** Inline text, for block types that carry it. */
  text?: Segment[];
  /** Type-specific data: `checked`, `expanded`, `url`, `color`, `language`… */
  props: Readonly<Record<string, unknown>>;
  /** Children in order. */
  children: readonly BlockId[];
}

export interface EditorDocument {
  /** Top-level blocks in order. */
  root: readonly BlockId[];
  blocks: Readonly<Record<BlockId, Block>>;
}

export function emptyDocument(): EditorDocument {
  return { root: [], blocks: {} };
}

export function getBlock(doc: EditorDocument, id: BlockId): Block {
  const block = doc.blocks[id];
  if (!block) throw new Error(`Unknown block ${id}`);
  return block;
}

/** The ordered ids under `parent` (the document root when null). */
export function childrenOf(doc: EditorDocument, parent: BlockId | null): readonly BlockId[] {
  return parent === null ? doc.root : getBlock(doc, parent).children;
}

export interface Position {
  parent: BlockId | null;
  index: number;
}

export function positionOf(doc: EditorDocument, id: BlockId): Position {
  const { parent } = getBlock(doc, id);
  const index = childrenOf(doc, parent).indexOf(id);
  if (index < 0) throw new Error(`Block ${id} is not listed under its parent`);
  return { parent, index };
}

/** `id` and every block under it, depth-first, parents before children. */
export function subtreeIds(doc: EditorDocument, id: BlockId): BlockId[] {
  const out: BlockId[] = [];
  const visit = (current: BlockId) => {
    out.push(current);
    for (const child of getBlock(doc, current).children) visit(child);
  };
  visit(id);
  return out;
}

/** Whether `ancestor` is `id` or contains it. */
export function isWithin(doc: EditorDocument, id: BlockId, ancestor: BlockId): boolean {
  let current: BlockId | null = id;
  while (current !== null) {
    if (current === ancestor) return true;
    current = getBlock(doc, current).parent;
  }
  return false;
}

/** Number of ancestors: 0 for a top-level block. */
export function depthOf(doc: EditorDocument, id: BlockId): number {
  let depth = 0;
  let parent = getBlock(doc, id).parent;
  while (parent !== null) {
    depth += 1;
    parent = getBlock(doc, parent).parent;
  }
  return depth;
}

/**
 * Every block in reading order (depth-first). `isCollapsed` hides a block's
 * children, the way a closed toggle does on screen.
 */
export function readingOrder(
  doc: EditorDocument,
  isCollapsed: (block: Block) => boolean = () => false,
): BlockId[] {
  const out: BlockId[] = [];
  const visit = (ids: readonly BlockId[]) => {
    for (const id of ids) {
      out.push(id);
      const block = getBlock(doc, id);
      if (block.children.length > 0 && !isCollapsed(block)) visit(block.children);
    }
  };
  visit(doc.root);
  return out;
}

/**
 * Consistency check for tests and imports: every parent pointer matches the
 * children array that lists it, every listed id exists, nothing is listed
 * twice. Returns the problems found (empty when consistent).
 */
export function validateDocument(doc: EditorDocument): string[] {
  const problems: string[] = [];
  const seen = new Set<BlockId>();
  const check = (parent: BlockId | null, ids: readonly BlockId[]) => {
    for (const id of ids) {
      const block = doc.blocks[id];
      if (!block) {
        problems.push(`${id} is listed but missing`);
        continue;
      }
      if (seen.has(id)) problems.push(`${id} is listed twice`);
      seen.add(id);
      if (block.parent !== parent)
        problems.push(`${id} has parent ${block.parent}, listed under ${parent}`);
      check(id, block.children);
    }
  };
  check(null, doc.root);
  for (const id of Object.keys(doc.blocks)) {
    if (!seen.has(id)) problems.push(`${id} is not reachable from the root`);
  }
  return problems;
}
