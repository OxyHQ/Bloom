/**
 * The parts of `Select` that are the SAME on both platforms, plus the contexts
 * the two forks publish.
 *
 * `SelectGroup`, `SelectLabel` and the two scroll buttons live here rather than
 * being written twice because nothing in them is platform-specific: a group is a
 * `role="group"` box, a label is a line of muted text, and the scroll buttons ask
 * one context whether there is anything to scroll — a question native answers
 * "no" by never publishing the context at all.
 *
 * The barrels export them from here directly, so each part still has exactly one
 * owner and neither fork re-exports the other's work.
 */
import React, { createContext, useContext } from 'react';
import Svg, { Path } from 'react-native-svg';

import { ROW_ICON_SIZE, ROW_LABEL_CLASS } from '../floating/constants';
import { useMenuPalette } from '../floating/menu-palette';
import { menuType, menuTypeClass } from '../floating/menu-type';
import { cx } from '../floating/shared';
import { RiArrowDownSLine as ChevronDownIcon } from '../icons/remix/RiArrowDownSLine';
import { RiArrowUpSLine as ChevronUpIcon } from '../icons/remix/RiArrowUpSLine';
import {
  StyledPressable,
  StyledText,
  StyledView,
} from '../styles/styled-primitives';
import type {
  SelectGroupProps,
  SelectItemContextValue,
  SelectLabelProps,
  SelectScrollButtonProps,
  SelectSize,
} from './types';

// ---------------------------------------------------------------------------
// Trigger state
// ---------------------------------------------------------------------------

/**
 * What a trigger tells the `SelectValue` and `SelectIcon` inside it: whether it
 * is disabled (`disabled:text-text-tertiary`) and whether its list is
 * open (the chevron's `rotate-180`). Published by BOTH forks' `SelectTrigger`.
 */
export interface SelectTriggerState {
  disabled: boolean;
  open: boolean;
  size: SelectSize;
}

export const SelectTriggerStateContext = createContext<SelectTriggerState>({
  disabled: false,
  open: false,
  size: 'md',
});
SelectTriggerStateContext.displayName = 'SelectTriggerStateContext';

// ---------------------------------------------------------------------------
// Value leading slot
// ---------------------------------------------------------------------------

/** `gap-[5px]` on `md`, `gap-1` on `sm` — the trigger value's own gap. */
const VALUE_LEADING_GAP = { md: 5, sm: 4 } as const;

/**
 * `SelectValue` with a `leading` node: `flex min-w-0 items-center`, so a dot
 * or icon in the option's content sits in a row with the label. Both forks
 * wrap their value text in this.
 */
export function SelectValueRow({
  size,
  leading,
  children,
}: {
  size: SelectSize;
  leading: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <StyledView
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: VALUE_LEADING_GAP[size],
        minWidth: 0,
        flexShrink: 1,
      }}
    >
      {leading}
      {children}
    </StyledView>
  );
}

// ---------------------------------------------------------------------------
// Chevron
// ---------------------------------------------------------------------------

/**
 * A `ChevronDownSmall` — a 16-unit viewBox, 2-unit ROUND-capped stroke
 * — drawn with its own path rather than a Bloom icon, because Bloom's filled
 * chevrons are a different glyph. `size-4` on `md`, `size-3.5` on `sm`,
 * `text-text-secondary`.
 */
export function SelectChevron({
  size,
  color,
  style,
}: {
  size: number;
  color: string;
  style?: React.ComponentProps<typeof Svg>['style'];
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={style}>
      <Path
        d="M4 7L7.29289 10.2929C7.68342 10.6834 8.31658 10.6834 8.70711 10.2929L12 7"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

// ---------------------------------------------------------------------------
// defaultItemValueExtractor
// ---------------------------------------------------------------------------

export function defaultItemValueExtractor(item: unknown): string {
  if (item != null && typeof item === 'object' && 'value' in item) {
    return String((item as { value: string }).value);
  }
  return String(item);
}

// ---------------------------------------------------------------------------
// Item context
// ---------------------------------------------------------------------------

export const ItemContext = createContext<SelectItemContextValue>({
  selected: false,
  disabled: false,
});
ItemContext.displayName = 'SelectItemContext';

export function useSelectItemContext(): SelectItemContextValue {
  return useContext(ItemContext);
}

// ---------------------------------------------------------------------------
// Scroll context
// ---------------------------------------------------------------------------

export interface SelectScrollContextValue {
  canScrollUp: boolean;
  canScrollDown: boolean;
  /** Scroll the list by one step in the given direction. */
  scrollBy: (direction: 'up' | 'down') => void;
}

const SelectScrollContext = createContext<SelectScrollContextValue | null>(null);
SelectScrollContext.displayName = 'SelectScrollContext';

export const SelectScrollProvider = SelectScrollContext.Provider;

// ---------------------------------------------------------------------------
// Parts
// ---------------------------------------------------------------------------

/** A set of related options, so a screen reader announces them as one. */
export function SelectGroup({ children, className, style }: SelectGroupProps) {
  // `group` carries no ARIA state, so there is no `aria-*` counterpart here.
  return (
    <StyledView role="group" className={cx('gap-space-4', className)} style={style}>
      {children}
    </StyledView>
  );
}
SelectGroup.displayName = 'SelectGroup';

/** The heading of a `SelectGroup`. */
export function SelectLabel({ children, className, style }: SelectLabelProps) {
  const palette = useMenuPalette();
  // The group label (`pl-2 text-body-medium text-text-secondary`), the same
  // heading a menu group carries. Colour inline only without a caller
  // `className`, which an inline colour would outrank on native.
  return (
    <StyledText
      className={cx(
        ROW_LABEL_CLASS,
        menuTypeClass('body-medium', className),
        className && 'text-muted-foreground',
        className,
      )}
      style={[
        menuType('body-medium', className),
        className ? null : { color: palette.textSecondary },
        style,
      ]}>
      {children}
    </StyledText>
  );
}
SelectLabel.displayName = 'SelectLabel';

/**
 * The two scroll affordances at the ends of a long option list.
 *
 * They render NOTHING unless the list can actually scroll that way, and on
 * NATIVE they never render at all — the native select is a bottom sheet whose
 * `FlatList` scrolls under the finger, so a chevron is a target with no pointer
 * to hit it and an affordance for a gesture the user already has. RNR reaches
 * the same conclusion with an explicit `Platform.OS !== 'web'` early return; here
 * it falls out of the context, which the native fork simply never publishes.
 *
 * `SelectContent` does NOT render them: the list scrolls with the native
 * scrollbar, and the chevrons made the panel jump in height as they appeared and
 * disappeared. They stay exported for a caller composing their own content
 * inside a `SelectScrollProvider`.
 */
function SelectScrollButton({ direction, className, style }: SelectScrollButtonProps) {
  const palette = useMenuPalette();
  const scroll = useContext(SelectScrollContext);
  const isUp = direction === 'up';
  if (!scroll) return null;
  if (isUp ? !scroll.canScrollUp : !scroll.canScrollDown) return null;

  const Chevron = isUp ? ChevronUpIcon : ChevronDownIcon;
  return (
    <StyledPressable
      accessibilityRole="button"
      accessibilityLabel={isUp ? 'Scroll up' : 'Scroll down'}
      onPress={() => scroll.scrollBy(direction)}
      // `flex cursor-default items-center justify-center py-1`, opaque so the
      // rows scrolling under it do not show through.
      className={cx('items-center justify-center py-space-4', className)}
      style={[{ backgroundColor: palette.surface }, style]}>
      {/* `size-4` — the same 16px glyph the rows use. */}
      <Chevron
        width={ROW_ICON_SIZE}
        height={ROW_ICON_SIZE}
        fill={palette.textSecondary}
      />
    </StyledPressable>
  );
}

export function SelectScrollUpButton({
  className,
  style,
}: Omit<SelectScrollButtonProps, 'direction'>) {
  return <SelectScrollButton direction="up" className={className} style={style} />;
}
SelectScrollUpButton.displayName = 'SelectScrollUpButton';

export function SelectScrollDownButton({
  className,
  style,
}: Omit<SelectScrollButtonProps, 'direction'>) {
  return <SelectScrollButton direction="down" className={className} style={style} />;
}
SelectScrollDownButton.displayName = 'SelectScrollDownButton';
