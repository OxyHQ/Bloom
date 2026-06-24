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
import { useControllableState } from '../hooks/useControllableState';
import { Text } from '../typography';
import { Item } from '../item';
import { SearchInput } from '../search-input';
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
import type { usePopoverContext as usePopoverContextType } from '../popover/context';
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
  usePopoverContext: typeof usePopoverContextType;
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
 * Bloom's `Popover` and composes `SearchInput` + `Item`. The trigger + panel
 * read the overlay control from `Popover` context (via an inner component) so
 * selecting an option reliably closes the overlay on every platform.
 */
export function createCombobox(Popover: PopoverModule) {
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
    const { control } = Popover.usePopoverContext();
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
        control.close();
      },
      [onValueChange, setQuery, control],
    );

    const accessibleLabel = label ?? placeholder;

    return (
      <>
        <Popover.PopoverTrigger label={accessibleLabel}>
          {({ props }) => (
            <Pressable
              {...props}
              disabled={disabled}
              onPress={() => {
                if (disabled) return;
                props.onPress();
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
          )}
        </Popover.PopoverTrigger>

        <Popover.PopoverContent label={accessibleLabel} placement="bottom-start" minWidth={240}>
          <View style={styles.searchWrap}>
            <SearchInput
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
        </Popover.PopoverContent>
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
      <Popover.Popover>
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
      </Popover.Popover>
    );
  }

  Combobox.displayName = 'Combobox';
  return Combobox;
}

const styles = StyleSheet.create({
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
