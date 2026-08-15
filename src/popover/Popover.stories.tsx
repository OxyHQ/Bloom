import React from 'react';
import { Pressable, View } from 'react-native';
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
        <PopoverContent label="Account actions" align="start">
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

/** Prose rather than rows: the body pads itself, since the panel does not. */
export const Prose: Story = {
  render: () => (
    <View style={{ padding: 80, alignItems: 'flex-end' }}>
      <Popover>
        <PopoverTrigger asChild label="What is this?">
          <Button variant="secondary">What is this?</Button>
        </PopoverTrigger>
        <PopoverContent label="Explanation" align="end" maxWidth={280}>
          <View style={{ padding: 16, gap: 8 }}>
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
 * The props `TriggerSlot` clones onto an `asChild` child. A consumer writing
 * their own trigger receives exactly these.
 */
type InjectedTriggerProps = {
  onPress?: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
  accessibilityRole?: 'button';
  'aria-expanded'?: boolean;
  children?: React.ReactNode;
};

/**
 * A consumer's own trigger control: it forwards the press and the a11y props,
 * and — like a great many real ones — has no notion of `disabled` at all. That
 * is not a contrived component, it is the ordinary shape of a control that
 * draws its own disabled state somewhere else, or simply never needed one.
 */
function ForwardingTrigger(props: InjectedTriggerProps) {
  return (
    <Pressable
      onPress={props.onPress}
      accessibilityLabel={props.accessibilityLabel}
      accessibilityRole={props.accessibilityRole}
      aria-expanded={props['aria-expanded']}
      style={{ paddingVertical: 10, paddingHorizontal: 16, borderWidth: 1, borderRadius: 8 }}>
      <Text>{props.children}</Text>
    </Pressable>
  );
}

/**
 * THE CONFIGURATION WHERE `disabled` IS ACTUALLY REACHABLE, and the only one a
 * browser can gate.
 *
 * `TriggerSlot` composes the child's `onPress` with its own open handler. Put
 * the guard only in the child's callback and the open still happens, so what
 * decides whether `disabled` holds is the TYPE of element the caller passed:
 * a real `Pressable` swallows the press itself, and a control like the one
 * below — which forwards `onPress` and ignores `disabled` — does not.
 *
 * That asymmetry is why `Combobox`'s own disabled story cannot gate this: its
 * child IS a `Pressable` carrying its own `disabled`, so the widget hides the
 * missing guard and the browser reports a broken build as correct. Measured,
 * with a control, both ways. Here the child hides nothing, so removing the
 * guard in `cloneTrigger` opens the panel on the right-hand popover and Chrome
 * says so.
 *
 * Both triggers are the same component. Only `disabled` differs.
 */
export const AsChildDisabled: Story = {
  render: () => (
    <View style={{ padding: 80, flexDirection: 'row', gap: 24 }}>
      <Popover>
        <PopoverTrigger asChild label="Enabled" testID="popover-forwarding-enabled">
          <ForwardingTrigger>Enabled</ForwardingTrigger>
        </PopoverTrigger>
        <PopoverContent label="Enabled panel">
          <View style={{ padding: 16, minWidth: 200 }}>
            <Text>This one opens.</Text>
          </View>
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger asChild disabled label="Disabled" testID="popover-forwarding-disabled">
          <ForwardingTrigger>Disabled</ForwardingTrigger>
        </PopoverTrigger>
        <PopoverContent label="Disabled panel">
          <View style={{ padding: 16, minWidth: 200 }}>
            <Text>This one must never appear.</Text>
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
            <View style={{ padding: 16 }}>
              <Text>Driven by the story's own state.</Text>
            </View>
          </PopoverContent>
        </Popover>
      </View>
    );
  },
};
