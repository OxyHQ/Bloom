import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from '../button';
import * as Menu from './index';

const meta: Meta = {
  title: 'Components/Menu',
};

export default meta;

type Story = StoryObj;

function BasicMenu() {
  return (
    <Menu.Root>
      <Menu.Trigger label="Open menu">
        {({ props }) => (
          <Button onPress={props.onPress}>Open menu</Button>
        )}
      </Menu.Trigger>
      <Menu.Outer>
        <Menu.Group>
          <Menu.Item label="Profile" onPress={() => {}}>
            <Menu.ItemText>Profile</Menu.ItemText>
          </Menu.Item>
          <Menu.Item label="Settings" onPress={() => {}}>
            <Menu.ItemText>Settings</Menu.ItemText>
          </Menu.Item>
          <Menu.Item label="Sign out" onPress={() => {}}>
            <Menu.ItemText>Sign out</Menu.ItemText>
          </Menu.Item>
        </Menu.Group>
      </Menu.Outer>
    </Menu.Root>
  );
}

function MenuWithDisabledItem() {
  return (
    <Menu.Root>
      <Menu.Trigger label="Open menu with disabled item">
        {({ props }) => <Button onPress={props.onPress}>Open</Button>}
      </Menu.Trigger>
      <Menu.Outer>
        <Menu.Group>
          <Menu.Item label="Edit" onPress={() => {}}>
            <Menu.ItemText>Edit</Menu.ItemText>
          </Menu.Item>
          <Menu.Item label="Duplicate" onPress={() => {}} disabled>
            <Menu.ItemText>Duplicate (disabled)</Menu.ItemText>
          </Menu.Item>
          <Menu.Item label="Delete" onPress={() => {}}>
            <Menu.ItemText>Delete</Menu.ItemText>
          </Menu.Item>
        </Menu.Group>
      </Menu.Outer>
    </Menu.Root>
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
