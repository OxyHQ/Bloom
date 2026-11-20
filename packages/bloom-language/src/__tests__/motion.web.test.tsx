import { createElement, type ReactElement } from 'react';
import TestRenderer, {
  act,
  type ReactTestInstance,
  type ReactTestRenderer,
} from 'react-test-renderer';

import { LIGHT, PaintContext } from './support/bloom-theme';
import { HStack, Text, VStack } from '../primitives';
import { toElement } from '../render';
import { asymmetric, move, opacity } from '../motion/transition';
import { regular } from '../glass';
import { PRESS_SCALE_CLASS, WEB_SHEET } from '../generated/web-sheet.generated';
import type { Child } from '../node';

jest.mock('react-native', () => ({
  ...jest.requireActual('react-native'),
  Platform: { OS: 'web', select: <T,>(spec: { web?: T; default?: T }) => spec.web ?? spec.default },
}));
jest.mock('../motion/host', () => jest.requireActual('../motion/host.web'));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const consoleError = console.error;
beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
    if (String(args[0]).includes('react-test-renderer is deprecated')) return;
    consoleError(...args);
  });
});

/** A DOM element as far as the Web Animations API goes: every `animate()` call is recorded. */
interface FakeAnimation {
  target: string;
  frames: unknown;
  options: Record<string, unknown>;
  onfinish: (() => void) | null;
  cancel: () => void;
}
const played: FakeAnimation[] = [];
function element(name: string, children: unknown[] = [], glass?: unknown) {
  return {
    children,
    querySelector: (selector: string) => (selector === '.bloom-surface' ? (glass ?? null) : null),
    animate(frames: unknown, options: Record<string, unknown>) {
      const target = options.pseudoElement ? `${name}${String(options.pseudoElement)}` : name;
      const animation: FakeAnimation = {
        target,
        frames,
        options,
        onfinish: null,
        cancel: () => {},
      };
      played.push(animation);
      return animation;
    },
  };
}
const content = element('content');
const surface = element('surface', [content]);
/** Hosts by testID; the box a glass Surface moves in has none, and holds the Surface. */
function createNodeMock(node: ReactElement) {
  const { testID } = node.props as { testID?: string };
  return element(testID ?? 'box', [], testID === undefined ? surface : undefined);
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

beforeEach(() => {
  played.length = 0;
});

describe('on the web, motion is CSS and the Web Animations API', () => {
  const rise = asymmetric(
    move('top', 'xl').combined(opacity).animation('enter'),
    opacity.animation('exit'),
  );

  it('a transition’s insertion is element.animate() before the first paint, with no Reanimated host', () => {
    mount(VStack([Text('a').testID('a').transition(rise).id('a')]));
    expect(played).toEqual([
      expect.objectContaining({
        target: 'a',
        frames: [
          { offset: 0, opacity: 0, transform: 'translateY(-20px)' },
          { offset: 1, opacity: 1, transform: 'translateY(0px)' },
        ],
        options: { duration: 300, easing: 'cubic-bezier(0.165,0.84,0.44,1)', fill: 'none' },
      }),
    ]);
  });

  it('the removal holds its last frame, and the list drops the child when it finishes', () => {
    const list = (ids: string[]) =>
      VStack(ids.map((id) => Text(id).testID(id).transition(rise).id(id)));
    const r = mount(list(['a', 'b']));
    played.length = 0;
    update(r, list(['b']));
    const removal = played.find((animation) => animation.target === 'a');
    expect(removal?.options).toEqual({
      duration: 180,
      easing: 'cubic-bezier(0,0,1,1)',
      fill: 'forwards',
    });
    expect(all(r, 'Text')).toHaveLength(2);
    act(() => removal?.onfinish?.());
    expect(all(r, 'Text').map((text) => text.props.children)).toEqual(['b']);
  });

  it('glass never fades its box: the material’s layers and the content on it fade instead', () => {
    mount(VStack([VStack(Text('t')).glass(regular).transition(rise).id('t')]));
    const targets = played.map((animation) => animation.target);
    expect(targets).toEqual(['box', 'surface::before', 'surface::after', 'content']);
    const [box, before, , piece] = played;
    expect(box?.frames).toEqual([
      { offset: 0, transform: 'translateY(-20px)' },
      { offset: 1, transform: 'translateY(0px)' },
    ]);
    expect(before?.frames).toEqual([
      { offset: 0, opacity: 0 },
      { offset: 1, opacity: 1 },
    ]);
    expect(piece?.frames).toEqual(before?.frames);
    expect(before?.options).toMatchObject({ duration: 300, pseudoElement: '::before' });
  });

  it('.animation() is an inline CSS transition on the host', () => {
    const r = mount(VStack().scale('dip').animation('slide'));
    expect(flat(all(r, 'View')[0]?.props.style)).toMatchObject({
      transform: [{ scale: 0.7 }],
      transitionProperty: 'transform, opacity',
      transitionDuration: '200ms',
      transitionTimingFunction: 'cubic-bezier(0.25,0.1,0.25,1)',
    });
  });

  it('press feedback is the generated class: a touch press, never a mouse or reduced motion', () => {
    const r = mount(
      HStack(Text('a'))
        .onPress(() => {})
        .pressScale(),
    );
    const [host] = all(r, 'Pressable');
    expect(flat(host?.props.style)).toMatchObject({ $$css: true, pressScale: PRESS_SCALE_CLASS });
    expect(host?.props.onPressIn).toBeUndefined();
    expect(WEB_SHEET).toContain(
      `@media (pointer: coarse) and (prefers-reduced-motion: no-preference){.${PRESS_SCALE_CLASS}{transition:scale 100ms cubic-bezier(0.455,0.03,0.515,0.955);}.${PRESS_SCALE_CLASS}:active{scale:0.98;}}`,
    );
  });
});
