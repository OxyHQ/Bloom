// Headers in four variants, one component:
//   large:     a large title on the page, with circular glass actions at the top right (search, more)
//   compact:   a circular back button and a capsule with the title centred on it
//   actions:   compact, with two circular actions at the right (share, more)
//   segmented: a glass capsule split in segments with the selection pill (refractive) over the chosen one
// The title text of "large" and the segmented caption sit on the page (outside the glass); the rest is glass nodes.
import { useState, type ReactElement } from "react";
import { StyleSheet, Text, View } from "react-native";

import { SurfaceNodes } from "./surface-nodes";
import { CHROME_METRICS, type TBox, type TNode } from "./surface-layer";

const CIRCLE = CHROME_METRICS.circle;
const BAR = CHROME_METRICS.bar;
const GAP = CHROME_METRICS.gap;
const MARGIN = CHROME_METRICS.margin;
const SEGMENT_HEIGHT = 44;
const SEGMENT_INSET = 4;
const INACTIVE = "#A1A1A6";

export type THeaderVariant = "large" | "compact" | "actions" | "segmented";

export type TGlassHeaderProps = {
  variant: THeaderVariant;
  box: TBox;
  title: string;
  // segmented only
  segments?: readonly string[];
  // Controlled segment index; when omitted the header keeps its own.
  segment?: number;
  onSegment?: (index: number) => void;
  onBack?: () => void;
  onAction?: (id: string) => void;
};

// Top row of the glass (the circles and the capsule centre on it). `box` already starts below the status bar.
const rowTop = (box: TBox): number => box.y + 8;

// Nodes of one variant.
export const headerNodes = (
  variant: THeaderVariant,
  box: TBox,
  title: string,
  segments: readonly string[],
  segment: number,
): TNode[] => {
  const top = rowTop(box);
  const left = box.x + MARGIN;
  const right = box.x + box.width - MARGIN;
  const capsuleY = top + (CIRCLE - BAR) / 2;

  if (variant === "large") {
    const more = { id: "more", kind: "glass" as const, x: right - CIRCLE - GAP - CIRCLE, y: top, w: CIRCLE, h: CIRCLE, r: CIRCLE / 2, icon: "ellipsis-horizontal", textSize: 24 };
    const search = { id: "search", kind: "glass" as const, x: right - CIRCLE, y: top, w: CIRCLE, h: CIRCLE, r: CIRCLE / 2, icon: "search", textSize: 24 };
    return [more, search];
  }

  if (variant === "segmented") {
    // The caption (outside the glass) sits in the first 22 dp of the row; the capsule below it.
    const y = top + 28;
    const x = left;
    const w = right - left;
    const segW = w / segments.length;
    const nodes: TNode[] = [{ id: "capsule", kind: "glass", x, y, w, h: SEGMENT_HEIGHT, r: SEGMENT_HEIGHT / 2 }];
    nodes.push({
      id: "selection",
      kind: "selection",
      x: x + SEGMENT_INSET + segment * segW,
      y: y + SEGMENT_INSET,
      w: segW - 2 * SEGMENT_INSET,
      h: SEGMENT_HEIGHT - 2 * SEGMENT_INSET,
      r: (SEGMENT_HEIGHT - 2 * SEGMENT_INSET) / 2,
      pressable: false,
    });
    segments.forEach((label, index): void => {
      nodes.push({
        id: `segment-${index}`,
        kind: "label",
        x: x + index * segW,
        y,
        w: segW,
        h: SEGMENT_HEIGHT,
        r: 0,
        text: label,
        textSize: 15,
        color: index === segment ? "#FFFFFF" : INACTIVE,
      });
    });
    return nodes;
  }

  // compact and actions: the back circle at the left, the capsule with the title, and (actions) the two circles at the right.
  const nodes: TNode[] = [{ id: "back", kind: "glass", x: left, y: top, w: CIRCLE, h: CIRCLE, r: CIRCLE / 2, icon: "chevron-back", textSize: 24 }];
  const actionsWidth = variant === "actions" ? 2 * CIRCLE + GAP : 0;
  const capsuleLeft = left + CIRCLE + GAP;
  const capsuleRight = right - actionsWidth - (variant === "actions" ? GAP : 0);
  nodes.push({ id: "capsule", kind: "glass", x: capsuleLeft, y: capsuleY, w: capsuleRight - capsuleLeft, h: BAR, r: BAR / 2, text: title, textSize: 17 });
  if (variant === "actions") {
    nodes.push({ id: "share", kind: "glass", x: right - 2 * CIRCLE - GAP, y: top, w: CIRCLE, h: CIRCLE, r: CIRCLE / 2, icon: "share-outline", textSize: 22 });
    nodes.push({ id: "more", kind: "glass", x: right - CIRCLE, y: top, w: CIRCLE, h: CIRCLE, r: CIRCLE / 2, icon: "ellipsis-horizontal", textSize: 24 });
  }
  return nodes;
};

const GlassHeader = ({
  variant,
  box,
  title,
  segments = [],
  segment,
  onSegment,
  onBack,
  onAction,
}: TGlassHeaderProps): ReactElement => {
  const [ownSegment, setOwnSegment] = useState(0);
  const current = segment ?? ownSegment;
  const top = rowTop(box);

  const nodes = headerNodes(variant, box, title, segments, current);

  return (
    <>
      {variant === "large" ? (
        <View pointerEvents="none" style={[styles.large, { top: top + CIRCLE + 12, left: box.x + MARGIN, right: MARGIN }]}>
          <Text style={styles.largeTitle}>{title}</Text>
        </View>
      ) : null}
      {variant === "segmented" ? (
        <View pointerEvents="none" style={[styles.caption, { top, left: box.x + MARGIN }]}>
          <Text style={styles.captionText}>{title}</Text>
        </View>
      ) : null}
      <SurfaceNodes
        nodes={nodes}
        onNodePress={(id): void => {
          if (id === "back") onBack?.();
          else if (id.startsWith("segment-")) {
            const index = Number(id.slice("segment-".length));
            if (segment === undefined) setOwnSegment(index);
            onSegment?.(index);
          } else onAction?.(id);
        }}
      />
    </>
  );
};

const styles = StyleSheet.create({
  large: { position: "absolute" },
  largeTitle: { color: "#FFFFFF", fontSize: 34, fontWeight: "700" },
  caption: { position: "absolute" },
  captionText: { color: INACTIVE, fontSize: 13, fontWeight: "600", textTransform: "uppercase" },
});

export { GlassHeader };
