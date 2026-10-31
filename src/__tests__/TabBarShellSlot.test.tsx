import type React from 'react';
import { Platform } from 'react-native';
import { render } from '@testing-library/react-native';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { TabBar, TabBarButton } from '../tab-bar';
import { BottomBarSlotContext } from '../layout/bottom-bar-slot';
import { resolvedStyle } from './support/rendered-style';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';
import * as SafeArea from 'react-native-safe-area-context';

const originalOS = Platform.OS;
beforeAll(() => Object.defineProperty(Platform, 'OS', { configurable: true, value: 'ios' }));
afterAll(() => Object.defineProperty(Platform, 'OS', { configurable: true, value: originalOS }));
function Bar({ embedded = false }: { embedded?: boolean }) {
  return (
    <TabBar testID="bar" embedded={embedded} activeIndex={0} onIndexChange={() => {}}>
      <TabBarButton index={0} item={{ name: 'home', label: 'Home', icon: null }} />
    </TabBar>
  );
}
function wrap(children: React.ReactNode) {
  return <BloomThemeProvider fonts={false}>{children}</BloomThemeProvider>;
}
it('standalone remains a floating bar', () => {
  const tree = render(wrap(<Bar />));
  expect(resolvedStyle(tree.getByTestId('bar').props.style).position).toBe('absolute');
});
it('explicit embedded remains in flow', () => {
  const tree = render(wrap(<Bar embedded />));
  expect(resolvedStyle(tree.getByTestId('bar').props.style).position).not.toBe('absolute');
});
it('a shell slot must be able to measure its floating TabBar content', () => {
  const tree = render(
    wrap(
      <BottomBarSlotContext.Provider value={34}>
        <Bar />
      </BottomBarSlotContext.Provider>,
    ),
  );
  expect(resolvedStyle(tree.getByTestId('bar').props.style).position).not.toBe('absolute');
});

it('keeps the floating pill and its blur while avoiding a second safe-area gap', () => {
  const insets = { top: 0, right: 0, bottom: 34, left: 0 };
  jest.spyOn(SafeArea, 'useSafeAreaInsets').mockReturnValue(insets);
  const provider = (slotted: boolean) =>
    wrap(
      <SafeAreaInsetsContext.Provider value={insets}>
        {slotted ? (
          <BottomBarSlotContext.Provider value={34}>
            <Bar />
          </BottomBarSlotContext.Provider>
        ) : (
          <Bar />
        )}
      </SafeAreaInsetsContext.Provider>,
    );
  const standalone = render(provider(false));
  const plainWrap = resolvedStyle(standalone.getByTestId('bar-wrap').props.style);
  expect(plainWrap).toMatchObject({ marginHorizontal: 12, marginBottom: 34 });
  const plainBlur = resolvedStyle(standalone.getByTestId('bar-blur').props.style);
  standalone.unmount();
  const slotted = render(provider(true));
  expect(resolvedStyle(slotted.getByTestId('bar').props.style).height).toBe(58);
  expect(resolvedStyle(slotted.getByTestId('bar-wrap').props.style)).toMatchObject({
    marginHorizontal: 12,
    marginBottom: 0,
  });
  const slottedBlur = resolvedStyle(slotted.getByTestId('bar-blur').props.style);
  expect(slottedBlur.bottom).toBe(-34);
  expect(slottedBlur.height).toBe(plainBlur.height);
  jest.restoreAllMocks();
});

it('keeps the expanded footprint when the shell supplies no bottom inset', () => {
  const tree = render(
    wrap(
      <BottomBarSlotContext.Provider value={0}>
        <Bar />
      </BottomBarSlotContext.Provider>,
    ),
  );
  expect(resolvedStyle(tree.getByTestId('bar').props.style).height).toBe(74);
});
