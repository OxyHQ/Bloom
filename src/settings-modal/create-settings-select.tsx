import { type StyleProp, StyleSheet, type ViewStyle } from 'react-native';

import type { SelectParts } from '../select/SelectField';
import { SelectItemIndicator, SelectItemText } from '../select/shared';
import type { SettingsSelectProps } from './types';

/**
 * Builds `SettingsSelect` from one platform's `Select` parts, so the web fork
 * opens the anchored list and the native one the sheet whichever bundler
 * resolves the import. `compactTrigger` is that platform's compact trigger
 * field (`COMPACT_TRIGGER` on native; none on the web, where the size's own
 * field is the compact one).
 */
export function createSettingsSelect(
  { Select, SelectTrigger, SelectValue, SelectIcon, SelectContent, SelectItem }: SelectParts,
  compactTrigger?: StyleProp<ViewStyle>,
) {
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
  };
  return SettingsSelect;
}

/**
 * The compact trigger on native, as Bloom 22 drew it there: the size's own sides
 * (12 at `md`; its size class wrote them as start and end, which outrank left
 * and right), with a 5px top and bottom and a 4px gap. Padding, never a height:
 * a fixed height left 15.5dp for a 20dp line on Android and cut the value in
 * half. The text sets the height.
 *
 * The web has none: there Bloom 22's size classes outranked every value this
 * style set, so its compact trigger drew the size's own field (7px top and
 * bottom and an 8px gap at `md`), as the web's `SettingsSelect` still does.
 */
export const COMPACT_TRIGGER = StyleSheet.create({
  field: { gap: 4, paddingTop: 5, paddingBottom: 5 },
}).field;
