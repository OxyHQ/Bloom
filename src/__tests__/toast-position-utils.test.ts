import {
  ESTIMATED_TOAST_HEIGHT,
  MIN_STACK_SCALE_X,
  TOAST_MAX_ROW_WIDTH,
} from '../toast/constants';
import {
  calculateStackScaleX,
  calculateToastPosition,
  getOrderedToastIds,
} from '../toast/position-utils';
import type { ToastPosition, ToastProps } from '../toast/types';

const toastWithId = (id: string | number): ToastProps => ({
  id,
  index: 0,
  title: String(id),
  numberOfToasts: 0,
  orderedToastIds: [],
});

const HEIGHTS = { a: 50, b: 60, c: 70 };
const ORDERED = ['a', 'b', 'c'];

const positionAt = ({
  index,
  position,
  enableStacking = false,
  isExpanded = false,
  gap = 8,
  stackGap = 8,
  allToastHeights = HEIGHTS,
  orderedToastIds = ORDERED,
  numberOfToasts = ORDERED.length,
}: {
  index: number;
  position: ToastPosition;
  enableStacking?: boolean;
  isExpanded?: boolean;
  gap?: number;
  stackGap?: number;
  allToastHeights?: Record<string | number, number>;
  orderedToastIds?: Array<string | number>;
  numberOfToasts?: number;
}) =>
  calculateToastPosition({
    index,
    numberOfToasts,
    enableStacking,
    position,
    allToastHeights,
    gap,
    orderedToastIds,
    isExpanded,
    stackGap,
  });

describe('getOrderedToastIds', () => {
  const toasts = [toastWithId('a'), toastWithId('b'), toastWithId('c')];

  it.each<[ToastPosition, Array<string | number>]>([
    ['top-center', ['c', 'b', 'a']],
    ['bottom-center', ['a', 'b', 'c']],
    ['center', ['a', 'b', 'c']],
  ])('orders %s as %j when stacking is off', (position, expected) => {
    expect(getOrderedToastIds(toasts, position, false)).toEqual(expected);
  });

  it('keeps the store order for every position when stacking is on', () => {
    for (const position of [
      'top-center',
      'bottom-center',
      'center',
    ] as ToastPosition[]) {
      expect(getOrderedToastIds(toasts, position, true)).toEqual([
        'a',
        'b',
        'c',
      ]);
    }
  });

  it('does not mutate the toasts it was given', () => {
    const input = [toastWithId('a'), toastWithId('b')];
    getOrderedToastIds(input, 'top-center', false);
    expect(input.map((t) => t.id)).toEqual(['a', 'b']);
  });
});

describe('calculateToastPosition', () => {
  describe('stacking off', () => {
    it.each([
      [0, 0],
      [1, 58],
      [2, 126],
    ])('top-center index %i sits at %i', (index, expected) => {
      expect(positionAt({ index, position: 'top-center' })).toBe(expected);
    });

    it.each([
      [2, 0],
      [1, -78],
      [0, -146],
    ])('bottom-center index %i sits at %i', (index, expected) => {
      expect(positionAt({ index, position: 'bottom-center' })).toBe(expected);
    });

    it.each([
      [2, -35],
      [1, -113],
    ])('center index %i sits at %i (half the front row above the line)', (
      index,
      expected,
    ) => {
      expect(positionAt({ index, position: 'center' })).toBe(expected);
    });

    it('falls back to the estimated height for unmeasured rows', () => {
      expect(
        positionAt({
          index: 1,
          position: 'top-center',
          allToastHeights: {},
          orderedToastIds: ['x', 'y'],
          numberOfToasts: 2,
        }),
      ).toBe(ESTIMATED_TOAST_HEIGHT + 8);
    });

    it('treats a measured height of 0 as unmeasured', () => {
      expect(
        positionAt({
          index: 1,
          position: 'top-center',
          allToastHeights: { x: 0, y: 0 },
          orderedToastIds: ['x', 'y'],
          numberOfToasts: 2,
        }),
      ).toBe(ESTIMATED_TOAST_HEIGHT + 8);
    });

    it('skips ids the ordering does not have yet', () => {
      expect(
        positionAt({
          index: 2,
          position: 'top-center',
          orderedToastIds: ['a'],
          numberOfToasts: 3,
        }),
      ).toBe(58);
    });
  });

  describe('stacking on', () => {
    it.each([
      [0, 0],
      [1, -2],
      [2, -4],
    ])('top-center index %i tucks behind the front row at %i', (
      index,
      expected,
    ) => {
      expect(
        positionAt({ index, position: 'top-center', enableStacking: true }),
      ).toBe(expected);
    });

    it.each([
      [2, 0],
      [1, -18],
      [0, -36],
    ])('bottom-center index %i tucks behind the front row at %i', (
      index,
      expected,
    ) => {
      expect(
        positionAt({ index, position: 'bottom-center', enableStacking: true }),
      ).toBe(expected);
    });

    it('applies the center shift to a stacked center position', () => {
      // centerShift (-70/2) - (front 70 + 0 * stackGap - current 70)
      expect(
        positionAt({ index: 2, position: 'center', enableStacking: true }),
      ).toBe(-35);
    });

    it('expands into a spaced list using stackGap as the gap', () => {
      expect(
        positionAt({
          index: 1,
          position: 'top-center',
          enableStacking: true,
          isExpanded: true,
          gap: 20,
          stackGap: 4,
        }),
      ).toBe(54);
    });

    /**
     * WHY THE STORE MAY AUTO-COLLAPSE A STACK DOWN TO ITS LAST ROW.
     *
     * `ToastStore.dismissToast` collapses an expanded stack once one row is left, so
     * that row's paused timer resumes and it cannot hang on screen forever. That is
     * only acceptable because the collapse is INVISIBLE at one row: both branches of
     * `calculateToastPosition` resolve to the same offset, and `calculateStackScaleX`
     * returns 1 either way. If this ever stops holding, the store's rule needs a
     * rethink rather than this test an update.
     */
    it.each<ToastPosition>(['bottom-center', 'top-center', 'center'])(
      'a single row is unmoved by expansion (%s)',
      (position) => {
        const lone = {
          index: 0,
          position,
          enableStacking: true,
          numberOfToasts: 1,
          orderedToastIds: ['a'],
          allToastHeights: { a: 50 },
        };

        expect(positionAt({ ...lone, isExpanded: true })).toBe(
          positionAt({ ...lone, isExpanded: false }),
        );
      },
    );
  });
});

describe('calculateStackScaleX', () => {
  const scaleAt = ({
    index,
    numberOfToasts = 3,
    enableStacking = true,
    position = 'bottom-center' as ToastPosition,
    isExpanded = false,
    stackGap = 8,
    rowWidth = 400,
  }: {
    index: number;
    numberOfToasts?: number;
    enableStacking?: boolean;
    position?: ToastPosition;
    isExpanded?: boolean;
    stackGap?: number;
    rowWidth?: number;
  }) =>
    calculateStackScaleX({
      index,
      numberOfToasts,
      enableStacking,
      position,
      isExpanded,
      stackGap,
      rowWidth,
    });

  it.each([
    ['stacking is off', { index: 0, enableStacking: false }],
    ['there is only one row', { index: 0, numberOfToasts: 1 }],
    ['the stack is expanded', { index: 0, isExpanded: true }],
    ['the row has not been measured', { index: 0, rowWidth: 0 }],
  ])('does not squeeze when %s', (_label, params) => {
    expect(scaleAt(params)).toBe(1);
  });

  it('leaves the front row at full width and squeezes the ones behind it', () => {
    // bottom-center: the front row is the LAST index.
    expect(scaleAt({ index: 2 })).toBe(1);
    expect(scaleAt({ index: 1 })).toBe(1 - 16 / 400);
    expect(scaleAt({ index: 0 })).toBe(1 - 32 / 400);
  });

  it('measures depth from index 0 for a top-anchored stack', () => {
    expect(scaleAt({ index: 0, position: 'top-center' })).toBe(1);
    expect(scaleAt({ index: 1, position: 'top-center' })).toBe(1 - 16 / 400);
  });

  it('never squeezes past MIN_STACK_SCALE_X', () => {
    expect(
      scaleAt({ index: 0, numberOfToasts: 50, stackGap: 40, rowWidth: 200 }),
    ).toBe(MIN_STACK_SCALE_X);
  });

  it('scales the squeeze with the row width', () => {
    expect(scaleAt({ index: 1, rowWidth: 800 })).toBe(1 - 16 / 800);
  });

  /**
   * The squeeze is measured against the ROW, which is capped, not the window.
   * Feeding it a desktop window width instead is the bug this pins: the buried
   * row would narrow by 4 visible pixels rather than the intended 16.
   */
  it('squeezes a capped row by the same visible amount on a desktop viewport', () => {
    const desktopWindowWidth = 1280;
    expect(scaleAt({ index: 1, rowWidth: TOAST_MAX_ROW_WIDTH })).toBe(
      1 - 16 / TOAST_MAX_ROW_WIDTH,
    );
    expect(scaleAt({ index: 1, rowWidth: TOAST_MAX_ROW_WIDTH })).toBeLessThan(
      scaleAt({ index: 1, rowWidth: desktopWindowWidth }),
    );
  });
});
