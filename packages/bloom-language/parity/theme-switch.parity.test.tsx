/**
 * A theme switch under Bloom's real provider. A tree reads the theme once,
 * where it starts, and every node of it paints from that read, so a switch
 * must repaint every node: one that kept its identity, a `view()` body, a
 * list's rows and a dialog's content (a tree of its own) included. A tree
 * switched to dark draws what the tree mounted dark draws, host for host, and
 * a switch re-renders each tree once.
 */
import { useState } from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { RiHeart3Line } from '@oxy.so/bloom/icons';
import { BloomThemeProvider } from '@oxy.so/bloom/theme';

import type { Child } from '../src/node';
import * as L from '../src/index';
import { toElement } from '../src/render';
import { view } from '../src/view';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

type Mode = 'light' | 'dark';

const rowBody = jest.fn((props: { title: string }) =>
  L.HStack(L.Icon(RiHeart3Line).foreground('primary'), L.Text(props.title).foreground('muted'))
    .padding('sm')
    .background('surface'),
);
const Row = view(rowBody);

/** A node that keeps its identity across renders: what a theme switch must still repaint. */
const KEPT = L.VStack(L.Text('kept').foreground('primary')).padding('xs').background('surface');

const ITEMS = ['a', 'b'];
const languageRow = ({ item }: { item: string }) => L.Text(item).foreground('primary');
const rootRow = ({ item }: { item: string }) =>
  toElement(L.Text(item).foreground('muted').padding('xs'));

const TREES: [string, () => Child][] = [
  ['painted views, a kept node and a view() body', () => L.VStack(KEPT, Row({ title: 'row' }))],
  [
    'a pressable on a painted background',
    () =>
      L.VStack(L.Text('press'))
        .background('primary')
        .onPress(() => {}),
  ],
  ['a nested root', () => L.VStack(L.Embed(toElement(L.Text('nested').foreground('primary'))))],
  ['a list of views', () => L.VirtualList(ITEMS, languageRow).itemKey(String)],
  ['a list of roots', () => L.VirtualList(ITEMS, rootRow).itemKey(String)],
  [
    'a dialog’s content',
    () =>
      L.Text('opens').dialog(
        [true, () => {}],
        L.Dialog(L.Text('inside').foreground('primary').padding('md').background('surface')).title(
          'Dialog',
        ),
      ),
  ],
];

interface Switch {
  to: (mode: Mode) => void;
}
function Switchable({ initial, build, at }: { initial: Mode; build: () => Child; at: Switch }) {
  const [mode, setMode] = useState<Mode>(initial);
  at.to = setMode;
  return (
    <BloomThemeProvider fonts={false} mode={mode}>
      {toElement(build())}
    </BloomThemeProvider>
  );
}

function mounted(
  initial: Mode,
  build: () => Child,
): { renderer: TestRenderer.ReactTestRenderer; drawn: () => string; to: (mode: Mode) => void } {
  const at: Switch = { to: () => {} };
  let renderer!: TestRenderer.ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(<Switchable initial={initial} build={build} at={at} />);
  });
  return {
    renderer,
    // A presentation's entrance (a dialog's) is where it has got to, and an id
    // React's `useId` gave is its mount's: neither is what it paints.
    drawn: () =>
      JSON.stringify(renderer.toJSON(), (key, value) =>
        key === 'transform' ? undefined : value,
      ).replace(/_r_\w+_/g, 'id'),
    to: (mode) => act(() => at.to(mode)),
  };
}

describe('a theme switch repaints every node a tree drew', () => {
  beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  it.each(TREES)('%s', (_name, build) => {
    const switched = mounted('light', build);
    const light = switched.drawn();
    switched.to('dark');
    const dark = mounted('dark', build);
    expect(switched.drawn()).not.toBe(light);
    expect(switched.drawn()).toBe(dark.drawn());
    switched.to('light');
    expect(switched.drawn()).toBe(light);
    act(() => switched.renderer.unmount());
    act(() => dark.renderer.unmount());
  });

  it('re-renders a view() body once per switch', () => {
    const tree = mounted('light', () => L.VStack(Row({ title: 'once' })));
    const before = rowBody.mock.calls.length;
    tree.to('dark');
    expect(rowBody.mock.calls.length - before).toBe(1);
    act(() => tree.renderer.unmount());
  });
});
