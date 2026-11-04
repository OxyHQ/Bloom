import { StyleSheet } from 'react-native';

import {
  Select,
  SelectContent,
  SelectIcon,
  SelectItem,
  SelectItemIndicator,
  SelectItemText,
  SelectTrigger,
  SelectValue,
} from '../select';
import type { SettingsSelectProps } from './types';

/**
 * The compact select a settings row puts on its right ("Autoplay videos:
 * Always ▾"). One composition for every settings page, Bloom's own and an
 * app's, instead of each rebuilding Select's parts.
 */
export function SettingsSelect<T extends string>({
  label,
  value,
  onChange,
  items,
  compact = true,
  testID,
}: SettingsSelectProps<T>) {
  // The select hands over either the stored item or its raw value, by platform.
  const keyOf = (v: unknown) =>
    typeof v === 'object' && v !== null && 'value' in v ? (v as { value: unknown }).value : v;
  return (
    <Select
      value={value}
      onValueChange={(next) => {
        const item = items.find((candidate) => candidate.value === keyOf(next));
        if (item) onChange(item.value);
      }}
    >
      <SelectTrigger
        label={label}
        fieldStyle={compact ? styles.trigger : undefined}
        testID={testID}
      >
        <SelectValue>
          {(v) => items.find((item) => item.value === keyOf(v))?.label ?? String(keyOf(v))}
        </SelectValue>
        <SelectIcon />
      </SelectTrigger>
      <SelectContent
        label={label}
        items={[...items]}
        valueExtractor={(item) => item.value}
        renderItem={(item) => (
          <SelectItem value={item.value} label={item.label}>
            <SelectItemIndicator />
            <SelectItemText>{item.label}</SelectItemText>
          </SelectItem>
        )}
      />
    </Select>
  );
}

// Padding, never a height: a fixed height left 15.5dp for a 20dp line on
// Android and cut the value in half. The text sets the height.
const styles = StyleSheet.create({
  trigger: { gap: 4, paddingLeft: 8, paddingRight: 8, paddingTop: 5, paddingBottom: 5 },
});
