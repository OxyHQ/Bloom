import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from '../button';
import { PANEL_CLASS } from '../floating/constants';
import { cx } from '../floating/shared';
import { Check_Stroke2_Corner0_Rounded as CheckIcon } from '../icons/Check';
import { ChevronBottom_Stroke2_Corner0_Rounded as ChevronBottomIcon } from '../icons/Chevron';
import { Item } from '../item';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '../dropdown-menu';
import { StyledView } from '../styles/styled-primitives';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { LevelPicker } from './index';

const meta: Meta<typeof LevelPicker> = {
  title: 'Forms/LevelPicker',
  component: LevelPicker,
};

export default meta;

type Story = StoryObj<typeof LevelPicker>;

const QUALITY = ['Draft', 'Standard', 'Fine', 'Very fine', 'Maximum'] as const;

/**
 * A panel to sit the picker in without opening a real menu — the same classes
 * `floating/FloatingPanel` paints, so the geometry is what a menu's would be
 * while the story stays a plain, always-mounted tree.
 */
function Panel({ children }: { children: React.ReactNode }) {
  return <StyledView className={cx(PANEL_CLASS, 'w-[224px]')}>{children}</StyledView>;
}

/**
 * The whole surface: a stepped rail, end captions that swap in while it is
 * being worked, and a disclosure that reveals the detail rows underneath.
 *
 * The details here are ordinary `Item` rows rather than sub-menus, which is the
 * point of the standalone case: the picker requires no menu around it.
 */
export const Basic: Story = {
  render: function BasicPicker() {
    const [level, setLevel] = useState(1);
    const [expanded, setExpanded] = useState(false);
    const [format, setFormat] = useState('PNG');
    const [space, setSpace] = useState('sRGB');

    return (
      <StyledView className="items-start p-space-40">
        <Panel>
          <LevelPicker
            testID="level-picker"
            accessibilityLabel="Quality"
            levels={[...QUALITY]}
            value={level}
            onValueChange={setLevel}
            minLabel="Faster"
            maxLabel="Sharper"
            detailsLabel="Advanced"
            expanded={expanded}
            onExpandedChange={setExpanded}>
            <Item
              density="compact"
              role="menuitem"
              title="Format"
              onPress={() => setFormat((current) => (current === 'PNG' ? 'JPEG' : 'PNG'))}
              trailing={<Text className="text-sm text-muted-foreground">{format}</Text>}
              testID="details-format"
            />
            <Item
              density="compact"
              role="menuitem"
              title="Colour space"
              onPress={() => setSpace((current) => (current === 'sRGB' ? 'P3' : 'sRGB'))}
              trailing={<Text className="text-sm text-muted-foreground">{space}</Text>}
              testID="details-colour-space"
            />
          </LevelPicker>
        </Panel>
        <Text className="mt-space-16 text-sm text-muted-foreground">
          {QUALITY[level]} · details {expanded ? 'shown' : 'hidden'}
        </Text>
      </StyledView>
    );
  },
};

/**
 * The step count comes from `levels` alone: two stops, one at each end of the
 * rail, with the same inset keeping the knob on the track.
 */
export const TwoLevels: Story = {
  render: function TwoLevelPicker() {
    const [level, setLevel] = useState(0);

    return (
      <StyledView className="items-start p-space-40">
        <Panel>
          <LevelPicker
            testID="two-level-picker"
            accessibilityLabel="Privacy"
            levels={['Public', 'Private']}
            value={level}
            onValueChange={setLevel}
            minLabel="Open"
            maxLabel="Closed"
            detailsLabel="Who can see this">
            <Item density="compact" role="menuitem" title="Only me" />
            <Item density="compact" role="menuitem" title="People I follow" />
          </LevelPicker>
        </Panel>
      </StyledView>
    );
  },
};

/**
 * The shape this was drawn for: the picker as the BODY of a dropdown menu, with
 * flyout sub-menus in its details region. The picker owns the rail, the reveal
 * and the spacing; the rows are the menu's own vocabulary and the picker knows
 * nothing about what they choose.
 */
export const InAMenu: Story = {
  render: function MenuPicker() {
    const theme = useTheme();
    const [level, setLevel] = useState(1);
    const [format, setFormat] = useState('automatic');
    const [profile, setProfile] = useState('balanced');
    const selectedMark = <CheckIcon size="sm" fill={theme.colors.text} />;

    return (
      <StyledView className="min-h-[420px] w-[680px] items-end px-space-80 py-space-40">
        <DropdownMenu defaultOpen>
          <DropdownMenuTrigger asChild label="Quality" className="w-[171px]">
            <Button
              variant="ghost"
              size="small"
              className="h-9 w-full justify-center rounded-full"
              icon={<ChevronBottomIcon size="sm" />}
              iconPosition="right">
              {QUALITY[level]}
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            sideOffset={4}
            className="w-[224px] min-w-[224px] rounded-[20px] py-space-8"
            testID="menu-picker-panel">
            <LevelPicker
              testID="menu-level-picker"
              accessibilityLabel="Quality"
              levels={[...QUALITY]}
              value={level}
              onValueChange={setLevel}
              minLabel="Faster"
              maxLabel="Sharper"
              detailsLabel="Advanced">
              <DropdownMenuSub>
                <DropdownMenuSubTrigger
                  accessibilityLabel="Format, Automatic"
                  testID="format-submenu-trigger">
                  <StyledView className="min-w-0 flex-1 flex-row items-center">
                    <Text className="text-sm text-foreground">Format</Text>
                    <Text
                      className="ms-auto max-w-24 text-sm text-muted-foreground"
                      numberOfLines={1}>
                      Automatic
                    </Text>
                  </StyledView>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent
                  label="Format"
                  side="right"
                  align="start"
                  sideOffset={2}
                  className="w-[202px]"
                  testID="format-submenu">
                  <DropdownMenuRadioGroup value={format} onValueChange={setFormat}>
                    <DropdownMenuRadioItem
                      value="automatic"
                      indicator={selectedMark}
                      indicatorPosition="trailing">
                      Automatic
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem
                      value="png"
                      indicator={selectedMark}
                      indicatorPosition="trailing">
                      PNG
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              <DropdownMenuSub>
                <DropdownMenuSubTrigger accessibilityLabel="Profile, Balanced">
                  <StyledView className="min-w-0 flex-1 flex-row items-center">
                    <Text className="text-sm text-foreground">Profile</Text>
                    <Text
                      className="ms-auto max-w-24 text-sm text-muted-foreground"
                      numberOfLines={1}>
                      Balanced
                    </Text>
                  </StyledView>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent
                  label="Profile"
                  side="right"
                  align="start"
                  sideOffset={2}
                  className="w-[150px]">
                  <DropdownMenuRadioGroup value={profile} onValueChange={setProfile}>
                    <DropdownMenuRadioItem
                      value="balanced"
                      indicator={selectedMark}
                      indicatorPosition="trailing">
                      Balanced
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem
                      value="vivid"
                      indicator={selectedMark}
                      indicatorPosition="trailing">
                      Vivid
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </LevelPicker>
          </DropdownMenuContent>
        </DropdownMenu>
      </StyledView>
    );
  },
};
