/** @jest-environment jsdom */
/**
 * `DropZone` on the web: HTML5's drag and drop on its element — a drag it would
 * take accepted with the action as `dropEffect`, the kinds offered (never the
 * content) before the drop, the content of the kinds it accepts at the drop,
 * and a drag of nothing it takes left alone.
 */
import type React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

import { DropZone } from '../drop-zone/DropZone.web';
import { useWindowDrag } from '../drop-zone/use-window-drag.web';
import type { DropTargetDragEvent, DropTargetDropEvent } from '../platform-surface/types';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

interface FakeTransfer {
  types: string[];
  items: { kind: string; type: string }[];
  effectAllowed: string;
  dropEffect: string;
  files: File[];
  getData: jest.Mock;
}

function transfer(
  data: Record<string, string>,
  files: File[] = [],
  effectAllowed = 'all',
): FakeTransfer {
  return {
    types: [...Object.keys(data), ...(files.length > 0 ? ['Files'] : [])],
    items: [
      ...Object.keys(data).map((type) => ({ kind: 'string', type })),
      ...files.map((file) => ({ kind: 'file', type: file.type })),
    ],
    effectAllowed,
    dropEffect: 'none',
    files,
    getData: jest.fn((type: string) => data[type] ?? ''),
  };
}

function fire(
  node: Element,
  type: string,
  dataTransfer: FakeTransfer,
  init: { altKey?: boolean; metaKey?: boolean; relatedTarget?: EventTarget | null } = {},
) {
  const event = new Event(type, { bubbles: true, cancelable: true }) as Event &
    Record<string, unknown>;
  Object.assign(event, {
    dataTransfer,
    clientX: 30,
    clientY: 20,
    altKey: false,
    metaKey: false,
    ...init,
  });
  node.dispatchEvent(event);
  return event;
}

function zone(props: Partial<React.ComponentProps<typeof DropZone>> = {}) {
  const calls = {
    enter: [] as DropTargetDragEvent[],
    over: [] as DropTargetDragEvent[],
    leave: 0,
    drop: [] as DropTargetDropEvent[],
  };
  act(() => {
    root.render(
      <DropZone
        testID="zone"
        accept={['files', 'url']}
        actions={['move', 'copy']}
        onDragEnter={(event) => calls.enter.push(event)}
        onDragOver={(event) => calls.over.push(event)}
        onDragLeave={() => {
          calls.leave += 1;
        }}
        onDrop={(event) => calls.drop.push(event)}
        {...props}
      />,
    );
  });
  const node = container.querySelector('[data-testid="zone"]');
  if (!node) throw new Error('the zone is not rendered');
  return { node, calls };
}

describe('DropZone (web)', () => {
  it('accepts a drag of files with its preferred action and reads them only at the drop', () => {
    const { node, calls } = zone();
    const file = new File(['hola'], 'nota.txt', { type: 'text/plain' });
    const data = transfer({ 'text/uri-list': 'https://oxy.so/os\r\n' }, [file]);
    const entered = fire(node, 'dragenter', data);
    expect(entered.defaultPrevented).toBe(true);
    expect(data.dropEffect).toBe('move');
    expect(calls.enter).toEqual([
      {
        x: expect.any(Number),
        y: expect.any(Number),
        action: 'move',
        kinds: ['files', 'url'],
        fileTypes: ['text/plain'],
      },
    ]);
    fire(node, 'dragover', data);
    expect(calls.over).toHaveLength(1);
    expect(data.getData).not.toHaveBeenCalled();
    const dropped = fire(node, 'drop', data);
    expect(dropped.defaultPrevented).toBe(true);
    expect(calls.drop).toHaveLength(1);
    const [drop] = calls.drop;
    if (!drop) throw new Error('no drop');
    expect(drop.action).toBe('move');
    expect(drop.data.files).toEqual([
      { name: 'nota.txt', mimeType: 'text/plain', size: 4, raw: file },
    ]);
    expect(drop.data.urls).toEqual(['https://oxy.so/os']);
    expect(calls.leave).toBe(1);
  });

  it('takes Option as a copy, and drops nothing an action the source refuses', () => {
    const { node, calls } = zone();
    const data = transfer({ 'text/uri-list': 'https://oxy.so\n' }, [], 'copyMove');
    fire(node, 'dragenter', data, { altKey: true });
    expect(data.dropEffect).toBe('copy');
    const linkOnly = transfer({ 'text/uri-list': 'https://oxy.so\n' }, [], 'link');
    const entered = fire(node, 'dragover', linkOnly);
    expect(entered.defaultPrevented).toBe(false);
    expect(linkOnly.dropEffect).toBe('none');
    fire(node, 'drop', linkOnly);
    expect(calls.drop).toHaveLength(0);
  });

  it('leaves alone a drag of nothing it takes, and anything while disabled', () => {
    const { node, calls } = zone();
    const text = transfer({ 'text/plain': 'hola' });
    expect(fire(node, 'dragenter', text).defaultPrevented).toBe(false);
    expect(calls.enter).toHaveLength(0);
    const disabled = zone({ disabled: true });
    const files = transfer({}, [new File(['x'], 'x.txt')]);
    expect(fire(disabled.node, 'dragenter', files).defaultPrevented).toBe(false);
  });

  it('says the types of the files dragged, each once, before the drop', () => {
    const { node, calls } = zone();
    const data = transfer({}, [
      new File(['a'], 'a.png', { type: 'image/png' }),
      new File(['b'], 'b.png', { type: 'image/png' }),
      new File(['c'], 'c.pdf', { type: 'application/pdf' }),
    ]);
    fire(node, 'dragenter', data);
    expect(calls.enter[0]?.fileTypes).toEqual(['image/png', 'application/pdf']);
    fire(node, 'dragleave', data);
    const text = zone({ accept: ['text'] });
    fire(text.node, 'dragenter', transfer({ 'text/plain': 'hola' }));
    expect(text.calls.enter[0]?.fileTypes).toEqual([]);
  });

  it('takes files only when every one is of a type it names', () => {
    const { node, calls } = zone({ accept: ['files'], acceptFileTypes: ['image/*'] });
    const images = transfer({}, [
      new File(['a'], 'a.png', { type: 'image/png' }),
      new File(['b'], 'b.jpg', { type: 'image/jpeg' }),
    ]);
    const entered = fire(node, 'dragenter', images);
    expect(entered.defaultPrevented).toBe(true);
    expect(images.dropEffect).toBe('move');
    expect(calls.enter).toHaveLength(1);
    fire(node, 'dragleave', images);
    // A file of another type among them: left alone, nothing dropped.
    const mixed = transfer({}, [
      new File(['a'], 'a.png', { type: 'image/png' }),
      new File(['c'], 'c.pdf', { type: 'application/pdf' }),
    ]);
    const refused = fire(node, 'dragover', mixed);
    expect(refused.defaultPrevented).toBe(false);
    expect(mixed.dropEffect).toBe('none');
    fire(node, 'drop', mixed);
    expect(calls.drop).toHaveLength(0);
    // Files of no type the browser knows are not taken either.
    const unknown = transfer({}, [new File(['x'], 'x')]);
    expect(fire(node, 'dragenter', unknown).defaultPrevented).toBe(false);
  });

  it('is left only when the pointer leaves it, not when it crosses a child', () => {
    const { node, calls } = zone({ children: <span id="child">child</span> } as never);
    const data = transfer({}, [new File(['x'], 'x.txt')]);
    fire(node, 'dragenter', data);
    const child = container.querySelector('#child');
    if (!child) throw new Error('no child');
    fire(child, 'dragenter', data);
    fire(node, 'dragleave', data);
    expect(calls.leave).toBe(0);
    fire(child, 'dragleave', data);
    expect(calls.leave).toBe(1);
  });

  it('is left at a drop a child keeps from it, and counts the next drag from nothing', () => {
    const { node, calls } = zone({ children: <span id="row" /> } as never);
    const row = container.querySelector('#row');
    if (!row) throw new Error('no row');
    // A child's own drop (a sidebar row's drag of itself) never reaches the zone.
    row.addEventListener('drop', (event) => event.stopPropagation());
    const files = transfer({}, [new File(['x'], 'x.txt')]);
    fire(node, 'dragenter', files);
    fire(row, 'dragenter', files);
    fire(row, 'drop', files);
    expect(calls.leave).toBe(1);
    expect(calls.drop).toHaveLength(0);
    // The next drag enters and leaves through the zone itself.
    fire(node, 'dragenter', files);
    expect(calls.enter).toHaveLength(2);
    fire(node, 'dragleave', files);
    expect(calls.leave).toBe(2);
  });
});

/** What `useWindowDrag` tells the window, written down. */
function Watcher({ told }: { told: string[] }) {
  useWindowDrag({
    onEnter: () => told.push('window enter'),
    onExit: (dropped) => told.push(`window exit ${dropped}`),
  });
  return null;
}

describe('useWindowDrag (web)', () => {
  function page(told: string[], onDrop = () => told.push('zone drop')) {
    act(() => {
      root.render(
        <>
          <Watcher told={told} />
          <DropZone testID="zone" accept={['files']} actions={['move', 'copy']} onDrop={onDrop}>
            <span id="inside" />
          </DropZone>
          <span id="elsewhere" />
        </>,
      );
    });
    const get = (selector: string) => {
      const node = container.querySelector(selector);
      if (!node) throw new Error(`no ${selector}`);
      return node;
    };
    return {
      zone: get('[data-testid="zone"]'),
      inside: get('#inside'),
      elsewhere: get('#elsewhere'),
    };
  }

  const files = () => transfer({}, [new File(['x'], 'x.txt')]);

  it('says a drag entering the page once, and leaving it when it leaves for nothing of the page', () => {
    const told: string[] = [];
    const { zone: node, inside, elsewhere } = page(told);
    const data = files();
    fire(elsewhere, 'dragenter', data);
    // Moving within the page: the next element is entered before the last is left.
    fire(inside, 'dragenter', data);
    fire(elsewhere, 'dragleave', data, { relatedTarget: inside });
    fire(node, 'dragover', data);
    expect(told).toEqual(['window enter']);
    // Leaving the page: the element last entered is left for nothing.
    fire(inside, 'dragleave', data, { relatedTarget: null });
    expect(told).toEqual(['window enter', 'window exit false']);
  });

  it('is not fooled when the element under the drag is replaced (a folder sprung open)', () => {
    const told: string[] = [];
    const { inside, elsewhere } = page(told);
    const data = files();
    fire(inside, 'dragenter', data);
    // The element entered is replaced: its leaving never reaches the document,
    // and the drag enters what took its place.
    const replacement = document.createElement('span');
    container.appendChild(replacement);
    fire(replacement, 'dragenter', data);
    fire(elsewhere, 'dragenter', data);
    fire(replacement, 'dragleave', data, { relatedTarget: elsewhere });
    expect(told).toEqual(['window enter']);
    fire(elsewhere, 'dragleave', data, { relatedTarget: null });
    expect(told).toEqual(['window enter', 'window exit false']);
    replacement.remove();
  });

  it('says a drop on the page after the zone’s onDrop', () => {
    const told: string[] = [];
    const { inside } = page(told);
    const data = files();
    fire(inside, 'dragenter', data);
    fire(inside, 'dragover', data);
    fire(inside, 'drop', data);
    expect(told).toEqual(['window enter', 'zone drop', 'window exit true']);
    // Its drag's own end afterwards says nothing more.
    fire(inside, 'dragend', data);
    expect(told).toHaveLength(3);
  });

  it('ends a drag of the page’s own at its dragend, dropped by its effect', () => {
    const told: string[] = [];
    const { elsewhere } = page(told);
    const kept = files();
    fire(elsewhere, 'dragenter', kept);
    kept.dropEffect = 'move';
    fire(elsewhere, 'dragend', kept);
    const cancelled = files();
    fire(elsewhere, 'dragenter', cancelled);
    fire(elsewhere, 'dragend', cancelled);
    expect(told).toEqual(['window enter', 'window exit true', 'window enter', 'window exit false']);
  });

  it('stops listening when unmounted', () => {
    const told: string[] = [];
    const { elsewhere } = page(told);
    act(() => root.render(null));
    fire(elsewhere, 'dragenter', files());
    expect(told).toEqual([]);
  });
});
