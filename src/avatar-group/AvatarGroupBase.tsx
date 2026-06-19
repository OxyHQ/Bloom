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

/** Ring (border) thickness around each avatar, in pixels. Matches the
 * original Mention `AvatarStack` (a single hairline-ish 1px separator). */
const RING_WIDTH = 1;
/** Default horizontal overlap as a fraction of avatar size — the original
 * stack pulled each avatar left by `size / 3`. */
const DEFAULT_OVERLAP_RATIO = 1 / 3;

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

  // The ring is the thin separator drawn between overlapping avatars. It
  // defaults to the page background so avatars read as cleanly punched out of
  // the surface behind them — matching the original Mention stack, which used
  // `theme.colors.background`, not a large `card`-colored ring cell.
  const ring = ringColor ?? theme.colors.background;
  const effectiveOverlap =
    overlap ?? Math.round(size * DEFAULT_OVERLAP_RATIO);
  // Each avatar after the first is pulled left by `overlap`. The cell carries a
  // 1px border on each side, so the negative margin absorbs both borders to
  // keep the visual overlap equal to `effectiveOverlap`.
  const negativeMargin = -(effectiveOverlap + RING_WIDTH * 2);

  const shown = useMemo(
    () => items.slice(0, Math.max(0, max)),
    [items, max],
  );

  const realTotal = total ?? items.length;
  const overflow = Math.max(0, realTotal - shown.length);

  // Each cell is a circular, clipped container with a 1px ring border. The inner
  // Avatar is inset by the border on both sides so the image fills the circle
  // exactly inside the ring.
  const innerSize = size - RING_WIDTH * 2;
  const cellStyle = useMemo((): ViewStyle => {
    return {
      width: size,
      height: size,
      borderRadius: size / 2,
      borderWidth: RING_WIDTH,
      borderColor: ring,
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center',
    };
  }, [size, ring]);

  const overflowTextStyle = useMemo(
    () => ({
      color: '#FFFFFF',
      fontSize: Math.max(fontSize._2xs, Math.round(size * 0.36)),
      fontWeight: '600' as const,
    }),
    [size],
  );

  const interactive = typeof onPressItem === 'function';
  const hoverable =
    typeof hoverHandlers?.onHoverIn === 'function' ||
    typeof hoverHandlers?.onHoverOut === 'function';

  // Pressing the "+N" circle surfaces the first hidden member (if any), so
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
            {/*
              Route the item's avatar value through Avatar's `source` prop (not
              `uri`): full URLs pass through directly, while resolver-handled ids
              (e.g. Oxy file IDs) are resolved by the consumer's ImageResolver —
              exactly like the original Mention stack. No `name` is passed, so a
              missing avatar shows Avatar's neutral default placeholder rather
              than a colored deterministic initial.
            */}
            <Avatar source={item.uri ?? undefined} size={innerSize} />
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
        <OverflowCircle
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

function OverflowCircle({
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
  // The count circle is anchored at the lowest stacking order so it tucks behind
  // the last avatar's ring. The margin lives on the outer element to keep layout
  // aligned with the overlap.
  const wrapperStyle: ViewStyle = {
    ...(negativeMargin !== 0 && { marginLeft: negativeMargin }),
    zIndex: 0,
  };

  // A solid "+N" count circle: secondary-text-colored fill with white text,
  // matching the original Mention `ResponsiveAvatarStack` count circle.
  const circle = (
    <View
      style={[cellStyle, { backgroundColor: theme.colors.textSecondary }]}
    >
      <Text allowFontScaling={false} style={textStyle}>
        +{count}
      </Text>
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
        {circle}
      </Pressable>
    );
  }

  return <View style={wrapperStyle}>{circle}</View>;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export const AvatarGroupBase = memo(AvatarGroupBaseComponent);
AvatarGroupBase.displayName = 'AvatarGroupBase';
