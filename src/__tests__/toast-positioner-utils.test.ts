import {
  ESTIMATED_TOAST_HEIGHT,
  OUTSIDE_PRESS_PADDING,
} from '../toast/constants';
import {
  calculateOutsidePressableArea,
  getContainerStyle,
  getInsetValues,
} from '../toast/positioner-utils';
import type { ToastPosition } from '../toast/types';

describe('getContainerStyle', () => {
  it('anchors the center position at the vertical midpoint', () => {
    expect(getContainerStyle('center')).toEqual({
      position: 'absolute',
      top: '50%',
      left: 0,
      right: 0,
      alignItems: 'center',
      overflow: 'visible',
    });
  });

  it.each<ToastPosition>(['top-center', 'bottom-center'])(
    'spans the full width for %s, leaving the edge to getInsetValues',
    (position) => {
      expect(getContainerStyle(position)).toEqual({
        position: 'absolute',
        width: '100%',
        alignItems: 'center',
        overflow: 'visible',
      });
    },
  );
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
