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
  render: function GroupStory() {
    const [value, setValue] = useState('everyone');
    return (
      <View style={{ width: 380 }}>
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
  render: function DescriptionsStory() {
    const [value, setValue] = useState('balanced');
    return (
      <View style={{ width: 420 }}>
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
  render: function StandaloneStory() {
    const [value, setValue] = useState('card');
    return (
      <View style={{ gap: 12, width: 380 }}>
        {['card', 'bank', 'balance'].map((v) => (
          <Radio
            key={v}
            value={v}
            selected={value === v}
            onSelect={setValue}
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
  render: function RadioMatrix() {
    const theme = useTheme();
    return (
      <View style={{ gap: 16, padding: 16, backgroundColor: theme.colors.background }}>
        {(['small', 'medium', 'large'] as const).map((size) => (
          <View key={size} style={{ flexDirection: 'row', alignItems: 'center', gap: 24 }}>
            <Radio size={size} value="a" selected={false} onSelect={noop} accessibilityLabel="Unselected" />
            <Radio size={size} value="b" selected onSelect={noop} accessibilityLabel="Selected" />
            <Radio size={size} value="c" selected onSelect={noop} label="Option A" />
            <Radio size={size} value="d" selected={false} onSelect={noop} label="Option B" />
            <Radio size={size} value="e" selected={false} disabled onSelect={noop} label="Disabled" />
            <Radio size={size} value="f" selected disabled onSelect={noop} label="Disabled selected" />
          </View>
        ))}
      </View>
    );
  },
};

/** Sizes. */
export const Sizes: Story = {
  render: function SizesStory() {
    const [value, setValue] = useState('b');
    return (
      <View style={{ gap: 16, width: 320 }}>
        {(['small', 'medium', 'large'] as const).map((size) => (
          <Radio
            key={size}
            size={size}
            value={size === 'medium' ? 'b' : size}
            selected={value === (size === 'medium' ? 'b' : size)}
            onSelect={setValue}
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
  render: function CardsStory() {
    const theme = useTheme();
    const [value, setValue] = useState('pro');
    return (
      <View style={{ width: 400, padding: 16, backgroundColor: theme.colors.background }}>
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
  render: function StandaloneCardStory() {
    const [value, setValue] = useState('a');
    return (
      <View role="radiogroup" aria-label="Region" style={{ width: 400, flexDirection: 'row', gap: 8 }}>
        {['a', 'b'].map((v) => (
          <RadioCard
            key={v}
            value={v}
            selected={value === v}
            onSelect={setValue}
            title={v === 'a' ? 'Europe' : 'United States'}
            description={v === 'a' ? 'Frankfurt' : 'Virginia'}
            style={{ flex: 1 }}
          />
        ))}
      </View>
    );
  },
};
