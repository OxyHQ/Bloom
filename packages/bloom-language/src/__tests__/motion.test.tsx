import { createElement, type ReactElement } from 'react';
import TestRenderer, {
  act,
  type ReactTestInstance,
  type ReactTestRenderer,
} from 'react-test-renderer';

import { LIGHT, PaintContext } from './support/bloom-theme';
import { runtime } from './support/bloom-runtime';
import { HStack, Icon, Image, Lottie, Text, VStack, ZStack } from '../primitives';
import { toElement } from '../render';
import { defineKeyframes } from '../motion/keyframes';
import { asymmetric, move, opacity, scale } from '../motion/transition';
import type { Namespace } from '../motion/namespace';
import { regular } from '../glass';
import type { Child } from '../node';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const consoleError = console.error;
beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
    if (String(args[0]).includes('react-test-renderer is deprecated')) return;
    consoleError(...args);
  });
});
afterEach(() => {
  runtime.reducedMotion = false;
  runtime.screenVisible = true;
});

const Glyph = (props: { width?: number; height?: number; fill?: string }) =>
  createElement('Glyph', props);

/** Each host's frame, as a layout would give it: by testID. */
const frames: Record<string, { x: number; y: number; width: number; height: number }> = {};
function createNodeMock(element: ReactElement) {
  const { testID } = element.props as { testID?: string };
  return {
    getBoundingClientRect: () => frames[testID ?? ''] ?? { x: 0, y: 0, width: 0, height: 0 },
  };
}

function mount(node: Child): ReactTestRenderer {
  let renderer!: ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(
      createElement(PaintContext.Provider, { value: LIGHT }, toElement(node)),
      { createNodeMock },
    );
  });
  return renderer;
}
function update(renderer: ReactTestRenderer, node: Child): void {
  act(() =>
    renderer.update(createElement(PaintContext.Provider, { value: LIGHT }, toElement(node))),
  );
}
const all = (renderer: ReactTestRenderer, type: string): ReactTestInstance[] =>
  renderer.root.findAll((instance) => instance.type === type);
const flat = (style: unknown): Record<string, unknown> =>
  Object.assign({}, ...(Array.isArray(style) ? style.flat(4) : [style]).filter(Boolean));

describe('geometry and .animation()', () => {
  it('scale and offset tokens are a resting transform on the animated twin of the host', () => {
    const r = mount(HStack(Text('a')).padding('md').offset({ y: 'md' }).scale('pressed'));
    const [box] = all(r, 'Animated.View');
    expect(flat(box?.props.style)).toMatchObject({
      paddingTop: 12,
      transform: [{ translateY: 12 }, { scale: 0.98 }],
    });
    expect(all(r, 'View')).toHaveLength(0);
  });

  it('.animation(motion) transitions transform and opacity with the token’s curve', () => {
    const r = mount(VStack().scale('dip').animation('slide'));
    expect(flat(all(r, 'Animated.View')[0]?.props.style)).toMatchObject({
      transitionProperty: ['transform', 'opacity'],
      transitionDuration: 200,
      transitionTimingFunction: { cubicBezier: [0.25, 0.1, 0.25, 1] },
    });
  });

  it('a gated animation plays only on a render where its value changed', () => {
    const chain = (value: number, s: 'full' | 'swell') => VStack().scale(s).animation('pop', value);
    const style = (r: ReactTestRenderer) => flat(all(r, 'Animated.View')[0]?.props.style);
    const r = mount(chain(1, 'full'));
    expect(style(r).transitionDuration).toBeUndefined();
    update(r, chain(2, 'swell'));
    expect(style(r).transitionDuration).toBe(300);
    // Same value, same transform: whatever is playing keeps playing.
    update(r, chain(2, 'swell'));
    expect(style(r).transitionDuration).toBe(300);
    // Same value, a new transform: it jumps.
    update(r, chain(2, 'full'));
    expect(style(r).transitionDuration).toBeUndefined();
  });

  it('reduced motion leaves no transition', () => {
    runtime.reducedMotion = true;
    const r = mount(VStack().scale('dip').animation('slide'));
    expect(flat(all(r, 'Animated.View')[0]?.props.style).transitionDuration).toBeUndefined();
  });
});

describe('.transition() in a keyed list', () => {
  const rise = asymmetric(
    move('top', 'xl').combined(opacity).animation('enter'),
    opacity.animation('exit'),
  );
  const list = (ids: string[]) =>
    VStack(ids.map((id) => Text(id).padding('sm').transition(rise).id(id)));

  it('a child arrives with its insertion keyframes, on the CSS engine', () => {
    const r = mount(list(['a']));
    const [box] = all(r, 'Animated.Text');
    expect(flat(box?.props.style)).toMatchObject({
      animationName: {
        keyframes: {
          '0%': { opacity: 0, transform: [{ translateY: -20 }] },
          '100%': { opacity: 1, transform: [{ translateY: 0 }] },
        },
      },
      animationDuration: 300,
      animationTimingFunction: { cubicBezier: [0.165, 0.84, 0.44, 1] },
      animationFillMode: 'none',
    });
  });

  it('a removed child stays, playing its removal, until it ends', () => {
    const r = mount(list(['a', 'b']));
    update(r, list(['b']));
    const texts = all(r, 'Animated.Text');
    expect(texts.map((text) => text.props.children)).toEqual(['a', 'b']);
    const leaving = texts[0] as ReactTestInstance;
    expect(flat(leaving.props.style)).toMatchObject({
      animationName: { keyframes: { '0%': { opacity: 1 }, '100%': { opacity: 0 } } },
      animationDuration: 180,
      animationFillMode: 'forwards',
    });
    act(() => leaving.props.onCSSAnimationEnd());
    expect(all(r, 'Animated.Text').map((text) => text.props.children)).toEqual(['b']);
  });

  it('a child that comes back while leaving is the arriving one again', () => {
    const r = mount(list(['a']));
    update(r, list([]));
    update(r, list(['a']));
    const [box] = all(r, 'Animated.Text');
    expect(flat(box?.props.style).animationFillMode).toBe('none');
  });

  it('without an .id(), a removal is not told from a reorder, so it just goes', () => {
    const plain = (ids: string[]) => VStack(ids.map((id) => Text(id).transition(rise)));
    const r = mount(plain(['a', 'b']));
    update(r, plain(['b']));
    expect(all(r, 'Animated.Text')).toHaveLength(1);
  });

  it('under reduced motion a removed child goes at once', () => {
    const r = mount(list(['a', 'b']));
    runtime.reducedMotion = true;
    update(r, list(['b']));
    expect(all(r, 'Animated.Text').map((text) => text.props.children)).toEqual(['b']);
  });

  it('a list with no transition is passed through untouched', () => {
    const r = mount(VStack(['a', 'b'].map((id) => Text(id).id(id))));
    expect(all(r, 'Text')).toHaveLength(2);
    expect(all(r, 'Animated.Text')).toHaveLength(0);
  });
});

describe('.keyframes()', () => {
  const pop = defineKeyframes(
    [
      { at: 0, scale: 1, easing: 'inOutQuad' },
      { at: 0.1, scale: 0.7 },
      { at: 0.4, scale: 1.2 },
      { at: 1, scale: 1 },
    ],
    'pop',
  );

  it('a bare glyph has no box at rest, and one only while the keyframes play', () => {
    const glyph = (trigger: number) => Icon(Glyph).keyframes(pop, trigger);
    const r = mount(glyph(0));
    expect(all(r, 'Animated.View')).toHaveLength(0);
    update(r, glyph(1));
    const [box] = all(r, 'Animated.View');
    expect(flat(box?.props.style)).toMatchObject({
      animationName: {
        keyframes: {
          '0%': {
            transform: [{ scale: 1 }],
            animationTimingFunction: { cubicBezier: [0.455, 0.03, 0.515, 0.955] },
          },
          '10%': { transform: [{ scale: 0.7 }] },
          '40%': { transform: [{ scale: 1.2 }] },
          '100%': { transform: [{ scale: 1 }] },
        },
      },
      animationDuration: 300,
      animationTimingFunction: { cubicBezier: [0.16, 1, 0.3, 1] },
    });
    act(() => box?.props.onCSSAnimationEnd());
    expect(all(r, 'Animated.View')).toHaveLength(0);
    expect(all(r, 'Glyph')).toHaveLength(1);
  });

  it('a falsy trigger never plays; reduced motion never plays', () => {
    const r = mount(Icon(Glyph).keyframes(pop, false));
    update(r, Icon(Glyph).keyframes(pop, 0));
    expect(all(r, 'Animated.View')).toHaveLength(0);
    runtime.reducedMotion = true;
    update(r, Icon(Glyph).keyframes(pop, true));
    expect(all(r, 'Animated.View')).toHaveLength(0);
  });
});

describe('.contentTransition("roll")', () => {
  const count = (n: number, press: number) =>
    Text(String(n)).font('sm').contentTransition('roll', n).animation('roll', press);

  it('a change inside the animation rolls the new text in and the old one out', () => {
    const r = mount(count(1, 0));
    expect(all(r, 'Text')).toHaveLength(1);
    update(r, count(2, 1));
    const [incoming, outgoing] = all(r, 'Animated.Text');
    expect(incoming?.props.children).toBe('2');
    expect(flat(incoming?.props.style)).toMatchObject({
      fontSize: 13,
      animationName: {
        keyframes: {
          '0%': { opacity: 0, transform: [{ translateY: 10 }] },
          '100%': { opacity: 1, transform: [{ translateY: 0 }] },
        },
      },
      animationDuration: 400,
      animationTimingFunction: { cubicBezier: [0.16, 1, 0.3, 1] },
    });
    expect(outgoing?.props.children).toBe('1');
    expect(outgoing?.props['aria-hidden']).toBe(true);
    expect(flat(outgoing?.props.style)).toMatchObject({
      position: 'absolute',
      animationName: { keyframes: { '100%': { opacity: 0, transform: [{ translateY: -10 }] } } },
      animationFillMode: 'forwards',
    });
    act(() => incoming?.props.onCSSAnimationEnd());
    expect(all(r, 'Animated.Text')).toHaveLength(0);
    expect(all(r, 'Text').map((text) => text.props.children)).toEqual(['2']);
  });

  it('a falling count rolls down', () => {
    const r = mount(count(5, 0));
    update(r, count(4, 1));
    const [incoming] = all(r, 'Animated.Text');
    expect(flat(incoming?.props.style).animationName.keyframes).toMatchObject({
      '0%': { transform: [{ translateY: -10 }] },
    });
  });

  it('a change outside the animation (a refetch) does not roll', () => {
    const r = mount(count(1, 1));
    update(r, count(2, 1));
    expect(all(r, 'Animated.Text')).toHaveLength(0);
    expect(all(r, 'Text').map((text) => text.props.children)).toEqual(['2']);
  });
});

describe('.matchedGeometry()', () => {
  const namespace: Namespace = { frames: new Map() };
  const strip = (selected: string) =>
    HStack(
      ['a', 'b'].map((id) =>
        ZStack(
          Text(id),
          id === selected
            ? VStack()
                .background('foreground')
                .testID(`line-${id}`)
                .matchedGeometry('line', namespace)
            : null,
        ).id(id),
      ),
    ).animation('slide', selected);

  it('the view that takes the id moves from where the last one was, with the scope’s motion', () => {
    frames['line-a'] = { x: 0, y: 40, width: 50, height: 2 };
    frames['line-b'] = { x: 50, y: 40, width: 100, height: 2 };
    const r = mount(strip('a'));
    expect(flat(all(r, 'Animated.View')[0]?.props.style).animationName).toBeUndefined();
    update(r, strip('b'));
    const [line] = all(r, 'Animated.View');
    expect(line?.props.testID).toBe('line-b');
    expect(flat(line?.props.style)).toMatchObject({
      transformOrigin: 'left top',
      animationName: {
        keyframes: {
          '0%': {
            transform: [{ translateX: -50 }, { translateY: 0 }, { scaleX: 0.5 }, { scaleY: 1 }],
          },
          '100%': {
            transform: [{ translateX: 0 }, { translateY: 0 }, { scaleX: 1 }, { scaleY: 1 }],
          },
        },
      },
      animationDuration: 200,
      animationTimingFunction: { cubicBezier: [0.25, 0.1, 0.25, 1] },
    });
  });

  it('a re-render that did not change the value does not move it', () => {
    namespace.frames.clear();
    frames['line-a'] = { x: 0, y: 40, width: 50, height: 2 };
    const r = mount(strip('a'));
    frames['line-a'] = { x: 10, y: 40, width: 60, height: 2 };
    update(r, strip('a'));
    expect(flat(all(r, 'Animated.View')[0]?.props.style).animationName).toBeUndefined();
  });
});

describe('.pressScale()', () => {
  it('a press retargets one shared value with the press motion', () => {
    const r = mount(
      HStack(Text('a'))
        .onPress(() => {})
        .pressScale(),
    );
    const [pressable] = all(r, 'Animated.Pressable');
    expect(flat(pressable?.props.style).transform).toEqual([{ scale: 1 }]);
    expect(typeof pressable?.props.onPressIn).toBe('function');
    expect(() => pressable?.props.onPressIn()).not.toThrow();
  });
});

describe('glass', () => {
  it('native glass fades its own box: the Surface moves in one box with the frames as they are', () => {
    const r = mount(
      VStack([Text('t').glass(regular).transition(opacity.animation('enter')).id('t')]),
    );
    const box = all(r, 'Animated.View')[0];
    expect(box?.findByType('Surface' as never)).toBeDefined();
    expect(flat(box?.props.style).animationName.keyframes).toMatchObject({ '0%': { opacity: 0 } });
  });
});

describe('Lottie()', () => {
  it('is Bloom’s Sticker, paused while its screen is not in front', () => {
    const node = Lottie('https://x/a.lottie')
      .fallback(Image('https://x/a.png', 'Wave'))
      .frame({ width: '5xl' })
      .loop();
    const r = mount(node);
    expect(all(r, 'Sticker')[0]?.props).toMatchObject({
      animation: 'https://x/a.lottie',
      fallback: 'https://x/a.png',
      accessibilityLabel: 'Wave',
      size: 60,
      loop: true,
      paused: false,
    });
    runtime.screenVisible = false;
    update(
      r,
      Lottie('https://x/a.lottie')
        .fallback(Image('https://x/a.png', 'Wave'))
        .frame({ width: '5xl' }),
    );
    expect(all(r, 'Sticker')[0]?.props.paused).toBe(true);
  });
});

describe('transition values', () => {
  it('scale and move halves run from away to rest and back', () => {
    const t = scale('dip').combined(move('bottom', 'sm'));
    expect(t.insert.frames.map((frame) => frame.transform)).toEqual([
      [{ translateY: 8 }, { scale: 0.7 }],
      [{ translateY: 0 }, { scale: 1 }],
    ]);
    expect(t.remove.frames[1]?.transform).toEqual([{ translateY: 8 }, { scale: 0.7 }]);
    expect(t.fades).toBe(false);
    expect(opacity.fades).toBe(true);
  });

  it('keyframes that stop at different points cannot be combined', () => {
    const a = defineKeyframes([
      { at: 0, opacity: 0 },
      { at: 1, opacity: 1 },
    ]);
    const b = defineKeyframes([
      { at: 0, scale: 0 },
      { at: 0.5, scale: 2 },
      { at: 1, scale: 1 },
    ]);
    expect(() => a.merged(b)).toThrow('same points');
  });
});
