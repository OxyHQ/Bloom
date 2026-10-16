import * as Y from 'yjs';
import {
  type BlockId,
  type EditorDocument,
  EditorStore,
  editText,
  emptyDocument,
  formatText,
  indent,
  insertBlockAfter,
  moveBlocks,
  removeBlocks,
  validateDocument,
} from '../../model';
import { keyBetween } from '../fractional';
import { YjsBinding } from '../binding';
import { materialize } from '../materialize';
import { readSegments, updateSegments, writeSegments } from '../text';
import { writeDocument } from '../write';

interface Peer {
  name: string;
  doc: Y.Doc;
  store: EditorStore;
  binding: YjsBinding;
}

function peer(name: string, from?: Peer): Peer {
  const doc = new Y.Doc();
  if (from) Y.applyUpdate(doc, Y.encodeStateAsUpdate(from.doc));
  let n = 0;
  const store = new EditorStore({
    document: emptyDocument(),
    newId: () => `${name}-${String((n += 1)).padStart(4, '0')}`,
  });
  return { name, doc, store, binding: new YjsBinding(store, doc) };
}

/** Deliver every update each peer has that another lacks, both ways. */
function sync(...peers: Peer[]): void {
  for (const a of peers) {
    for (const b of peers) {
      if (a === b) continue;
      Y.applyUpdate(b.doc, Y.encodeStateAsUpdate(a.doc, Y.encodeStateVector(b.doc)));
    }
  }
}

/** A document as plain data in reading order, for comparing two of them. */
function plain(doc: EditorDocument): unknown {
  const visit = (ids: readonly BlockId[]): unknown[] =>
    ids.map((id) => {
      const block = doc.blocks[id];
      if (!block) throw new Error(`missing ${id}`);
      return {
        id,
        type: block.type,
        text: block.text,
        props: block.props,
        children: visit(block.children),
      };
    });
  return visit(doc.root);
}

function texts(doc: EditorDocument): string[] {
  const out: string[] = [];
  const visit = (ids: readonly BlockId[]) => {
    for (const id of ids) {
      const block = doc.blocks[id];
      if (!block) continue;
      out.push((block.text ?? []).map((s) => s.text).join(''));
      visit(block.children);
    }
  };
  visit(doc.root);
  return out;
}

function expectConverged(...peers: Peer[]): void {
  const [first, ...rest] = peers;
  if (!first) return;
  for (const p of peers) {
    expect(validateDocument(p.store.doc)).toEqual([]);
    // The store is exactly what its Y.Doc holds.
    expect(plain(p.store.doc)).toEqual(plain(materialize(p.doc)));
  }
  for (const p of rest) expect(plain(p.store.doc)).toEqual(plain(first.store.doc));
}

function add(p: Peer, after: BlockId | null, text: string, type = 'paragraph'): BlockId {
  p.store.dispatch(insertBlockAfter(p.store.context(), after, type, { text: [{ text }] }));
  const ids = Object.keys(p.store.doc.blocks);
  const added = ids.find((id) => (p.store.doc.blocks[id]?.text ?? [])[0]?.text === text);
  if (!added) throw new Error(`block "${text}" was not added`);
  return added;
}

function type(p: Peer, id: BlockId, text: string): void {
  p.store.dispatch(editText(p.store.context(), id, [{ text }]));
}

describe('fractional keys', () => {
  it('always fit between two keys, in order', () => {
    const keys: string[] = [];
    let seed = 7;
    const random = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    for (let i = 0; i < 400; i += 1) {
      const at = Math.floor(random() * (keys.length + 1));
      const key = keyBetween(keys[at - 1] ?? null, keys[at] ?? null);
      keys.splice(at, 0, key);
    }
    expect([...keys].sort()).toEqual(keys);
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe('text in a Y.Text', () => {
  it('keeps every mark, a mention included', () => {
    const doc = new Y.Doc();
    const text = doc.getText('t');
    const segments = [
      { text: 'Hola ', bold: true },
      { text: '@Ana', mention: { indicator: '@', attributes: { kind: 'user', id: 'u1' } } },
      { text: ' y ', italic: true, color: 'blue' },
      { text: 'link', link: 'https://nilo.so' },
    ];
    writeSegments(text, segments);
    expect(readSegments(text)).toEqual(segments);
  });

  it('does not stretch the marks around new text over it', () => {
    const doc = new Y.Doc();
    const text = doc.getText('t');
    writeSegments(text, [{ text: 'ab', bold: true }]);
    updateSegments(text, [{ text: 'a', bold: true }, { text: 'X' }, { text: 'b', bold: true }]);
    expect(readSegments(text)).toEqual([
      { text: 'a', bold: true },
      { text: 'X' },
      { text: 'b', bold: true },
    ]);
  });
});

describe('a store bound to a Y.Doc', () => {
  it('writes every local edit, and a fresh device reads the same page', () => {
    const a = peer('a');
    const first = add(a, null, 'Uno');
    const second = add(a, first, 'Dos');
    a.store.dispatch(indent(a.store.context(), second));
    a.store.dispatch(formatText(a.store.context(), first, 0, 3, { bold: true }));
    const b = peer('b', a);
    expectConverged(a, b);
    expect(b.store.doc.blocks[second]?.parent).toBe(first);
  });

  it('keeps what two people type in one block at once', () => {
    const a = peer('a');
    const id = add(a, null, 'Hello world');
    const b = peer('b', a);
    type(a, id, 'Hello brave world');
    type(b, id, 'Hello world!');
    sync(a, b);
    expectConverged(a, b);
    expect(texts(a.store.doc)).toEqual(['Hello brave world!']);
  });

  it('keeps text typed into a stretch someone else is making bold', () => {
    const a = peer('a');
    const id = add(a, null, 'abcdef');
    const b = peer('b', a);
    a.store.dispatch(formatText(a.store.context(), id, 1, 5, { bold: true }));
    type(b, id, 'abcXdef');
    sync(a, b);
    expectConverged(a, b);
    expect(texts(a.store.doc)).toEqual(['abcXdef']);
    expect(a.store.doc.blocks[id]?.text?.some((s) => s.bold)).toBe(true);
  });

  it('leaves a block moved by two people at once in one place', () => {
    const a = peer('a');
    const one = add(a, null, 'one');
    const two = add(a, one, 'two');
    const three = add(a, two, 'three');
    const b = peer('b', a);
    a.store.dispatch(moveBlocks(a.store.context(), [one], three, 'after'));
    b.store.dispatch(moveBlocks(b.store.context(), [one], two, 'inside'));
    sync(a, b);
    expectConverged(a, b);
    const occurrences = texts(a.store.doc).filter((t) => t === 'one');
    expect(occurrences).toHaveLength(1);
  });

  it('breaks a cycle made by two moves, the same way everywhere, losing nothing', () => {
    const a = peer('a');
    const x = add(a, null, 'x');
    const y = add(a, x, 'y');
    const b = peer('b', a);
    a.store.dispatch(moveBlocks(a.store.context(), [x], y, 'inside'));
    b.store.dispatch(moveBlocks(b.store.context(), [y], x, 'inside'));
    sync(a, b);
    expectConverged(a, b);
    expect(texts(a.store.doc).sort()).toEqual(['x', 'y']);
  });

  it('lets a removal win over a child added to the removed block', () => {
    const a = peer('a');
    const parent = add(a, null, 'parent');
    add(a, parent, 'sibling');
    const b = peer('b', a);
    a.store.dispatch(removeBlocks(a.store.context(), [parent]));
    const child = add(b, parent, 'child');
    b.store.dispatch(indent(b.store.context(), child));
    sync(a, b);
    expectConverged(a, b);
    expect(texts(a.store.doc)).toEqual(['sibling']);
  });

  it('orders two blocks inserted at the same place at once the same way everywhere', () => {
    const a = peer('a');
    const top = add(a, null, 'top');
    const b = peer('b', a);
    add(a, top, 'from a');
    add(b, top, 'from b');
    sync(a, b);
    expectConverged(a, b);
    expect(texts(a.store.doc)).toHaveLength(3);
    // Inserting between the two (whose keys may tie) still works.
    const between = a.store.doc.root[1] as BlockId;
    add(a, between, 'between');
    sync(a, b);
    expectConverged(a, b);
    expect(texts(b.store.doc)[2]).toBe('between');
  });

  it('undoes only its own edit after someone else edited the page', () => {
    const a = peer('a');
    const mine = add(a, null, 'mine');
    const theirs = add(a, mine, 'theirs');
    const b = peer('b', a);
    a.store.sealHistory();
    type(a, mine, 'mine, changed');
    type(b, theirs, 'theirs, changed');
    sync(a, b);
    a.store.undo();
    sync(a, b);
    expectConverged(a, b);
    expect(texts(b.store.doc)).toEqual(['mine', 'theirs, changed']);
  });

  it("leaves a reader's own changes alone while keeping the page live", () => {
    const a = peer('a');
    const toggle = add(a, null, 'Details', 'toggle');
    const doc = new Y.Doc();
    Y.applyUpdate(doc, Y.encodeStateAsUpdate(a.doc));
    const reader = new EditorStore({ document: emptyDocument(), newId: () => 'r' });
    new YjsBinding(reader, doc, { readOnly: true });
    const props = reader.doc.blocks[toggle]?.props ?? {};
    reader.dispatch({
      ops: [
        {
          kind: 'update',
          id: toggle,
          before: { props },
          after: { props: { ...props, expanded: false } },
        },
      ],
    });
    // Nothing a reader does reaches the document.
    expect(materialize(doc).blocks[toggle]?.props.expanded).not.toBe(false);

    add(a, toggle, 'below');
    type(a, toggle, 'Details, more');
    Y.applyUpdate(doc, Y.encodeStateAsUpdate(a.doc, Y.encodeStateVector(doc)));
    expect(texts(reader.doc)).toEqual(['Details, more', 'below']);
    expect(reader.doc.blocks[toggle]?.props.expanded).toBe(false);
    expect(validateDocument(reader.doc)).toEqual([]);
  });

  it('stores an existing document once and reads it back the same', () => {
    const a = peer('a');
    const first = add(a, null, 'Uno');
    add(a, first, 'Dos');
    const doc = new Y.Doc();
    writeDocument(doc, a.store.doc, 'seed');
    expect(plain(materialize(doc))).toEqual(plain(a.store.doc));
  });

  it.each(Array.from({ length: 25 }, (_, i) => 1 + i * 7919))(
    'converges after random edits on three devices synced at random (seed %i)',
    (start) => {
      let seed = start;
      const random = () => {
        seed = (seed * 16807) % 2147483647;
        return seed / 2147483647;
      };
      const pick = <T>(list: readonly T[]): T | undefined =>
        list[Math.floor(random() * list.length)];
      const a = peer('a');
      add(a, null, 'start');
      const b = peer('b', a);
      const c = peer('c', a);
      const peers = [a, b, c];
      for (let step = 0; step < 300; step += 1) {
        const p = pick(peers) as Peer;
        const ids = Object.keys(p.store.doc.blocks);
        const target = pick(ids);
        const roll = random();
        const ctx = p.store.context();
        if (roll < 0.3 || !target) add(p, target ?? null, `t${step}`);
        else if (roll < 0.5) type(p, target, `${texts(p.store.doc).length}-${step}`);
        else if (roll < 0.55) {
          const length = (p.store.doc.blocks[target]?.text ?? []).reduce(
            (n, s) => n + s.text.length,
            0,
          );
          if (length > 1)
            p.store.dispatch(
              formatText(ctx, target, 0, Math.ceil(length / 2), {
                bold: random() < 0.5 ? true : null,
              }),
            );
        } else if (roll < 0.7) p.store.dispatch(indent(ctx, target));
        else if (roll < 0.8 && ids.length > 1) {
          const other = pick(ids.filter((id) => id !== target)) as BlockId;
          p.store.dispatch(moveBlocks(ctx, [target], other, random() < 0.5 ? 'after' : 'inside'));
        } else if (roll < 0.9 && ids.length > 2) p.store.dispatch(removeBlocks(ctx, [target]));
        else p.store.undo();
        if (random() < 0.25) {
          const q = pick(peers) as Peer;
          if (q !== p) sync(p, q);
        }
      }
      sync(a, b, c);
      sync(a, b, c);
      expectConverged(a, b, c);
    },
  );
});
