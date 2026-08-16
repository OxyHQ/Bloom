import React, { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Switch } from '../switch';
import {
  SettingsListGroup,
  SettingsListItem,
  SettingsListDivider,
} from './SettingsList';

const meta: Meta = {
  title: 'Components/SettingsList',
};

export default meta;

type Story = StoryObj;

function BasicList() {
  return (
    <View style={{ width: 360 }}>
      <SettingsListGroup title="Account">
        <SettingsListItem
          title="Profile"
          description="Manage your account profile"
          onPress={() => {}}
        />
        <SettingsListItem
          title="Email"
          value="nate@oxy.so"
          onPress={() => {}}
        />
        <SettingsListItem
          title="Sign out"
          destructive
          onPress={() => {}}
        />
      </SettingsListGroup>
    </View>
  );
}

function WithToggles() {
  const [notifs, setNotifs] = useState(true);
  const [dark, setDark] = useState(false);
  return (
    <View style={{ width: 360 }}>
      <SettingsListGroup title="Preferences" footer="Changes apply immediately.">
        <SettingsListItem
          title="Push notifications"
          rightElement={
            <Switch
              value={notifs}
              onValueChange={setNotifs}
              accessibilityLabel="Push notifications"
            />
          }
          showChevron={false}
        />
        <SettingsListItem
          title="Dark mode"
          rightElement={<Switch value={dark} onValueChange={setDark} accessibilityLabel="Dark mode" />}
          showChevron={false}
        />
      </SettingsListGroup>
    </View>
  );
}

function DescriptionList() {
  return (
    <View style={{ width: 360 }}>
      <SettingsListGroup title="Security">
        <SettingsListItem
          title="Two-factor authentication"
          description="Add an extra layer of security to your account."
          onPress={() => {}}
        />
        <SettingsListItem
          title="Active sessions"
          description="View where your account is signed in."
          onPress={() => {}}
        />
      </SettingsListGroup>
    </View>
  );
}

export const Basic: Story = {
  render: () => <BasicList />,
};

export const WithRightElements: Story = {
  render: () => <WithToggles />,
};

export const WithDescriptions: Story = {
  render: () => <DescriptionList />,
};

export const Composition: Story = {
  render: () => (
    <View style={{ gap: 24, width: 360 }}>
      <DescriptionList />
      <SettingsListDivider />
      <WithToggles />
    </View>
  ),
};
