import React, { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import {
  SegmentedControl,
  SegmentedControlItem,
  SegmentedControlItemText,
} from './index';
import { Text } from '../typography';
import { useTheme } from '../theme/use-theme';

const meta: Meta = {
  title: 'Base/Segmented Control',
};

export default meta;

type Story = StoryObj;

/**
 * Every size and variant. Hover an unselected segment for the text
 * colour; Tab onto one for the focus ring; press another to watch the thumb
 * slide.
 */
export const Matrix: Story = {
  render: function MatrixStory() {
    const theme = useTheme();
    const [value, setValue] = useState<'weekly' | 'monthly' | 'yearly'>('weekly');
    return (
      <View style={{ gap: 16, padding: 16, alignItems: 'flex-start', backgroundColor: theme.colors.background }}>
        {(['small', 'medium', 'large'] as const).map((size) => (
          <SegmentedControl key={size} label={`Period ${size}`} type="radio" size={size} value={value} onChange={setValue}>
            <SegmentedControlItem value="weekly">
              <SegmentedControlItemText>Weekly</SegmentedControlItemText>
            </SegmentedControlItem>
            <SegmentedControlItem value="monthly">
              <SegmentedControlItemText>Monthly</SegmentedControlItemText>
            </SegmentedControlItem>
            <SegmentedControlItem value="yearly">
              <SegmentedControlItemText>Yearly</SegmentedControlItemText>
            </SegmentedControlItem>
          </SegmentedControl>
        ))}
        <SegmentedControl label="Period plain" type="radio" variant="plain" value={value} onChange={setValue}>
          <SegmentedControlItem value="weekly">
            <SegmentedControlItemText>Weekly</SegmentedControlItemText>
          </SegmentedControlItem>
          <SegmentedControlItem value="monthly">
            <SegmentedControlItemText>Monthly</SegmentedControlItemText>
          </SegmentedControlItem>
          <SegmentedControlItem value="yearly" disabled>
            <SegmentedControlItemText>Yearly</SegmentedControlItemText>
          </SegmentedControlItem>
        </SegmentedControl>
        <View style={{ width: 380 }}>
          <SegmentedControl label="Stretched" type="radio" value={value} onChange={setValue} style={{ alignSelf: 'stretch' }}>
            <SegmentedControlItem value="weekly">
              <SegmentedControlItemText>Weekly</SegmentedControlItemText>
            </SegmentedControlItem>
            <SegmentedControlItem value="monthly">
              <SegmentedControlItemText>Monthly</SegmentedControlItemText>
            </SegmentedControlItem>
            <SegmentedControlItem value="yearly" disabled>
              <SegmentedControlItemText>Yearly</SegmentedControlItemText>
            </SegmentedControlItem>
          </SegmentedControl>
        </View>
      </View>
    );
  },
};

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

/** `small` is for a toolbar, `medium` is the default, `large` for a settings screen. */
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
