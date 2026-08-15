import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';

import { bloomShadowStyle } from '../design-tokens/shadows';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import {
  PANEL_BORDER_WIDTH,
  PANEL_PADDING,
  ROW_GAP,
  ROW_ICON_SIZE,
  ROW_INDICATOR_BOX,
  ROW_INDICATOR_INSET,
  ROW_INSET_PADDING_X,
  ROW_PADDING_X,
  ROW_PADDING_Y,
  ROW_PADDING_Y_SM,
  ROW_RADIUS,
  ROW_SEPARATOR_INSET_X,
  ROW_SEPARATOR_MARGIN_Y,
  ROW_SEPARATOR_THICKNESS,
  SELECT_MAX_HEIGHT,
  SELECT_TRIGGER_GAP,
  SELECT_TRIGGER_HEIGHT,
  SELECT_TRIGGER_HEIGHT_SM,
  SELECT_TRIGGER_PADDING_X,
  SELECT_TRIGGER_PADDING_Y,
  SELECT_TRIGGER_RADIUS,
  TEXT_SM,
  TEXT_SM_LINE_HEIGHT,
} from '../floating/constants';
import { FloatingPanel } from '../floating/FloatingPanel';
import { TriggerSlot } from '../floating/TriggerSlot';
import { useAnchorRect } from '../floating/use-anchor-rect';
import { useInteractionState } from '../hooks/use-interaction-state';
import { BREAKPOINTS } from '../styles/breakpoints';
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

const SELECT_OFFSET = 6;
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
  const theme = useTheme();
  const ctx = useSelectContext();
  const { width } = useWindowDimensions();

  // `border-input bg-background flex h-10 flex-row items-center justify-between
  //  gap-2 rounded-md border px-3 py-2 shadow-sm shadow-black/5 sm:h-9`.
  //
  // The trigger IS the field. It used to render its children into a bare
  // pressable with no border, height or background at all, so a ported shadcn
  // select was a line of text and a chevron floating on the page — the single
  // largest visual gap in this family.
  const field = (
    <View
      style={[
        styles.trigger,
        {
          height: width >= BREAKPOINTS.sm ? SELECT_TRIGGER_HEIGHT_SM : SELECT_TRIGGER_HEIGHT,
          backgroundColor: theme.colors.background,
          borderColor: theme.colors.border,
        },
        bloomShadowStyle('s'),
        disabled ? styles.triggerDisabled : null,
      ]}>
      {children}
    </View>
  );

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
      {asChild ? children : field}
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
  // `text-muted-foreground size-4`.
  return (
    <ChevronDownIcon
      style={style}
      width={ROW_ICON_SIZE}
      height={ROW_ICON_SIZE}
      fill={theme.colors.textSecondary}
    />
  );
}

// ---------------------------------------------------------------------------
// SelectContent
// ---------------------------------------------------------------------------

export function SelectContent<T>({
  items,
  renderItem,
  label = 'Select an option',
  valueExtractor = defaultItemValueExtractor,
  maxHeight = SELECT_MAX_HEIGHT,
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
  const { width } = useWindowDimensions();
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
        { paddingVertical: width >= BREAKPOINTS.sm ? ROW_PADDING_Y_SM : ROW_PADDING_Y },
        // `focus:bg-accent` — the same wash a menu row takes, which is what
        // `Item` and `SubtleHover` paint everywhere else in the library.
        (hovered || focused) && { backgroundColor: theme.colors.contrast50 },
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
  const theme = useTheme();
  const { selected } = useSelectItemContext();

  // `absolute right-2 flex size-3.5 items-center justify-center` holding a
  // `text-muted-foreground size-4` check. A select's tick sits on the RIGHT — the
  // opposite side from a menu's — which is what leaves the option's own text
  // starting flush at `pl-2` like every other line in the panel. Bloom drew it in
  // a 30px LEFT gutter, so a select and a dropdown menu disagreed about which
  // edge a selection mark belongs on.
  if (!selected) return null;

  return (
    <View style={styles.itemIndicatorContainer} pointerEvents="none">
      <IconComponent
        width={ROW_ICON_SIZE}
        height={ROW_ICON_SIZE}
        fill={theme.colors.textSecondary}
      />
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
  // `flex flex-row items-center justify-between gap-2 rounded-md border px-3 py-2`.
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SELECT_TRIGGER_GAP,
    paddingHorizontal: SELECT_TRIGGER_PADDING_X,
    paddingVertical: SELECT_TRIGGER_PADDING_Y,
    borderWidth: PANEL_BORDER_WIDTH,
    borderRadius: SELECT_TRIGGER_RADIUS,
  },
  triggerDisabled: {
    opacity: 0.5,
  },
  // `text-foreground line-clamp-1 flex flex-row items-center gap-2 text-sm`.
  valueText: {
    fontSize: TEXT_SM,
    lineHeight: TEXT_SM_LINE_HEIGHT,
  },
  // Only the INSET is the select's own now. `FloatingPanel` owns the surface's
  // position, background, border, radius, elevation and pointer-events, which
  // is why the fixed-position and backdrop entries that used to live here are
  // gone rather than merely unused. `p-1` on the viewport, matching the panel's.
  dropdown: {
    padding: PANEL_PADDING,
  },
  // `relative flex w-full flex-row items-center gap-2 rounded-sm py-2 pl-2 pr-8
  //  sm:py-1.5` — no minimum height, and the 32px gutter is on the RIGHT.
  item: {
    position: 'relative',
    flexDirection: 'row',
    width: '100%',
    gap: ROW_GAP,
    paddingLeft: ROW_PADDING_X,
    paddingRight: ROW_INSET_PADDING_X,
    alignItems: 'center',
    borderRadius: ROW_RADIUS,
  },
  // `text-foreground select-none text-sm`.
  itemText: {
    fontSize: TEXT_SM,
    lineHeight: TEXT_SM_LINE_HEIGHT,
  },
  itemIndicatorContainer: {
    position: 'absolute',
    right: ROW_INDICATOR_INSET,
    top: 0,
    bottom: 0,
    width: ROW_INDICATOR_BOX,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // `bg-border -mx-1 my-1 h-px`.
  separator: {
    height: ROW_SEPARATOR_THICKNESS,
    marginVertical: ROW_SEPARATOR_MARGIN_Y,
    marginHorizontal: ROW_SEPARATOR_INSET_X,
  },
});

export { useSelectItemContext };
