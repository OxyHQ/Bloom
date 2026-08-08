import React, {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { Button } from '../button';
import { useDialogContext, useDialogControl } from '../dialog/context';
import { SheetShell } from '../dialog/SheetShell';
import type { DialogControlProps } from '../dialog/types';
import { RadioIndicator } from '../radio-indicator';
import { useInteractionState } from '../hooks/useInteractionState';
import {
  ChevronTopBottom_Stroke2_Corner0_Rounded as ChevronUpDownIcon,
} from '../icons/Chevron';
import { defaultItemValueExtractor, ItemContext, useSelectItemContext } from './common';
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

export { useSelectItemContext };

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

export function SelectTrigger({ children, label }: SelectTriggerProps) {
  const { control } = useSelectContext();
  const { state: focused, onIn: onFocus, onOut: onBlur } = useInteractionState();
  const {
    state: pressed,
    onIn: onPressIn,
    onOut: onPressOut,
  } = useInteractionState();

  if (typeof children === 'function') {
    return children({
      control,
      state: {
        hovered: false,
        focused,
        pressed,
      },
      props: {
        onPress: () => control.open(),
        onFocus,
        onBlur,
        accessibilityLabel: label,
      },
    });
  }

  return (
    <Button
      accessibilityLabel={label}
      onPress={() => control.open()}
      variant="secondary"
      size="large"
      style={styles.triggerButton}
    >
      {children}
    </Button>
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
  return <ChevronUpDownIcon size="sm" fill={theme.colors.textSecondary} />;
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
    () => ({ selected: isSelected, hovered: false, focused, pressed }),
    [isSelected, focused, pressed],
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

export function SelectItemIndicator({ icon: IconComponent }: SelectItemIndicatorProps) {
  const { selected } = useSelectItemContext();

  if (IconComponent) {
    return (
      <View style={styles.itemIndicatorIcon}>
        {selected && <IconComponent size="md" />}
      </View>
    );
  }

  return <RadioIndicator selected={selected} />;
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
        { borderBottomColor: theme.colors.borderLight },
      ]}
    />
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  triggerButton: {
    flex: 1,
    justifyContent: 'space-between',
    paddingLeft: 16,
    paddingRight: 12,
  },
  valueText: {
    fontSize: 16,
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
  item: {
    flex: 1,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  itemText: {
    fontSize: 16,
  },
  itemTextSelected: {
    fontWeight: '600',
  },
  itemIndicatorIcon: {
    width: 24,
  },
  separator: {
    flex: 1,
    borderBottomWidth: 1,
    marginHorizontal: 16,
    marginVertical: 4,
  },
});
