import React, { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from '../button';
import { Text } from '../typography';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from './index';

const meta: Meta = {
  title: 'Overlays/DropdownMenu',
};

export default meta;

type Story = StoryObj;

export const Basic: Story = {
  render: () => (
    <View style={{ padding: 80 }}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild label="Open menu">
          <Button testID="menu-trigger">Open menu</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent testID="menu-panel">
          <DropdownMenuLabel>My account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem
              testID="menu-profile"
              trailing={<DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>}>
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem trailing={<DropdownMenuShortcut>⌘,</DropdownMenuShortcut>}>
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem disabled>Billing</DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive">Sign out</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </View>
  ),
};

/**
 * Checkbox and radio rows. Both spell their state as `aria-checked` through
 * `Item`, which is the only spelling react-native-web reads.
 */
export const Selection: Story = {
  render: function SelectionMenu() {
    const [showGrid, setShowGrid] = useState(true);
    const [showRuler, setShowRuler] = useState(false);
    const [sort, setSort] = useState('newest');

    return (
      <View style={{ padding: 80, gap: 12 }}>
        <Text>
          grid: {String(showGrid)} · ruler: {String(showRuler)} · sort: {sort}
        </Text>
        <DropdownMenu>
          <DropdownMenuTrigger asChild label="View options">
            <Button variant="secondary">View options</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Show</DropdownMenuLabel>
            <DropdownMenuCheckboxItem
              checked={showGrid}
              onCheckedChange={setShowGrid}
              keepOpen>
              Grid
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={showRuler}
              onCheckedChange={setShowRuler}
              keepOpen>
              Ruler
            </DropdownMenuCheckboxItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Sort by</DropdownMenuLabel>
            <DropdownMenuRadioGroup value={sort} onValueChange={setSort}>
              <DropdownMenuRadioItem value="newest">Newest</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="oldest">Oldest</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="name">Name</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </View>
    );
  },
};

/**
 * A sub-menu FLIES OUT beside its trigger row on web, as shadcn's does, and
 * stays an inline disclosure on native, as react-native-reusables' own does.
 * Hovering the row opens it; the close is delayed so a diagonal pointer path
 * across the gap does not dismiss it; Right and Left enter and leave it; Escape
 * closes the sub before the menu.
 */
export const Submenu: Story = {
  render: () => (
    <View style={{ padding: 80 }}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild label="Share">
          <Button variant="secondary">Share</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem testID="plain-item">Copy link</DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger testID="submenu-trigger">Send to…</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem testID="submenu-item-email">Email</DropdownMenuItem>
              <DropdownMenuItem testID="submenu-item-messages">Messages</DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSeparator />
          <DropdownMenuItem inset testID="inset-item">
            Embed
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </View>
  ),
};

/**
 * The same sub-menu with no room to its right.
 *
 * Two things are needed to get the trigger to the right edge at all, and BOTH
 * fail silently by leaving it where it was: `alignSelf: 'stretch'`, because the
 * preview decorator lays stories out with `alignItems: 'flex-start'` so a story
 * box shrinks to its content; and `justifyContent` rather than `alignItems`,
 * because the trigger's own wrapper carries `alignSelf: 'flex-start'` and a
 * cross-axis alignment on the parent cannot override it.
 *
 * There is no second positioner: `overlay/dropdown-placement` fit-flip-clamps on
 * whichever axis `side` names, so the panel flips to the LEFT of its row on its
 * own, exactly as a root dropdown flips above its trigger.
 */
export const SubmenuWithNoRoomToTheRight: Story = {
  render: () => (
    <View
      style={{
        alignSelf: 'stretch',
        flexDirection: 'row',
        justifyContent: 'flex-end',
        paddingVertical: 24,
      }}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild label="Share">
          <Button variant="secondary">Share</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem testID="plain-item">Copy link</DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger testID="submenu-trigger">Send to…</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem testID="submenu-item-email">Email</DropdownMenuItem>
              <DropdownMenuItem testID="submenu-item-messages">Messages</DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>
    </View>
  ),
};

/** Anchored to the right edge of its trigger. */
export const AlignEnd: Story = {
  render: () => (
    <View style={{ padding: 80, alignItems: 'flex-end' }}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild label="Actions">
          <Button variant="secondary">Actions</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>Rename</DropdownMenuItem>
          <DropdownMenuItem>Duplicate</DropdownMenuItem>
          <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </View>
  ),
};
