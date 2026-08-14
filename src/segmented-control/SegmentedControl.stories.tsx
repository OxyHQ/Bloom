import React, { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import {
  SegmentedControl,
  SegmentedControlItem,
  SegmentedControlItemText,
} from './index';
import { Text } from '../typography';

const meta: Meta = {
  title: 'Forms/SegmentedControl',
};

export default meta;

type Story = StoryObj;

/**
 * `type` is the decision, and it is an ACCESSIBILITY one, not a visual one:
 *
 *   `radio` — the segments pick a value (a setting). Announced as a radio group.
 *   `tabs`  — the segments switch the panel below. Announced as a tab list.
 *
 * They look identical, so the wrong one is invisible on screen and wrong in
 * every screen reader.
 */
export const Radio: Story = {
  render: function RadioStory() {
    const [value, setValue] = useState<'light' | 'dark' | 'system'>('system');
    return (
      <View style={{ width: 380 }}>
        <SegmentedControl label="Appearance" type="radio" value={value} onChange={setValue}>
          <SegmentedControlItem value="light">
            <SegmentedControlItemText>Light</SegmentedControlItemText>
          </SegmentedControlItem>
          <SegmentedControlItem value="dark">
            <SegmentedControlItemText>Dark</SegmentedControlItemText>
          </SegmentedControlItem>
          <SegmentedControlItem value="system">
            <SegmentedControlItemText>System</SegmentedControlItemText>
          </SegmentedControlItem>
        </SegmentedControl>
      </View>
    );
  },
};

/** `type="tabs"` — the same control, switching what is shown underneath. */
export const Tabs: Story = {
  render: function TabsStory() {
    const [value, setValue] = useState<'posts' | 'replies'>('posts');
    return (
      <View style={{ width: 380, gap: 16 }}>
        <SegmentedControl label="Profile section" type="tabs" value={value} onChange={setValue}>
          <SegmentedControlItem value="posts">
            <SegmentedControlItemText>Posts</SegmentedControlItemText>
          </SegmentedControlItem>
          <SegmentedControlItem value="replies">
            <SegmentedControlItemText>Replies</SegmentedControlItemText>
          </SegmentedControlItem>
        </SegmentedControl>
        <Text>{value === 'posts' ? 'Everything you posted.' : 'Everything you replied to.'}</Text>
      </View>
    );
  },
};

/** Both sizes. `small` is for a toolbar, `large` for a settings screen. */
export const Sizes: Story = {
  render: function SizesStory() {
    const [a, setA] = useState<'one' | 'two'>('one');
    const [b, setB] = useState<'one' | 'two'>('two');
    return (
      <View style={{ width: 380, gap: 16 }}>
        <SegmentedControl label="Small" type="radio" size="small" value={a} onChange={setA}>
          <SegmentedControlItem value="one">
            <SegmentedControlItemText>One</SegmentedControlItemText>
          </SegmentedControlItem>
          <SegmentedControlItem value="two">
            <SegmentedControlItemText>Two</SegmentedControlItemText>
          </SegmentedControlItem>
        </SegmentedControl>
        <SegmentedControl label="Large" type="radio" size="large" value={b} onChange={setB}>
          <SegmentedControlItem value="one">
            <SegmentedControlItemText>One</SegmentedControlItemText>
          </SegmentedControlItem>
          <SegmentedControlItem value="two">
            <SegmentedControlItemText>Two</SegmentedControlItemText>
          </SegmentedControlItem>
        </SegmentedControl>
      </View>
    );
  },
};
