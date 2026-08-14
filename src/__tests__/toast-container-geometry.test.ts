import {
  ESTIMATED_TOAST_HEIGHT,
  OUTSIDE_PRESS_PADDING,
} from '../toast/constants';
import {
  calculateOutsidePressableArea,
  getContainerStyle,
  getInsetValues,
} from '../toast/container-geometry';
import type { ToastPosition } from '../toast/types';

describe('getContainerStyle', () => {
  /**
   * The container must be FULL-BLEED, with all four insets pinned to 0. Rows are
   * themselves absolutely positioned, so a container that sizes itself to its
   * content has ZERO HEIGHT and every row lands outside its parent's box — which
   * Android refuses to paint at `bottom-center`. `getInsetValues` supplies the edge
   * offset, which `Positioner` applies as PADDING so rows stay inside.
   */
  it('is full-bleed, so a row can never be laid out outside it', () => {
    expect(getContainerStyle()).toEqual({
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      alignItems: 'center',
      overflow: 'visible',
    });
  });

  it('never sizes itself to its content', () => {
    const style = getContainerStyle();
    expect(style.height).toBeUndefined();
    expect(style.width).toBeUndefined();
    // All four edges pinned is what gives it the host's size instead.
    expect([style.top, style.right, style.bottom, style.left]).toEqual([
      0, 0, 0, 0,
    ]);
  });

  /**
   * Load-bearing for swipe-to-dismiss and for the exit animation: both translate a
   * row deliberately PAST the container edge (a left swipe by up to a full screen
   * width, an exit by up to 150px). Clipping the container would cut the row off
   * mid-gesture.
   */
  it('does not clip, because swipe and exit translate rows past its edge', () => {
    expect(getContainerStyle().overflow).toBe('visible');
  });

  /**
   * THE #26 INVARIANT, on the composition rather than on either half. `Positioner`
   * layers `getInsetValues` over `getContainerStyle` in a style array, so the inset
   * overrides exactly ONE of the four pinned edges and the opposite edge stays 0 —
   * which is what keeps the box spanning the host and gives it a real height. If a
   * future edit made `getInsetValues` return both edges, or dropped the opposite
   * pin, the container would collapse to zero height again and every row would be
   * laid out out of bounds.
   */
  it.each<[ToastPosition, 'top' | 'bottom' | null]>([
    ['top-center', 'top'],
    ['bottom-center', 'bottom'],
    ['center', null],
  ])('keeps a real height for %s: only the anchored edge moves', (position, anchored) => {
    const merged = { ...getContainerStyle(), ...getInsetValues({ position }) };
    const edges = { top: merged.top, right: merged.right, bottom: merged.bottom, left: merged.left };

    // Every edge is still pinned — none became undefined.
    expect(Object.values(edges).every((value) => value !== undefined)).toBe(true);

    const moved = Object.entries(edges)
      .filter(([, value]) => value !== 0)
      .map(([key]) => key);
    expect(moved).toEqual(anchored ? [anchored] : []);

    // The opposite vertical edge staying 0 is what gives the box its height.
    if (anchored) {
      const opposite = anchored === 'top' ? 'bottom' : 'top';
      expect(edges[opposite]).toBe(0);
    }
  });
});

describe('getInsetValues', () => {
  it.each<[ToastPosition, 'top' | 'bottom']>([
    ['top-center', 'top'],
    ['bottom-center', 'bottom'],
  ])('honours an explicit offset for %s', (position, edge) => {
    expect(getInsetValues({ position, offset: 24 })).toEqual({ [edge]: 24 });
  });

  it('derives the inset from the safe area when no offset is given', () => {
    expect(
      getInsetValues({
        position: 'bottom-center',
        safeAreaInsets: { top: 47, bottom: 34 },
      }),
    ).toEqual({ bottom: 42 });

    expect(
      getInsetValues({
        position: 'top-center',
        safeAreaInsets: { top: 47, bottom: 34 },
      }),
    ).toEqual({ top: 55 });
  });

  it('falls back to 16 with no safe area and no offset', () => {
    expect(getInsetValues({ position: 'bottom-center' })).toEqual({ bottom: 16 });
    expect(getInsetValues({ position: 'top-center' })).toEqual({ top: 16 });
  });

  it('treats offset 0 as "derive from the safe area"', () => {
    expect(
      getInsetValues({
        position: 'bottom-center',
        offset: 0,
        safeAreaInsets: { top: 0, bottom: 34 },
      }),
    ).toEqual({ bottom: 42 });
  });

  it('has no inset for the center position', () => {
    expect(getInsetValues({ position: 'center', offset: 24 })).toEqual({});
  });
});

describe('calculateOutsidePressableArea', () => {
  it('reserves the measured stack height at the bottom', () => {
    // 50 + 60 + one 8px gap + padding, below a 34px inset.
    expect(
      calculateOutsidePressableArea({
        position: 'bottom-center',
        toastHeights: { a: 50, b: 60 },
        gap: 8,
        visibleToasts: 3,
        insetValues: { bottom: 34 },
      }),
    ).toEqual({
      position: 'absolute',
      top: 0,
      bottom: 34 + 50 + 60 + 8 + OUTSIDE_PRESS_PADDING,
      left: 0,
      right: 0,
    });
  });

  it('reserves the measured stack height at the top', () => {
    expect(
      calculateOutsidePressableArea({
        position: 'top-center',
        toastHeights: { a: 50, b: 60 },
        gap: 8,
        visibleToasts: 3,
        insetValues: { top: 47 },
      }),
    ).toEqual({
      position: 'absolute',
      top: 47 + 50 + 60 + 8 + OUTSIDE_PRESS_PADDING,
      bottom: 0,
      left: 0,
      right: 0,
    });
  });

  it('counts no more rows than visibleToasts', () => {
    const area = calculateOutsidePressableArea({
      position: 'bottom-center',
      toastHeights: { a: 50, b: 60, c: 70 },
      gap: 8,
      visibleToasts: 2,
      insetValues: { bottom: 0 },
    });
    // Only a + b, one gap, and the default 40 inset fallback.
    expect(area.bottom).toBe(40 + 50 + 60 + 8 + OUTSIDE_PRESS_PADDING);
  });

  it('estimates the stack height before anything has been measured', () => {
    const area = calculateOutsidePressableArea({
      position: 'bottom-center',
      toastHeights: {},
      gap: 8,
      visibleToasts: 3,
      insetValues: { bottom: 16 },
    });
    expect(area.bottom).toBe(
      16 + ESTIMATED_TOAST_HEIGHT * 3 + 8 * 2 + OUTSIDE_PRESS_PADDING,
    );
  });

  it('charges no gap for a single row', () => {
    const area = calculateOutsidePressableArea({
      position: 'bottom-center',
      toastHeights: { a: 50 },
      gap: 8,
      visibleToasts: 3,
      insetValues: { bottom: 16 },
    });
    expect(area.bottom).toBe(16 + 50 + OUTSIDE_PRESS_PADDING);
  });

  it('has no pressable area for the center position', () => {
    expect(
      calculateOutsidePressableArea({
        position: 'center',
        toastHeights: { a: 50 },
        gap: 8,
        visibleToasts: 3,
        insetValues: {},
      }),
    ).toEqual({ display: 'none' });
  });
});
