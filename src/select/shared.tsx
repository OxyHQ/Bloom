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
import { Pressable, StyleSheet, View } from 'react-native';

import {
  ChevronBottom_Stroke2_Corner0_Rounded as ChevronDownIcon,
  ChevronTop_Stroke2_Corner0_Rounded as ChevronUpIcon,
} from '../icons/Chevron';
import { fontSize, space } from '../styles/tokens';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
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

export const ItemContext = createContext<SelectItemContextValue>({
  selected: false,
  hovered: false,
  focused: false,
  pressed: false,
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
export function SelectGroup({ children, style }: SelectGroupProps) {
  // `group` carries no ARIA state, so there is no `aria-*` counterpart here.
  return (
    <View role="group" style={style}>
      {children}
    </View>
  );
}
SelectGroup.displayName = 'SelectGroup';

/** The heading of a `SelectGroup`. */
export function SelectLabel({ children, style }: SelectLabelProps) {
  const theme = useTheme();
  return (
    <Text style={[styles.label, { color: theme.colors.textSecondary }, style]}>
      {children}
    </Text>
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
function SelectScrollButton({ direction, style }: SelectScrollButtonProps) {
  const theme = useTheme();
  const scroll = useContext(SelectScrollContext);
  const isUp = direction === 'up';
  if (!scroll) return null;
  if (isUp ? !scroll.canScrollUp : !scroll.canScrollDown) return null;

  const Chevron = isUp ? ChevronUpIcon : ChevronDownIcon;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={isUp ? 'Scroll up' : 'Scroll down'}
      onPress={() => scroll.scrollBy(direction)}
      style={[styles.scrollButton, { backgroundColor: theme.colors.background }, style]}>
      <Chevron size="xs" fill={theme.colors.textSecondary} />
    </Pressable>
  );
}

export function SelectScrollUpButton({ style }: Omit<SelectScrollButtonProps, 'direction'>) {
  return <SelectScrollButton direction="up" style={style} />;
}
SelectScrollUpButton.displayName = 'SelectScrollUpButton';

export function SelectScrollDownButton({ style }: Omit<SelectScrollButtonProps, 'direction'>) {
  return <SelectScrollButton direction="down" style={style} />;
}
SelectScrollDownButton.displayName = 'SelectScrollDownButton';

const styles = StyleSheet.create({
  label: {
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  scrollButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: space.xs,
  },
});
