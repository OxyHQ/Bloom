import React, { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from '../button';
import { Check_Stroke2_Corner0_Rounded as CheckIcon } from '../icons/Check';
import {
  ChevronBottom_Stroke2_Corner0_Rounded as ChevronBottomIcon,
  ChevronRight_Stroke2_Corner0_Rounded as ChevronRightIcon,
} from '../icons/Chevron';
import { Person_Stroke2_Corner0_Rounded as PersonIcon } from '../icons/Person';
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
            {/* A leading glyph takes the target's base treatment: full colour
                at 70%, not a secondary-coloured icon. */}
            <DropdownMenuItem
              testID="menu-profile"
              leading={<PersonIcon size="sm" />}
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

const POWER_LABELS = ['Instant', 'Medium', 'High', 'Extra High', 'Pro'] as const;

/** The reference insets five ticks by 13px from the ends of its 196px rail. */
function powerSliderPosition(index: number): string {
  return `calc(${index * 25}% + ${13 - index * 6.5}px)`;
}

/**
 * The complete menu shape needed by Alia's composer: a measured trigger, the
 * compact power slider, the advanced rows, a lateral sub-menu and radio checks
 * on the trailing edge. It stays on the public `DropdownMenu*` vocabulary — no
 * product imports Radix or forks these behaviours locally.
 */
export const IntelligencePicker: Story = {
  render: function IntelligencePickerMenu() {
    const theme = useTheme();
    const [power, setPower] = useState(1);
    const [advanced, setAdvanced] = useState(true);
    const [sliderActive, setSliderActive] = useState(false);
    const [dragging, setDragging] = useState(false);
    const [effortSubmenuOpen, setEffortSubmenuOpen] = useState(true);
    const [model, setModel] = useState('automatic');
    const [effort, setEffort] = useState('medium');
    const sliderRef = React.useRef<HTMLDivElement>(null);
    const powerLabel = POWER_LABELS[power] ?? 'Medium';

    const setPowerFromPointer = (event: React.PointerEvent<HTMLDivElement>) => {
      const rect = sliderRef.current?.getBoundingClientRect();
      if (!rect) return;
      const index = Math.round(((event.clientX - rect.left) / rect.width) * 4);
      setPower(Math.max(0, Math.min(POWER_LABELS.length - 1, index)));
    };

    const movePower = (direction: -1 | 1) => {
      setPower((value) => Math.max(0, Math.min(POWER_LABELS.length - 1, value + direction)));
    };

    const selectedMark = (
      <CheckIcon size="sm" fill={theme.colors.text} />
    );

    return (
      <StyledView className="min-h-[420px] w-[680px] items-end px-space-80 py-space-40">
        <DropdownMenu defaultOpen>
          <DropdownMenuTrigger
            asChild
            label="Power and model"
            className="w-[171px]"
            testID="intelligence-trigger">
            <Button
              variant="ghost"
              size="small"
              className="h-9 w-full rounded-full justify-center"
              icon={<ChevronBottomIcon size="sm" />}
              iconPosition="right">
              {powerLabel}
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            sideOffset={4}
            className="w-[224px] min-w-[224px] rounded-[20px] py-2.5"
            testID="intelligence-menu">
            <div
              role="group"
              data-testid="composer-intelligence-picker-content"
              data-view={advanced ? 'advanced' : 'simple'}
              className="relative flex w-[224px] flex-col overflow-hidden transition-[height] duration-200 ease-out"
              style={{ height: advanced ? 112 : 76 }}>
              <div
                inert={advanced}
                aria-hidden={advanced}
                className={`absolute inset-x-0 top-0 flex h-10 items-center justify-center transition-all duration-200 ${
                  advanced
                    ? 'pointer-events-none -translate-y-2 opacity-0'
                    : 'translate-y-0 opacity-100'
                }`}>
                <div
                  ref={sliderRef}
                  role="slider"
                  tabIndex={advanced ? -1 : 0}
                  aria-label="Power"
                  aria-valuemin={0}
                  aria-valuemax={4}
                  aria-valuenow={power}
                  aria-valuetext={powerLabel}
                  onPointerEnter={() => setSliderActive(true)}
                  onPointerLeave={() => {
                    if (!dragging) setSliderActive(false);
                  }}
                  onPointerDown={(event) => {
                    event.currentTarget.setPointerCapture(event.pointerId);
                    setDragging(true);
                    setSliderActive(true);
                    setPowerFromPointer(event);
                  }}
                  onPointerMove={(event) => {
                    if (dragging) setPowerFromPointer(event);
                  }}
                  onPointerUp={(event) => {
                    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                      event.currentTarget.releasePointerCapture(event.pointerId);
                    }
                    setDragging(false);
                  }}
                  onPointerCancel={() => setDragging(false)}
                  onFocus={() => setSliderActive(true)}
                  onBlur={() => setSliderActive(false)}
                  onKeyDown={(event) => {
                    if (event.key === 'ArrowLeft') {
                      event.preventDefault();
                      movePower(-1);
                    }
                    if (event.key === 'ArrowRight') {
                      event.preventDefault();
                      movePower(1);
                    }
                  }}
                  className="relative h-6 w-[196px] touch-none cursor-pointer rounded-full bg-muted-foreground/25 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-popover">
                  <span
                    aria-hidden="true"
                    className="absolute inset-y-0 left-0 rounded-full bg-primary"
                    style={{ width: powerSliderPosition(power) }}
                  />
                  {POWER_LABELS.map((label, index) => (
                    <span
                      key={label}
                      aria-hidden="true"
                      className={`absolute top-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full ${
                        power >= index
                          ? 'bg-primary-foreground/35'
                          : 'bg-muted-foreground/65'
                      }`}
                      style={{ left: powerSliderPosition(index) }}
                    />
                  ))}
                  <span
                    aria-hidden="true"
                    className="absolute top-1/2 h-[30px] w-[30px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-background shadow-sm"
                    style={{ left: powerSliderPosition(power) }}
                  />
                </div>
              </div>

              <button
                type="button"
                role="menuitem"
                aria-expanded={advanced}
                aria-label={advanced ? 'Show compact options' : 'Show advanced options'}
                onPointerDown={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                }}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  setAdvanced((value) => !value);
                }}
                className={`absolute inset-x-0 flex h-9 w-full cursor-default items-center border-0 bg-transparent px-4 text-left text-sm text-foreground outline-none transition-[top,opacity] duration-200 hover:bg-accent focus:bg-accent ${
                  advanced ? 'top-0' : 'top-10'
                } ${!advanced && sliderActive ? 'pointer-events-none opacity-0' : 'opacity-100'}`}>
                <span className="flex items-center gap-1">
                  <span>Advanced</span>
                  <span
                    className={`flex h-4 w-4 items-center justify-center transition-transform duration-200 ${
                      advanced ? 'rotate-90' : ''
                    }`}>
                    <ChevronRightIcon size="sm" fill={theme.colors.textSecondary} />
                  </span>
                </span>
              </button>

              <span
                aria-hidden="true"
                className={`pointer-events-none absolute inset-x-0 top-10 flex h-9 items-center justify-between px-4 text-xs text-muted-foreground transition-opacity duration-150 ${
                  !advanced && sliderActive ? 'opacity-100' : 'opacity-0'
                }`}>
                <span>Faster</span>
                <span>Smarter</span>
              </span>

              <span
                aria-hidden="true"
                className={`absolute left-4 right-4 top-9 h-px bg-border transition-opacity duration-200 ${
                  advanced ? 'opacity-100' : 'opacity-0'
                }`}
              />

              <div
                inert={!advanced}
                aria-hidden={!advanced}
                className={`absolute inset-x-0 top-9 h-[76px] pt-1 transition-all duration-200 ${
                  advanced
                    ? 'translate-y-0 opacity-100'
                    : 'pointer-events-none translate-y-2 opacity-0'
                }`}>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger accessibilityLabel="Model, Automatic">
                    <StyledView className="min-w-0 flex-1 flex-row items-center">
                      <Text className="text-sm text-foreground">Model</Text>
                      <Text className="ms-auto max-w-24 text-sm text-muted-foreground" numberOfLines={1}>
                        Automatic
                      </Text>
                    </StyledView>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent
                    label="Model"
                    side="right"
                    align="start"
                    sideOffset={2}
                    className="w-[202px]"
                    testID="model-submenu">
                    <DropdownMenuRadioGroup value={model} onValueChange={setModel}>
                      <DropdownMenuRadioItem
                        value="automatic"
                        indicator={selectedMark}
                        indicatorPosition="trailing">
                        Automatic
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem
                        value="balanced"
                        indicator={selectedMark}
                        indicatorPosition="trailing">
                        Balanced
                      </DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                <DropdownMenuSub
                  open={advanced && effortSubmenuOpen}
                  onOpenChange={setEffortSubmenuOpen}>
                  <DropdownMenuSubTrigger
                    accessibilityLabel="Effort, Medium"
                    testID="effort-submenu-trigger">
                    <StyledView className="min-w-0 flex-1 flex-row items-center">
                      <Text className="text-sm text-foreground">Effort</Text>
                      <Text className="ms-auto max-w-24 text-sm text-muted-foreground" numberOfLines={1}>
                        Medium
                      </Text>
                    </StyledView>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent
                    label="Effort"
                    side="right"
                    align="start"
                    sideOffset={2}
                    className="w-[150px]"
                    testID="effort-submenu">
                    <DropdownMenuRadioGroup value={effort} onValueChange={setEffort}>
                      {([
                        ['instant', 'Instant'],
                        ['medium', 'Medium'],
                        ['high', 'High'],
                        ['extra-high', 'Extra High'],
                        ['pro', 'Pro'],
                      ] as const).map(([value, label]) => (
                        <DropdownMenuRadioItem
                          key={value}
                          value={value}
                          disabled={value === 'pro'}
                          indicator={selectedMark}
                          indicatorPosition="trailing">
                          {label}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </StyledView>
    );
  },
};
