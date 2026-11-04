import { StyleSheet } from 'react-native';

import type { SelectParts } from '../select/SelectField';
import { SelectItemIndicator, SelectItemText } from '../select/shared';
import type { SettingsSelectProps } from './types';

/**
 * Builds `SettingsSelect` from one platform's `Select` parts, so the web fork
 * opens the anchored list and the native one the sheet whichever bundler
 * resolves the import.
 */
export function createSettingsSelect({
  Select,
  SelectTrigger,
  SelectValue,
  SelectIcon,
  SelectContent,
  SelectItem,
}: SelectParts) {
  /**
   * The compact select a settings row puts on its right ("Autoplay videos:
   * Always ▾"). One composition for every settings page, Bloom's own and an
   * app's, instead of each rebuilding Select's parts.
   */
  const SettingsSelect = function SettingsSelect<T extends string>({
    label,
    value,
    onChange,
    items,
    compact = true,
    size,
    disabled,
    width,
    style,
    testID,
  }: SettingsSelectProps<T>) {
    return (
      <Select
        value={value}
        onValueChange={onChange as (value: string) => void}
        size={size}
        disabled={disabled}
      >
        <SelectTrigger
          label={label}
          fieldStyle={compact ? styles.trigger : undefined}
          style={style}
          testID={testID}
        >
          <SelectValue />
          <SelectIcon />
        </SelectTrigger>
        <SelectContent
          label={label}
          items={items}
          width={width}
          renderItem={(item) => (
            <SelectItem value={item.value} label={item.label}>
              <SelectItemIndicator />
              <SelectItemText>{item.label}</SelectItemText>
            </SelectItem>
          )}
        />
      </Select>
    );
  };
  return SettingsSelect;
}

// Padding, never a height: a fixed height left 15.5dp for a 20dp line on
// Android and cut the value in half. The text sets the height.
const styles = StyleSheet.create({
  trigger: { gap: 4, paddingLeft: 8, paddingRight: 8, paddingTop: 5, paddingBottom: 5 },
});
