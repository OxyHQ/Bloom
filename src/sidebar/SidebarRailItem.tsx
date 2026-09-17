import React, { memo } from 'react';
import { Pressable, View, type GestureResponderEvent } from 'react-native';

import { useInteractionState } from '../hooks/use-interaction-state';
import { borderRadius } from '../styles/tokens';
import type { WebCssStyle } from '../styles/web-view-style';
import { Text } from '../typography';
import { useSidebarPalette } from './palette';
import { IS_WEB, useSidebarWebCss } from './parts';
import type { SidebarRailItemProps } from './types';

/** The indicator pill behind the icon. */
const INDICATOR_WIDTH = 48;
const INDICATOR_HEIGHT = 32;
const ICON_SIZE = 22;

/**
 * A navigation rail destination: the icon over its label, stacked and centred.
 *
 *   item       min-height 64, radius 20, py 8, column gap 5
 *   indicator  48 × 32 full pill behind a 22px icon; accent-500 fill with the
 *              primary foreground while selected (`activeIcon` swaps the
 *              glyph), background-secondary-hover on hover
 *   label      10px, centred, one line; text-primary medium while selected,
 *              text-secondary otherwise
 *   badge      over the indicator's top-right corner
 *
 * With `href` the item is a link (a real anchor on web).
 */
const SidebarRailItemComponent: React.FC<SidebarRailItemProps> = ({
  icon: Icon,
  activeIcon: ActiveIcon,
  label,
  href,
  badge,
  selected = false,
  onPress,
  style,
  testID,
}) => {
  const palette = useSidebarPalette();
  useSidebarWebCss();
  const { state: hovered, onIn, onOut } = useInteractionState();
  const Glyph = selected && ActiveIcon ? ActiveIcon : Icon;

  const webProps: Record<string, unknown> = IS_WEB
    ? {
        dataSet: { bloomSidebar: 'ring' },
        ...(href ? { href } : null),
        ...(selected ? { 'aria-current': 'page' } : null),
      }
    : {};

  return (
    <Pressable
      {...webProps}
      role={href ? 'link' : 'button'}
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onHoverIn={onIn}
      onHoverOut={onOut}
      onPress={(event: GestureResponderEvent) => {
        if (!onPress) return;
        if (IS_WEB && href) event.preventDefault();
        onPress();
      }}
      style={[
        {
          alignSelf: 'stretch',
          minHeight: 64,
          alignItems: 'center',
          justifyContent: 'center',
          gap: 5,
          paddingTop: 8,
          paddingBottom: 8,
          borderRadius: 20,
          '--bloom-sidebar-ring': palette.ring,
        } as WebCssStyle,
        style,
      ]}
      testID={testID}
    >
      <View
        style={{
          width: INDICATOR_WIDTH,
          height: INDICATOR_HEIGHT,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: borderRadius.full,
          backgroundColor: selected ? palette.selected : hovered ? palette.rowHover : 'transparent',
        }}
        testID={testID ? `${testID}-indicator` : undefined}
      >
        <Glyph
          width={ICON_SIZE}
          height={ICON_SIZE}
          fill={selected ? palette.selectedForeground : palette.textSecondary}
        />
        {badge != null ? (
          <View pointerEvents="none" style={{ position: 'absolute', top: -6, left: INDICATOR_WIDTH - 16 }}>
            {badge}
          </View>
        ) : null}
      </View>
      <Text
        variant="caption-2-regular"
        numberOfLines={1}
        style={{
          maxWidth: '100%',
          fontSize: 10,
          lineHeight: 14,
          letterSpacing: 0,
          textAlign: 'center',
          fontWeight: selected ? '500' : '400',
          color: selected ? palette.text : palette.textSecondary,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
};

export const SidebarRailItem = memo(SidebarRailItemComponent);
SidebarRailItem.displayName = 'SidebarRailItem';
