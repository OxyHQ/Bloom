import { createElement, type ReactElement } from 'react';
import TestRenderer, {
  act,
  type ReactTestInstance,
  type ReactTestRenderer,
} from 'react-test-renderer';

import { DARK, LIGHT, PaintContext, withAlpha } from './support/bloom-theme';
import { windowTier } from './support/bloom-hooks';
import {
  Action,
  ActionBar,
  Avatar,
  Badge,
  Button,
  FAB,
  HStack,
  Icon,
  Text,
  VStack,
} from '../primitives';
import { both } from '../variants';
import { regular } from '../glass';
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

  it('a glass varies its padding on a view inside it, its fill as its own; an opacity is left out', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    windowTier.current = 'md';
    const r = mount(
      VStack(Text('a'))
        .padding('sm')
        .glass()
        .when('md', (v) => v.padding('lg').background('primary').opacity('half')),
    );
    const [surface] = ofType(r, 'Surface');
    // The fill is Surface's, painted from the role; never a fade of the material.
    expect(surface?.props.style).toBeUndefined();
    expect(surface?.props.fill).toBe(LIGHT.primary);
    const inside = surface?.findAll((i) => (i.type as unknown) === 'View')[0];
    expect(inside?.props.style).toMatchObject({ paddingTop: 16, paddingEnd: 16 });
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('a material is never faded'));
    warn.mockRestore();
  });

  it('a glass’s frame and border vary its style, its corner its radius, at rest and while held', () => {
    const glass = () =>
      HStack(Text('a'))
        .onPress(() => {})
        .glass()
        .corner('lg')
        .when('md', (v) => v.frame({ width: '4xl' }))
        .when('pressed', (v) => v.corner('xl').border('border', 'thin').background('primary/40'));
    const r = mount(glass());
    const surface = (): ReactTestInstance => ofType(r, 'Surface')[0] as ReactTestInstance;
    expect(surface().props).toMatchObject({ radius: 16 });
    expect(surface().props.style).toBeUndefined();
    expect(surface().props.fill).toBeUndefined();
    // The box around the glass tracks the press the material's variants answer.
    const host = ofType(r, 'Pressable')[0] as ReactTestInstance;
    act(() => host.props.onPressIn());
    expect(surface().props).toMatchObject({
      radius: 20,
      style: { borderWidth: 1, borderColor: LIGHT.border },
    });
    expect(surface().props.fill).toBe(withAlpha(LIGHT.primary as string, 0.4));
    act(() => host.props.onPressOut());
    windowTier.current = 'md';
    remount(r, glass());
    expect(surface().props).toMatchObject({ radius: 16, style: { width: 40 } });
    expect(surface().props.fill).toBeUndefined();
  });

  it('an island’s frame, border and fill vary its style, its corner its radius, while held', () => {
    const r = mount(
      HStack(Text('a'))
        .onPress(() => {})
        .blur()
        .corner('lg')
        .when('pressed', (v) => v.corner('xl').border('border', 'thin').background('primary')),
    );
    const island = (): ReactTestInstance => ofType(r, 'BlurIsland')[0] as ReactTestInstance;
    expect(island().props).toMatchObject({ radius: 16 });
    const host = ofType(r, 'Pressable')[0] as ReactTestInstance;
    act(() => host.props.onPressIn());
    expect(island().props).toMatchObject({
      radius: 20,
      style: { borderWidth: 1, borderColor: LIGHT.border, backgroundColor: LIGHT.primary },
    });
    act(() => host.props.onPressOut());
    expect(island().props.radius).toBe(16);
    expect(island().props.style ?? {}).not.toHaveProperty('backgroundColor');
  });

  it('a concentric box’s frame, border and fill vary its style; its corner stays concentric', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    windowTier.current = 'md';
    const r = mount(
      VStack(Text('a'))
        .frame({ width: '3xl' })
        .background('surface')
        .corner('concentric')
        .when('md', (v) => v.frame({ width: '4xl' }).background('primary').corner('xl')),
    );
    const view = ofType(r, 'ConcentricView')[0] as ReactTestInstance;
    expect(view.props).toMatchObject({
      radius: 'concentric',
      style: { width: 40, backgroundColor: LIGHT.primary },
    });
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('a concentric box’s own radius'));
    warn.mockRestore();
  });

  it('a tinted glass’s fill is its tint at rest, and a variant’s while it holds', () => {
    const r = mount(
      VStack()
        .glass(regular.tint('primary'))
        .when('dark', (v) => v.background('error')),
    );
    expect(ofType(r, 'Surface')[0]?.props.fill).toBe(LIGHT.primary);
    remount(
      r,
      VStack()
        .glass(regular.tint('primary'))
        .when('dark', (v) => v.background('error')),
      DARK,
    );
    expect(ofType(r, 'Surface')[0]?.props.fill).toBe(DARK.error);
  });
});

describe('a Button’s or FAB’s glass varies with the control’s own state', () => {
  it.each(['button', 'fab'] as const)(
    'a %s reports its press and hover to the glass around it',
    (kind) => {
      const onPress = jest.fn();
      const r = mount(
        kind === 'button'
          ? Button(Text('Go'))
              .onPress(onPress)
              .glass()
              .when('pressed', (v) => v.background('error'))
              .when('hovered', (v) => v.background('muted'))
          : FAB(Icon(Glyph))
              .onPress(onPress)
              .glass()
              .when('pressed', (v) => v.background('error'))
              .when('hovered', (v) => v.background('muted')),
      );
      const host = kind === 'button' ? 'BloomButton' : 'BloomFab';
      const pressable = (): ReactTestInstance => ofType(r, host)[0] as ReactTestInstance;
      const fill = () => ofType(r, 'Surface')[0]?.props.fill;
      const rest = fill();
      act(() => pressable().props.onHoverIn());
      expect(fill()).toBe(LIGHT.textSecondary);
      act(() => pressable().props.onPressIn());
      // A press after a hover: the later variant holds.
      expect(fill()).toBe(LIGHT.error);
      act(() => pressable().props.onPressOut());
      act(() => pressable().props.onHoverOut());
      expect(fill()).toBe(rest);
      // The control keeps its own press.
      pressable().props.onPress();
      expect(onPress).toHaveBeenCalled();
    },
  );
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

describe('an action answers its own press, hover and focus', () => {
  it('its pressable hands the states to its box, and the variant is in the action’s own style', () => {
    const r = mount(
      ActionBar(
        Action(Glyph, 'Like')
          .onPress(() => {})
          .padding('xs')
          .when('pressed', (v) => v.opacity('70')),
      ),
    );
    const action = (): ReactTestInstance => ofType(r, 'EngagementAction')[0] as ReactTestInstance;
    expect(action().props.style).toEqual({
      paddingTop: 4,
      paddingBottom: 4,
      paddingStart: 4,
      paddingEnd: 4,
    });
    act(() => action().props.onPressIn());
    expect(action().props.style).toMatchObject({ paddingTop: 4, opacity: 0.7 });
    act(() => action().props.onPressOut());
    expect(action().props.style).not.toHaveProperty('opacity');
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
