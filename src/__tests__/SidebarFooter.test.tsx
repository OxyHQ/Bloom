import React from 'react';
import { Text, Pressable } from 'react-native';
import { render } from '@testing-library/react-native';
import { Sidebar } from '../sidebar';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import type { SidebarProps } from '../sidebar/types';
import { pressHost } from './support/press-host';

function view(props: SidebarProps) {
  return <BloomThemeProvider fonts={false}><Sidebar testID="nav" showSearch={false} showThemeToggle={false} {...props} /></BloomThemeProvider>;
}
it.each([
  { variant: 'panel' as const, collapsed: false, expected: false },
  { variant: 'panel' as const, collapsed: true, expected: true },
  { variant: 'rail' as const, collapsed: false, expected: true },
  { variant: 'panel' as const, collapsed: true, mobile: true, expected: false },
])('passes the actual rendered compact state and keeps footer actions outside scrolling: %j', ({expected,...props}) => {
  const onPress = jest.fn();
  const footer = jest.fn(({collapsed}: {collapsed:boolean}) => <Pressable accessibilityRole="button" accessibilityLabel="Open account" onPress={onPress}><Text>{collapsed?'Compact account':'Full account'}</Text></Pressable>);
  const tree = render(view({...props, footer}));
  expect(footer).toHaveBeenLastCalledWith({collapsed:expected});
  expect(tree.getByText(expected?'Compact account':'Full account')).toBeTruthy();
  const control = tree.getByLabelText('Open account');
  pressHost(control);
  expect(onPress).toHaveBeenCalledTimes(1);
  for (let parent=control.parent;parent;parent=parent.parent) expect(parent.props.testID).not.toBe('nav-scroll');
});
it('retains footer content identity while updating collapsed state', () => {
  const footer = ({collapsed}: {collapsed:boolean}) => <Text testID="account-state">{String(collapsed)}</Text>;
  const tree = render(view({footer,collapsed:false}));
  const first = tree.getByTestId('account-state');
  tree.rerender(view({footer,collapsed:true}));
  expect(tree.getByTestId('account-state')).toBe(first);
  expect(first.props.children).toBe('true');
});
it('accepts a node and leaves built-in theme chrome available', () => {
  const tree = render(view({footer:<Text>Custom account</Text>,showThemeToggle:true}));
  expect(tree.getByText('Custom account')).toBeTruthy();
  expect(tree.getByTestId('sidebar-theme-morph')).toBeTruthy();
});
it('does not add a footer wrapper when the prop is absent', () => {
  const tree = render(view({}));
  expect(tree.queryByTestId('nav-footer')).toBeNull();
});
