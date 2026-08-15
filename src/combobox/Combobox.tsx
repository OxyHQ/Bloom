import React, { useCallback, useMemo, useRef } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  type TextInput,
  View,
} from 'react-native';

import { useTheme } from '../theme/use-theme';
import { useControllableState } from '../hooks/use-controllable-state';
import { Text } from '../typography';
import { Item } from '../item';
import { Search } from '../search';
import { borderRadius, fontSize, space } from '../styles/tokens';
import {
  ChevronTopBottom_Stroke2_Corner0_Rounded as ChevronUpDownIcon,
} from '../icons/Chevron';
import { Check_Stroke2_Corner0_Rounded as CheckIcon } from '../icons/Check';
import type {
  PopoverContentProps,
  PopoverProps,
  PopoverTriggerProps,
} from '../popover/types';
import type { usePopover as usePopoverType } from '../popover/context';
import type { ComboboxOption, ComboboxProps } from './types';

/**
 * Structural shape of the `Popover` module, satisfied by both the native and
 * web platform forks. Defined explicitly (rather than `typeof import(...)`) so
 * the slightly different render-return types between forks (web `PopoverContent`
 * may return `null`) don't make the modules mutually unassignable.
 */
interface PopoverModule {
  Popover: (props: PopoverProps) => React.ReactElement;
  PopoverTrigger: (props: PopoverTriggerProps) => React.ReactElement;
  PopoverContent: (props: PopoverContentProps) => React.ReactElement | null;
  usePopover: typeof usePopoverType;
}

function defaultFilter<T>(option: ComboboxOption<T>, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    option.label.toLowerCase().includes(q) ||
    (option.description?.toLowerCase().includes(q) ?? false)
  );
}

/**
 * Build the `Combobox` bound to a platform `Popover` module. The platform
 * entry files (`index.ts` / `index.web.ts`) inject the correct one (native
 * bottom sheet vs web anchored panel) — this repo never relies on implicit
 * `.web` resolution. The combobox logic is single-source.
 *
 * `Combobox` is a filterable autocomplete select that delegates its overlay to
 * Bloom's `Popover` and composes `Search` + `Item`. The trigger + panel
 * read the overlay control from `Popover` context (via an inner component) so
 * selecting an option reliably closes the overlay on every platform.
 */
export function createCombobox(PopoverImpl: PopoverModule) {
  function ComboboxInner<T>({
    options,
    value,
    onValueChange,
    placeholder,
    label,
    emptyText,
    filter,
    query: queryProp,
    onQueryChange,
    disabled,
    maxListHeight,
  }: Required<
    Pick<
      ComboboxProps<T>,
      'options' | 'value' | 'onValueChange' | 'placeholder' | 'emptyText' | 'filter' | 'maxListHeight'
    >
  > &
    Pick<ComboboxProps<T>, 'label' | 'query' | 'onQueryChange' | 'disabled'>) {
    const theme = useTheme();
    const popover = PopoverImpl.usePopover();
    const searchRef = useRef<TextInput>(null);

    const [query, setQuery] = useControllableState<string>({
      value: queryProp,
      defaultValue: '',
      onChange: onQueryChange,
    });

    const selectedOption = useMemo(
      () => options.find((o) => o.value === value) ?? null,
      [options, value],
    );

    const filtered = useMemo(
      () => options.filter((o) => filter(o, query)),
      [options, filter, query],
    );

    const handleSelect = useCallback(
      (option: ComboboxOption<T>) => {
        if (option.disabled) return;
        onValueChange(option.value);
        setQuery('');
        popover.setOpen(false);
      },
      [onValueChange, setQuery, popover],
    );

    const accessibleLabel = label ?? placeholder;

    return (
      <>
        {/* `asChild` composes rather than replaces: the trigger's own
            `onPress` runs first and `TriggerSlot` opens the popover after it,
            which is how the web focus hop below still happens on open.
            `disabled` goes to BOTH — the popover must know not to open, and the
            `Pressable` must draw and announce itself as disabled. */}
        <PopoverImpl.PopoverTrigger
          asChild
          disabled={disabled}
          label={accessibleLabel}
          style={styles.triggerSlot}>
          <Pressable
            disabled={disabled}
            onPress={() => {
              if (disabled) return;
              if (Platform.OS === 'web') {
                requestAnimationFrame(() => searchRef.current?.focus());
              }
            }}
            accessibilityState={{ disabled: disabled ?? false }}
            style={[
              styles.trigger,
              {
                backgroundColor: theme.colors.contrast50,
                borderColor: theme.colors.borderLight,
              },
              disabled && styles.disabled,
            ]}>
            <Text
              numberOfLines={1}
              style={[
                styles.triggerText,
                {
                  color: selectedOption
                    ? theme.colors.text
                    : theme.colors.textSecondary,
                },
              ]}>
              {selectedOption ? selectedOption.label : placeholder}
            </Text>
            <ChevronUpDownIcon size="xs" fill={theme.colors.textSecondary} />
          </Pressable>
        </PopoverImpl.PopoverTrigger>

        <PopoverImpl.PopoverContent label={accessibleLabel} align="start" minWidth={240}>
          <View style={styles.searchWrap}>
            <Search
              ref={searchRef}
              label={label ?? 'Search'}
              value={query}
              onChangeText={setQuery}
              onClearText={() => setQuery('')}
              autoFocus={Platform.OS !== 'web'}
            />
          </View>

          {filtered.length === 0 ? (
            <View style={styles.empty}>
              <Text style={{ color: theme.colors.textSecondary, fontSize: fontSize.sm }}>
                {emptyText}
              </Text>
            </View>
          ) : (
            <ScrollView
              style={{ maxHeight: maxListHeight }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}>
              {filtered.map((option) => {
                const isSelected = option.value === value;
                return (
                  <Item
                    key={String(option.value)}
                    title={option.label}
                    subtitle={option.description}
                    density="compact"
                    disabled={option.disabled}
                    selected={isSelected}
                    role="option"
                    onPress={() => handleSelect(option)}
                    trailing={
                      isSelected ? (
                        <CheckIcon size="sm" fill={theme.colors.primary} />
                      ) : null
                    }
                  />
                );
              })}
            </ScrollView>
          )}
        </PopoverImpl.PopoverContent>
      </>
    );
  }

  function Combobox<T = string>({
    options,
    value,
    onValueChange,
    placeholder = 'Select…',
    label,
    emptyText = 'No results',
    filter = defaultFilter,
    query,
    onQueryChange,
    disabled = false,
    maxListHeight = 280,
    style,
    testID,
  }: ComboboxProps<T>) {
    return (
      <PopoverImpl.Popover>
        <View style={style} testID={testID}>
          <ComboboxInner<T>
            options={options}
            value={value}
            onValueChange={onValueChange}
            placeholder={placeholder}
            label={label}
            emptyText={emptyText}
            filter={filter}
            query={query}
            onQueryChange={onQueryChange}
            disabled={disabled}
            maxListHeight={maxListHeight}
          />
        </View>
      </PopoverImpl.Popover>
    );
  }

  Combobox.displayName = 'Combobox';
  return Combobox;
}

const styles = StyleSheet.create({
  // `TriggerSlot`'s wrapper is `alignSelf: 'flex-start'` so an anchored surface
  // lines up with the CONTROL rather than the row it sits in. A combobox is the
  // exception: its trigger is a full-width field, so the wrapper stretches.
  triggerSlot: {
    alignSelf: 'stretch',
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.sm,
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    minHeight: 44,
    width: '100%',
  },
  triggerText: {
    flex: 1,
    fontSize: fontSize.md,
  },
  disabled: {
    opacity: 0.5,
  },
  searchWrap: {
    paddingHorizontal: space.sm,
    paddingTop: space.sm,
    paddingBottom: space.xs,
  },
  empty: {
    paddingHorizontal: space.lg,
    paddingVertical: space.lg,
    alignItems: 'center',
  },
});
