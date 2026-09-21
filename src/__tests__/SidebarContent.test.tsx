import React from 'react';
import { Text, Pressable, ScrollView } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import { Sidebar } from '../sidebar';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import type { SidebarProps } from '../sidebar/types';

function view(props: SidebarProps) {
  return <BloomThemeProvider fonts={false}><Sidebar testID="nav" showSearch={false} showThemeToggle={false} {...props} /></BloomThemeProvider>;
}
const history = <Pressable accessibilityLabel="Conversation"><Text>Conversation</Text></Pressable>;
it('shares one destination viewport and composes pagination with the edge fades', () => {
  const onScroll = jest.fn();
  const tree = render(view({ content: history, onScroll, footer: <Text>Account</Text> }));
  expect(tree.UNSAFE_getAllByType(ScrollView)).toHaveLength(1);
  const scroll = tree.getByTestId('nav-scroll');
  fireEvent.scroll(scroll, { nativeEvent: { contentOffset: { x: 0, y: 150 }, layoutMeasurement: { width: 200, height: 100 }, contentSize: { width: 200, height: 400 } } });
  expect(onScroll).toHaveBeenCalledTimes(1);
  expect(tree.getByTestId('nav-scroll-fade-top', { includeHiddenElements: true })).toBeTruthy();
  expect(tree.getByTestId('nav-scroll-fade-bottom', { includeHiddenElements: true })).toBeTruthy();
  for (let p = tree.getByText('Account').parent; p; p = p.parent) expect(p.props.testID).not.toBe('nav-scroll');
  expect(tree.queryByText('No results')).toBeNull();
});
it('retains content identity but removes it from interaction and accessibility when collapsed', () => {
  const tree = render(view({ content: history }));
  const first = tree.getByText('Conversation');
  tree.rerender(view({ content: history, collapsed: true }));
  expect(tree.queryByLabelText('Conversation')).toBeNull();
  expect(tree.getByTestId('nav-content', { includeHiddenElements: true }).props.pointerEvents).toBe('none');
  tree.rerender(view({ content: history, collapsed: false }));
  expect(tree.getByText('Conversation')).toBe(first);
});
it('shows content in the expanded mobile panel but omits it from the rail variant', () => {
  const tree = render(view({ content: history, mobile: true, collapsed: true }));
  expect(tree.getByLabelText('Conversation')).toBeTruthy();
  tree.rerender(view({ content: history, variant: 'rail' }));
  expect(tree.queryByText('Conversation', { includeHiddenElements: true })).toBeNull();
});
