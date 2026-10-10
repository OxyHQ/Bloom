import React from 'react';
import { OverlayRoot } from '../overlay';
import { SurfaceLevelProvider, useSurfaceFill } from '../styles/surface-levels';
import { useTheme } from '../theme/use-theme';
import { BloomScope, useBloomAppearance } from '../appearance';
import { Keyboard, Platform, View } from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { Screen, ScreenScrollView, useScreen } from '../screen';
import type { ScreenContextValue } from '../screen/context';
import { resolvedStyle } from './support/rendered-style';

function wrap(children: React.ReactNode) { return <BloomThemeProvider fonts={false}>{children}</BloomThemeProvider>; }

it('reserves measured chrome once and preserves consumer content padding', () => {
  const tree = render(wrap(<Screen testID="screen" header={<View />} bottomBar={<View />}><ScreenScrollView testID="scroll" contentContainerStyle={{ paddingTop: 8, paddingBottom: 12 }} /></Screen>));
  fireEvent(tree.getByTestId('screen-header'), 'layout', { nativeEvent: { layout: { height: 70 } } });
  fireEvent(tree.getByTestId('screen-bottom'), 'layout', { nativeEvent: { layout: { height: 92 } } });
  expect(resolvedStyle(tree.getByTestId('scroll').props.contentContainerStyle)).toMatchObject({ paddingTop: 78, paddingBottom: 120 });
});

it('isolates nested motion contexts and only registers the active scroller', () => {
  const states: Record<string, ScreenContextValue> = {};
  function Probe({ id }: { id: string }) { states[id] = useScreen(); return null; }
  const tree = render(wrap(<Screen><Probe id="outer" /><ScreenScrollView active={false} /><Screen><Probe id="inner" /><ScreenScrollView /></Screen></Screen>));
  expect(states.outer!.activeScrollerId.value).toBeNull();
  expect(states.inner!.activeScrollerId.value).not.toBeNull();
  expect(states.outer!.collapseProgress).not.toBe(states.inner!.collapseProgress);
  tree.unmount();
  expect(states.inner!.activeScrollerId.value).toBeNull();
});

it('keeps pending restored content laid out and forwards the scroll ref', () => {
  const ref = React.createRef<import('react-native').ScrollView>();
  const tree = render(wrap(<Screen><ScreenScrollView ref={ref} testID="restored" restoration={{ onScroll: jest.fn(), restorePending: true }} style={{ flex: 1 }} /></Screen>));
  expect(resolvedStyle(tree.getByTestId('restored').props.style)).toMatchObject({ opacity: 0, flex: 1 });
  expect(resolvedStyle(tree.getByTestId('restored').props.style).display).toBeUndefined();
});

it('seeds custom chrome footprints before any layout and positions a standalone action', () => {
  const tree = render(wrap(<Screen testID="screen" header={<View />} primaryAction={<View testID="action" />} headerHeight={88} bottomBarHeight={96}><ScreenScrollView testID="scroll" /></Screen>));
  expect(resolvedStyle(tree.getByTestId('scroll').props.contentContainerStyle)).toMatchObject({ paddingTop: 88, paddingBottom: 112 });
  expect(tree.getByTestId('action')).toBeTruthy();
});

it('deactivates all retained screen scroll writers at the scope boundary', () => {
  let state: ScreenContextValue | undefined;
  function Probe() { state = useScreen(); return null; }
  const ui = (active: boolean) => wrap(<Screen active={active}><Probe /><ScreenScrollView /></Screen>);
  const tree = render(ui(true));
  expect(state?.activeScrollerId.value).not.toBeNull();
  tree.rerender(ui(false));
  expect(state?.activeScrollerId.value).toBeNull();
  tree.rerender(ui(true));
  expect(state?.activeScrollerId.value).not.toBeNull();
});

it('removes bottom chrome and its reserved footprint while the keyboard is visible', () => {
  const handlers: Record<string, () => void> = {};
  const originalOS = Platform.OS;
  Object.defineProperty(Platform, 'OS', { configurable: true, value: 'ios' });
  const originalListener = Keyboard.addListener;
  Keyboard.addListener = (name, callback) => {
    handlers[name] = callback as () => void;
    return { remove: jest.fn() } as unknown as ReturnType<typeof Keyboard.addListener>;
  };
  try {
    const tree = render(wrap(<Screen testID="screen" primaryAction={<View testID="action" />} bottomBarHeight={96}><ScreenScrollView testID="scroll" /></Screen>));
    act(() => handlers.keyboardDidShow?.());
    expect(tree.queryByTestId('action')).toBeNull();
    expect(resolvedStyle(tree.getByTestId('scroll').props.contentContainerStyle).paddingBottom).toBe(16);
    act(() => handlers.keyboardDidHide?.());
    expect(tree.getByTestId('action')).toBeTruthy();
    expect(resolvedStyle(tree.getByTestId('scroll').props.contentContainerStyle).paddingBottom).toBe(112);
    tree.unmount();
  } finally {
    Keyboard.addListener = originalListener;
    Object.defineProperty(Platform, 'OS', { configurable: true, value: originalOS });
  }
});

it('inherits shell navigation motion while keeping route offsets local and modal motion isolated', () => {
  const states: Record<string, ScreenContextValue> = {};
  function Probe({ id }: { id: string }) { states[id] = useScreen(); return null; }
  render(wrap(<Screen navigationScope="shared" bottomBar={<View />} bottomBarHeight={96}><Probe id="shell" /><Screen active={false}><Probe id="background" /><ScreenScrollView /></Screen><Screen><Probe id="route" /><ScreenScrollView /></Screen><Screen navigationScope="isolated"><Probe id="modal" /></Screen></Screen>));
  expect(states.route!.collapseProgress).toBe(states.shell!.collapseProgress);
  expect(states.route!.scrollY).not.toBe(states.shell!.scrollY);
  expect(states.route!.bottomInset).toBe(112);
  expect(states.modal!.collapseProgress).not.toBe(states.shell!.collapseProgress);
  act(() => { states.route!.collapseProgress.value = 1; });
  expect(states.shell!.collapseProgress.value).toBe(1);
  expect(states.modal!.collapseProgress.value).toBe(0);
  expect(states.background!.active).toBe(false);
  expect(states.shell!.activeScrollerId.value).not.toBeNull();
});

it('keeps retained shell descendants inactive even if their own active prop defaults to true', () => {
  let route: ScreenContextValue | undefined;
  function Probe() { route = useScreen(); return null; }
  render(wrap(<Screen navigationScope="shared" active={false}><Screen><Probe /><ScreenScrollView /></Screen></Screen>));
  expect(route?.active).toBe(false);
  expect(route?.activeScrollerId.value).toBeNull();
});

it('starts without inherited bottom clearance when mounted while the native keyboard is open', () => {
  const originalOS = Platform.OS;
  const originalVisible = Keyboard.isVisible;
  Object.defineProperty(Platform, 'OS', { configurable: true, value: 'ios' });
  Keyboard.isVisible = () => true;
  try {
    const tree = render(wrap(<Screen navigationScope="shared" bottomBar={<View testID="bar" />} bottomBarHeight={96}><Screen><ScreenScrollView testID="nested-scroll" /></Screen></Screen>));
    expect(tree.queryByTestId('bar')).toBeNull();
    expect(resolvedStyle(tree.getByTestId('nested-scroll').props.contentContainerStyle).paddingBottom).toBe(16);
    tree.unmount();
  } finally {
    Keyboard.isVisible = originalVisible;
    Object.defineProperty(Platform, 'OS', { configurable: true, value: originalOS });
  }
});


it('isolates overlay screen motion from its trigger screen without losing the visual theme', () => {
  const states: Record<string, ScreenContextValue> = {};
  const colors: Record<string, string> = {};
  const sizes: Record<string, string> = {};
  function Probe({ id }: { id: string }) { states[id] = useScreen(); colors[id] = useTheme().colors.background; sizes[id] = useBloomAppearance({}, { size: 'md', tone: 'neutral' }).size; return null; }
  render(wrap(<BloomScope size="sm"><Screen navigationScope="shared" active={false}><Probe id="background" /><OverlayRoot><Screen><Probe id="overlay" /></Screen></OverlayRoot></Screen></BloomScope>));
  expect(states.overlay!.active).toBe(true);
  expect(colors.overlay).toBe(colors.background);
  expect(sizes.overlay).toBe('sm');
  expect(states.overlay!.collapseProgress).not.toBe(states.background!.collapseProgress);
  act(() => { states.overlay!.collapseProgress.value = 1; });
  expect(states.background!.collapseProgress.value).toBe(0);
});


it.each(['light', 'dark'] as const)('paints the inherited surface on %s screens, with caller overrides preserved', mode => {
  let inherited: string | undefined;
  function Probe() { inherited = useSurfaceFill(); return null; }
  const tree = render(<BloomThemeProvider fonts={false} mode={mode}><SurfaceLevelProvider level={1} fill="#334455"><Screen testID="screen"><Probe /></Screen><Screen testID="override" style={{ backgroundColor: '#123456' }} /></SurfaceLevelProvider><Screen testID="standalone" /></BloomThemeProvider>);
  expect(resolvedStyle(tree.getByTestId('screen').props.style).backgroundColor).toBe(inherited);
  expect(inherited).toBe('#334455');
  expect(resolvedStyle(tree.getByTestId('override').props.style).backgroundColor).toBe('#123456');
  expect(resolvedStyle(tree.getByTestId('standalone').props.style).backgroundColor).toBeTruthy();
});
