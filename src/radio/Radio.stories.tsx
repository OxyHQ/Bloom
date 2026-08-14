import React, { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Radio, RadioGroup } from './index';

const meta: Meta<typeof RadioGroup> = {
  title: 'Forms/Radio',
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
