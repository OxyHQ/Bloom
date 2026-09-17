import React, { useMemo } from 'react';
import { View, useWindowDimensions } from 'react-native';

import { Button } from '../button';
import { RiCloseLine } from '../icons/remix/RiCloseLine';
import type { WebCssStyle } from '../styles/web-view-style';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { resolveTrackListPaint } from './shared';
import type { SelectionBarProps } from './types';

/** Below this width the actions draw as icon buttons only. */
const LABELS_MIN_WIDTH = 640;

/**
 * The bar that appears while several tracks are selected: "3 selected", the
 * bulk actions and a clear button.
 *
 *   surface     the menu surface (card / neutral-800) with its hairline border
 *   radius      16 (a panel, not a pill); height 56; padding 8 / 16
 *   shadow      a soft drop shadow, light and dark
 *   actions     ghost buttons, small, with their icon; icon-only under 640
 *
 * `placement="floating"` (default) positions it absolutely 16 above the bottom
 * of the nearest positioned parent, centred. `inline` leaves layout to the app.
 * Renders nothing at `count` 0.
 *
 * Accessibility: `role="toolbar"` named by the count text; the count is also a
 * polite live region so a change in selection is announced.
 */
export function SelectionBar({
  count,
  actions,
  onClear,
  formatCount = (n) => `${n} selected`,
  clearLabel = 'Clear selection',
  placement = 'floating',
  width,
  style,
  testID,
}: SelectionBarProps) {
  const theme = useTheme();
  const paint = useMemo(() => resolveTrackListPaint(theme), [theme]);
  const window = useWindowDimensions();
  const iconOnly = (width ?? window.width) < LABELS_MIN_WIDTH;
  if (count <= 0) return null;
  const countText = formatCount(count);

  const surface: WebCssStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 16,
    paddingRight: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: paint.panelBorder,
    backgroundColor: paint.panel,
    boxShadow: paint.panelShadow,
    maxWidth: '100%',
    ...(placement === 'floating'
      ? { position: 'absolute', bottom: 16, alignSelf: 'center' }
      : { alignSelf: 'flex-start' }),
  };

  return (
    <View role="toolbar" accessibilityLabel={countText} style={[surface, style]} testID={testID}>
      <Text
        variant="body-semibold"
        aria-live="polite"
        numberOfLines={1}
        style={{ color: paint.text, marginRight: 12, flexShrink: 0 }}
      >
        {countText}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        {actions.map((action) => (
          <Button
            key={action.key}
            variant="ghost"
            size="small"
            leadingIcon={action.icon}
            iconOnly={iconOnly && action.icon !== undefined}
            accessibilityLabel={action.label}
            disabled={action.disabled}
            onPress={action.onPress}
            testID={testID ? `${testID}-${action.key}` : undefined}
            textStyle={action.destructive ? { color: theme.colors.error } : undefined}
          >
            {action.label}
          </Button>
        ))}
      </View>
      <View
        style={{
          width: 1,
          alignSelf: 'stretch',
          marginLeft: 8,
          marginRight: 8,
          marginTop: 6,
          marginBottom: 6,
          backgroundColor: paint.panelBorder,
        }}
      />
      <Button
        variant="ghost"
        size="small"
        iconOnly
        leadingIcon={RiCloseLine}
        accessibilityLabel={clearLabel}
        onPress={onClear}
        testID={testID ? `${testID}-clear` : undefined}
      />
    </View>
  );
}
