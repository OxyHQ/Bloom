/**
 * Block snapshots: a nested, id-free JSON form of blocks.
 *
 * One format serves the clipboard, templates, duplication across pages, and
 * import/export: transformers convert other formats (Markdown, HTML, a Notion
 * export) to and from snapshots, and inserting a snapshot is one transaction.
 */
import { segmentsToPlainText, type Segment } from '@oxy.so/bloom-text/model';
import type { IdFactory } from './commands';
import {
  type Block,
  type BlockId,
  childrenOf,
  type EditorDocument,
  getBlock,
} from './document';
import type { Transaction } from './operations';
import { placeAfter, propsFor, type Schema, specOf } from './schema';

export interface BlockSnapshot {
  type: string;
  text?: Segment[];
  props?: Record<string, unknown>;
  children?: BlockSnapshot[];
}

/** Snapshot the given blocks (with their subtrees), in the order given. */
export function exportSnapshot(doc: EditorDocument, ids: readonly BlockId[]): BlockSnapshot[] {
  const visit = (id: BlockId): BlockSnapshot => {
    const block = getBlock(doc, id);
    const snapshot: BlockSnapshot = { type: block.type };
    if (block.text) snapshot.text = block.text;
    if (Object.keys(block.props).length > 0) snapshot.props = { ...block.props };
    if (block.children.length > 0) snapshot.children = block.children.map(visit);
    return snapshot;
  };
  return ids.map(visit);
}

/** The whole document as a snapshot. */
export function documentToSnapshot(doc: EditorDocument): BlockSnapshot[] {
  return exportSnapshot(doc, doc.root);
}

/**
 * Build a document from a snapshot, minting ids. With a schema, each block's
 * props are completed and restricted as the schema says (`propsFor`).
 */
export function documentFromSnapshot(
  snapshot: readonly BlockSnapshot[],
  newId: IdFactory,
  schema?: Schema,
): EditorDocument {
  const blocks: Record<BlockId, Block> = {};
  const build = (node: BlockSnapshot, parent: BlockId | null): BlockId => {
    const id = newId();
    const props = schema ? propsFor(specOf(schema, node.type), node.props) : { ...node.props };
    const block: Block = { id, type: node.type, parent, props, children: [] };
    if (node.text) block.text = node.text;
    blocks[id] = block;
    blocks[id] = { ...block, children: (node.children ?? []).map((child) => build(child, id)) };
    return id;
  };
  const root = snapshot.map((node) => build(node, null));
  return { root, blocks };
}

/**
 * Insert a snapshot after `afterId` (at the end of the document when null),
 * as one transaction. Returns null for an empty snapshot. With a schema,
 * props follow it as in `documentFromSnapshot`.
 */
export function insertSnapshot(
  doc: EditorDocument,
  snapshot: readonly BlockSnapshot[],
  afterId: BlockId | null,
  newId: IdFactory,
  schema?: Schema,
): Transaction | null {
  if (snapshot.length === 0) return null;
  // Pasted into a table cell, the blocks go after the table, not into its row.
  const { parent, index } = placeAfter(
    doc,
    schema ?? {},
    afterId,
    snapshot.map((s) => s.type),
  );
  const inserted = documentFromSnapshot(snapshot, newId, schema);
  const ops = inserted.root.map((topId, i) => {
    const subtree: Block[] = [];
    const collect = (id: BlockId, p: BlockId | null) => {
      const block = inserted.blocks[id];
      if (!block) return;
      subtree.push({ ...block, parent: p });
      for (const child of block.children) collect(child, id);
    };
    collect(topId, parent);
    const after =
      i === 0
        ? index > 0
          ? (childrenOf(doc, parent)[index - 1] ?? null)
          : null
        : (inserted.root[i - 1] ?? null);
    return { kind: 'insert' as const, parent, after, blocks: subtree };
  });
  const ids = inserted.root;
  return { ops, selectionBefore: null, selectionAfter: { kind: 'blocks', ids } };
}

function inlineMarkdown(segments: readonly Segment[] | undefined): string {
  if (!segments) return '';
  return segments
    .map((seg) => {
      let text = seg.text;
      if (seg.code) text = `\`${text}\``;
      if (seg.bold) text = `**${text}**`;
      if (seg.italic) text = `_${text}_`;
      if (seg.strike) text = `~~${text}~~`;
      if (seg.link) text = `[${text}](${seg.link})`;
      return text;
    })
    .join('');
}

/** Render a snapshot as Markdown (export, copy as text). */
export function snapshotToMarkdown(snapshot: readonly BlockSnapshot[]): string {
  const lines: string[] = [];
  const visit = (nodes: readonly BlockSnapshot[], depth: number) => {
    let number = 0;
    for (const node of nodes) {
      const indent = '  '.repeat(depth);
      const text = inlineMarkdown(node.text);
      number = node.type === 'numbered_list_item' ? number + 1 : 0;
      switch (node.type) {
        case 'heading_1':
          lines.push(`# ${text}`);
          break;
        case 'heading_2':
          lines.push(`## ${text}`);
          break;
        case 'heading_3':
          lines.push(`### ${text}`);
          break;
        case 'bulleted_list_item':
          lines.push(`${indent}- ${text}`);
          break;
        case 'numbered_list_item':
          lines.push(`${indent}${number}. ${text}`);
          break;
        case 'todo':
          lines.push(`${indent}- [${node.props?.checked ? 'x' : ' '}] ${text}`);
          break;
        case 'quote':
          lines.push(`> ${text}`);
          break;
        case 'code':
          lines.push(
            `\`\`\`${String(node.props?.language ?? '')}`,
            segmentsToPlainText(node.text ?? []),
            '```',
          );
          break;
        case 'divider':
          lines.push('---');
          break;
        default:
          lines.push(`${indent}${text}`);
      }
      if (node.children) visit(node.children, depth + 1);
    }
  };
  visit(snapshot, 0);
  return `${lines.join('\n')}\n`;
}
