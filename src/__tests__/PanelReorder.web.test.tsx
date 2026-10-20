/** @jest-environment jsdom */
import { act, useRef } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Platform } from 'react-native';
import { usePanelReorder } from '../app-shell/use-panel-reorder';
import { reorderPanelIds } from '../app-shell/panel-reorder';
import type { AppShellPanelLayout } from '../app-shell';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const panels = [
  { id: 'main' },
  { id: 'a', reorderable: true },
  { id: 'hidden', reorderable: true, visible: false },
  { id: 'b', reorderable: true },
  { id: 'c', reorderable: true },
];
let controller: ReturnType<typeof usePanelReorder>;
function Harness({ layout }: { layout: AppShellPanelLayout }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const control = usePanelReorder({
    layout,
    rootRef,
    scope: 'test',
    vertical: false,
    documentHorizontal: true,
    tracks: layout.panels.map((panel) => ({
      id: panel.id,
      width: 200,
      gap: 8,
      visible: panel.visible !== false,
    })),
  });
  controller = control;
  return (
    <div
      ref={rootRef}
      data-bloom-panel-group="test"
      data-bloom-panel-ordering={control.ordering ? 'true' : undefined}
    >
      {layout.panels.map((panel, index) => (
        <div
          key={panel.id}
          data-bloom-panel-owner="test"
          data-bloom-panel-index={index}
          data-panel-id={panel.id}
        >
          {control.canReorder(panel.id) ? (
            <button data-bloom-panel-reorder={panel.id}>{panel.id}</button>
          ) : null}
        </div>
      ))}
      <span aria-live="polite">{control.announcement}</span>
    </div>
  );
}
let host: HTMLDivElement;
let root: Root;
let previousPlatform: typeof Platform.OS;
let frames: Map<number, FrameRequestCallback>;
beforeEach(() => {
  previousPlatform = Platform.OS;
  Platform.OS = 'web';
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  frames = new Map();
  let serial = 0;
  window.requestAnimationFrame = jest.fn((callback) => {
    frames.set(++serial, callback);
    return serial;
  });
  window.cancelAnimationFrame = jest.fn((id) => {
    if (id != null) frames.delete(id);
  });
  window.scrollBy = jest.fn();
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
  Platform.OS = previousPlatform;
  jest.restoreAllMocks();
});
function render(layout: AppShellPanelLayout) {
  act(() => root.render(<Harness layout={layout} />));
  let position = 0;
  for (const node of host.querySelectorAll<HTMLElement>('[data-panel-id]')) {
    const id = node.dataset.panelId;
    const left = position;
    if (id !== 'hidden') position += 208;
    node.getBoundingClientRect = () => ({
      left,
      right: left + 200,
      top: 0,
      bottom: 700,
      width: 200,
      height: 700,
      x: left,
      y: 0,
      toJSON: () => ({}),
    });
  }
}
function handle(id: string) {
  const node = host.querySelector<HTMLElement>(`[data-bloom-panel-reorder="${id}"]`);
  if (!node) throw new Error(`Missing handle ${id}`);
  return node;
}
function pointer(target: EventTarget, type: string, x: number) {
  if (type === 'pointerdown') {
    const id = (target as HTMLElement).dataset.bloomPanelReorder;
    if (!id) throw new Error('Missing drag identity');
    act(() => {
      void controller.start(id, x, 20);
    });
  } else if (type === 'pointermove') act(() => controller.update(x, 20));
  else if (type === 'pointerup')
    return act(async () => {
      await controller.finish(true, x, 20);
    });
  else
    act(() => {
      void controller.finish(false, x, 20);
    });
}
function key(id: string, value: string) {
  act(() =>
    handle(id).dispatchEvent(
      new KeyboardEvent('keydown', { key: value, bubbles: true, cancelable: true }),
    ),
  );
}
it('moves only eligible slots, preserving fixed and hidden descriptors', () => {
  expect(reorderPanelIds(['main', 'a', 'hidden', 'b', 'c'], ['a', 'b', 'c'], 'a', 'c')).toEqual([
    'main',
    'b',
    'hidden',
    'c',
    'a',
  ]);
  expect(reorderPanelIds(['main', 'a'], ['a'], 'main', 'a')).toEqual(['main', 'a']);
});
it('keyboard reorders are controlled, keep fixed slots, and retain keyed hosts and focus', () => {
  const onPanelOrderChange = jest.fn();
  render({ panels, onPanelOrderChange });
  expect(host.querySelector('[data-bloom-panel-reorder="main"]')).toBeNull();
  const original = handle('a');
  original.focus();
  key('a', 'ArrowRight');
  expect(onPanelOrderChange).toHaveBeenLastCalledWith(['main', 'b', 'hidden', 'a', 'c']);
  const nextPanels = ['main', 'b', 'hidden', 'a', 'c'].flatMap((id) =>
    panels.filter((p) => p.id === id),
  );
  render({ panels: nextPanels, onPanelOrderChange });
  expect(handle('a')).toBe(original);
  expect(document.activeElement).toBe(original);
  key('a', 'End');
  expect(onPanelOrderChange).toHaveBeenLastCalledWith(['main', 'b', 'hidden', 'c', 'a']);
  key('a', 'Home');
  expect(onPanelOrderChange).toHaveBeenLastCalledWith(['main', 'a', 'hidden', 'b', 'c']);
});
it('previews a pointer drag without committing, then restores inline styles and commits once', async () => {
  const onPanelOrderChange = jest.fn();
  render({ panels, onPanelOrderChange });
  const original = handle('a');
  const panel = original.parentElement;
  pointer(original, 'pointerdown', 308);
  pointer(window, 'pointermove', 530);
  expect(onPanelOrderChange).not.toHaveBeenCalled();
  expect(panel?.style.transform).toContain('translateX(222px)');
  await pointer(window, 'pointerup', 530);
  expect(onPanelOrderChange).toHaveBeenCalledTimes(1);
  expect(onPanelOrderChange).toHaveBeenCalledWith(['main', 'b', 'hidden', 'a', 'c']);
  expect(panel?.style.transform).toBe('');
  expect(panel?.style.zIndex).toBe('');
});
it('captures the gesture callback so a new account cannot receive an old drag', async () => {
  const oldOwner = jest.fn();
  const newOwner = jest.fn();
  render({ panels, onPanelOrderChange: oldOwner });
  pointer(handle('a'), 'pointerdown', 308);
  pointer(window, 'pointermove', 530);
  render({ panels, onPanelOrderChange: newOwner });
  await pointer(window, 'pointerup', 530);
  expect(oldOwner).toHaveBeenCalledTimes(1);
  expect(newOwner).not.toHaveBeenCalled();
});
it.each(['Escape', 'pointercancel', 'lostpointercapture'])(
  'cancels %s without changing order',
  async (reason) => {
    const onPanelOrderChange = jest.fn();
    render({ panels, onPanelOrderChange });
    pointer(handle('a'), 'pointerdown', 308);
    pointer(window, 'pointermove', 530);
    if (reason === 'Escape') key('a', reason);
    else pointer(reason === 'lostpointercapture' ? handle('a') : window, reason, 530);
    await pointer(window, 'pointerup', 530);
    expect(onPanelOrderChange).not.toHaveBeenCalled();
    expect(host.querySelector('[data-bloom-panel-reordering]')).toBeNull();
  },
);
it('ignores controls outside its layout and cancels when eligible panels change', async () => {
  const onPanelOrderChange = jest.fn();
  render({ panels, onPanelOrderChange });
  const foreign = document.createElement('button');
  foreign.dataset.bloomPanelReorder = 'a';
  document.body.appendChild(foreign);
  act(() =>
    foreign.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })),
  );
  foreign.remove();
  expect(onPanelOrderChange).not.toHaveBeenCalled();
  pointer(handle('a'), 'pointerdown', 308);
  pointer(window, 'pointermove', 530);
  render({
    panels: panels.map((p) => (p.id === 'b' ? { ...p, visible: false } : p)),
    onPanelOrderChange,
  });
  await pointer(window, 'pointerup', 530);
  expect(onPanelOrderChange).not.toHaveBeenCalled();
});
it('scrolls the document near an edge during a drag and stops its frame on cancel', () => {
  render({ panels, onPanelOrderChange: jest.fn() });
  pointer(handle('a'), 'pointerdown', 308);
  pointer(window, 'pointermove', window.innerWidth - 4);
  const frame = [...frames.values()][0];
  frames.clear();
  act(() => frame?.(0));
  expect(window.scrollBy).toHaveBeenCalledWith({ left: 22, behavior: 'instant' });
  key('a', 'Escape');
  expect(frames.size).toBe(0);
});
it('waits for the renderer landing animation and cancels it without a stale commit', async () => {
  const onPanelOrderChange = jest.fn();
  render({ panels, onPanelOrderChange });
  let animation: {
    onfinish: (() => void) | null;
    oncancel: (() => void) | null;
    cancel: () => void;
  } | null = null;
  const animate = HTMLElement.prototype.animate;
  HTMLElement.prototype.animate = jest.fn(() => {
    const current = {
      onfinish: null as (() => void) | null,
      oncancel: null as (() => void) | null,
      cancel: () => current.oncancel?.(),
    };
    animation = current;
    return current as unknown as Animation;
  });
  try {
    pointer(handle('a'), 'pointerdown', 308);
    pointer(window, 'pointermove', 530);
    let completed: Promise<void> | undefined;
    act(() => {
      completed = controller.finish(true, 530, 20);
    });
    expect(animation).not.toBeNull();
    expect(onPanelOrderChange).not.toHaveBeenCalled();
    act(() => controller.cancel());
    await act(async () => {
      await completed;
    });
    expect(onPanelOrderChange).not.toHaveBeenCalled();
    expect(host.querySelector('[data-bloom-panel-reordering]')).toBeNull();
  } finally {
    if (animate) HTMLElement.prototype.animate = animate;
    else delete (HTMLElement.prototype as Partial<HTMLElement>).animate;
  }
});
it('cleans the semantic move transaction when a controlled host repeatedly rejects a move', () => {
  render({ panels, onPanelOrderChange: jest.fn() });
  key('a', 'ArrowRight');
  expect(host.querySelector('[data-bloom-panel-ordering]')).toBeNull();
  key('a', 'ArrowRight');
  expect(host.querySelector('[data-bloom-panel-ordering]')).toBeNull();
});
