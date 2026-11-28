import { createElement, useState, type ReactElement } from 'react';
import TestRenderer, {
  act,
  type ReactTestInstance,
  type ReactTestRenderer,
} from 'react-test-renderer';

import { tokens } from '@oxy.so/bloom/styles';
import { TYPE_SCALE } from '@oxy.so/bloom/typography';
import { DARK, LIGHT, PaintContext } from './support/bloom-theme';
import { opened } from './support/bloom-hooks';
import {
  Action,
  ActionBar,
  Avatar,
  Button,
  Embed,
  Grid,
  HStack,
  Icon,
  Image,
  Spacer,
  Text,
  VStack,
} from '../primitives';
import { LanguageRoot, toElement } from '../render';
import { view } from '../view';
import { defineEnvironment, useEnvironment } from '../environment';
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
  it('a root that builds its chain draws what toElement draws: the compiler’s lowering', () => {
    const onPress = () => {};
    const chain = () => VStack(Text('Open')).padding('md').onPress(onPress);
    const built = mount(createElement(LanguageRoot, { build: chain })).toJSON();
    expect(built).toEqual(mount(toElement(chain())).toJSON());
    expect(built).not.toBeNull();
  });

  it('a grid stretches its chart cards only when asked: Bloom’s stretchItems', () => {
    const grid = (node: ReturnType<typeof Grid>) =>
      hosts(mount(toElement(node)), 'ResponsiveGrid')[0]?.props;
    expect(grid(Grid(Text('a')).stretchItems())?.stretchItems).toBe(true);
    expect(grid(Grid(Text('a')).stretchItems(false))?.stretchItems).toBe(false);
    expect(grid(Grid(Text('a')))?.stretchItems).toBeUndefined();
  });

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

  it('text is Bloom’s Text: a ramp font is its variant, a colour role is painted from the theme', () => {
    const r = mount(
      toElement(Text('hi').font('headline').weight('semibold').foreground('muted').lines(1)),
    );
    const [text] = hosts(r, 'Text');
    expect(text?.props.variant).toBe('headline-semibold');
    expect(text?.props.style).toEqual({ color: LIGHT.textSecondary });
    expect(text?.props.numberOfLines).toBe(1);
    expect(text?.props.ellipsizeMode).toBe('tail');
    expect(text?.props.children).toBe('hi');
  });

  it('a text with no colour of its own keeps Bloom’s ink; a leading on a ramp font sets its line height', () => {
    const r = mount(toElement(Text('hi').font('body').leading('relaxed')));
    const [text] = hosts(r, 'Text');
    expect(text?.props.variant).toBe('body-regular');
    expect(text?.props.style).toEqual({
      lineHeight: TYPE_SCALE['body-regular'].fontSize * 1.625,
    });
  });

  it('a text style is the Bloom typography component it names', () => {
    const r = mount(
      toElement(VStack(Text('Title').textStyle('h1'), Text('Intro').textStyle('lead'))),
    );
    expect(hosts(r, 'H1')[0]?.props.children).toBe('Title');
    expect(hosts(r, 'Lead')[0]?.props.children).toBe('Intro');
  });

  it('a link is Bloom’s inline link: primary, underlined, opened outside the app', () => {
    const r = mount(toElement(Text('Read the ', Text('terms').link('https://oxy.so/terms'))));
    const [, link] = hosts(r, 'Text');
    expect(link?.props.role).toBe('link');
    expect(link?.props.style).toEqual({ color: LIGHT.primary, textDecorationLine: 'underline' });
    const stopPropagation = jest.fn();
    act(() => link?.props.onPress({ stopPropagation }));
    expect(stopPropagation).toHaveBeenCalled();
    expect(opened).toContain('https://oxy.so/terms');
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
    expect(hosts(r, 'Text')[0]?.props.style).toEqual({ minWidth: 0, flexShrink: 10 });
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

  it('inline spans are nested Text that set only what their own chain names', () => {
    const r = mount(toElement(Text('Reposted by ', Text('Ana').weight('semibold')).font('sm')));
    const [outer, inner] = hosts(r, 'Text');
    expect(outer?.props.children[0]).toBe('Reposted by ');
    expect(outer?.props.style).toEqual({ fontSize: 13 });
    // The span's weight with the text's size rung; the ink is inherited.
    expect(inner?.props.style).toEqual({ fontSize: 13, fontWeight: '600' });
    expect(inner?.props.variant).toBeUndefined();
  });

  it('an onPress modifier makes the host pressable even with no handler, out of the focus order', () => {
    const handler = jest.fn();
    const r = mount(toElement(VStack(Text('a')).onPress(handler).label('Post')));
    const [pressable] = hosts(r, 'Pressable');
    // Pressable is focusable by default; only an inert one says otherwise.
    expect(pressable?.props.focusable).toBeUndefined();
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

describe("a hover group takes the platform's press highlight on native", () => {
  // The suite is iOS's: a wash under the children while the Pressable is held.
  // Android's ripple is in android-hosts.test.tsx.
  const first = (r: ReactTestRenderer) =>
    r.root.find((node) => (node.type as unknown) === 'Pressable');
  const flat = (style: unknown) => Object.assign({}, ...[style].flat(4).filter(Boolean));
  const washes = (r: ReactTestRenderer) =>
    r.root.findAll(
      (node) =>
        (node.type as unknown) === 'View' &&
        flat(node.props.style).backgroundColor === LIGHT.contrast50,
    );

  it("a pressable hover group's Pressable lights the wash under its children while held, and keeps its own press", () => {
    const handler = jest.fn();
    const r = mount(toElement(VStack(Text('Post')).hoverGroup().onPress(handler)));
    expect(washes(r)).toHaveLength(0);
    expect(first(r).props.android_ripple).toBeUndefined();
    act(() => first(r).props.onPressIn());
    const [wash] = washes(r);
    expect(flat(wash?.props.style)).toEqual({
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      pointerEvents: 'none',
      backgroundColor: LIGHT.contrast50,
    });
    // Under the row's own children: the first thing the Pressable draws.
    expect(first(r).children[0]).toBe(wash);
    act(() => first(r).props.onPressOut());
    expect(washes(r)).toHaveLength(0);
    act(() => first(r).props.onPress());
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('the wash is drawn in the tree’s own palette', () => {
    const r = mount(
      toElement(
        VStack(Text('Post'))
          .hoverGroup()
          .onPress(() => {}),
      ),
      DARK,
    );
    act(() => first(r).props.onPressIn());
    expect(
      flat(first(r).children[0] && (first(r).children[0] as ReactTestInstance).props.style),
    ).toMatchObject({ backgroundColor: DARK.contrast50 });
  });

  it('a hover group with no press handler takes no highlight', () => {
    const r = mount(toElement(VStack(Text('Post')).hoverGroup().onPress(undefined)));
    act(() => first(r).props.onPressIn());
    expect(washes(r)).toHaveLength(0);
    expect(first(r).props.android_ripple).toBeUndefined();
  });

  it("the highlight lights beside a pressed variant's own press tracking", () => {
    const r = mount(
      toElement(
        VStack(Text('Post'))
          .hoverGroup()
          .onPress(() => {})
          .when('pressed', (v) => v.background('surface')),
      ),
    );
    act(() => first(r).props.onPressIn());
    expect(washes(r)).toHaveLength(1);
    expect(flat(first(r).props.style).backgroundColor).toBe(LIGHT.backgroundSecondary);
    act(() => first(r).props.onPressOut());
    expect(washes(r)).toHaveLength(0);
    expect(flat(first(r).props.style).backgroundColor).toBeUndefined();
  });

  it("a child keeps its state when the row's press handler comes", () => {
    let bump: (() => void) | undefined;
    function Counter() {
      const [count, setCount] = useState(0);
      bump = () => setCount((n) => n + 1);
      return createElement('Count', { count });
    }
    const row = (press: (() => void) | undefined) =>
      toElement(
        VStack(Embed(createElement(Counter)), Text('Post'))
          .hoverGroup()
          .onPress(press),
      );
    const r = mount(row(undefined));
    act(() => bump?.());
    update(
      r,
      row(() => {}),
    );
    expect(r.root.findByType('Count' as never).props.count).toBe(1);
  });

  it('a press outside a hover group keeps its bare Pressable', () => {
    const plain = mount(toElement(VStack(Text('a')).onPress(() => {})));
    act(() => first(plain).props.onPressIn?.());
    expect(washes(plain)).toHaveLength(0);
    expect(first(plain).props.android_ripple).toBeUndefined();
  });

  it('the highlight costs the row nothing: the same fibers, hooks and context reads as a bare press', () => {
    type Fiber = {
      tag: number;
      child: Fiber | null;
      sibling: Fiber | null;
      memoizedState: { next: unknown } | null;
      dependencies?: { firstContext: { next: unknown } | null } | null;
    };
    // Function, ForwardRef, Memo, SimpleMemo: the fibers that hold hooks.
    const HOOKS = new Set([0, 11, 14, 15]);
    const cost = (element: ReactElement) => {
      const r = mount(element);
      const found = { fibers: 0, hooks: 0, contexts: 0 };
      const walk = (fiber: Fiber | null): void => {
        for (let f = fiber; f; f = f.sibling) {
          found.fibers += 1;
          if (HOOKS.has(f.tag))
            for (let h = f.memoizedState; h; h = h.next as typeof h) found.hooks += 1;
          for (let d = f.dependencies?.firstContext ?? null; d; d = d.next as typeof d)
            found.contexts += 1;
          walk(f.child);
        }
      };
      walk((r.root as unknown as { _fiber: Fiber })._fiber);
      return found;
    };
    const bare = cost(toElement(VStack(Text('Post')).onPress(() => {})));
    const lit = cost(
      toElement(
        VStack(Text('Post'))
          .hoverGroup()
          .onPress(() => {}),
      ),
    );
    // The children a function of the Pressable's press draws are its own (an
    // unkeyed fragment is no fiber), and the press state is the Pressable's.
    expect(lit).toEqual(bare);
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

  it('an app colour paints a background, a border, text and a glyph as its hex, in every scheme', () => {
    const brand = defineTokens({ color: { blue: '#1877f2' } }).color.blue;
    const node = HStack(Text('a'), Icon(Glyph))
      .background(brand)
      .border(brand, 'thin')
      .foreground(brand);
    for (const scheme of [LIGHT, DARK]) {
      const r = mount(toElement(node), scheme);
      expect(hosts(r, 'View')[0]?.props.style).toMatchObject({
        backgroundColor: '#1877f2',
        borderColor: '#1877f2',
      });
      expect(hosts(r, 'Text')[0]?.props.style.color).toBe('#1877f2');
      expect(r.root.findByType(Glyph).props.fill).toBe('#1877f2');
    }
  });

  it('an app colour is a hex, an rgb() or a colour name, and it varies as a role does', () => {
    for (const value of ['blurple', 'burntsienna', 'hsl(0, 0%, 100%)', 'rgba(0 0 0 / 0.5)'])
      expect(() => defineTokens({ color: { blue: value as `#${string}` } })).toThrow(
        'color.blue is no colour both platforms paint alike',
      );
    expect(
      defineTokens({ color: { a: 'white', b: 'rgba(255, 255, 255, 0.72)', c: 'rgb(0,0,0)' } }).color
        .b.value,
    ).toBe('rgba(255, 255, 255, 0.72)');
    const brand = defineTokens({ color: { blue: '#1877f2' } }).color.blue;
    const r = mount(
      toElement(
        HStack(Icon(Glyph), Text('a'))
          .onPress(() => {})
          .background('surface')
          .when('pressed', (v) => v.background(brand).foreground(brand)),
      ),
    );
    const press = () => r.root.find((node) => (node.type as unknown) === 'Pressable');
    const flat = (style: unknown) => Object.assign({}, ...[style].flat(4).filter(Boolean));
    expect(flat(press().props.style).backgroundColor).toBe(LIGHT.backgroundSecondary);
    expect(r.root.findByType(Glyph).props.fill).toBe(LIGHT.text);
    act(() => press().props.onPressIn());
    expect(flat(press().props.style).backgroundColor).toBe('#1877f2');
    expect(flat(hosts(r, 'Text')[0]?.props.style).color).toBe('#1877f2');
    expect(r.root.findByType(Glyph).props.fill).toBe('#1877f2');
    act(() => press().props.onPressOut());
    expect(flat(press().props.style).backgroundColor).toBe(LIGHT.backgroundSecondary);
  });

  it('app tokens resolve to their declared values', () => {
    const t = defineTokens({ space: { gutter: 64 }, leading: { tight: 1.25 } });
    const r = mount(
      toElement(Text('a').font('md').leading(t.leading.tight).padding('leading', t.space.gutter)),
    );
    expect(hosts(r, 'Text')[0]?.props.style).toEqual({
      fontSize: 15,
      lineHeight: 18.75,
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

  it('a comparator decides when props are equal, as memo’s does', () => {
    const rowBody = jest.fn((props: { id: string; seen: number }) => Text(props.id));
    const Row = view(rowBody, (previous, next) => previous.id === next.id);
    const tree = (props: { id: string; seen: number }) => VStack(Row(props));
    const r = mount(toElement(tree({ id: 'a', seen: 1 })));
    update(r, toElement(tree({ id: 'a', seen: 2 })));
    expect(rowBody).toHaveBeenCalledTimes(1);
    update(r, toElement(tree({ id: 'b', seen: 2 })));
    expect(rowBody).toHaveBeenCalledTimes(2);
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
    expect(hosts(r, 'BloomButton')[0]?.props.icon).toBeUndefined();
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

  it('a Button’s glyph in an ink of its own is drawn as it is; otherwise the button tints it', () => {
    const r = mount(
      toElement(
        Button(Icon(Glyph).foreground('primary')).style('subtle').shape('circle').label('Read'),
      ),
    );
    const button = hosts(r, 'BloomButton')[0];
    expect(button?.props.leadingIcon).toBeUndefined();
    expect(button?.props.iconOnly).toBe(true);
    const glyph = hosts(mount(button?.props.icon), 'Glyph')[0];
    expect(glyph?.props.fill).toBe(LIGHT.primary);
  });

  it('an image is BloomImage with its options from the chain, sized and clipped by its box', () => {
    const onLoad = jest.fn();
    const r = mount(
      toElement(
        Image('https://example.com/a.jpg', 'Cover')
          .frame({ width: '5xl' })
          .aspectRatio(2)
          .corner('lg')
          .clipped()
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

  it('an image of a ratio with no width or height takes the width its column offers', () => {
    // SwiftUI's: `VStack(alignment: .leading) { Image(…).aspectRatio(16 / 9) }` is as wide as the stack.
    const r = mount(toElement(VStack(Image('a.jpg').aspectRatio(16 / 9)).alignment('leading')));
    expect(hosts(r, 'BloomImage')[0]?.props.style).toEqual({
      aspectRatio: 16 / 9,
      alignSelf: 'stretch',
    });
    // A width, a height or a placement of its own, or a row, keeps it as it is.
    const sized = mount(toElement(VStack(Image('a.jpg').frame({ width: 'xl' }).aspectRatio(2))));
    expect(hosts(sized, 'BloomImage')[0]?.props.style).toEqual({
      width: tokens.space.xl,
      aspectRatio: 2,
    });
    const placed = mount(toElement(VStack(Image('a.jpg').aspectRatio(2).alignSelf('center'))));
    expect(hosts(placed, 'BloomImage')[0]?.props.style).toEqual({
      aspectRatio: 2,
      alignSelf: 'center',
    });
    const row = mount(toElement(HStack(Image('a.jpg').aspectRatio(2))));
    expect(hosts(row, 'BloomImage')[0]?.props.style).toEqual({ aspectRatio: 2 });
    const pressable = mount(toElement(VStack(Image('a.jpg').aspectRatio(2).onPress(jest.fn()))));
    expect(hosts(pressable, 'Pressable')[0]?.props.style).toEqual({ alignSelf: 'stretch' });
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
    expect(press?.props).toMatchObject({ onPress, style: { flex: 1 } });
    expect(press?.props.focusable).toBeUndefined();
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

  it('a theme switch re-renders each tree once: a view body runs again and repaints', () => {
    const body = jest.fn((props: { title: string }) =>
      VStack(Text(props.title).foreground('muted'), Icon(Glyph)),
    );
    const Row = view(body);
    const tree = toElement(VStack(Row({ title: 'a' })));
    const r = mount(tree, LIGHT);
    update(r, tree, LIGHT);
    expect(body).toHaveBeenCalledTimes(1);
    update(r, tree, DARK);
    expect(body).toHaveBeenCalledTimes(2);
    expect(hosts(r, 'Text')[0]?.props.style.color).toBe(DARK.textSecondary);
    expect(hosts(r, 'Glyph')[0]?.props.fill).toBe(DARK.text);
  });

  it('the environment crosses a view boundary only where it changed', () => {
    const r = mount(
      toElement(VStack(VStack(Label({ text: 'x' })).foreground('muted'), Label({ text: 'y' }))),
    );
    const [x, y] = hosts(r, 'Text');
    expect(x?.props.style.color).toBe(LIGHT.textSecondary);
    // Outside the changed environment, Bloom's Text keeps its own ink.
    expect(y?.props.style).toBeUndefined();
  });

  it('a root that reads nothing still hands what is set above it to the trees inside it', () => {
    const tone = defineEnvironment('render-test-tone', 'plain');
    const Reader = view(function Reader() {
      return Text(useEnvironment(tone));
    });
    // The inner root is fixed geometry around a view(): it reads no context itself.
    const inner = toElement(VStack(Reader()).frame({ width: '120' }));
    // An app's component between them, which a view() body places.
    const Holder = view(() => Embed(createElement(Wrapper, null, inner)));
    const r = mount(toElement(VStack(Holder()).environment(tone, 'loud')));
    expect(hosts(r, 'Text').map((t) => t.props.children)).toEqual(['loud']);
  });

  it('a press in a root placed under a disabled view takes its disabled', () => {
    const onPress = jest.fn();
    const inner = toElement(VStack().frame({ width: '120' }).onPress(onPress));
    const Holder = view(() => Embed(createElement(Wrapper, null, inner)));
    const r = mount(toElement(VStack(Holder()).disabled()));
    expect(hosts(r, 'Pressable')[0]?.props.disabled).toBe(true);
  });

  it('a root that comes to read the environment keeps the views inside it mounted', () => {
    const Holder = view(function Holder({ inner }: { inner: ReactElement }) {
      return Embed(createElement(Wrapper, null, inner));
    });
    // No read, then a text that reads it, under an inherited disabled: the counter keeps its count.
    const tree = (hint: boolean) =>
      toElement(
        VStack(
          Holder({
            inner: toElement(VStack(Counter({ label: 'kept' }), hint && Text('Required'))),
          }),
        ).disabled(false),
      );
    const r = mount(tree(false));
    act(() => press());
    expect(hosts(r, 'Text').map((t) => t.props.children)).toEqual(['kept 1']);
    update(r, tree(true));
    expect(hosts(r, 'Text').map((t) => t.props.children)).toEqual(['kept 1', 'Required']);
  });

  it('a disabled held under a condition known as the view renders reaches what is inside it', () => {
    const save = jest.fn();
    const tree = (saving: boolean) =>
      toElement(VStack(Button(Text('Save')).onPress(save)).when(saving, (v) => v.disabled()));
    expect(hosts(mount(tree(true)), 'BloomButton')[0]?.props.disabled).toBe(true);
    expect(hosts(mount(tree(false)), 'BloomButton')[0]?.props.disabled).toBeFalsy();
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

describe('an island’s controls share its material', () => {
  const Row = view(function Row() {
    return HStack(Button(Text('In a view')).onPress(() => {}));
  });

  it('a Button or FAB inside .blur() is Bloom’s shared material, across a view(); a glass ends it', () => {
    const r = mount(
      toElement(
        HStack(
          Button(Text('Here')).onPress(() => {}),
          Row({}),
          VStack(Button(Text('On glass')).onPress(() => {})).glass(),
        ).blur(),
      ),
    );
    const buttons = hosts(r, 'BloomButton');
    expect(buttons.map((b) => b.props.material)).toEqual(['shared', 'shared', undefined]);
    // Outside an island a button draws its own material.
    const plain = mount(toElement(HStack(Button(Text('Plain')).onPress(() => {}))));
    expect(hosts(plain, 'BloomButton')[0]?.props.material).toBeUndefined();
  });
});

describe('a root under a parent’s asChild', () => {
  /** What an Expo Router `<Link asChild>`'s Slot does with its child: its props merged into the child's. */
  const asChild = (child: ReactElement, props: Record<string, unknown>) =>
    createElement(child.type, { ...props, ...(child.props as object) });

  it('takes the link’s href, press and role on its outermost host, painted or not', () => {
    const onPress = jest.fn();
    for (const chain of [Text('· 2h').foreground('muted'), Text('· 2h')]) {
      const root = mount(asChild(toElement(chain), { href: '/p/1', onPress, role: 'link' }));
      const text = hosts(root, 'Text')[0];
      expect(text?.props).toMatchObject({ href: '/p/1', role: 'link' });
      act(() => (text?.props.onPress as () => void)());
    }
    expect(onPress).toHaveBeenCalledTimes(2);
  });

  it('runs its own press before the link’s', () => {
    const calls: string[] = [];
    const root = mount(
      asChild(
        toElement(
          Text('x')
            .foreground('muted')
            .onPress(() => calls.push('own')),
        ),
        {
          onPress: () => calls.push('link'),
        },
      ),
    );
    const pressable = root.root.findAll(
      (i) => typeof i.type === 'string' && typeof i.props.onPress === 'function',
    )[0];
    act(() => (pressable?.props.onPress as () => void)());
    expect(calls).toEqual(['own', 'link']);
  });
});
