import { segmentsToPlainText } from '@oxy.so/bloom-text/model';
import {
  applyTransaction,
  DEFAULT_SCHEMA,
  documentFromSnapshot,
  type EditorDocument,
  getBlock,
  pasteIntoBlock,
} from '../index';

function setup(type: string, text: string) {
  let n = 0;
  const newId = () => `n${++n}`;
  const doc = documentFromSnapshot([{ type, text: text ? [{ text }] : [] }], () => 'b1');
  return { doc, ctx: { doc, schema: DEFAULT_SCHEMA, newId } };
}

/** Paste `insert` at `index` as the input reports it: the text with it, and the edit. */
function paste(type: string, before: string, index: number, insert: string) {
  const { doc, ctx } = setup(type, before);
  const after = before.slice(0, index) + insert + before.slice(index);
  const tx = pasteIntoBlock(ctx, 'b1', [{ text: after }], { index, deleteCount: 0, insert });
  return { tx, doc: tx ? applyTransaction(doc, tx) : doc };
}

const outline = (doc: EditorDocument) =>
  doc.root.map((id) => {
    const b = getBlock(doc, id);
    const flag = b.type === 'todo' ? (b.props.checked ? '[x]' : '[ ]') : '';
    return `${b.type}${flag}:${segmentsToPlainText(b.text ?? [])}`;
  });

describe('pasteIntoBlock', () => {
  it('makes a block of every line, the rest of the line ending the last', () => {
    const { tx, doc } = paste('paragraph', 'Start end', 6, 'one\ntwo\nthree ');
    expect(outline(doc)).toEqual(['paragraph:Start one', 'paragraph:two', 'paragraph:three end']);
    // The caret where the pasted text ends.
    expect(tx?.selectionAfter).toMatchObject({ blockId: doc.root[2], start: 6 });
  });

  it('reads Markdown line prefixes, and fences into one code block', () => {
    const { doc } = paste(
      'paragraph',
      '',
      0,
      '# Plan\n- milk\n* eggs\n1. first\n[x] done\n> said\n---\n```\nconst a = 1;\nconst b = 2;\n```\nend',
    );
    expect(outline(doc)).toEqual([
      'heading_1:Plan',
      'bulleted_list_item:milk',
      'bulleted_list_item:eggs',
      'numbered_list_item:first',
      'todo[x]:done',
      'quote:said',
      'divider:',
      'code:const a = 1;\nconst b = 2;',
      'paragraph:end',
    ]);
  });

  it('continues a list, skips blank lines, and makes nothing of a trailing break', () => {
    const { doc } = paste('bulleted_list_item', 'a', 1, '\n\nb\nc\n');
    expect(outline(doc)).toEqual([
      'bulleted_list_item:a',
      'bulleted_list_item:b',
      'bulleted_list_item:c',
    ]);
  });

  it('keeps the marks a rich paste brings', () => {
    const { doc, ctx } = setup('paragraph', '');
    const tx = pasteIntoBlock(ctx, 'b1', [{ text: 'plain\n' }, { text: 'bold', bold: true }], {
      index: 0,
      deleteCount: 0,
      insert: 'plain\nbold',
    });
    const after = applyTransaction(doc, tx as NonNullable<typeof tx>);
    expect(getBlock(after, after.root[1] as string).text).toEqual([{ text: 'bold', bold: true }]);
  });

  it('leaves a single line, and a code block, to the input', () => {
    expect(paste('paragraph', '', 0, 'one line').tx).toBeNull();
    expect(paste('code', '', 0, 'a\nb').tx).toBeNull();
  });
});
