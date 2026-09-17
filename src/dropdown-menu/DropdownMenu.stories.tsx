import React, { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from '../button';
import {
  RiArrowDownSLine as ChevronBottomIcon,
  RiCheckLine as CheckIcon,
  RiUserLine as PersonIcon,
} from '../icons/remix';
import { useMenuPalette } from '../floating/menu-palette';
import { StyledView } from '../styles/styled-primitives';
import { useTheme } from '../theme/use-theme';
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
  title: 'Base/Dropdown',
};

export default meta;

type Story = StoryObj;

/** A leading icon in `text-secondary`, matching the rows. */
function SecondaryPersonIcon() {
  const palette = useMenuPalette();
  return <PersonIcon size="sm" fill={palette.textSecondary} />;
}

/**
 * A 266px `p-2.5` panel with a 16px corner and `shadow-dropdown`,
 * 36px rows 4px apart on a `neutral-100` hover wash, a `text-secondary` group
 * label, a full-bleed separator, a `text-disabled` row and a destructive row.
 */
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
              leading={<SecondaryPersonIcon />}
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
 * Real mouse or pen movement over the row opens it; the close is delayed so a
 * diagonal pointer path across the gap does not dismiss it; Right and Left
 * enter and leave it; Escape closes the sub before the menu.
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
 * Regression fixture for SIBLING sub-menus: two flyouts anchored off the same
 * panel, one directly under the other.
 *
 * Each `Sub` owns its own open state and its own close timer, so moving the
 * pointer from one trigger to the next used to leave BOTH panels on screen for
 * `CLOSE_DELAY_MS` — the first was still serving out its grace delay while the
 * second had already opened. The delay exists to cover the diagonal gap between
 * a row and its OWN panel; a pointer that landed on another row of the parent
 * panel is not crossing that gap, and the browser gate measures exactly that.
 *
 * Two rows and nothing else: a slider or a controlled `open` would put a second
 * mechanism between the pointer and the assertion.
 */
export const SiblingSubmenus: Story = {
  render: () => (
    <View style={{ padding: 80 }}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild label="Share">
          <Button variant="secondary">Share</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger testID="sibling-first-trigger">Model</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem testID="sibling-first-item">Automatic</DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger testID="sibling-second-trigger">Effort</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem testID="sibling-second-item">Medium</DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>
    </View>
  ),
};

const SUBMENU_LAYOUT_SHIFT_PX = 120;

/**
 * Regression fixture for hover intent: expanding layout moves the trigger
 * under a parked pointer without opening it. One real pointer move on the row
 * then opens the flyout. The browser gate drives both halves.
 */
export const SubmenuLayoutShiftDoesNotOpen: Story = {
  render: function SubmenuLayoutShiftFixture() {
    const [shifted, setShifted] = useState(false);
    const [submenuOpen, setSubmenuOpen] = useState(false);

    return (
      <View style={{ minHeight: 420, padding: 80 }}>
        <DropdownMenu defaultOpen>
          <DropdownMenuTrigger asChild label="Layout intent fixture">
            <Button variant="secondary">Layout intent fixture</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem
              keepOpen
              onPress={() => setShifted(true)}
              testID="layout-shift-control">
              Move submenu row
            </DropdownMenuItem>
            <div
              aria-hidden="true"
              className="transition-[height] duration-700 ease-linear"
              style={{ height: shifted ? SUBMENU_LAYOUT_SHIFT_PX : 0 }}
            />
            <DropdownMenuSub open={submenuOpen} onOpenChange={setSubmenuOpen}>
              <DropdownMenuSubTrigger testID="layout-submenu-trigger">
                Layout-sensitive submenu
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem testID="layout-submenu-item">Moved item</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>
      </View>
    );
  },
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
