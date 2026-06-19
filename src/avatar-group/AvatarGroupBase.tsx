import React, { memo, useMemo } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';

import { Avatar } from '../avatar';
import { useTheme } from '../theme/use-theme';
import { fontSize } from '../styles/tokens';
import type { AvatarGroupItem, AvatarGroupProps } from './types';

/** Ring thickness as a fraction of avatar size. */
const RING_RATIO = 0.08;
/** Minimum ring thickness so small avatars still separate cleanly. */
const MIN_RING = 2;
/** Default horizontal overlap as a fraction of avatar size. */
const DEFAULT_OVERLAP_RATIO = 0.35;

function getItemName(item: AvatarGroupItem): string | undefined {
  return item.displayName ?? item.name ?? item.username;
}

function getItemKey(item: AvatarGroupItem, index: number): string {
  return item.id ?? item.username ?? item.uri ?? `avatar-${index}`;
}

/** Hover callbacks injected by the web fork; undefined (no-op) on native. */
export interface AvatarGroupCellHoverHandlers {
  onHoverIn?: (item: AvatarGroupItem, index: number) => void;
  onHoverOut?: (item: AvatarGroupItem, index: number) => void;
  /** Sets the measured anchor ref for the hovered cell (web only). */
  registerCellRef?: (index: number, node: View | null) => void;
}

interface AvatarGroupBaseProps extends AvatarGroupProps {
  hoverHandlers?: AvatarGroupCellHoverHandlers;
}

const AvatarGroupBaseComponent: React.FC<AvatarGroupBaseProps> = ({
  items,
  size = 32,
  max = 5,
  total,
  overlap,
  ringColor,
  onPressItem,
  style,
  testID,
  hoverHandlers,
}) => {
  const theme = useTheme();

  const ring = ringColor ?? theme.colors.card;
  const ringWidth = Math.max(MIN_RING, Math.round(size * RING_RATIO));
  const effectiveOverlap =
    overlap ?? Math.round(size * DEFAULT_OVERLAP_RATIO);
  // Each avatar after the first is pulled left by `overlap`, but the ring adds
  // visual width on both sides, so the negative margin accounts for the ring.
  const negativeMargin = -(effectiveOverlap + ringWidth);

  const shown = useMemo(
    () => items.slice(0, Math.max(0, max)),
    [items, max],
  );

  const realTotal = total ?? items.length;
  const overflow = Math.max(0, realTotal - shown.length);

  const cellStyle = useMemo((): ViewStyle => {
    return {
      width: size + ringWidth * 2,
      height: size + ringWidth * 2,
      borderRadius: (size + ringWidth * 2) / 2,
      backgroundColor: ring,
      alignItems: 'center',
      justifyContent: 'center',
    };
  }, [size, ringWidth, ring]);

  const overflowTextStyle = useMemo(
    () => ({
      color: theme.colors.textSecondary,
      fontSize: Math.max(fontSize._2xs, Math.round(size * 0.4)),
      fontWeight: '600' as const,
    }),
    [theme.colors.textSecondary, size],
  );

  const interactive = typeof onPressItem === 'function';
  const hoverable =
    typeof hoverHandlers?.onHoverIn === 'function' ||
    typeof hoverHandlers?.onHoverOut === 'function';

  // Pressing the "+N" chip surfaces the first hidden member (if any), so
  // consumers can route it to a full member list.
  const firstHidden = items[shown.length];
  const overflowOnPress =
    interactive && firstHidden
      ? () => onPressItem?.(firstHidden, shown.length)
      : undefined;

  return (
    <View style={[styles.row, style]} testID={testID}>
      {shown.map((item, index) => {
        const name = getItemName(item);
        const accessibilityLabel = item.username
          ? `${name ?? item.username} (@${item.username})`
          : name;

        // The negative margin and stacking order live on the outermost
        // row element so layout and hit-testing stay aligned with the visual
        // overlap. Earlier siblings render on top of later ones.
        const wrapperStyle: ViewStyle = {
          ...(index > 0 && { marginLeft: negativeMargin }),
          zIndex: shown.length - index,
        };

        const cell = (
          <View
            ref={
              hoverHandlers?.registerCellRef
                ? (node) => hoverHandlers.registerCellRef?.(index, node)
                : undefined
            }
            collapsable={false}
            style={cellStyle}
          >
            <Avatar uri={item.uri ?? undefined} name={name} size={size} />
          </View>
        );

        if (interactive || hoverable) {
          return (
            <Pressable
              key={getItemKey(item, index)}
              onPress={
                interactive ? () => onPressItem?.(item, index) : undefined
              }
              onHoverIn={
                hoverHandlers?.onHoverIn
                  ? () => hoverHandlers.onHoverIn?.(item, index)
                  : undefined
              }
              onHoverOut={
                hoverHandlers?.onHoverOut
                  ? () => hoverHandlers.onHoverOut?.(item, index)
                  : undefined
              }
              accessibilityRole={interactive ? 'button' : undefined}
              accessibilityLabel={accessibilityLabel}
              style={wrapperStyle}
            >
              {cell}
            </Pressable>
          );
        }

        return (
          <View key={getItemKey(item, index)} style={wrapperStyle}>
            {cell}
          </View>
        );
      })}

      {overflow > 0 && (
        <OverflowChip
          count={overflow}
          cellStyle={cellStyle}
          negativeMargin={shown.length > 0 ? negativeMargin : 0}
          textStyle={overflowTextStyle}
          onPress={overflowOnPress}
        />
      )}
    </View>
  );
};

function OverflowChip({
  count,
  cellStyle,
  negativeMargin,
  textStyle,
  onPress,
}: {
  count: number;
  cellStyle: ViewStyle;
  negativeMargin: number;
  textStyle: { color: string; fontSize: number; fontWeight: '600' };
  onPress?: () => void;
}) {
  const theme = useTheme();
  // The chip is anchored at the lowest stacking order so it tucks behind the
  // last avatar's ring. The margin lives on the outer element to keep layout
  // aligned with the overlap.
  const wrapperStyle: ViewStyle = {
    ...(negativeMargin !== 0 && { marginLeft: negativeMargin }),
    zIndex: 0,
  };

  const chip = (
    <View style={[cellStyle, { backgroundColor: theme.colors.card }]}>
      <View
        style={[
          styles.chipInner,
          { backgroundColor: theme.colors.backgroundTertiary },
        ]}
      >
        <Text allowFontScaling={false} style={textStyle}>
          +{count}
        </Text>
      </View>
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${count} more`}
        style={wrapperStyle}
      >
        {chip}
      </Pressable>
    );
  }

  return <View style={wrapperStyle}>{chip}</View>;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chipInner: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export const AvatarGroupBase = memo(AvatarGroupBaseComponent);
AvatarGroupBase.displayName = 'AvatarGroupBase';
