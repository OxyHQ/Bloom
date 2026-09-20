import React, { memo, useEffect } from 'react';
import Animated, { Easing, interpolateColor, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
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
const AnimatedText = Animated.createAnimatedComponent(Text);
const SELECTION_DURATION = 220;

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
  const SelectedGlyph = ActiveIcon ?? Icon;
  const reducedMotion = useReducedMotion();
  const selection = useSharedValue(selected ? 1 : 0);
  useEffect(() => {
    selection.value = reducedMotion ? (selected ? 1 : 0) : withTiming(selected ? 1 : 0, { duration: SELECTION_DURATION, easing: Easing.bezier(0.2, 0, 0, 1) });
  }, [selected, reducedMotion, selection]);
  const indicatorStyle = useAnimatedStyle(() => ({ backgroundColor: interpolateColor(selection.value, [0, 1], [hovered ? palette.rowHover : 'transparent', palette.selected]) }), [selection, hovered, palette.rowHover, palette.selected]);
  const inactiveStyle = useAnimatedStyle(() => ({ opacity: 1 - selection.value }), [selection]);
  const activeStyle = useAnimatedStyle(() => ({ opacity: selection.value }), [selection]);
  const labelStyle = useAnimatedStyle(() => ({ color: interpolateColor(selection.value, [0, 1], [palette.textSecondary, palette.text]) }), [selection, palette.textSecondary, palette.text]);

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
      <Animated.View
        style={[{
          width: INDICATOR_WIDTH,
          height: INDICATOR_HEIGHT,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: borderRadius.full,
        }, indicatorStyle]}
        testID={testID ? `${testID}-indicator` : undefined}
      >
        <Animated.View testID={testID ? `${testID}-inactive-glyph` : undefined} pointerEvents="none" aria-hidden accessibilityElementsHidden style={[{ position: 'absolute', width: ICON_SIZE, height: ICON_SIZE }, inactiveStyle]}>
          <Icon width={ICON_SIZE} height={ICON_SIZE} fill={palette.textSecondary} />
        </Animated.View>
        <Animated.View testID={testID ? `${testID}-active-glyph` : undefined} pointerEvents="none" aria-hidden accessibilityElementsHidden style={[{ position: 'absolute', width: ICON_SIZE, height: ICON_SIZE }, activeStyle]}>
          <SelectedGlyph width={ICON_SIZE} height={ICON_SIZE} fill={palette.selectedForeground} />
        </Animated.View>
        {badge != null ? (
          <View pointerEvents="none" style={{ position: 'absolute', top: -6, left: INDICATOR_WIDTH - 16 }}>
            {badge}
          </View>
        ) : null}
      </Animated.View>
      <AnimatedText
        variant="caption-2-regular"
        numberOfLines={1}
        style={[{
          maxWidth: '100%',
          fontSize: 10,
          lineHeight: 14,
          letterSpacing: 0,
          textAlign: 'center',
          fontWeight: selected ? '500' : '400',
        }, labelStyle]}
      >
        {label}
      </AnimatedText>
    </Pressable>
  );
};

export const SidebarRailItem = memo(SidebarRailItemComponent);
SidebarRailItem.displayName = 'SidebarRailItem';
