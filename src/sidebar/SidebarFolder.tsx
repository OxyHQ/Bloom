import React, { memo, useCallback, useEffect } from 'react';
import { Pressable, View, type GestureResponderEvent, type LayoutChangeEvent } from 'react-native';

import { borderRadius } from '../styles/tokens';import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { useControllableState } from '../hooks/use-controllable-state';
import { useInteractionState } from '../hooks/use-interaction-state';
import { useIsRtl } from '../hooks/use-is-rtl';
import { RiFolderLine } from '../icons/remix/RiFolderLine';
import { RiFolderOpenLine } from '../icons/remix/RiFolderOpenLine';
import type { WebCssStyle } from '../styles/web-view-style';
import { Text } from '../typography';
import { useSidebarPalette, type SidebarPalette } from './palette';
import { IS_WEB, useSidebarWebCss } from './parts';
import type { SidebarFolderProps, SidebarTreeFolder, SidebarTreeItem } from './types';

const EASE_IN_OUT = Easing.bezier(0.4, 0, 0.2, 1);
const ROW_PITCH = 32; // a 30px row and its 2px gap
const FIRST_CENTER = 15;

/**
 * The curved connector: a guide dropping from the folder glyph with a rounded
 * elbow into each row — 1px icon-quaternary, trunk at x 17, each elbow landing 5px
 * toward the end of it and running on to 11.5. The path is drawn left-to-right,
 * so under RTL the box is mirrored as well as anchored from the start edge.
 */
function TreeConnector({ count, color }: { count: number; color: string }) {
  const rtl = useIsRtl();
  if (count === 0) return null;
  const height = FIRST_CENTER + ROW_PITCH * (count - 1) + 1;
  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: 0, insetInlineStart: 16.5, width: 12, height, transform: rtl ? [{ scaleX: -1 }] : undefined }}>
      <Svg width={12} height={height} viewBox={`0 0 12 ${height}`} fill="none">
        {Array.from({ length: count }, (_, i) => {
          const y = FIRST_CENTER + ROW_PITCH * i;
          return <Path key={y} d={`M0.5 0 V${y - 5} Q0.5 ${y} 5.5 ${y} H11.5`} stroke={color} strokeWidth={1} />;
        })}
      </Svg>
    </View>
  );
}

function TreeRow({
  item,
  folder,
  selected,
  focusable,
  onPress,
  palette,
}: {
  item: SidebarTreeItem;
  folder: SidebarTreeFolder;
  selected: boolean;
  focusable: boolean;
  onPress?: (item: SidebarTreeItem, folder: SidebarTreeFolder) => void;
  palette: SidebarPalette;
}) {
  const { state: hovered, onIn, onOut } = useInteractionState();
  const style: WebCssStyle = {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: borderRadius.full,
    paddingTop: 5,
    paddingBottom: 5,
    paddingInlineEnd: 8,
    paddingInlineStart: 36,
    backgroundColor: selected || hovered ? palette.rowHover : 'transparent',
    '--bloom-sidebar-ring': palette.ring,
  };
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%' }}
      onPointerEnter={item.onPrefetch} onTouchStart={item.onPrefetch}>
    <Pressable
      {...(IS_WEB
        ? {
            dataSet: { bloomSidebar: 'ring' },
            ...(item.href ? { href: item.href } : null),
            ...(selected ? { 'aria-current': 'page' } : null),
          }
        : {})}
      role={item.href ? 'link' : 'button'}
      accessibilityLabel={item.meta ? `${item.label}, ${item.meta}` : item.label}
      accessibilityState={{ selected }}
      focusable={focusable}
      onHoverIn={onIn}
      onHoverOut={onOut}
      onLongPress={item.onLongPress}
      onPress={(event: GestureResponderEvent) => {
        item.onPrefetch?.();
        if (!onPress) return;
        if (IS_WEB && item.href) event.preventDefault();
        onPress(item, folder);
      }}
      style={style}>
      <Text variant="body-medium" numberOfLines={1} style={{ minWidth: 0, flex: 1, color: palette.textSecondary }}>
        {item.label}
      </Text>
      {item.meta ? (
        <View
          style={{
            flexShrink: 0,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 4,
            backgroundColor: palette.tertiary,
            paddingLeft: 4,
            paddingRight: 4,
            paddingTop: 1,
            paddingBottom: 1,
          }}>
          <Text variant="caption-1-medium" numberOfLines={1} style={{ color: palette.textSecondary }}>
            {item.meta}
          </Text>
        </View>
      ) : null}
    </Pressable>
    {item.actions}
    </View>
  );
}

/**
 * An expandable folder of the sidebar's tree (the AI chat's repositories).
 *
 *   row      p 8, radius 10, gap 8: a 20px folder glyph (open while expanded)
 *            and the label, body-medium text-secondary, truncating;
 *            background-secondary-hover on hover
 *   rows     pt 2, 2 apart, the curved connector behind them; each py 5 / pr 8 /
 *            pl 36, radius 10, gap 10: the label (body-medium text-secondary,
 *            truncating) and its meta chip (radius 4, background-tertiary, px 4 /
 *            py 1, caption-1-medium); background-secondary-hover while selected
 *            or hovered
 *   motion   the rows' height and opacity ease open and shut together (300ms
 *            ease-in-out); collapsed rows leave the tab order
 */
function SidebarFolderComponent({
  folder,
  open,
  onOpenChange,
  forceOpen = false,
  selectedItem,
  onItemPress,
  style,
  testID,
}: SidebarFolderProps) {
  const palette = useSidebarPalette();
  useSidebarWebCss();
  const reducedMotion = useReducedMotion();
  const { state: hovered, onIn, onOut } = useInteractionState();
  const [isOpen, setOpen] = useControllableState<boolean>({
    value: open ?? folder.open,
    defaultValue: folder.defaultOpen ?? false,
    onChange: onOpenChange ?? folder.onOpenChange,
  });
  const expanded = forceOpen || isOpen;
  const Icon = expanded ? RiFolderOpenLine : RiFolderLine;

  const progress = useSharedValue(expanded ? 1 : 0);
  const contentHeight = useSharedValue(0);
  useEffect(() => {
    const target = expanded ? 1 : 0;
    progress.value = reducedMotion ? target : withTiming(target, { duration: 300, easing: EASE_IN_OUT });
  }, [expanded, reducedMotion, progress]);
  const onContentLayout = useCallback(
    (event: LayoutChangeEvent) => {
      contentHeight.value = event.nativeEvent.layout.height;
    },
    [contentHeight],
  );
  const clipStyle = useAnimatedStyle(
    () => ({
      opacity: progress.value,
      height: progress.value >= 1 ? 'auto' : contentHeight.value * progress.value,
    }),
    [progress, contentHeight],
  );

  const rowStyle: WebCssStyle = {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 8,
    borderRadius: borderRadius.full,
    backgroundColor: hovered ? palette.rowHover : 'transparent',
    '--bloom-sidebar-ring': palette.ring,
  };

  return (
    <View testID={testID} style={[{ width: '100%', flexDirection: 'column' }, style]}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Pressable
        {...(IS_WEB ? { dataSet: { bloomSidebar: 'ring' } } : {})}
        role="button"
        accessibilityLabel={folder.label}
        aria-expanded={expanded}
        accessibilityState={{ expanded }}
        onHoverIn={onIn}
        onHoverOut={onOut}
        onPress={() => setOpen(!isOpen)}
        style={rowStyle}>
        <View style={{ flexShrink: 0 }}>
          <Icon width={20} height={20} fill={palette.textSecondary} />
        </View>
        <Text variant="body-medium" numberOfLines={1} style={{ flexShrink: 1, color: palette.textSecondary }}>
          {folder.label}
        </Text>
      </Pressable>
      {folder.actions}
      </View>
      <Animated.View
        aria-hidden={!expanded}
        pointerEvents={expanded ? 'auto' : 'none'}
        accessibilityElementsHidden={!expanded}
        importantForAccessibility={expanded ? 'auto' : 'no-hide-descendants'}
        {...(IS_WEB && !expanded ? { inert: true } : {})}
        style={[{ overflow: 'hidden' }, clipStyle]}>
        <View onLayout={onContentLayout} style={{ position: 'relative', width: '100%', flexDirection: 'column', gap: 2, paddingTop: 2 }}>
          <TreeConnector count={folder.items.length} color={palette.iconQuaternary} />
          {folder.items.map((item) => (
            <TreeRow
              key={item.key}
              item={item}
              folder={folder}
              selected={item.key === selectedItem}
              focusable={expanded}
              onPress={onItemPress}
              palette={palette}
            />
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

export const SidebarFolder = memo(SidebarFolderComponent);
SidebarFolder.displayName = 'SidebarFolder';
