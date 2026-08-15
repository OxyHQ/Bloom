import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from '../button';
import { Menu, MenuContent, MenuGroup, MenuItem, MenuItemText, MenuTrigger } from './index';

const meta: Meta = {
  title: 'Overlays/Menu',
};

export default meta;

type Story = StoryObj;

function BasicMenu() {
  return (
    <Menu>
      <MenuTrigger label="Open menu">
        {({ props }) => (
          <Button onPress={props.onPress}>Open menu</Button>
        )}
      </MenuTrigger>
      <MenuContent>
        <MenuGroup>
          <MenuItem label="Profile" onPress={() => {}}>
            <MenuItemText>Profile</MenuItemText>
          </MenuItem>
          <MenuItem label="Settings" onPress={() => {}}>
            <MenuItemText>Settings</MenuItemText>
          </MenuItem>
          <MenuItem label="Sign out" onPress={() => {}}>
            <MenuItemText>Sign out</MenuItemText>
          </MenuItem>
        </MenuGroup>
      </MenuContent>
    </Menu>
  );
}

function MenuWithDisabledItem() {
  return (
    <Menu>
      <MenuTrigger label="Open menu with disabled item">
        {({ props }) => <Button onPress={props.onPress}>Open</Button>}
      </MenuTrigger>
      <MenuContent>
        <MenuGroup>
          <MenuItem label="Edit" onPress={() => {}}>
            <MenuItemText>Edit</MenuItemText>
          </MenuItem>
          <MenuItem label="Duplicate" onPress={() => {}} disabled>
            <MenuItemText>Duplicate (disabled)</MenuItemText>
          </MenuItem>
          <MenuItem label="Delete" onPress={() => {}}>
            <MenuItemText>Delete</MenuItemText>
          </MenuItem>
        </MenuGroup>
      </MenuContent>
    </Menu>
  );
}

export const Basic: Story = {
  render: () => <BasicMenu />,
};

export const WithDisabled: Story = {
  render: () => <MenuWithDisabledItem />,
};

export const Composition: Story = {
  render: () => (
    <View style={{ gap: 12, alignItems: 'flex-start' }}>
      <BasicMenu />
      <MenuWithDisabledItem />
    </View>
  ),
};
