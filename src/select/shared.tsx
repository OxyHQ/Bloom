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

import { ROW_ICON_SIZE } from '../floating/constants';
import { cx } from '../floating/shared';
import {
  ChevronBottom_Stroke2_Corner0_Rounded as ChevronDownIcon,
  ChevronTop_Stroke2_Corner0_Rounded as ChevronUpIcon,
} from '../icons/Chevron';
import {
  StyledPressable,
  StyledText,
  StyledView,
} from '../styles/styled-primitives';
import { useTheme } from '../theme/use-theme';
import type {
  SelectGroupProps,
  SelectItemContextValue,
  SelectLabelProps,
  SelectScrollButtonProps,
} from './types';

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

export const ItemContext = createContext<SelectItemContextValue>({ selected: false });
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
    <StyledView role="group" className={className} style={style}>
      {children}
    </StyledView>
  );
}
SelectGroup.displayName = 'SelectGroup';

/** The heading of a `SelectGroup`. */
export function SelectLabel({ children, className, style }: SelectLabelProps) {
  // `text-muted-foreground px-2 py-1.5 text-xs` — a select's group heading is
  // the one label in this vocabulary that IS muted and IS `text-xs`, unlike a
  // menu's (`text-foreground text-sm font-medium`).
  return (
    <StyledText
      className={cx('px-space-8 py-1.5 text-xs text-muted-foreground', className)}
      style={style}>
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
 * `SelectContent` renders both, so a caller gets them by default. They are
 * exported as well, for a caller composing their own content.
 */
function SelectScrollButton({ direction, className, style }: SelectScrollButtonProps) {
  const theme = useTheme();
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
      className={cx('items-center justify-center py-space-4 bg-popover', className)}
      style={style}>
      {/* `size-4` — the same 16px glyph the rows use. */}
      <Chevron
        width={ROW_ICON_SIZE}
        height={ROW_ICON_SIZE}
        fill={theme.colors.textSecondary}
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
