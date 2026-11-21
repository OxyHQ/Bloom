import React, { useRef } from 'react';
import TestRenderer, { act } from 'react-test-renderer';

import { usePlay } from '../motion/motion-host.web';
import { defineKeyframes } from '../motion/keyframes';
import { timingOf } from '../motion/timing';
import { MOTION } from '../motion/tokens';
import type { Play } from '../motion/play';
import { surfaceMaterialCss } from '../surface/web-material';

/**
 * Bloom's motion engine on the web: keyframes are `element.animate()`, each
 * frame carrying its stretch's curve (as a CSS animation applies its timing
 * function per stretch). A box that holds a material host never fades: the
 * material's own layers and the content on it fade instead.
 */
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
surfaceMaterialCss('.test-material', 'red');

interface Recorded {
  target: string;
  frames: unknown;
  options: Record<string, unknown>;
}
const played: Recorded[] = [];
function element(name: string, children: FakeElement[] = [], material = false): FakeElement {
  const self: FakeElement = {
    name,
    children,
    matches: (selector: string) => material && selector.includes('.test-material'),
    contains: (node: FakeElement) =>
      node === self || children.some((child) => child.contains(node)),
    querySelector: (selector: string) => self.querySelectorAll(selector)[0] ?? null,
    querySelectorAll: (selector: string) =>
      children.flatMap((child) => [
        ...(child.matches(selector) ? [child] : []),
        ...child.querySelectorAll(selector),
      ]),
    animate(frames: unknown, options: Record<string, unknown>) {
      played.push({
        target: options.pseudoElement ? `${name}${String(options.pseudoElement)}` : name,
        frames,
        options,
      });
      return { onfinish: null, cancel: () => {} };
    },
  };
  return self;
}
interface FakeElement {
  name: string;
  children: FakeElement[];
  matches: (selector: string) => boolean;
  contains: (node: FakeElement) => boolean;
  querySelector: (selector: string) => FakeElement | null;
  querySelectorAll: (selector: string) => FakeElement[];
  animate: (frames: unknown, options: Record<string, unknown>) => unknown;
}

function Box({ play, node }: { play: Play; node: FakeElement }) {
  const ref = useRef<unknown>(node);
  usePlay(ref, play);
  return null;
}

const enter = defineKeyframes(
  [
    { at: 0, opacity: 0, translateY: 50 },
    { at: 0.4, opacity: 0.8, translateY: 10, easing: 'linear' },
    { at: 1, opacity: 1, translateY: 0 },
  ],
  'enter',
);
const play = (material: boolean): Play => ({
  id: 1,
  keyframes: enter,
  timing: timingOf(MOTION.enter),
  fill: 'none',
  material,
  onEnd: undefined,
});
const QUART = 'cubic-bezier(0.165,0.84,0.44,1)';

beforeEach(() => {
  played.length = 0;
});

it('plays keyframes with element.animate(), each stretch on its own curve, the whole linearly', () => {
  act(() => {
    TestRenderer.create(<Box play={play(false)} node={element('box')} />);
  });
  expect(played).toEqual([
    {
      target: 'box',
      frames: [
        { offset: 0, easing: QUART, opacity: 0, transform: 'translateY(50px)' },
        {
          offset: 0.4,
          easing: 'cubic-bezier(0,0,1,1)',
          opacity: 0.8,
          transform: 'translateY(10px)',
        },
        { offset: 1, easing: QUART, opacity: 1, transform: 'translateY(0px)' },
      ],
      options: { duration: 300, fill: 'none' },
    },
  ]);
});

it('a box that holds a material only moves; the material’s layers and the content on it fade', () => {
  const content = element('content');
  const material = element('material', [content], true);
  act(() => {
    TestRenderer.create(<Box play={play(true)} node={element('box', [material])} />);
  });
  expect(played.map((animation) => animation.target)).toEqual([
    'box',
    'material::before',
    'material::after',
    'content',
  ]);
  const [box, layer] = played;
  expect(box?.frames).toEqual([
    { offset: 0, easing: QUART, transform: 'translateY(50px)' },
    { offset: 0.4, easing: 'cubic-bezier(0,0,1,1)', transform: 'translateY(10px)' },
    { offset: 1, easing: QUART, transform: 'translateY(0px)' },
  ]);
  expect(layer?.frames).toEqual([
    { offset: 0, easing: QUART, opacity: 0 },
    { offset: 0.4, easing: 'cubic-bezier(0,0,1,1)', opacity: 0.8 },
    { offset: 1, easing: QUART, opacity: 1 },
  ]);
});

describe('Presence on the web', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Presence } = require('../motion/presence') as typeof import('../motion/presence');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { LeavingContext } = require('../motion/leaving') as typeof import('../motion/leaving');
  let renders = 0;
  const Row = React.memo(function Row({ label }: { label: string; exit?: boolean }) {
    renders += 1;
    return <Leave label={label} />;
  });
  const left: Array<() => void> = [];
  function Leave({ label }: { label: string }) {
    const leaving = React.useContext(LeavingContext);
    if (leaving) left.push(leaving.onLeft);
    return React.createElement('Text', null, leaving ? `${label} (leaving)` : label);
  }
  const list = (ids: string[]) => (
    <Presence items={ids.map((id) => <Row key={id} exit label={id} />)} />
  );

  it('keeps a child that left until it says so; only what reads the leaving re-renders', () => {
    let r!: TestRenderer.ReactTestRenderer;
    act(() => {
      r = TestRenderer.create(list(['a', 'b']));
    });
    const before = renders;
    act(() => r.update(list(['b'])));
    const texts = () => r.root.findAllByType('Text' as never).map((node) => node.props.children);
    expect(texts()).toEqual(['a (leaving)', 'b']);
    // Neither memoized row re-renders: only the reader of the leaving does.
    expect(renders - before).toBe(0);
    act(() => left[left.length - 1]?.());
    expect(texts()).toEqual(['b']);
  });
});

describe('motion values on the web', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const web = require('../motion/motion-value.web') as typeof import('../motion/motion-value.web');
  type Value = import('../motion/motion-value.web').MotionValue;

  function mount() {
    const node = { style: {} as Record<string, string> };
    let values!: { x: Value; drag: Value; opacity: Value; doubled: Value };
    let style: Record<string, unknown> = {};
    function Box() {
      const x = web.useMotionValue(10);
      const drag = web.useMotionValue(0);
      const opacity = web.useMotionValue(1);
      const doubled = web.useDerivedMotionValue([drag], (d) => d * 2);
      values = { x, drag, opacity, doubled };
      const motion = web.useMotionStyle({ translateX: [x, doubled], opacity });
      style = motion.style as Record<string, unknown>;
      React.useLayoutEffect(() => motion.ref?.(node), [motion]);
      return null;
    }
    let r!: TestRenderer.ReactTestRenderer;
    act(() => {
      r = TestRenderer.create(<Box />);
    });
    return { node, values: () => values, style: () => style, r };
  }

  it('renders the bound style, then writes moves straight to the element with no transition', () => {
    const box = mount();
    expect(box.style()).toEqual({ opacity: 1, transform: [{ translateX: 10 }] });
    web.setMotionValue(box.values().drag, 5);
    expect(box.node.style.transform).toBe('translateX(20px)');
    expect(box.node.style.transition).toBe('');
  });

  it('animates by a CSS transition of the properties it moves, and ends on its time', () => {
    jest.useFakeTimers();
    const box = mount();
    const ended = jest.fn();
    web.animateMotionValue(box.values().x, 100, MOTION.slide, false, ended);
    expect(box.node.style.transform).toBe('translateX(100px)');
    expect(box.node.style.transition).toBe(
      `transform ${MOTION.slide.duration}ms cubic-bezier(${MOTION.slide.easing?.join(',')})`,
    );
    web.animateMotionValue(box.values().opacity, 0, 'fade');
    expect(box.node.style.transition).toContain('transform');
    expect(box.node.style.transition).toContain('opacity 160ms');
    expect(ended).not.toHaveBeenCalled();
    jest.advanceTimersByTime(MOTION.slide.duration);
    expect(ended).toHaveBeenCalledTimes(1);
    // A finger's write is never eased.
    web.setMotionValue(box.values().drag, 1);
    expect(box.node.style.transition).toBe(
      `opacity 160ms cubic-bezier(${MOTION.fade.easing?.join(',')})`,
    );
    jest.useRealTimers();
  });

  it('under reduced motion lands at once and ends at once', () => {
    const box = mount();
    const ended = jest.fn();
    web.animateMotionValue(box.values().x, 50, 'slide', true, ended);
    expect(box.node.style.transition).toBe('');
    expect(ended).toHaveBeenCalledTimes(1);
  });

  // A value over a Reanimated shared value moves in Reanimated's frames, so
  // the shared value's other readers (a sheet's backdrop, its owner's
  // progress) see each frame's number; every change is a write, never a
  // CSS transition.
  it('over a shared value: writes and animations go to it, and each change restyles the view', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const reanimated =
      require('react-native-reanimated') as typeof import('react-native-reanimated');
    const spring = jest.spyOn(reanimated, 'withSpring');
    const node = { style: {} as Record<string, string> };
    let shared!: import('react-native-reanimated').SharedValue<number>;
    let value!: Value;
    function Box() {
      shared = reanimated.useSharedValue(40);
      value = web.useMotionValueOf(shared);
      const doubled = web.useDerivedMotionValue([value], (n) => n * 2);
      const motion = web.useMotionStyle({ translateY: value, scale: doubled });
      React.useLayoutEffect(() => motion.ref?.(node), [motion]);
      return null;
    }
    act(() => {
      TestRenderer.create(<Box />);
    });
    expect(web.getMotionValue(value)).toBe(40);
    web.setMotionValue(value, 12);
    expect(shared.value).toBe(12);
    expect(node.style.transform).toBe('translateY(12px) scale(24)');
    // Reanimated (or anything else) writing the shared value restyles the view too.
    shared.value = 30;
    expect(web.getMotionValue(value)).toBe(30);
    expect(node.style.transform).toBe('translateY(30px) scale(60)');
    // A spring plays on the shared value, from the finger's velocity.
    const ended = jest.fn();
    web.animateMotionValue(value, 0, { response: 0.3, dampingRatio: 0.8 }, false, ended, 900);
    expect(spring).toHaveBeenLastCalledWith(
      0,
      expect.objectContaining({ velocity: 900 }),
      expect.any(Function),
    );
    expect(shared.value).toBe(0);
    expect(node.style.transform).toBe('translateY(0px) scale(0)');
    expect(node.style.transition).toBe('');
    expect(ended).toHaveBeenCalledTimes(1);
    spring.mockRestore();
  });
});
