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
  init: { altKey?: boolean; metaKey?: boolean } = {},
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
      { x: expect.any(Number), y: expect.any(Number), action: 'move', kinds: ['files', 'url'] },
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
});
