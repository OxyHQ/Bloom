import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Popover, PopoverTrigger, PopoverContent } from './index';
import { Button } from '../button';
import { Item } from '../item';
import { Text } from '../typography';

const meta: Meta = {
  title: 'Overlays/Popover',
};

export default meta;

type Story = StoryObj;

/**
 * The shadcn shape: `asChild` hands the caller's own control to the trigger, so
 * the `Button` below IS the trigger rather than something wrapped in one.
 */
export const Basic: Story = {
  render: () => (
    <View style={{ padding: 80 }}>
      <Popover>
        <PopoverTrigger asChild label="Open popover">
          <Button testID="popover-trigger">Open popover</Button>
        </PopoverTrigger>
        {/* A row list rather than prose, so it opts out of the panel's own
            `w-72 p-4` — the same thing a shadcn call site says with
            `className="w-auto p-0"`. */}
        <PopoverContent
          label="Account actions"
          align="start"
          style={{ width: 'auto', padding: 4 }}>
          <View style={{ minWidth: 200 }} testID="popover-panel">
            <Item title="Profile" density="compact" onPress={() => {}} />
            <Item title="Settings" density="compact" onPress={() => {}} />
            <Item title="Sign out" density="compact" destructive onPress={() => {}} />
          </View>
        </PopoverContent>
      </Popover>
    </View>
  ),
};

/** Prose rather than rows — the panel's own `w-72 p-4` is the shape for it. */
export const Prose: Story = {
  render: () => (
    <View style={{ padding: 80, alignItems: 'flex-end' }}>
      <Popover>
        <PopoverTrigger asChild label="What is this?">
          <Button variant="secondary">What is this?</Button>
        </PopoverTrigger>
        <PopoverContent label="Explanation" align="end">
          <View style={{ gap: 8 }}>
            <Text style={{ fontWeight: '600' }}>Two-factor authentication</Text>
            <Text>
              A second step when you sign in, so a leaked password is not enough on its own.
            </Text>
          </View>
        </PopoverContent>
      </Popover>
    </View>
  ),
};

/**
 * Controlled: the caller owns `open`. Both stories above are uncontrolled, which
 * is the same pair of modes every anchored Bloom family offers.
 */
export const Controlled: Story = {
  render: function ControlledPopover() {
    const [open, setOpen] = React.useState(false);
    return (
      <View style={{ padding: 80, gap: 12 }}>
        <Text>open: {String(open)}</Text>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild label="Toggle">
            <Button variant="secondary">Toggle</Button>
          </PopoverTrigger>
          <PopoverContent label="Controlled panel">
            <Text>Driven by the story's own state.</Text>
          </PopoverContent>
        </Popover>
      </View>
    );
  },
};
