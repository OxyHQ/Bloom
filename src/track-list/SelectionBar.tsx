import React, { useMemo } from 'react';
import { View, useWindowDimensions } from 'react-native';

import { Button, GlyphButton } from '../button';
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
 *   actions     `text` buttons, small, with their icon; icon-only under 640
 *   clear       a neutral `GlyphButton`, never a tinted one
 *
 * The actions are DELIBERATELY not `ghost`: that variant paints an accent wash,
 * so a destructive action in it drew a RED label on a BLUE fill. `text` is the
 * transparent labelled button — a neutral hover wash under an accent label —
 * and a destructive one paints its own icon and label from `error`.
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
        {actions.map((action) => {
          const Icon = action.icon;
          // A destructive action paints BOTH its label and its glyph from
          // `error`. `leadingIcon` is coloured by the button, so the glyph goes
          // in as an `icon` ELEMENT, which the button renders as-is.
          const destructiveIcon =
            action.destructive === true && Icon ? (
              <Icon width={18} height={18} fill={theme.colors.error} />
            ) : undefined;
          return (
            <Button
              key={action.key}
              variant="text"
              size="small"
              icon={destructiveIcon}
              leadingIcon={destructiveIcon ? undefined : Icon}
              iconOnly={iconOnly && Icon !== undefined}
              accessibilityLabel={action.label}
              disabled={action.disabled}
              onPress={action.onPress}
              testID={testID ? `${testID}-${action.key}` : undefined}
              textStyle={action.destructive ? { color: theme.colors.error } : undefined}
            >
              {action.label}
            </Button>
          );
        })}
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
      <GlyphButton
        size={32}
        icon={RiCloseLine}
        glyphSize={20}
        color={paint.textMuted}
        hoverColor={paint.text}
        ring={paint.ring}
        accessibilityLabel={clearLabel}
        onPress={onClear}
        testID={testID ? `${testID}-clear` : undefined}
      />
    </View>
  );
}
