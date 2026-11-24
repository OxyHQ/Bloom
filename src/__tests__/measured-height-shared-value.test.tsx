// A measured height that only an animated style reads lives in a shared value.
//
// `Sidebar`'s content morph and `GenieSurface`'s (the detail dialog's motion)
// kept the height they measure in React state, so every `onLayout` re-rendered
// the whole component and rebuilt the worklet, only to hand the new number to
// the UI thread. A shared value written from `onLayout` reaches the worklet
// without a render.
//
// Jest's Reanimated mock runs a mapper during render (no UI thread), so a
// suite sees the style a shared value resolves to on the NEXT render; each test
// re-renders with the same props to read it. The values are the ones the state
// version produced.

import { Profiler, type ReactElement } from 'react';
import { Pressable, StyleSheet, Text, type ViewStyle } from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';
import { Sidebar } from '../sidebar';
import { GenieSurface } from '../dialog/DetailDialogMotion';
import { Context as DialogContext } from '../dialog/context';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import type { SidebarProps } from '../sidebar/types';

function layout(height: number) {
  return { nativeEvent: { layout: { x: 0, y: 0, width: 240, height } } };
}

function counted(element: ReactElement) {
  const commits = { count: 0 };
  const wrap = (child: ReactElement) => (
    <Profiler
      id="measured"
      onRender={() => {
        commits.count++;
      }}
    >
      {child}
    </Profiler>
  );
  return { commits, wrap, initial: wrap(element) };
}

describe('Sidebar content morph', () => {
  const history = (
    <Pressable accessibilityLabel="Conversation">
      <Text>Conversation</Text>
    </Pressable>
  );
  const view = (props: Partial<SidebarProps> = {}) => (
    <BloomThemeProvider fonts={false}>
      <Sidebar
        testID="nav"
        showSearch={false}
        showThemeToggle={false}
        content={history}
        {...props}
      />
    </BloomThemeProvider>
  );
  const morph = (tree: ReturnType<typeof render>) =>
    StyleSheet.flatten(
      tree.getByTestId('nav-content', { includeHiddenElements: true }).props.style,
    ) as ViewStyle;
  const measuredView = (tree: ReturnType<typeof render>) => {
    const inner = tree.getByTestId('nav-content', { includeHiddenElements: true }).children[0];
    if (inner == null || typeof inner === 'string') throw new Error('no measured view');
    return inner;
  };

  it('measuring the content does not re-render the sidebar', () => {
    const { commits, initial } = counted(view());
    const tree = render(initial);
    const before = commits.count;
    act(() => fireEvent(measuredView(tree), 'layout', layout(120)));
    act(() => fireEvent(measuredView(tree), 'layout', layout(180)));
    expect(commits.count).toBe(before);
  });

  it('resolves the same height and margin, unmeasured and measured, expanded and collapsed', () => {
    const tree = render(view());
    // `progress` follows `collapsed` in an effect, so the second render reads
    // it; a fresh `onScroll` gets each render past `memo`.
    const settle = (props: Partial<SidebarProps> = {}) => {
      tree.rerender(view({ ...props, onScroll: () => {} }));
      tree.rerender(view({ ...props, onScroll: () => {} }));
      return morph(tree);
    };
    // Unmeasured: the content keeps its own height while expanded…
    expect(settle()).toMatchObject({ height: null, marginTop: 24 });
    // …and none while collapsed.
    expect(settle({ collapsed: true })).toMatchObject({ height: 0, marginTop: 0 });
    settle();
    act(() => fireEvent(measuredView(tree), 'layout', layout(120)));
    expect(settle()).toMatchObject({ height: 120, marginTop: 24 });
    expect(settle({ collapsed: true })).toMatchObject({ height: 0, marginTop: 0 });
    expect(settle()).toMatchObject({ height: 120, marginTop: 24 });
  });
});

describe('GenieSurface (detail dialog motion)', () => {
  const view = (isClosing: boolean) => (
    <DialogContext.Provider value={{ close: () => {}, isWithinDialog: true, isClosing }}>
      <GenieSurface>
        <Text>Detail</Text>
      </GenieSurface>
    </DialogContext.Provider>
  );
  const surface = (tree: ReturnType<typeof render>) => {
    const host = tree.getByText('Detail').parent?.parent;
    if (host == null) throw new Error('no surface');
    return host;
  };
  const transform = (tree: ReturnType<typeof render>) =>
    (StyleSheet.flatten(surface(tree).props.style) as ViewStyle).transform as Record<
      string,
      number
    >[];

  it('measuring the surface does not re-render it', () => {
    const { commits, initial } = counted(view(false));
    const tree = render(initial);
    const before = commits.count;
    act(() => fireEvent(surface(tree), 'layout', layout(400)));
    expect(commits.count).toBe(before);
  });

  it('closes with the same transform for the measured height (280 until measured)', () => {
    // At the end of the close (progress 1): extension 64, swallow 1, so
    // stretch is 0.001 and translateY is 64 + height * 0.999 / 2.
    const tree = render(view(true));
    expect(transform(tree)[0]?.translateY).toBeCloseTo(64 + (280 * 0.999) / 2, 6);
    expect(transform(tree)[3]?.scaleY).toBeCloseTo(0.001, 9);
    act(() => fireEvent(surface(tree), 'layout', layout(400)));
    tree.rerender(view(true));
    expect(transform(tree)[0]?.translateY).toBeCloseTo(64 + (400 * 0.999) / 2, 6);
    // A zero-height layout falls back to 280, as before.
    act(() => fireEvent(surface(tree), 'layout', layout(0)));
    tree.rerender(view(true));
    expect(transform(tree)[0]?.translateY).toBeCloseTo(64 + (280 * 0.999) / 2, 6);
  });
});
