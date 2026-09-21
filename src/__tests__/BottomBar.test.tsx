import React from 'react';
import { View, Text, Keyboard } from 'react-native';
import { act, render } from '@testing-library/react-native';
import { BottomBarBase } from '../bottom-bar/BottomBarBase';
import type { TabBarProps, TabBarButtonProps } from '../tab-bar/types';
import { resolvedStyle } from './support/rendered-style';
const Navigation = jest.fn((props: TabBarProps) => <View testID="navigation">{props.children}</View>);
const Item = ({ item }: TabBarButtonProps) => <Text>{item.label}</Text>;
const Blur = () => <View testID="blur" />;
const items = [{ name: 'home', label: 'Home', icon: null }, { name: 'search', label: 'Search', icon: null }];
it('shares one progress signal and reports semantic destinations', () => {
  const onValueChange = jest.fn();
  const progress = { value: 0.6 } as NonNullable<TabBarProps['minimizeProgress']>;
  const view = render(<BottomBarBase Navigation={Navigation} Item={Item} Blur={Blur} items={items} value="search" onValueChange={onValueChange} minimizeProgress={progress} action={<Text>Compose</Text>} testID="bar" />);
  const props = Navigation.mock.calls[Navigation.mock.calls.length - 1]![0];
  expect(props.minimizeProgress).toBe(progress);
  expect(props.activeIndex).toBe(1);
  props.onIndexChange?.(0);
  expect(onValueChange).toHaveBeenCalledWith('home');
  expect(view.getByTestId('navigation').findAll(node => node.props.children === 'Compose')).toHaveLength(0);
  expect(view.getByText('Compose', { includeHiddenElements: true })).toBeTruthy();
  expect(resolvedStyle(view.getByTestId('bar').props.style).height).toBeGreaterThanOrEqual(58);
});
it('removes the blur in solid mode and hides on the native keyboard', () => {
  const view = render(<BottomBarBase Navigation={Navigation} Item={Item} Blur={Blur} items={items} value="home" onValueChange={() => {}} material="solid" testID="bar" />);
  expect(view.queryByTestId('blur')).toBeNull();
  const calls = (Keyboard.addListener as jest.Mock).mock.calls;
  const show = [...calls].reverse().find((call: unknown[]) => call[0] === 'keyboardDidShow')?.[1];
  act(() => show());
  expect(view.queryByTestId('bar')).toBeNull();
});
it('hides a minimized accessory from hit testing and accessibility and releases its gap', () => {
  const progress = { value: 1 } as NonNullable<TabBarProps['minimizeProgress']>;
  const view = render(<BottomBarBase Navigation={Navigation} Item={Item} Blur={Blur} items={items} value="home" onValueChange={() => {}} minimizeProgress={progress} action={<Text>Compose</Text>} testID="bar" />);
  const action = view.getByTestId('bar-action', { includeHiddenElements: true });
  expect(action.props.pointerEvents).toBe('none');
  expect(action.props.importantForAccessibility).toBe('no-hide-descendants');
  expect(action.props['aria-hidden']).toBe(true);
  expect(resolvedStyle(action.props.style).opacity).toBe(0);
  expect(resolvedStyle(action.props.style).marginLeft).toBe(0);
});
it.each(['standalone', 'visible'] as const)('keeps a %s action available while minimized', mode => {
  const progress = { value: 1 } as NonNullable<TabBarProps['minimizeProgress']>;
  const view = render(<BottomBarBase Navigation={Navigation} Item={Item} Blur={Blur} items={mode === 'standalone' ? [] : items} actionBehavior={mode === 'visible' ? 'visible' : 'hide'} value="home" onValueChange={() => {}} minimizeProgress={progress} action={<Text>Compose</Text>} testID="bar" />);
  const action = view.getByTestId('bar-action');
  expect(action.props.pointerEvents).toBe('auto');
  expect(resolvedStyle(action.props.style).opacity).toBe(1);
});

it('lifts the action when measured width cannot fit comfortable targets and reserves its measured height', () => {
  const destinations = [...items, {name:'saved',label:'Saved',icon:null}, {name:'profile',label:'Profile',icon:null}];
  const view = render(<BottomBarBase Navigation={Navigation} Item={Item} Blur={Blur} items={destinations} value="home" onValueChange={() => {}} action={<Text>Compose</Text>} testID="bar" />);
  const heightBefore = Number(resolvedStyle(view.getByTestId('bar').props.style).height);
  act(() => view.getByTestId('bar-row').props.onLayout({nativeEvent:{layout:{width:280,height:58}}}));
  const actionBefore = view.getByTestId('bar-action');
  expect(resolvedStyle(actionBefore.props.style)).toMatchObject({position:'absolute',bottom:'100%',right:12,marginBottom:10,marginLeft:0});
  act(() => view.getByTestId('bar-action-content').props.onLayout({nativeEvent:{layout:{width:50,height:64}}}));
  expect(Number(resolvedStyle(view.getByTestId('bar').props.style).height)).toBe(heightBefore+64+10);
  act(() => view.getByTestId('bar-row').props.onLayout({nativeEvent:{layout:{width:500,height:58}}}));
  expect(view.getByTestId('bar-action')).toBe(actionBefore);
  expect(resolvedStyle(actionBefore.props.style).position).toBeUndefined();
});
it.each(['above','beside'] as const)('honors explicit action placement %s independently of available width', actionPlacement => {
  const view = render(<BottomBarBase Navigation={Navigation} Item={Item} Blur={Blur} items={items} value="home" onValueChange={() => {}} actionPlacement={actionPlacement} action={<Text>Compose</Text>} testID="bar" />);
  act(() => view.getByTestId('bar-row').props.onLayout({nativeEvent:{layout:{width:100,height:58}}}));
  expect(resolvedStyle(view.getByTestId('bar-action').props.style).position).toBe(actionPlacement==='above'?'absolute':undefined);
});
