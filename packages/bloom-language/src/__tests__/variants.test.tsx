import { createElement, type ReactElement } from 'react';
import TestRenderer, {
  act,
  type ReactTestInstance,
  type ReactTestRenderer,
} from 'react-test-renderer';

import { DARK, LIGHT, PaintContext } from './support/bloom-theme';
import { windowTier } from './support/bloom-hooks';
import { Avatar, HStack, Text, VStack } from '../primitives';
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
});
