/** @jest-environment jsdom */
// Platform command ownership only; actual input focus/IME is checked on device.
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { Platform } from 'react-native';
import { documentFromSnapshot, EditorStore } from '../../model';
import { BlockEditor } from '../BlockEditor';
import { EditorController } from '../controller';
import { EditorToolbar } from '../EditorToolbar';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

it('keeps native caret navigation nonmodal and owns explicit link actions through the mounted surface', () => {
  const os = jest.replaceProperty(Platform, 'OS', 'android');
  let id = 0;
  const next = () => `b${++id}`;
  const store = new EditorStore({
    document: documentFromSnapshot(
      [
        {
          type: 'paragraph',
          text: [
            { text: 'Before ' },
            { text: 'linked', link: 'https://example.test/one' },
            { text: ' after' },
          ],
        },
        { type: 'paragraph', text: [{ text: 'Elsewhere' }] },
      ],
      next,
    ),
    newId: next,
  });
  const controller = new EditorController(store);
  const firstOpen = jest.fn();
  const secondOpen = jest.fn();
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);
  const render = (onOpenLink = firstOpen, readOnly = false, surface = true) =>
    act(() =>
      root.render(
        <>
          {surface ? (
            <BlockEditor
              store={store}
              controller={controller}
              slashItems={[]}
              onOpenLink={onOpenLink}
              readOnly={readOnly}
            />
          ) : null}
          <EditorToolbar controller={controller} />
        </>,
      ),
    );
  const button = (label: string) => {
    const element = host.querySelector<HTMLElement>(`[aria-label="${label}"]`);
    if (!element) throw new Error(`Missing ${label}`);
    return element;
  };
  try {
    render();
    act(() => {
      store.setSelection({ kind: 'text', blockId: 'b1', start: 10, end: 10 });
      controller.ui.set({ focused: 'b1', marks: { blockId: 'b1', marks: { link: true } } });
    });
    expect(host.querySelector('[role="dialog"]')).toBeNull();
    expect(controller.ui.get().linking).toBeNull();
    act(() => button('Open').click());
    expect(firstOpen).toHaveBeenCalledWith('https://example.test/one');
    const registered = controller.ui.get().inlineActions;
    render(secondOpen);
    expect(controller.ui.get().inlineActions).toBe(registered);
    act(() => button('Open').click());
    expect(secondOpen).toHaveBeenCalledWith('https://example.test/one');
    act(() => button('Link').click());
    expect(controller.ui.get().linking).toBe('b1');
    expect(controller.textSelection).toEqual({ kind: 'text', blockId: 'b1', start: 7, end: 13 });
    expect(controller.linkAtSelection()).toBe('https://example.test/one');
    act(() => controller.cancelLinkEditor());
    act(() => store.setSelection({ kind: 'text', blockId: 'b1', start: 10, end: 10 }));
    const input = controller.inputs.get('b1');
    if (!input) throw new Error('Missing input adapter');
    const remove = jest.spyOn(input, 'removeLink');
    act(() => button('Remove link').click());
    expect(remove).toHaveBeenCalledWith(7, 13);
    act(() => store.setSelection({ kind: 'text', blockId: 'b2', start: 2, end: 2 }));
    expect(host.querySelector('[aria-label="Open"]')).toBeNull();
    render(secondOpen, true);
    expect(controller.ui.get().inlineActions).toBeNull();
    expect(host.querySelector('[role="toolbar"]')).toBeNull();
    render(secondOpen);
    expect(controller.ui.get().inlineActions).not.toBeNull();
    render(secondOpen, false, false);
    expect(controller.ui.get().inlineActions).toBeNull();
    expect(host.querySelector('[role="toolbar"]')).toBeNull();
  } finally {
    act(() => root.unmount());
    host.remove();
    os.restore();
  }
});
