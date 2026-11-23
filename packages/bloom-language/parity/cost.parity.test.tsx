/**
 * What a language node costs React, against the JSX it stands for: hook slots
 * and context reads (what Mention's feed row-cost harness gates per row), and
 * fibers, under Bloom's real provider on native.
 *
 * A node is measured as the marginal cost of drawing it inside a container,
 * the language's (`VStack(node)` less `VStack()`) beside the JSX's
 * (`<View>{jsx}</View>` less `<View />`), so the boundary into the language
 * is counted once, by itself: a `toElement` root reads one context (the
 * environment, which carries the animation scope) and holds no hook, as a
 * JSX component that reads the theme does.
 *
 * A JSX side that paints a theme colour reads the theme as an app does
 * (`Themed`: one `useThemePaint()`), so a painted node may read once.
 */
import { createElement, type ReactElement, type ReactNode } from 'react';
import * as RN from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';
import { BloomThemeProvider } from '@oxy.so/bloom/theme';
import { Button } from '@oxy.so/bloom/button';
import { EngagementAction, EngagementBar } from '@oxy.so/bloom/engagement-bar';
import { RiHeart3Line } from '@oxy.so/bloom/icons';
import { VirtualList } from '@oxy.so/bloom/list';
import { PressableScale } from '@oxy.so/bloom/pressable-scale';
import { Text } from '@oxy.so/bloom/typography';

import type { Child } from '../src/node';
import * as L from '../src/primitives';
import { VirtualList as LVirtualList } from '../src/controls/list';
import { LanguageRoot, toElement } from '../src/render';
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

interface Case {
  name: string;
  node: Child;
  jsx: ReactNode;
  /** The container both sides are drawn in (a stack and a View by default). */
  in?: { language: (...children: Child[]) => Child; jsx: (children?: ReactNode) => ReactElement };
}

const STACK = {
  language: (...children: Child[]) => L.VStack(...children),
  jsx: (children?: ReactNode) => <RN.View>{children}</RN.View>,
};
const ACTION_BAR = {
  language: (...children: Child[]) => L.ActionBar(...children),
  jsx: (children?: ReactNode) => <EngagementBar>{children}</EngagementBar>,
};

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
    jsx: (
      <Themed>
        {(c) => (
          <RN.Pressable style={{ backgroundColor: c.backgroundSecondary }} onPress={onPress}>
            <Text>a</Text>
          </RN.Pressable>
        )}
      </Themed>
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
    jsx: <Themed>{(c) => <Text style={{ color: c.primary }}>a</Text>}</Themed>,
  },
  {
    name: 'Icon with a foreground and a themed Bloom icon',
    node: L.Icon(RiHeart3Line).foreground('primary'),
    jsx: <Themed>{(c) => <RiHeart3Line size="md" fill={c.primary} />}</Themed>,
  },
  {
    name: 'a view with .background and a themed View',
    node: L.VStack(L.Text('a')).background('surface'),
    jsx: (
      <Themed>
        {(c) => (
          <RN.View style={{ backgroundColor: c.backgroundSecondary }}>
            <Text>a</Text>
          </RN.View>
        )}
      </Themed>
    ),
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
];

describe('a language node costs React no more than the JSX it stands for', () => {
  beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('the boundary into the language: one context read, no hook, one fiber', () => {
    const root = less(measured(toElement(L.VStack())), measured(<RN.View />));
    expect(root).toEqual({ fibers: 1, hooks: 0, contexts: 1 });
  });

  it('a list’s row that returns a root (toElement) and a row of JSX, per row', () => {
    const row = ({ item }: { item: string }) => toElement(L.Text(item).padding('xs'));
    const jsxRow = ({ item }: { item: string }) => <Text style={{ padding: 4 }}>{item}</Text>;
    const language = (items: string[]) =>
      measured(toElement(LVirtualList(items, row).itemKey(String)));
    const jsx = (items: string[]) =>
      measured(<VirtualList data={items} keyExtractor={String} renderItem={jsxRow} />);
    const perRow = {
      language: less(language(['a', 'b']), language(['a'])),
      jsx: less(jsx(['a', 'b']), jsx(['a'])),
    };
    // A list that drew no rows would cost nothing on both sides.
    expect(perRow.jsx.fibers).toBeGreaterThan(0);
    expect(perRow.language).toEqual(perRow.jsx);
  });

  it.each(CASES.map((c) => [c.name, c] as const))('%s', (_name, c) => {
    const container = c.in ?? STACK;
    const language = less(
      measured(toElement(container.language(c.node))),
      measured(toElement(container.language())),
    );
    const jsx = less(measured(container.jsx(c.jsx)), measured(container.jsx()));
    expect(language.hooks).toBeLessThanOrEqual(jsx.hooks);
    expect(language.contexts).toBeLessThanOrEqual(jsx.contexts);
    expect(language.fibers).toBeLessThanOrEqual(jsx.fibers);
  });
});
