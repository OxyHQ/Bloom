import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Loading } from './Loading';

const meta: Meta<typeof Loading> = {
  title: 'Base/Loading',
  component: Loading,
  argTypes: {
    "color": { control: 'text' },
    "tone": { control: 'select', options: ['neutral', 'accent', 'support', 'action', 'success', 'warning', 'danger', 'info'] },
    "showLoading": { control: 'boolean' },
    variant: {
      control: 'select',
      options: ['spinner', 'top', 'inline'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
  },
};

export default meta;

type Story = StoryObj<typeof Loading>;

export const Basic: Story = {
  args: { variant: 'spinner' },
};

export const Spinner: Story = {
  args: { variant: 'spinner', text: 'Loading…', showText: true },
};

export const Inline: Story = {
  args: { variant: 'inline', text: 'Saving' },
};

export const Sizes: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <View style={{ flexDirection: 'row', gap: 24, alignItems: 'center' }}>
      <Loading variant="spinner" size="sm" />
      <Loading variant="spinner" size="md" />
      <Loading variant="spinner" size="lg" />
    </View>
  ),
};

export const Composition: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <View style={{ gap: 24, alignItems: 'flex-start' }}>
      <Loading variant="spinner" size="sm" text="Small" />
      <Loading variant="inline" text="Saving changes" />
    </View>
  ),
};
