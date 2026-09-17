import React from 'react';

import type { PropertyType } from '../stay-filters';
import { PropertyTypeTiles } from '../stay-filters/PropertyTypeTiles';
import type { PropertyTypePickerProps } from './types';

/**
 * The property types for a search panel: the same multi-select icon tiles as
 * the filters' `PropertyTypeFilter`, compact — at least 92 tall (room for a two-line label, so every row matches) and 96 wide,
 * 12 inset, radius 12, as many per row as fit (4 in a 460-wide panel). An
 * empty selection means any type. A `group` of `aria-pressed` toggles.
 */
export function PropertyTypePicker<T extends string = PropertyType>(props: PropertyTypePickerProps<T>) {
  return <PropertyTypeTiles<T> {...props} size="medium" />;
}

PropertyTypePicker.displayName = 'PropertyTypePicker';
