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
  component: SettingsListItem,
  title: 'Base/Settings List',
};

export default meta;

type Story = StoryObj;

function BasicList() {
  return (
    <View style={{ width: 360, maxWidth: '100%' }}>
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
    <View style={{ width: 360, maxWidth: '100%' }}>
      <SettingsListGroup title="Preferences" footer="Changes apply immediately.">
        <SettingsListItem
          title="Push notifications"
          rightElement={
            <Switch
              checked={notifs}
              onCheckedChange={setNotifs}
              accessibilityLabel="Push notifications"
            />
          }
          showChevron={false}
        />
        <SettingsListItem
          title="Dark mode"
          rightElement={<Switch checked={dark} onCheckedChange={setDark} accessibilityLabel="Dark mode" />}
          showChevron={false}
        />
      </SettingsListGroup>
    </View>
  );
}

function DescriptionList() {
  return (
    <View style={{ width: 360, maxWidth: '100%' }}>
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
  parameters: { controls: { disable: true } },
  render: () => <BasicList />,
};

export const WithRightElements: Story = {
  parameters: { controls: { disable: true } },
  render: () => <WithToggles />,
};

export const WithDescriptions: Story = {
  parameters: { controls: { disable: true } },
  render: () => <DescriptionList />,
};

export const Composition: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <View style={{ gap: 24, width: 360, maxWidth: '100%' }}>
      <DescriptionList />
      <SettingsListDivider />
      <WithToggles />
    </View>
  ),
};

export const Playground: StoryObj<typeof SettingsListItem> = {
  args: { title: 'Profile', description: 'Manage your profile', value: 'Personal', showChevron: true, disabled: false, destructive: false },
  parameters: { controls: { disable: false, include: ['title', 'description', 'value', 'showChevron', 'disabled', 'destructive'] } },
  argTypes: { title: { control: 'text' }, description: { control: 'text' }, value: { control: 'text' }, showChevron: { control: 'boolean' }, disabled: { control: 'boolean' }, destructive: { control: 'boolean' } },
  render: function Playground(args) {

    return <View style={{ width: 520, maxWidth: '100%' }}><SettingsListGroup title="Account"><SettingsListItem {...args} onPress={() => {}} /></SettingsListGroup></View>;
  },
};
