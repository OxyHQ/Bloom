import { act, render } from '@testing-library/react-native';
import { BloomThemeProvider } from '../../theme/BloomThemeProvider';
import { boardOccurrence, projectBoardMove } from '../board-engine';
import { useBoardEngine, type BoardEngine } from '../use-board-engine';
import type { BoardColumn, BoardMove } from '../types';

type Item = { key: string; title: string };
const a = { key: 'a', title: 'Alpha' };
const b = { key: 'b', title: 'Beta' };
const c = { key: 'c', title: 'Charlie' };
const id = (item: Item) => item.key;
const initial: BoardColumn<Item>[] = [
  { id: 'todo', title: 'To do', items: [a, b] },
  { id: 'done', title: 'Done', items: [c] },
];
let engine: BoardEngine<Item>;
function Harness(props: Parameters<typeof useBoardEngine<Item>>[0]) {
  engine = useBoardEngine(props);
  return null;
}
function setup(overrides: Partial<Parameters<typeof useBoardEngine<Item>>[0]> = {}) {
  const onMove = jest.fn<void, [BoardMove]>();
  const props = { columns: initial, getItemId: id, onMove, ...overrides };
  const tree = (next = props) => (
    <BloomThemeProvider>
      <Harness {...next} />
    </BloomThemeProvider>
  );
  const screen = render(tree());
  engine.columnRects.current = {
    todo: { x: 0, y: 0, width: 100, height: 400 },
    done: { x: 110, y: 0, width: 100, height: 400 },
  };
  engine.itemRects.current = {
    [boardOccurrence('todo', 'a')]: { x: 0, y: 20, width: 100, height: 40 },
    [boardOccurrence('todo', 'b')]: { x: 0, y: 70, width: 100, height: 40 },
    [boardOccurrence('done', 'c')]: { x: 110, y: 20, width: 100, height: 40 },
  };
  return {
    onMove,
    rerender: (patch: Partial<typeof props>) => screen.rerender(tree({ ...props, ...patch })),
  };
}
const start = () => act(() => engine.beginDrag({ itemId: 'a', fromColumnId: 'todo' }, 30, 30));
const overDone = () => act(() => engine.dragOver(130, 10));
beforeEach(() => {
  jest.useFakeTimers();
  global.requestAnimationFrame = (callback) =>
    setTimeout(() => callback(Date.now()), 16) as unknown as number;
  global.cancelAnimationFrame = (frame) => clearTimeout(frame);
});
afterEach(() => {
  act(() => jest.runOnlyPendingTimers());
  jest.useRealTimers();
});

it('previews without mutating controlled data and commits once with a stable insertion anchor', () => {
  const { onMove } = setup();
  start();
  overDone();
  expect(engine.renderedColumns[0]?.items).toEqual([b]);
  expect(engine.renderedColumns[1]?.items).toEqual([a, c]);
  expect(initial[0]?.items).toEqual([a, b]);
  expect(onMove).not.toHaveBeenCalled();
  act(() => engine.endDrag(true));
  expect(onMove).toHaveBeenCalledWith({
    itemId: 'a',
    fromColumnId: 'todo',
    toColumnId: 'done',
    toIndex: 0,
    beforeItemId: 'c',
  });
  expect(engine.renderedColumns).toBe(initial);
  act(() => engine.endDrag(true));
  expect(onMove).toHaveBeenCalledTimes(1);
});

it('cancellation keeps incoming collaborative updates instead of restoring a drag-start snapshot', () => {
  const { onMove, rerender } = setup();
  start();
  overDone();
  const edited = { ...a, title: 'Edited remotely' };
  const next = [
    { ...initial[0]!, items: [edited, b] },
    { ...initial[1]!, items: [c, { key: 'new', title: 'Remote insertion' }] },
  ];
  rerender({ columns: next });
  expect(engine.renderedColumns[1]?.items[0]).toBe(edited);
  act(() => engine.endDrag(false));
  expect(engine.renderedColumns).toBe(next);
  expect(onMove).not.toHaveBeenCalled();
});

it.each(['permission', 'source', 'destination'])(
  'cancels when %s changes during a gesture',
  (change) => {
    const { onMove, rerender } = setup();
    start();
    overDone();
    rerender(
      change === 'permission'
        ? { readOnly: true }
        : {
            columns:
              change === 'source' ? [{ ...initial[0]!, items: [b] }, initial[1]!] : [initial[0]!],
          },
    );
    act(() => engine.endDrag(true));
    expect(onMove).not.toHaveBeenCalled();
    expect(engine.origin.current).toBeNull();
  },
);

it('does not preview or commit same-column reordering for externally sorted boards', () => {
  const { onMove } = setup({ allowReorder: false });
  start();
  act(() => engine.dragOver(50, 150));
  expect(engine.renderedColumns).toBe(initial);
  act(() => engine.endDrag(true));
  expect(onMove).not.toHaveBeenCalled();
  act(() => engine.accessibleMove({ itemId: 'a', fromColumnId: 'todo' }, 'down'));
  expect(onMove).not.toHaveBeenCalled();
  act(() => engine.accessibleMove({ itemId: 'a', fromColumnId: 'todo' }, 'next'));
  expect(onMove).toHaveBeenCalledTimes(1);
});

it('maps filtered insertion positions to full-column anchors without dropping hidden items', () => {
  const hidden = { key: 'hidden', title: 'Hidden by a filter' };
  const columns = [initial[0]!, { ...initial[1]!, items: [hidden, c] }];
  const { onMove } = setup({ columns, visibleColumns: initial });
  start();
  overDone();
  act(() => engine.endDrag(true));
  const move = onMove.mock.calls[0]![0];
  expect(move.toIndex).toBe(1);
  expect(projectBoardMove(columns, id, move)[1]?.items).toEqual([hidden, a, c]);
});

it('moves only the selected occurrence and keeps identical ids in unrelated columns', () => {
  const columns = [...initial, { id: 'other', title: 'Other group', items: [a] }];
  setup({ columns });
  start();
  overDone();
  expect(engine.renderedColumns[2]?.items).toEqual([a]);
  expect(boardOccurrence('todo', 'a')).not.toBe(boardOccurrence('other', 'a'));
  act(() => engine.endDrag(false));
});

it('does not start or accept native moves in a read-only board', () => {
  const { onMove } = setup({ readOnly: true });
  start();
  overDone();
  act(() => engine.endDrag(true));
  act(() => engine.accessibleMove({ itemId: 'a', fromColumnId: 'todo' }, 'next'));
  expect(engine.active).toBeNull();
  expect(onMove).not.toHaveBeenCalled();
});

it('keeps the template insertion marker without reordering a pointer source column before drop', () => {
  const { onMove } = setup();
  start();
  act(() => engine.dragOver(50, 150));
  expect(engine.renderedColumns).toBe(initial);
  expect(engine.over).toMatchObject({ columnId: 'todo', index: 1 });
  act(() => engine.endDrag(true));
  expect(onMove).toHaveBeenCalledWith(
    expect.objectContaining({ itemId: 'a', fromColumnId: 'todo', toColumnId: 'todo', toIndex: 1 }),
  );
});
