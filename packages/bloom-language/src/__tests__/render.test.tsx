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
  Image,
  Spacer,
  Text,
  VStack,
} from '../primitives';
import { toElement } from '../render';
import { view } from '../view';
import { defineTokens } from '../tokens';
import { clear, regular } from '../glass';
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
      fontFamily: 'Inter',
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
    expect(hosts(r, 'Text')[0]?.props.style).toEqual({
      fontFamily: 'Inter',
      fontSize: 13,
      color: LIGHT.textSecondary,
    });
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
      fontFamily: 'Inter',
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
    expect(inner?.props.style).toEqual({
      fontFamily: 'Inter',
      fontSize: 13,
      fontWeight: '600',
      color: LIGHT.text,
    });
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
      fontFamily: 'Inter',
      fontSize: 15,
      lineHeight: 18.75,
      color: LIGHT.text,
      paddingStart: 64,
    });
  });
});

let press: () => void = () => {};
const Counter = view(function Counter(props: { label: string }) {
  const [count, setCount] = useState(0);
  press = () => setCount((n) => n + 1);
  return Text(`${props.label} ${count}`);
});
const cardBody = jest.fn((props: { title: string }) => Text(props.title));
const Card = view(cardBody);
const Label = view(function Label(props: { text: string }) {
  return Text(props.text);
});

describe('view()', () => {
  it('runs its body as a component: hooks work and state survives re-renders', () => {
    const r = mount(toElement(Counter({ label: 'taps' })));
    expect(hosts(r, 'Text')[0]?.props.children).toBe('taps 0');
    act(() => press());
    expect(hosts(r, 'Text')[0]?.props.children).toBe('taps 1');
    expect(
      r.root.findAll((i) => (i.type as { displayName?: string }).displayName === 'Counter'),
    ).not.toHaveLength(0);
  });

  it('re-runs only when a prop changes: props compare key by key', () => {
    const tree = (props: { title: string }) => VStack(Card(props));
    const r = mount(toElement(tree({ title: 'a' })));
    update(r, toElement(tree({ title: 'a' })));
    expect(cardBody).toHaveBeenCalledTimes(1);
    update(r, toElement(tree({ title: 'b' })));
    expect(cardBody).toHaveBeenCalledTimes(2);
  });

  it('a child that turns false keeps its slot, so later siblings keep their state', () => {
    const tree = (show: boolean) => VStack(show && Text('banner'), Counter({ label: 'kept' }));
    const r = mount(toElement(tree(false)));
    act(() => press());
    expect(hosts(r, 'Text').map((t) => t.props.children)).toEqual(['kept 1']);
    update(r, toElement(tree(true)));
    expect(hosts(r, 'Text').map((t) => t.props.children)).toEqual(['banner', 'kept 1']);
  });

  it('inherits the environment of where it is placed', () => {
    const r = mount(toElement(VStack(Label({ text: 'x' })).foreground('muted')));
    expect(hosts(r, 'Text')[0]?.props.style.color).toBe(LIGHT.textSecondary);
  });

  it('a view’s modifiers wrap its body', () => {
    const r = mount(toElement(VStack(Label({ text: 'x' }).padding('md'))));
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
      toElement(
        VStack(Embed(createElement('ThirdParty')), Icon(Glyph), Label({ text: 'x' }), Text('y')),
      ),
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

  it('an image is BloomImage with its options from the chain, sized and clipped by its box', () => {
    const onLoad = jest.fn();
    const r = mount(
      toElement(
        Image('https://example.com/a.jpg', 'Cover')
          .frame({ width: '5xl' })
          .aspectRatio(2)
          .corner('lg')
          .contentFit('contain')
          .crossFade('fast')
          .onLoad(onLoad)
          .testID('cover'),
      ),
    );
    expect(hosts(r, 'View')).toHaveLength(0);
    const [image] = hosts(r, 'BloomImage');
    expect(image?.props).toMatchObject({
      source: 'https://example.com/a.jpg',
      alt: 'Cover',
      contentFit: 'contain',
      transition: tokens.animation.duration.fast,
      onLoad,
      testID: 'cover',
      style: {
        width: tokens.space._5xl,
        aspectRatio: 2,
        borderRadius: tokens.borderRadius.lg,
        overflow: 'hidden',
      },
    });
  });

  it('an image tint paints tintColor from a colour role', () => {
    const r = mount(toElement(Image(1).tint('primary').frame({ width: 'xl', height: 'xl' })));
    expect(hosts(r, 'BloomImage')[0]?.props).toMatchObject({
      source: 1,
      tintColor: LIGHT.primary,
      style: { width: tokens.space.xl, height: tokens.space.xl },
    });
  });

  it('a pressable image sits in its pressable host, which takes the placement', () => {
    const onPress = jest.fn();
    const r = mount(toElement(Image('a.jpg').frame({ height: 'xl' }).grow().onPress(onPress)));
    const [press] = hosts(r, 'Pressable');
    expect(press?.props).toMatchObject({ onPress, focusable: true, style: { flex: 1 } });
    expect(press?.findByType('BloomImage' as never).props.style).toEqual({
      height: tokens.space.xl,
    });
  });

  it('glass is Bloom’s Surface, tinted from a colour role', () => {
    const r = mount(
      toElement(Button(Icon(Glyph)).shape('circle').glass(regular.tint('primary')).corner('full')),
    );
    const [surface] = hosts(r, 'Surface');
    expect(surface?.props.fill).toBe(LIGHT.primary);
    expect(surface?.props.sheen).toBeUndefined();
    expect(hosts(r, 'BloomButton')[0]?.props.iconOnly).toBe(true);
  });
});

const countedGlyph = jest.fn((props: { fill?: string }) => createElement('Counted', props));
/** A module constant: one node for every render, as the compiler hoists it. */
const STATIC = HStack(Icon(countedGlyph), Text('static')).spacing('sm');
let bump: () => void = () => {};
const StaticParent = view(function StaticParent() {
  const [n, setN] = useState(0);
  bump = () => setN((v) => v + 1);
  return VStack(STATIC, Text(`${n}`));
});

describe('the cost of a view and of a theme switch', () => {
  it('a view is one fiber: React’s own memo of its host, with no comparator', () => {
    const node = Card({ title: 'a' });
    const { component } = node.props as { component: { compare: unknown; type: unknown } };
    expect(component.compare).toBeNull();
    expect(typeof component.type).toBe('function');
  });

  it('a theme switch repaints the leaves and re-runs no view body', () => {
    const body = jest.fn((props: { title: string }) =>
      VStack(Text(props.title).foreground('muted'), Icon(Glyph)),
    );
    const Row = view(body);
    const tree = toElement(VStack(Row({ title: 'a' })));
    const r = mount(tree, LIGHT);
    update(r, tree, DARK);
    expect(body).toHaveBeenCalledTimes(1);
    expect(hosts(r, 'Text')[0]?.props.style.color).toBe(DARK.textSecondary);
    expect(hosts(r, 'Glyph')[0]?.props.fill).toBe(DARK.text);
  });

  it('the environment crosses a view boundary only where it changed', () => {
    const r = mount(
      toElement(VStack(VStack(Label({ text: 'x' })).foreground('muted'), Label({ text: 'y' }))),
    );
    const [x, y] = hosts(r, 'Text');
    expect(x?.props.style.color).toBe(LIGHT.textSecondary);
    expect(y?.props.style.color).toBe(LIGHT.text);
  });

  it('a node that keeps its identity renders the same element, so React skips it', () => {
    const r = mount(toElement(StaticParent()));
    act(() => bump());
    act(() => bump());
    expect(hosts(r, 'Text').map((t) => t.props.children)).toEqual(['static', '2']);
    expect(countedGlyph).toHaveBeenCalledTimes(1);
  });
});

describe('glass', () => {
  it('regular is Surface’s own material; a tint paints its fill, at a named opacity when given', () => {
    const r = mount(
      toElement(VStack(VStack().glass(), VStack().glass(regular.tint('primary', 'medium')))),
    );
    const [plain, tinted] = hosts(r, 'Surface');
    expect(plain?.props.fill).toBeUndefined();
    expect(tinted?.props.fill).toBe('rgba(0, 0, 255, 0.48)');
  });

  it('clear drops the sheen and lets the surface (or its tint) through at the subtle opacity', () => {
    const r = mount(toElement(VStack(VStack().glass(clear), VStack().glass(clear.tint('error')))));
    const [untinted, tinted] = hosts(r, 'Surface');
    expect(untinted?.props).toMatchObject({ sheen: false, fill: 'rgba(245, 245, 245, 0.24)' });
    expect(tinted?.props).toMatchObject({ sheen: false, fill: 'rgba(255, 0, 0, 0.24)' });
  });

  it('values are named, and equal values share a key', () => {
    expect(clear.tint('primary', 'subtle').key).toBe(clear.tint('primary', 'subtle').key);
    expect(regular.key).not.toBe(clear.key);
  });
});
