import { createElement, useState, type ReactElement } from 'react';
import TestRenderer, {
  act,
  type ReactTestInstance,
  type ReactTestRenderer,
} from 'react-test-renderer';

import { tokens } from '@oxy.so/bloom/styles';
import { TYPE_SCALE } from '@oxy.so/bloom/typography';
import { DARK, LIGHT, PaintContext } from './support/bloom-theme';
import {
  Action,
  ActionBar,
  Avatar,
  Button,
  Embed,
  HStack,
  Icon,
  Spacer,
  Text,
  VStack,
} from '../primitives';
import { toElement } from '../render';
import { view } from '../view';
import { defineTokens } from '../tokens';
import type { Child } from '../node';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// The test renderer's own deprecation notice, once per mount; nothing else is silenced.
const consoleError = console.error;
beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
    if (String(args[0]).includes('react-test-renderer is deprecated')) return;
    consoleError(...args);
  });
});

const Glyph = (props: { width?: number; height?: number; fill?: string }) =>
  createElement('Glyph', props);

function mount(element: ReactElement, colors = LIGHT): ReactTestRenderer {
  let renderer!: ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(
      createElement(PaintContext.Provider, { value: colors }, element),
    );
  });
  return renderer;
}

function update(renderer: ReactTestRenderer, element: ReactElement, colors = LIGHT): void {
  act(() => renderer.update(createElement(PaintContext.Provider, { value: colors }, element)));
}

function hosts(renderer: ReactTestRenderer, type: string): ReactTestInstance[] {
  return renderer.root.findAll((instance) => instance.type === type);
}

describe('rendering through React Native hosts', () => {
  it('a stack is one View with its spacing, alignment and box', () => {
    const r = mount(
      toElement(
        HStack(Text('a'), Text('b')).spacing('sm').align('end').padding('horizontal', 'md'),
      ),
    );
    const [stack] = hosts(r, 'View');
    expect(stack?.props.style).toEqual({
      flexDirection: 'row',
      gap: tokens.space.sm,
      alignItems: 'flex-end',
      paddingStart: tokens.space.md,
      paddingEnd: tokens.space.md,
    });
  });

  it('text resolves its type and colour from tokens and the theme', () => {
    const r = mount(
      toElement(Text('hi').font('headline').weight('semibold').foreground('muted').lines(1)),
    );
    const [text] = hosts(r, 'Text');
    const step = TYPE_SCALE['headline-semibold'];
    expect(text?.props.style).toEqual({
      fontSize: step.fontSize,
      lineHeight: step.lineHeight,
      letterSpacing: step.letterSpacing,
      fontWeight: step.fontWeight,
      color: LIGHT.textSecondary,
    });
    expect(text?.props.numberOfLines).toBe(1);
    expect(text?.props.children).toBe('hi');
  });

  it('foreground and font flow down to text and icons inside, as an environment', () => {
    const r = mount(
      toElement(HStack(Icon(Glyph).size('sm'), Text('x')).foreground('muted').font('sm')),
    );
    expect(hosts(r, 'Glyph')[0]?.props).toEqual({
      width: 16,
      height: 16,
      fill: LIGHT.textSecondary,
    });
    expect(hosts(r, 'Text')[0]?.props.style).toEqual({ fontSize: 13, color: LIGHT.textSecondary });
  });

  it('modifier order decides nesting: background then padding wraps', () => {
    const r = mount(toElement(Text('x').background('surface').padding('md')));
    const [outer] = hosts(r, 'View');
    expect(outer?.props.style).toEqual({
      paddingTop: 12,
      paddingBottom: 12,
      paddingStart: 12,
      paddingEnd: 12,
    });
    expect(hosts(r, 'Text')[0]?.props.style.backgroundColor).toBe(LIGHT.backgroundSecondary);
  });

  it('grow and shrink place the view in its parent without changing its minimum', () => {
    const r = mount(
      toElement(HStack(Text('a').shrink('first').frame({ minWidth: 'none' }), VStack().grow())),
    );
    expect(hosts(r, 'Text')[0]?.props.style).toEqual({
      color: LIGHT.text,
      minWidth: 0,
      flexShrink: 10,
    });
    expect(hosts(r, 'View')[1]?.props.style).toEqual({ flex: 1 });
  });

  it('negative padding is a margin', () => {
    const r = mount(toElement(HStack().padding('leading', '-lg')));
    expect(hosts(r, 'View')[0]?.props.style).toEqual({ flexDirection: 'row', marginStart: -16 });
  });

  it('false, null and nested arrays render by position', () => {
    const tree = (show: boolean): Child =>
      VStack(
        Text('first'),
        show && Text('maybe'),
        ['a', 'b'].map((item) => Text(item).id(item)),
      );
    const r = mount(toElement(tree(false)));
    expect(hosts(r, 'Text').map((t) => t.props.children)).toEqual(['first', 'a', 'b']);
    update(r, toElement(tree(true)));
    expect(hosts(r, 'Text').map((t) => t.props.children)).toEqual(['first', 'maybe', 'a', 'b']);
  });

  it('inline spans are nested Text', () => {
    const r = mount(toElement(Text('Reposted by ', Text('Ana').weight('semibold')).font('sm')));
    const [outer, inner] = hosts(r, 'Text');
    expect(outer?.props.children[0]).toBe('Reposted by ');
    expect(inner?.props.style).toEqual({ fontSize: 13, fontWeight: '600', color: LIGHT.text });
  });

  it('an onPress modifier makes the host pressable even with no handler, out of the focus order', () => {
    const handler = jest.fn();
    const r = mount(toElement(VStack(Text('a')).onPress(handler).label('Post')));
    const [pressable] = hosts(r, 'Pressable');
    expect(pressable?.props.focusable).toBe(true);
    expect(pressable?.props.accessibilityLabel).toBe('Post');
    act(() => pressable?.props.onPress());
    expect(handler).toHaveBeenCalledTimes(1);
    update(r, toElement(VStack(Text('a')).onPress(undefined).label('Post')));
    const [inert] = hosts(r, 'Pressable');
    // Same element type: the row did not remount into a View.
    expect(inert).toBe(pressable);
    expect(inert?.props.focusable).toBe(false);
  });
});

describe('styles are resolved once per theme', () => {
  it('re-rendering the same tree hands React Native the same style objects', () => {
    const tree = () =>
      HStack(Text('a').foreground('muted').font('md'), Spacer()).spacing('sm').padding('md');
    const r = mount(toElement(tree()));
    const before = hosts(r, 'View').map((v) => v.props.style);
    const textBefore = hosts(r, 'Text')[0]?.props.style;
    update(r, toElement(tree()));
    expect(hosts(r, 'View').map((v) => v.props.style)).toEqual(before);
    hosts(r, 'View').forEach((v, i) => {
      expect(v.props.style).toBe(before[i]);
    });
    expect(hosts(r, 'Text')[0]?.props.style).toBe(textBefore);
    expect(Object.isFrozen(textBefore)).toBe(true);
  });

  it('a theme change resolves new colours', () => {
    const r = mount(toElement(Text('a').foreground('muted')), LIGHT);
    expect(hosts(r, 'Text')[0]?.props.style.color).toBe(LIGHT.textSecondary);
    update(r, toElement(Text('a').foreground('muted')), DARK);
    expect(hosts(r, 'Text')[0]?.props.style.color).toBe(DARK.textSecondary);
  });

  it('app tokens resolve to their declared values', () => {
    const t = defineTokens({ space: { gutter: 64 }, leading: { tight: 1.25 } });
    const r = mount(
      toElement(Text('a').font('md').leading(t.leading.tight).padding('leading', t.space.gutter)),
    );
    expect(hosts(r, 'Text')[0]?.props.style).toEqual({
      fontSize: 15,
      lineHeight: 18.75,
      color: LIGHT.text,
      paddingStart: 64,
    });
  });
});

let press: () => void = () => {};
const Counter = view(function Counter(label: string) {
  const [count, setCount] = useState(0);
  press = () => setCount((n) => n + 1);
  return Text(`${label} ${count}`);
});
const titleBody = jest.fn((title: string) => Text(title));
const Title = view(titleBody);
const cardBody = jest.fn((props: { title: string }) => Text(props.title));
const Card = view(cardBody);
const Label = view(function Label(text: string) {
  return Text(text);
});

describe('view()', () => {
  it('runs its body as a component: hooks work and state survives re-renders', () => {
    const r = mount(toElement(Counter('taps')));
    expect(hosts(r, 'Text')[0]?.props.children).toBe('taps 0');
    act(() => press());
    expect(hosts(r, 'Text')[0]?.props.children).toBe('taps 1');
    expect(
      r.root.findAll((i) => (i.type as { displayName?: string }).displayName === 'Counter'),
    ).not.toHaveLength(0);
  });

  it('re-runs only when an argument changes', () => {
    const tree = (title: string) => VStack(Title(title), Text('sibling'));
    const r = mount(toElement(tree('a')));
    update(r, toElement(tree('a')));
    expect(titleBody).toHaveBeenCalledTimes(1);
    update(r, toElement(tree('b')));
    expect(titleBody).toHaveBeenCalledTimes(2);
  });

  it('a props-object argument compares key by key', () => {
    const tree = (props: { title: string }) => VStack(Card(props));
    const r = mount(toElement(tree({ title: 'a' })));
    update(r, toElement(tree({ title: 'a' })));
    expect(cardBody).toHaveBeenCalledTimes(1);
    update(r, toElement(tree({ title: 'b' })));
    expect(cardBody).toHaveBeenCalledTimes(2);
  });

  it('a child that turns false keeps its slot, so later siblings keep their state', () => {
    const tree = (show: boolean) => VStack(show && Text('banner'), Counter('kept'));
    const r = mount(toElement(tree(false)));
    act(() => press());
    expect(hosts(r, 'Text').map((t) => t.props.children)).toEqual(['kept 1']);
    update(r, toElement(tree(true)));
    expect(hosts(r, 'Text').map((t) => t.props.children)).toEqual(['banner', 'kept 1']);
  });

  it('inherits the environment of where it is placed', () => {
    const r = mount(toElement(VStack(Label('x')).foreground('muted')));
    expect(hosts(r, 'Text')[0]?.props.style.color).toBe(LIGHT.textSecondary);
  });

  it('a view’s modifiers wrap its body', () => {
    const r = mount(toElement(VStack(Label('x').padding('md'))));
    const views = hosts(r, 'View');
    expect(views[1]?.props.style).toEqual({
      paddingTop: 12,
      paddingBottom: 12,
      paddingStart: 12,
      paddingEnd: 12,
    });
  });
});

const Wrapper = ({ children }: { children?: unknown }) =>
  createElement('Wrapper', null, children as never);

describe('interop', () => {
  it('embeds a React element, and renders language nodes inside it in the current environment', () => {
    const r = mount(
      toElement(
        VStack(
          Embed(createElement('ThirdParty', { value: 1 })),
          Embed((render) => createElement(Wrapper, null, render(Text('inside')))),
        ).foreground('muted'),
      ),
    );
    expect(hosts(r, 'ThirdParty')).toHaveLength(1);
    const wrapped = hosts(r, 'Wrapper')[0]?.findByType('Text' as never);
    expect(wrapped?.props.style.color).toBe(LIGHT.textSecondary);
  });

  it('a bare embed, icon or view adds no host of its own', () => {
    const r = mount(
      toElement(VStack(Embed(createElement('ThirdParty')), Icon(Glyph), Label('x'), Text('y'))),
    );
    expect(hosts(r, 'View')).toHaveLength(1);
    expect(hosts(r, 'ThirdParty')[0]?.parent?.type).toBe('View');
  });

  it('draws Bloom components with their own props from the chain', () => {
    const onLike = jest.fn();
    const r = mount(
      toElement(
        VStack(
          Avatar('file-id', { variant: 'thumb' }).size('lg'),
          Button(Icon(Glyph), Text('Compose')).style('plain').tint('neutral'),
          ActionBar(
            Action(Glyph, 'Like').count(3).active(true).tint('error').onPress(onLike),
          ).trailing(Action(Glyph, 'Save')),
        ),
      ),
    );
    expect(hosts(r, 'BloomAvatar')[0]?.props).toMatchObject({
      source: 'file-id',
      variant: 'thumb',
      size: 36,
    });
    expect(hosts(r, 'BloomButton')[0]?.props).toMatchObject({
      appearance: 'plain',
      tone: 'neutral',
      leadingIcon: Glyph,
      children: 'Compose',
    });
    const [like] = hosts(r, 'EngagementAction');
    expect(like?.props).toMatchObject({
      accessibilityLabel: 'Like',
      count: 3,
      active: true,
      tone: 'error',
      onPress: onLike,
    });
    // The bar draws its trailing slot itself; what it is handed is the element.
    const trailing = hosts(r, 'EngagementBar')[0]?.props.trailing as ReactElement<{
      accessibilityLabel: string;
    }>[];
    const [save] = trailing;
    expect(save?.props.accessibilityLabel).toBe('Save');
  });

  it('glass is Bloom’s Surface, tinted from a colour role', () => {
    const r = mount(
      toElement(Button(Icon(Glyph)).shape('circle').glass({ tint: 'primary' }).corner('full')),
    );
    const [surface] = hosts(r, 'Surface');
    expect(surface?.props.fill).toBe(LIGHT.primary);
    expect(hosts(r, 'BloomButton')[0]?.props.iconOnly).toBe(true);
  });
});
