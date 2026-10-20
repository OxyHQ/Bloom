import React from 'react';
import { Pressable, Text } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
// Explicit native owner, not the web barrel.
import { DropdownMenu, DropdownMenuTrigger } from '../dropdown-menu/DropdownMenu';
import { Popover, PopoverTrigger } from '../popover/Popover';

it('native long press opens navigation while ordinary press retains the primary surface', () => {
  const menu = jest.fn();
  const popup = jest.fn();
  const screen = render(
    <Popover onOpenChange={popup}>
      <DropdownMenu activation="hover" onOpenChange={menu}>
        <DropdownMenuTrigger asChild pressTrigger={<PopoverTrigger asChild />}>
          <Pressable testID="control">
            <Text>Page</Text>
          </Pressable>
        </DropdownMenuTrigger>
      </DropdownMenu>
    </Popover>,
  );
  fireEvent(screen.getByTestId('control'), 'longPress');
  expect(menu).toHaveBeenLastCalledWith(true);
  expect(popup).not.toHaveBeenCalled();
  fireEvent.press(screen.getByTestId('control'));
  expect(menu).toHaveBeenLastCalledWith(false);
  expect(popup).toHaveBeenLastCalledWith(true);
  menu.mockClear();
  fireEvent(screen.getByTestId('control'), 'longPress');
  expect(menu).not.toHaveBeenCalled();
});
it('native disabled controls cannot open either composed surface', () => {
  const menu = jest.fn();
  const popup = jest.fn();
  const screen = render(
    <Popover onOpenChange={popup}>
      <DropdownMenu activation="hover" onOpenChange={menu}>
        <DropdownMenuTrigger asChild pressTrigger={<PopoverTrigger asChild />}>
          <Pressable disabled testID="control">
            <Text>Page</Text>
          </Pressable>
        </DropdownMenuTrigger>
      </DropdownMenu>
    </Popover>,
  );
  fireEvent(screen.getByTestId('control'), 'longPress');
  fireEvent.press(screen.getByTestId('control'));
  expect(menu).not.toHaveBeenCalled();
  expect(popup).not.toHaveBeenCalled();
});
