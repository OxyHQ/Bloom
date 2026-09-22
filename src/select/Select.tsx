import { useBloomAppearance } from '../appearance';
import React, {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react';
import { FlatList, StyleSheet } from 'react-native';

import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { useDialogContext, useDialogControl } from '../dialog/context';
import { SheetShell } from '../dialog/SheetShell';
import {
  ROW_ICON_SIZE,
  ROW_INDICATOR_END_CLASS,
  SELECT_CHEVRON_SIZE,
  SELECT_ITEM_CLASS,
  SELECT_ITEM_SIZE_CLASS,
  SELECT_ITEM_TEXT_CLASS,
  SELECT_SEPARATOR_CLASS,
  SELECT_TRIGGER_CLASS,
  SELECT_TRIGGER_POPUP,
  SELECT_TRIGGER_SIZE_CLASS,
  SELECT_VALUE_CLASS,
} from '../floating/constants';
import { useMenuPalette } from '../floating/menu-palette';
import { menuType, menuTypeClass } from '../floating/menu-type';
import { cx } from '../floating/shared';
import { TriggerSlot } from '../floating/TriggerSlot';
import type { DialogControlProps } from '../dialog/types';
import { useInteractionState } from '../hooks/use-interaction-state';
import { RiCheckLine as CheckIcon } from '../icons/remix/RiCheckLine';
import {
  StyledPressable,
  StyledText,
  StyledView,
} from '../styles/styled-primitives';
import { borderRadius } from '../styles/tokens';
import {
  defaultExtractLabel,
  defaultItemValueExtractor,
  ItemContext,
  SelectChevron,
  SelectTriggerStateContext,
  SelectValueRow,
  useSelectItemContext,
  VALUE_TYPE,
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
import { useFieldMembership } from '../field/membership';

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

type SelectContextValue = {
  control: DialogControlProps;
  size: NonNullable<SelectProps['size']>;
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

export function Select({ children, value, onValueChange, disabled, size: sizeProp }: SelectProps) {
  const {size: inheritedSize} = useBloomAppearance({size: sizeProp}, {size: 'md', tone: 'neutral'});
  const size = inheritedSize === 'xs' || inheritedSize === 'sm' ? 'sm' : 'md';
  const control = useDialogControl();
  const valueStoreState = useState<unknown>(undefined);

  const ctx = useMemo<SelectContextValue>(
    () => ({ control, value, onValueChange, disabled, size }),
    [control, value, onValueChange, disabled, size],
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
  fieldStyle,
  testID,
}: SelectTriggerProps) {
  const { control, size, disabled: rootDisabled } = useSelectContext();
  const palette = useMenuPalette();
  // The trigger IS the select's control, so it takes the enclosing `Field`'s id,
  // name, description and invalid state — and the field's `disabled` on top of
  // the two it already combines. A `Popover` trigger deliberately does not do
  // this (`floating/types.ts`): it is not the field's control.
  const membership = useFieldMembership({
    accessibilityLabel: label,
    disabled: disabled === true || rootDisabled === true,
  });
  const isDisabled = membership.disabled;
  const t = palette.trigger;

  // The same field the web fork draws — a bordered white select trigger
  // with the xs contact shadow, as a full pill — so the two platforms agree about
  // what a select trigger looks like even though only one of them opens an
  // anchored list. No hover or focus ring here: native has neither.
  const field = (
    <StyledView
      className={cx(SELECT_TRIGGER_CLASS, SELECT_TRIGGER_SIZE_CLASS[size], className)}
      style={[
        {
          borderRadius: borderRadius.full,
          backgroundColor: isDisabled ? t.disabledBackground : t.background,
          borderColor: t.border,
          boxShadow: isDisabled ? undefined : t.shadow,
        },
        fieldStyle,
      ]}>
      {children}
    </StyledView>
  );

  const triggerState = useMemo(
    // `open` stays false: the native chevron never turns over (see `SelectIcon`).
    () => ({ disabled: isDisabled, open: false, size }),
    [isDisabled, size],
  );

  return (
    <SelectTriggerStateContext.Provider value={triggerState}>
      <TriggerSlot
        asChild={asChild}
        style={[styles.triggerSlot, style]}
        testID={testID}
        handle={{
          onPress: () => control.open(),
          disabled: isDisabled,
          accessibilityLabel: membership.accessibilityLabel,
          accessibilityRole: 'button',
          'aria-haspopup': SELECT_TRIGGER_POPUP,
          nativeID: membership.nativeID,
          'aria-describedby': membership.describedBy,
          'aria-invalid': membership.invalid || undefined,
        }}>
        {asChild ? children : field}
      </TriggerSlot>
    </SelectTriggerStateContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// SelectValue
// ---------------------------------------------------------------------------

export function SelectValue({
  placeholder,
  children: extractLabel = defaultExtractLabel,
  leading,
  className,
  style,
}: SelectValueProps) {
  const [storedValue] = useContext(ValueStoreContext);
  const trigger = useContext(SelectTriggerStateContext);
  const palette = useMenuPalette();

  const hasValue = storedValue != null;
  const display = hasValue ? extractLabel(storedValue) : placeholder;
  // Same colours as the web fork: `text-primary`, `text-placeholder`, and the
  // disabled trigger's `text-tertiary`. Inline only without a caller className.
  const color = trigger.disabled
    ? palette.trigger.disabledForeground
    : hasValue
      ? palette.text
      : palette.textPlaceholder;

  const text = (
    <StyledText
      numberOfLines={1}
      className={cx(
        SELECT_VALUE_CLASS[trigger.size],
        menuTypeClass(VALUE_TYPE[trigger.size], className),
        className && (hasValue ? 'text-foreground' : 'text-muted-foreground'),
        className,
      )}
      style={[menuType(VALUE_TYPE[trigger.size], className), className ? null : { color }, style]}
    >
      {display}
    </StyledText>
  );
  if (leading === undefined) return text;
  return (
    <SelectValueRow size={trigger.size} leading={typeof leading === 'function' ? leading(storedValue) : leading}>
      {text}
    </SelectValueRow>
  );
}

/** `text-body-medium` on `md`, `text-body-2-medium` on `sm` — trigger value and option label alike. */
// ---------------------------------------------------------------------------
// SelectIcon
// ---------------------------------------------------------------------------

export function SelectIcon({ style }: SelectIconProps) {
  const palette = useMenuPalette();
  const trigger = useContext(SelectTriggerStateContext);
  // A `ChevronDownSmall` in `text-text-secondary` — the same glyph the web
  // trigger draws. It does not turn over: the sheet covers the trigger.
  return (
    <SelectChevron
      size={SELECT_CHEVRON_SIZE[trigger.size]}
      color={palette.textSecondary}
      style={[{ flexShrink: 0 }, style]}
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
  const { control, size, ...context } = useSelectContext();
  const [, setStoredValue] = useContext(ValueStoreContext);

  useLayoutEffect(() => {
    const item = items.find(
      (candidate) => valueExtractor(candidate) === context.value,
    );
    // Cleared too, so a value reset to `undefined` shows the placeholder again
    // instead of the last item it matched.
    setStoredValue(() => item);
  }, [items, context.value, valueExtractor, setStoredValue]);

  return (
    <SelectContentInner
      control={control}
      size={size}
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
    size: SelectContextValue['size'];
  };

function SelectContentInner<T>({
  label = 'Select an option',
  items,
  renderItem,
  valueExtractor = defaultItemValueExtractor,
  control,
  size,
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
      size,
      value: contextValues.value,
      onValueChange: contextValues.onValueChange,
      disabled: contextValues.disabled,
    }),
    [control, size, contextValues.value, contextValues.onValueChange, contextValues.disabled],
  );

  return (
    <SheetShell
      control={control}
      label={label}
      header={
        <StyledView className="pt-space-24 pb-space-8 px-space-16">
          <Text variant="title-2-semibold" style={{ color: theme.colors.text }}>
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
          // `gap-1` between options.
          contentContainerStyle={styles.list}
        />
      </SelectContext.Provider>
    </SheetShell>
  );
}

// ---------------------------------------------------------------------------
// SelectItem
// ---------------------------------------------------------------------------

export function SelectItem({
  children,
  value,
  label,
  disabled = false,
  leading,
  className,
  style,
}: SelectItemProps) {
  const { close } = useDialogContext();
  const { value: selectedValue, onValueChange, size } = useSelectContext();
  const palette = useMenuPalette();
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
    () => ({ selected: isSelected, disabled, size }),
    [isSelected, disabled, size],
  );
  // Press, focus and the chosen option share the row highlight.
  const highlighted = !disabled && (focused || pressed || isSelected);

  return (
    <StyledPressable
      accessibilityRole="radio"
      accessibilityLabel={label}
      // ARIA gives `role="radio"` a checked state, not a selected one. Spelled
      // as `aria-checked` because react-native-web never reads
      // `accessibilityState`; React Native folds this back into it.
      aria-checked={isSelected}
      disabled={disabled}
      onPress={disabled ? undefined : handlePress}
      onFocus={disabled ? undefined : onFocus}
      onBlur={onBlur}
      onPressIn={disabled ? undefined : onPressIn}
      onPressOut={onPressOut}
      className={cx(SELECT_ITEM_CLASS, SELECT_ITEM_SIZE_CLASS[size], className)}
      style={[{ backgroundColor: highlighted ? palette.rowHighlight : 'transparent' }, style]}
    >
      <ItemContext.Provider value={itemCtx}>
        {leading}
        {children}
      </ItemContext.Provider>
    </StyledPressable>
  );
}

// ---------------------------------------------------------------------------
// SelectItemText
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// SelectItemIndicator
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// SelectSeparator
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  // `TriggerSlot`'s wrapper is `alignSelf: 'flex-start'` so an anchored surface
  // lines up with the CONTROL. A select trigger is a full-width field, so it
  // stretches instead. Inline rather
  // than a class because it overrides `TriggerSlot`'s own inline default, and a
  // class cannot outrank one.
  triggerSlot: {
    alignSelf: 'stretch',
  },
  flatList: {
    flexGrow: 0,
  },
  list: {
    gap: 4,
  },
});

export { useSelectItemContext };
