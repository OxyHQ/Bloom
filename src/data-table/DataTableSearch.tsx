import React from 'react';
import { useWindowDimensions } from 'react-native';

import { RiSearchLine } from '../icons/remix';
import { BREAKPOINTS } from '../styles/breakpoints';
import { TextField, TextFieldIcon, TextFieldInput } from '../text-field';
import { TYPE_SCALE } from '../typography';
import type { DataTableSearchProps } from './types';

/** `w-[153px]` / `min-w-[153px]`. */
const SEARCH_WIDTH = 153;

/**
 * The toolbar search for dashboard tables — a leading search glyph,
 * `body-medium`, `rounded-full`, `background-secondary`: a fixed 153px pill
 * from `sm`, below it growing into whatever the scrolling toolbar row leaves
 * (never under 153).
 */
export function DataTableSearch({
  label,
  value,
  onValueChange,
  placeholder = 'Search',
  testID,
}: DataTableSearchProps) {
  const { width } = useWindowDimensions();
  const narrow = width < BREAKPOINTS.sm;
  return (
    <TextField
      radius={999}
      style={narrow ? { flexGrow: 1, minWidth: SEARCH_WIDTH } : { width: SEARCH_WIDTH }}
    >
      <TextFieldIcon icon={RiSearchLine} />
      <TextFieldInput
        label={label}
        placeholder={placeholder}
        value={value}
        onValueChange={onValueChange}
        style={TYPE_SCALE['body-medium']}
        testID={testID}
      />
    </TextField>
  );
}
