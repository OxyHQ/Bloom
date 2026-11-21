import { createElement, type ReactElement } from 'react';
import TestRenderer, {
  act,
  type ReactTestInstance,
  type ReactTestRenderer,
} from 'react-test-renderer';

import { DARK, LIGHT, PaintContext } from './support/bloom-theme';
import { windowTier } from './support/bloom-hooks';
import { Avatar, Badge, HStack, Icon, Text, VStack } from '../primitives';
import { both } from '../variants';
import { toElement } from '../render';
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
  windowTier.current = 'base';
});

function mount(node: Child, colors = LIGHT): ReactTestRenderer {
  let renderer!: ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(
      createElement(PaintContext.Provider, { value: colors }, toElement(node)),
    );
  });
  return renderer;
}

function remount(renderer: ReactTestRenderer, node: Child, colors = LIGHT): void {
  act(() =>
    renderer.update(createElement(PaintContext.Provider, { value: colors }, toElement(node))),
  );
}

const Glyph = (props: { width?: number; height?: number; fill?: string }) =>
  createElement('Glyph', props);

const ofType = (renderer: ReactTestRenderer, type: string): ReactTestInstance[] =>
  renderer.root.findAll((instance) => (instance.type as unknown) === type);

describe('when(): a variant overrides what the chain set before it', () => {
  it('a breakpoint variant holds from its tier up, read from the window', () => {
    const node = VStack(Text('a'))
      .padding('sm')
      .when('md', (v) => v.padding('lg'));
    const r = mount(node);
    expect(ofType(r, 'View')[0]?.props.style).toMatchObject({ paddingTop: 8, paddingEnd: 8 });
    windowTier.current = 'lg';
    remount(
      r,
      VStack(Text('a'))
        .padding('sm')
        .when('md', (v) => v.padding('lg')),
    );
    expect(ofType(r, 'View')[0]?.props.style).toMatchObject({ paddingTop: 16, paddingEnd: 16 });
  });

  it('the dark scheme’s variant is read from the theme', () => {
    const node = VStack(Text('a'))
      .background('surface')
      .when('dark', (v) => v.background('popover'));
    expect(ofType(mount(node), 'View')[0]?.props.style).toEqual({
      backgroundColor: LIGHT.backgroundSecondary,
    });
    expect(ofType(mount(node, DARK), 'View')[0]?.props.style).toEqual({
      backgroundColor: DARK.backgroundTertiary,
    });
  });

  it('a state variant answers the view’s own press host; text traits reach the text inside', () => {
    const r = mount(
      HStack(Text('Open'))
        .onPress(() => {})
        .opacity('opaque')
        .when('pressed', (v) => v.opacity('70'))
        .when('hovered', (v) => v.foreground('primary')),
    );
    const press = (): ReactTestInstance => ofType(r, 'Pressable')[0] as ReactTestInstance;
    const text = (): ReactTestInstance => ofType(r, 'Text')[0] as ReactTestInstance;
    expect(press().props.style).toEqual({ flexDirection: 'row', opacity: 1 });
    act(() => press().props.onPressIn());
    expect(press().props.style).toEqual({ flexDirection: 'row', opacity: 0.7 });
    act(() => press().props.onPressOut());
    expect(press().props.style).toEqual({ flexDirection: 'row', opacity: 1 });
    expect(text().props.style).toBeUndefined();
    act(() => press().props.onHoverIn());
    expect(text().props.style).toEqual({ color: LIGHT.primary });
  });

  it('a pressable inside a pressable answers its own press, never the outer one’s', () => {
    const r = mount(
      HStack(
        Text('a'),
        HStack(Text('b'))
          .onPress(() => {})
          .when('pressed', (v) => v.opacity('half')),
      )
        .onPress(() => {})
        .when('pressed', (v) => v.opacity('70')),
    );
    const [outer, inner] = [0, 1].map(
      (index) => (): ReactTestInstance => ofType(r, 'Pressable')[index] as ReactTestInstance,
    ) as [() => ReactTestInstance, () => ReactTestInstance];
    act(() => outer().props.onPressIn());
    expect(outer().props.style).toEqual({ flexDirection: 'row', opacity: 0.7 });
    expect(inner().props.style).toEqual({ flexDirection: 'row' });
    act(() => outer().props.onPressOut());
    act(() => inner().props.onPressIn());
    expect(inner().props.style).toEqual({ flexDirection: 'row', opacity: 0.5 });
    expect(outer().props.style).toEqual({ flexDirection: 'row' });
  });

  it('a platform and the view’s own disabled() are settled when it renders', () => {
    const [stack] = ofType(
      mount(
        VStack(Text('a'))
          .when('ios', (v) => v.padding('lg'))
          .when('web', (v) => v.padding('xs')),
      ),
      'View',
    );
    expect(stack?.props.style).toMatchObject({ paddingTop: 16 });
    const r = mount(
      HStack(Text('a'))
        .onPress(() => {})
        .disabled()
        .when('disabled', (v) => v.opacity('half')),
    );
    const [press] = ofType(r, 'Pressable');
    expect(press?.props).toMatchObject({ disabled: true, style: { opacity: 0.5 } });
  });

  it('a stack’s layout varies on its host; a place on its outermost box', () => {
    windowTier.current = 'md';
    const [row] = ofType(
      mount(
        HStack(Text('a'))
          .axis('vertical')
          .hidden()
          .when('md', (v) => v.axis('horizontal').hidden(false)),
      ),
      'View',
    );
    expect(row?.props.style).toEqual({ flexDirection: 'row', display: 'flex' });
  });

  it('a varied Bloom component takes the variant in its own style, with no view around it', () => {
    const r = mount(Avatar('a.png').when('sm', (v) => v.padding('xs')));
    const avatar = (): ReactTestInstance => ofType(r, 'BloomAvatar')[0] as ReactTestInstance;
    expect(ofType(r, 'View')).toHaveLength(0);
    expect(avatar().props.style).toBeUndefined();
    windowTier.current = 'sm';
    remount(
      r,
      Avatar('a.png').when('sm', (v) => v.padding('xs')),
    );
    expect(avatar().props.style).toEqual({
      paddingTop: 4,
      paddingBottom: 4,
      paddingStart: 4,
      paddingEnd: 4,
    });
  });

  it('a modifier a variant cannot change is left out, said once in development', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const [stack] = ofType(
      mount(VStack(Text('a')).when('md', (v) => v.label('Nope').padding('xs'))),
      'View',
    );
    expect(stack?.props.accessibilityLabel).toBeUndefined();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('.label() inside when()'));
    warn.mockRestore();
  });

  it('a variant inside a variant holds while both do: a breakpoint and a state', () => {
    expect(both('hovered', 'md')).toBe('md+hovered');
    expect(both(null, 'dark')).toBe('dark');
    const node = () =>
      HStack(Text('a'))
        .onPress(() => {})
        .padding('sm')
        .when('md', (v) => v.when('pressed', (p) => p.padding('lg')));
    const r = mount(node());
    const press = (): ReactTestInstance => ofType(r, 'Pressable')[0] as ReactTestInstance;
    act(() => press().props.onPressIn());
    expect(press().props.style).toMatchObject({ paddingTop: 8 });
    windowTier.current = 'md';
    remount(r, node());
    expect(press().props.style).toMatchObject({ paddingTop: 16 });
    act(() => press().props.onPressOut());
    expect(press().props.style).toMatchObject({ paddingTop: 8 });
  });

  it('an icon’s ink varies with the foreground: its fill is painted from the environment', () => {
    const r = mount(
      HStack(Icon(Glyph))
        .onPress(() => {})
        .foreground('muted')
        .when('hovered', (v) => v.foreground('primary')),
    );
    const glyph = (): ReactTestInstance => ofType(r, 'Glyph')[0] as ReactTestInstance;
    expect(glyph().props.fill).toBe(LIGHT.textSecondary);
    expect(glyph().props.style).toBeUndefined();
    act(() => (ofType(r, 'Pressable')[0] as ReactTestInstance).props.onHoverIn());
    expect(glyph().props.fill).toBe(LIGHT.primary);
  });

  it('a glass varies its padding on a view inside it; its other variants are left out', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    windowTier.current = 'md';
    const r = mount(
      VStack(Text('a'))
        .padding('sm')
        .glass()
        .when('md', (v) => v.padding('lg').background('primary')),
    );
    const [surface] = ofType(r, 'Surface');
    expect(surface?.props.style).toBeUndefined();
    const inside = surface?.findAll((i) => (i.type as unknown) === 'View')[0];
    expect(inside?.props.style).toMatchObject({ paddingTop: 16, paddingEnd: 16 });
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('varies only its padding'));
    warn.mockRestore();
  });
});

describe('a Bloom component with no press of its own takes it on a host around it', () => {
  it('a pressable Badge: the press and its state on the host, the variant in the badge’s own style', () => {
    const onPress = jest.fn();
    const r = mount(
      Badge(3)
        .onPress(onPress)
        .when('pressed', (v) => v.opacity('70')),
    );
    const host = r.root.find((node) => (node.type as unknown) === 'Pressable');
    const badge = (): ReactTestInstance =>
      r.root.find((node) => (node.type as unknown) === 'Badge');
    expect(host.props.onPress).toBe(onPress);
    expect(badge().props.onPress).toBeUndefined();
    act(() => host.props.onPressIn());
    expect(badge().props.style).toEqual({ opacity: 0.7 });
    act(() => host.props.onPressOut());
    expect(badge().props.style).toBeUndefined();
  });

  it('a Badge that is no control keeps its props, with no host around it', () => {
    const r = mount(Badge(3).testID('b'));
    expect(r.root.findAll((node) => (node.type as unknown) === 'Pressable')).toHaveLength(0);
    expect(r.root.find((node) => (node.type as unknown) === 'Badge').props.testID).toBe('b');
  });
});

describe('when(): geometry varies by component', () => {
  const flat = (style: unknown): Record<string, unknown> =>
    Object.assign({}, ...(Array.isArray(style) ? style.flat(4) : [style]).filter(Boolean));

  it('a pressed scale is the box’s transform while it is pressed; at rest it is the identity', () => {
    const r = mount(
      HStack(Text('a'))
        .onPress(() => {})
        .when('pressed', (v) => v.scale('95')),
    );
    const press = (): ReactTestInstance => ofType(r, 'Pressable')[0] as ReactTestInstance;
    expect(press().props.style).toEqual({ flexDirection: 'row', transform: [{ scale: 1 }] });
    act(() => press().props.onPressIn());
    expect(press().props.style).toEqual({ flexDirection: 'row', transform: [{ scale: 0.95 }] });
    act(() => press().props.onPressOut());
    expect(press().props.style).toEqual({ flexDirection: 'row', transform: [{ scale: 1 }] });
    // Another scale is another style: a variant's style is cached by its token.
    const other = mount(
      HStack(Text('a'))
        .onPress(() => {})
        .when('pressed', (v) => v.scale('105')),
    );
    const host = ofType(other, 'Pressable')[0] as ReactTestInstance;
    act(() => host.props.onPressIn());
    expect((ofType(other, 'Pressable')[0] as ReactTestInstance).props.style.transform).toEqual([
      { scale: 1.05 },
    ]);
  });

  it('each variant sets only its components: a breakpoint’s offset and a hover’s scale compose', () => {
    const node = () =>
      HStack(Text('a'))
        .onPress(() => {})
        .offset({ x: 'xs', y: 'xs' })
        .when('md', (v) => v.offset({ y: 'sm' }))
        .when('hovered', (v) => v.scale('105').rotation('45'));
    const r = mount(node());
    const press = (): ReactTestInstance => ofType(r, 'Pressable')[0] as ReactTestInstance;
    expect(press().props.style.transform).toEqual([
      { translateX: 4 },
      { translateY: 4 },
      { rotate: '0deg' },
      { scale: 1 },
    ]);
    windowTier.current = 'lg';
    remount(r, node());
    act(() => press().props.onHoverIn());
    expect(press().props.style.transform).toEqual([
      { translateX: 4 },
      { translateY: 8 },
      { rotate: '45deg' },
      { scale: 1.05 },
    ]);
  });

  it('under .animation() the box is the animated twin, and the variant’s change transitions on it', () => {
    const r = mount(
      HStack(Text('a'))
        .onPress(() => {})
        .when('pressed', (v) => v.scale('95'))
        .animation('press'),
    );
    const [press] = ofType(r, 'Animated.Pressable');
    expect(ofType(r, 'Animated.View')).toHaveLength(0);
    expect(flat(press?.props.style)).toMatchObject({
      transform: [{ scale: 1 }],
      transitionDuration: 100,
    });
    act(() => press?.props.onPressIn());
    expect(flat(ofType(r, 'Animated.Pressable')[0]?.props.style)).toMatchObject({
      transform: [{ scale: 0.95 }],
      transitionDuration: 100,
    });
  });

  it('geometry a MotionValue or press feedback moves takes no variant', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const r = mount(
      HStack(Text('a'))
        .onPress(() => {})
        .pressScale()
        .when('pressed', (v) => v.scale('95')),
    );
    expect(flat(ofType(r, 'Animated.Pressable')[0]?.props.style).transform).toEqual([{ scale: 1 }]);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('does not vary'));
    warn.mockRestore();
  });
});
