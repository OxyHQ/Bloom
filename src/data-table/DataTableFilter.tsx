import React from 'react';

import { useControllableState } from '../hooks/use-controllable-state';
import {
  Select,
  SelectContent,
  SelectIcon,
  SelectItem,
  SelectItemText,
  SelectTrigger,
  SelectValue,
} from '../select';
import type { DataTableFilterProps, DataTableOption } from './types';

/**
 * A toolbar filter used in every dashboard table: the trigger hugs its
 * value, the list is the standard 266px menu, and the chosen row is marked
 * by the row highlight alone — the select draws no check.
 */
export function DataTableFilter({
  label,
  options,
  value: valueProp,
  defaultValue,
  onValueChange,
  disabled,
  testID,
}: DataTableFilterProps) {
  const [value, setValue] = useControllableState<string | undefined>({
    value: valueProp,
    defaultValue: defaultValue ?? options[0]?.value,
    onChange: (next) => {
      if (next !== undefined) onValueChange?.(next);
    },
  });

  return (
    <Select value={value} onValueChange={setValue} disabled={disabled}>
      <SelectTrigger label={label} testID={testID}>
        <SelectValue />
        <SelectIcon />
      </SelectTrigger>
      <SelectContent<DataTableOption>
        label={label}
        items={[...options]}
        renderItem={(item) => (
          <SelectItem value={item.value} label={item.label}>
            <SelectItemText>{item.label}</SelectItemText>
          </SelectItem>
        )}
      />
    </Select>
  );
}
