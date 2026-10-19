import * as Y from 'yjs';
import {
  documentFromSnapshot,
  EditorStore,
  editText,
  emptyDocument,
  removeBlocks,
  turnInto,
} from '../../model';
import { YjsBinding } from '../binding';
import { blocksMap, textOf } from '../layout';
import { relativeToSelection, selectionToRelative } from '../selection';
import { writeDocument } from '../write';

interface Peer {
  doc: Y.Doc;
  store: EditorStore;
  binding: YjsBinding;
}

function peer(name: string, from?: Peer): Peer {
  const doc = new Y.Doc();
  if (from) Y.applyUpdate(doc, Y.encodeStateAsUpdate(from.doc));
  let n = 0;
  const newId = () => {
    n += 1;
    return `${name}-${n}`;
  };
  const store = new EditorStore({ document: emptyDocument(), newId });
  return { doc, store, binding: new YjsBinding(store, doc) };
}

function sync(...peers: Peer[]): void {
  for (const a of peers) {
    for (const b of peers) {
      if (a !== b) Y.applyUpdate(b.doc, Y.encodeStateAsUpdate(a.doc, Y.encodeStateVector(b.doc)));
    }
  }
}

/** Two peers sharing one paragraph that reads `text`. */
function pair(text: string) {
  const a = peer('a');
  let n = 0;
  const seed = documentFromSnapshot([{ type: 'paragraph', text: [{ text }] }], () => `p${++n}`);
  a.binding.dispose();
  writeDocument(a.doc, seed, 'seed');
  const seeded = { ...a, binding: new YjsBinding(a.store, a.doc) };
  const b = peer('b', seeded);
  return { a: seeded, b, id: 'p1' };
}

function plain(p: Peer, id: string): string {
  return (p.store.doc.blocks[id]?.text ?? []).map((s) => s.text).join('');
}

/** Type into a block on one peer: replace its text by `next`, as the input reports it. */
function typeInto(p: Peer, id: string, next: string): void {
  p.store.run((c) => editText(c, id, [{ text: next }]));
}

/** What a selection covers in a peer's copy of the block. */
function covered(p: Peer, selection: { blockId: string; start: number; end: number } | null) {
  return selection ? plain(p, selection.blockId).slice(selection.start, selection.end) : null;
}

describe('selectionToRelative / relativeToSelection', () => {
  it('round-trips a selection through JSON', () => {
    const { a, id } = pair('hello world');
    const relative = selectionToRelative(a.doc, { blockId: id, start: 6, end: 11 });
    expect(relative).not.toBeNull();
    const wire = JSON.parse(JSON.stringify(relative));
    expect(relativeToSelection(a.doc, wire)).toEqual({ blockId: id, start: 6, end: 11 });
  });

  it('keeps covering the same words through edits made at the same time', () => {
    const { a, b, id } = pair('hello world');
    // A selects "world" and tells B; meanwhile B rewrites the start.
    const relative = selectionToRelative(a.doc, { blockId: id, start: 6, end: 11 });
    if (!relative) throw new Error('no selection');
    typeInto(b, id, 'oh, hello big world');
    typeInto(a, id, 'hello world!');
    sync(a, b);
    expect(plain(a, id)).toBe(plain(b, id));
    const onA = relativeToSelection(a.doc, relative);
    const onB = relativeToSelection(b.doc, relative);
    expect(onA).toEqual(onB);
    expect(covered(b, onB)).toBe('world');
  });

  it('leaves text typed at either end of a range outside it', () => {
    const { a, b, id } = pair('abc');
    const relative = selectionToRelative(a.doc, { blockId: id, start: 1, end: 2 });
    if (!relative) throw new Error('no selection');
    typeInto(b, id, 'aXbc');
    typeInto(b, id, 'aXbYc');
    sync(a, b);
    expect(covered(a, relativeToSelection(a.doc, relative))).toBe('b');
  });

  it('moves a caret past text typed where it is, and keeps it a caret', () => {
    const { a, b, id } = pair('abc');
    const relative = selectionToRelative(a.doc, { blockId: id, start: 1, end: 1 });
    if (!relative) throw new Error('no caret');
    typeInto(b, id, 'aXYbc');
    sync(a, b);
    expect(relativeToSelection(a.doc, relative)).toEqual({ blockId: id, start: 3, end: 3 });
  });

  it('keeps a caret at the end of the text at its end', () => {
    const { a, b, id } = pair('abc');
    const relative = selectionToRelative(a.doc, { blockId: id, start: 3, end: 3 });
    if (!relative) throw new Error('no caret');
    typeInto(b, id, 'Zabc');
    sync(a, b);
    expect(relativeToSelection(a.doc, relative)).toEqual({ blockId: id, start: 4, end: 4 });
  });

  it('collapses a range whose text was deleted to where it was', () => {
    const { a, b, id } = pair('hello world');
    const relative = selectionToRelative(a.doc, { blockId: id, start: 6, end: 11 });
    if (!relative) throw new Error('no selection');
    typeInto(b, id, 'hello ');
    sync(a, b);
    expect(relativeToSelection(a.doc, relative)).toEqual({ blockId: id, start: 6, end: 6 });
  });

  it('orders and clamps the offsets it is given', () => {
    const { a, id } = pair('abc');
    const relative = selectionToRelative(a.doc, { blockId: id, start: 99, end: 1 });
    if (!relative) throw new Error('no selection');
    expect(relativeToSelection(a.doc, relative)).toEqual({ blockId: id, start: 1, end: 3 });
  });

  it('has no selection in a block without text, or one that is gone', () => {
    const { a, b, id } = pair('abc');
    expect(selectionToRelative(a.doc, { blockId: 'missing', start: 0, end: 0 })).toBeNull();
    const relative = selectionToRelative(a.doc, { blockId: id, start: 0, end: 1 });
    if (!relative) throw new Error('no selection');
    b.store.run((c) => removeBlocks(c, [id]));
    sync(a, b);
    expect(relativeToSelection(a.doc, relative)).toBeNull();
  });

  it('has no selection when the block’s text was replaced since', () => {
    const { a, id } = pair('abc');
    const relative = selectionToRelative(a.doc, { blockId: id, start: 0, end: 1 });
    if (!relative) throw new Error('no selection');
    // The positions name characters of a `Y.Text` the block no longer holds.
    const block = blocksMap(a.doc).get(id);
    if (!block) throw new Error('no block');
    a.doc.transact(() => {
      const fresh = new Y.Text();
      block.set('text', fresh);
      fresh.insert(0, 'abc');
    });
    expect(textOf(block)?.toString()).toBe('abc');
    expect(relativeToSelection(a.doc, relative)).toBeNull();
  });

  it('waits for the edits a position was made after', () => {
    const { a, b, id } = pair('abc');
    typeInto(a, id, 'abcdef');
    // B has not had A's typing yet: "def" is not in its document.
    const relative = selectionToRelative(a.doc, { blockId: id, start: 4, end: 5 });
    if (!relative) throw new Error('no selection');
    expect(relativeToSelection(b.doc, relative)).toBeNull();
    sync(a, b);
    expect(covered(b, relativeToSelection(b.doc, relative))).toBe('e');
  });

  it('takes nothing from malformed input', () => {
    const { a, id } = pair('abc');
    const bad = [
      { blockId: id, start: {}, end: {} },
      { blockId: id, start: null, end: null },
      { blockId: 7, start: {}, end: {} },
      { blockId: id, start: { item: { client: 'x', clock: 'y' } }, end: {} },
    ];
    for (const relative of bad) {
      expect(relativeToSelection(a.doc, relative as never)).toBeNull();
    }
  });

  it('follows the block through a change of type', () => {
    const { a, b, id } = pair('hello world');
    const relative = selectionToRelative(a.doc, { blockId: id, start: 0, end: 5 });
    if (!relative) throw new Error('no selection');
    b.store.run((c) => turnInto(c, id, 'heading_1'));
    sync(a, b);
    expect(covered(a, relativeToSelection(a.doc, relative))).toBe('hello');
  });
});
