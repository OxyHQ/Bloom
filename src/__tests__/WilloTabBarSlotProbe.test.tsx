import React from 'react';
import { Platform } from 'react-native';
import { render } from '@testing-library/react-native';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { TabBar, TabBarButton } from '../tab-bar';
import { BottomBarSlotContext } from '../layout/bottom-bar-slot';
import { resolvedStyle } from './support/rendered-style';

const originalOS = Platform.OS;
beforeAll(() => Object.defineProperty(Platform, 'OS', { configurable: true, value: 'ios' }));
afterAll(() => Object.defineProperty(Platform, 'OS', { configurable: true, value: originalOS }));
function Bar({ embedded = false }: { embedded?: boolean }) {
  return <TabBar testID="bar" embedded={embedded} activeIndex={0} onIndexChange={() => {}}><TabBarButton index={0} item={{name:'home',label:'Home',icon:null}} /></TabBar>;
}
function wrap(children: React.ReactNode) { return <BloomThemeProvider fonts={false}>{children}</BloomThemeProvider>; }
it('standalone remains a floating bar', () => {
  const tree = render(wrap(<Bar />));
  expect(resolvedStyle(tree.getByTestId('bar').props.style).position).toBe('absolute');
});
it('explicit embedded remains in flow', () => {
  const tree = render(wrap(<Bar embedded />));
  expect(resolvedStyle(tree.getByTestId('bar').props.style).position).not.toBe('absolute');
});
it('a shell slot must be able to measure its floating TabBar content', () => {
  const tree = render(wrap(<BottomBarSlotContext.Provider value={34}><Bar /></BottomBarSlotContext.Provider>));
  console.log('slotted TabBar root', resolvedStyle(tree.getByTestId('bar').props.style));
  expect(resolvedStyle(tree.getByTestId('bar').props.style).position).not.toBe('absolute');
});
