/**
 * What a language node costs React, against the JSX it stands for: hook slots
 * and context reads (what Mention's feed row-cost harness gates per row), and
 * fibers, under Bloom's real provider on native.
 *
 * A node is measured as the marginal cost of drawing it inside a container,
 * the language's (`VStack(node)` less `VStack()`) beside the JSX's
 * (`<View>{jsx}</View>` less `<View />`), under a boundary held to reading
 * both contexts, so the boundary into the language is counted by itself: a
 * `toElement` root reads the environment (which carries the animation scope)
 * when its tree takes from it, and the theme when its tree paints from it,
 * once each for the whole tree, and holds no hook: a tree that reads neither
 * costs the boundary's fiber alone.
 *
 * The JSX is a component that reads the theme once, as an app's does
 * (`Themed`: one `useThemePaint()`), and paints its colours from it by hand,
 * so a node that paints costs what the host it paints does, no more.
 */
import {
  Children,
  cloneElement,
  createElement,
  memo,
  type ReactElement,
  type ReactNode,
} from 'react';
import * as RN from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';
import { BloomThemeProvider, useThemePaint } from '@oxy.so/bloom/theme';
import { Avatar } from '@oxy.so/bloom/avatar';
import { Button } from '@oxy.so/bloom/button';
import { Card } from '@oxy.so/bloom/card';
import { EngagementAction, EngagementBar } from '@oxy.so/bloom/engagement-bar';
import { RiHeart3Line, RiVerifiedBadgeFill, RiVolumeMuteLine } from '@oxy.so/bloom/icons';
import { VirtualList } from '@oxy.so/bloom/list';
import { InlineMarkdown } from '@oxy.so/bloom/markdown';
import { PressableScale } from '@oxy.so/bloom/pressable-scale';
import { Text } from '@oxy.so/bloom/typography';

import type { Child, ViewNode } from '../src/node';
import * as L from '../src/primitives';
import { defineTokens } from '../src/tokens';
import { Card as LCard } from '../src/controls/containers';
import { VirtualList as LVirtualList } from '../src/controls/list';
import { InlineMarkdown as LInlineMarkdown } from '../src/controls/markdown';
import { LanguageRoot, toElement } from '../src/render';
import { view } from '../src/view';
import type { ThemeColors } from '@oxy.so/bloom/theme';
import { Themed } from './support/cases';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

interface Fiber {
  tag: number;
  child: Fiber | null;
  sibling: Fiber | null;
  return: Fiber | null;
  stateNode: { current?: Fiber } | null;
  memoizedProps: { testID?: string } | null;
  memoizedState: { next: unknown } | null;
  dependencies?: { firstContext: { next: unknown } | null } | null;
}

interface Cost {
  fibers: number;
  hooks: number;
  contexts: number;
}

/** React's function-component tags (Function, ForwardRef, Memo, SimpleMemo): the fibers that hold hooks. */
const HOOK_TAGS = new Set([0, 11, 14, 15]);

function measured(element: ReactElement): Cost {
  let renderer!: TestRenderer.ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(
      <BloomThemeProvider fonts={false} mode="light">
        <RN.View testID="measured">{element}</RN.View>
      </BloomThemeProvider>,
    );
  });
  let top = (renderer.root as unknown as { _fiber: Fiber })._fiber;
  while (top.return) top = top.return;
  const stack: Fiber[] = [top.stateNode?.current ?? top];
  let marker: Fiber | undefined;
  while (marker === undefined && stack.length > 0) {
    const fiber = stack.pop() as Fiber;
    if (fiber.tag === 5 && fiber.memoizedProps?.testID === 'measured') marker = fiber;
    if (fiber.sibling) stack.push(fiber.sibling);
    if (fiber.child) stack.push(fiber.child);
  }
  const cost: Cost = { fibers: 0, hooks: 0, contexts: 0 };
  const walk = (first: Fiber | null): void => {
    for (let fiber = first; fiber; fiber = fiber.sibling) {
      cost.fibers += 1;
      if (HOOK_TAGS.has(fiber.tag))
        for (let hook = fiber.memoizedState; hook; hook = hook.next as Fiber['memoizedState'])
          cost.hooks += 1;
      for (
        let read = fiber.dependencies?.firstContext ?? null;
        read;
        read = read.next as typeof read
      )
        cost.contexts += 1;
      walk(fiber.child);
    }
  };
  walk(marker?.child ?? null);
  act(() => renderer.unmount());
  return cost;
}

const less = (a: Cost, b: Cost): Cost => ({
  fibers: a.fibers - b.fibers,
  hooks: a.hooks - b.hooks,
  contexts: a.contexts - b.contexts,
});

const onPress = () => {};
/** A nudge a name size works out as it renders. */
const NUDGE = 117.5 / 47;

interface Case {
  name: string;
  node: Child;
  /** The JSX, painted from the theme its component read (`Themed`). */
  jsx: ReactNode | ((colors: ThemeColors) => ReactNode);
  /** The container both sides are drawn in (a stack and a View by default). */
  in?: { language: (...children: Child[]) => Child; jsx: (children?: ReactNode) => ReactElement };
}

/**
 * A child that makes the boundary read both contexts and draws nothing (an
 * `Embed` render function draws in its tree's context), so each case measures
 * its node alone, whatever its own tree would read.
 */
const READS_BOTH = L.Embed(() => null);

const STACK = {
  language: (...children: Child[]) => L.VStack(...children, READS_BOTH),
  jsx: (children?: ReactNode) => <RN.View>{children}</RN.View>,
};
const ACTION_BAR = {
  language: (...children: Child[]) => L.VStack(L.ActionBar(...children), READS_BOTH),
  jsx: (children?: ReactNode) => (
    <RN.View>
      <EngagementBar>{children}</EngagementBar>
    </RN.View>
  ),
};

/** A run of a text (React Native's), as Mention's post text holds its links. */
const IN_TEXT = {
  language: (...children: Child[]) =>
    L.VStack(L.RawText('a ', ...(children as ViewNode[])), READS_BOTH),
  jsx: (children?: ReactNode) => (
    <RN.View>
      <RN.Text>
        {'a '}
        {children}
      </RN.Text>
    </RN.View>
  ),
};

/** What expo-router's `Link asChild` does: hands the element inside it an href, the link role and a press. */
function AsChild({ children }: { children: ReactNode }): ReactElement {
  return cloneElement(Children.only(children) as ReactElement<Record<string, unknown>>, {
    href: '/@b',
    role: 'link',
    onPress,
  });
}

/** An app colour (`defineTokens`), the same in both schemes: Mention's verified badge. */
const APP = defineTokens({ color: { verified: '#1d9bf0' } });

/** A slot the JSX around a chain holds (a name, a badge component): the same element on both sides. */
const Slot = ({ n }: { n: string }) => <RN.View testID={`slot-${n}`} />;

const FEED = RN.StyleSheet.create({
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 4, maxWidth: '100%', minWidth: 0 },
  tapArea: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, zIndex: 1 },
  mute: { position: 'absolute', bottom: 10, right: 10, zIndex: 2 },
  muteDisc: {
    width: 32,
    height: 32,
    borderRadius: 9999,
    backgroundColor: '#00000099',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ffffff33',
  },
});

const CASES: Case[] = [
  {
    name: 'a press (.onPress) and React Native’s Pressable',
    node: L.VStack(L.Text('a')).onPress(onPress),
    jsx: (
      <RN.Pressable onPress={onPress}>
        <Text>a</Text>
      </RN.Pressable>
    ),
  },
  {
    name: 'a press with a hit slop',
    node: L.VStack(L.Text('a')).onPress(onPress).hitSlop('md'),
    jsx: (
      <RN.Pressable onPress={onPress} hitSlop={8}>
        <Text>a</Text>
      </RN.Pressable>
    ),
  },
  {
    // Android's file, as this suite resolves: the ripple is a prop of the Pressable the view already is.
    name: 'a hover group’s press (.hoverGroup()) and a Pressable with its ripple',
    node: L.VStack(L.Text('a')).hoverGroup().onPress(onPress),
    jsx: (c) => (
      <RN.Pressable onPress={onPress} android_ripple={{ color: c.contrast50, borderless: false }}>
        <Text>a</Text>
      </RN.Pressable>
    ),
  },
  {
    name: '.pressScale() and Bloom’s PressableScale',
    node: L.VStack(L.Text('a')).onPress(onPress).pressScale(),
    jsx: (
      <PressableScale onPress={onPress}>
        <Text>a</Text>
      </PressableScale>
    ),
  },
  {
    name: '.pressFade() and TouchableOpacity',
    node: L.VStack(L.Text('a')).onPress(onPress).pressFade(),
    jsx: (
      <RN.TouchableOpacity onPress={onPress}>
        <Text>a</Text>
      </RN.TouchableOpacity>
    ),
  },
  {
    name: 'a press on a painted background',
    node: L.VStack(L.Text('a')).background('surface').onPress(onPress),
    jsx: (c) => (
      <RN.Pressable style={{ backgroundColor: c.backgroundSecondary }} onPress={onPress}>
        <Text>a</Text>
      </RN.Pressable>
    ),
  },
  {
    name: 'Button and Bloom’s Button',
    node: L.Button(L.Text('Save')).onPress(onPress),
    jsx: <Button onPress={onPress}>Save</Button>,
  },
  {
    name: 'Action and Bloom’s EngagementAction',
    node: L.Action(RiHeart3Line, 'Like').onPress(onPress),
    jsx: <EngagementAction icon={RiHeart3Line} accessibilityLabel="Like" onPress={onPress} />,
    in: ACTION_BAR,
  },
  { name: 'Text and Bloom’s Text', node: L.Text('a'), jsx: <Text>a</Text> },
  {
    name: 'Text with a foreground and a themed Text',
    node: L.Text('a').foreground('primary'),
    jsx: (c) => <Text style={{ color: c.primary }}>a</Text>,
  },
  {
    name: 'Icon with a foreground and a themed Bloom icon',
    node: L.Icon(RiHeart3Line).foreground('primary'),
    jsx: (c) => <RiHeart3Line size="md" fill={c.primary} />,
  },
  {
    name: 'a view with .background and a themed View',
    node: L.VStack(L.Text('a')).background('surface'),
    jsx: (c) => (
      <RN.View style={{ backgroundColor: c.backgroundSecondary }}>
        <Text>a</Text>
      </RN.View>
    ),
  },
  {
    name: 'several painted views in one tree and their themed JSX',
    node: L.VStack(
      L.Text('a').foreground('primary'),
      L.Icon(RiHeart3Line).foreground('muted'),
      L.VStack(L.Text('b').foreground('muted')).padding('md').background('surface'),
    ),
    jsx: (c) => (
      <RN.View>
        <Text style={{ color: c.primary }}>a</Text>
        <RiHeart3Line size="md" fill={c.textSecondary} />
        <RN.View style={{ padding: 12, backgroundColor: c.backgroundSecondary }}>
          <Text style={{ color: c.textSecondary }}>b</Text>
        </RN.View>
      </RN.View>
    ),
  },
  {
    name: 'a painted root nested in a tree and its themed JSX',
    node: L.Embed(toElement(L.Text('a').foreground('primary').padding('xs'))),
    jsx: (c) => <Text style={{ padding: 4, color: c.primary }}>a</Text>,
  },
  {
    name: 'a padded view and a View',
    node: L.VStack(L.Text('a')).padding('md'),
    jsx: (
      <RN.View style={{ padding: 12 }}>
        <Text>a</Text>
      </RN.View>
    ),
  },
  {
    name: 'a root nested in a tree (Embed(toElement(chain))) and its JSX',
    node: L.Embed(toElement(L.Text('a').padding('xs'))),
    jsx: <Text style={{ padding: 4 }}>a</Text>,
  },
  {
    name: 'a root an Embed’s render function returns (Embed(() => toElement(chain))) and its JSX',
    node: L.Embed(() => toElement(L.Text('a').padding('xs'))),
    jsx: <Text style={{ padding: 4 }}>a</Text>,
  },
  {
    name: 'the root the compiler lowers toElement to, nested in a tree',
    node: L.Embed(createElement(LanguageRoot, { build: () => L.Text('a').padding('xs') })),
    jsx: <Text style={{ padding: 4 }}>a</Text>,
  },
  {
    name: 'a fixed role at an opacity (.background black/half) and its hex',
    node: L.VStack(L.Text('a')).padding('xs').background('black/half'),
    jsx: (
      <RN.View style={{ padding: 4, backgroundColor: '#00000080' }}>
        <Text>a</Text>
      </RN.View>
    ),
  },
  {
    // Mention's composer: a card whose fill its caller zeroes, Bloom Card's own `style.backgroundColor`.
    name: 'a Card whose own fill is transparent and Bloom’s Card with that style',
    node: LCard(L.Text('a')).style('outline').background('transparent'),
    jsx: (
      <Card appearance="outline" style={{ backgroundColor: 'transparent' }}>
        <Text>a</Text>
      </Card>
    ),
  },
  {
    name: 'a border width in the platform’s default colour and a View',
    node: L.VStack(L.Text('a')).border(undefined, 'thin'),
    jsx: (
      <RN.View style={{ borderWidth: 1 }}>
        <Text>a</Text>
      </RN.View>
    ),
  },
  {
    name: 'a white glyph and a glyph filled white',
    node: L.Icon(RiHeart3Line).foreground('white'),
    jsx: <RiHeart3Line size="md" fill="#ffffff" />,
  },
  {
    name: 'a box of computed geometry (frame and margin) and a View',
    node: L.VStack(L.Text('a')).frame({ width: 120 }).margin('right', '1'),
    jsx: (
      <RN.View style={{ width: 120, marginRight: 4 }}>
        <Text>a</Text>
      </RN.View>
    ),
  },
  {
    // Mention's account badge, nudged by its name size's own amount (points computed at render).
    name: 'an offset of points computed at render and a translated View',
    node: L.VStack(L.Text('a')).offset({ y: NUDGE }),
    jsx: (
      <RN.View style={{ transform: [{ translateY: NUDGE }] }}>
        <Text>a</Text>
      </RN.View>
    ),
  },
  {
    name: 'a pressable span and a nested Text with its press',
    node: L.Text('b').foreground('primary').onPress(onPress),
    jsx: (c) => (
      <RN.Text style={{ color: c.primary }} onPress={onPress}>
        b
      </RN.Text>
    ),
    in: IN_TEXT,
  },
  {
    name: 'an element run handing Link asChild a span and its JSX',
    node: L.Embed((render) => <AsChild>{render(L.Text('@b').foreground('primary'))}</AsChild>),
    jsx: (c) => (
      <AsChild>
        <RN.Text style={{ color: c.primary }}>@b</RN.Text>
      </AsChild>
    ),
    in: IN_TEXT,
  },
  {
    // Mention's post text: its markdown's plain runs linkified, strings beside spans.
    name: 'inline markdown whose plain runs are strings and spans, and its JSX',
    node: LInlineMarkdown('see @b').plainRun((text) =>
      text.split(/(@b)/).map((part) => (part === '@b' ? L.Text(part).onPress(onPress) : part)),
    ),
    jsx: (
      <InlineMarkdown
        source="see @b"
        renderText={(text) => (
          <>
            {text.split(/(@b)/).map((part) =>
              part === '@b' ? (
                <RN.Text key="b" onPress={onPress}>
                  {part}
                </RN.Text>
              ) : (
                part
              ),
            )}
          </>
        )}
      />
    ),
    in: IN_TEXT,
  },
  {
    // Mention's UserName: the name, its verified badge in an app colour nudged on native, the
    // account's markers, in a row that keeps the name's ellipsis.
    name: 'a name row of slots and an app-coloured badge, and its View',
    node: L.HStack(
      L.Embed(<Slot n="name" />),
      L.Icon(RiVerifiedBadgeFill)
        .size('sm')
        .foreground(APP.color.verified)
        .when('native', (v) => v.offset({ y: '2xs' })),
      L.Embed(<Slot n="marker" />),
    )
      .frame({ maxWidth: 'full', minWidth: 'none' })
      .spacing('xs')
      .align('center'),
    jsx: (
      <RN.View style={FEED.nameRow}>
        <Slot n="name" />
        <RN.View style={{ transform: [{ translateY: 2 }] }}>
          <RiVerifiedBadgeFill size="sm" fill="#1d9bf0" />
        </RN.View>
        <Slot n="marker" />
      </RN.View>
    ),
  },
  {
    // Mention's feed video preview: the whole surface taps through to the viewer.
    name: 'a tap area over a whole surface and its Pressable',
    node: L.VStack()
      .position({ top: 'none', right: 'none', bottom: 'none', left: 'none' })
      .zIndex('raised')
      .onPress(onPress),
    jsx: <RN.Pressable style={FEED.tapArea} onPress={onPress} />,
  },
  {
    // And its mute button: a white glyph on a translucent disc, pinned above the tap area.
    name: 'a pinned mute button with a hit slop and its Pressable',
    node: L.VStack(
      L.VStack(L.Icon(RiVolumeMuteLine).size('18').foreground('white'))
        .frame({ width: '3xl', height: '3xl' })
        .background('black/60')
        .border('white/20', 'thin')
        .corner('full')
        .justify('center')
        .align('center'),
    )
      .position({ bottom: '10', right: '10' })
      .zIndex('2')
      .onPress(onPress)
      .hitSlop('md'),
    jsx: (
      <RN.Pressable onPress={onPress} hitSlop={8} style={FEED.mute}>
        <RN.View style={FEED.muteDisc}>
          <RiVolumeMuteLine size={18} fill="#ffffff" />
        </RN.View>
      </RN.Pressable>
    ),
  },
];

describe('a language node costs React what the JSX it stands for costs', () => {
  beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('a root reads only what its tree takes, once each, and holds no hook', () => {
    const boundary = (node: Child, jsx: ReactElement) =>
      less(measured(toElement(node)), measured(jsx));
    // Fixed geometry: a host view that reads nothing is that view, with no boundary.
    expect(
      boundary(L.VStack().frame({ width: '120' }), <RN.View style={{ width: 120 }} />),
    ).toEqual({ fibers: 0, hooks: 0, contexts: 0 });
    // Mention's NativeSplashRelease: a zero-size marker that takes no pointer and reports its layout.
    const noop = () => {};
    expect(
      boundary(
        L.VStack()
          .frame({ width: 'none', height: 'none' })
          .position({})
          .allowsHitTesting(false)
          .onLayout(noop),
        <RN.View
          pointerEvents="none"
          style={{ position: 'absolute', width: 0, height: 0 }}
          onLayout={noop}
        />,
      ),
    ).toEqual({ fibers: 0, hooks: 0, contexts: 0 });
    // Host views inside host views: still one tree of views.
    expect(
      boundary(
        L.HStack(L.VStack().frame({ width: '120' }), L.Spacer()).padding('md'),
        <RN.View style={{ flexDirection: 'row', padding: 12 }}>
          <RN.View style={{ width: 120 }} />
          <RN.View style={{ flex: 1 }} />
        </RN.View>,
      ),
    ).toEqual({ fibers: 0, hooks: 0, contexts: 0 });
    // A border width in the platform's colour paints nothing from the theme: the root is its view.
    expect(
      boundary(L.VStack().border(undefined, 'thin'), <RN.View style={{ borderWidth: 1 }} />),
    ).toEqual({ fibers: 0, hooks: 0, contexts: 0 });
    // A press: the environment, which hands it a `.disabled()` set above.
    expect(boundary(L.VStack().onPress(onPress), <RN.Pressable onPress={onPress} />)).toEqual({
      fibers: 1,
      hooks: 0,
      contexts: 1,
    });
    // A themed fill: the theme, as a component that reads it to paint a View does.
    expect(
      boundary(
        L.VStack().background('surface'),
        <Themed>{(c) => <RN.View style={{ backgroundColor: c.backgroundSecondary }} />}</Themed>,
      ),
    ).toEqual({ fibers: 0, hooks: 0, contexts: 0 });
    // A text: the traits set above it and the theme it inks with.
    expect(boundary(L.Text('a'), <Text>a</Text>)).toEqual({ fibers: 1, hooks: 0, contexts: 2 });
    // A RawText takes nothing set above it: its own chain is all it writes.
    expect(
      boundary(L.RawText('a').font('14').lines(1), <RN.Text style={{ fontSize: 14 }}>a</RN.Text>),
    ).toEqual({ fibers: 1, hooks: 0, contexts: 0 });
    // Inked with a role, it reads the theme, as a component that reads it to ink a Text does.
    expect(
      boundary(
        L.RawText('a').foreground('muted'),
        <Themed>{(c) => <RN.Text style={{ color: c.textSecondary }}>a</RN.Text>}</Themed>,
      ),
    ).toEqual({ fibers: 0, hooks: 0, contexts: 0 });
    // Mention's post body: inline markdown in a RawText, its text drawn by the app's function.
    // Bloom's InlineMarkdown paints its own runs; the function's runs read what they take where
    // they are drawn, so the root reads the theme alone, as the JSX's ink does.
    const plain = (text: string) => text;
    expect(
      boundary(
        L.RawText(LInlineMarkdown('a *b*').plainRun(plain)).foreground('foreground'),
        <Themed>
          {(c) => (
            <RN.Text style={{ color: c.text }}>
              <InlineMarkdown source="a *b*" renderText={plain} />
            </RN.Text>
          )}
        </Themed>,
      ),
    ).toEqual({ fibers: 0, hooks: 0, contexts: 0 });
  });

  it('the compiler’s root (a chain it builds as it renders) reads what its tree takes, as toElement’s does', () => {
    const compiled = (build: () => Child) => createElement(LanguageRoot, { build });
    expect(less(measured(compiled(() => L.VStack())), measured(<RN.View />))).toEqual({
      fibers: 1,
      hooks: 0,
      contexts: 0,
    });
    expect(less(measured(compiled(() => L.Text('a'))), measured(<Text>a</Text>))).toEqual({
      fibers: 1,
      hooks: 0,
      contexts: 2,
    });
  });

  it('Mention’s feed video preview as one root: a tap area and a mute button, against its JSX', () => {
    // VideoPlayer's preview: the tap area over the whole surface, and the mute
    // button above it, drawn among the player's other children (its video, its
    // poster), where the JSX's fragment is a fiber of its own.
    const tapArea = L.VStack()
      .position({ top: 'none', right: 'none', bottom: 'none', left: 'none' })
      .zIndex('raised')
      .onPress(onPress);
    const mute = L.VStack(
      L.VStack(L.Icon(RiVolumeMuteLine).size('18').foreground('white'))
        .frame({ width: '3xl', height: '3xl' })
        .background('black/60')
        .border('white/20', 'thin')
        .corner('full')
        .justify('center')
        .align('center'),
    )
      .position({ bottom: '10', right: '10' })
      .zIndex('2')
      .onPress(onPress)
      .hitSlop('md');
    const video = <RN.View testID="video" />;
    const language = measured(
      <>
        {video}
        {createElement(LanguageRoot, { build: () => L.Group(tapArea, mute) })}
      </>,
    );
    const jsx = measured(
      <>
        {video}
        <>
          <RN.Pressable style={FEED.tapArea} onPress={onPress} />
          <RN.Pressable onPress={onPress} hitSlop={8} style={FEED.mute}>
            <RN.View style={FEED.muteDisc}>
              <RiVolumeMuteLine size={18} fill="#ffffff" />
            </RN.View>
          </RN.Pressable>
        </>
      </>,
    );
    // The root is the fragment's fiber, and paints nothing from the theme; its one
    // read is the environment its presses take (a `.disabled()` set above them).
    expect(language).toEqual({ ...jsx, contexts: jsx.contexts + 1 });
  });

  it('a view() body reads what its tree takes, as the memo component it stands for', () => {
    // Mention's PresenceIndicator: a dot in an app colour, ringed in a role.
    const Dot = view(() =>
      L.VStack()
        .frame({ width: '10', height: '10' })
        .background(APP.color.verified)
        .border('background', 'thin')
        .corner('full'),
    );
    const ThemedDot = memo(function ThemedDot() {
      const c = useThemePaint();
      return (
        <RN.View
          style={{
            width: 10,
            height: 10,
            backgroundColor: '#1d9bf0',
            borderWidth: 1,
            borderColor: c.background,
            borderRadius: 9999,
          }}
        />
      );
    });
    expect(measured(toElement(Dot()))).toEqual(measured(<ThemedDot />));
    // Mention's EmptyStateSticker frame: fixed geometry reads nothing.
    const Frame = view(() => L.VStack().frame({ width: '120', height: '120' }));
    const PlainFrame = memo(function PlainFrame() {
      return <RN.View style={{ width: 120, height: 120 }} />;
    });
    expect(measured(toElement(Frame()))).toEqual(measured(<PlainFrame />));
    // Mention's AccountAvatar: a component that hands Bloom's Avatar its props, and reads nothing itself.
    const Account = view((props: { source: string; name: string }) =>
      L.Avatar(props.source, { name: props.name }).size('lg').shape('squircle'),
    );
    function AccountAvatar(props: { source: string; name: string }) {
      return <Avatar source={props.source} name={props.name} size={36} shape="squircle" />;
    }
    expect(measured(toElement(Account({ source: 'a', name: 'Ada' })))).toEqual(
      measured(<AccountAvatar source="a" name="Ada" />),
    );
    // A RawText inside a view, inked with a role: the theme once, as the memo component that inks it.
    const Label = view((props: { text: string }) =>
      L.RawText(props.text).font('14').foreground('muted').lines(1),
    );
    const PlainLabel = memo(function PlainLabel(props: { text: string }) {
      const c = useThemePaint();
      return (
        <RN.Text numberOfLines={1} style={{ fontSize: 14, color: c.textSecondary }}>
          {props.text}
        </RN.Text>
      );
    });
    expect(measured(toElement(Label({ text: 'Lane' })))).toEqual(
      measured(<PlainLabel text="Lane" />),
    );
  });

  it('a list’s painted row that returns a root (toElement) and a row of themed JSX, per row', () => {
    const row = ({ item }: { item: string }) =>
      toElement(L.Text(item).padding('xs').foreground('primary'));
    const language = (items: string[]) =>
      measured(toElement(LVirtualList(items, row).itemKey(String)));
    const jsx = (items: string[]) =>
      measured(
        <Themed>
          {(c) => (
            <VirtualList
              data={items}
              keyExtractor={String}
              renderItem={({ item }) => (
                <Text style={{ padding: 4, color: c.primary }}>{item}</Text>
              )}
            />
          )}
        </Themed>,
      );
    const perRow = {
      language: less(language(['a', 'b']), language(['a'])),
      jsx: less(jsx(['a', 'b']), jsx(['a'])),
    };
    // A list that drew no rows would cost nothing on both sides.
    expect(perRow.jsx.fibers).toBeGreaterThan(0);
    expect(perRow.language).toEqual(perRow.jsx);
  });

  it('a grid list’s span and its header kept to its content cost what the JSX props do', () => {
    const row = ({ item }: { item: string }) =>
      toElement(L.Text(item).padding('xs').foreground('primary'));
    const span = (layout: { span?: number }, item: string) => {
      if (item === 'tabs') layout.span = 3;
    };
    const language = (items: string[], grid: boolean) => {
      const list = LVirtualList(items, row).itemKey(String).headerContent(L.Text('Top'));
      return measured(
        toElement(grid ? list.columns(3).itemLayout(span).headerFitsContent() : list),
      );
    };
    const jsx = (items: string[], grid: boolean) =>
      measured(
        <Themed>
          {(c) => (
            <VirtualList
              data={items}
              keyExtractor={String}
              renderItem={({ item }) => (
                <Text style={{ padding: 4, color: c.primary }}>{item}</Text>
              )}
              ListHeaderComponent={<Text>Top</Text>}
              {...(grid && {
                numColumns: 3,
                overrideItemLayout: span,
                ListHeaderComponentStyle: { flexGrow: 0, flexShrink: 0, alignSelf: 'stretch' },
              })}
            />
          )}
        </Themed>,
      );
    const items = ['tabs', 'a', 'b', 'c'];
    const perRow = {
      language: less(language([...items, 'd'], true), language(items, true)),
      jsx: less(jsx([...items, 'd'], true), jsx(items, true)),
    };
    expect(perRow.jsx.fibers).toBeGreaterThan(0);
    expect(perRow.language).toEqual(perRow.jsx);
    // The whole list: what the language adds over the JSX is the same with the props as without them.
    expect(less(language(items, true), jsx(items, true))).toEqual(
      less(language(items, false), jsx(items, false)),
    );
  });

  it.each(CASES.map((c) => [c.name, c] as const))('%s', (_name, c) => {
    const container = c.in ?? STACK;
    const language = less(
      measured(toElement(container.language(c.node))),
      measured(toElement(container.language())),
    );
    const drawn = c.jsx;
    const jsx = less(
      measured(
        <Themed>
          {(colors) => container.jsx(typeof drawn === 'function' ? drawn(colors) : drawn)}
        </Themed>,
      ),
      measured(<Themed>{() => container.jsx()}</Themed>),
    );
    expect(language).toEqual(jsx);
  });
});
