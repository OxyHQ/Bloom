/** @jest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

import { BloomThemeProvider } from '../../theme/BloomThemeProvider';
import { Board } from '../Board.web';
import type { BoardColumn, BoardProps } from '../types';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
type Item = { id: string; name: string; custom: number };
const originalColumns: BoardColumn<Item>[] = [
  { id: 'todo', title: 'To do', items: [{ id: 'a', name: 'Alpha', custom: 42 }] },
  { id: 'done', title: 'Done', items: [] },
];
let host: HTMLDivElement;
let root: Root;

beforeEach(() => {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
});

function board(props: Partial<BoardProps<Item>> = {}) {
  return (
    <Board
      columns={originalColumns}
      getItemId={(item) => item.id}
      renderCard={(item, _column, state) => (
        <div role="button" tabIndex={0} data-dragging={state.isDragging}>
          {item.name} {item.custom}
          <input aria-label="Edit name" />
          <button type="button">Move</button>
        </div>
      )}
      renderColumnFooter={(column) => <span>Footer {column.title}</span>}
      renderEmptyColumn={() => <span>Empty column</span>}
      {...props}
    />
  );
}
function mount(props: Partial<BoardProps<Item>> = {}) {
  act(() => root.render(<BloomThemeProvider>{board(props)}</BloomThemeProvider>));
}
function item(scope: ParentNode = host) {
  return scope.querySelector<HTMLElement>('[data-bloom-board-item="a"]')!;
}
function column(id: string, scope: ParentNode = host) {
  return scope.querySelector<HTMLElement>(`[data-bloom-board-column="${id}"]`)!;
}
function transfer() {
  const data = new Map<string, string>();
  return {
    get types() {
      return [...data.keys()];
    },
    setData: (type: string, value: string) => data.set(type, value),
    getData: (type: string) => data.get(type) ?? '',
    effectAllowed: 'none',
    dropEffect: 'none',
  };
}
function drag(target: HTMLElement, type: string, dataTransfer: ReturnType<typeof transfer>) {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperty(event, 'dataTransfer', { value: dataTransfer });
  act(() => target.dispatchEvent(event));
  return event;
}
function pointerDown(target: Element) {
  act(() => target.dispatchEvent(new Event('pointerdown', { bubbles: true })));
}

it('requests a move without modifying opaque data, then reflects caller updates', () => {
  const onMove = jest.fn();
  mount({ onMove });
  const data = transfer();
  drag(item(), 'dragstart', data);
  expect(item().querySelector('[data-dragging="true"]')).not.toBeNull();
  expect(drag(column('done'), 'dragover', data).defaultPrevented).toBe(true);
  drag(column('done'), 'drop', data);
  expect(onMove).toHaveBeenCalledWith({
    itemId: 'a',
    fromColumnId: 'todo',
    toColumnId: 'done',
  });
  expect(column('todo').textContent).toContain('Alpha 42');
  expect(originalColumns[0]?.items).toHaveLength(1);
  expect(item().querySelector('[data-dragging="true"]')).toBeNull();
  mount({
    onMove,
    columns: [
      { ...originalColumns[0]!, items: [] },
      { ...originalColumns[1]!, items: [{ id: 'a', name: 'Updated', custom: 99 }] },
    ],
  });
  expect(column('done').textContent).toContain('Updated 99');
  expect(column('todo').textContent).toContain('Empty column');
  expect(column('done').textContent).toContain('Footer Done');
});

it('ignores same-column, external, sibling-board and cancelled drops', () => {
  const onMove = jest.fn();
  act(() =>
    root.render(
      <BloomThemeProvider>
        <section data-first>{board({ onMove })}</section>
        <section data-second>{board({ onMove })}</section>
      </BloomThemeProvider>,
    ),
  );
  const first = host.querySelector('[data-first]')!;
  const second = host.querySelector('[data-second]')!;
  const data = transfer();
  data.setData('application/x-bloom-board-item', 'external');
  expect(drag(column('done', first), 'dragover', data).defaultPrevented).toBe(false);
  drag(column('done', first), 'drop', data);
  drag(item(first), 'dragstart', data);
  drag(column('todo', first), 'drop', data);
  expect(drag(column('done', second), 'dragover', data).defaultPrevented).toBe(false);
  drag(column('done', second), 'drop', data);
  drag(item(first), 'dragend', data);
  drag(column('done', first), 'drop', data);
  expect(onMove).not.toHaveBeenCalled();
});

it('disables dragging without a callback and rechecks permissions and source existence at drop', () => {
  mount();
  expect(item().draggable).toBe(false);
  const onMove = jest.fn();
  mount({ onMove });
  const data = transfer();
  drag(item(), 'dragstart', data);
  mount({ onMove, readOnly: true });
  expect(item().draggable).toBe(false);
  drag(column('done'), 'drop', data);
  expect(onMove).not.toHaveBeenCalled();
  mount({ onMove });
  drag(item(), 'dragstart', data);
  mount({ onMove, columns: originalColumns.map((entry) => ({ ...entry, items: [] })) });
  drag(column('done'), 'drop', data);
  expect(onMove).not.toHaveBeenCalled();
});

it('preserves embedded controls while letting the whole-card action start a drag', () => {
  const onMove = jest.fn();
  mount({ onMove });
  const data = transfer();
  pointerDown(item().querySelector('input')!);
  expect(drag(item(), 'dragstart', data).defaultPrevented).toBe(true);
  pointerDown(item().querySelector('button')!);
  expect(drag(item(), 'dragstart', data).defaultPrevented).toBe(true);
  pointerDown(item().firstElementChild!);
  expect(drag(item(), 'dragstart', data).defaultPrevented).toBe(false);
  drag(column('done'), 'drop', data);
  expect(onMove).toHaveBeenCalledTimes(1);
});

it('rejects a payload from another drag even while this board has an active card', () => {
  const onMove = jest.fn();
  mount({ onMove });
  const data = transfer();
  drag(item(), 'dragstart', data);
  data.setData('application/x-bloom-board-item', 'another-board');
  drag(column('done'), 'drop', data);
  expect(onMove).not.toHaveBeenCalled();
});
