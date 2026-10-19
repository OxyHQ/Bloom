/**
 * Selecting whole blocks, as Notion does: a selection runs between an anchor
 * (where it started) and a head (where Shift-click, Shift-arrow or a drag has
 * taken it), over siblings. When the two sit at different depths, each is
 * taken up to the ancestor that is a sibling of the other's, so a selection
 * is always whole blocks of one list — never half a list item's children.
 */
import {
  type Block,
  type BlockId,
  childrenOf,
  type EditorDocument,
  getBlock,
  readingOrder,
} from './document';
import { isStructural, type Schema } from './schema';

/** `id`, or — for a part of its container's layout (a cell, a row) — the container. */
export function selectableBlock(doc: EditorDocument, schema: Schema, id: BlockId): BlockId {
  let at = id;
  while (isStructural(schema, getBlock(doc, at).type)) {
    const parent = getBlock(doc, at).parent;
    if (parent === null) break;
    at = parent;
  }
  return at;
}

/** `id` and its ancestors, the top-level block last. */
function ancestry(doc: EditorDocument, id: BlockId): BlockId[] {
  const out: BlockId[] = [];
  for (let at: BlockId | null = id; at !== null; at = getBlock(doc, at).parent) out.push(at);
  return out;
}

/**
 * The blocks from `anchor` to `head`, in document order: siblings, each
 * end taken up to the level of the other.
 */
export function blockRange(
  doc: EditorDocument,
  schema: Schema,
  anchor: BlockId,
  head: BlockId,
): BlockId[] {
  const a = ancestry(doc, selectableBlock(doc, schema, anchor));
  const b = ancestry(doc, selectableBlock(doc, schema, head));
  // One holds the other: the outer one alone.
  if (a.includes(b[0] as BlockId)) return [b[0] as BlockId];
  if (b.includes(a[0] as BlockId)) return [a[0] as BlockId];
  // The ancestors of each that share a parent.
  const shared = new Set(b);
  let common: BlockId | null = null;
  for (const id of a) {
    if (shared.has(id)) {
      common = id;
      break;
    }
  }
  const under = (chain: BlockId[]) => {
    const at = common === null ? chain.length - 1 : chain.indexOf(common) - 1;
    return chain[at] as BlockId;
  };
  const from = under(a);
  const to = under(b);
  // Across a container's parts (two columns, two cells): the container.
  if (isStructural(schema, getBlock(doc, from).type)) return [selectableBlock(doc, schema, from)];
  const siblings = childrenOf(doc, getBlock(doc, from).parent);
  const i = siblings.indexOf(from);
  const j = siblings.indexOf(to);
  return siblings.slice(Math.min(i, j), Math.max(i, j) + 1);
}

/**
 * The block a selection's head moves to with an arrow key: the next block
 * after `id` and everything under it, or the previous block on screen.
 * Hidden children (a closed toggle's) are skipped; null at either end.
 */
export function blockStep(
  doc: EditorDocument,
  schema: Schema,
  id: BlockId,
  direction: 'up' | 'down',
  isCollapsed: (block: Block) => boolean = (block) => block.props.expanded === false,
): BlockId | null {
  const order = readingOrder(doc, isCollapsed).filter(
    (b) => !isStructural(schema, getBlock(doc, b).type),
  );
  const at = order.indexOf(selectableBlock(doc, schema, id));
  if (at < 0) return null;
  if (direction === 'up') return order[at - 1] ?? null;
  const within = new Set<BlockId>();
  const visit = (b: BlockId) => {
    within.add(b);
    for (const child of getBlock(doc, b).children) visit(child);
  };
  visit(order[at] as BlockId);
  for (let i = at + 1; i < order.length; i += 1) {
    const next = order[i] as BlockId;
    if (!within.has(next)) return next;
  }
  return null;
}
