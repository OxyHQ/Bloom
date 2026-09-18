import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import type { BloomIconComponent } from '../icons/icon-component';

import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverFooter,
  PopoverHeader,
  PopoverSeparator,
  PopoverTitle,
  PopoverTrigger,
} from './index';
import { Avatar } from '../avatar';
import { Button } from '../button';
import { useMenuPalette } from '../floating/menu-palette';
import {
  RiAddFill,
  RiEqualizer3Line,
  RiInformationLine,
  RiLogoutBoxRLine,
  RiSettings3Line,
  RiUserLine,
} from '../icons/remix';
import { TextField, TextFieldInput, TextFieldLabel } from '../text-field';
import { Text } from '../typography';

const meta: Meta = {
  title: 'Base/Popover',
};

export default meta;

type Story = StoryObj;

/**
 * A menu row as the panels draw it: `flex items-center gap-2 rounded-2lg
 * p-2`, a 20px secondary icon and a `text-body-medium` label, washed with the
 * dropdown hover colour. Story-local — a popover whose body is ONLY rows wants
 * `DropdownMenu`, which ships them with keyboard state and ARIA roles.
 */
function PanelRow({
  icon: Icon,
  label,
  onPress,
}: {
  icon: BloomIconComponent;
  label: string;
  onPress?: () => void;
}) {
  const palette = useMenuPalette();
  return (
    <Pressable
      role="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ hovered, pressed }: { hovered?: boolean; pressed: boolean }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        padding: 8,
        borderRadius: 10,
        backgroundColor: hovered || pressed ? palette.rowHighlight : 'transparent',
      })}>
      <Icon width={20} height={20} fill={palette.textSecondary} />
      <Text variant="body-medium" numberOfLines={1} style={{ color: palette.text, flex: 1 }}>
        {label}
      </Text>
    </Pressable>
  );
}

/**
 * The default panel: the floating surface — 266px, `rounded-2xl`, 1px
 * `border-button-default`, `bg-background-primary-default`, `p-2.5`,
 * `shadow-dropdown` — holding a titled explanation.
 */
export const Basic: Story = {
  render: () => (
    <View style={{ padding: 80, alignItems: 'flex-start' }}>
      <Popover defaultOpen>
        <PopoverTrigger asChild label="What is this?">
          <Button variant="secondary" leadingIcon={RiInformationLine} testID="popover-trigger">
            What is this?
          </Button>
        </PopoverTrigger>
        <PopoverContent label="Two-factor authentication" align="start" testID="popover-panel">
          <PopoverHeader style={{ paddingBottom: 4 }}>
            <PopoverTitle>Two-factor authentication</PopoverTitle>
            <PopoverDescription numberOfLines={0}>
              A second step when you sign in, so a leaked password is not enough on its own.
            </PopoverDescription>
          </PopoverHeader>
        </PopoverContent>
      </Popover>
    </View>
  ),
};

/**
 * Header, grouped rows, separator and footer — the dashboard team menu's
 * anatomy: a `px-2 pt-1` header (avatar + title + description) 7px above the
 * rows, a full-bleed `-mx-2.5` rule, and a `px-2 pb-2` footer.
 */
export const WithHeaderAndFooter: Story = {
  render: () => (
    <View style={{ padding: 80, alignItems: 'flex-start' }}>
      <Popover defaultOpen>
        <PopoverTrigger asChild label="Design team">
          <Button variant="secondary">Design team</Button>
        </PopoverTrigger>
        <PopoverContent label="Design team menu" align="start" testID="popover-header-footer">
          <View style={{ gap: 7 }}>
            <PopoverHeader leading={<Avatar name="Design team" size={32} />}>
              <PopoverTitle>Design team</PopoverTitle>
              <PopoverDescription>team@example.com</PopoverDescription>
            </PopoverHeader>
            <View style={{ gap: 4 }}>
              <PanelRow icon={RiUserLine} label="Profile" />
              <PanelRow icon={RiSettings3Line} label="Settings" />
            </View>
          </View>
          <PopoverSeparator />
          <PanelRow icon={RiLogoutBoxRLine} label="Sign out" />
          <PopoverSeparator />
          <PopoverFooter style={{ justifyContent: 'space-between', paddingTop: 4 }}>
            <PopoverTitle tone="secondary">Bloom</PopoverTitle>
            <PopoverDescription>v1.0.1</PopoverDescription>
          </PopoverFooter>
        </PopoverContent>
      </Popover>
    </View>
  ),
};

/**
 * A labelled row list over an action footer — the account menu's anatomy:
 * a `pt-[5px]` group label in `text-secondary` 6px above the rows, a 28px
 * separator gap, and two `flex-1` small secondary buttons in the `px-2 pb-2`
 * footer (18px from the panel edge on every side).
 */
export const RowList: Story = {
  render: () => (
    <View style={{ padding: 80, alignItems: 'flex-start' }}>
      <Popover defaultOpen>
        <PopoverTrigger asChild label="Account">
          <Button variant="secondary">Account</Button>
        </PopoverTrigger>
        <PopoverContent label="Account menu" align="start" testID="popover-row-list">
          <View style={{ gap: 6, paddingTop: 5 }}>
            <PopoverTitle tone="secondary" style={{ paddingLeft: 8, paddingRight: 8 }}>
              Users with access
            </PopoverTitle>
            <View style={{ gap: 4 }}>
              <PanelRow icon={RiUserLine} label="Maya Chen" />
              <PanelRow icon={RiUserLine} label="Leo Park" />
              <PanelRow icon={RiUserLine} label="Sam Rivera" />
            </View>
          </View>
          <PopoverSeparator style={{ marginTop: 14, marginBottom: 14 }} />
          <PopoverFooter>
            <Button variant="secondary" size="small" leadingIcon={RiAddFill} style={{ flex: 1 }}>
              Add user
            </Button>
            <Button variant="secondary" size="small" leadingIcon={RiEqualizer3Line} style={{ flex: 1 }}>
              Manage
            </Button>
          </PopoverFooter>
        </PopoverContent>
      </Popover>
    </View>
  ),
};

/** Form content: a field and a confirm row, closed from inside via `onOpenChange`. */
export const FormContent: Story = {
  render: function FormPopover() {
    const [open, setOpen] = useState(true);
    const [name, setName] = useState('Q3 roadmap');
    return (
      <View style={{ padding: 80, alignItems: 'flex-start' }}>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild label="Rename">
            <Button variant="secondary">Rename</Button>
          </PopoverTrigger>
          <PopoverContent label="Rename board" align="start" testID="popover-form">
            <PopoverHeader>
              <PopoverTitle>Rename board</PopoverTitle>
            </PopoverHeader>
            <View style={{ paddingHorizontal: 8, paddingTop: 10, paddingBottom: 12, gap: 6 }}>
              <TextFieldLabel>Name</TextFieldLabel>
              <TextField>
                <TextFieldInput label="Name" value={name} onChangeText={setName} />
              </TextField>
            </View>
            <PopoverFooter style={{ justifyContent: 'flex-end', gap: 10 }}>
              <Button variant="secondary" size="small" onPress={() => setOpen(false)}>
                Cancel
              </Button>
              <Button size="small" onPress={() => setOpen(false)}>
                Save
              </Button>
            </PopoverFooter>
          </PopoverContent>
        </Popover>
      </View>
    );
  },
};

const PLACEMENTS = [
  { side: 'bottom', align: 'start' },
  { side: 'bottom', align: 'center' },
  { side: 'bottom', align: 'end' },
  { side: 'top', align: 'start' },
  { side: 'right', align: 'start' },
  { side: 'left', align: 'end' },
] as const;

/**
 * `side` × `align`, each at the default 8px offset. The panel scales in from the
 * corner nearest its trigger, and flips when the named side does not fit.
 */
export const Placements: Story = {
  render: () => (
    <View style={{ padding: 120, flexDirection: 'row', flexWrap: 'wrap', gap: 32, maxWidth: 1100 }}>
      {PLACEMENTS.map(({ side, align }) => (
        <Popover key={`${side}-${align}`}>
          <PopoverTrigger asChild label={`${side} ${align}`}>
            <Button variant="secondary" testID={`placement-${side}-${align}`}>
              {`${side} / ${align}`}
            </Button>
          </PopoverTrigger>
          <PopoverContent label={`${side} ${align} panel`} side={side} align={align}>
            <PopoverHeader style={{ paddingBottom: 4 }}>
              <PopoverTitle>{`side="${side}"`}</PopoverTitle>
              <PopoverDescription>{`align="${align}"`}</PopoverDescription>
            </PopoverHeader>
          </PopoverContent>
        </Popover>
      ))}
    </View>
  ),
};

/**
 * A caller's `className` still reaches the panel: every chrome property its
 * utilities name drops the matching inline default (`w-[200px] p-2` here, the
 * `DropdownPopover` call-site shape).
 */
export const ClassNameOverride: Story = {
  render: () => (
    <View style={{ padding: 80, alignItems: 'flex-start' }}>
      <Popover defaultOpen>
        <PopoverTrigger asChild label="More">
          <Button variant="secondary">More</Button>
        </PopoverTrigger>
        <PopoverContent label="More actions" align="start" className="w-[200px] p-2" testID="popover-classname">
          <PanelRow icon={RiSettings3Line} label="Settings" />
          <PanelRow icon={RiLogoutBoxRLine} label="Sign out" />
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
 * That asymmetry is why the third trigger below cannot gate this: its child IS
 * a `Pressable` carrying its own `disabled`, so the widget hides the missing
 * guard and the browser reports a broken build as correct. Measured,
 * with a control, both ways. Here the child hides nothing, so removing the
 * guard in `cloneTrigger` opens the panel on the right-hand popover and Chrome
 * says so.
 *
 * The first two triggers are the same component; only `disabled` differs.
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

      {/* The BLIND-SPOT control: a real Pressable carrying its own `disabled`.
          react-native-web swallows its press before the composed handler runs,
          so this stays closed even with the guard removed — the browser cannot
          gate the defect through it (formerly `Combobox`'s disabled story). */}
      <Popover>
        <PopoverTrigger asChild disabled label="Pressable disabled" testID="popover-pressable-disabled">
          <Pressable
            disabled
            style={{ paddingVertical: 10, paddingHorizontal: 16, borderWidth: 1, borderRadius: 8, opacity: 0.5 }}>
            <Text>Pressable disabled</Text>
          </Pressable>
        </PopoverTrigger>
        <PopoverContent label="Pressable disabled panel">
          <View style={{ padding: 16, minWidth: 200 }}>
            <Text>This one must never appear either.</Text>
          </View>
        </PopoverContent>
      </Popover>
    </View>
  ),
};

/**
 * Controlled: the caller owns `open`. The other stories are uncontrolled, which
 * is the same pair of modes every anchored Bloom family offers.
 */
export const Controlled: Story = {
  render: function ControlledPopover() {
    const [open, setOpen] = React.useState(false);
    return (
      <View style={{ padding: 80, gap: 12, alignItems: 'flex-start' }}>
        <Text>open: {String(open)}</Text>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild label="Toggle">
            <Button variant="secondary">Toggle</Button>
          </PopoverTrigger>
          <PopoverContent label="Controlled panel" align="start">
            <PopoverHeader style={{ paddingBottom: 4 }}>
              <PopoverTitle>Controlled</PopoverTitle>
              <PopoverDescription>Driven by the story's own state.</PopoverDescription>
            </PopoverHeader>
          </PopoverContent>
        </Popover>
      </View>
    );
  },
};
