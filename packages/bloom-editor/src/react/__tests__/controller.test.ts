import type { RichTextInputHandle } from '@oxy.so/bloom-text';
import type { BlockSnapshot } from '../../model';
import { DEFAULT_SCHEMA, documentFromSnapshot, EditorStore } from '../../model';
import { EditorController, normalizeLink } from '../controller';

function idFactory(prefix: string) {
  let n = 0;
  return () => `${prefix}${++n}`;
}

function setup(blocks: BlockSnapshot[]) {
  const store = new EditorStore({
    document: documentFromSnapshot(blocks, idFactory('b')),
    schema: DEFAULT_SCHEMA,
    newId: idFactory('n'),
  });
  const controller = new EditorController(store);
  const calls: unknown[][] = [];
  const handle = new Proxy({} as RichTextInputHandle, {
    get:
      (_target, name) =>
      (...args: unknown[]) => {
        calls.push([name, ...args]);
        return false;
      },
  });
  const id = store.doc.root[0] as string;
  controller.inputs.set(id, handle);
  return { store, controller, calls, id };
}

describe('EditorController', () => {
  it('acts on the input of the block with the selection', () => {
    const { store, controller, calls, id } = setup([
      { type: 'paragraph', text: [{ text: 'hello world' }] },
    ]);
    controller.toggleMark('bold');
    expect(calls).toEqual([]);
    store.setSelection({ kind: 'text', blockId: id, start: 0, end: 5 });
    controller.toggleMark('bold');
    expect(calls).toEqual([['toggleMark', 'bold']]);
  });

  it('links the selected text, adding a scheme to a bare host', () => {
    const { store, controller, calls, id } = setup([
      { type: 'paragraph', text: [{ text: 'hello world' }] },
    ]);
    store.setSelection({ kind: 'text', blockId: id, start: 6, end: 11 });
    expect(controller.setLink('example.com/a')).toBe(true);
    expect(calls).toEqual([['setLink', 6, 11, 'world', 'https://example.com/a']]);
  });

  it('refuses an unsafe link or an empty selection', () => {
    const { store, controller, calls, id } = setup([
      { type: 'paragraph', text: [{ text: 'hello' }] },
    ]);
    store.setSelection({ kind: 'text', blockId: id, start: 0, end: 5 });
    expect(controller.setLink('javascript:alert(1)')).toBe(false);
    store.setSelection({ kind: 'text', blockId: id, start: 2, end: 2 });
    expect(controller.setLink('https://example.com')).toBe(false);
    expect(calls).toEqual([]);
  });

  it('removes the whole link the caret is in', () => {
    const { store, controller, calls, id } = setup([
      {
        type: 'paragraph',
        text: [
          { text: 'see ' },
          { text: 'the ', link: 'https://a.test' },
          { text: 'docs', link: 'https://a.test', bold: true },
          { text: ' now' },
        ],
      },
    ]);
    store.setSelection({ kind: 'text', blockId: id, start: 6, end: 6 });
    controller.removeLink();
    expect(calls).toEqual([['removeLink', 4, 12]]);
  });
});

describe('EditorController.startMention', () => {
  it('types the indicator, after a space when the caret follows a word', () => {
    const { store, controller, id } = setup([{ type: 'paragraph', text: [{ text: 'Ask' }] }]);
    store.setSelection({ kind: 'text', blockId: id, start: 3, end: 3 });
    controller.startMention('@');
    expect(store.doc.blocks[id]?.text).toEqual([{ text: 'Ask @' }]);
    expect(store.selection).toEqual({ kind: 'text', blockId: id, start: 5, end: 5 });
    store.setSelection({ kind: 'text', blockId: id, start: 0, end: 0 });
    controller.startMention('@');
    expect(store.doc.blocks[id]?.text).toEqual([{ text: '@Ask @' }]);
  });
});

describe('EditorController colours, links and mentions', () => {
  it('colours and highlights the selected text, and reads what is there', () => {
    const { store, controller, id } = setup([
      { type: 'paragraph', text: [{ text: 'hello world' }] },
    ]);
    store.setSelection({ kind: 'text', blockId: id, start: 2, end: 2 });
    expect(controller.setTextColor('red')).toBe(false);
    store.setSelection({ kind: 'text', blockId: id, start: 0, end: 5 });
    expect(controller.setTextColor('red')).toBe(true);
    expect(controller.setTextColor('yellow', 'background')).toBe(true);
    expect(store.doc.blocks[id]?.text).toEqual([
      { text: 'hello', color: 'red', background: 'yellow' },
      { text: ' world' },
    ]);
    expect(controller.textColors()).toEqual({ color: 'red', background: 'yellow' });
    // One undo step each, and `default` clears.
    controller.setTextColor('default');
    expect(store.doc.blocks[id]?.text?.[0]).toEqual({ text: 'hello', background: 'yellow' });
    store.undo();
    expect(controller.textColors()).toEqual({ color: 'red', background: 'yellow' });
  });

  it('opens the link field for a selection, or the whole link a caret is in', () => {
    const { store, controller, calls, id } = setup([
      {
        type: 'paragraph',
        text: [{ text: 'see ' }, { text: 'docs', link: 'https://d.test' }, { text: ' now' }],
      },
    ]);
    store.setSelection({ kind: 'text', blockId: id, start: 0, end: 0 });
    expect(controller.openLinkEditor()).toBe(false);
    expect(controller.ui.get().linking).toBeNull();
    store.setSelection({ kind: 'text', blockId: id, start: 6, end: 6 });
    expect(controller.openLinkEditor()).toBe(true);
    expect(store.selection).toEqual({ kind: 'text', blockId: id, start: 4, end: 8 });
    expect(calls).toEqual([['setSelection', 4, 8]]);
    expect(controller.ui.get().linking).toBe(id);
    expect(controller.linkAtSelection()).toBe('https://d.test');
  });

  it('puts a mention (an inline equation) at the selection', () => {
    const { store, controller, id } = setup([{ type: 'paragraph', text: [{ text: 'a  b' }] }]);
    store.setSelection({ kind: 'text', blockId: id, start: 2, end: 2 });
    controller.insertMention({
      indicator: '@',
      text: 'x^2',
      attributes: { kind: 'equation', latex: 'x^2' },
    });
    expect(store.doc.blocks[id]?.text).toEqual([
      { text: 'a ' },
      { text: 'x^2', mention: { indicator: '@', attributes: { kind: 'equation', latex: 'x^2' } } },
      { text: ' b' },
    ]);
    expect(store.selection).toEqual({ kind: 'text', blockId: id, start: 5, end: 5 });
  });
});

describe('normalizeLink', () => {
  it.each([
    ['https://a.test/x', 'https://a.test/x'],
    ['  mailto:a@b.test ', 'mailto:a@b.test'],
    ['a.test', 'https://a.test'],
    ['sub.a.test:8080/p?q=1', 'https://sub.a.test:8080/p?q=1'],
    ['javascript:alert(1)', null],
    ['not a link', null],
    ['word', null],
    ['', null],
  ])('%s → %s', (input, expected) => {
    expect(normalizeLink(input)).toBe(expected);
  });
});
