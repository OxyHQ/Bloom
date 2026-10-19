import { segmentsToPlainText } from '@oxy.so/bloom-text/model';
import {
  applyTransaction,
  type BlockSnapshot,
  DEFAULT_SCHEMA,
  documentFromSnapshot,
  type EditorDocument,
  extendSchema,
  getBlock,
  htmlToSnapshot,
  pasteSnapshot,
  validateDocument,
} from '../index';

const SCHEMA = extendSchema(DEFAULT_SCHEMA, [
  { type: 'image', hasText: false, canHaveChildren: false },
]);

function setup(blocks: BlockSnapshot[]) {
  let b = 0;
  let n = 0;
  const doc = documentFromSnapshot(blocks, () => `b${++b}`);
  return { doc, ctx: { doc, schema: SCHEMA, newId: () => `n${++n}` } };
}

const outline = (doc: EditorDocument) => {
  const out: string[] = [];
  const visit = (ids: readonly string[], depth: number) => {
    for (const id of ids) {
      const block = getBlock(doc, id);
      const flag = block.type === 'todo' ? (block.props.checked ? '[x]' : '[ ]') : '';
      out.push(
        `${'  '.repeat(depth)}${block.type}${flag}:${segmentsToPlainText(block.text ?? [])}`,
      );
      visit(block.children, depth + 1);
    }
  };
  visit(doc.root, 0);
  return out;
};

function paste(text: string, start: number, end: number, html: string, type = 'paragraph') {
  const { doc, ctx } = setup([{ type, text: text ? [{ text }] : [] }]);
  const tx = pasteSnapshot(ctx, 'b1', start, end, htmlToSnapshot(html, { schema: SCHEMA }));
  if (!tx) throw new Error('nothing pasted');
  const after = applyTransaction(doc, tx);
  expect(validateDocument(after)).toEqual([]);
  return { doc: after, tx };
}

describe('pasteSnapshot', () => {
  it('puts a single paragraph in at the caret, over the selection, marks kept', () => {
    const { doc, tx } = paste('Hello world', 6, 11, '<b>there</b>');
    expect(getBlock(doc, 'b1').text).toEqual([{ text: 'Hello ' }, { text: 'there', bold: true }]);
    expect(tx.selectionAfter).toEqual({ kind: 'text', blockId: 'b1', start: 11, end: 11 });
  });

  it('continues the block with the first block, the rest after, the tail last', () => {
    const { doc, tx } = paste('Start end', 6, 6, '<p>one</p><h2>two</h2><ul><li>three</li></ul>');
    expect(outline(doc)).toEqual([
      'paragraph:Start one',
      'heading_2:two',
      'bulleted_list_item:threeend',
    ]);
    expect(tx.selectionAfter).toMatchObject({ kind: 'text', start: 5, end: 5 });
  });

  it('makes an empty paragraph the first pasted block, children and all', () => {
    const { doc } = paste(
      '',
      0,
      0,
      '<ul><li><input type=checkbox checked> a<ul><li>b</li></ul></li></ul><p>c</p>',
    );
    expect(outline(doc)).toEqual(['todo[x]:a', '  bulleted_list_item:b', 'paragraph:c']);
    expect(getBlock(doc, 'b1').type).toBe('todo');
  });

  it('gives what followed the caret a paragraph after code or an image', () => {
    const { doc, tx } = paste('ab', 1, 1, '<p>x</p><pre>code</pre>');
    expect(outline(doc)).toEqual(['paragraph:ax', 'code:code', 'paragraph:b']);
    expect(tx.selectionAfter).toMatchObject({ kind: 'text', start: 0 });
    const images = paste('ab', 1, 1, '<p>x</p><img src="https://x.test/i.png">');
    expect(outline(images.doc)).toEqual(['paragraph:ax', 'image:', 'paragraph:b']);
  });

  it('selects a pasted image that ends the paste with nothing after it', () => {
    const { doc, tx } = paste(
      '',
      0,
      0,
      '<img src="https://x.test/i.png"><img src="https://x.test/j.png">',
    );
    expect(outline(doc)).toEqual(['image:', 'image:']);
    expect(tx.selectionAfter).toEqual({ kind: 'blocks', ids: [doc.root[1]] });
  });

  it('pastes after a heading without turning it into the pasted type', () => {
    const { doc } = paste('Title', 5, 5, '<ul><li>a</li><li>b</li></ul>', 'heading_1');
    expect(outline(doc)).toEqual(['heading_1:Titlea', 'bulleted_list_item:b']);
  });
});
