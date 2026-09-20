import React, { memo, useEffect } from 'react';
import { Pressable } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { SEGMENTED_THUMB_EASE_BEZIER, SEGMENTED_THUMB_MS } from '../button/shared';
import { useInteractionState } from '../hooks/use-interaction-state';
import { borderRadius } from '../styles/tokens';
import type { WebCssStyle } from '../styles/web-view-style';
import { Text } from '../typography';
import { useSidebarPalette } from './palette';
import { useSidebarMetrics } from './metrics';
import { Collapsible, IS_WEB, useInSidebar, useSidebarCollapseProgress, useSidebarWebCss, webHook } from './parts';
import type { SidebarMode, SidebarModeSwitcherProps } from './types';

/**
 * `SidebarModeSwitcher`: a vertical segmented control for the modes a sidebar
 * switches between (Search / Computer, Chat / Agents), each an icon and label.
 *
 *   track      p4, radius 20, background-tertiary (neutral-200 / neutral-800)
 *   row        32 tall, 4 apart; icon 18 in a 32 box, 4 gap, body-2-medium
 *   thumb      the selected row's 32px pill: card / neutral-700 with shadow-xs,
 *              sliding 200ms ease between rows (instant under reduced motion)
 *   rest       icon and label text-secondary; selected text-primary
 *   shortcut   web only, on hover: a caption-2 hint at the row's end
 *   collapsed  labels and hints collapse; the icons stay pinned
 *
 * Its colours are the sidebar ThemeToggle's segmented track and thumb, so the
 * two read as one family. A `radiogroup`: each row is a `radio`.
 */

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const ROW_HEIGHT = 32;
const ROW_GAP = 4;
const PADDING = 4;
const EASE = Easing.bezier(...SEGMENTED_THUMB_EASE_BEZIER);

function ModeRow({
  mode,
  selected,
  collapsed,
  progress,
  compactSquare,
  compactIcon,
  onSelect,
  testID,
}: {
  mode: SidebarMode;
  selected: boolean;
  collapsed: boolean;
  progress: SharedValue<number>;
  compactSquare: number;
  compactIcon: number;
  onSelect: (key: string) => void;
  testID?: string;
}) {
  const palette = useSidebarPalette();
  const { state: hovered, onIn, onOut } = useInteractionState();
  const Icon = mode.icon;
  const foreground = selected ? palette.text : palette.textSecondary;

  const geometry = useAnimatedStyle(() => ({
    height: ROW_HEIGHT + (compactSquare - ROW_HEIGHT) * progress.value,
    gap: 4 * (1 - progress.value),
  }), [progress, compactSquare]);
  const iconBox = useAnimatedStyle(() => {
    const side = ROW_HEIGHT + (compactSquare - ROW_HEIGHT) * progress.value;
    return { width: side, height: side };
  }, [progress, compactSquare]);
  const glyphStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + (compactIcon / 18 - 1) * progress.value }],
  }), [progress, compactIcon]);
  const rowStyle: WebCssStyle = {
    flexDirection: 'row',
    alignItems: 'center',

    borderRadius: borderRadius.full,
    '--bloom-sidebar-ring': palette.ring,
  };

  return (
    <AnimatedPressable
      {...webHook('ring')}
      {...(IS_WEB && collapsed ? { title: mode.label } : null)}
      role="radio"
      aria-checked={selected}
      accessibilityState={{ checked: selected }}
      accessibilityLabel={mode.label}
      onHoverIn={onIn}
      onHoverOut={onOut}
      onPress={() => onSelect(mode.key)}
      style={[rowStyle, geometry]}
      testID={testID}
    >
      <Animated.View style={[{ alignItems: 'center', justifyContent: 'center', flexShrink: 0 }, iconBox]}>
        <Animated.View style={glyphStyle}><Icon width={18} height={18} fill={foreground} /></Animated.View>
      </Animated.View>
      <Collapsible collapsed={collapsed} style={{ flex: 1, minWidth: 0 }}>
        <Text variant="body-2-medium" numberOfLines={1} style={{ color: foreground }}>
          {mode.label}
        </Text>
      </Collapsible>
      {IS_WEB && mode.shortcut ? (
        <Collapsible collapsed={collapsed}>
          <Text
            variant="caption-2-regular"
            numberOfLines={1}
            style={{ color: palette.textTertiary, paddingRight: 12, opacity: hovered ? 1 : 0 }}
          >
            {mode.shortcut}
          </Text>
        </Collapsible>
      ) : null}
    </AnimatedPressable>
  );
}

const SidebarModeSwitcherComponent: React.FC<SidebarModeSwitcherProps> = ({
  modes,
  value,
  onValueChange,
  collapsed = false,
  accessibilityLabel = 'Mode',
  style,
  testID,
}) => {
  const palette = useSidebarPalette();
  useSidebarWebCss();
  const reducedMotion = useReducedMotion();
  const metrics = useSidebarMetrics();
  const progress = useSidebarCollapseProgress(collapsed);
  const inSidebar = useInSidebar();
  const compactSquare = metrics.row.square;
  const compactIcon = metrics.row.icon;
  // Grow into the panel inset continuously while its content column narrows.
  const trackStyle = useAnimatedStyle(() => ({
    marginLeft: inSidebar ? -PADDING * progress.value : 0,
    marginRight: inSidebar ? -PADDING * progress.value : 0,
    borderRadius: (ROW_HEIGHT + (compactSquare - ROW_HEIGHT) * progress.value + PADDING * 2) / 2,
  }), [progress, compactSquare, inSidebar]);

  // One scan answers both questions: which row the thumb sits on, and whether
  // there is a selected row at all.
  const selectedIndex = modes.findIndex((mode) => mode.key === value);
  const selectedKnown = selectedIndex !== -1;
  const index = Math.max(0, selectedIndex);
  const selectedPosition = useSharedValue(index);
  useEffect(() => {
    selectedPosition.value = reducedMotion ? index : withTiming(index, { duration: SEGMENTED_THUMB_MS, easing: EASE });
  }, [index, reducedMotion, selectedPosition]);
  const thumbStyle = useAnimatedStyle(() => {
    const height = ROW_HEIGHT + (compactSquare - ROW_HEIGHT) * progress.value;
    return { height, transform: [{ translateY: selectedPosition.value * (height + ROW_GAP) }] };
  }, [progress, compactSquare, selectedPosition]);

  return (
    <Animated.View
      role="radiogroup"
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      style={[
        {
          position: 'relative',
          width: inSidebar ? undefined : collapsed ? compactSquare + PADDING * 2 : '100%',
          alignSelf: inSidebar ? 'stretch' : 'center',
          padding: PADDING,
          gap: ROW_GAP,
          backgroundColor: palette.tertiary,
        },
        trackStyle,
        style,
      ]}
    >
      {selectedKnown ? (
        <Animated.View
          pointerEvents="none"
          aria-hidden
          testID={testID ? `${testID}-thumb` : undefined}
          style={[
            {
              position: 'absolute',
              top: PADDING,
              left: PADDING,
              right: PADDING,
              borderRadius: borderRadius.full,
              backgroundColor: palette.segmentedThumb,
              boxShadow: palette.segmentedThumbShadow,
            },
            thumbStyle,
          ]}
        />
      ) : null}
      {modes.map((mode) => (
        <ModeRow
          key={mode.key}
          mode={mode}
          selected={mode.key === value}
          collapsed={collapsed}
          progress={progress}
          compactSquare={compactSquare}
          compactIcon={compactIcon}
          onSelect={onValueChange}
          testID={testID ? `${testID}-${mode.key}` : undefined}
        />
      ))}
    </Animated.View>
  );
};

export const SidebarModeSwitcher = memo(SidebarModeSwitcherComponent);
SidebarModeSwitcher.displayName = 'SidebarModeSwitcher';
