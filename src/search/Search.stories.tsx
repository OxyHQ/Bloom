import React, { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Search } from './index';
import { Text } from '../typography';

const meta: Meta<typeof Search> = {
  title: 'Forms/Search',
  component: Search,
};

export default meta;

type Story = StoryObj<typeof Search>;

/**
 * `Search` is `TextField` at the pill rung with the magnifier and the clear
 * button already wired, plus `role="search"` and the autocorrect/autocapitalize
 * settings a query field wants. Building it from `TextField` by hand is how
 * three apps ended up with three different clear buttons.
 */
export const Basic: Story = {
  render: function BasicStory() {
    const [value, setValue] = useState('');
    return (
      <View style={{ width: 380 }}>
        <Search value={value} onChangeText={setValue} onClearText={() => setValue('')} />
      </View>
    );
  },
};

/**
 * The clear button appears only while there is a value, and `onClearText` is
 * what it calls — a separate prop from `onChangeText` so the caller can also
 * drop the results, not just the text.
 */
export const Filtering: Story = {
  render: function FilteringStory() {
    const ALL = ['Nate', 'Bloom', 'Homiio', 'Mention', 'Allo', 'Mercaria'];
    const [value, setValue] = useState('m');
    const shown = ALL.filter((x) => x.toLowerCase().includes(value.toLowerCase()));
    return (
      <View style={{ width: 380, gap: 12 }}>
        <Search
          value={value}
          onChangeText={setValue}
          onClearText={() => setValue('')}
          label="Search apps"
        />
        <View style={{ gap: 4 }}>
          {shown.map((x) => (
            <Text key={x}>{x}</Text>
          ))}
          {shown.length === 0 ? <Text>No matches</Text> : null}
        </View>
      </View>
    );
  },
};

/** A custom `label` replaces both the floating label and the placeholder. */
export const CustomLabel: Story = {
  render: function CustomLabelStory() {
    const [value, setValue] = useState('');
    return (
      <View style={{ width: 380 }}>
        <Search
          value={value}
          onChangeText={setValue}
          onClearText={() => setValue('')}
          label="Find a conversation"
        />
      </View>
    );
  },
};
