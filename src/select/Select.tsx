import React, {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react';
import { FlatList, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';

import { bloomShadowStyle } from '../design-tokens/shadows';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { useDialogContext, useDialogControl } from '../dialog/context';
import { SheetShell } from '../dialog/SheetShell';
import {
  PANEL_BORDER_WIDTH,
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
  SELECT_TRIGGER_GAP,
  SELECT_TRIGGER_HEIGHT,
  SELECT_TRIGGER_HEIGHT_SM,
  SELECT_TRIGGER_PADDING_X,
  SELECT_TRIGGER_PADDING_Y,
  SELECT_TRIGGER_RADIUS,
  TEXT_SM,
  TEXT_SM_LINE_HEIGHT,
} from '../floating/constants';
import { TriggerSlot } from '../floating/TriggerSlot';
import type { DialogControlProps } from '../dialog/types';
import { useInteractionState } from '../hooks/use-interaction-state';
import {
  Check_Stroke2_Corner0_Rounded as CheckIcon,
} from '../icons/Check';
import {
  ChevronTopBottom_Stroke2_Corner0_Rounded as ChevronUpDownIcon,
} from '../icons/Chevron';
import { BREAKPOINTS } from '../styles/breakpoints';
import { defaultItemValueExtractor, ItemContext, useSelectItemContext } from './shared';
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

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

type SelectContextValue = {
  control: DialogControlProps;
} & Pick<SelectProps, 'value' | 'onValueChange' | 'disabled'>;

const SelectContext = createContext<SelectContextValue | null>(null);
SelectContext.displayName = 'SelectContext';

const ValueStoreContext = createContext<
  [unknown, React.Dispatch<React.SetStateAction<unknown>>]
>([undefined, () => {}]);
ValueStoreContext.displayName = 'SelectValueStoreContext';

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
  const control = useDialogControl();
  const valueStoreState = useState<unknown>(undefined);

  const ctx = useMemo<SelectContextValue>(
    () => ({ control, value, onValueChange, disabled }),
    [control, value, onValueChange, disabled],
  );

  return (
    <SelectContext.Provider value={ctx}>
      <ValueStoreContext.Provider value={valueStoreState}>
        {children}
      </ValueStoreContext.Provider>
    </SelectContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// SelectTrigger
// ---------------------------------------------------------------------------

/**
 * Opens the sheet. `asChild` hands the caller's own control the open handler,
 * the same escape hatch the other four anchored families offer.
 *
 * This replaced a render-prop trigger that handed its child a
 * `state: { hovered, focused, pressed }` object in which `hovered` was the
 * literal `false` and `pressed` was fed by a `useInteractionState` pair wired to
 * nothing. Every consumer's hover and press styling on a select trigger was
 * therefore dead while the API read as though the feature existed. There is no
 * literal to be wrong now: the trigger renders a real pressable, and a caller
 * who wants its own press states brings its own control through `asChild`.
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
  const { control } = useSelectContext();
  const { width } = useWindowDimensions();

  // The same field chrome the web fork draws — `border-input bg-background
  // h-10 flex-row items-center justify-between gap-2 rounded-md border px-3
  // py-2 shadow-sm sm:h-9` — so the two platforms agree about what a select
  // trigger looks like even though only one of them opens an anchored list.
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
      style={[styles.triggerSlot, style]}
      testID={testID}
      handle={{
        onPress: () => control.open(),
        disabled,
        accessibilityLabel: label,
        accessibilityRole: 'button',
      }}>
      {asChild ? children : field}
    </TriggerSlot>
  );
}

// ---------------------------------------------------------------------------
// SelectValue
// ---------------------------------------------------------------------------

export function SelectValue({
  placeholder,
  children: extractLabel = defaultExtractLabel,
  style,
}: SelectValueProps) {
  const [storedValue] = useContext(ValueStoreContext);
  const theme = useTheme();

  const display = storedValue != null ? extractLabel(storedValue) : placeholder;

  return (
    <Text
      numberOfLines={1}
      style={[
        styles.valueText,
        { color: storedValue != null ? theme.colors.text : theme.colors.textSecondary },
        ...(style ? [style] : []),
      ]}
    >
      {display}
    </Text>
  );
}

function defaultExtractLabel(item: unknown): React.ReactNode {
  if (item != null && typeof item === 'object' && 'label' in item) {
    return (item as { label: React.ReactNode }).label;
  }
  return String(item);
}

// ---------------------------------------------------------------------------
// SelectIcon
// ---------------------------------------------------------------------------

export function SelectIcon(_props: SelectIconProps) {
  const theme = useTheme();
  // `text-muted-foreground size-4`.
  return (
    <ChevronUpDownIcon
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
  valueExtractor = defaultItemValueExtractor,
  ...props
}: SelectContentProps<T>) {
  const { control, ...context } = useSelectContext();
  const [, setStoredValue] = useContext(ValueStoreContext);

  useLayoutEffect(() => {
    const item = items.find(
      (candidate) => valueExtractor(candidate) === context.value,
    );
    if (item !== undefined) {
      setStoredValue(item);
    }
  }, [items, context.value, valueExtractor, setStoredValue]);

  return (
    <SelectContentInner
      control={control}
      items={items}
      valueExtractor={valueExtractor}
      {...props}
      value={context.value}
      onValueChange={context.onValueChange}
      disabled={context.disabled}
    />
  );
}

type SelectContentInnerProps<T> = SelectContentProps<T> &
  Pick<SelectProps, 'value' | 'onValueChange' | 'disabled'> & {
    control: DialogControlProps;
  };

function SelectContentInner<T>({
  label = 'Select an option',
  items,
  renderItem,
  valueExtractor = defaultItemValueExtractor,
  control,
  ...contextValues
}: SelectContentInnerProps<T>) {
  const theme = useTheme();

  const render = useCallback(
    ({ item, index }: { item: T; index: number }) => {
      return renderItem(item, index, contextValues.value);
    },
    [renderItem, contextValues.value],
  );

  const ctx = useMemo<SelectContextValue>(
    () => ({
      control,
      value: contextValues.value,
      onValueChange: contextValues.onValueChange,
      disabled: contextValues.disabled,
    }),
    [control, contextValues.value, contextValues.onValueChange, contextValues.disabled],
  );

  return (
    <SheetShell
      control={control}
      label={label}
      header={
        <View style={styles.contentHeader}>
          <Text style={[styles.contentHeaderText, { color: theme.colors.text }]}>
            {label}
          </Text>
        </View>
      }
    >
      <SelectContext.Provider value={ctx}>
        <FlatList
          data={items}
          renderItem={render}
          keyExtractor={valueExtractor}
          style={styles.flatList}
        />
      </SelectContext.Provider>
    </SheetShell>
  );
}

// ---------------------------------------------------------------------------
// SelectItem
// ---------------------------------------------------------------------------

export function SelectItem({ children, value, label, style }: SelectItemProps) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const { close } = useDialogContext();
  const { value: selectedValue, onValueChange } = useSelectContext();
  const { state: focused, onIn: onFocus, onOut: onBlur } = useInteractionState();
  const {
    state: pressed,
    onIn: onPressIn,
    onOut: onPressOut,
  } = useInteractionState();

  const isSelected = value === selectedValue;

  const handlePress = useCallback(() => {
    close(() => {
      onValueChange?.(value);
    });
  }, [close, onValueChange, value]);

  const itemCtx = useMemo<SelectItemContextValue>(
    () => ({ selected: isSelected }),
    [isSelected],
  );

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={label}
      // ARIA gives `role="radio"` a checked state, not a selected one. Spelled
      // as `aria-checked` because react-native-web never reads
      // `accessibilityState`; React Native folds this back into it.
      aria-checked={isSelected}
      onPress={handlePress}
      onFocus={onFocus}
      onBlur={onBlur}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={[
        styles.item,
        { paddingVertical: width >= BREAKPOINTS.sm ? ROW_PADDING_Y_SM : ROW_PADDING_Y },
        (focused || pressed) && { backgroundColor: theme.colors.contrast50 },
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
  const { selected } = useSelectItemContext();

  return (
    <Text
      style={[
        styles.itemText,
        selected && styles.itemTextSelected,
        ...(style ? [style] : []),
      ]}
    >
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

  // The same right-hand gutter the web fork draws: `absolute right-2 size-3.5`
  // holding a `text-muted-foreground size-4` check. It used to default to
  // `RadioIndicator` in the row's FLOW on the left, so a select on native and
  // the same select on web disagreed about both the mark and the side it is on.
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

  // `bg-border -mx-1 my-1 h-px` — a filled 1px rule, not a bottom border on a
  // stretched box.
  return (
    <View style={[styles.separator, { backgroundColor: theme.colors.borderLight }]} />
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
  // `text-foreground line-clamp-1 text-sm`.
  valueText: {
    fontSize: TEXT_SM,
    lineHeight: TEXT_SM_LINE_HEIGHT,
    fontWeight: '400',
  },
  contentHeader: {
    paddingTop: 24,
    paddingBottom: 8,
    paddingHorizontal: 16,
  },
  contentHeaderText: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'left',
  },
  flatList: {
    flexGrow: 0,
  },
  // `relative flex w-full flex-row items-center gap-2 rounded-sm py-2 pl-2 pr-8
  //  sm:py-1.5`, the same row the web fork draws.
  item: {
    position: 'relative',
    width: '100%',
    paddingLeft: ROW_PADDING_X,
    paddingRight: ROW_INSET_PADDING_X,
    flexDirection: 'row',
    alignItems: 'center',
    gap: ROW_GAP,
    borderRadius: ROW_RADIUS,
  },
  itemText: {
    fontSize: TEXT_SM,
    lineHeight: TEXT_SM_LINE_HEIGHT,
  },
  // Upstream marks the selected option with the check alone and leaves its label
  // at the same weight as every other row.
  itemTextSelected: {
    fontWeight: '400',
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
