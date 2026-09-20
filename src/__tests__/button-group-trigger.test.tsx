import React from 'react';
import { Pressable } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { ButtonGroupItem } from '../button-group';
import { Popover, PopoverTrigger } from '../popover';

const mount = (children: React.ReactNode) => render(
  <BloomThemeProvider mode="light" colorPreset="teal">{children}</BloomThemeProvider>,
);

it('forwards anchored-trigger state and the original event through a grouped item', () => {
  const onPress = jest.fn();
  const screen = mount(<Popover><PopoverTrigger asChild label="Open details">
    <ButtonGroupItem testID="item" onPress={onPress}>Details</ButtonGroupItem>
  </PopoverTrigger></Popover>);
  const item = screen.getByTestId('item');
  expect(item.props['aria-expanded']).toBe(false);
  expect(item.props['aria-haspopup']).toBeTruthy();
  const event = { defaultPrevented: false, preventDefault: jest.fn() };
  fireEvent.press(item, event);
  expect(onPress).toHaveBeenCalledWith(event);
  expect(screen.getByTestId('item').props['aria-expanded']).toBe(true);
});

it('keeps explicit long-press, hit area and controlled toggle callbacks', () => {
  const onLongPress = jest.fn();
  const onCheckedChange = jest.fn();
  const screen = mount(<ButtonGroupItem testID="item" checked onCheckedChange={onCheckedChange}
    onLongPress={onLongPress} hitSlop={4} aria-expanded={false} aria-haspopup="menu">Toggle</ButtonGroupItem>);
  const item = screen.getByTestId('item');
  expect(screen.UNSAFE_getByType(Pressable).props.hitSlop).toBe(4);
  expect(item.props['aria-pressed']).toBe(true);
  fireEvent.press(item, {});
  expect(onCheckedChange).toHaveBeenCalledWith(false);
  const event = { nativeEvent: {} };
  fireEvent(item, 'longPress', event);
  expect(onLongPress).toHaveBeenCalledWith(event);
});
