/**
 * @jest-environment jsdom
 */
import { act, type ReactElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { documentFromSnapshot, EditorStore, type BlockSnapshot } from '../../model';
import { BlockEditor, type BlockEditorProps } from '../BlockEditor';
import { useEditorController } from '../controller';
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
      document.dispatchEvent(event);
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
