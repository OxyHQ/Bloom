import React, { memo } from 'react';
import { View } from 'react-native';

import type { WebCssStyle } from '../styles/web-view-style';
import { STAY_SEARCH_PANEL_RADIUS } from './constants';
import { useStaySearchPalette } from './palette';
import type { StaySearchPanelProps } from './types';

/**
 * The floating surface that drops under an open `StaySearchBar` segment:
 * the menu palette's surface and hairline, the menu shadow plus a wider
 * ambient layer, radius 32. Its content is whatever the app passes —
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
  const palette = useStaySearchPalette();
  const surface: WebCssStyle = {
    width,
    maxWidth: '100%',
    paddingTop: padding,
    paddingBottom: padding,
    paddingLeft: padding,
    paddingRight: padding,
    borderRadius: STAY_SEARCH_PANEL_RADIUS,
    borderWidth: 1,
    borderColor: palette.panelBorder,
    backgroundColor: palette.panelSurface,
    boxShadow: palette.panelShadow,
  };
  return (
    <View
      testID={testID}
      role={accessibilityLabel ? 'dialog' : undefined}
      accessibilityLabel={accessibilityLabel}
      style={[surface, style]}
    >
      {children}
    </View>
  );
}

export const StaySearchPanel = memo(StaySearchPanelComponent);
StaySearchPanel.displayName = 'StaySearchPanel';
