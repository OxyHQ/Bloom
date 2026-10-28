import React from 'react';
import * as Native from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';
import { AppShell } from '../app-shell';
import type { AppShellPanelDrop, AppShellPanelLayout } from '../app-shell';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

const HIDDEN = { includeHiddenElements: true } as const;
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <BloomThemeProvider mode="dark" colorPreset="teal">
    {children}
  </BloomThemeProvider>
);
const RECTS: Record<string, [number, number, number, number]> = {
  a: [0, 0, 600, 800],
  b: [607, 0, 600, 800],
};
const createNodeMock = (element: React.ReactElement) => {
  const testID = (element.props as { testID?: string }).testID ?? '';
  const id = testID.startsWith('bloom-panel-drop-zones-')
    ? testID.slice('bloom-panel-drop-zones-'.length)
    : null;
  return {
    measureInWindow: (callback: (x: number, y: number, w: number, h: number) => void) => {
      if (id && RECTS[id]) callback(...RECTS[id]);
    },
  };
};
beforeEach(() => {
  jest.useFakeTimers();
  jest
    .spyOn(Native, 'useWindowDimensions')
    .mockReturnValue({ width: 1440, height: 900, scale: 1, fontScale: 1 });
});
afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

const layout = (drop: AppShellPanelDrop): AppShellPanelLayout => ({
  gap: 7,
  drop,
  panels: [
    { id: 'a', minWidth: 220, content: <Native.Text>A</Native.Text> },
    { id: 'b', minWidth: 220, content: <Native.Text>B</Native.Text> },
  ],
});
const lay = (screen: ReturnType<typeof render>) => {
  fireEvent(screen.getByTestId('shell-panels'), 'layout', {
    nativeEvent: { layout: { width: 1207, height: 800, x: 0, y: 0 } },
  });
  for (const id of ['a', 'b']) {
    const overlay = screen.queryByTestId(`bloom-panel-drop-zones-${id}`, HIDDEN);
    if (overlay)
      fireEvent(overlay, 'layout', {
        nativeEvent: { layout: { width: 600, height: 800, x: 0, y: 0 } },
      });
  }
};
const stages = (screen: ReturnType<typeof render>) =>
  screen
    .UNSAFE_queryAllByProps({ testID: 'bloom-panel-drop-start' })
    .concat(screen.UNSAFE_queryAllByProps({ testID: 'bloom-panel-drop-end' }))
    .filter((node) => typeof node.type === 'string' || node.props.dataSet)
    .map((node) => node.props.dataSet?.bloomPanelDropStage)
    .filter(Boolean);

describe('panel drop zones', () => {
  it('draw nothing until a drag is active', () => {
    const screen = render(<AppShell testID="shell" panelLayout={layout({ active: false })} />, {
      wrapper,
      createNodeMock,
    });
    expect(screen.queryByTestId('bloom-panel-drop-zones-a', HIDDEN)).toBeNull();
  });

  it('slide in resting, grow, and resolve the target under the drag', () => {
    const onTargetChange = jest.fn();
    const drop = (point: { x: number; y: number } | null): AppShellPanelDrop => ({
      active: true,
      point,
      onTargetChange,
    });
    const screen = render(
      <AppShell testID="shell" panelLayout={layout(drop({ x: 300, y: 400 }))} />,
      { wrapper, createNodeMock },
    );
    lay(screen);
    expect(new Set(stages(screen))).toEqual(new Set(['rest']));
    expect(onTargetChange).not.toHaveBeenCalled();
    act(() => jest.advanceTimersByTime(200));
    expect(new Set(stages(screen))).toEqual(new Set(['grown']));
    screen.rerender(<AppShell testID="shell" panelLayout={layout(drop({ x: 620, y: 400 }))} />);
    expect(onTargetChange).toHaveBeenLastCalledWith({ panelId: 'b', edge: 'start' });
    expect(stages(screen).filter((stage) => stage === 'active')).toHaveLength(1);
    expect(screen.getAllByText('Add left split', HIDDEN).length).toBe(2);
    screen.rerender(<AppShell testID="shell" panelLayout={layout(drop({ x: 300, y: 400 }))} />);
    expect(onTargetChange).toHaveBeenLastCalledWith(null);
  });

  it('only offers the panels that accept the drop', () => {
    const screen = render(
      <AppShell
        testID="shell"
        panelLayout={layout({ active: true, point: { x: 40, y: 400 }, panels: ['b'] })}
      />,
      { wrapper, createNodeMock },
    );
    lay(screen);
    const zones = (id: string) =>
      screen
        .getByTestId(`bloom-panel-drop-zones-${id}`, HIDDEN)
        .findAll((node) => node.props.dataSet?.bloomPanelDrop !== undefined);
    expect(zones('a')).toHaveLength(0);
    expect(zones('b').length).toBeGreaterThan(0);
  });

  it('use the caller’s labels', () => {
    const screen = render(
      <AppShell
        testID="shell"
        panelLayout={layout({ active: true, labels: { start: 'Open beside', end: 'Open after' } })}
      />,
      { wrapper, createNodeMock },
    );
    lay(screen);
    expect(screen.getAllByText('Open beside', HIDDEN).length).toBe(2);
    expect(screen.getAllByText('Open after', HIDDEN).length).toBe(2);
  });

  it('paint a translucent target as a translucent pane over the page when asked (dark)', () => {
    const fills = (appearance?: 'translucent') => {
      const screen = render(
        <AppShell
          testID="shell"
          panelLayout={layout({ active: true, ...(appearance ? { appearance } : {}) })}
        />,
        { wrapper, createNodeMock },
      );
      lay(screen);
      const zone = screen.UNSAFE_queryAllByProps({ testID: 'bloom-panel-drop-start' })[0]!;
      const flat = ([] as unknown[]).concat(zone.props.style).flat(3) as Record<string, unknown>[];
      const paint = Object.assign({}, ...flat.filter(Boolean));
      screen.unmount();
      return paint;
    };
    expect(fills('translucent')).toMatchObject({
      backgroundColor: 'rgba(255, 236, 214, 0.04)',
      borderColor: 'rgba(255, 255, 255, 0.08)',
    });
    expect(fills().backgroundColor).not.toBe('rgba(255, 236, 214, 0.04)');
  });
});
