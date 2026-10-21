/** @jest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Platform } from 'react-native';
import { documentFromSnapshot, EditorStore, type BlockSnapshot, editText } from '../../model';
import { BlockEditor } from '../BlockEditor';
import { EditorController } from '../controller';
import type { MentionSource, SlashMenuItem } from '../context';
import { inputProps, mentionInsertions } from './support/enriched-input';
import { renderedSuggestions } from './support/suggestion-list';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let root: Root;
let host: HTMLDivElement;
const items: SlashMenuItem[] = [
  {
    id: 'heading',
    label: 'Heading',
    keywords: ['encabezado'],
    group: 'basic',
    action: { kind: 'block', type: 'heading_1' },
  },
  { id: 'toggle', label: 'Toggle', group: 'basic', action: { kind: 'block', type: 'toggle' } },
];
function setup(blocks: BlockSnapshot[] = [{ type: 'paragraph', text: [] }]) {
  let n = 0;
  const store = new EditorStore({
    document: documentFromSnapshot(blocks, () => `b${++n}`),
    newId: () => `b${++n}`,
  });
  const controller = new EditorController(store);
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  const draw = (readOnly = false, mentions?: MentionSource) =>
    act(() =>
      root.render(
        <BlockEditor
          store={store}
          controller={controller}
          slashItems={items}
          readOnly={readOnly}
          mentions={mentions}
        />,
      ),
    );
  draw();
  return { store, controller, draw };
}
function input(id = 'b1') {
  return document.querySelector<HTMLElement>(`[data-testid="block-input-${id}"]`)!;
}
function focus(id = 'b1') {
  act(() => input(id).focus());
}
function select(at: number, end = at, id = 'b1') {
  act(() =>
    inputProps.get(`block-input-${id}`)?.onChangeSelection?.({ nativeEvent: { start: at, end } }),
  );
}
function type(text: string, id = 'b1') {
  act(() => {
    input(id).innerHTML = `<p>${text}</p>`;
    inputProps
      .get(`block-input-${id}`)
      ?.onChangeHtml?.({ nativeEvent: { value: `<p>${text}</p>` } });
  });
}
function key(key: string, options: KeyboardEventInit = {}, id = 'b1') {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...options });
  act(() => input(id).dispatchEvent(event));
  return event;
}
function popup() {
  const id = input().getAttribute('aria-controls')!;
  return renderedSuggestions.get(id)!;
}
afterEach(() => {
  act(() => root.unmount());
  host.remove();
  renderedSuggestions.clear();
  mentionInsertions.length = 0;
});

it.each(['change-first', 'selection-first'])(
  'opens and filters in %s event order without moving focus',
  (order) => {
    const { controller } = setup();
    focus();
    for (let i = 1; i <= '/enca'.length; i++) {
      if (order === 'selection-first') select(i);
      type('/enca'.slice(0, i));
      if (order === 'change-first') select(i);
    }
    expect(controller.ui.get().slash?.query).toBe('enca');
    expect(popup().suggestions.map((item) => item.id)).toEqual(['heading']);
    expect(document.activeElement).toBe(input());
    expect(input().getAttribute('role')).toBe('combobox');
    expect(
      document.getElementById(input().getAttribute('aria-activedescendant')!)?.textContent,
    ).toBe('Heading');
  },
);

it('Tab selects the active result atomically instead of indenting, and Undo restores the query', () => {
  const { store } = setup([
    { type: 'paragraph', text: [{ text: 'Previous' }] },
    { type: 'paragraph', text: [] },
  ]);
  focus('b2');
  type('/', 'b2');
  select(1, 1, 'b2');
  const before = store.doc;
  expect(key('Tab', {}, 'b2').defaultPrevented).toBe(true);
  expect(store.doc.root).toEqual(['b1', 'b2']);
  expect(store.doc.blocks.b2?.type).toBe('heading_1');
  act(() => {
    store.undo();
  });
  expect(store.doc).toEqual(before);
});

it('Escape and empty-result Tab leave typed text and structure intact', () => {
  const { store, controller } = setup();
  focus();
  type('/zzz');
  select(4);
  // Whole text insertion deliberately does not trigger: open then type a query.
  type('');
  select(0);
  type('/');
  select(1);
  type('/zzz');
  select(4);
  const before = store.doc;
  expect(popup().suggestions).toEqual([]);
  key('Tab');
  expect(store.doc).toBe(before);
  expect(controller.ui.get().slash).toBeNull();
  type('');
  select(0);
  type('/');
  select(1);
  const slashDoc = store.doc;
  key('Escape');
  expect(store.doc).toBe(slashDoc);
  expect(controller.ui.get().slash).toBeNull();
  expect(input().hasAttribute('aria-controls')).toBe(false);
});

it('closes when the caret leaves the query, another block takes focus, or the shared panel dismisses', () => {
  const { controller } = setup([
    { type: 'paragraph', text: [] },
    { type: 'paragraph', text: [] },
  ]);
  focus();
  type('/');
  select(1);
  select(0);
  expect(controller.ui.get().slash).toBeNull();
  type('');
  type('/');
  select(1);
  focus('b2');
  expect(controller.ui.get().slash).toBeNull();
  focus();
  type('');
  type('/');
  select(1);
  act(() => popup().onOpenChange?.(false));
  expect(controller.ui.get().slash).toBeNull();
});

it('does not execute Enter or Tab while the browser is composing', () => {
  const { store, controller } = setup();
  focus();
  type('/');
  select(1);
  const before = store.doc;
  expect(key('Enter', { isComposing: true }).defaultPrevented).toBe(false);
  expect(key('Tab', { isComposing: true }).defaultPrevented).toBe(false);
  expect(store.doc).toBe(before);
  expect(controller.ui.get().slash).not.toBeNull();
});

it('rejects a stale menu after permission revocation or replacement of the slash text', () => {
  const { store, controller, draw } = setup();
  focus();
  type('/');
  select(1);
  const pending = popup();
  const before = store.doc;
  draw(true);
  expect(key('Tab').defaultPrevented).toBe(false);
  type('Forbidden edit');
  act(() => pending.onSelectSuggestion?.(pending.suggestions[0]!, 0));
  expect(store.doc).toBe(before);
  expect(controller.ui.get().slash).toBeNull();
  expect(document.querySelector('[role="listbox"]')).toBeNull();
  draw(false);
  focus();
  type('');
  type('/');
  select(1);
  const stale = popup();
  act(() => {
    store.run((c) => editText(c, 'b1', [{ text: 'Remote content' }]));
  });
  const remote = store.doc;
  act(() => stale.onSelectSuggestion?.(stale.suggestions[0]!, 0));
  expect(store.doc).toBe(remote);
});

it('does not let a completed mention lookup reopen a dismissed or read-only editor', async () => {
  const { controller, draw } = setup();
  let complete!: (items: { id: string; label: string; attributes: { id: string } }[]) => void;
  const mentions: MentionSource = {
    indicators: ['@'],
    search: () =>
      new Promise((resolve) => {
        complete = resolve;
      }),
  };
  draw(false, mentions);
  focus();
  act(() => inputProps.get('block-input-b1')?.onStartMention?.('@'));
  expect(popup().loading).toBe(true);
  draw(true, mentions);
  await act(async () => {
    complete([{ id: 'person', label: 'Person', attributes: { id: 'person' } }]);
  });
  expect(controller.ui.get().mention).toBeNull();
  expect(mentionInsertions).toEqual([]);
});

it('uses the same controlled renderer for mention selection and preserves attributes', async () => {
  const { draw, controller } = setup();
  draw(false, {
    indicators: ['@'],
    search: async () => [
      { id: 'one', label: 'Person', group: 'People', attributes: { kind: 'person', id: 'one' } },
    ],
  });
  focus();
  await act(async () => inputProps.get('block-input-b1')?.onStartMention?.('@'));
  expect(popup().kind).toBe('mention');
  key('Tab');
  expect(mentionInsertions).toEqual([['@', 'Person', { kind: 'person', id: 'one' }]]);
  expect(controller.ui.get().mention).toBeNull();
});

it('closes on native external blur; option activation itself does not require losing input focus', () => {
  const { controller } = setup();
  focus();
  type('/');
  select(1);
  const original = Platform.OS;
  try {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'ios' });
    act(() => inputProps.get('block-input-b1')?.onBlur?.());
    expect(controller.ui.get().slash).toBeNull();
  } finally {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: original });
  }
});

it('anchors at the measured caret and falls back to the input rectangle when geometry is unavailable', () => {
  setup();
  focus();
  type('/');
  select(1);
  const anchor = popup().anchor!;
  const wrapper = input().parentElement!;
  const context = anchor.contextRef.current as unknown as HTMLElement;
  const box = (left: number, top: number, width: number, height: number) => ({
    left,
    top,
    right: left + width,
    bottom: top + height,
    x: left,
    y: top,
    width,
    height,
    toJSON: () => ({}),
  });
  context.getBoundingClientRect = () => box(20, 40, 300, 24);
  wrapper.getBoundingClientRect = () => box(20, 40, 300, 24);
  const previous = Range.prototype.getClientRects;
  Range.prototype.getClientRects = () => [box(42, 44, 0, 16)] as unknown as DOMRectList;
  try {
    expect(anchor.getRect()).toEqual({ left: 42, right: 42, top: 44, bottom: 60 });
    input().innerHTML = '<p>Not the editor value yet</p>';
    expect(anchor.getRect()).toMatchObject({ left: 20, right: 320, top: 40, bottom: 64 });
  } finally {
    Range.prototype.getClientRects = previous;
  }
});
