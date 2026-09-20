import React, { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { InputGroup, InputGroupAddon } from './InputGroup';
import { TextFieldInput } from '../text-field';
import { Button } from '../button';
import { Kbd } from '../kbd';

const meta: Meta = {
  argTypes: {
    "invalid": { control: 'boolean' },
    "disabled": { control: 'boolean' },
    "size": { control: 'select', options: ["xs","sm","md","lg"] }
  },
  component: InputGroup,
  parameters: { controls: { disable: true } },
  title: 'Base/Input Group',
};

export default meta;

type Story = StoryObj;

export const TextAddons: Story = {
  parameters: { controls: { disable: true } },
  render: () => {
    const [v, setV] = useState('');
    return (
      <View style={{ maxWidth: '100%', width: 360 }}>
        <InputGroup>
          <InputGroupAddon>https://</InputGroupAddon>
          <TextFieldInput label="Domain" value={v} onValueChange={setV} placeholder="oxy" />
          <InputGroupAddon>.so</InputGroupAddon>
        </InputGroup>
      </View>
    );
  },
};

export const ButtonAddon: Story = {
  parameters: { controls: { disable: true } },
  render: () => {
    const [v, setV] = useState('');
    return (
      <View style={{ maxWidth: '100%', width: 360 }}>
        <InputGroup>
          <TextFieldInput label="Invite" value={v} onValueChange={setV} placeholder="email" />
          <InputGroupAddon divider noPadding>
            <Button size="sm" onPress={() => {}} appearance="subtle" tone="accent">
              Send
            </Button>
          </InputGroupAddon>
        </InputGroup>
      </View>
    );
  },
};

export const ShortcutHint: Story = {
  parameters: { controls: { disable: true } },
  render: () => {
    const [v, setV] = useState('');
    return (
      <View style={{ maxWidth: '100%', width: 360 }}>
        <InputGroup>
          <TextFieldInput label="Search" value={v} onValueChange={setV} placeholder="Search…" />
          <InputGroupAddon>
            <Kbd size="sm">⌘K</Kbd>
          </InputGroupAddon>
        </InputGroup>
      </View>
    );
  },
};
