import { dragShift, dragTarget, moveItem } from '../hooks/list-reorder';

/**
 * Three families had grown their own drag-reorder maths and disagreed about
 * the degenerate inputs. These pin the reconciled answers.
 */
describe('moveItem', () => {
  it('moves down, up and to both ends, always returning a new array', () => {
    const list = ['a', 'b', 'c', 'd'];
    expect(moveItem(list, 0, 2)).toEqual(['b', 'c', 'a', 'd']);
    expect(moveItem(list, 3, 0)).toEqual(['d', 'a', 'b', 'c']);
    expect(moveItem(list, 1, 0)).toEqual(['b', 'a', 'c', 'd']);
    expect(moveItem(list, 1, 3)).toEqual(['a', 'c', 'd', 'b']);
    expect(moveItem(list, 1, 1)).toEqual(list);
    expect(moveItem(list, 1, 1)).not.toBe(list);
    expect(list).toEqual(['a', 'b', 'c', 'd']);
  });

  it('clamps and rounds the TARGET into range', () => {
    expect(moveItem(['a', 'b', 'c'], 0, 99)).toEqual(['b', 'c', 'a']);
    expect(moveItem(['a', 'b', 'c'], 2, -5)).toEqual(['c', 'a', 'b']);
    expect(moveItem(['a', 'b', 'c'], 0, 1.6)).toEqual(['b', 'c', 'a']);
  });

  /**
   * RECONCILED. `sortable-media` clamped an out-of-range `from` into range,
   * `queue-panel` refused the move. Clamping moves the WRONG item, so the
   * refusal is what survived.
   */
  it('refuses an out-of-range SOURCE rather than clamping it', () => {
    expect(moveItem(['a', 'b'], 5, 0)).toEqual(['a', 'b']);
    expect(moveItem(['a', 'b'], -1, 0)).toEqual(['a', 'b']);
    expect(moveItem(['a', 'b'], 5, 0)).not.toBe(undefined);
    expect(moveItem([], 0, 1)).toEqual([]);
  });
});

describe('dragTarget', () => {
  it('lands on the nearest whole row: past half a row moves one slot', () => {
    expect(dragTarget(1, 0, 56, 5)).toBe(1);
    expect(dragTarget(1, 27, 56, 5)).toBe(1);
    expect(dragTarget(1, 29, 56, 5)).toBe(2);
    expect(dragTarget(1, -29, 56, 5)).toBe(0);
    expect(dragTarget(0, 112, 56, 5)).toBe(2);
  });

  it('clamps to the first and last slot', () => {
    expect(dragTarget(1, -5000, 56, 5)).toBe(0);
    expect(dragTarget(1, 5000, 56, 5)).toBe(4);
  });

  /**
   * RECONCILED. `track-list` answered `from`, `queue-panel` answered `0`.
   * `rowHeight <= 0` means "not measured yet" and `count <= 0` means "no rows":
   * neither is a reason to move the row to the top, so `from` is the answer.
   */
  it('answers `from` — not 0 — for an unmeasured row or an empty list', () => {
    expect(dragTarget(2, 100, 0, 5)).toBe(2);
    expect(dragTarget(3, 100, -1, 5)).toBe(3);
    expect(dragTarget(2, 100, 56, 0)).toBe(2);
    expect(dragTarget(0, 100, 56, 0)).toBe(0);
  });
});

describe('dragShift', () => {
  const H = 56;

  it('slides the rows between source and target one row towards the source', () => {
    expect([0, 1, 2, 3].map((i) => dragShift(i, 0, 2, H))).toEqual([0, -H, -H, 0]);
    expect([0, 1, 2, 3].map((i) => dragShift(i, 3, 1, H))).toEqual([0, H, H, 0]);
    expect([0, 1, 2, 3, 4].map((i) => dragShift(i, 1, 3, H))).toEqual([0, 0, -H, -H, 0]);
  });

  it('never shifts the dragged row, and shifts nothing when it has not moved', () => {
    expect(dragShift(2, 2, 4, H)).toBe(0);
    expect([0, 1, 2].map((i) => dragShift(i, 1, 1, H))).toEqual([0, 0, 0]);
  });
});
