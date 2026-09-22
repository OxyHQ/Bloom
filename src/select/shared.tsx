/**
 * The parts of `Select` that are the SAME on both platforms, plus the contexts
 * the two forks publish.
 *
 * `SelectGroup`, `SelectLabel`, the two scroll buttons, the option's own text,
 * its selection mark and the rule between groups live here rather than being
 * written twice, because nothing in them is platform-specific: a group is a
 * `role="group"` box, a label is a line of muted text, the scroll buttons ask
 * one context whether there is anything to scroll — a question native answers
 * "no" by never publishing the context at all — and the last three read only
 * the palette and the per-ITEM context, which both forks provide.
 *
 * The barrels export them from here directly, so each part still has exactly one
 * owner and neither fork re-exports the other's work.
 */
import React, { createContext, useContext } from 'react';
import Svg, { Path } from 'react-native-svg';

import {
  ROW_ICON_SIZE,
  ROW_INDICATOR_END_CLASS,
  ROW_LABEL_CLASS,
  SELECT_ITEM_TEXT_CLASS,
  SELECT_SEPARATOR_CLASS,
} from '../floating/constants';
import { useMenuPalette } from '../floating/menu-palette';
import { menuType, menuTypeClass } from '../floating/menu-type';
import { cx } from '../floating/shared';
import { RiCheckLine as CheckIcon } from '../icons/remix/RiCheckLine';
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
  SelectItemIndicatorProps,
  SelectItemTextProps,
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
  size: 'md',
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

// ---------------------------------------------------------------------------
// The option's own parts
// ---------------------------------------------------------------------------

/** The type ramp an option's label takes, per list size. */
export const VALUE_TYPE = { md: 'body-medium', sm: 'body-2-medium' } as const;

/**
 * An option's label. The selected option is marked by the check and the row
 * highlight, so its text stays at the same weight as every other row's.
 *
 * The colour is inline ONLY without a caller `className`: an inline colour
 * outranks a class on native, so a `text-*` utility would be silently dead.
 */
export function SelectItemText({ children, className, style }: SelectItemTextProps) {
  const { disabled, size } = useSelectItemContext();
  const palette = useMenuPalette();
  return (
    <StyledText
      numberOfLines={1}
      className={cx(
        SELECT_ITEM_TEXT_CLASS[size],
        menuTypeClass(VALUE_TYPE[size], className),
        className && 'text-foreground',
        className,
      )}
      style={[
        menuType(VALUE_TYPE[size], className),
        className ? null : { color: disabled ? palette.textDisabled : palette.text },
        style,
      ]}>
      {children}
    </StyledText>
  );
}
SelectItemText.displayName = 'SelectItemText';

/**
 * The selection mark: `absolute right-2 flex size-3.5 items-center
 * justify-center` holding a `size-4` check.
 *
 * A select's tick sits on the RIGHT — the opposite side from a menu's — which
 * is what leaves the option's own text starting flush at `pl-2` like every
 * other line in the panel. Bloom once drew a `RadioIndicator` in a left gutter
 * in the row's FLOW, so a select and a dropdown menu disagreed about both the
 * mark and the edge it belongs on, and native and web disagreed with each
 * other on top of that.
 */
export function SelectItemIndicator({ icon: IconComponent = CheckIcon }: SelectItemIndicatorProps) {
  const palette = useMenuPalette();
  const { selected } = useSelectItemContext();

  if (!selected) return null;

  return (
    <StyledView className={ROW_INDICATOR_END_CLASS} pointerEvents="none">
      <IconComponent
        width={ROW_ICON_SIZE}
        height={ROW_ICON_SIZE}
        fill={palette.textSecondary}
      />
    </StyledView>
  );
}
SelectItemIndicator.displayName = 'SelectItemIndicator';

/**
 * The rule between groups: `-mx-2 my-1.5 h-px bg-border-button-default`,
 * bleeding back through the listbox's `p-2`. A FILLED 1px box, not a bottom
 * border on a stretched one.
 */
export function SelectSeparator() {
  const palette = useMenuPalette();
  return (
    <StyledView className={SELECT_SEPARATOR_CLASS} style={{ backgroundColor: palette.border }} />
  );
}
SelectSeparator.displayName = 'SelectSeparator';

/**
 * The label a `SelectValue` shows for an item when the caller gave no
 * `extractLabel`. Pure, and identical on both platforms.
 */
export function defaultExtractLabel(item: unknown): React.ReactNode {
  if (item != null && typeof item === 'object' && 'label' in item) {
    return (item as { label: React.ReactNode }).label;
  }
  return String(item);
}
