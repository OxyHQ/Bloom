/**
 * @jest-environment jsdom
 */
import { act, type ReactElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { documentFromSnapshot, EditorStore, type BlockSnapshot } from '../../model';
import { BlockEditor, EditorSurface, type BlockEditorProps } from '../BlockEditor';
import { EditorController, useEditorController } from '../controller';
import { BlockDecorations } from '../decorations';
import { EditorToolbar } from '../EditorToolbar';
import { selectBlocks } from '../block-selection';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
let host: HTMLElement | null = null;

function mount(element: ReactElement): HTMLElement {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => root?.render(element));
  return host;
}

afterEach(() => {
  act(() => root?.unmount());
  host?.remove();
  root = null;
  host = null;
  document.body.innerHTML = '';
});

function makeStore(blocks: BlockSnapshot[]) {
  let n = 0;
  return new EditorStore({
    document: documentFromSnapshot(blocks, () => `b${++n}`),
    newId: () => `n${++n}`,
  });
}

const PARAGRAPHS: BlockSnapshot[] = [
  { type: 'paragraph', text: [{ text: 'Hello world' }] },
  { type: 'paragraph', text: [{ text: 'Second' }] },
];

function Editor(props: Omit<BlockEditorProps, 'slashItems'> & { toolbar?: boolean }) {
  const controller = useEditorController(props.store);
  return (
    <>
      <BlockEditor slashItems={[]} controller={controller} {...props} />
      {props.toolbar ? <EditorToolbar controller={controller} /> : null}
    </>
  );
}

/** Text drawn over the blocks (not in an input), with its computed background. */
function drawnPieces(container: HTMLElement): { text: string; background: string }[] {
  return Array.from(container.querySelectorAll('[aria-hidden="true"] span'))
    .filter((el) => el.children.length === 0 && el.textContent)
    .map((el) => ({
      text: el.textContent ?? '',
      background: (el as HTMLElement).style.backgroundColor,
    }));
}

describe('domIdPrefix', () => {
  it('ids every block row with the default prefix', () => {
    const store = makeStore(PARAGRAPHS);
    mount(<Editor store={store} />);
    expect(document.getElementById('bloom-block-b1')).not.toBeNull();
    expect(document.getElementById('bloom-block-b2')).not.toBeNull();
  });

  it('gives two surfaces showing the same block different ids', () => {
    const store = makeStore(PARAGRAPHS);
    mount(
      <>
        <Editor store={store} />
        <Editor store={store} domIdPrefix="synced-" />
      </>,
    );
    expect(document.querySelectorAll('[id="bloom-block-b1"]')).toHaveLength(1);
    expect(document.querySelectorAll('[id="synced-b1"]')).toHaveLength(1);
    const ids = Array.from(document.querySelectorAll('[id]')).map((el) => el.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('text-range decorations', () => {
  it('draws highlights and a named caret over a block that is not being edited', () => {
    const store = makeStore(PARAGRAPHS);
    const decorations = new BlockDecorations();
    const container = mount(<Editor store={store} decorations={decorations} />);
    expect(drawnPieces(container)).toEqual([]);

    act(() =>
      decorations.set(
        new Map([
          [
            'b1',
            {
              ranges: [
                {
                  start: 6,
                  end: 11,
                  background: 'rgb(255, 230, 150)',
                  caret: { color: 'rgb(200, 0, 0)', label: 'Ana' },
                },
              ],
            },
          ],
        ]),
      ),
    );
    const pieces = drawnPieces(container);
    expect(pieces.filter((p) => p.text !== '\u200b')).toEqual([
      { text: 'Hello ', background: '' },
      { text: 'world', background: 'rgb(255, 230, 150)' },
      { text: 'Ana', background: 'rgb(200, 0, 0)' },
    ]);
    // The caret: a span of no width whose left border is the caret colour.
    const caret = Array.from(container.querySelectorAll('span')).find(
      (el) => (el as HTMLElement).style.borderLeftColor === 'rgb(200, 0, 0)',
    );
    expect(caret?.textContent).toBe('\u200bAna');
    // No edge for a decoration without a colour.
    const row = document.getElementById('bloom-block-b1') as HTMLElement;
    expect(row.style.borderLeftWidth).toBe('');
  });

  it('keeps the edge of a decoration with a colour', () => {
    const store = makeStore(PARAGRAPHS);
    const decorations = new BlockDecorations();
    decorations.set(new Map([['b2', { color: 'rgb(0, 0, 200)', label: 'Ben is editing' }]]));
    mount(<Editor store={store} decorations={decorations} />);
    const row = document.getElementById('bloom-block-b2') as HTMLElement;
    expect(getComputedStyle(row).borderLeftColor).toBe('rgb(0, 0, 200)');
  });
});

describe('text-range decorations while editing (web)', () => {
  const original = Range.prototype.getClientRects;
  afterEach(() => {
    Range.prototype.getClientRects = original;
  });

  it('measures them on the input and draws them over it', async () => {
    // jsdom lays nothing out: each character is 10px wide on a 16px line.
    Range.prototype.getClientRects = function getClientRects(this: Range) {
      const width = (this.endOffset - this.startOffset) * 10;
      return [{ left: this.startOffset * 10, top: 2, width, height: 16 }] as unknown as DOMRectList;
    };
    const store = makeStore(PARAGRAPHS);
    const decorations = new BlockDecorations();
    decorations.set(
      new Map([
        [
          'b1',
          {
            ranges: [
              {
                start: 6,
                end: 11,
                background: 'rgb(255, 230, 150)',
                caret: { color: 'rgb(200, 0, 0)', label: 'Ana' },
              },
            ],
          },
        ],
      ]),
    );
    const container = mount(<Editor store={store} decorations={decorations} />);
    const input = container.querySelector('[data-testid="block-input-b1"]') as Element;
    act(() => {
      input.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    });
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });
    // Not drawn as text any more: the input is being edited.
    expect(drawnPieces(container)).toEqual([]);
    const painted = (color: string) =>
      (Array.from(container.querySelectorAll('div')) as HTMLElement[]).find(
        (el) => el.style.backgroundColor === color,
      );
    const highlight = painted('rgb(255, 230, 150)');
    expect(highlight?.style.left).toBe('60px');
    expect(highlight?.style.width).toBe('50px');
    const caret = painted('rgb(200, 0, 0)');
    // At the end of the range, centred on it.
    expect(caret?.style.left).toBe('109px');
    expect(caret?.textContent).toBe('Ana');
    // The highlight is under the input's text, the caret over it.
    const order = (el: Element | undefined) =>
      el ? input.compareDocumentPosition(el) : Number.NaN;
    expect(order(highlight) & Node.DOCUMENT_POSITION_PRECEDING).toBeTruthy();
    expect(order(caret) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});

describe('formatActions', () => {
  it('offers the app’s actions while text is selected, with that selection', () => {
    const store = makeStore(PARAGRAPHS);
    const pressed: unknown[] = [];
    const comment = { id: 'comment', label: 'Comment', onPress: (s: unknown) => pressed.push(s) };
    let controllerRef: ReturnType<typeof useEditorController> | null = null;
    function WithToolbar() {
      const controller = useEditorController(store);
      controllerRef = controller;
      return (
        <>
          <BlockEditor
            store={store}
            slashItems={[]}
            controller={controller}
            formatActions={[comment]}
          />
          <EditorToolbar controller={controller} />
        </>
      );
    }
    mount(<WithToolbar />);
    const controller = controllerRef as unknown as ReturnType<typeof useEditorController>;
    act(() => {
      controller.ui.set({ focused: 'b1' });
      store.setSelection({ kind: 'text', blockId: 'b1', start: 2, end: 2 });
    });
    expect(document.querySelector('[aria-label="Comment"]')).toBeNull();

    act(() => store.setSelection({ kind: 'text', blockId: 'b1', start: 0, end: 5 }));
    const button = document.querySelector('[aria-label="Comment"]') as HTMLElement;
    expect(button).not.toBeNull();
    expect(button.textContent).toBe('Comment');
    act(() => button.click());
    expect(pressed).toEqual([{ blockId: 'b1', start: 0, end: 5 }]);
  });
});

describe('confirmRemove', () => {
  function keyDown(key: string) {
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
    });
  }

  function setup(confirmRemove: BlockEditorProps['confirmRemove']) {
    const store = makeStore(PARAGRAPHS);
    let controllerRef: ReturnType<typeof useEditorController> | null = null;
    function Host() {
      const controller = useEditorController(store);
      controllerRef = controller;
      return (
        <BlockEditor
          store={store}
          slashItems={[]}
          controller={controller}
          confirmRemove={confirmRemove}
        />
      );
    }
    mount(<Host />);
    const controller = controllerRef as unknown as ReturnType<typeof useEditorController>;
    act(() => selectBlocks(controller.ui, ['b1', 'b2']));
    return { store, ui: controller.ui };
  }

  it('asks before Backspace removes selected blocks, and keeps them on a no', () => {
    const confirm = jest.fn(() => false);
    const { store, ui } = setup(confirm);
    keyDown('Backspace');
    expect(confirm).toHaveBeenCalledWith(['b1', 'b2']);
    expect(store.doc.root).toEqual(['b1', 'b2']);
    expect(ui.get().selectedBlocks).toEqual(['b1', 'b2']);
  });

  it('removes them once the answer resolves true, asking once meanwhile', async () => {
    let answer: (value: boolean) => void = () => {};
    const confirm = jest.fn(
      () =>
        new Promise<boolean>((resolve) => {
          answer = resolve;
        }),
    );
    const { store, ui } = setup(confirm);
    keyDown('Delete');
    keyDown('Delete');
    expect(confirm).toHaveBeenCalledTimes(1);
    expect(store.doc.root).toEqual(['b1', 'b2']);
    await act(async () => answer(true));
    expect(store.doc.root.every((id) => id !== 'b1' && id !== 'b2')).toBe(true);
    expect(ui.get().selectedBlocks).toEqual([]);
  });

  it('copies on cut but removes only once agreed', () => {
    const confirm = jest.fn(() => false);
    const { store } = setup(confirm);
    const data = new Map<string, string>();
    const event = new Event('cut', { bubbles: true, cancelable: true }) as ClipboardEvent;
    Object.defineProperty(event, 'clipboardData', {
      value: { setData: (type: string, value: string) => data.set(type, value) },
    });
    act(() => {
      document.activeElement?.dispatchEvent(event);
    });
    expect(data.get('text/plain')?.trim().split(/\n+/)).toEqual(['Hello world', 'Second']);
    expect(confirm).toHaveBeenCalledWith(['b1', 'b2']);
    expect(store.doc.root).toEqual(['b1', 'b2']);
  });

  it('asks before the block menu deletes', () => {
    const confirm = jest.fn(() => true);
    const { store, ui } = setup(confirm);
    act(() => ui.set({ blockMenu: 'b1' }));
    const remove = Array.from(document.querySelectorAll('[role="menuitem"]')).find(
      (el) => el.textContent === 'Delete',
    ) as HTMLElement;
    act(() => remove.click());
    expect(confirm).toHaveBeenCalledWith(['b1', 'b2']);
    expect(store.doc.root.includes('b1')).toBe(false);
  });
});

describe('onPasteText', () => {
  function paste(target: Element, text: string, html: string) {
    const event = new Event('paste', { bubbles: true, cancelable: true }) as ClipboardEvent;
    Object.defineProperty(event, 'clipboardData', {
      value: {
        items: [],
        files: [],
        getData: (type: string) =>
          type === 'text/html' ? html : type === 'text/plain' ? text : '',
      },
    });
    act(() => {
      target.dispatchEvent(event);
    });
    return event;
  }

  it('lets the app take a paste before the editor does', () => {
    const store = makeStore(PARAGRAPHS);
    const onPasteText = jest.fn(() => true);
    mount(<Editor store={store} onPasteText={onPasteText} />);
    const input = document.querySelector('[data-testid="block-input-b1"]') as Element;
    const event = paste(input, 'https://example.com', '<a href="https://example.com">x</a>');
    expect(onPasteText).toHaveBeenCalledWith({
      text: 'https://example.com',
      html: '<a href="https://example.com">x</a>',
      blockId: 'b1',
    });
    expect(event.defaultPrevented).toBe(true);
    expect(store.doc.root).toEqual(['b1', 'b2']);
  });

  it('leaves the paste to the editor when the app does not take it', () => {
    const store = makeStore(PARAGRAPHS);
    const onPasteText = jest.fn(() => false);
    mount(<Editor store={store} onPasteText={onPasteText} />);
    const input = document.querySelector('[data-testid="block-input-b2"]') as Element;
    const event = paste(input, 'plain words', '');
    expect(onPasteText).toHaveBeenCalledWith({ text: 'plain words', blockId: 'b2' });
    // Plain text is the input's to paste.
    expect(event.defaultPrevented).toBe(false);

    const html = paste(input, 'Title', '<h2>Title</h2><p>Body</p>');
    expect(html.defaultPrevented).toBe(true);
    expect(store.doc.root.length).toBeGreaterThan(2);
  });
});

describe('clipboard ownership', () => {
  function clipboard(target: EventTarget, kind: 'copy' | 'cut') {
    const data = new Map<string, string>();
    const event = new Event(kind, { bubbles: true, cancelable: true }) as ClipboardEvent;
    const setData = jest.fn((type: string, value: string) => data.set(type, value));
    Object.defineProperty(event, 'clipboardData', { value: { setData } });
    act(() => {
      target.dispatchEvent(event);
    });
    return { data, event, setData };
  }

  it.each([
    ['copy', 'input'],
    ['cut', 'input'],
    ['copy', 'textarea'],
    ['cut', 'textarea'],
    ['copy', 'contenteditable'],
    ['cut', 'contenteditable'],
  ] as const)('leaves %s in an external %s alone after a block selection', (kind, field) => {
    const store = makeStore(PARAGRAPHS);
    const controller = new EditorController(store);
    const confirmRemove = jest.fn(() => true);
    const container = mount(
      <>
        <BlockEditor
          store={store}
          controller={controller}
          slashItems={[]}
          confirmRemove={confirmRemove}
        />
        {field === 'input' ? (
          <input data-testid="external" defaultValue="External text" />
        ) : field === 'textarea' ? (
          <textarea data-testid="external" defaultValue="External text" />
        ) : (
          <div data-testid="external" contentEditable suppressContentEditableWarning>
            External text
          </div>
        )}
      </>,
    );
    act(() => selectBlocks(controller.ui, ['b1']));
    const input = container.querySelector<HTMLInputElement>('[data-testid="external"]')!;
    act(() => {
      input.focus();
      if ('select' in input) input.select();
    });
    const before = store.getSnapshot();
    const { data, event } = clipboard(input, kind);
    expect(data.size).toBe(0);
    expect(event.defaultPrevented).toBe(false);
    expect(confirmRemove).not.toHaveBeenCalled();
    expect(store.getSnapshot()).toBe(before);
  });

  it.each(['copy', 'cut'] as const)(
    'only the focused editor handles %s when both retain selections',
    (kind) => {
      const first = makeStore(PARAGRAPHS);
      const second = makeStore([{ type: 'paragraph', text: [{ text: 'Other editor' }] }]);
      const a = new EditorController(first);
      const b = new EditorController(second);
      const confirmA = jest.fn(() => true);
      const confirmB = jest.fn(() => true);
      mount(
        <>
          <BlockEditor store={first} controller={a} slashItems={[]} confirmRemove={confirmA} />
          <BlockEditor
            store={second}
            controller={b}
            slashItems={[]}
            domIdPrefix="second-"
            confirmRemove={confirmB}
          />
        </>,
      );
      act(() => selectBlocks(a.ui, ['b1']));
      act(() => selectBlocks(b.ui, ['b1']));
      const before = first.getSnapshot();
      const { data, setData } = clipboard(document.getElementById('second-b1')!, kind);
      expect(setData).toHaveBeenCalledTimes(1);
      expect(data.get('text/plain')?.trim()).toBe('Other editor');
      expect(first.getSnapshot()).toBe(before);
      expect(confirmA).not.toHaveBeenCalled();
      expect(confirmB).toHaveBeenCalledTimes(kind === 'cut' ? 1 : 0);
      if (kind === 'cut') {
        expect(second.doc.blocks.b1).toBeUndefined();
        act(() => second.undo());
        expect(second.doc.blocks.b1?.text).toEqual([{ text: 'Other editor' }]);
      }
    },
  );

  it('moves keyboard focus to the whole-block selection without refocusing for unrelated UI changes', () => {
    const store = makeStore(PARAGRAPHS);
    const controller = new EditorController(store);
    const container = mount(
      <>
        <BlockEditor store={store} controller={controller} slashItems={[]} />
        <input />
      </>,
    );
    act(() => selectBlocks(controller.ui, ['b1']));
    const owner = container.querySelector('[data-bloom-editor-surface]');
    expect(owner).not.toBeNull();
    expect(document.activeElement).toBe(owner);
    const { data } = clipboard(document.activeElement!, 'copy');
    expect(data.get('text/plain')?.trim()).toBe('Hello world');
    const input = container.querySelector('input')!;
    act(() => input.focus());
    act(() => controller.ui.set({ blockMenu: null }));
    expect(document.activeElement).toBe(input);
    expect(clipboard(document, 'cut').event.defaultPrevented).toBe(false);
    expect(store.doc.blocks.b1).toBeDefined();
  });
  it('does not let an enclosing editor intercept a nested editor cut', () => {
    const first = makeStore(PARAGRAPHS);
    const second = makeStore([{ type: 'paragraph', text: [{ text: 'Nested text' }] }]);
    const outer = new EditorController(first),
      inner = new EditorController(second);
    const confirmOuter = jest.fn(() => true);
    mount(
      <EditorSurface store={first} controller={outer} slashItems={[]} confirmRemove={confirmOuter}>
        <BlockEditor store={second} controller={inner} slashItems={[]} domIdPrefix="inner-" />
      </EditorSurface>,
    );
    act(() => selectBlocks(outer.ui, ['b1']));
    act(() => selectBlocks(inner.ui, ['b1']));
    const before = first.getSnapshot();
    const result = clipboard(document.activeElement!, 'cut');
    expect(result.data.get('text/plain')?.trim()).toBe('Nested text');
    expect(first.getSnapshot()).toBe(before);
    expect(confirmOuter).not.toHaveBeenCalled();
    expect(second.doc.blocks.b1).toBeUndefined();
  });

  it('does not reclaim focus from an external field when callbacks change', () => {
    const store = makeStore(PARAGRAPHS);
    const controller = new EditorController(store);
    const ui = () => (
      <>
        <BlockEditor
          store={store}
          controller={controller}
          slashItems={[]}
          confirmRemove={() => true}
        />
        <input />
      </>
    );
    const container = mount(ui());
    act(() => selectBlocks(controller.ui, ['b1']));
    const input = container.querySelector('input')!;
    act(() => input.focus());
    act(() => root?.render(ui()));
    expect(document.activeElement).toBe(input);
    expect(clipboard(input, 'cut').data.size).toBe(0);
    expect(store.doc.blocks.b1).toBeDefined();
  });
  it('preserves text clipboard inside a custom renderer despite retained block selection', () => {
    const store = makeStore(PARAGRAPHS);
    const controller = new EditorController(store);
    const container = mount(
      <EditorSurface store={store} controller={controller} slashItems={[]}>
        <input />
      </EditorSurface>,
    );
    act(() => selectBlocks(controller.ui, ['b1']));
    const field = container.querySelector('input')!;
    act(() => field.focus());
    const before = store.getSnapshot();
    expect(clipboard(field, 'cut').event.defaultPrevented).toBe(false);
    expect(store.getSnapshot()).toBe(before);
  });
});
