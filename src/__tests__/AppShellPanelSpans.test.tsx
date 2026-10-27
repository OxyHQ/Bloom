import React from 'react';
import * as Native from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { AppShell, AppShellPanels } from '../app-shell';
import type { AppShellPanelLayout } from '../app-shell';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { AiChatResizeHandle } from '../ai-chat/AiChatResizeHandle';
import { applyPanelSpans, resolvePanelTracks, splitPairSpans } from '../app-shell/panel-layout';
import { panelLayoutCss } from '../app-shell/panel-layout-css';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <BloomThemeProvider mode="light" colorPreset="teal">
    {children}
  </BloomThemeProvider>
);
beforeEach(() =>
  jest
    .spyOn(Native, 'useWindowDimensions')
    .mockReturnValue({ width: 1440, height: 900, scale: 1, fontScale: 1 }),
);
afterEach(() => jest.restoreAllMocks());

const widths = (layout: AppShellPanelLayout, room: number, gap = 7) =>
  resolvePanelTracks(layout, room, 1440, gap).map((track) => track.width);

describe('proportional split weights', () => {
  const split: AppShellPanelLayout = {
    mode: 'split',
    gap: 7,
    panels: [
      { id: 'a', minWidth: 220, resizable: true },
      { id: 'b', minWidth: 220, resizable: true },
      { id: 'c', minWidth: 220 },
    ],
  };

  it('keeps a resized pair’s combined span and divides it by the settled ratio', () => {
    const weights = splitPairSpans(split.panels[0]!, split.panels[1]!, 600, 200);
    expect(weights.a! + weights.b!).toBeCloseTo(2, 10);
    expect(weights.a).toBeCloseTo(1.5, 10);
    expect(splitPairSpans({ id: 'a', span: 2 }, { id: 'b' }, 300, 300)).toEqual({
      a: 1.5,
      b: 1.5,
    });
  });

  it('draws the committed fractions at every region width, as fractions of the free room', () => {
    const layout = applyPanelSpans(split, { a: 2, b: 1, c: 1 });
    for (const room of [1214, 1600, 2414]) {
      const free = room - 2 * 7;
      const [a, b, c] = widths(layout, room);
      expect(a).toBeCloseTo(free * 0.5, 6);
      expect(c).toBeCloseTo(free * 0.25, 6);
      expect(b).toBeCloseTo(free * 0.25, 6);
    }
  });

  it('starts flexible tracks from a zero basis, so minimums do not skew the split', () => {
    expect(
      widths(
        {
          panels: [
            { id: 'a', minWidth: 220 },
            { id: 'b', minWidth: 220 },
          ],
        },
        1007,
      ),
    ).toEqual([500, 500]);
    expect(
      widths(
        {
          panels: [
            { id: 'a', span: 3, minWidth: 220 },
            { id: 'b', minWidth: 220 },
          ],
        },
        607,
      ),
    ).toEqual([380, 220]);
  });

  it('compiles the weights into the CSS flex-grow of each track', () => {
    const css = panelLayoutCss('t', applyPanelSpans(split, { a: 1.25, b: 0.75 }), 7);
    expect(css).toContain('flex:var(--t-panel-grow-0, 1.25) 1 var(--t-panel-size-0, 0px)');
    expect(css).toContain('flex:var(--t-panel-grow-1, 0.75) 1 var(--t-panel-size-1, 0px)');
  });

  it('ignores weights that are not positive and finite', () => {
    const same = applyPanelSpans(split, { a: 0, b: Number.NaN });
    expect(same).toBe(split);
  });
});

describe('resizing a split', () => {
  const measure = (screen: ReturnType<typeof render>, width = 800) =>
    fireEvent(screen.getByTestId('shell-panels'), 'layout', {
      nativeEvent: { layout: { width, height: 600, x: 0, y: 0 } },
    });

  it('commits weights, not pixels, between two flexible tracks (uncontrolled)', () => {
    const onSpansChange = jest.fn();
    const onWidthsChange = jest.fn();
    const onWidthChange = jest.fn();
    const layout: AppShellPanelLayout = {
      gap: 0,
      onSpansChange,
      onWidthsChange,
      panels: [
        { id: 'a', minWidth: 220, resizable: true, onWidthChange },
        { id: 'b', minWidth: 220 },
      ],
    };
    const screen = render(<AppShell testID="shell" panelLayout={layout} />, { wrapper });
    measure(screen);
    fireEvent(screen.UNSAFE_getByType(AiChatResizeHandle), 'nudge', 100);
    expect(onWidthsChange).not.toHaveBeenCalled();
    expect(onSpansChange).toHaveBeenLastCalledWith({ a: 1.25, b: 0.75 });
    expect(onWidthChange).toHaveBeenLastCalledWith(500);
    screen.rerender(<AppShell testID="shell" panelLayout={layout} />);
    fireEvent(screen.UNSAFE_getByType(AiChatResizeHandle), 'nudge', -50);
    expect(onSpansChange).toHaveBeenLastCalledWith({ a: 1.125, b: 0.875 });
  });

  it('keeps a controlled split where its owner puts it', () => {
    const onSpansChange = jest.fn();
    const layout: AppShellPanelLayout = {
      gap: 0,
      spans: { a: 1, b: 1 },
      onSpansChange,
      panels: [
        { id: 'a', minWidth: 220, resizable: true },
        { id: 'b', minWidth: 220 },
      ],
    };
    const screen = render(<AppShell testID="shell" panelLayout={layout} />, { wrapper });
    measure(screen);
    const grip = screen.UNSAFE_getByType(AiChatResizeHandle);
    fireEvent(grip, 'nudge', 100);
    fireEvent(grip, 'nudge', 100);
    expect(onSpansChange).toHaveBeenLastCalledWith({ a: 1.25, b: 0.75 });
  });

  it('keeps pixels for a pair with a fixed width', () => {
    const onSpansChange = jest.fn();
    const onWidthsChange = jest.fn();
    const layout: AppShellPanelLayout = {
      gap: 0,
      onSpansChange,
      onWidthsChange,
      panels: [
        { id: 'a', width: 400, minWidth: 220, resizable: true },
        { id: 'b', minWidth: 220 },
      ],
    };
    const screen = render(<AppShell testID="shell" panelLayout={layout} />, { wrapper });
    measure(screen);
    fireEvent(screen.UNSAFE_getByType(AiChatResizeHandle), 'nudge', 100);
    expect(onSpansChange).not.toHaveBeenCalled();
    expect(onWidthsChange).toHaveBeenCalledWith({ a: 500, b: 300 });
  });

  it('stacks a slot of the split in a local vertical group with the same gap', () => {
    const screen = render(
      <AppShell
        testID="shell"
        panelLayout={{
          gap: 7,
          panels: [
            {
              id: 'left',
              minWidth: 220,
              resizable: true,
              content: <Native.Text>Left</Native.Text>,
            },
            {
              id: 'stack',
              minWidth: 220,
              appearance: 'plain',
              content: (
                <AppShellPanels
                  scope="local"
                  testID="stack"
                  layout={{
                    axis: 'vertical',
                    gap: 7,
                    panels: [
                      {
                        id: 'top',
                        minHeight: 120,
                        resizable: true,
                        content: <Native.Text>Top</Native.Text>,
                      },
                      { id: 'bottom', minHeight: 120, content: <Native.Text>Bottom</Native.Text> },
                    ],
                  }}
                />
              ),
            },
          ],
        }}
      />,
      { wrapper },
    );
    expect(screen.getByText('Left')).toBeTruthy();
    expect(screen.getByText('Top')).toBeTruthy();
    expect(screen.getByText('Bottom')).toBeTruthy();
    expect(screen.UNSAFE_getAllByType(AiChatResizeHandle).length).toBe(2);
  });
});
