/**
 * Editing commands. Each reads the document and returns the transaction that
 * performs one user action — or null when the action does not apply — so the
 * keyboard, menus, AI and tests all edit through the same code.
 *
 * The behaviour follows Notion: Return splits and continues lists, an empty
 * list item leaves the list, Backspace at the start reverts a styled block to
 * a paragraph before merging, Tab nests under the previous sibling, and
 * Shift-Tab adopts the following siblings.
 */
import {
  applyMarks,
  applyTextEdit,
  segmentsToPlainText,
  splitSegmentsAt,
  type Segment,
  type TextEdit,
  type TextMarks,
} from '@oxy.so/bloom-text/model';
import {
  type Block,
  type BlockId,
  childrenOf,
  type EditorDocument,
  getBlock,
  isWithin,
  positionOf,
  readingOrder,
  subtreeIds,
} from './document';
import type { EditorSelection, Operation, Transaction } from './operations';
import { anchorAt, anchorOf, applyOperation } from './operations';
import {
  acceptsChildren,
  canHold,
  isToggle,
  parentOf,
  placeAfter,
  propsFor,
  type Schema,
  specOf,
} from './schema';

export type IdFactory = () => BlockId;

export interface CommandContext {
  doc: EditorDocument;
  schema: Schema;
  newId: IdFactory;
  /** Hides children of collapsed blocks from navigation (closed toggles). */
  isCollapsed?: (block: Block) => boolean;
}

const caret = (blockId: BlockId, offset: number): EditorSelection => ({
  kind: 'text',
  blockId,
  start: offset,
  end: offset,
});

/**
 * Builds a transaction against a working copy, so each operation is computed
 * from the state the previous ones produced.
 */
class Builder {
  ops: Operation[] = [];
  constructor(public doc: EditorDocument) {}
  push(op: Operation): void {
    this.doc = applyOperation(this.doc, op);
    this.ops.push(op);
  }
  update(
    id: BlockId,
    after: { type?: string; text?: Segment[]; props?: Readonly<Record<string, unknown>> },
  ): void {
    const block = getBlock(this.doc, id);
    const before: typeof after = {};
    if ('type' in after) before.type = block.type;
    if ('text' in after) before.text = block.text;
    if ('props' in after) before.props = block.props;
    this.push({ kind: 'update', id, before, after });
  }
  /** Move `id` to `parent[index]`, counted without `id` in the list. */
  move(id: BlockId, parent: BlockId | null, index: number): void {
    const from = anchorOf(this.doc, id);
    this.push({ kind: 'move', id, from, to: anchorAt(this.doc, parent, index, id) });
  }
  insert(block: Block, index: number): void {
    this.push({ kind: 'insert', ...anchorAt(this.doc, block.parent, index), blocks: [block] });
  }
  remove(id: BlockId): void {
    const anchor = anchorOf(this.doc, id);
    const blocks = subtreeIds(this.doc, id).map((b) => getBlock(this.doc, b));
    this.push({ kind: 'remove', ...anchor, blocks });
  }
  /**
   * The transaction. `undefined` for a selection means "leave it as it is";
   * `null` clears it.
   */
  done(
    selectionBefore?: EditorSelection | null,
    selectionAfter?: EditorSelection | null,
  ): Transaction {
    return {
      ops: this.ops,
      ...(selectionBefore !== undefined && { selectionBefore }),
      ...(selectionAfter !== undefined && { selectionAfter }),
    };
  }
}

function newBlock(
  ctx: CommandContext,
  type: string,
  parent: BlockId | null,
  init: { text?: Segment[]; props?: Readonly<Record<string, unknown>> } = {},
): Block {
  const spec = specOf(ctx.schema, type);
  return {
    id: ctx.newId(),
    type,
    parent,
    ...(spec.hasText && { text: init.text ?? [] }),
    props: propsFor(spec, init.props),
    children: [],
  };
}

function textOf(block: Block): Segment[] {
  return block.text ?? [];
}

function lengthOf(block: Block): number {
  return segmentsToPlainText(textOf(block)).length;
}

/** The previous block on screen that carries text, skipping hidden children. */
export function previousTextBlock(ctx: CommandContext, id: BlockId): BlockId | null {
  const order = readingOrder(ctx.doc, ctx.isCollapsed);
  for (let i = order.indexOf(id) - 1; i >= 0; i -= 1) {
    const candidate = order[i];
    if (candidate && specOf(ctx.schema, getBlock(ctx.doc, candidate).type).hasText)
      return candidate;
  }
  return null;
}

/** The next block on screen that carries text. */
export function nextTextBlock(ctx: CommandContext, id: BlockId): BlockId | null {
  const order = readingOrder(ctx.doc, ctx.isCollapsed);
  for (let i = order.indexOf(id) + 1; i < order.length; i += 1) {
    const candidate = order[i];
    if (candidate && specOf(ctx.schema, getBlock(ctx.doc, candidate).type).hasText)
      return candidate;
  }
  return null;
}

/** Replace a block's text after an edit in its input. */
export function editText(
  ctx: CommandContext,
  id: BlockId,
  next: Segment[],
  selectionAfter?: EditorSelection,
): Transaction {
  const b = new Builder(ctx.doc);
  b.update(id, { text: next });
  return b.done(undefined, selectionAfter);
}

/** Apply one text edit to a block, keeping marks outside it. */
export function applyEdit(ctx: CommandContext, id: BlockId, edit: TextEdit): Transaction {
  const block = getBlock(ctx.doc, id);
  const next = applyTextEdit(textOf(block), edit);
  const end = edit.index + edit.insert.length;
  return editText(ctx, id, next, caret(id, end));
}

/** Set or clear marks on `[start, end)` of a block's text. */
export function formatText(
  ctx: CommandContext,
  id: BlockId,
  start: number,
  end: number,
  marks: { [K in keyof TextMarks]?: TextMarks[K] | null },
): Transaction | null {
  if (start >= end) return null;
  const block = getBlock(ctx.doc, id);
  const sel: EditorSelection = { kind: 'text', blockId: id, start, end };
  const b = new Builder(ctx.doc);
  b.update(id, { text: applyMarks(textOf(block), start, end, marks) });
  return b.done(sel, sel);
}

/** Merge `patch` into a block's props (`undefined` removes a key). */
export function setProps(
  ctx: CommandContext,
  id: BlockId,
  patch: Record<string, unknown>,
): Transaction {
  const block = getBlock(ctx.doc, id);
  const props: Record<string, unknown> = { ...block.props };
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) delete props[key];
    else props[key] = value;
  }
  const spec = specOf(ctx.schema, block.type);
  const b = new Builder(ctx.doc);
  b.update(id, {
    props: spec.props ? propsFor({ ...spec, defaultProps: undefined }, props) : props,
  });
  // A heading no longer a toggle hands its children to the following position.
  if (block.children.length > 0 && !acceptsChildren(ctx.schema, getBlock(b.doc, id))) {
    const { parent, index } = positionOf(b.doc, id);
    block.children.forEach((child, i) => {
      b.move(child, parent, index + 1 + i);
    });
  }
  return b.done();
}

/**
 * Whether `id` can become `type` without losing anything: a type without text
 * (an image, a divider) only takes a block whose text is empty.
 */
export function canTurnInto(
  ctx: Pick<CommandContext, 'doc' | 'schema'>,
  id: BlockId,
  type: string,
): boolean {
  const block = getBlock(ctx.doc, id);
  return specOf(ctx.schema, type).hasText || lengthOf(block) === 0;
}

/**
 * Change a block's type, keeping its text and props (so turning a to-do into a
 * paragraph and back keeps `checked`, as Notion does) unless the new type
 * lists the props it keeps. The new type's default props fill gaps; text is
 * added or kept per the new type. Refused (null) when the new type has no
 * text and the block has some: it would be gone once the document is saved.
 */
export function turnInto(ctx: CommandContext, id: BlockId, type: string): Transaction | null {
  const block = getBlock(ctx.doc, id);
  if (block.type === type || !canTurnInto(ctx, id, type)) return null;
  if (!canHold(ctx.schema, parentOf(ctx.doc, id), type)) return null;
  const spec = specOf(ctx.schema, type);
  const b = new Builder(ctx.doc);
  const after: { type: string; text?: Segment[]; props?: Readonly<Record<string, unknown>> } = {
    type,
  };
  if (spec.hasText && !block.text) after.text = [];
  if (spec.defaultProps || spec.props) after.props = propsFor(spec, block.props);
  b.update(id, after);
  // A type that cannot hold children hands them to the following position.
  if (!acceptsChildren(ctx.schema, getBlock(b.doc, id)) && block.children.length > 0) {
    const { parent, index } = positionOf(b.doc, id);
    block.children.forEach((child, i) => {
      b.move(child, parent, index + 1 + i);
    });
  }
  const sel = spec.hasText ? caret(id, lengthOf(getBlock(b.doc, id))) : null;
  return b.done(null, sel);
}

/** Insert a new block after `afterId` (or at the end when null). */
export function insertBlockAfter(
  ctx: CommandContext,
  afterId: BlockId | null,
  type: string,
  init: { text?: Segment[]; props?: Readonly<Record<string, unknown>> } = {},
): Transaction {
  const b = new Builder(ctx.doc);
  const { parent, index } = placeAfter(ctx.doc, ctx.schema, afterId, [type]);
  const block = newBlock(ctx, type, parent, init);
  b.insert(block, index);
  const sel = specOf(ctx.schema, type).hasText
    ? caret(block.id, 0)
    : { kind: 'blocks' as const, ids: [block.id] };
  return b.done(null, sel);
}

/**
 * Add a block as the last child of `parentId` (into an empty container, at
 * the end of a note). Null when that block takes no children.
 */
export function appendChild(
  ctx: CommandContext,
  parentId: BlockId,
  type: string,
  init: { text?: Segment[]; props?: Readonly<Record<string, unknown>> } = {},
): Transaction | null {
  const parent = getBlock(ctx.doc, parentId);
  if (!acceptsChildren(ctx.schema, parent)) return null;
  const b = new Builder(ctx.doc);
  const block = newBlock(ctx, type, parentId, init);
  b.insert(block, parent.children.length);
  const sel = specOf(ctx.schema, type).hasText
    ? caret(block.id, 0)
    : { kind: 'blocks' as const, ids: [block.id] };
  return b.done(null, sel);
}

/**
 * Return in a text block with the caret at `offset`.
 *
 * - In an empty list-like block: leave it — outdent when nested, else revert
 *   to a paragraph.
 * - Otherwise split the text. The tail goes to a new block of the type the
 *   spec continues as (lists continue, headings give a paragraph); a split
 *   in the middle keeps the type on both halves. When the block shows
 *   children, the new block becomes its first child.
 */
export function splitBlock(ctx: CommandContext, id: BlockId, offset: number): Transaction | null {
  const block = getBlock(ctx.doc, id);
  const spec = specOf(ctx.schema, block.type);
  if (!spec.hasText || spec.multiline) return null;
  const length = lengthOf(block);

  if (length === 0 && spec.exitOnEmptyReturn) {
    return outdent(ctx, id) ?? turnInto(ctx, id, 'paragraph');
  }

  const [head, tail] = splitSegmentsAt(textOf(block), offset);
  const atEnd = offset >= length;
  const collapsed = ctx.isCollapsed?.(block) ?? false;
  // Return at the end of an open toggle (or toggle heading) writes inside it, as in Notion.
  const intoToggle = atEnd && isToggle(ctx.schema, block) && !collapsed;
  const continueType = intoToggle
    ? 'paragraph'
    : atEnd
      ? (spec.continueAs ?? 'paragraph')
      : block.type;
  const continueSpec = specOf(ctx.schema, continueType);
  const inheritedProps: Record<string, unknown> =
    continueType === block.type ? { ...block.props } : {};
  for (const key of continueSpec.resetOnContinue ?? []) delete inheritedProps[key];

  const b = new Builder(ctx.doc);
  if (!atEnd) b.update(id, { text: head });

  const showsChildren = intoToggle || (block.children.length > 0 && !collapsed);
  const created = newBlock(ctx, continueType, showsChildren ? id : block.parent, {
    text: atEnd ? [] : tail,
    props: { ...continueSpec.defaultProps, ...inheritedProps },
  });
  if (showsChildren) {
    b.insert(created, 0);
  } else {
    const { index } = positionOf(b.doc, id);
    b.insert(created, index + 1);
  }
  return b.done(caret(id, offset), caret(created.id, 0));
}

/**
 * Backspace with the caret at the very start of a text block.
 *
 * Reverts a styled block to a paragraph, then outdents a nested paragraph,
 * then merges the paragraph into the previous text block (its children move
 * to that block). An empty block after a non-text block (divider, image)
 * removes the empty block.
 */
export function backspaceAtStart(ctx: CommandContext, id: BlockId): Transaction | null {
  const block = getBlock(ctx.doc, id);
  const spec = specOf(ctx.schema, block.type);
  if (spec.revertOnBackspace && block.type !== 'paragraph') {
    const reverted = turnInto(ctx, id, 'paragraph');
    // The caret stays where it was: at the start.
    return reverted && { ...reverted, selectionAfter: caret(id, 0) };
  }

  if (
    block.parent !== null &&
    !specOf(ctx.schema, getBlock(ctx.doc, block.parent).type).isContainer
  ) {
    const out = outdent(ctx, id);
    if (out) return out;
  }

  const previous = previousTextBlock(ctx, id);
  if (previous === null) return null;
  const target = getBlock(ctx.doc, previous);
  const joinAt = lengthOf(target);

  const b = new Builder(ctx.doc);
  b.update(previous, { text: [...textOf(target), ...textOf(block)] });
  const targetTakes = acceptsChildren(ctx.schema, target);
  const children = [...block.children];
  children.forEach((child, i) => {
    if (targetTakes) b.move(child, previous, getBlock(b.doc, previous).children.length);
    else {
      const { parent, index } = positionOf(b.doc, id);
      b.move(child, parent, index + 1 + i);
    }
  });
  b.remove(id);
  return b.done(caret(id, 0), caret(previous, joinAt));
}

/** Delete with the caret at the end: pull the next text block's text in. */
export function deleteAtEnd(ctx: CommandContext, id: BlockId): Transaction | null {
  const next = nextTextBlock(ctx, id);
  if (next === null) return null;
  return mergeInto(ctx, id, next);
}

function mergeInto(ctx: CommandContext, into: BlockId, from: BlockId): Transaction {
  const target = getBlock(ctx.doc, into);
  const source = getBlock(ctx.doc, from);
  const joinAt = lengthOf(target);
  const b = new Builder(ctx.doc);
  b.update(into, { text: [...textOf(target), ...textOf(source)] });
  for (const child of [...source.children]) {
    const { parent, index } = positionOf(b.doc, from);
    b.move(child, parent, index + 1);
  }
  b.remove(from);
  return b.done(caret(into, joinAt), caret(into, joinAt));
}

/** Tab: nest the block as the last child of its previous sibling. */
export function indent(
  ctx: CommandContext,
  id: BlockId,
  selection: EditorSelection | null = null,
): Transaction | null {
  const { parent, index } = positionOf(ctx.doc, id);
  if (index === 0) return null;
  if (
    parent !== null &&
    specOf(ctx.schema, getBlock(ctx.doc, parent).type).isContainer &&
    getBlock(ctx.doc, parent).type !== 'column'
  ) {
    return null;
  }
  const previous = childrenOf(ctx.doc, parent)[index - 1];
  if (!previous) return null;
  const previousBlock = getBlock(ctx.doc, previous);
  const previousSpec = specOf(ctx.schema, previousBlock.type);
  if (!acceptsChildren(ctx.schema, previousBlock) || previousSpec.isContainer) return null;
  const b = new Builder(ctx.doc);
  b.move(id, previous, previousBlock.children.length);
  if (previousBlock.props.expanded === false)
    b.update(previous, { props: { ...previousBlock.props, expanded: true } });
  return b.done(selection ?? undefined, selection ?? undefined);
}

/**
 * Shift-Tab: move the block to just after its parent. Its following siblings
 * become its children, so the visual order does not change.
 */
export function outdent(
  ctx: CommandContext,
  id: BlockId,
  selection: EditorSelection | null = null,
): Transaction | null {
  const block = getBlock(ctx.doc, id);
  if (block.parent === null) return null;
  const parent = getBlock(ctx.doc, block.parent);
  if (specOf(ctx.schema, parent.type).isContainer) return null;
  const { index } = positionOf(ctx.doc, id);
  const following = parent.children.slice(index + 1);
  const { parent: grandparent, index: parentIndex } = positionOf(ctx.doc, parent.id);

  const b = new Builder(ctx.doc);
  b.move(id, grandparent, parentIndex + 1);
  if (following.length > 0 && acceptsChildren(ctx.schema, block)) {
    for (const sibling of following) b.move(sibling, id, getBlock(b.doc, id).children.length);
  }
  const sel = selection ?? (specOf(ctx.schema, block.type).hasText ? caret(id, 0) : null);
  return b.done(sel, sel);
}

/** Top-level blocks of a selection: drop any block whose ancestor is also selected. */
function selectionRoots(doc: EditorDocument, ids: readonly BlockId[]): BlockId[] {
  const set = new Set(ids);
  const roots = ids.filter((id) => {
    let parent = getBlock(doc, id).parent;
    while (parent !== null) {
      if (set.has(parent)) return false;
      parent = getBlock(doc, parent).parent;
    }
    return true;
  });
  const order = readingOrder(doc);
  return roots.sort((a, b) => order.indexOf(a) - order.indexOf(b));
}

/** Delete blocks (and their subtrees). Focus lands on the text block before them. */
export function removeBlocks(ctx: CommandContext, ids: readonly BlockId[]): Transaction | null {
  const roots = selectionRoots(ctx.doc, ids);
  if (roots.length === 0) return null;
  const first = roots[0];
  const focus = first ? previousTextBlock(ctx, first) : null;
  const b = new Builder(ctx.doc);
  for (const id of roots) b.remove(id);
  const sel = focus ? caret(focus, lengthOf(getBlock(b.doc, focus))) : null;
  return b.done({ kind: 'blocks', ids: roots }, sel);
}

/** Copy blocks (with their subtrees) to just after the last of them. */
export function duplicateBlocks(ctx: CommandContext, ids: readonly BlockId[]): Transaction | null {
  const roots = selectionRoots(ctx.doc, ids);
  const last = roots[roots.length - 1];
  if (!last) return null;
  const b = new Builder(ctx.doc);
  const { parent, index } = positionOf(ctx.doc, last);
  const copies: BlockId[] = [];
  roots.forEach((id, i) => {
    const subtree = cloneSubtree(ctx, ctx.doc, id, parent);
    b.push({ kind: 'insert', ...anchorAt(b.doc, parent, index + 1 + i), blocks: subtree });
    const top = subtree[0];
    if (top) copies.push(top.id);
  });
  return b.done({ kind: 'blocks', ids: roots }, { kind: 'blocks', ids: copies });
}

/** A copy of a subtree with fresh ids, parents before children. */
export function cloneSubtree(
  ctx: CommandContext,
  doc: EditorDocument,
  id: BlockId,
  parent: BlockId | null,
): Block[] {
  const out: Block[] = [];
  const visit = (sourceId: BlockId, newParent: BlockId | null): BlockId => {
    const source = getBlock(doc, sourceId);
    const id = ctx.newId();
    // Reserve the parent's slot first, so the list stays parents-first.
    const slot = out.length;
    out.push(source);
    const children = source.children.map((child) => visit(child, id));
    out[slot] = { ...source, id, parent: newParent, children };
    return id;
  };
  visit(id, parent);
  return out;
}

export type DropPosition = 'before' | 'after' | 'inside';

/**
 * Move blocks next to (or into) `target`, keeping their relative order.
 * Returns null when the move would place a block inside itself.
 */
export function moveBlocks(
  ctx: CommandContext,
  ids: readonly BlockId[],
  target: BlockId,
  position: DropPosition,
): Transaction | null {
  const roots = selectionRoots(ctx.doc, ids);
  if (roots.length === 0) return null;
  if (roots.some((id) => isWithin(ctx.doc, target, id))) return null;
  if (position === 'inside' && !acceptsChildren(ctx.schema, getBlock(ctx.doc, target))) return null;
  // A row stays in its table, a cell in its row, and nothing else goes in.
  const destination = position === 'inside' ? getBlock(ctx.doc, target) : parentOf(ctx.doc, target);
  if (roots.some((id) => !canHold(ctx.schema, destination, getBlock(ctx.doc, id).type)))
    return null;

  const b = new Builder(ctx.doc);
  for (const [i, id] of roots.entries()) {
    if (position === 'inside') {
      // The last slot, counted after the block leaves its current list.
      const from = positionOf(b.doc, id);
      const length = getBlock(b.doc, target).children.length;
      const last = from.parent === target ? length - 1 : length;
      if (from.parent === target && from.index === last) continue;
      b.move(id, target, last);
      continue;
    }
    const anchor = i === 0 ? target : roots[i - 1];
    if (!anchor) continue;
    const { parent, index } = positionOf(b.doc, anchor);
    const insertAt = position === 'before' && i === 0 ? index : index + 1;
    const from = positionOf(b.doc, id);
    // Removal from the same parent ahead of the anchor shifts the anchor left.
    const adjusted = from.parent === parent && from.index < insertAt ? insertAt - 1 : insertAt;
    if (from.parent === parent && from.index === adjusted) continue;
    b.move(id, parent, adjusted);
  }
  if (b.ops.length === 0) return null;
  return b.done({ kind: 'blocks', ids: roots }, { kind: 'blocks', ids: roots });
}

/**
 * Run commands in sequence as one transaction (one undo step): each sees the
 * document the previous ones produced. A command returning null is skipped.
 * Null when none applied.
 */
export function composeCommands(
  ctx: CommandContext,
  commands: readonly ((ctx: CommandContext) => Transaction | null)[],
): Transaction | null {
  let doc = ctx.doc;
  const ops: Operation[] = [];
  let selectionBefore: EditorSelection | null | undefined;
  let selectionAfter: EditorSelection | null | undefined;
  for (const command of commands) {
    const tx = command({ ...ctx, doc });
    if (!tx) continue;
    for (const op of tx.ops) {
      doc = applyOperation(doc, op);
      ops.push(op);
    }
    if (selectionBefore === undefined) selectionBefore = tx.selectionBefore;
    if (tx.selectionAfter !== undefined) selectionAfter = tx.selectionAfter;
  }
  if (ops.length === 0) return null;
  return { ops, selectionBefore: selectionBefore ?? null, selectionAfter: selectionAfter ?? null };
}
