import React, {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react';
import { FlatList, StyleSheet } from 'react-native';

import { bloomShadowStyle } from '../design-tokens/shadows';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { useDialogContext, useDialogControl } from '../dialog/context';
import { SheetShell } from '../dialog/SheetShell';
import {
  ROW_HIGHLIGHT_CLASS,
  ROW_ICON_SIZE,
  ROW_INDICATOR_END_CLASS,
  ROW_SEPARATOR_CLASS,
  SELECT_ITEM_CLASS,
  SELECT_ITEM_TEXT_CLASS,
  SELECT_PLACEHOLDER_CLASS,
  SELECT_TRIGGER_CLASS,
  SELECT_VALUE_CLASS,
  SELECT_TRIGGER_POPUP,
} from '../floating/constants';
import { cx } from '../floating/shared';
import { TriggerSlot } from '../floating/TriggerSlot';
import type { DialogControlProps } from '../dialog/types';
import { useInteractionState } from '../hooks/use-interaction-state';
import {
  Check_Stroke2_Corner0_Rounded as CheckIcon,
} from '../icons/Check';
import {
  ChevronTopBottom_Stroke2_Corner0_Rounded as ChevronUpDownIcon,
} from '../icons/Chevron';
import {
  StyledPressable,
  StyledText,
  StyledView,
} from '../styles/styled-primitives';
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
  className,
  style,
  testID,
}: SelectTriggerProps) {
  const { control } = useSelectContext();

  // The same field chrome the web fork draws — `border-input bg-background
  // h-10 flex-row items-center justify-between gap-2 rounded-md border px-3
  // py-2 shadow-sm` — so the two platforms agree about what a select trigger
  // looks like even though only one of them opens an anchored list.
  const field = (
    <StyledView
      className={cx(SELECT_TRIGGER_CLASS, disabled && 'opacity-50', className)}
      // `shadow-s` reaches WEB through the class; NATIVE takes the same role as
      // an inline style, because `design-tokens/shadows` is platform-forked and
      // its own contract is that a multi-layer `box-shadow` is not something to
      // rely on NativeWind translating to RN elevation. On web the two agree, so
      // whichever wins paints the same thing.
      style={bloomShadowStyle('s')}>
      {children}
    </StyledView>
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
        'aria-haspopup': SELECT_TRIGGER_POPUP,
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
  className,
  style,
}: SelectValueProps) {
  const [storedValue] = useContext(ValueStoreContext);

  const display = storedValue != null ? extractLabel(storedValue) : placeholder;

  return (
    <StyledText
      numberOfLines={1}
      className={cx(
        storedValue != null ? SELECT_VALUE_CLASS : SELECT_PLACEHOLDER_CLASS,
        className,
      )}
      style={style}
    >
      {display}
    </StyledText>
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
        <StyledView className="pt-space-24 pb-space-8 px-space-16">
          <Text style={[styles.contentHeaderText, { color: theme.colors.text }]}>
            {label}
          </Text>
        </StyledView>
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

export function SelectItem({ children, value, label, className, style }: SelectItemProps) {
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
    <StyledPressable
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
      className={cx(SELECT_ITEM_CLASS, (focused || pressed) && ROW_HIGHLIGHT_CLASS, className)}
      style={style}
    >
      <ItemContext.Provider value={itemCtx}>{children}</ItemContext.Provider>
    </StyledPressable>
  );
}

// ---------------------------------------------------------------------------
// SelectItemText
// ---------------------------------------------------------------------------

export function SelectItemText({ children, className, style }: SelectItemTextProps) {
  // The selected option is marked with the check ALONE: its label stays at the
  // same weight as every other row's, which is what the target does.
  return (
    <StyledText numberOfLines={1} className={cx(SELECT_ITEM_TEXT_CLASS, className)} style={style}>
      {children}
    </StyledText>
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
    <StyledView className={ROW_INDICATOR_END_CLASS} pointerEvents="none">
      <IconComponent
        width={ROW_ICON_SIZE}
        height={ROW_ICON_SIZE}
        fill={theme.colors.textSecondary}
      />
    </StyledView>
  );
}

// ---------------------------------------------------------------------------
// SelectSeparator
// ---------------------------------------------------------------------------

export function SelectSeparator() {
  // `bg-border -mx-1 my-1 h-px` — a filled 1px rule, not a bottom border on a
  // stretched box.
  return <StyledView className={ROW_SEPARATOR_CLASS} />;
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  // `TriggerSlot`'s wrapper is `alignSelf: 'flex-start'` so an anchored surface
  // lines up with the CONTROL. A select trigger is a full-width field, so it
  // stretches instead — the same exception the combobox makes. Inline rather
  // than a class because it overrides `TriggerSlot`'s own inline default, and a
  // class cannot outrank one.
  triggerSlot: {
    alignSelf: 'stretch',
  },
  contentHeaderText: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'left',
  },
  flatList: {
    flexGrow: 0,
  },
});

export { useSelectItemContext };
