import React, { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { InputGroup, InputGroupAddon } from './InputGroup';
import { TextFieldInput } from '../text-field';
import { Button } from '../button';
import { Kbd } from '../kbd';

const meta: Meta = {
  title: 'Forms/InputGroup',
};

export default meta;

type Story = StoryObj;

export const TextAddons: Story = {
  render: () => {
    const [v, setV] = useState('');
    return (
      <View style={{ width: 360 }}>
        <InputGroup>
          <InputGroupAddon>https://</InputGroupAddon>
          <TextFieldInput label="Domain" value={v} onChangeText={setV} placeholder="oxy" />
          <InputGroupAddon>.so</InputGroupAddon>
        </InputGroup>
      </View>
    );
  },
};

export const ButtonAddon: Story = {
  render: () => {
    const [v, setV] = useState('');
    return (
      <View style={{ width: 360 }}>
        <InputGroup>
          <TextFieldInput label="Invite" value={v} onChangeText={setV} placeholder="email" />
          <InputGroupAddon divider noPadding>
            <Button variant="ghost" size="small" onPress={() => {}}>
              Send
            </Button>
          </InputGroupAddon>
        </InputGroup>
      </View>
    );
  },
};

export const ShortcutHint: Story = {
  render: () => {
    const [v, setV] = useState('');
    return (
      <View style={{ width: 360 }}>
        <InputGroup>
          <TextFieldInput label="Search" value={v} onChangeText={setV} placeholder="Search…" />
          <InputGroupAddon>
            <Kbd size="sm">⌘K</Kbd>
          </InputGroupAddon>
        </InputGroup>
      </View>
    );
  },
};
