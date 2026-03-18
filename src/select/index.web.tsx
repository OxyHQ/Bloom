import React, { createContext, useContext, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { Portal } from '../portal';
import { RadioIndicator } from '../radio-indicator';
import { useInteractionState } from '../hooks/useInteractionState';
import {
  ChevronBottom_Stroke2_Corner0_Rounded as ChevronDownIcon,
} from '../icons/Chevron';
import { Check_Stroke2_Corner0_Rounded as CheckIcon } from '../icons/Check';
import type {
  ContentProps,
  IconProps,
  ItemIndicatorProps,
  ItemProps,
  ItemTextProps,
  RootProps,
  SelectItemContextValue,
  TriggerProps,
  ValueTextProps,
} from './types';

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

type SelectContextValue = Pick<RootProps, 'value' | 'onValueChange' | 'disabled'> & {
  isOpen: boolean;
  open: () => void;
  close: () => void;
};

const SelectContext = createContext<SelectContextValue | null>(null);
SelectContext.displayName = 'SelectContext';

function useSelectContext(): SelectContextValue {
  const ctx = useContext(SelectContext);
  if (!ctx) {
    throw new Error('Select components must be used within a Select.Root');
  }
  return ctx;
}

// ---------------------------------------------------------------------------
// Root
// ---------------------------------------------------------------------------

export function Root({ children, value, onValueChange, disabled }: RootProps) {
  const [isOpen, setIsOpen] = useState(false);

  const ctx = useMemo<SelectContextValue>(
    () => ({
      value,
      onValueChange,
      disabled,
      isOpen,
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
    }),
    [value, onValueChange, disabled, isOpen],
  );

  return <SelectContext.Provider value={ctx}>{children}</SelectContext.Provider>;
}

// ---------------------------------------------------------------------------
// Trigger
// ---------------------------------------------------------------------------

export function Trigger({ children, label }: TriggerProps) {
  const ctx = useSelectContext();
  const theme = useTheme();
  const {
    state: hovered,
    onIn: onMouseEnter,
    onOut: onMouseLeave,
  } = useInteractionState();
  const { state: focused, onIn: onFocus, onOut: onBlur } = useInteractionState();

  if (typeof children === 'function') {
    return children({
      control: {
        id: 'select-trigger',
        ref: { current: null },
        open: ctx.open,
        close: ctx.close,
      },
      state: {
        hovered,
        focused,
        pressed: false,
      },
      props: {
        onPress: ctx.open,
        onFocus,
        onBlur,
        accessibilityLabel: label,
      },
    });
  }

  return (
    <Pressable
      onPress={ctx.open}
      onFocus={onFocus}
      onBlur={onBlur}
      accessibilityLabel={label}
      accessibilityRole="button"
      {...({
        onMouseEnter,
        onMouseLeave,
      } as Record<string, () => void>)}
      style={[
        styles.trigger,
        {
          backgroundColor: theme.colors.contrast50,
          borderColor: focused ? theme.colors.primary : theme.colors.contrast50,
        },
      ]}
    >
      {children}
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// ValueText
// ---------------------------------------------------------------------------

export function ValueText({
  children: extractLabel,
  placeholder,
  style,
}: ValueTextProps) {
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
// Icon
// ---------------------------------------------------------------------------

export function Icon({ style }: IconProps) {
  const theme = useTheme();
  return <ChevronDownIcon style={style} size="xs" fill={theme.colors.textSecondary} />;
}

// ---------------------------------------------------------------------------
// Content
// ---------------------------------------------------------------------------

export function Content<T>({
  items,
  renderItem,
  label = 'Select an option',
  valueExtractor = defaultItemValueExtractor,
}: ContentProps<T>) {
  const ctx = useSelectContext();
  const theme = useTheme();

  if (!ctx.isOpen) return null;

  return (
    <Portal>
      <Pressable
        style={styles.backdrop}
        onPress={ctx.close}
        accessibilityLabel="Close selection"
      />
      <View
        accessibilityRole="list"
        accessibilityLabel={label}
        style={[
          styles.dropdown,
          {
            backgroundColor: theme.isDark
              ? theme.colors.backgroundSecondary
              : theme.colors.background,
            borderColor: theme.colors.borderLight,
            shadowColor: theme.colors.shadow,
          },
        ]}
      >
        {items.map((item, index) => (
          <React.Fragment key={valueExtractor(item)}>
            {renderItem(item, index, ctx.value)}
          </React.Fragment>
        ))}
      </View>
    </Portal>
  );
}

function defaultItemValueExtractor(item: unknown): string {
  if (item != null && typeof item === 'object' && 'value' in item) {
    return String((item as { value: string }).value);
  }
  return String(item);
}

// ---------------------------------------------------------------------------
// Item context
// ---------------------------------------------------------------------------

const ItemContext = createContext<SelectItemContextValue>({
  selected: false,
  hovered: false,
  focused: false,
  pressed: false,
});
ItemContext.displayName = 'SelectItemContext';

export function useItemContext(): SelectItemContextValue {
  return useContext(ItemContext);
}

// ---------------------------------------------------------------------------
// Item
// ---------------------------------------------------------------------------

export function Item({ ref, value, children, style }: ItemProps) {
  const theme = useTheme();
  const ctx = useSelectContext();
  const {
    state: hovered,
    onIn: onMouseEnter,
    onOut: onMouseLeave,
  } = useInteractionState();
  const { state: focused, onIn: onFocus, onOut: onBlur } = useInteractionState();

  const isSelected = ctx.value === value;

  const itemCtx = useMemo<SelectItemContextValue>(
    () => ({ selected: isSelected, hovered, focused, pressed: false }),
    [isSelected, hovered, focused],
  );

  return (
    <Pressable
      ref={ref}
      accessibilityRole="radio"
      accessibilityState={{ checked: isSelected }}
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
// ItemText
// ---------------------------------------------------------------------------

export function ItemText({ children, style }: ItemTextProps) {
  return (
    <Text style={[styles.itemText, ...(style ? [style] : [])]}>
      {children}
    </Text>
  );
}

// ---------------------------------------------------------------------------
// ItemIndicator
// ---------------------------------------------------------------------------

export function ItemIndicator({ icon: IconComponent = CheckIcon }: ItemIndicatorProps) {
  const { selected } = useItemContext();

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
// Separator
// ---------------------------------------------------------------------------

export function Separator() {
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
  trigger: {
    flexDirection: 'row',
    position: 'relative',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    maxWidth: 400,
    borderWidth: 2,
    borderStyle: 'solid',
  },
  valueText: {
    fontSize: 16,
  },
  backdrop: {
    position: 'fixed' as 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 50,
  },
  dropdown: {
    position: 'absolute',
    zIndex: 60,
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
    padding: 4,
    minWidth: 180,
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  item: {
    position: 'relative',
    flexDirection: 'row',
    minHeight: 25,
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
