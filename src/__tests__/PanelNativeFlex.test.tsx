import { View } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import { AppShell } from '../app-shell';
import { splitPairSpans } from '../app-shell/panel-layout';
import type { AppShellPanelLayout } from '../app-shell/panel-layout-types';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { findHost, type HostNode } from './support/rendered-style';
import { mockWindowSize } from './support/window-size';
import { createYogaHostRenderer } from './support/yoga-host-tree';

let yoga: ReturnType<typeof createYogaHostRenderer>;
beforeAll(() => {
  yoga = createYogaHostRenderer();
}, 120_000);
afterAll(() => yoga?.dispose());
afterEach(() => jest.restoreAllMocks());

const panel = (id: string, extra: Partial<AppShellPanelLayout['panels'][number]> = {}) => ({
  id,
  content: <View />,
  ...extra,
});

const LAYOUTS: Record<string, AppShellPanelLayout> = {
  'a fixed list beside a flexible detail': {
    mode: 'split',
    gap: 8,
    panels: [panel('list', { width: 340 }), panel('detail')],
  },
  'two flexible tracks by their spans, one bounded': {
    mode: 'split',
    gap: 12,
    panels: [panel('a', { span: 2, minWidth: 200 }), panel('b', { maxWidth: 380 })],
  },
  'two flexible tracks with unequal minimum constraints': {
    mode: 'split',
    gap: 8,
    panels: [panel('a', { minWidth: 560 }), panel('b', { minWidth: 120 })],
  },
  'three tracks: fixed, flexible, fixed with a minimum': {
    mode: 'split',
    gap: 8,
    panels: [
      panel('nav', { width: 260 }),
      panel('main'),
      panel('side', { width: 300, minWidth: 240 }),
    ],
  },
};

/** The rendered tree with its root at `width`, as the window resized lays it out. */
function atWidth(tree: HostNode, width: number): HostNode {
  return { ...tree, props: { ...tree.props, style: [tree.props.style, { width }] } };
}

describe.each(Object.entries(LAYOUTS))('%s', (_, layout) => {
  it.each([1440, 1280, 1180, 1100, 1000])(
    'Yoga fills available space within constraints at %i without another React render',
    (width) => {
      mockWindowSize({ width, height: 900 });
      const ui = (
        <BloomThemeProvider mode="light" colorPreset="teal">
          <View testID="root" style={{ width, height: 900 }}>
            <AppShell testID="shell" contentMaxWidth="none" panelLayout={layout} />
          </View>
        </BloomThemeProvider>
      );
      const screen = render(ui);
      // The group's size as Yoga lays it out, told to it as a layout would.
      const first = yoga.layout(findHost(screen.toJSON(), 'root')!);
      const group = first.get('shell-panels')!;
      fireEvent(screen.getByTestId('shell-panels'), 'layout', {
        nativeEvent: { layout: { x: 0, y: 0, width: group.width, height: group.height } },
      });
      const tree = findHost(screen.toJSON(), 'root')!;
      // The window a few pixels either way, the same tree: no breakpoint of the
      // layout lies so close, so React would not redraw for it.
      for (const resized of [width, width - 6, width + 6]) {
        const boxes = yoga.layout(atWidth(tree, resized));
        const room = boxes.get('shell-panels')!.width;
        const panelBoxes = layout.panels.map((definition) => {
          const box = boxes.get(`shell-panels-${definition.id}`);
          expect(box).toBeDefined();
          if (!box) throw new Error(`Missing panel ${definition.id}`);
          expect(box.width).toBeGreaterThanOrEqual((definition.minWidth ?? 0) - 0.5);
          expect(box.width).toBeLessThanOrEqual((definition.maxWidth ?? Infinity) + 0.5);
          if (definition.width !== undefined) expect(box.width).toBeCloseTo(definition.width, 0);
          return box;
        });
        const used =
          panelBoxes.reduce((sum, box) => sum + box.width, 0) +
          (layout.panels.length - 1) * (layout.gap ?? 8);
        expect(used).toBeCloseTo(room, 0);
      }
    },
  );
});

it.each([240, 120])(
  'keeps a gesture result of %i after committing native split weights',
  (desired) => {
    const spans = splitPairSpans(
      { id: 'main', minWidth: 120 },
      { id: 'likes', minWidth: 120 },
      800 - desired,
      desired,
      true,
    );
    const boxes = yoga.layout({
      type: 'View',
      props: { testID: 'group', style: { width: 400, height: 800, flexDirection: 'column' } },
      children: [
        {
          type: 'View',
          props: {
            testID: 'main',
            style: { flexGrow: spans.main, flexShrink: 1, height: 0, minHeight: 120 },
          },
          children: [],
        },
        {
          type: 'View',
          props: {
            testID: 'likes',
            style: { flexGrow: spans.likes, flexShrink: 1, height: 0, minHeight: 120 },
          },
          children: [],
        },
      ],
    });
    expect(boxes.get('likes')!.height).toBeCloseTo(desired, 0);
    expect(boxes.get('main')!.height).toBeCloseTo(800 - desired, 0);
  },
);
