import { Surface } from '../surface';
import React, { memo } from 'react';

import type { WebCssStyle } from '../styles/web-view-style';
import { STAY_SEARCH_PANEL_RADIUS } from './constants';
import type { StaySearchPanelProps } from './types';

/**
 * The floating surface that drops under an open `StaySearchBar` segment:
 * the shared next-layer surface and rim, radius 32. Its content is whatever the app passes —
 * `DestinationSuggestions`, `GuestPicker`, a `RangeCalendar` with
 * `DateFlexibilityChips`, or anything else.
 */
function StaySearchPanelComponent({
  children,
  width,
  padding = 16,
  accessibilityLabel,
  style,
  testID,
}: StaySearchPanelProps) {
  const surface: WebCssStyle = {
    width,
    maxWidth: '100%',
    paddingTop: padding,
    paddingBottom: padding,
    paddingLeft: padding,
    paddingRight: padding,
    borderRadius: STAY_SEARCH_PANEL_RADIUS,
  };
  return (
    <Surface
      testID={testID}
      role={accessibilityLabel ? 'dialog' : undefined}
      accessibilityLabel={accessibilityLabel}
      style={[surface, style]}
    >
      {children}
    </Surface>
  );
}

export const StaySearchPanel = memo(StaySearchPanelComponent);
StaySearchPanel.displayName = 'StaySearchPanel';
