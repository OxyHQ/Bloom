/**
 * How a document lives in a `Y.Doc`.
 *
 * One map, `blocks`, from block id to the block's own `Y.Map`:
 *
 * - `type`: string;
 * - `parent`: the parent's id, or null at the top level;
 * - `index`: a fractional key (`fractional.ts`) ordering it among its siblings;
 * - `props`: a `Y.Map`, so two people changing different properties both win;
 * - `text`: a `Y.Text`, present only for blocks that carry text.
 *
 * There are no children arrays. A block's place is written on the block alone
 * (`parent` and `index` together), so two people moving the same block at
 * once leave it in one place, never two, and nothing is ever listed twice.
 * What a tree needs and a CRDT cannot promise is settled when the document is
 * read (`materialize.ts`), the same way on every device.
 */
import * as Y from 'yjs';

export const BLOCKS_KEY = 'blocks';

export const FIELD = {
  type: 'type',
  parent: 'parent',
  index: 'index',
  props: 'props',
  text: 'text',
} as const;

export function blocksMap(doc: Y.Doc): Y.Map<Y.Map<unknown>> {
  return doc.getMap<Y.Map<unknown>>(BLOCKS_KEY);
}

export function propsOf(block: Y.Map<unknown>): Y.Map<unknown> {
  const props = block.get(FIELD.props);
  if (props instanceof Y.Map) return props;
  const created = new Y.Map<unknown>();
  block.set(FIELD.props, created);
  return created;
}

export function textOf(block: Y.Map<unknown>): Y.Text | null {
  const text = block.get(FIELD.text);
  return text instanceof Y.Text ? text : null;
}

export function parentOf(block: Y.Map<unknown>): string | null {
  const parent = block.get(FIELD.parent);
  return typeof parent === 'string' ? parent : null;
}

export function indexOf(block: Y.Map<unknown>): string {
  const index = block.get(FIELD.index);
  return typeof index === 'string' ? index : '';
}
