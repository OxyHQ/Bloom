import React, { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Tabs, TabsTrigger } from './index';
import { Text } from '../typography';

const meta: Meta = {
  title: 'Components/Tabs',
};

export default meta;

type Story = StoryObj;

const PANELS: Record<string, string> = {
  posts: 'Everything you posted.',
  replies: 'Everything you replied to.',
  media: 'Photos and video.',
};

/**
 * `Tabs` is the STRIP, and only the strip. It is CONTROLLED: `value` is the
 * open tab and `onValueChange` reports a press, so the open tab can come from a
 * route, a saved preference or a parent's state without the component fighting
 * for ownership — and the caller renders the panel for whatever `value` is.
 *
 * Reach for `SegmentedControl` instead when the choice IS the value (a setting)
 * rather than a view of the same subject — they look similar and announce
 * differently.
 */
export const Basic: Story = {
  render: function BasicStory() {
    const [value, setValue] = useState('posts');
    return (
      <View style={{ width: 420, gap: 12 }}>
        <Tabs value={value} onValueChange={setValue}>
          <TabsTrigger value="posts" label="Posts" />
          <TabsTrigger value="replies" label="Replies" />
          <TabsTrigger value="media" label="Media" />
        </Tabs>
        <Text>{PANELS[value]}</Text>
      </View>
    );
  },
};

/**
 * `count` puts a number beside the label. It is for a quantity the user is
 * choosing between — 3 drafts vs 41 sent — not for an unread badge, which
 * belongs on the thing that is unread.
 */
export const WithCounts: Story = {
  render: function WithCountsStory() {
    const [value, setValue] = useState('inbox');
    return (
      <View style={{ width: 420 }}>
        <Tabs value={value} onValueChange={setValue}>
          <TabsTrigger value="inbox" label="Inbox" count={12} />
          <TabsTrigger value="drafts" label="Drafts" count={3} />
          <TabsTrigger value="sent" label="Sent" count={41} />
        </Tabs>
      </View>
    );
  },
};

/** The three variants. The choice is how loudly the strip separates from the content below it. */
export const Variants: Story = {
  render: function VariantsStory() {
    const [value, setValue] = useState('one');
    return (
      <View style={{ width: 420, gap: 24 }}>
        {(['underline', 'filled', 'outlined'] as const).map((variant) => (
          <Tabs key={variant} variant={variant} value={value} onValueChange={setValue}>
            <TabsTrigger value="one" label="One" />
            <TabsTrigger value="two" label="Two" />
            <TabsTrigger value="three" label="Three" />
          </Tabs>
        ))}
      </View>
    );
  },
};

/**
 * `hasSelection={false}` is the state a tab strip usually cannot express: a
 * filter list where nothing is chosen yet. Without it the first tab would look
 * selected before the user has selected anything.
 */
export const NoSelection: Story = {
  render: function NoSelectionStory() {
    const [value, setValue] = useState<string | undefined>(undefined);
    return (
      <View style={{ width: 420, gap: 12 }}>
        <Tabs
          value={value}
          hasSelection={value != null}
          onValueChange={setValue}
        >
          <TabsTrigger value="all" label="All" />
          <TabsTrigger value="unread" label="Unread" />
          <TabsTrigger value="flagged" label="Flagged" />
        </Tabs>
        <Text>{value == null ? 'No filter applied.' : `Filtering by ${value}.`}</Text>
      </View>
    );
  },
};

/** `fullWidth` spreads the triggers across the container rather than hugging their labels. */
export const FullWidth: Story = {
  render: function FullWidthStory() {
    const [value, setValue] = useState('a');
    return (
      <View style={{ width: 420 }}>
        <Tabs fullWidth value={value} onValueChange={setValue}>
          <TabsTrigger value="a" label="Overview" />
          <TabsTrigger value="b" label="Activity" />
        </Tabs>
      </View>
    );
  },
};
