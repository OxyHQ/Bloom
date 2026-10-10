import React from 'react';

import { FLOOR_OPTIONS, localizedOptions } from './constants';
import { ToggleChipGroup } from './ToggleChipGroup';
import { useMessages } from '../locale/messages';
import { STAY_FILTERS_MESSAGES } from './messages';
import type { FloorFilterProps, FloorOption, ToggleChipOption } from './types';

/**
 * Which floors are acceptable: Ground, Middle, Top, With elevator (the set and
 * labels overridable), as wrapped multi-select filter pills — a `group` of
 * `aria-pressed` toggles. Nothing selected means any floor. "With elevator"
 * combines with the floor choices rather than excluding them: "Top" plus
 * "With elevator" is a top floor in a building with a lift; the app owns that
 * query.
 */
export function FloorFilter<T extends string = FloorOption>({
  options,
  labels,
  accessibilityLabel: accessibilityLabelProp,
  ...group
}: FloorFilterProps<T>) {
  const { messages } = useMessages(STAY_FILTERS_MESSAGES);
  const items = localizedOptions<T, ToggleChipOption<T>>(
    options,
    FLOOR_OPTIONS as unknown as readonly ToggleChipOption<T>[],
    messages.floors as Partial<Record<T, string>>,
    labels,
  );
  return (
    <ToggleChipGroup
      {...group}
      options={items}
      accessibilityLabel={accessibilityLabelProp ?? messages.floor}
    />
  );
}

FloorFilter.displayName = 'FloorFilter';
