import React, { memo } from 'react';

import { RiNotification3Fill } from '../icons/remix/RiNotification3Fill';
import { RiNotification3Line } from '../icons/remix/RiNotification3Line';
import { FilterChip } from '../stay-filters/FilterChip';
import type { SaveSearchButtonProps } from './types';

/**
 * Save the current search and get alerts for it: the filter pill as a bell
 * toggle.
 *
 *   rest    "Save search", an outlined bell; hairline border, hover text border
 *   saved   "Saved", a filled bell, INVERTED (text-primary fill, page-colour
 *           label) — the same selected look as the filter pills beside it
 *   size    40 tall, full pill
 *
 * A toggle `button` with `aria-pressed` (web) and `accessibilityState.selected`
 * (native), named by the label it shows.
 */
function SaveSearchButtonComponent({
  saved,
  onSavedChange,
  label = 'Save search',
  savedLabel = 'Saved',
  disabled = false,
  style,
  testID,
}: SaveSearchButtonProps) {
  return (
    <FilterChip
      mode="toggle"
      label={saved ? savedLabel : label}
      icon={saved ? RiNotification3Fill : RiNotification3Line}
      selected={saved}
      onPress={() => onSavedChange(!saved)}
      disabled={disabled}
      style={[{ alignSelf: 'flex-start' }, style]}
      testID={testID}
    />
  );
}

export const SaveSearchButton = memo(SaveSearchButtonComponent);
SaveSearchButton.displayName = 'SaveSearchButton';
