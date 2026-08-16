import React, { memo, useMemo } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { Avatar } from '../avatar';
import { useTheme } from '../theme/use-theme';
import { fontSize } from '../styles/tokens';
import { computeClusterLayout } from './cluster-layout';
import type { AvatarGroupItem, AvatarGroupProps } from './types';

/** Ring (border) thickness around each avatar, in pixels. Matches the
 * original Mention `AvatarStack` (a single hairline-ish 1px separator). */
const RING_WIDTH = 1;
/** Default horizontal overlap as a fraction of avatar size — the original
 * stack pulled each avatar left by `size / 3`. */
const DEFAULT_OVERLAP_RATIO = 1 / 3;
/** Default `max` for the `stack`/`row` facepile layouts. */
const DEFAULT_MAX = 5;
/** Default `max` (visible cap) for the `cluster` layout — it packs densely. */
const CLUSTER_DEFAULT_MAX = 20;
/** Separator ring thickness for cluster bubbles, as a fraction of the box. */
const CLUSTER_RING_RATIO = 0.02;
/** Overflow "+N" text color — white reads on the grey chip in light + dark,
 * matching the original Mention count circle (shared by every layout). */
const OVERFLOW_TEXT_COLOR = '#FFFFFF';

/**
 * The first non-blank of the fields a caller can name a person with, trimmed.
 *
 * `??` is the wrong operator for every one of these and the reason is the same
 * each time: it falls through on `null`/`undefined` ONLY, so an empty or
 * whitespace-only string wins over the field behind it. That is not a
 * hypothetical shape — `displayName` is optional ecosystem-wide and the API
 * sends `''` for it, at which point `displayName ?? username` hands `Avatar` a
 * blank name, `Avatar` correctly reads that as "no name" (it trims), and the
 * cell renders the DEFAULT AVATAR IMAGE: the one placeholder that says nothing
 * about who the person is, where the handle's initial was available all along.
 *
 * The org rule is `displayName?.trim() || handle`, and `.trim()` plus `||` is
 * exactly what it prescribes for this case. This is a FALLBACK, not a repair:
 * an absent display name is a normal, expected state that a UI has to render
 * something for, so the choice belongs here. Bloom never rewrites the value it
 * was handed — a genuinely WRONG `displayName` is still fixed in the serializer
 * or the SDK type, never in a component.
 */
function firstNonBlank(...values: Array<string | null | undefined>): string | undefined {
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed) return trimmed;
  }
  return undefined;
}

/**
 * What to call this person. Exported because the web fork's hover card needs the
 * SAME answer — it used to carry its own copy of this function, and the copy had
 * the same defect, so fixing one would have left half the family wrong.
 */
export function getItemName(item: AvatarGroupItem): string | undefined {
  return firstNonBlank(item.displayName, item.name, item.username);
}

/**
 * The React key. Same operator hazard, different blast radius: a blank `id`
 * under `??` yields the key `''`, and two such items in one group collide into
 * a duplicate key — a reconciliation bug rather than a wrong pixel, which is
 * why it is worth fixing but was not what anybody noticed.
 */
function getItemKey(item: AvatarGroupItem, index: number): string {
  return firstNonBlank(item.id, item.username, item.uri) ?? `avatar-${index}`;
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

/**
 * A single avatar cell shared by every layout: a circular, clipped container
 * (`cellStyle`) holding one {@link Avatar}, positioned by `wrapperStyle`, and
 * made pressable/hoverable when the relevant handlers are supplied. Layout
 * (margins for the facepile, absolute coords for the cluster) lives entirely in
 * the caller-provided styles so this stays layout-agnostic.
 */
function AvatarGroupCell({
  item,
  index,
  innerSize,
  variant,
  showInitials,
  cellStyle,
  wrapperStyle,
  onPressItem,
  hoverHandlers,
}: {
  item: AvatarGroupItem;
  index: number;
  innerSize: number;
  variant?: string;
  showInitials: boolean;
  cellStyle: StyleProp<ViewStyle>;
  wrapperStyle: StyleProp<ViewStyle>;
  onPressItem?: (item: AvatarGroupItem, index: number) => void;
  hoverHandlers?: AvatarGroupCellHoverHandlers;
}) {
  const name = getItemName(item);
  // The handle is trimmed for the same reason the name is: `item.username` of
  // `'  '` is TRUTHY, so the untrimmed form announced "Ada (@  )".
  const handle = firstNonBlank(item.username);
  const accessibilityLabel = handle ? `${name ?? handle} (@${handle})` : name;
  const interactive = typeof onPressItem === 'function';
  const hoverable =
    typeof hoverHandlers?.onHoverIn === 'function' ||
    typeof hoverHandlers?.onHoverOut === 'function';

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
        Route the item's avatar value through Avatar's `source` prop (not `uri`):
        full URLs pass through directly, while resolver-handled ids (e.g. Oxy
        file IDs) are resolved by the consumer's ImageResolver. `variant`
        (default `'thumb'`) is forwarded so the resolver builds a small rendition.
        A missing avatar shows Avatar's neutral default placeholder unless
        `showInitials` is set, in which case the item's name renders a colored
        initial.
      */}
      <Avatar
        source={item.uri ?? undefined}
        name={showInitials ? name : undefined}
        variant={variant}
        size={innerSize}
      />
    </View>
  );

  if (interactive || hoverable) {
    return (
      <Pressable
        onPress={interactive ? () => onPressItem?.(item, index) : undefined}
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

  return <View style={wrapperStyle}>{cell}</View>;
}

const AvatarGroupBaseComponent: React.FC<AvatarGroupBaseProps> = ({
  items,
  layout = 'stack',
  size = 32,
  variant = 'thumb',
  max,
  total,
  overlap,
  spacing,
  ringColor,
  showInitials = false,
  onPressItem,
  style,
  testID,
  hoverHandlers,
}) => {
  const theme = useTheme();
  const isCluster = layout === 'cluster';
  const isRow = layout === 'row';

  // The ring is the thin separator drawn between overlapping avatars. It
  // defaults to the page background so avatars read as cleanly punched out of
  // the surface behind them — matching the original Mention stack, which used
  // `theme.colors.background`, not a large `card`-colored ring cell.
  const ring = ringColor ?? theme.colors.background;

  const effectiveMax = max ?? DEFAULT_MAX;
  const effectiveOverlap =
    overlap ?? Math.round(size * DEFAULT_OVERLAP_RATIO);
  // Each avatar after the first is pulled left by `overlap`. The cell carries a
  // 1px border on each side, so the negative margin absorbs both borders to
  // keep the visual overlap equal to `effectiveOverlap`.
  const negativeMargin = -(effectiveOverlap + RING_WIDTH * 2);
  // Row layout: a positive gap between adjacent avatars (no overlap, no ring).
  const rowGap = spacing ?? Math.round(size * DEFAULT_OVERLAP_RATIO);
  // Horizontal offset applied to every avatar after the first.
  const itemMargin = isRow ? rowGap : negativeMargin;

  const shown = useMemo(
    () => items.slice(0, Math.max(0, effectiveMax)),
    [items, effectiveMax],
  );

  const realTotal = total ?? items.length;
  const overflow = Math.max(0, realTotal - shown.length);

  // Stack: each cell is a circular, clipped container with a 1px ring border,
  // and the inner Avatar is inset by the border on both sides. Row: no ring, so
  // the Avatar fills the full cell.
  const innerSize = isRow ? size : size - RING_WIDTH * 2;
  const cellStyle = useMemo((): ViewStyle => {
    if (isRow) {
      return {
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: 'center',
        justifyContent: 'center',
      };
    }
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
  }, [isRow, size, ring]);

  const overflowTextStyle = useMemo(
    (): TextStyle => ({
      color: OVERFLOW_TEXT_COLOR,
      fontSize: Math.max(fontSize._2xs, Math.round(size * 0.36)),
      fontWeight: '600',
    }),
    [size],
  );

  const interactive = typeof onPressItem === 'function';

  // Pressing the "+N" circle surfaces the first hidden member (if any), so
  // consumers can route it to a full member list.
  const firstHidden = items[shown.length];
  const overflowOnPress =
    interactive && firstHidden
      ? () => onPressItem?.(firstHidden, shown.length)
      : undefined;

  // The cluster is a compact 2D bubble pack with its own absolute-positioned
  // renderer; hooks above still run unconditionally so the branch is safe.
  if (isCluster) {
    return (
      <ClusterAvatarGroup
        items={items}
        size={size}
        variant={variant}
        max={max}
        total={total}
        ring={ring}
        showInitials={showInitials}
        onPressItem={onPressItem}
        style={style}
        testID={testID}
        hoverHandlers={hoverHandlers}
      />
    );
  }

  return (
    <View style={[styles.row, style]} testID={testID}>
      {shown.map((item, index) => {
        // The horizontal margin and stacking order live on the outermost row
        // element so layout and hit-testing stay aligned with the visual
        // overlap. In stack mode earlier siblings render on top of later ones
        // (descending zIndex); in row mode there is no overlap so stacking
        // order is irrelevant.
        const wrapperStyle: ViewStyle = {
          ...(index > 0 && { marginLeft: itemMargin }),
          ...(isRow ? {} : { zIndex: shown.length - index }),
        };

        return (
          <AvatarGroupCell
            key={getItemKey(item, index)}
            item={item}
            index={index}
            innerSize={innerSize}
            variant={variant}
            showInitials={showInitials}
            cellStyle={cellStyle}
            wrapperStyle={wrapperStyle}
            onPressItem={onPressItem}
            hoverHandlers={hoverHandlers}
          />
        );
      })}

      {overflow > 0 && (
        <OverflowCircle
          count={overflow}
          cellStyle={cellStyle}
          wrapperStyle={{
            ...(shown.length > 0 && { marginLeft: itemMargin }),
            ...(isRow ? {} : { zIndex: 0 }),
          }}
          textStyle={overflowTextStyle}
          onPress={overflowOnPress}
        />
      )}
    </View>
  );
};

interface ClusterAvatarGroupProps {
  items: AvatarGroupItem[];
  size: number;
  variant?: string;
  max?: number;
  total?: number;
  ring: string;
  showInitials: boolean;
  onPressItem?: (item: AvatarGroupItem, index: number) => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  hoverHandlers?: AvatarGroupCellHoverHandlers;
}

/**
 * The `cluster` layout: an iMessage-style magnetic bubble pack. Members are laid
 * out by {@link computeClusterLayout} (a deterministic force-directed pack) into
 * box-fraction bubbles, then absolutely positioned inside a `size × size` box so
 * the whole cluster drops in where a single round Avatar would. The largest
 * member (index 0) sits centred and in front; the rest pack around it with a
 * uniform gap. Overflow beyond `max` collapses into a trailing "+N" bubble.
 */
const ClusterAvatarGroup: React.FC<ClusterAvatarGroupProps> = ({
  items,
  size,
  variant,
  max,
  total,
  ring,
  showInitials,
  onPressItem,
  style,
  testID,
  hoverHandlers,
}) => {
  const cap = Math.max(1, max ?? CLUSTER_DEFAULT_MAX);
  const realTotal = total ?? items.length;
  const hasOverflow = realTotal > cap;
  // Reserve the last bubble for the "+N" chip when there are more members than
  // the cap; otherwise every capped member gets its own bubble.
  const avatarCap = hasOverflow ? Math.max(0, cap - 1) : cap;
  const shown = useMemo(
    () => items.slice(0, avatarCap),
    [items, avatarCap],
  );
  const overflow = hasOverflow ? Math.max(0, realTotal - shown.length) : 0;
  const bubbleCount = shown.length + (overflow > 0 ? 1 : 0);
  const bubbles = useMemo(
    () => computeClusterLayout(bubbleCount),
    [bubbleCount],
  );

  const ringWidth = Math.max(1, Math.round(size * CLUSTER_RING_RATIO));
  const interactive = typeof onPressItem === 'function';

  // Pressing "+N" surfaces the first hidden member (parity with the stack).
  const firstHidden = items[shown.length];
  const overflowOnPress =
    interactive && firstHidden
      ? () => onPressItem?.(firstHidden, shown.length)
      : undefined;

  const overflowBubble = overflow > 0 ? bubbles[bubbleCount - 1] : undefined;
  let overflowElement: React.ReactNode = null;
  if (overflow > 0 && overflowBubble) {
    const diameter = overflowBubble.d * size;
    overflowElement = (
      <OverflowCircle
        count={overflow}
        cellStyle={{
          width: diameter,
          height: diameter,
          borderRadius: diameter / 2,
          borderWidth: ringWidth,
          borderColor: ring,
          alignItems: 'center',
          justifyContent: 'center',
        }}
        wrapperStyle={{
          position: 'absolute',
          left: overflowBubble.cx * size - diameter / 2,
          top: overflowBubble.cy * size - diameter / 2,
          width: diameter,
          height: diameter,
          zIndex: 0,
        }}
        textStyle={{
          color: OVERFLOW_TEXT_COLOR,
          fontSize: Math.max(fontSize._2xs, Math.round(diameter * 0.34)),
          fontWeight: '600',
        }}
        onPress={overflowOnPress}
      />
    );
  }

  return (
    <View style={[{ width: size, height: size }, style]} testID={testID}>
      {shown.map((item, index) => {
        const bubble = bubbles[index];
        if (!bubble) return null;
        const diameter = bubble.d * size;
        const inner = Math.max(1, diameter - ringWidth * 2);
        const wrapperStyle: ViewStyle = {
          position: 'absolute',
          left: bubble.cx * size - diameter / 2,
          top: bubble.cy * size - diameter / 2,
          width: diameter,
          height: diameter,
          // Primary (index 0) is largest and sits in front; later members tuck
          // behind in descending order (the "+N" chip lands lowest).
          zIndex: bubbleCount - index,
        };
        const cellStyle: ViewStyle = {
          width: diameter,
          height: diameter,
          borderRadius: diameter / 2,
          borderWidth: ringWidth,
          borderColor: ring,
          overflow: 'hidden',
          alignItems: 'center',
          justifyContent: 'center',
        };
        return (
          <AvatarGroupCell
            key={getItemKey(item, index)}
            item={item}
            index={index}
            innerSize={inner}
            variant={variant}
            showInitials={showInitials}
            cellStyle={cellStyle}
            wrapperStyle={wrapperStyle}
            onPressItem={onPressItem}
            hoverHandlers={hoverHandlers}
          />
        );
      })}
      {overflowElement}
    </View>
  );
};

function OverflowCircle({
  count,
  cellStyle,
  wrapperStyle,
  textStyle,
  onPress,
}: {
  count: number;
  cellStyle: StyleProp<ViewStyle>;
  wrapperStyle: StyleProp<ViewStyle>;
  textStyle: TextStyle;
  onPress?: () => void;
}) {
  const theme = useTheme();

  // A solid "+N" count circle: secondary-text-colored fill with white text,
  // matching the original Mention `ResponsiveAvatarStack` count circle. Layout
  // (margin for the facepile, absolute coords for the cluster) is supplied by
  // the caller via `wrapperStyle`.
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
