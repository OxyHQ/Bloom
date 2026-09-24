import { useArgs } from 'storybook/preview-api';
import React, { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Tabs, TabsTrigger } from './index';
import { Text } from '../typography';
import { RiChat3Line, RiHome5Line, RiSettings3Line } from '../icons/remix';

const meta: Meta = {
  component: Tabs,
  title: 'Base/Tabs',
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
  parameters: { controls: { disable: true } },
  render: function BasicStory() {
    const [value, setValue] = useState('posts');
    return (
      <View style={{ width: 420, maxWidth: '100%', gap: 12 }}>
        <Tabs label="Profile sections" value={value} onValueChange={setValue}>
          <TabsTrigger value="posts" label="Posts" />
          <TabsTrigger value="replies" label="Replies" />
          <TabsTrigger value="media" label="Media" />
        </Tabs>
        <Text testID="tabs-panel">{PANELS[value]}</Text>
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
  parameters: { controls: { disable: true } },
  render: function WithCountsStory() {
    const [value, setValue] = useState('inbox');
    return (
      <View style={{ width: 420, maxWidth: '100%' }}>
        <Tabs value={value} onValueChange={setValue}>
          <TabsTrigger value="inbox" label="Inbox" count={12} />
          <TabsTrigger value="drafts" label="Drafts" count={3} />
          <TabsTrigger value="sent" label="Sent" count={41} />
        </Tabs>
      </View>
    );
  },
};

/**
 * `leadingIcon` takes an icon COMPONENT and paints it in the label's colour for
 * the current state — 16px on the underline strip.
 */
export const WithIcons: Story = {
  parameters: { controls: { disable: true } },
  render: function WithIconsStory() {
    const [value, setValue] = useState('overview');
    return (
      <View style={{ width: 520, maxWidth: '100%' }}>
        <Tabs value={value} onValueChange={setValue}>
          <TabsTrigger value="overview" label="Overview" count={12} />
          <TabsTrigger value="activity" label="Activity" count={3} />
          <TabsTrigger value="settings" label="Settings" leadingIcon={RiSettings3Line} />
        </Tabs>
      </View>
    );
  },
};

/**
 * `pill` — a blue pill switcher. The selected pill slides between
 * triggers; an idle trigger shows a hover layer.
 */
export const Pill: Story = {
  parameters: { controls: { disable: true } },
  render: function PillStory() {
    const [value, setValue] = useState('changes');
    return (
      <View style={{ width: 520, maxWidth: '100%' }}>
        <Tabs variant="pill" value={value} onValueChange={setValue}>
          <TabsTrigger value="changes" label="Changes" leadingIcon={RiChat3Line} />
          <TabsTrigger value="browser" label="Browser" leadingIcon={RiHome5Line} />
          <TabsTrigger value="plain" label="Plain" />
        </Tabs>
      </View>
    );
  },
};

/** `filled` — a gray pill: a quieter neutral pill for scope/filter rows. */
export const Filled: Story = {
  parameters: { controls: { disable: true } },
  render: function FilledStory() {
    const [value, setValue] = useState('all');
    return (
      <View style={{ width: 520, maxWidth: '100%' }}>
        <Tabs variant="filled" value={value} onValueChange={setValue}>
          <TabsTrigger value="all" label="All" />
          <TabsTrigger value="tools" label="Tools" leadingIcon={RiHome5Line} />
          <TabsTrigger value="agents" label="Agents" />
        </Tabs>
      </View>
    );
  },
};

/** Every variant, sharing one selection. `outlined` is an alias of `pill`. */
export const Variants: Story = {
  parameters: { controls: { disable: true } },
  render: function VariantsStory() {
    const [value, setValue] = useState('one');
    return (
      <View style={{ width: 420, maxWidth: '100%', gap: 24 }}>
        {(['underline', 'pill', 'filled'] as const).map((variant) => (
          <Tabs key={variant} variant={variant} value={value} onValueChange={setValue}>
            <TabsTrigger value="one" label="One" leadingIcon={RiHome5Line} />
            <TabsTrigger value="two" label="Two" count={4} />
            <TabsTrigger value="three" label="Three" />
          </Tabs>
        ))}
      </View>
    );
  },
};

/** A disabled trigger dims to 50% and ignores presses, on every variant. */
export const Disabled: Story = {
  parameters: { controls: { disable: true } },
  render: function DisabledStory() {
    const [value, setValue] = useState('a');
    return (
      <View style={{ width: 420, maxWidth: '100%', gap: 24 }}>
        {(['underline', 'pill', 'filled'] as const).map((variant) => (
          <Tabs key={variant} variant={variant} value={value} onValueChange={setValue}>
            <TabsTrigger value="a" label="Active" />
            <TabsTrigger value="b" label="Disabled" disabled />
            <TabsTrigger value="c" label="Other" />
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
  parameters: { controls: { disable: true } },
  render: function NoSelectionStory() {
    const [value, setValue] = useState<string | undefined>(undefined);
    return (
      <View style={{ width: 420, maxWidth: '100%', gap: 12 }}>
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
  parameters: { controls: { disable: true } },
  render: function FullWidthStory() {
    const [value, setValue] = useState('a');
    return (
      <View style={{ width: 420, maxWidth: '100%' }}>
        <Tabs fullWidth value={value} onValueChange={setValue}>
          <TabsTrigger value="a" label="Overview" />
          <TabsTrigger value="b" label="Activity" />
        </Tabs>
      </View>
    );
  },
};

export const Playground: StoryObj<typeof Tabs> = {
  args: { value: 'posts', variant: 'underline', fullWidth: true },
  parameters: { controls: { disable: false, include: ['value', 'variant', 'fullWidth'] } },
  argTypes: { value: { control: 'select', options: ['posts','replies','media'] }, variant: { control: 'select', options: ['underline','pill','filled'] }, fullWidth: { control: 'boolean' } },
  render: function Playground(args) {
    const [, updateArgs] = useArgs();
    return <View style={{ width: 520, maxWidth: '100%' }}><View style={{ gap: 16 }}><Tabs {...args} onValueChange={value => updateArgs({ value })}>{Object.keys(PANELS).map(value => <TabsTrigger key={value} value={value} label={value} />)}</Tabs><Text>{PANELS[args.value ?? 'posts']}</Text></View></View>;
  },
};
