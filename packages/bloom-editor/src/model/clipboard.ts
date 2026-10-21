import { applyTransaction } from './operations';
import { pasteIntoBlock } from './paste';
import type { Schema } from './schema';
import { type BlockSnapshot, documentFromSnapshot, documentToSnapshot } from './snapshot';

/**
 * Whether the currently supported plain-text paste can reconstruct this entire
 * selection. This is deliberately conservative: losing a property, child, mark
 * or attachment must prevent Cut, even when the text looks useful on its own.
 * Uses a separate document, never the editor being copied from.
 */
export function canCutAsMarkdown(
  snapshot: readonly BlockSnapshot[],
  text: string,
  schema: Schema,
): boolean {
  if (!snapshot.length || text.length > 1_000_000) return false;
  const pending = snapshot.map((node) => ({ node, depth: 1 }));
  let count = 0;
  while (pending.length) {
    const next = pending.pop();
    if (!next) break;
    if (++count > 2_000 || next.depth > 64) return false;
    for (const node of next.node.children ?? []) pending.push({ node, depth: next.depth + 1 });
  }
  if (JSON.stringify(snapshot).length > 1_000_000) return false;
  let sequence = 0;
  const newId = () => `clipboard-${++sequence}`;
  const source = documentFromSnapshot(snapshot, newId, schema);
  const empty = documentFromSnapshot([{ type: 'paragraph', text: [] }], newId, schema);
  const id = empty.root[0];
  if (!id) return false;
  const transaction = pasteIntoBlock({ doc: empty, schema, newId }, id, [{ text }], {
    index: 0,
    deleteCount: 0,
    insert: text,
  });
  return (
    transaction !== null &&
    JSON.stringify(documentToSnapshot(source)) ===
      JSON.stringify(documentToSnapshot(applyTransaction(empty, transaction)))
  );
}
