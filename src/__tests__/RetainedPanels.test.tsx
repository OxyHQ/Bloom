/**
 * `panelLayout.retain` on native: a panel's content mounts once and stays
 * mounted, whatever happens to the panels' order, stacks or visibility.
 */
import React, { useEffect } from 'react';
import * as ReactNative from 'react-native';
import { act, render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { PortalOutlet, PortalProvider } from '../portal';
import { AppShell } from '../app-shell';
import type { AppShellPanelDefinition } from '../app-shell/panel-layout-types';
import { resolvedStyle } from './support/rendered-style';
import { ResizeHandle } from '../layout/ResizeHandle';

const mounts: Record<string, number> = {};
const unmounts: Record<string, number> = {};
function Page({ id }: { id: string }) {
  useEffect(() => {
    mounts[id] = (mounts[id] ?? 0) + 1;
    return () => {
      unmounts[id] = (unmounts[id] ?? 0) + 1;
    };
  }, [id]);
  return <Text>{id}</Text>;
}

function ui(
  panels: Omit<AppShellPanelDefinition, 'content'>[],
  spans?: Record<string, number>,
  onSpansChange?: (spans: Readonly<Record<string, number>>) => void,
) {
  return (
    <BloomThemeProvider mode="light">
      <PortalProvider>
        <AppShell
          testID="shell"
          variant="feed"
          scroll="fixed"
          header={null}
          contentMaxWidth="none"
          panelLayout={{
            mode: 'split',
            flow: 'bounded',
            retain: true,
            gap: 7,
            spans,
            onSpansChange,
            resizeHandle: 'pill',
            panels: panels.map((panel) => ({ ...panel, content: <Page id={panel.id} /> })),
          }}
        />
        <PortalOutlet />
      </PortalProvider>
    </BloomThemeProvider>
  );
}

const style = (screen: ReturnType<typeof render>, id: string) =>
  resolvedStyle(
    screen.getByTestId(`shell-panels-retained-${id}`, { includeHiddenElements: true }).props.style,
  );

beforeEach(() => {
  for (const key of Object.keys(mounts)) delete mounts[key];
  for (const key of Object.keys(unmounts)) delete unmounts[key];
  jest
    .spyOn(ReactNative, 'useWindowDimensions')
    .mockReturnValue({ width: 1280, height: 800, scale: 1, fontScale: 1 });
});
afterEach(() => jest.restoreAllMocks());

describe('retained panels (native)', () => {
  it('mounts each panel once across reorders, stacks, hiding and showing', () => {
    const screen = render(ui([{ id: 'a' }, { id: 'b' }, { id: 'c' }]));
    act(() => screen.rerender(ui([{ id: 'c' }, { id: 'b' }, { id: 'a' }])));
    act(() => screen.rerender(ui([{ id: 'a' }, { id: 'b', stack: 's' }, { id: 'c', stack: 's' }])));
    act(() => screen.rerender(ui([{ id: 'a', visible: false }, { id: 'b' }, { id: 'c' }])));
    act(() => screen.rerender(ui([{ id: 'b' }, { id: 'a' }, { id: 'c', visible: false }])));
    expect(mounts).toEqual({ a: 1, b: 1, c: 1 });
    expect(unmounts).toEqual({});
  });

  it('places panels by fractions and fixed offsets, and keeps a hidden one at full size', () => {
    const screen = render(
      ui([{ id: 'a' }, { id: 'b', visible: false }, { id: 'c' }], { a: 3, c: 1 }),
    );
    expect(style(screen, 'a')).toMatchObject({
      position: 'absolute',
      insetInlineStart: '0%',
      marginInlineStart: 0,
      insetInlineEnd: '25%',
      marginInlineEnd: 5.25,
    });
    expect(style(screen, 'c')).toMatchObject({ insetInlineStart: '75%', marginInlineStart: 1.75 });
    expect(style(screen, 'b')).toMatchObject({
      position: 'absolute',
      top: 0,
      bottom: 0,
      insetInlineStart: 0,
      insetInlineEnd: 0,
      opacity: 0,
    });
    const hidden = screen.getByTestId('shell-panels-retained-b', { includeHiddenElements: true });
    expect(hidden.props.pointerEvents).toBe('none');
    expect(hidden.props.importantForAccessibility).toBe('no-hide-descendants');
  });

  it('keeps a hidden panel painted behind the shown ones when asked', () => {
    const screen = render(
      ui([{ id: 'a' }, { id: 'b', visible: false, hiddenPresentation: 'behind' }]),
    );
    const behind = style(screen, 'b');
    expect(behind).toMatchObject({ position: 'absolute', top: 0, bottom: 0, zIndex: 0 });
    expect(behind.opacity).toBeUndefined();
    expect(style(screen, 'a')).toMatchObject({ zIndex: 1 });
    const hidden = screen.getByTestId('shell-panels-retained-b', { includeHiddenElements: true });
    expect(hidden.props.pointerEvents).toBe('none');
    expect(hidden.props.importantForAccessibility).toBe('no-hide-descendants');
  });

  it('commits proportional spans from a divider against where the drag began, within its minimum', () => {
    const changes: Readonly<Record<string, number>>[] = [];
    function Harness() {
      const [spans, setSpans] = React.useState<Readonly<Record<string, number>>>({ a: 1, b: 1 });
      return ui(
        [
          { id: 'a', resizable: true, minWidth: 220 },
          { id: 'b', minWidth: 220 },
        ],
        spans as Record<string, number>,
        (next) => {
          changes.push(next);
          setSpans(next);
        },
      );
    }
    const screen = render(<Harness />);
    act(() =>
      screen
        .getByTestId('shell-panels-retained')
        .props.onLayout({ nativeEvent: { layout: { x: 0, y: 0, width: 1007, height: 800 } } }),
    );
    const handle = () => screen.UNSAFE_getByType(ResizeHandle);
    const share = () => {
      const last = changes[changes.length - 1]!;
      return (last.a! / (last.a! + last.b!)) * 1000;
    };
    act(() => handle().props.onResizeStart());
    act(() => handle().props.onResize(75));
    act(() => handle().props.onResize(150));
    expect(share()).toBeCloseTo(650, 6);
    act(() => handle().props.onResize(-900));
    expect(share()).toBeCloseTo(220, 6);
    act(() => handle().props.onResizeEnd());
  });
});
