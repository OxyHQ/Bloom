import { segmentsToPlainText } from '@oxy.so/bloom-text/model';
import {
  applyInlineEquation,
  applyTransaction,
  type BlockSnapshot,
  blockRange,
  blockStep,
  DEFAULT_SCHEMA,
  documentFromSnapshot,
  type EditorDocument,
  extendSchema,
  formatText,
  getBlock,
  indentBlocks,
  insertMention,
  outdentBlocks,
  setBlocksProps,
  snapshotToMarkdown,
  exportSnapshot,
  validateDocument,
} from '../index';

const SCHEMA = extendSchema(DEFAULT_SCHEMA, [
  {
    type: 'columns',
    hasText: false,
    canHaveChildren: true,
    isContainer: true,
    childTypes: ['column'],
  },
  {
    type: 'column',
    hasText: false,
    canHaveChildren: true,
    isContainer: true,
    parentTypes: ['columns'],
  },
]);

const p = (text: string, children?: BlockSnapshot[]): BlockSnapshot => ({
  type: 'paragraph',
  text: [{ text }],
  ...(children && { children }),
});

/** Blocks get the ids of their text, so tests read as the page does. */
function setup(blocks: BlockSnapshot[]) {
  let n = 0;
  const names: string[] = [];
  const collect = (nodes: BlockSnapshot[]) => {
    for (const node of nodes) {
      const name = segmentsToPlainText(node.text ?? []) || node.type;
      names.push(names.includes(name) ? `${name}${names.length}` : name);
      collect(node.children ?? []);
    }
  };
  collect(blocks);
  let i = 0;
  const doc = documentFromSnapshot(blocks, () => names[i++] as string);
  return { doc, ctx: { doc, schema: SCHEMA, newId: () => `n${++n}` } };
}

const tree = (doc: EditorDocument) => {
  const out: string[] = [];
  const visit = (ids: readonly string[], depth: number) => {
    for (const id of ids) {
      out.push(`${'  '.repeat(depth)}${id}`);
      visit(getBlock(doc, id).children, depth + 1);
    }
  };
  visit(doc.root, 0);
  return out;
};

describe('blockRange', () => {
  const { doc } = setup([p('A', [p('A1'), p('A2', [p('A2a')])]), p('B'), p('C')]);

  it('runs over siblings in document order, either way', () => {
    expect(blockRange(doc, SCHEMA, 'A', 'C')).toEqual(['A', 'B', 'C']);
    expect(blockRange(doc, SCHEMA, 'C', 'B')).toEqual(['B', 'C']);
    expect(blockRange(doc, SCHEMA, 'A1', 'A2')).toEqual(['A1', 'A2']);
  });

  it('takes each end up to the level of the other', () => {
    expect(blockRange(doc, SCHEMA, 'A2a', 'B')).toEqual(['A', 'B']);
    expect(blockRange(doc, SCHEMA, 'A1', 'A2a')).toEqual(['A1', 'A2']);
    // One inside the other: the outer one.
    expect(blockRange(doc, SCHEMA, 'A', 'A2a')).toEqual(['A']);
  });

  it('selects a container, not its parts, across columns', () => {
    const { doc: cols } = setup([
      {
        type: 'columns',
        children: [
          { type: 'column', children: [p('L')] },
          { type: 'column', children: [p('R')] },
        ],
      },
    ]);
    expect(blockRange(cols, SCHEMA, 'L', 'R')).toEqual(['columns']);
  });
});

describe('blockStep', () => {
  const { doc } = setup([
    p('A', [p('A1')]),
    { type: 'toggle', text: [{ text: 'T' }], props: { expanded: false }, children: [p('hidden')] },
    p('B'),
  ]);

  it('moves down past everything under the head, and up to the block above on screen', () => {
    expect(blockStep(doc, SCHEMA, 'A', 'down')).toBe('T');
    expect(blockStep(doc, SCHEMA, 'A1', 'down')).toBe('T');
    expect(blockStep(doc, SCHEMA, 'T', 'down')).toBe('B');
    expect(blockStep(doc, SCHEMA, 'T', 'up')).toBe('A1');
    expect(blockStep(doc, SCHEMA, 'B', 'up')).toBe('T');
    expect(blockStep(doc, SCHEMA, 'A', 'up')).toBeNull();
    expect(blockStep(doc, SCHEMA, 'B', 'down')).toBeNull();
  });
});

describe('indentBlocks and outdentBlocks', () => {
  it('nests a run of siblings under the block above the first', () => {
    const { doc, ctx } = setup([p('A'), p('B'), p('C'), p('D')]);
    const tx = indentBlocks(ctx, ['B', 'C']);
    const after = applyTransaction(doc, tx as NonNullable<typeof tx>);
    expect(tree(after)).toEqual(['A', '  B', '  C', 'D']);
    expect(tx?.selectionAfter).toEqual({ kind: 'blocks', ids: ['B', 'C'] });
  });

  it('refuses when the first cannot nest', () => {
    const { ctx } = setup([p('A'), p('B')]);
    expect(indentBlocks(ctx, ['A', 'B'])).toBeNull();
  });

  it('moves a run out of its parent in order, none adopting another', () => {
    const { doc, ctx } = setup([p('A', [p('B'), p('C'), p('D')])]);
    const tx = outdentBlocks(ctx, ['B', 'C']);
    const after = applyTransaction(doc, tx as NonNullable<typeof tx>);
    expect(validateDocument(after)).toEqual([]);
    // D followed them, so it stays after them — under C, as one Shift-Tab does.
    expect(tree(after)).toEqual(['A', 'B', 'C', '  D']);
    expect(outdentBlocks(ctx, ['A'])).toBeNull();
  });

  it('colours every selected block in one edit', () => {
    const { doc, ctx } = setup([p('A'), p('B')]);
    const tx = setBlocksProps(ctx, ['A', 'B'], { color: 'red' });
    const after = applyTransaction(doc, tx as NonNullable<typeof tx>);
    expect([getBlock(after, 'A').props.color, getBlock(after, 'B').props.color]).toEqual([
      'red',
      'red',
    ]);
  });
});

describe('text colour', () => {
  it('sets and clears a colour and a background over a range', () => {
    const { doc, ctx } = setup([p('hello world')]);
    const tx = formatText(ctx, 'hello world', 0, 5, { color: 'red', background: 'yellow' });
    const after = applyTransaction(doc, tx as NonNullable<typeof tx>);
    expect(getBlock(after, 'hello world').text).toEqual([
      { text: 'hello', color: 'red', background: 'yellow' },
      { text: ' world' },
    ]);
    const cleared = formatText({ ...ctx, doc: after }, 'hello world', 0, 11, { color: null });
    expect(
      getBlock(applyTransaction(after, cleared as NonNullable<typeof cleared>), 'hello world').text,
    ).toEqual([{ text: 'hello', background: 'yellow' }, { text: ' world' }]);
  });
});

describe('mentions and inline equations', () => {
  it('puts an atomic mention over a range, the caret after it', () => {
    const { doc, ctx } = setup([p('see x here')]);
    const tx = insertMention(ctx, 'see x here', 4, 5, {
      indicator: '@',
      text: 'E = mc^2',
      attributes: { kind: 'equation', latex: 'E = mc^2' },
    });
    const after = applyTransaction(doc, tx as NonNullable<typeof tx>);
    expect(getBlock(after, 'see x here').text).toEqual([
      { text: 'see ' },
      {
        text: 'E = mc^2',
        mention: { indicator: '@', attributes: { kind: 'equation', latex: 'E = mc^2' } },
      },
      { text: ' here' },
    ]);
    expect(tx?.selectionAfter).toMatchObject({ start: 12, end: 12 });
  });

  it('makes $$…$$ an equation when its closing $ is typed', () => {
    const text = 'area $$\\pi r^2$$ ok';
    const caret = 'area $$\\pi r^2$$'.length;
    const result = applyInlineEquation(
      [{ text }],
      { index: caret - 1, deleteCount: 0, insert: '$' },
      '@',
    );
    expect(result).toEqual({
      segments: [
        { text: 'area ' },
        {
          text: '\\pi r^2',
          mention: { indicator: '@', attributes: { kind: 'equation', latex: '\\pi r^2' } },
        },
        { text: ' ok' },
      ],
      caret: 5 + '\\pi r^2'.length,
    });
    // Only on the closing $, and never in code or on an empty pair.
    expect(
      applyInlineEquation([{ text: '$$x$' }], { index: 3, deleteCount: 0, insert: '$' }, '@'),
    ).toBeNull();
    expect(
      applyInlineEquation([{ text: '$$$$' }], { index: 3, deleteCount: 0, insert: '$' }, '@'),
    ).toBeNull();
    expect(
      applyInlineEquation(
        [{ text: '$$x$$', code: true }],
        { index: 4, deleteCount: 0, insert: '$' },
        '@',
      ),
    ).toBeNull();
  });

  it('copies an equation as Markdown math', () => {
    const { doc } = setup([
      {
        type: 'paragraph',
        text: [
          { text: 'so ' },
          {
            text: 'x^2',
            mention: { indicator: '@', attributes: { kind: 'equation', latex: 'x^2' } },
          },
        ],
      },
    ]);
    expect(snapshotToMarkdown(exportSnapshot(doc, doc.root))).toBe('so $x^2$\n');
  });
});
