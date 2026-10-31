import { View } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import { AppShell } from '../app-shell';
import { resolvePanelTracks } from '../app-shell/panel-layout';
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
  'two flexible tracks, one held at its minimum in the narrower rooms': {
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
    'Yoga gives each track the model size at %i, and across a resize React does not redraw',
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
        const model = resolvePanelTracks(layout, room, resized, layout.gap ?? 8);
        for (const track of model) {
          const box = boxes.get(`shell-panels-${track.id}`);
          expect({ id: track.id, width: Math.round(box!.width * 2) / 2 }).toEqual({
            id: track.id,
            width: Math.round(track.width * 2) / 2,
          });
        }
      }
    },
  );
});
