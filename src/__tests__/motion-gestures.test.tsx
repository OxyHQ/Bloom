import { act, render } from '@testing-library/react-native';
import React from 'react';
import { View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';

import { useDrag, useSwipe } from '../motion/gestures';
import {
  getMotionValue,
  setMotionValue,
  useDerivedMotionValue,
  useMotionStyle,
  useMotionValue,
  type MotionValue,
} from '../motion/motion-value';
import { sampledTiming } from '../motion/timing';

/**
 * Bloom's gesture layer (native): Gesture Handler 3 hooks write motion values
 * from their own callbacks, and the one mapper binds them to a view. The
 * Gesture Handler mock records a hook's callbacks on `__handlers`, so these
 * fire the gesture's real callbacks with real payloads.
 */
type Handlers = Record<string, (event: Record<string, unknown>) => void>;
interface Recorded {
  __handlers: Handlers;
  __config: Record<string, unknown>;
  __members: Recorded[];
}

function flat(style: unknown): Record<string, unknown> {
  return Object.assign({}, ...[style].flat(Number.POSITIVE_INFINITY).filter(Boolean));
}

describe('the one mapper', () => {
  it('sums each key’s values, keeps width at or above 0 and writes rotation in degrees', () => {
    let values!: { a: MotionValue; b: MotionValue; r: MotionValue };
    function Box() {
      const a = useMotionValue(10);
      const b = useMotionValue(-30);
      const r = useMotionValue(45);
      values = { a, b, r };
      const motion = useMotionStyle({ translateX: [a, b], width: [a, b], rotate: r, opacity: a });
      return <View testID="box" style={motion.style} />;
    }
    const { getByTestId, rerender } = render(<Box />);
    expect(flat(getByTestId('box').props.style)).toEqual({
      opacity: 10,
      width: 0,
      transform: [{ translateX: -20 }, { rotate: '45deg' }],
    });
    setMotionValue(values.b, 5);
    rerender(<Box />);
    expect(flat(getByTestId('box').props.style)).toMatchObject({
      width: 15,
      transform: [{ translateX: 15 }, { rotate: '45deg' }],
    });
  });

  it('a derived value follows its inputs through a pure function of their numbers', () => {
    let out!: MotionValue;
    let input!: MotionValue;
    function Box() {
      input = useMotionValue(3);
      out = useDerivedMotionValue([input], (n) => n * 2);
      return null;
    }
    const { rerender } = render(<Box />);
    expect(getMotionValue(out)).toBe(6);
    setMotionValue(input, 5);
    rerender(<Box />);
    expect(getMotionValue(out)).toBe(10);
  });

  it('a sampled timing is its function at even steps, ends included', () => {
    const timing = sampledTiming(300, (t) => t * t);
    expect(timing.duration).toBe(300);
    expect(timing.curve.kind).toBe('linear');
    expect(timing.curve.points[0]).toBe(0);
    expect(timing.curve.points[24]).toBe(0.25);
    expect(timing.curve.points[timing.curve.points.length - 1]).toBe(1);
  });
});

describe('useDrag', () => {
  it('moves the value with the finger from where it was, within its bounds, and reports the end once', () => {
    const ends: Array<{ value: number; velocity: number }> = [];
    let value!: MotionValue;
    function Box() {
      value = useMotionValue(20);
      const gesture = useDrag(value, {
        axis: 'x',
        min: 0,
        max: 100,
        activeOffset: 12,
        failOffset: 8,
        onEnd: (end) => ends.push(end),
      });
      return (
        <GestureDetector gesture={gesture as never}>
          <View testID="box" />
        </GestureDetector>
      );
    }
    const { UNSAFE_root } = render(<Box />);
    const gesture = UNSAFE_root.findAll((node) => node.props.gesture !== undefined)[0]?.props
      .gesture as Recorded;
    expect(gesture.__config).toMatchObject({ activeOffsetX: [-12, 12], failOffsetY: [-8, 8] });
    act(() => {
      gesture.__handlers.onBegin?.({});
      gesture.__handlers.onUpdate?.({ translationX: 30, velocityX: 400 });
    });
    expect(getMotionValue(value)).toBe(50);
    act(() => gesture.__handlers.onUpdate?.({ translationX: 300, velocityX: 900 }));
    expect(getMotionValue(value)).toBe(100);
    act(() => gesture.__handlers.onFinalize?.({}));
    expect(ends).toEqual([{ value: 100, velocity: 900 }]);
  });
});

describe('useSwipe', () => {
  function mountSwipe(direction: 'left' | 'up', onSwipe: () => void, resist: 'none' | 'elastic') {
    let value!: MotionValue;
    function Row() {
      const swipe = useSwipe(direction, onSwipe, { distance: 400, threshold: 16, resist });
      value = swipe.value;
      return (
        <GestureDetector gesture={swipe.gesture as never}>
          <View />
        </GestureDetector>
      );
    }
    const { UNSAFE_root } = render(<Row />);
    const composed = UNSAFE_root.findAll((node) => node.props.gesture !== undefined)[0]?.props
      .gesture as Recorded;
    const pan = composed.__members.find((member) => member.__handlers.onUpdate) as Recorded;
    return { pan, value: () => getMotionValue(value) };
  }

  it('follows the finger in its direction and, past the threshold, flies out and calls back', () => {
    const onSwipe = jest.fn();
    const row = mountSwipe('up', onSwipe, 'elastic');
    act(() => row.pan.__handlers.onUpdate?.({ translationY: -40 }));
    expect(row.value()).toBe(-40);
    act(() => row.pan.__handlers.onFinalize?.({}));
    expect(row.value()).toBe(-400);
    expect(onSwipe).toHaveBeenCalledTimes(1);
  });

  it('meets elastic resistance the other way, and comes back without swiping', () => {
    const onSwipe = jest.fn();
    const row = mountSwipe('up', onSwipe, 'elastic');
    act(() => row.pan.__handlers.onUpdate?.({ translationY: 50 }));
    expect(row.value()).toBeGreaterThan(0);
    expect(row.value()).toBeLessThan(50 * 0.4);
    act(() => row.pan.__handlers.onFinalize?.({}));
    expect(row.value()).toBe(0);
    expect(onSwipe).not.toHaveBeenCalled();
  });

  it('holds at rest against the direction without resistance, and a short travel comes back', () => {
    const onSwipe = jest.fn();
    const row = mountSwipe('left', onSwipe, 'none');
    act(() => row.pan.__handlers.onUpdate?.({ translationX: 30 }));
    expect(row.value()).toBe(0);
    act(() => row.pan.__handlers.onUpdate?.({ translationX: -10 }));
    act(() => row.pan.__handlers.onFinalize?.({}));
    expect(row.value()).toBe(0);
    expect(onSwipe).not.toHaveBeenCalled();
  });
});
