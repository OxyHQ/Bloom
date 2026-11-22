import { type ReactElement, type ReactNode, useState } from 'react';
import { type LayoutChangeEvent, StyleSheet, View, type ViewStyle } from 'react-native';
import { EdgeScrim, SCRIM_TAIL_RATIO } from '@oxy.so/bloom/page-header';
import { useSurfaceFill } from '@oxy.so/bloom/styles';

import type { Child, Modifier, Node } from '../node';
import { type InsetEdge, resolveSpace } from '../tokens';

type Inset = Extract<Modifier, { kind: 'safeAreaInset' }>;

/** The room a scroll's content makes for what is pinned at its edges, in points. */
export interface InsetRoom {
  readonly top: number;
  readonly bottom: number;
}

/** A scroll's `safeAreaInset`s and `safeAreaBar`s, in the order chained. */
export function insetsOf(node: Node): readonly Inset[] {
  return node.modifiers.filter((modifier): modifier is Inset => modifier.kind === 'safeAreaInset');
}

/**
 * The content container's style with the room added at its top and bottom,
 * over the padding it already has there (its `contentMargins`).
 */
export function withRoom(
  style: ViewStyle | undefined,
  room: InsetRoom | undefined,
): ViewStyle | undefined {
  if (room === undefined || (room.top === 0 && room.bottom === 0)) return style;
  const pad = (edge: 'Top' | 'Bottom') =>
    Number(style?.[`padding${edge}`] ?? style?.paddingVertical ?? style?.padding ?? 0);
  return {
    ...style,
    paddingTop: pad('Top') + room.top,
    paddingBottom: pad('Bottom') + room.bottom,
  };
}

/**
 * A scroll with views pinned at its edges (SwiftUI's `safeAreaInset` and
 * `safeAreaBar`): each pinned view is measured, the scroll's content gets
 * that much room (and its spacing) at the edge, so it scrolls clear of it,
 * and a bar has Bloom's scroll edge scrim under it. Insets at one edge stack
 * outward in the order chained. One mechanism on every platform: an absolute
 * view in a box the scroll fills, its height from its own layout.
 */
export function SafeAreaInsets({
  insets,
  render,
  scroller,
}: {
  insets: readonly Inset[];
  render: (child: Child) => ReactNode;
  scroller: (room: InsetRoom) => ReactElement;
}) {
  const [heights, setHeights] = useState<readonly number[]>(() => insets.map(() => 0));
  const fill = useSurfaceFill();
  const measure = (index: number) => (event: LayoutChangeEvent) => {
    const height = event.nativeEvent.layout.height;
    setHeights((last) =>
      last[index] === height ? last : last.map((h, i) => (i === index ? height : h)),
    );
  };
  const room = { top: 0, bottom: 0 };
  const pinned: ReactNode[] = [];
  insets.forEach((inset, index) => {
    const at = room[inset.edge];
    const height = heights[index] ?? 0;
    room[inset.edge] =
      at + height + (inset.spacing === undefined ? 0 : resolveSpace(inset.spacing));
    if (inset.bar && height > 0)
      pinned.push(
        <View
          key={`s${index}`}
          pointerEvents="none"
          style={[
            styles.pinned,
            edgeAt(inset.edge, at),
            { height: height * (1 + SCRIM_TAIL_RATIO) },
          ]}
        >
          <EdgeScrim color={fill} edge={inset.edge} opaqueFraction={1 / (1 + SCRIM_TAIL_RATIO)} />
        </View>,
      );
    pinned.push(
      <View
        key={`v${index}`}
        style={[styles.pinned, edgeAt(inset.edge, at)]}
        onLayout={measure(index)}
      >
        {render(inset.content)}
      </View>,
    );
  });
  return (
    <View style={styles.box}>
      {scroller(room)}
      {pinned}
    </View>
  );
}

function edgeAt(edge: InsetEdge, at: number): ViewStyle {
  return edge === 'top' ? { top: at } : { bottom: at };
}

const styles = StyleSheet.create({
  box: { flex: 1 },
  pinned: { position: 'absolute', left: 0, right: 0 },
});
