import { type StyleProp, StyleSheet, type ViewStyle } from 'react-native';

import type { SelectParts } from '../select/SelectField';
import { SelectItemIndicator, SelectItemText } from '../select/shared';
import type { SettingsSelectProps } from './types';

/**
 * `SettingsSelect`'s composition, drawn with the `parts` of one platform's
 * `Select`. Each fork's `SettingsSelect` renders it with its own parts, so the
 * web fork opens the anchored list and the native one the sheet whichever
 * bundler resolves the import. `compactTrigger` is the compact trigger field
 * (`COMPACT_TRIGGER`).
 *
 * The compact select a settings row puts on its right ("Autoplay videos:
 * Always ▾"). One composition for every settings page, Bloom's own and an
 * app's, instead of each rebuilding Select's parts.
 *
 * A component at module scope that takes the parts, never one a factory
 * builds: the React Compiler takes a factory's parameters for module globals,
 * and its function outlining moved `renderItem` to module scope, where the
 * factory's `SelectItem` did not exist (`SelectItem is not defined`). Taken as
 * a prop, the parts are inputs the compiler tracks.
 */
export function SettingsSelectFromParts<T extends string>({
  parts,
  compactTrigger,
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
}: SettingsSelectProps<T> & { parts: SelectParts; compactTrigger?: StyleProp<ViewStyle> }) {
  const { Select, SelectTrigger, SelectValue, SelectIcon, SelectContent, SelectItem } = parts;
  return (
    <Select
      value={value}
      onValueChange={onChange as (value: string) => void}
      size={size}
      disabled={disabled}
    >
      <SelectTrigger
        label={label}
        fieldStyle={compact ? compactTrigger : undefined}
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
}

/**
 * The compact trigger, on every platform (the owner line's look): 8px sides, a
 * 5px top and bottom and a 4px gap. Padding, never a height: a fixed height left
 * 15.5dp for a 20dp line on Android and cut the value in half. The text sets the
 * height.
 */
export const COMPACT_TRIGGER = StyleSheet.create({
  field: { gap: 4, paddingLeft: 8, paddingRight: 8, paddingTop: 5, paddingBottom: 5 },
}).field;
