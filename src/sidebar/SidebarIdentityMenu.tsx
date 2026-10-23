import React, { useEffect, useState, type ComponentRef, type ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { useInteractionState } from '../hooks/use-interaction-state';
import { mirrorAlign, mirrorSide, useIsRtl } from '../hooks/use-is-rtl';
import type { TriggerHandleProps } from '../floating/types';
import { Popover, PopoverContent, PopoverTrigger } from '../popover';
import { BREAKPOINTS } from '../styles/breakpoints';
import { borderRadius } from '../styles/tokens';
import type { WebCssStyle } from '../styles/web-view-style';
import { Text } from '../typography';
import { useSidebarGeometry } from './geometry';
import { useSidebarPalette } from './palette';
import {
  ChevronDownSmall,
  ChevronUpDownSmall,
  Collapsible,
  SIDEBAR_MENU_PANEL,
  SidebarAvatarView,
  useInSidebar,
  useSidebarCollapseProgress,
  useSidebarWebCss,
} from './parts';
import type { SidebarAvatar, SidebarIdentityForm } from './types';
import { IS_WEB } from '../styles/platform';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface SidebarIdentityMenuProps {
  form: SidebarIdentityForm;
  name: string;
  /** The card's second line (an email); the switcher draws the name alone. */
  description?: string;
  avatar?: SidebarAvatar;
  collapsed: boolean;
  /** Names the menu. */
  menuLabel: string;
  /** Repaints the card (a `plain` panel sits it on the panel colour). */
  style?: StyleProp<ViewStyle>;
  /** The switcher's 32px avatar background (the flat mobile header repaints it). */
  avatarBackground?: string;
  /** Switcher: no hover pill until the pointer next leaves (set after expanding). */
  suppressHover?: boolean;
  onHoverSuppressionEnd?: () => void;
  testID?: string;
  /** The menu's body; `close` dismisses it after a choice. */
  children: (close: () => void) => ReactNode;
}

/**
 * The trigger and popover both identity menus share — the account and the team
 * — in either of the two places a sidebar puts an identity.
 *
 *   switcher   the header's: 32px avatar + body-medium name + 16px up/down
 *              chevron (icon-tertiary), gap 8 / 2; hover draws a 2px
 *              full-radius pill that reaches 6px past the sides and 5px past
 *              top and bottom without moving layout. Collapsed: the rail's
 *              column, the pill squared to 42×42 (3px sides). The menu opens
 *              beside the rail, top-aligned.
 *   card       the foot's: full width, radius 12, background-tertiary, py8
 *              pr16 pl10, 2px transparent border → border-button-hover on
 *              hover; 32px avatar + name (body-medium) / second line
 *              (body-regular secondary); a 16px chevron chip (radius 3,
 *              tertiary-hover) that turns over while open (200ms). Collapsed:
 *              a 36px circle, just the avatar. The menu opens beside the rail,
 *              bottom-aligned.
 *   menu       265 wide (`SIDEBAR_MENU_PANEL`), below the trigger under `sm`.
 */
export function SidebarIdentityMenu(props: SidebarIdentityMenuProps) {
  const { children, ...identity } = props;
  const { form, menuLabel, testID } = identity;
  useSidebarWebCss();
  const [open, setOpen] = useState(false);
  const { width } = useWindowDimensions();
  const narrow = width < BREAKPOINTS.sm;
  const rtl = useIsRtl();
  const card = form === 'card';
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        asChild
        label={props.name}
        style={card ? { alignSelf: 'stretch' } : undefined}
      >
        {card ? <CardTrigger {...identity} open={open} /> : <SwitcherTrigger {...identity} />}
      </PopoverTrigger>
      <PopoverContent
        label={menuLabel}
        // Beside the rail's trailing edge: floating sides are physical, so
        // they are mirrored here rather than by the layout.
        side={mirrorSide(narrow ? 'bottom' : 'right', rtl)}
        align={mirrorAlign(card && !narrow ? 'end' : 'start', narrow ? 'bottom' : 'right', rtl)}
        sideOffset={8}
        maxWidth={width - 32}
        style={SIDEBAR_MENU_PANEL}
        testID={testID ? `${testID}-menu` : undefined}
      >
        {children(() => setOpen(false))}
      </PopoverContent>
    </Popover>
  );
}

type TriggerProps = Omit<SidebarIdentityMenuProps, 'children'> & Partial<TriggerHandleProps>;

// `PopoverTrigger asChild` clones the trigger with its press handler and ref;
// both triggers hand everything they did not name to the pressable.
const SwitcherTrigger = React.forwardRef<ComponentRef<typeof View>, TriggerProps>(
  function SwitcherTrigger(
    {
      form: _form,
      name,
      description: _description,
      avatar,
      collapsed,
      menuLabel: _menuLabel,
      style: _style,
      avatarBackground,
      suppressHover = false,
      onHoverSuppressionEnd,
      testID,
      ...pressable
    },
    ref,
  ) {
    const palette = useSidebarPalette();
    const { state: hovered, onIn, onOut } = useInteractionState();
    const progress = useSidebarCollapseProgress(collapsed);
    const lane = useSidebarGeometry();
    const startPadding = lane ? Math.max(0, (lane.expandedLane - 32) / 2) : 0;
    const endPadding = lane ? Math.max(0, (lane.collapsedLane - 32) / 2) : 2;
    const triggerGeometry = useAnimatedStyle(
      () => ({
        paddingLeft: startPadding + (endPadding - startPadding) * progress.value,
        paddingRight: startPadding + (endPadding - startPadding) * progress.value,
      }),
      [progress, startPadding, endPadding],
    );
    const hoverGeometry = useAnimatedStyle(
      () => ({ left: -6 + 3 * progress.value, right: -6 + 3 * progress.value }),
      [progress],
    );
    const triggerStyle: WebCssStyle = {
      position: 'relative',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-start',
      alignSelf: 'flex-start',
      minWidth: 0,
      maxWidth: '100%',
      borderRadius: borderRadius.full,
      '--bloom-sidebar-ring': palette.ring,
      '--bloom-sidebar-ring-offset': palette.panel,
    };
    return (
      <AnimatedPressable
        {...pressable}
        ref={ref}
        {...(IS_WEB ? { dataSet: { bloomSidebar: 'offset' } } : {})}
        accessibilityLabel={name}
        onHoverIn={onIn}
        onHoverOut={() => {
          onOut();
          if (suppressHover) onHoverSuppressionEnd?.();
        }}
        style={[triggerStyle, triggerGeometry]}
        testID={testID}
      >
        {/* The hover pill: a 2px outline drawn outside the box, so it never shifts layout. */}
        <Animated.View
          pointerEvents="none"
          testID={testID ? `${testID}-pill` : undefined}
          style={[
            {
              position: 'absolute',
              top: -5,
              bottom: -5,
              borderRadius: borderRadius.full,
              borderWidth: 2,
              borderColor: hovered && !suppressHover ? palette.profileHoverBorder : 'transparent',
            },
            hoverGeometry,
          ]}
        />
        <SidebarAvatarView
          avatar={avatar}
          size="md"
          palette={palette}
          background={avatarBackground}
        />
        <Collapsible collapsed={collapsed}>
          <View
            testID={testID ? `${testID}-label` : undefined}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 2,
              paddingInlineStart: 8,
              minWidth: 0,
              flexShrink: 1,
            }}
          >
            {/* The name truncates; the chevron keeps its 16px and never overlaps it. */}
            <Text
              variant="body-medium"
              numberOfLines={1}
              style={{ color: palette.text, flexShrink: 1, minWidth: 0 }}
            >
              {name}
            </Text>
            <View style={{ flexShrink: 0 }}>
              <ChevronUpDownSmall color={palette.textTertiary} />
            </View>
          </View>
        </Collapsible>
      </AnimatedPressable>
    );
  },
);

const CardTrigger = React.forwardRef<ComponentRef<typeof View>, TriggerProps & { open: boolean }>(
  function CardTrigger(
    {
      form: _form,
      name,
      description,
      avatar,
      collapsed,
      menuLabel: _menuLabel,
      style,
      avatarBackground: _avatarBackground,
      suppressHover: _suppressHover,
      onHoverSuppressionEnd: _onHoverSuppressionEnd,
      testID,
      open,
      ...pressable
    },
    ref,
  ) {
    const palette = useSidebarPalette();
    const { state: hovered, onIn, onOut } = useInteractionState();
    const reducedMotion = useReducedMotion();
    const turn = useSharedValue(0);
    useEffect(() => {
      const target = open ? 180 : 0;
      turn.value = reducedMotion
        ? target
        : withTiming(target, { duration: 200, easing: Easing.bezier(0.25, 0.1, 0.25, 1) });
    }, [open, reducedMotion, turn]);
    const chevronStyle = useAnimatedStyle(
      () => ({ transform: [{ rotate: `${turn.value}deg` }] }),
      [turn],
    );

    const progress = useSidebarCollapseProgress(collapsed);
    const inSidebar = useInSidebar();
    const lane = useSidebarGeometry();
    const compactPadding = lane ? Math.max(0, (lane.collapsedLane - 32) / 2) : 2;
    const naturalWidth = useSharedValue(0);
    const expandedHeight = description ? 60 : 52;
    const geometry = useAnimatedStyle(() => {
      const p = progress.value;
      const height = expandedHeight + (36 - expandedHeight) * p;
      return {
        width: inSidebar
          ? '100%'
          : naturalWidth.value > 0
            ? naturalWidth.value + (36 - naturalWidth.value) * p
            : p === 1
              ? 36
              : '100%',
        height,
        borderRadius: height / 2,
        paddingInlineStart: 10 + (compactPadding - 10) * p,
        paddingInlineEnd: 16 + (compactPadding - 16) * p,
      };
    }, [progress, expandedHeight, inSidebar, naturalWidth, compactPadding]);
    const fill = useAnimatedStyle(() => ({ opacity: 1 - progress.value }), [progress]);
    const cardStyle: WebCssStyle = {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      overflow: 'hidden',
      borderWidth: 2,
      borderColor: hovered ? palette.teamHoverBorder : 'transparent',
      '--bloom-sidebar-ring': palette.ring,
      '--bloom-sidebar-ring-offset': palette.panel,
    };
    return (
      <AnimatedPressable
        {...pressable}
        ref={ref}
        {...(IS_WEB ? { dataSet: { bloomSidebar: 'offset' } } : {})}
        accessibilityLabel={name}
        onHoverIn={onIn}
        onHoverOut={onOut}
        onLayout={(event) => {
          if (progress.value === 0) naturalWidth.value = event.nativeEvent.layout.width;
        }}
        style={[cardStyle, style, { backgroundColor: 'transparent' }, geometry]}
        testID={testID}
      >
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: StyleSheet.flatten(style)?.backgroundColor ?? palette.tertiary },
            fill,
          ]}
        />
        <View style={{ flexDirection: 'row', alignItems: 'center', minWidth: 0, flexShrink: 1 }}>
          <SidebarAvatarView avatar={avatar} size="md" palette={palette} />
          <Collapsible collapsed={collapsed}>
            <View
              style={{
                paddingInlineStart: 8,
                justifyContent: 'center',
                alignItems: 'flex-start',
                minWidth: 0,
                flexShrink: 1,
              }}
            >
              <Text variant="body-medium" numberOfLines={1} style={{ color: palette.text }}>
                {name}
              </Text>
              {description ? (
                <Text
                  variant="body-regular"
                  numberOfLines={1}
                  style={{ color: palette.textSecondary }}
                >
                  {description}
                </Text>
              ) : null}
            </View>
          </Collapsible>
        </View>
        <Collapsible collapsed={collapsed}>
          <View
            style={{
              width: 16,
              height: 16,
              flexShrink: 0,
              borderRadius: 3,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: palette.tertiaryHover,
            }}
          >
            <Animated.View style={chevronStyle}>
              <ChevronDownSmall color={palette.textSecondary} />
            </Animated.View>
          </View>
        </Collapsible>
      </AnimatedPressable>
    );
  },
);

/** The heading of a menu opened from a card: the identity again, 8px in. */
export function SidebarIdentityHeading({
  name,
  description,
  avatar,
}: {
  name: string;
  description?: string;
  avatar?: SidebarAvatar;
}) {
  const palette = useSidebarPalette();
  return (
    <View
      style={{
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingLeft: 8,
        paddingRight: 8,
        paddingTop: 4,
      }}
    >
      <SidebarAvatarView avatar={avatar} size="md" palette={palette} />
      <View
        style={{ minWidth: 0, flexShrink: 1, justifyContent: 'center', alignItems: 'flex-start' }}
      >
        <Text variant="body-medium" numberOfLines={1} style={{ color: palette.text }}>
          {name}
        </Text>
        {description ? (
          <Text variant="body-regular" numberOfLines={1} style={{ color: palette.textSecondary }}>
            {description}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
