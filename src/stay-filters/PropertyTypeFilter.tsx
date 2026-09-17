import React from 'react';

import { PropertyTypeTiles } from './PropertyTypeTiles';
import type { PropertyType, PropertyTypeFilterProps } from './types';

/**
 * Which kinds of home to show, as a grid of icon tiles for a `FilterSection`:
 * Apartment, House, Room, Studio, Duplex / Penthouse, Coliving, Hostel,
 * Land / Other (labels and the set overridable). Multi-select; an empty
 * selection means any type.
 *
 *   tiles   radius 12, at least 100 tall (a two-line label fits) and 120 wide, 16 inset; as many per
 *           row as fit (2 on a phone, 4 in the desktop dialog)
 *   state   rest hairline · hover text border · selected 2px text border on a
 *           neutral tint
 *
 * The same tiles, compact, are the search panel's `PropertyTypePicker`
 * (`@oxy.so/bloom/home-search`).
 */
export function PropertyTypeFilter<T extends string = PropertyType>(props: PropertyTypeFilterProps<T>) {
  return <PropertyTypeTiles<T> {...props} size="large" />;
}

PropertyTypeFilter.displayName = 'PropertyTypeFilter';
