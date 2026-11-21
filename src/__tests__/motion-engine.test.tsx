import React from 'react';
import { Text } from 'react-native';
import { act, render } from '@testing-library/react-native';

import {
  MOTION,
  MotionView,
  Presence,
  defineKeyframes,
  moveTransition,
  opacityTransition,
  timingOf,
  type Play,
} from '../motion';

/**
 * Bloom's motion engine on native: keyframes and transitions are Reanimated
 * CSS animations and transitions on an `Animated.View` (this suite's mock
 * takes `css.keyframes`, `cubicBezier` and `linear` as data), with no worklet
 * and no shared value.
 */
const pop = defineKeyframes(
  [
    { at: 0, scale: 1, easing: 'inOutQuad' },
    { at: 0.1, scale: 0.7 },
    { at: 1, scale: 1 },
  ],
  'pop',
);
const play = (id: number, fill: Play['fill'] = 'none', onEnd?: () => void): Play => ({
  id,
  keyframes: pop,
  timing: timingOf(MOTION.pop),
  fill,
  material: false,
  onEnd,
});

const styleOf = (node: { props: Record<string, unknown> }) =>
  Object.assign({}, ...[node.props.style].flat(4).filter(Boolean)) as Record<string, unknown>;

describe('MotionView', () => {
  it('plays keyframes as a registered CSS animation: one block per frame, its curve on the block', () => {
    const { UNSAFE_root } = render(<MotionView play={play(1)} testID="box" />);
    const box = UNSAFE_root.find(
      (node) => node.props.testID === 'box' && typeof node.type === 'string',
    );
    expect(styleOf(box)).toMatchObject({
      animationName: {
        keyframes: {
          '0%': {
            transform: [{ scale: 1 }],
            animationTimingFunction: { cubicBezier: [0.455, 0.03, 0.515, 0.955] },
          },
          '10%': { transform: [{ scale: 0.7 }] },
          '100%': { transform: [{ scale: 1 }] },
        },
      },
      animationDuration: 300,
      animationTimingFunction: { cubicBezier: [0.16, 1, 0.3, 1] },
      animationFillMode: 'none',
    });
  });

  it('a new playing names the other of two identical rules, so it restarts even mid-play', () => {
    const rule = (id: number) => {
      const { UNSAFE_root } = render(<MotionView play={play(id)} testID="box" />);
      return styleOf(
        UNSAFE_root.find((n) => n.props.testID === 'box' && typeof n.type === 'string'),
      ).animationName;
    };
    expect(rule(1)).not.toBe(rule(2));
    expect(rule(1)).toBe(rule(3));
    expect(rule(1)).toEqual(rule(2));
  });

  it('ends on the engine’s end event, and transitions transform and opacity with a timing', () => {
    const onEnd = jest.fn();
    const { UNSAFE_root } = render(
      <MotionView play={play(1, 'none', onEnd)} transition={timingOf(MOTION.slide)} testID="box" />,
    );
    const box = UNSAFE_root.find((n) => n.props.testID === 'box' && typeof n.type === 'string');
    box.props.onCSSAnimationEnd();
    expect(onEnd).toHaveBeenCalledTimes(1);
    expect(styleOf(box)).toMatchObject({
      transitionProperty: ['transform', 'opacity'],
      transitionDuration: 200,
      transitionTimingFunction: { cubicBezier: [0.25, 0.1, 0.25, 1] },
    });
  });
});

describe('a finished playing', () => {
  it('leaves the box once it ends holding no last frame; one that holds it stays', () => {
    const find = (root: ReturnType<typeof render>['UNSAFE_root']) =>
      root.find((n) => n.props.testID === 'box' && typeof n.type === 'string');
    const loose = render(<MotionView play={play(1, 'none')} testID="box" />);
    act(() => find(loose.UNSAFE_root).props.onCSSAnimationEnd());
    expect(styleOf(find(loose.UNSAFE_root)).animationName).toBeUndefined();
    // A new playing plays again.
    loose.rerender(<MotionView play={play(2, 'none')} testID="box" />);
    expect(styleOf(find(loose.UNSAFE_root)).animationName).toBeDefined();

    const held = render(<MotionView play={play(1, 'forwards', () => {})} testID="box" />);
    act(() => find(held.UNSAFE_root).props.onCSSAnimationEnd());
    expect(styleOf(find(held.UNSAFE_root)).animationName).toBeDefined();
  });
});

describe('transitions and Presence', () => {
  it('a transition’s halves run from away to rest and back', () => {
    const rise = moveTransition('top', 20).combined(opacityTransition).animation('enter');
    expect(rise.insert.frames.map((frame) => [frame.opacity, frame.transform])).toEqual([
      [0, [{ translateY: -20 }]],
      [1, [{ translateY: 0 }]],
    ]);
    expect(rise.remove.motion).toBe(MOTION.enter);
  });

  it('a removal plays while the Presence keeps the child, as a CSS animation, and the child goes when it ends', () => {
    const leave = defineKeyframes(
      [
        { at: 0, opacity: 1 },
        { at: 0.5, opacity: 0.35, easing: 'linear' },
        { at: 1, opacity: 0 },
      ],
      'exit',
    );
    function Row({ id }: { id: string; exit?: boolean }) {
      return (
        <MotionView exit={{ keyframes: leave, material: false }} testID={`row-${id}`}>
          <Text>{id}</Text>
        </MotionView>
      );
    }
    const list = (ids: string[]) => (
      <Presence items={ids.map((id) => <Row key={id} id={id} exit />)} />
    );
    const rendered = render(list(['a', 'b']));
    const host = () =>
      rendered.UNSAFE_root.find((n) => n.props.testID === 'row-a' && typeof n.type === 'string');
    // At rest a row plays nothing and carries no layout animation.
    expect(host().props.exiting).toBeUndefined();
    expect(styleOf(host()).animationName).toBeUndefined();
    rendered.rerender(list(['b']));
    // Kept while it leaves, holding its last frame.
    expect(rendered.getByText('a')).toBeTruthy();
    expect(styleOf(host()).animationFillMode).toBe('forwards');
    act(() => host().props.onCSSAnimationEnd());
    expect(rendered.queryByText('a')).toBeNull();
    expect(rendered.getByText('b')).toBeTruthy();
  });

  it('Presence passes a list with no leaver through: a removed child goes at once', () => {
    const list = (ids: string[]) => (
      <Presence items={ids.map((id) => <Text key={id}>{id}</Text>)} />
    );
    const rendered = render(list(['a', 'b']));
    rendered.rerender(list(['b']));
    expect(rendered.queryByText('a')).toBeNull();
    expect(rendered.getByText('b')).toBeTruthy();
  });
});
