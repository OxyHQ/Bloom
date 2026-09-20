import { useArgs } from 'storybook/preview-api';
import React, { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Radio, RadioCard, RadioGroup } from './index';
import { useTheme } from '../theme/use-theme';

const meta: Meta<typeof RadioGroup> = {
  title: 'Base/Radio',
  component: RadioGroup,
};

export default meta;

type Story = StoryObj<typeof RadioGroup>;

/**
 * `RadioGroup` is the one to reach for. It owns the `radiogroup` role and its
 * label, which is the part a hand-rolled row of radios always drops: a screen
 * reader then announces three unrelated controls instead of one choice.
 */
export const Group: Story = {
  parameters: { controls: { disable: true } },
  render: function GroupStory() {
    const [value, setValue] = useState('everyone');
    return (
      <View style={{ width: 380, maxWidth: '100%' }}>
        <RadioGroup
          label="Who can reply"
          value={value}
          onValueChange={setValue}
          options={[
            { value: 'everyone', label: 'Everyone' },
            { value: 'following', label: 'People you follow' },
            { value: 'mentioned', label: 'Only people you mention' },
          ]}
        />
      </View>
    );
  },
};

/** Descriptions turn each option into a two-line row. */
export const WithDescriptions: Story = {
  parameters: { controls: { disable: true } },
  render: function DescriptionsStory() {
    const [value, setValue] = useState('balanced');
    return (
      <View style={{ width: 420, maxWidth: '100%' }}>
        <RadioGroup
          label="Sync frequency"
          value={value}
          onValueChange={setValue}
          options={[
            {
              value: 'realtime',
              label: 'Real time',
              description: 'Uses the most battery. Everything arrives as it happens.',
            },
            {
              value: 'balanced',
              label: 'Balanced',
              description: 'Checks every few minutes.',
            },
            {
              value: 'manual',
              label: 'Manual',
              description: 'Only when you pull to refresh.',
              disabled: true,
            },
          ]}
        />
      </View>
    );
  },
};

/**
 * A single `Radio` is the piece a custom layout composes — a row of cards, a
 * table. It reports its own value on select, so the parent still owns the state.
 * Anything that is not a full control wants `RadioIndicator` instead.
 */
export const StandaloneItems: Story = {
  parameters: { controls: { disable: true } },
  render: function StandaloneStory() {
    const [value, setValue] = useState('card');
    return (
      <View style={{ gap: 12, width: 380, maxWidth: '100%' }}>
        {['card', 'bank', 'balance'].map((v) => (
          <Radio
            key={v}
            value={v}
            checked={value === v}
            onValueChange={setValue}
            label={v}
          />
        ))}
      </View>
    );
  },
};

const noop = () => {};

/**
 * Every size against every state, for side-by-side comparison.
 * Tab onto a row for the focus ring around the dot.
 */
export const Matrix: Story = {
  parameters: { controls: { disable: true } },
  render: function RadioMatrix() {
    const theme = useTheme();
    return (
      <View style={{ gap: 16, padding: 16, maxWidth: '100%', backgroundColor: theme.colors.background }}>
        {(['sm', 'md', 'lg'] as const).map((size) => (
          <View key={size} style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 24 }}>
            <Radio size={size} value="a" checked={false} onValueChange={noop} accessibilityLabel="Unselected" />
            <Radio size={size} value="b" checked onValueChange={noop} accessibilityLabel="Selected" />
            <Radio size={size} value="c" checked onValueChange={noop} label="Option A" />
            <Radio size={size} value="d" checked={false} onValueChange={noop} label="Option B" />
            <Radio size={size} value="e" checked={false} disabled onValueChange={noop} label="Disabled" />
            <Radio size={size} value="f" checked disabled onValueChange={noop} label="Disabled checked" />
          </View>
        ))}
      </View>
    );
  },
};

/** Sizes. */
export const Sizes: Story = {
  parameters: { controls: { disable: true } },
  render: function SizesStory() {
    const [value, setValue] = useState('b');
    return (
      <View style={{ gap: 16, width: 320, maxWidth: '100%' }}>
        {(['sm', 'md', 'lg'] as const).map((size) => (
          <Radio
            key={size}
            size={size}
            value={size === 'md' ? 'b' : size}
            checked={value === (size === 'md' ? 'b' : size)}
            onValueChange={setValue}
            label={size}
          />
        ))}
      </View>
    );
  },
};

/**
 * `RadioCard`, through `RadioGroup variant="card"`: title +
 * description left, the dot right, the whole card selects. Hover a card for the
 * background; Tab onto one for the ring around its dot.
 */
export const Cards: Story = {
  parameters: { controls: { disable: true } },
  render: function CardsStory() {
    const theme = useTheme();
    const [value, setValue] = useState('pro');
    return (
      <View style={{ width: 400, maxWidth: '100%', padding: 16, backgroundColor: theme.colors.background }}>
        <RadioGroup
          label="Plan"
          variant="card"
          value={value}
          onValueChange={setValue}
          options={[
            { value: 'starter', label: 'Starter', description: 'Up to 3 projects.' },
            { value: 'pro', label: 'Pro', description: 'Unlimited projects and history.' },
            { value: 'team', label: 'Team' },
            { value: 'enterprise', label: 'Enterprise', description: 'Contact sales.', disabled: true },
          ]}
        />
      </View>
    );
  },
};

/** A lone `RadioCard`, for a custom layout inside your own `radiogroup`. */
export const StandaloneCard: Story = {
  parameters: { controls: { disable: true } },
  render: function StandaloneCardStory() {
    const [value, setValue] = useState('a');
    return (
      <View role="radiogroup" aria-label="Region" style={{ width: 400, maxWidth: '100%', flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {['a', 'b'].map((v) => (
          <RadioCard
            key={v}
            value={v}
            checked={value === v}
            onValueChange={setValue}
            title={v === 'a' ? 'Europe' : 'United States'}
            description={v === 'a' ? 'Frankfurt' : 'Virginia'}
            style={{ flex: 1 }}
          />
        ))}
      </View>
    );
  },
};

/** A single instance whose controls are applied directly to the rendered component. */
export const Playground: StoryObj<typeof RadioGroup> = {
  args: { label: 'Who can reply', value: 'everyone', options: [{ value: 'everyone', label: 'Everyone' }, { value: 'following', label: 'People you follow' }], size: 'md', tone: 'accent', disabled: false },
  parameters: { controls: { disable: false, include: ['label', 'value', 'size', 'tone', 'disabled'] } },
  argTypes: { label: { control: 'text' }, value: { control: 'text' }, size: { control: 'select', options: ['xs', 'sm', 'md', 'lg'] }, tone: { control: 'select', options: ['neutral', 'accent', 'support', 'action', 'success', 'warning', 'danger', 'info'] }, disabled: { control: 'boolean' } },
  render: function Playground(args) {
    const [, updateArgs] = useArgs();
    return <View style={{ width: 440, maxWidth: '100%' }}><RadioGroup {...args} onValueChange={next => updateArgs({ value: next })} /></View>;
  },
};
