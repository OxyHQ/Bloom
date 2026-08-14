import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Loading } from './Loading';

const meta: Meta<typeof Loading> = {
  title: 'Feedback/Loading',
  component: Loading,
  argTypes: {
    variant: {
      control: 'select',
      options: ['spinner', 'top', 'inline'],
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
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
  render: () => (
    <View style={{ flexDirection: 'row', gap: 24, alignItems: 'center' }}>
      <Loading variant="spinner" size="small" />
      <Loading variant="spinner" size="medium" />
      <Loading variant="spinner" size="large" />
    </View>
  ),
};

export const Composition: Story = {
  render: () => (
    <View style={{ gap: 24, alignItems: 'flex-start' }}>
      <Loading variant="spinner" size="small" text="Small" />
      <Loading variant="inline" text="Saving changes" />
    </View>
  ),
};
