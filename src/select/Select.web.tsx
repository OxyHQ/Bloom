import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { FloatingPanel } from '../floating/FloatingPanel';
import { TriggerSlot } from '../floating/TriggerSlot';
import { useAnchorRect } from '../floating/use-anchor-rect';
import { useInteractionState } from '../hooks/use-interaction-state';
import {
  ChevronBottom_Stroke2_Corner0_Rounded as ChevronDownIcon,
} from '../icons/Chevron';
import { Check_Stroke2_Corner0_Rounded as CheckIcon } from '../icons/Check';
import {
  defaultItemValueExtractor,
  ItemContext,
  SelectScrollDownButton,
  SelectScrollProvider,
  SelectScrollUpButton,
  useSelectItemContext,
} from './shared';
import type {
  SelectContentProps,
  SelectIconProps,
  SelectItemIndicatorProps,
  SelectItemProps,
  SelectItemTextProps,
  SelectProps,
  SelectItemContextValue,
  SelectTriggerProps,
  SelectValueProps,
} from './types';

const VIEWPORT_GUTTER = 8;
const SELECT_OFFSET = 6;
/** Tallest an anchored option list grows before it scrolls. */
const DEFAULT_MAX_HEIGHT = 320;
/** How far one press of a scroll button moves the list. */
const SCROLL_STEP = 96;
/**
 * Sub-pixel slack. A scroll container's content height and its viewport height
 * are fractional, so an exact comparison leaves a scroll button visible on a
 * list that is already at its end and cannot move.
 */
const SCROLL_EPSILON = 1;

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

type SelectContextValue = Pick<SelectProps, 'value' | 'onValueChange' | 'disabled'> & {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  /** The trigger box, so `SelectContent` can anchor itself against it. */
  triggerRef: React.RefObject<View | null>;
};

const SelectContext = createContext<SelectContextValue | null>(null);
SelectContext.displayName = 'SelectContext';

function useSelectContext(): SelectContextValue {
  const ctx = useContext(SelectContext);
  if (!ctx) {
    throw new Error('Select components must be used within a Select');
  }
  return ctx;
}

// ---------------------------------------------------------------------------
// Select
// ---------------------------------------------------------------------------

export function Select({ children, value, onValueChange, disabled }: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<View | null>(null);

  const ctx = useMemo<SelectContextValue>(
    () => ({
      value,
      onValueChange,
      disabled,
      isOpen,
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
      triggerRef,
    }),
    [value, onValueChange, disabled, isOpen],
  );

  return <SelectContext.Provider value={ctx}>{children}</SelectContext.Provider>;
}

// ---------------------------------------------------------------------------
// SelectTrigger
// ---------------------------------------------------------------------------

/**
 * Opens the dropdown, and is the box it anchors to.
 *
 * See the native fork for why the render-prop form is gone: it published a
 * `state` object whose `pressed` was a hardcoded `false` and whose `hovered`
 * the native fork never computed at all, so trigger press and hover styling was
 * dead on one platform and half-dead on the other while the API read as though
 * the feature existed.
 */
export function SelectTrigger({
  children,
  asChild,
  disabled,
  label,
  style,
  testID,
}: SelectTriggerProps) {
  const ctx = useSelectContext();

  return (
    <TriggerSlot
      asChild={asChild}
      anchorRef={ctx.triggerRef}
      style={[styles.triggerSlot, style]}
      testID={testID}
      handle={{
        // A dropdown trigger TOGGLES — pressing an open select's trigger closes
        // it rather than reopening it.
        onPress: () => (ctx.isOpen ? ctx.close() : ctx.open()),
        disabled,
        accessibilityLabel: label,
        accessibilityRole: 'button',
        'aria-expanded': ctx.isOpen,
      }}
    >
      {children}
    </TriggerSlot>
  );
}

// ---------------------------------------------------------------------------
// SelectValue
// ---------------------------------------------------------------------------

export function SelectValue({
  children: extractLabel,
  placeholder,
  style,
}: SelectValueProps) {
  const { value } = useSelectContext();
  const theme = useTheme();

  const display = value ?? placeholder ?? '';

  return (
    <Text
      numberOfLines={1}
      style={[
        styles.valueText,
        { color: value ? theme.colors.text : theme.colors.textSecondary },
        ...(style ? [style] : []),
      ]}
    >
      {extractLabel && value ? extractLabel(value) : display}
    </Text>
  );
}

// ---------------------------------------------------------------------------
// SelectIcon
// ---------------------------------------------------------------------------

export function SelectIcon({ style }: SelectIconProps) {
  const theme = useTheme();
  return <ChevronDownIcon style={style} size="xs" fill={theme.colors.textSecondary} />;
}

// ---------------------------------------------------------------------------
// SelectContent
// ---------------------------------------------------------------------------

export function SelectContent<T>({
  items,
  renderItem,
  label = 'Select an option',
  valueExtractor = defaultItemValueExtractor,
  maxHeight = DEFAULT_MAX_HEIGHT,
}: SelectContentProps<T>) {
  const ctx = useSelectContext();
  const anchor = useAnchorRect(ctx.triggerRef, ctx.isOpen);
  const listRef = useRef<ScrollView | null>(null);
  // Where the option list is scrolled to, tracked so the two scroll buttons can
  // hide when there is nothing left in their direction. A button that is always
  // there says the list scrolls when it does not.
  const [scrollState, setScrollState] = useState({ offset: 0, content: 0, viewport: 0 });

  const scrollBy = useCallback(
    (direction: 'up' | 'down') => {
      const step = direction === 'down' ? SCROLL_STEP : -SCROLL_STEP;
      const next = Math.max(
        0,
        Math.min(scrollState.offset + step, scrollState.content - scrollState.viewport),
      );
      listRef.current?.scrollTo({ y: next, animated: true });
    },
    [scrollState],
  );

  const scroll = useMemo(
    () => ({
      canScrollUp: scrollState.offset > SCROLL_EPSILON,
      canScrollDown:
        scrollState.content - scrollState.viewport - scrollState.offset > SCROLL_EPSILON,
      scrollBy,
    }),
    [scrollState, scrollBy],
  );
  // The dropdown is the same anchored surface the four menu families render, so
  // it goes through the same `FloatingPanel`. That deletes this fork's own
  // portal, its own backdrop and its own copy of the measure/flip/clamp effect,
  // and gains the one thing it never had: Escape to dismiss.
  //
  // `minWidth` is the TRIGGER's width, which is what makes a select dropdown
  // line up under its field rather than shrink-wrap its longest option.
  return (
    <FloatingPanel
      open={ctx.isOpen}
      anchor={anchor}
      role="menu"
      label={label}
      align="start"
      sideOffset={SELECT_OFFSET}
      minWidth={anchor ? anchor.right - anchor.left : undefined}
      onDismiss={ctx.close}
      style={styles.dropdown}
    >
      <SelectScrollProvider value={scroll}>
        <SelectScrollUpButton />
        <ScrollView
          ref={listRef}
          style={{ maxHeight }}
          scrollEventThrottle={16}
          onScroll={(event) =>
            setScrollState({
              offset: event.nativeEvent.contentOffset.y,
              content: event.nativeEvent.contentSize.height,
              viewport: event.nativeEvent.layoutMeasurement.height,
            })
          }
          onContentSizeChange={(_width, height) =>
            setScrollState((current) => ({ ...current, content: height }))
          }
          onLayout={(event) =>
            setScrollState((current) => ({
              ...current,
              viewport: event.nativeEvent.layout.height,
            }))
          }>
          {items.map((item, index) => (
            <React.Fragment key={valueExtractor(item)}>
              {renderItem(item, index, ctx.value)}
            </React.Fragment>
          ))}
        </ScrollView>
        <SelectScrollDownButton />
      </SelectScrollProvider>
    </FloatingPanel>
  );
}

// ---------------------------------------------------------------------------
// SelectItem
// ---------------------------------------------------------------------------

export function SelectItem({ ref, value, label, children, style }: SelectItemProps) {
  const theme = useTheme();
  const ctx = useSelectContext();
  const {
    state: hovered,
    onIn: onMouseEnter,
    onOut: onMouseLeave,
  } = useInteractionState();
  const { state: focused, onIn: onFocus, onOut: onBlur } = useInteractionState();

  const isSelected = ctx.value === value;

  // `selected` only. `hovered` and `focused` still drive this row's own
  // background below, but they are no longer PUBLISHED — nothing ever read
  // them, and `pressed` was published as a literal `false`.
  const itemCtx = useMemo<SelectItemContextValue>(
    () => ({ selected: isSelected }),
    [isSelected],
  );

  return (
    <Pressable
      ref={ref}
      accessibilityRole="radio"
      // The native fork has always applied this; web declared `label` and then
      // dropped it, leaving every option a `role="radio"` with no accessible
      // name for a screen reader to announce.
      accessibilityLabel={label}
      // `aria-checked` is the state ARIA defines for `role="radio"`, and the
      // only one react-native-web emits — it never reads `accessibilityState`,
      // so this fork's options announced no selection at all.
      aria-checked={isSelected}
      onPress={() => {
        ctx.onValueChange?.(value);
        ctx.close();
      }}
      onFocus={onFocus}
      onBlur={onBlur}
      {...({
        onMouseEnter,
        onMouseLeave,
      } as Record<string, () => void>)}
      style={[
        styles.item,
        (hovered || focused) && { backgroundColor: theme.colors.primaryLight },
        style,
      ]}
    >
      <ItemContext.Provider value={itemCtx}>{children}</ItemContext.Provider>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// SelectItemText
// ---------------------------------------------------------------------------

export function SelectItemText({ children, style }: SelectItemTextProps) {
  return (
    <Text style={[styles.itemText, ...(style ? [style] : [])]}>
      {children}
    </Text>
  );
}

// ---------------------------------------------------------------------------
// SelectItemIndicator
// ---------------------------------------------------------------------------

export function SelectItemIndicator({ icon: IconComponent = CheckIcon }: SelectItemIndicatorProps) {
  const { selected } = useSelectItemContext();

  if (!selected) {
    return <View style={styles.itemIndicatorPlaceholder} />;
  }

  return (
    <View style={styles.itemIndicatorContainer}>
      <IconComponent size="sm" />
    </View>
  );
}

// ---------------------------------------------------------------------------
// SelectSeparator
// ---------------------------------------------------------------------------

export function SelectSeparator() {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.separator,
        { backgroundColor: theme.colors.borderLight },
      ]}
    />
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  // `TriggerSlot`'s wrapper is `alignSelf: 'flex-start'` so an anchored surface
  // lines up with the CONTROL. A select trigger is a full-width field, so it
  // stretches instead — the same exception the combobox makes.
  triggerSlot: {
    alignSelf: 'stretch',
  },
  valueText: {
    fontSize: 16,
  },
  // Only the INSET is the select's own now. `FloatingPanel` owns the surface's
  // position, background, border, radius, elevation and pointer-events, which
  // is why the fixed-position and backdrop entries that used to live here are
  // gone rather than merely unused.
  dropdown: {
    padding: 4,
  },
  item: {
    position: 'relative',
    flexDirection: 'row',
    // Matches the native sheet row (`index.tsx`) and the web `Menu` row. Bloom's
    // web build is what renders on touch tablets, where this dropdown — not the
    // sheet — is the select, so the row carries the same 44dp target on both
    // platforms.
    minHeight: 44,
    paddingLeft: 30,
    paddingRight: 8,
    alignItems: 'center',
    borderRadius: 4,
    paddingVertical: 4,
  },
  itemText: {
    fontSize: 14,
  },
  itemIndicatorPlaceholder: {
    position: 'absolute',
    left: 0,
    width: 30,
  },
  itemIndicatorContainer: {
    position: 'absolute',
    left: 0,
    width: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  separator: {
    height: 1,
    marginVertical: 4,
    width: '100%',
  },
});

export { useSelectItemContext };
