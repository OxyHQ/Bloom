/** @jest-environment jsdom */
import React from 'react';
import { Platform, View } from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { Screen, useScreen, useScreenWindowScroll } from '../screen';
import type { ScreenContextValue } from '../screen/context';
import { resolvedStyle } from './support/rendered-style';

function wrap(children: React.ReactNode) { return <BloomThemeProvider fonts={false}>{children}</BloomThemeProvider>; }
function scroll(y: number) {
  act(() => {
    Object.defineProperty(window, 'scrollY', { configurable: true, value: y });
    window.dispatchEvent(new Event('scroll'));
  });
}
const originalOS = Platform.OS;
beforeAll(() => { Object.defineProperty(Platform, 'OS', { configurable: true, value: 'web' }); });
afterAll(() => { Object.defineProperty(Platform, 'OS', { configurable: true, value: originalOS }); });
beforeEach(() => { Object.defineProperty(window, 'scrollY', { configurable: true, value: 0 }); });

it('binds window by itself and disables retained or unmounted screen writers', () => {
  let state!: ScreenContextValue;
  function Probe() { state = useScreen(); return null; }
  const ui = (active: boolean) => wrap(<Screen documentScroll active={active}><Probe /></Screen>);
  const tree = render(ui(true));
  scroll(160);
  expect(state.scrollY.value).toBe(160);
  expect(state.collapseTarget.value).toBe(1);
  scroll(120);
  expect(state.collapseTarget.value).toBe(0);
  tree.rerender(ui(false));
  scroll(300);
  expect(state.scrollY.value).toBe(120);
  tree.rerender(ui(true));
  expect(state.scrollY.value).toBe(300);
  tree.unmount();
  scroll(400);
  expect(state.scrollY.value).toBe(300);
});

it('gives a restoring document virtualizer sole ownership, then resumes the default binding', () => {
  let state!: ScreenContextValue;
  let insets!: { top: number; bottom: number };
  function Probe() { state = useScreen(); return null; }
  function Virtualizer({ pending }: { pending: boolean }) {
    insets = useScreenWindowScroll({ restoration: { restorePending: pending, onScroll: jest.fn() } }).contentInsets;
    return null;
  }
  const ui = (bound: boolean, pending = true) => wrap(<Screen documentScroll header={<View />} bottomBar={<View />}><Probe />{bound && <Virtualizer pending={pending} />}</Screen>);
  const tree = render(ui(true));
  expect(state.activeScrollerId.value).not.toBeNull();
  expect(insets).toEqual({ top: 0, bottom: 0 });
  scroll(200);
  expect(state.scrollY.value).toBe(200);
  expect(state.collapseTarget.value).toBe(0);
  tree.rerender(ui(true, false));
  scroll(250);
  expect(state.collapseTarget.value).toBe(1);
  tree.rerender(ui(false));
  expect(state.activeScrollerId.value).toBeNull();
  scroll(0);
  expect(state.scrollY.value).toBe(0);
  expect(state.collapseTarget.value).toBe(0);
});

it('does not adopt another window binding identity after a context update', () => {
  let state!: ScreenContextValue;
  function Probe() { state = useScreen(); return null; }
  function First() { useScreenWindowScroll(); return null; }
  function RestoringOwner() { useScreenWindowScroll({ restoration: { restorePending: true, onScroll: jest.fn() } }); return null; }
  const tree = render(wrap(<Screen documentScroll testID="page" header={<View />}><Probe /><First /><RestoringOwner /></Screen>));
  // A measurement rerenders both bindings. The first must not capture the
  // last binding's ID and start driving motion during its restoration.
  fireEvent(tree.getByTestId('page-header'), 'layout', { nativeEvent: { layout: { height: 80 } } });
  scroll(180);
  expect(state.scrollY.value).toBe(180);
  expect(state.collapseTarget.value).toBe(0);
});

it('keeps natural document height and reserves measured chrome exactly once', () => {
  const tree = render(wrap(<Screen documentScroll testID="page" header={<View />} bottomBar={<View />} headerHeight={64} bottomBarHeight={80}><View style={{ height: 1600 }} /></Screen>));
  const root = resolvedStyle(tree.getByTestId('page').props.style);
  expect(root.flex).toBeUndefined();
  expect(root.height).toBeUndefined();
  expect(root.minHeight).toBe('100dvh');
  expect(resolvedStyle(tree.getByTestId('page-content').props.style)).toMatchObject({ paddingTop: 64, paddingBottom: 96 });
  fireEvent(tree.getByTestId('page-header'), 'layout', { nativeEvent: { layout: { height: 72 } } });
  fireEvent(tree.getByTestId('page-bottom'), 'layout', { nativeEvent: { layout: { height: 90 } } });
  expect(resolvedStyle(tree.getByTestId('page-content').props.style)).toMatchObject({ paddingTop: 72, paddingBottom: 106 });
  expect(resolvedStyle(tree.getByTestId('page-header').props.style)).toMatchObject({ position: 'sticky', top: 0, marginBottom: -72 });
  expect(resolvedStyle(tree.getByTestId('page-bottom').props.style)).toMatchObject({ position: 'sticky', bottom: 0, marginTop: -90 });
});
