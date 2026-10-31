/**
 * The `window` capability (OxyOS ADR 0016): the adapter's window as Bloom
 * reads it (`useWindow`, `useWindowControlsRoom`), the controls Bloom draws
 * where the platform says (`WindowControls`), and the region that moves the
 * window (`WindowDragRegion`). Without the capability every one of them is
 * nothing at all, or a plain `View`.
 *
 * The responder negotiation itself (a child pressable taking the press first)
 * runs in react-native-web's real responder system in
 * `WindowDragRegion.web.test.tsx`.
 */
import type React from 'react';
import { Text } from 'react-native';
import { act, fireEvent, render, renderHook } from '@testing-library/react-native';

import { LocaleProvider } from '../locale';
import { PlatformSurfaceProvider, usePlatformWindow } from '../platform-surface/context';
import type { PlatformSurfaceAdapter } from '../platform-surface/types';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { useTheme } from '../theme/use-theme';
import { SurfacePaint } from '../surface/SurfacePaint';
import {
  useWindow,
  useWindowControlsRoom,
  useWindowSizeLimits,
  WindowControls,
  WindowDragRegion,
} from '../window';
import { WINDOW_DOUBLE_PRESS_MS } from '../window/constants';
import { resolvedStyle } from './support/rendered-style';
import { fakeWindow, WINDOW_METRICS } from './support/fake-window';

function wrapper(adapter: PlatformSurfaceAdapter | null) {
  return ({ children }: { children: React.ReactNode }) => (
    <BloomThemeProvider mode="light" colorPreset="teal">
      <PlatformSurfaceProvider value={adapter}>{children}</PlatformSurfaceProvider>
    </BloomThemeProvider>
  );
}

const NONE: PlatformSurfaceAdapter = { platform: 'test', capabilities: new Set() };

describe('usePlatformWindow', () => {
  it('is null without an adapter or without the capability', () => {
    expect(renderHook(() => usePlatformWindow(), { wrapper: wrapper(null) }).result.current).toBe(
      null,
    );
    expect(renderHook(() => usePlatformWindow(), { wrapper: wrapper(NONE) }).result.current).toBe(
      null,
    );
    // A window the adapter does not report is never used.
    const unreported = { ...NONE, window: fakeWindow().window };
    expect(
      renderHook(() => usePlatformWindow(), { wrapper: wrapper(unreported) }).result.current,
    ).toBe(null);
  });

  it('rejects an adapter that reports the capability without the window', () => {
    const error = jest.spyOn(console, 'error').mockImplementation(() => {});
    const broken: PlatformSurfaceAdapter = { platform: 'test', capabilities: new Set(['window']) };
    expect(() => renderHook(() => usePlatformWindow(), { wrapper: wrapper(broken) })).toThrow(
      /reports 'window' without a window/,
    );
    error.mockRestore();
  });
});

describe('useWindow', () => {
  it('is null without the capability', () => {
    expect(renderHook(() => useWindow(), { wrapper: wrapper(null) }).result.current).toBeNull();
    expect(renderHook(() => useWindow(), { wrapper: wrapper(NONE) }).result.current).toBeNull();
  });

  it("reads the window's state and follows it", () => {
    const { window, adapter } = fakeWindow({ state: { active: false } });
    const { result } = renderHook(() => useWindow(), { wrapper: wrapper(adapter) });
    expect(result.current).toMatchObject({
      active: false,
      maximized: false,
      fullscreen: false,
      controls: 'bloom',
      metrics: WINDOW_METRICS,
    });
    act(() => window.set({ active: true, maximized: true }));
    expect(result.current).toMatchObject({ active: true, maximized: true });
  });

  it('carries the actions to the platform', () => {
    const { window, adapter } = fakeWindow();
    const { result } = renderHook(() => useWindow(), { wrapper: wrapper(adapter) });
    result.current?.close();
    result.current?.minimize();
    result.current?.zoom();
    result.current?.startMove();
    expect(window.close).toHaveBeenCalledTimes(1);
    expect(window.minimize).toHaveBeenCalledTimes(1);
    expect(window.zoom).toHaveBeenCalledTimes(1);
    expect(window.startMove).toHaveBeenCalledTimes(1);
  });

  it('does not re-render for a fresh but equal state object', () => {
    const { window, adapter } = fakeWindow();
    // Every read a new object, as an adapter built on a C struct might do.
    const fresh = { ...window, getState: () => ({ ...window.getState() }) };
    let renders = 0;
    const { result } = renderHook(
      () => {
        renders += 1;
        return useWindow();
      },
      { wrapper: wrapper({ ...adapter, window: fresh }) },
    );
    const first = result.current;
    const settled = renders;
    act(() => window.set({}));
    expect(renders).toBe(settled);
    expect(result.current).toBe(first);
  });
});

describe('useWindowControlsRoom', () => {
  it('is zero without the capability and while full screen', () => {
    expect(
      renderHook(() => useWindowControlsRoom(), { wrapper: wrapper(null) }).result.current,
    ).toEqual({ top: 0, leading: 0 });
    const { window, adapter } = fakeWindow();
    const { result } = renderHook(() => useWindowControlsRoom(), { wrapper: wrapper(adapter) });
    expect(result.current).toEqual({ top: 52, leading: 88 });
    act(() => window.set({ fullscreen: true }));
    expect(result.current).toEqual({ top: 0, leading: 0 });
  });

  it('is kept whoever draws the controls', () => {
    const { adapter } = fakeWindow({ controls: 'platform' });
    expect(
      renderHook(() => useWindowControlsRoom(), { wrapper: wrapper(adapter) }).result.current,
    ).toEqual({ top: 52, leading: 88 });
  });
});

describe('useWindowSizeLimits', () => {
  it('declares the sizes to the platform, follows them, and clears them when it leaves', () => {
    const { window, adapter } = fakeWindow();
    const hook = renderHook(
      (limits: { minWidth: number; minHeight: number }) => useWindowSizeLimits(limits),
      { wrapper: wrapper(adapter), initialProps: { minWidth: 600, minHeight: 380 } },
    );
    expect(window.setSizeLimits).toHaveBeenLastCalledWith({
      minWidth: 600,
      minHeight: 380,
      maxWidth: 0,
      maxHeight: 0,
    });
    // The same sizes again ask nothing more.
    hook.rerender({ minWidth: 600, minHeight: 380 });
    expect(window.setSizeLimits).toHaveBeenCalledTimes(1);
    hook.rerender({ minWidth: 720.4, minHeight: 380 });
    expect(window.setSizeLimits).toHaveBeenLastCalledWith({
      minWidth: 720,
      minHeight: 380,
      maxWidth: 0,
      maxHeight: 0,
    });
    hook.unmount();
    expect(window.setSizeLimits).toHaveBeenLastCalledWith({
      minWidth: 0,
      minHeight: 0,
      maxWidth: 0,
      maxHeight: 0,
    });
  });

  it('asks nothing without the capability or of a platform without limits', () => {
    expect(() =>
      renderHook(() => useWindowSizeLimits({ minWidth: 600 }), { wrapper: wrapper(null) }),
    ).not.toThrow();
    const { window, adapter } = fakeWindow();
    const unlimited: PlatformSurfaceAdapter = {
      ...adapter,
      window: { ...window, setSizeLimits: undefined },
    };
    expect(() =>
      renderHook(() => useWindowSizeLimits({ minWidth: 600 }), { wrapper: wrapper(unlimited) }),
    ).not.toThrow();
    expect(window.setSizeLimits).not.toHaveBeenCalled();
  });

  it('takes no negative, infinite or missing bound as one', () => {
    const { window, adapter } = fakeWindow();
    renderHook(
      () =>
        useWindowSizeLimits({ minWidth: -5, minHeight: Number.POSITIVE_INFINITY, maxWidth: 1600 }),
      { wrapper: wrapper(adapter) },
    );
    expect(window.setSizeLimits).toHaveBeenLastCalledWith({
      minWidth: 0,
      minHeight: 0,
      maxWidth: 1600,
      maxHeight: 0,
    });
  });
});

describe('WindowControls', () => {
  function controls(adapter: PlatformSurfaceAdapter | null, ui = <WindowControls testID="wc" />) {
    return render(ui, { wrapper: wrapper(adapter) });
  }

  it('draws nothing without the capability, where the platform draws them, or full screen', () => {
    for (const adapter of [
      null,
      NONE,
      fakeWindow({ controls: 'platform' }).adapter,
      fakeWindow({ state: { fullscreen: true } }).adapter,
    ]) {
      const screen = controls(adapter);
      expect(screen.queryByTestId('wc')).toBeNull();
      expect(screen.queryByRole('button')).toBeNull();
      screen.unmount();
    }
  });

  it("places three named buttons where the platform's metrics say", () => {
    const screen = controls(fakeWindow().adapter);
    expect(resolvedStyle(screen.getByTestId('wc').props.style)).toMatchObject({
      position: 'absolute',
      top: 16,
      insetInlineStart: 14,
      width: 56,
      height: 20,
    });
    const offsets = ['close', 'minimize', 'zoom'].map((key) => {
      const button = screen.getByTestId(`wc-${key}`);
      expect(button.props.role).toBe('button');
      const style = resolvedStyle(button.props.style);
      expect(style).toMatchObject({ width: 20, height: 20, top: 0 });
      return style.insetInlineStart;
    });
    // 14 px discs 4 apart: centres 18 apart, the first 24 from the leading edge.
    expect(offsets).toEqual([0, 18, 36]);
    expect(screen.getByLabelText('Close')).toBeTruthy();
    expect(screen.getByLabelText('Minimize')).toBeTruthy();
    expect(screen.getByLabelText('Zoom')).toBeTruthy();
  });

  it('spaces the targets across whatever width the platform gives the group', () => {
    const { adapter, window } = fakeWindow();
    const wide = {
      ...adapter,
      window: {
        ...window,
        metrics: { ...WINDOW_METRICS, controls: { ...WINDOW_METRICS.controls, width: 68 } },
      },
    };
    const screen = controls(wide);
    expect(
      ['close', 'minimize', 'zoom'].map(
        (key) => resolvedStyle(screen.getByTestId(`wc-${key}`).props.style).insetInlineStart,
      ),
    ).toEqual([0, 24, 48]);
  });

  it('speaks the locale, and its label props win', () => {
    const { adapter } = fakeWindow();
    const spanish = render(
      <LocaleProvider locale="es">
        <WindowControls zoomLabel="Pantalla completa" />
      </LocaleProvider>,
      { wrapper: wrapper(adapter) },
    );
    expect(spanish.getByLabelText('Cerrar')).toBeTruthy();
    expect(spanish.getByLabelText('Minimizar')).toBeTruthy();
    expect(spanish.getByLabelText('Pantalla completa')).toBeTruthy();
  });

  it('acts on press', () => {
    const { window, adapter } = fakeWindow();
    const screen = controls(adapter);
    fireEvent.press(screen.getByTestId('wc-close'));
    fireEvent.press(screen.getByTestId('wc-minimize'));
    fireEvent.press(screen.getByTestId('wc-zoom'));
    expect(window.close).toHaveBeenCalledTimes(1);
    expect(window.minimize).toHaveBeenCalledTimes(1);
    expect(window.zoom).toHaveBeenCalledTimes(1);
  });

  function discFills(screen: ReturnType<typeof render>) {
    return ['close', 'minimize', 'zoom'].map(
      (key) => resolvedStyle(screen.getByTestId(`wc-${key}-paint`).props.style).backgroundColor,
    );
  }

  it('is red, yellow and green on the active window and neutral on an inactive one', () => {
    let colors: ReturnType<typeof useTheme>['colors'] | null = null;
    function Colors() {
      colors = useTheme().colors;
      return null;
    }
    const { window, adapter } = fakeWindow();
    const screen = render(
      <>
        <Colors />
        <WindowControls testID="wc" />
      </>,
      { wrapper: wrapper(adapter) },
    );
    const { paint } = { paint: discFills(screen) };
    const theme = colors as unknown as ReturnType<typeof useTheme>['colors'];
    // The material tints each fill (`resolveSurfaceTint`), so compare against
    // the same tint of the error, warning and success tokens.
    const tinted = (fill: string) => {
      const probe = render(<SurfacePaint fill={fill} testID="probe" />, { wrapper: wrapper(null) });
      const value = resolvedStyle(probe.getByTestId('probe').props.style).backgroundColor;
      probe.unmount();
      return value;
    };
    expect(paint).toEqual([tinted(theme.error), tinted(theme.warning), tinted(theme.success)]);
    act(() => window.set({ active: false }));
    const neutral = tinted(theme.backgroundTertiary);
    expect(discFills(screen)).toEqual([neutral, neutral, neutral]);
  });

  it('shows the symbols while the pointer is over the group', () => {
    const screen = controls(fakeWindow().adapter);
    // Decorative: hidden from the accessibility tree, so the query must include it.
    const symbol = () => screen.getByTestId('wc-close-symbol', { includeHiddenElements: true });
    expect(resolvedStyle(symbol()?.props.style).opacity).toBe(0);
    fireEvent(screen.getByTestId('wc-group'), 'pointerEnter');
    expect(resolvedStyle(symbol()?.props.style).opacity).toBe(1);
    fireEvent(screen.getByTestId('wc-group'), 'pointerLeave');
    expect(resolvedStyle(symbol()?.props.style).opacity).toBe(0);
  });

  it('floats on a glass plate over full-bleed content', () => {
    const screen = controls(fakeWindow().adapter, <WindowControls testID="wc" plate />);
    expect(resolvedStyle(screen.getByTestId('wc').props.style)).toMatchObject({
      top: 10,
      insetInlineStart: 8,
      width: 68,
      height: 32,
      borderRadius: 16,
    });
    expect(resolvedStyle(screen.getByTestId('wc-group').props.style)).toMatchObject({
      top: 6,
      insetInlineStart: 6,
    });
  });
});

describe('WindowDragRegion', () => {
  function region(adapter: PlatformSurfaceAdapter | null) {
    return render(
      <WindowDragRegion testID="drag" style={{ height: 40 }}>
        <Text>Title</Text>
      </WindowDragRegion>,
      { wrapper: wrapper(adapter) },
    );
  }

  it('is a plain view without the capability, and while full screen', () => {
    for (const adapter of [null, NONE, fakeWindow({ state: { fullscreen: true } }).adapter]) {
      const screen = region(adapter);
      const node = screen.getByTestId('drag');
      expect(node.props.onStartShouldSetResponder).toBeUndefined();
      expect(node.props.onResponderGrant).toBeUndefined();
      expect(resolvedStyle(node.props.style)).toEqual({ height: 40 });
      screen.unmount();
    }
  });

  it('asks for presses in the bubble phase only, so the views inside answer first', () => {
    const screen = region(fakeWindow().adapter);
    const node = screen.getByTestId('drag');
    expect(node.props.onStartShouldSetResponder()).toBe(true);
    expect(node.props.onStartShouldSetResponderCapture).toBeUndefined();
    expect(node.props.onResponderTerminationRequest()).toBe(true);
  });

  it('starts a move on a press and zooms on a double press', () => {
    const now = jest.spyOn(Date, 'now');
    const { window, adapter } = fakeWindow();
    const screen = region(adapter);
    const press = (at: number) => {
      now.mockReturnValue(at);
      fireEvent(screen.getByTestId('drag'), 'responderGrant');
    };
    press(1000);
    expect(window.startMove).toHaveBeenCalledTimes(1);
    press(1000 + WINDOW_DOUBLE_PRESS_MS);
    expect(window.zoom).toHaveBeenCalledTimes(1);
    expect(window.startMove).toHaveBeenCalledTimes(1);
    // A third press is a new first press, not a second double.
    press(1100 + WINDOW_DOUBLE_PRESS_MS);
    expect(window.startMove).toHaveBeenCalledTimes(2);
    expect(window.zoom).toHaveBeenCalledTimes(1);
    // Too far apart: two moves.
    press(5000);
    expect(window.startMove).toHaveBeenCalledTimes(3);
    expect(window.zoom).toHaveBeenCalledTimes(1);
    now.mockRestore();
  });
});
