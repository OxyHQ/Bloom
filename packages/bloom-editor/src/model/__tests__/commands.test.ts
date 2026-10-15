import { segmentsToPlainText } from '@oxy.so/bloom-text/model';
import {
  applyTransaction,
  backspaceAtStart,
  type Block,
  type BlockSnapshot,
  type CommandContext,
  DEFAULT_SCHEMA,
  deleteAtEnd,
  documentFromSnapshot,
  documentToSnapshot,
  duplicateBlocks,
  type EditorDocument,
  EditorStore,
  extendSchema,
  getBlock,
  indent,
  insertSnapshot,
  invertTransaction,
  moveBlocks,
  outdent,
  propsFor,
  removeBlocks,
  setProps,
  snapshotToMarkdown,
  splitBlock,
  type Transaction,
  turnInto,
  validateDocument,
} from '../index';

const SCHEMA = extendSchema(DEFAULT_SCHEMA, [
  { type: 'columns', hasText: false, canHaveChildren: true, isContainer: true },
  { type: 'column', hasText: false, canHaveChildren: true, isContainer: true },
]);

function idFactory(prefix = 'n') {
  let n = 0;
  return () => `${prefix}${++n}`;
}

/** Compact fixture: `['paragraph', 'text', children?, props?]`. */
type Spec = [string, string?, Spec[]?, Record<string, unknown>?];
function build(specs: Spec[]): EditorDocument {
  const toSnapshot = ([type, text, children, props]: Spec): BlockSnapshot => ({
    type,
    ...(text !== undefined && { text: text ? [{ text }] : [] }),
    ...(props && { props }),
    ...(children && { children: children.map(toSnapshot) }),
  });
  return documentFromSnapshot(specs.map(toSnapshot), idFactory('b'));
}

// One id sequence for the whole file: commands chained on one document must
// never mint an id twice.
const newId = idFactory('new');

function ctx(doc: EditorDocument): CommandContext {
  return { doc, schema: SCHEMA, newId, isCollapsed: (b) => b.props.expanded === false };
}

/** The block a transaction leaves the caret in. */
function caretBlock(tx: Transaction | null): string {
  const sel = tx?.selectionAfter;
  if (sel?.kind !== 'text') throw new Error('no caret');
  return sel.blockId;
}

function run(doc: EditorDocument, tx: Transaction | null): EditorDocument {
  if (!tx) throw new Error('command did not apply');
  const next = applyTransaction(doc, tx);
  expect(validateDocument(next)).toEqual([]);
  // Every transaction is exactly reversible.
  expect(applyTransaction(next, invertTransaction(tx))).toEqual(doc);
  return next;
}

/** The document as `type:text` lines, children indented. */
function outline(doc: EditorDocument): string[] {
  const out: string[] = [];
  const visit = (ids: readonly string[], depth: number) => {
    for (const id of ids) {
      const b = getBlock(doc, id);
      out.push(`${'  '.repeat(depth)}${b.type}:${segmentsToPlainText(b.text ?? [])}`);
      visit(b.children, depth + 1);
    }
  };
  visit(doc.root, 0);
  return out;
}

describe('splitBlock (Return)', () => {
  it('splits a paragraph at the caret', () => {
    const doc = build([['paragraph', 'Hello world']]);
    const tx = splitBlock(ctx(doc), 'b1', 5);
    expect(outline(run(doc, tx))).toEqual(['paragraph:Hello', 'paragraph: world']);
    expect(tx?.selectionAfter).toMatchObject({ kind: 'text', start: 0, end: 0 });
    expect(caretBlock(tx)).not.toBe('b1');
  });

  it('continues a list and leaves a heading for a paragraph', () => {
    const doc = build([
      ['bulleted_list_item', 'one'],
      ['heading_1', 'Title'],
    ]);
    let next = run(doc, splitBlock(ctx(doc), 'b1', 3));
    next = run(next, splitBlock(ctx(next), 'b2', 5));
    expect(outline(next)).toEqual([
      'bulleted_list_item:one',
      'bulleted_list_item:',
      'heading_1:Title',
      'paragraph:',
    ]);
  });

  it('starts a new to-do unchecked', () => {
    const doc = build([['todo', 'done', [], { checked: true }]]);
    const tx = splitBlock(ctx(doc), 'b1', 4);
    const next = run(doc, tx);
    expect(getBlock(next, caretBlock(tx)).props.checked).toBe(false);
  });

  it('leaves the list from an empty item: outdent first, then paragraph', () => {
    const doc = build([['bulleted_list_item', 'parent', [['bulleted_list_item', '']]]]);
    let next = run(doc, splitBlock(ctx(doc), 'b2', 0));
    expect(outline(next)).toEqual(['bulleted_list_item:parent', 'bulleted_list_item:']);
    next = run(next, splitBlock(ctx(next), 'b2', 0));
    expect(outline(next)).toEqual(['bulleted_list_item:parent', 'paragraph:']);
  });

  it('puts the new block first under a block that shows children', () => {
    const doc = build([['toggle', 'T', [['paragraph', 'inside']]]]);
    const next = run(doc, splitBlock(ctx(doc), 'b1', 1));
    expect(outline(next)).toEqual(['toggle:T', '  toggle:', '  paragraph:inside']);
  });

  it('does not split a code block (Return is a newline there)', () => {
    const doc = build([['code', 'x = 1']]);
    expect(splitBlock(ctx(doc), 'b1', 2)).toBeNull();
  });
});

describe('backspaceAtStart', () => {
  it('reverts a styled block to a paragraph first, keeping the caret at the start', () => {
    const doc = build([['heading_2', 'Title']]);
    const tx = backspaceAtStart(ctx(doc), 'b1');
    expect(outline(run(doc, tx))).toEqual(['paragraph:Title']);
    expect(tx?.selectionAfter).toEqual({ kind: 'text', blockId: 'b1', start: 0, end: 0 });
  });

  it('outdents a nested paragraph before merging', () => {
    const doc = build([['bulleted_list_item', 'a', [['paragraph', 'b']]]]);
    expect(outline(run(doc, backspaceAtStart(ctx(doc), 'b2')))).toEqual([
      'bulleted_list_item:a',
      'paragraph:b',
    ]);
  });

  it('merges into the previous text block, which adopts the children', () => {
    const doc = build([
      ['paragraph', 'Hello '],
      ['paragraph', 'world', [['paragraph', 'child']]],
    ]);
    const tx = backspaceAtStart(ctx(doc), 'b2');
    expect(outline(run(doc, tx))).toEqual(['paragraph:Hello world', '  paragraph:child']);
    expect(tx?.selectionAfter).toEqual({ kind: 'text', blockId: 'b1', start: 6, end: 6 });
  });

  it('skips a divider when looking for the previous text', () => {
    const doc = build([['paragraph', 'a'], ['divider'], ['paragraph', 'b']]);
    expect(outline(run(doc, backspaceAtStart(ctx(doc), 'b3')))).toEqual([
      'paragraph:ab',
      'divider:',
    ]);
  });

  it('does nothing in the first block', () => {
    const doc = build([['paragraph', 'a']]);
    expect(backspaceAtStart(ctx(doc), 'b1')).toBeNull();
  });
});

describe('deleteAtEnd', () => {
  it('pulls the next text block in', () => {
    const doc = build([
      ['paragraph', 'a'],
      ['heading_1', 'b'],
    ]);
    expect(outline(run(doc, deleteAtEnd(ctx(doc), 'b1')))).toEqual(['paragraph:ab']);
  });
});

describe('indent and outdent', () => {
  it('nests under the previous sibling and refuses the first block', () => {
    const doc = build([
      ['bulleted_list_item', 'a'],
      ['bulleted_list_item', 'b'],
    ]);
    expect(indent(ctx(doc), 'b1')).toBeNull();
    expect(outline(run(doc, indent(ctx(doc), 'b2')))).toEqual([
      'bulleted_list_item:a',
      '  bulleted_list_item:b',
    ]);
  });

  it('opens a closed toggle it indents into', () => {
    const doc = build([
      ['toggle', 'T', [], { expanded: false }],
      ['paragraph', 'x'],
    ]);
    const next = run(doc, indent(ctx(doc), 'b2'));
    expect(getBlock(next, 'b1').props.expanded).toBe(true);
  });

  it('outdent adopts the following siblings, keeping the visual order', () => {
    const doc = build([
      [
        'bulleted_list_item',
        'p',
        [
          ['bulleted_list_item', 'a'],
          ['bulleted_list_item', 'b'],
          ['bulleted_list_item', 'c'],
        ],
      ],
    ]);
    expect(outline(run(doc, outdent(ctx(doc), 'b3')))).toEqual([
      'bulleted_list_item:p',
      '  bulleted_list_item:a',
      'bulleted_list_item:b',
      '  bulleted_list_item:c',
    ]);
  });

  it('never moves a block out of a column', () => {
    const doc = build([['columns', undefined, [['column', undefined, [['paragraph', 'x']]]]]]);
    expect(outdent(ctx(doc), 'b3')).toBeNull();
  });
});

describe('turnInto', () => {
  it('keeps text and props so switching back restores them', () => {
    const doc = build([['todo', 'task', [], { checked: true }]]);
    let next = run(doc, turnInto(ctx(doc), 'b1', 'paragraph'));
    next = run(next, turnInto(ctx(next), 'b1', 'todo'));
    expect(getBlock(next, 'b1').props.checked).toBe(true);
  });

  it('hands children on when the new type cannot hold them', () => {
    const doc = build([['paragraph', 'p', [['paragraph', 'c']]]]);
    expect(outline(run(doc, turnInto(ctx(doc), 'b1', 'heading_1')))).toEqual([
      'heading_1:p',
      'paragraph:c',
    ]);
  });
});

describe('props a type keeps', () => {
  const STRICT = extendSchema(SCHEMA, [
    { type: 'paragraph', hasText: true, canHaveChildren: true, props: ['color'] },
    {
      type: 'todo',
      hasText: true,
      canHaveChildren: true,
      continueAs: 'todo',
      defaultProps: { checked: false },
      props: ['checked', 'color'],
    },
  ]);
  const strict = (doc: EditorDocument): CommandContext => ({
    doc,
    schema: STRICT,
    newId: idFactory('s'),
  });

  it('fills defaults and drops what the type does not keep', () => {
    expect(propsFor(STRICT.todo as never, { color: 'red', icon: 'x' })).toEqual({
      checked: false,
      color: 'red',
    });
    expect(propsFor(DEFAULT_SCHEMA.paragraph as never, { icon: 'x' })).toEqual({ icon: 'x' });
  });

  it('turnInto drops props the new type does not keep', () => {
    const doc = build([['todo', 'task', [], { checked: true, color: 'blue' }]]);
    const next = run(doc, turnInto(strict(doc), 'b1', 'paragraph'));
    expect(getBlock(next, 'b1').props).toEqual({ color: 'blue' });
  });

  it('setProps ignores props the type does not keep', () => {
    const doc = build([['paragraph', 'p']]);
    const next = run(doc, setProps(strict(doc), 'b1', { color: 'red', checked: true }));
    expect(getBlock(next, 'b1').props).toEqual({ color: 'red' });
  });

  it('a snapshot inserted with a schema follows it', () => {
    const doc = build([['paragraph', 'p']]);
    const tx = insertSnapshot(
      doc,
      [{ type: 'todo', props: { stray: 1 } }],
      'b1',
      idFactory('x'),
      STRICT,
    );
    expect(getBlock(run(doc, tx), 'x1').props).toEqual({ checked: false });
  });
});

describe('block operations', () => {
  it('removes a selection that includes a block and its child once', () => {
    const doc = build([
      ['paragraph', 'keep'],
      ['paragraph', 'p', [['paragraph', 'c']]],
    ]);
    const tx = removeBlocks(ctx(doc), ['b3', 'b2']);
    expect(outline(run(doc, tx))).toEqual(['paragraph:keep']);
    expect(tx?.selectionAfter).toEqual({ kind: 'text', blockId: 'b1', start: 4, end: 4 });
  });

  it('duplicates a subtree with fresh ids after the original', () => {
    const doc = build([
      ['toggle', 'T', [['paragraph', 'c']]],
      ['paragraph', 'end'],
    ]);
    const next = run(doc, duplicateBlocks(ctx(doc), ['b1']));
    expect(outline(next)).toEqual([
      'toggle:T',
      '  paragraph:c',
      'toggle:T',
      '  paragraph:c',
      'paragraph:end',
    ]);
  });

  it('moves blocks before, after and inside a target, keeping their order', () => {
    const doc = build([
      ['paragraph', 'a'],
      ['paragraph', 'b'],
      ['paragraph', 'c'],
      ['toggle', 'T'],
    ]);
    expect(outline(run(doc, moveBlocks(ctx(doc), ['b1', 'b2'], 'b3', 'after')))).toEqual([
      'paragraph:c',
      'paragraph:a',
      'paragraph:b',
      'toggle:T',
    ]);
    expect(outline(run(doc, moveBlocks(ctx(doc), ['b3'], 'b1', 'before')))).toEqual([
      'paragraph:c',
      'paragraph:a',
      'paragraph:b',
      'toggle:T',
    ]);
    expect(outline(run(doc, moveBlocks(ctx(doc), ['b1'], 'b4', 'inside')))).toEqual([
      'paragraph:b',
      'paragraph:c',
      'toggle:T',
      '  paragraph:a',
    ]);
  });

  it('refuses to move a block into itself', () => {
    const doc = build([['toggle', 'T', [['paragraph', 'c']]]]);
    expect(moveBlocks(ctx(doc), ['b1'], 'b2', 'inside')).toBeNull();
  });
});

describe('EditorStore', () => {
  it('undoes and redoes, groups typing, and reports every transaction', () => {
    const doc = build([['paragraph', '']]);
    const store = new EditorStore({ document: doc, schema: SCHEMA, newId: idFactory('s') });
    const seen: string[] = [];
    store.onTransaction((_tx, origin) => seen.push(origin));

    const type = (text: string) => {
      const block = getBlock(store.doc, 'b1');
      store.dispatch({
        ops: [
          { kind: 'update', id: 'b1', before: { text: block.text }, after: { text: [{ text }] } },
        ],
      });
    };
    type('H');
    type('Hi');
    type('Hi!');
    store.run((c) => splitBlock(c, 'b1', 3));
    expect(outline(store.doc)).toEqual(['paragraph:Hi!', 'paragraph:']);

    store.undo(); // the split
    store.undo(); // all the typing, as one entry
    expect(store.doc).toEqual(doc);
    expect(store.getSnapshot().canUndo).toBe(false);
    store.redo();
    expect(outline(store.doc)).toEqual(['paragraph:Hi!']);
    expect(seen).toEqual(['local', 'local', 'local', 'local', 'history', 'history', 'history']);
  });

  it('keeps remote edits out of the undo history', () => {
    const store = new EditorStore({
      document: build([['paragraph', 'a']]),
      schema: SCHEMA,
      newId: idFactory('s'),
    });
    store.dispatch(
      {
        ops: [
          {
            kind: 'update',
            id: 'b1',
            before: { text: [{ text: 'a' }] },
            after: { text: [{ text: 'b' }] },
          },
        ],
      },
      'remote',
    );
    expect(store.getSnapshot().canUndo).toBe(false);
  });
});

describe('snapshots', () => {
  it('round-trips a document and inserts a copy in one transaction', () => {
    const doc = build([
      ['heading_1', 'T'],
      ['bulleted_list_item', 'a', [['todo', 'x', [], { checked: true }]]],
    ]);
    const snapshot = documentToSnapshot(doc);
    expect(documentToSnapshot(documentFromSnapshot(snapshot, idFactory('z')))).toEqual(snapshot);
    const next = run(doc, insertSnapshot(doc, snapshot, 'b1', idFactory('c')));
    expect(outline(next)).toHaveLength(6);
  });

  it('renders Markdown', () => {
    const doc = build([
      ['heading_1', 'Plan'],
      ['numbered_list_item', 'one'],
      ['numbered_list_item', 'two'],
      ['todo', 'ship', [], { checked: true }],
    ]);
    expect(snapshotToMarkdown(documentToSnapshot(doc))).toBe(
      '# Plan\n1. one\n2. two\n- [x] ship\n',
    );
  });
});

describe('random edit sequences', () => {
  it('keep the tree consistent and undo back to the start', () => {
    let seed = 7;
    const random = () => {
      seed = (seed * 1103515245 + 12345) % 2 ** 31;
      return seed / 2 ** 31;
    };
    const pick = <T>(items: readonly T[]): T => items[Math.floor(random() * items.length)] as T;
    const types = [
      'paragraph',
      'heading_1',
      'bulleted_list_item',
      'todo',
      'toggle',
      'quote',
      'divider',
    ];

    for (let round = 0; round < 40; round += 1) {
      const start = build([
        ['paragraph', 'one'],
        ['bulleted_list_item', 'two', [['paragraph', 'three']]],
        ['todo', 'four'],
      ]);
      const store = new EditorStore({
        document: start,
        schema: SCHEMA,
        newId: idFactory(`r${round}-`),
      });
      let applied = 0;
      for (let step = 0; step < 60; step += 1) {
        const ids = Object.keys(store.doc.blocks);
        if (ids.length === 0) break;
        const id = pick(ids);
        const block: Block = getBlock(store.doc, id);
        const length = segmentsToPlainText(block.text ?? []).length;
        const command = pick([
          (c: CommandContext) => splitBlock(c, id, Math.floor(random() * (length + 1))),
          (c: CommandContext) => backspaceAtStart(c, id),
          (c: CommandContext) => deleteAtEnd(c, id),
          (c: CommandContext) => indent(c, id),
          (c: CommandContext) => outdent(c, id),
          (c: CommandContext) => turnInto(c, id, pick(types)),
          (c: CommandContext) => duplicateBlocks(c, [id]),
          (c: CommandContext) => (ids.length > 1 ? removeBlocks(c, [id]) : null),
          (c: CommandContext) =>
            moveBlocks(c, [id], pick(ids), pick(['before', 'after', 'inside'] as const)),
        ]);
        store.sealHistory();
        if (store.run(command)) applied += 1;
        expect(validateDocument(store.doc)).toEqual([]);
      }
      expect(applied).toBeGreaterThan(10);
      while (store.undo()) {
        /* unwind */
      }
      expect(store.doc).toEqual(start);
    }
  });
});

describe('undo with other people editing', () => {
  it("takes back only this person's typing in a block someone else typed in too", () => {
    const store = new EditorStore({
      document: build([['paragraph', 'plan']]),
      newId: idFactory('n'),
    });
    const id = store.doc.root[0] as string;
    const text = () => (getBlock(store.doc, id).text ?? []).map((s) => s.text).join('');
    const block = getBlock(store.doc, id);
    store.dispatch({
      ops: [
        {
          kind: 'update',
          id,
          before: { text: block.text },
          after: { text: [{ text: 'the plan' }] },
        },
      ],
    });
    // Someone else adds to the end.
    store.dispatch(
      {
        ops: [
          {
            kind: 'update',
            id,
            before: { text: [{ text: 'the plan' }] },
            after: { text: [{ text: 'the plan for May' }] },
          },
        ],
      },
      'remote',
    );
    expect(store.undo()).toBe(true);
    expect(text()).toBe('plan for May');
    expect(store.redo()).toBe(true);
    expect(text()).toBe('the plan for May');
  });
});
