/** @jest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('react-native', () => jest.requireActual('react-native-web'));
import { BloomThemeProvider } from '../../theme/BloomThemeProvider';
import { ProjectBoard } from '../ProjectBoard.web';
import { BoardDragHandle } from '../BoardGesture';
import type { BoardColumn, ControlledProjectBoardProps } from '../types';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
type Item = { id: string; name: string; custom: number };
const originalColumns: BoardColumn<Item>[] = [
  { id: 'todo', title: 'To do', items: [{ id: 'a', name: 'Alpha', custom: 42 }] },
  { id: 'done', title: 'Done', items: [] },
];
let host: HTMLDivElement;
let root: Root;
beforeEach(() => {
  jest.useFakeTimers();
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
  jest.useRealTimers();
});
function board(props: Partial<ControlledProjectBoardProps<Item>> = {}, onOpen = jest.fn()) {
  return (
    <ProjectBoard
      variant="embedded"
      columns={originalColumns}
      getItemId={(item) => item.id}
      dragMode="handle"
      allowReorder={false}
      renderCard={(item) => (
        <div>
          <BoardDragHandle
            accessibilityLabel={`Drag ${item.name}`}
            onPress={onOpen}
            style={{ flex: 1 }}
          >
            {item.name} {item.custom}
          </BoardDragHandle>
          <input aria-label="Edit name" />
          <button type="button" onClick={onOpen}>
            Open
          </button>
        </div>
      )}
      renderColumnFooter={(column) => <span>Footer {column.title}</span>}
      renderEmptyColumn={() => <span>Empty column</span>}
      {...props}
    />
  );
}
function mount(props: Partial<ControlledProjectBoardProps<Item>> = {}, onOpen = jest.fn()) {
  act(() => root.render(<BloomThemeProvider>{board(props, onOpen)}</BloomThemeProvider>));
}
function handle(scope: ParentNode = host) {
  return scope.querySelector<HTMLElement>('[aria-label="Drag Alpha"]')!;
}
function key(target: HTMLElement, key: string) {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
  act(() => target.dispatchEvent(event));
  return event;
}

it('moves opaque items using the shared keyboard controller and returns focus to the destination handle', () => {
  const onMove = jest.fn();
  mount({ onMove });
  const source = handle();
  source.focus();
  expect(key(source, ' ').defaultPrevented).toBe(true);
  key(source, 'ArrowRight');
  expect(onMove).not.toHaveBeenCalled();
  expect(
    host.querySelector('[data-bloom-board-column="done"] [aria-label="Drag Alpha"]'),
  ).not.toBeNull();
  key(document.body, ' ');
  expect(onMove).toHaveBeenCalledWith(
    expect.objectContaining({ itemId: 'a', fromColumnId: 'todo', toColumnId: 'done' }),
  );
  mount({
    onMove,
    columns: [
      { ...originalColumns[0]!, items: [] },
      { ...originalColumns[1]!, items: originalColumns[0]!.items },
    ],
  });
  act(() => jest.advanceTimersByTime(20));
  expect(document.activeElement).toBe(handle());
});

it('cancels keyboard moves and suppresses accidental activation immediately after a move', () => {
  const onMove = jest.fn();
  const onOpen = jest.fn();
  mount({ onMove }, onOpen);
  act(() => handle().click());
  expect(onOpen).toHaveBeenCalledTimes(1);
  key(handle(), ' ');
  key(document.body, 'ArrowRight');
  key(document.body, 'Escape');
  expect(onMove).not.toHaveBeenCalled();
  expect(
    host.querySelector('[data-bloom-board-column="todo"] [aria-label="Drag Alpha"]'),
  ).not.toBeNull();
  act(() => handle().click());
  expect(onOpen).toHaveBeenCalledTimes(1);
  act(() => jest.advanceTimersByTime(351));
  act(() => handle().click());
  expect(onOpen).toHaveBeenCalledTimes(2);
});

it('leaves inputs and explicit card actions operable and ignores another board', () => {
  const first = jest.fn();
  const second = jest.fn();
  const onOpen = jest.fn();
  act(() =>
    root.render(
      <BloomThemeProvider>
        <section>{board({ onMove: first }, onOpen)}</section>
        <section>{board({ onMove: second })}</section>
      </BloomThemeProvider>,
    ),
  );
  const sections = host.querySelectorAll('section');
  const input = sections[0]!.querySelector('input')!;
  expect(key(input, ' ').defaultPrevented).toBe(false);
  key(handle(sections[0]), ' ');
  key(document.body, 'ArrowRight');
  key(document.body, ' ');
  expect(first).toHaveBeenCalledTimes(1);
  expect(second).not.toHaveBeenCalled();
  act(() => sections[0]!.querySelector<HTMLButtonElement>('button:not([aria-label])')!.click());
  expect(onOpen).toHaveBeenCalledTimes(1);
});

it('read-only and callback-free boards render inert handles without intercepting keys', () => {
  mount({ readOnly: true, onMove: jest.fn() });
  expect(handle()).toBeNull();
  mount();
  expect(handle()).toBeNull();
  expect(host.textContent).toContain('Alpha 42');
  expect(host.textContent).toContain('Footer To do');
  expect(host.textContent).toContain('Empty column');
});

it('retains the original whole-card gesture target while previewing another column', () => {
  mount({
    onMove: jest.fn(),
    dragMode: 'card',
    renderCard: (item) => <span>{item.name}</span>,
  });
  const source = host.querySelector<HTMLElement>(
    '[data-bloom-board-column="todo"] [data-bloom-board-item="a"] [role="button"]',
  )!;
  key(source, ' ');
  key(document.body, 'ArrowRight');
  expect(source.isConnected).toBe(true);
  expect(
    host.querySelector(
      '[data-bloom-board-column="todo"] [data-bloom-board-item="a"] [role="button"]',
    ),
  ).toBe(source);
  key(document.body, 'Escape');
  expect(source.isConnected).toBe(true);
});
