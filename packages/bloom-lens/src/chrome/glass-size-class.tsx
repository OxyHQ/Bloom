// Adaptive navigation chrome by size class (window width, see sizeClassOf in surface-layer.ts):
//   compact:  a bottom capsule of tabs with the search circle at its right (phone portrait)
//   regular:  a top capsule of tabs across the width (from 480 dp)
//   expanded: a sidebar at the left with the tabs as rows (from 840 dp); the content is to its right
// It returns the nodes and the content box, so the page lays its content where the chrome leaves room.
// Geometry here; the material and motion are SurfaceNodes.
import type { ReactElement } from "react";

import { SurfaceNodes } from "./surface-nodes";
import { CHROME_METRICS, type TBox, type TNode, type TSizeClass, type TTabItem } from "./surface-layer";

const CIRCLE = CHROME_METRICS.circle;
const BAR = CHROME_METRICS.bar;
const MARGIN = CHROME_METRICS.margin;
const GAP = CHROME_METRICS.gap;
const SIDEBAR_WIDTH = 240;
const ROW_HEIGHT = 48;
const ROW_INSET = 4;
const INACTIVE = "#A1A1A6";
const ACCENT = "#0A84FF";

export type TAdaptiveChrome = {
  nodes: TNode[];
  // Where the page content goes (window dp).
  content: TBox;
};

// The chrome of one size class: the nodes and the content box. Exported for the layout check.
export const adaptiveChrome = (
  sizeClass: TSizeClass,
  box: TBox,
  insetBottom: number,
  items: readonly TTabItem[],
  selected: number,
): TAdaptiveChrome => {
  const n = items.length;

  if (sizeClass === "compact") {
    const y = box.y + box.height - insetBottom - MARGIN - CIRCLE;
    const searchX = box.x + box.width - MARGIN - CIRCLE;
    const capsuleLeft = box.x + MARGIN;
    const capsuleRight = searchX - GAP;
    const tabW = (capsuleRight - capsuleLeft - 2 * ROW_INSET) / n;
    const nodes: TNode[] = [
      { id: "tabs", kind: "glass", x: capsuleLeft, y, w: capsuleRight - capsuleLeft, h: CIRCLE, r: CIRCLE / 2 },
      { id: "selection", kind: "selection", x: capsuleLeft + ROW_INSET + selected * tabW, y: y + ROW_INSET, w: tabW, h: CIRCLE - 2 * ROW_INSET, r: (CIRCLE - 2 * ROW_INSET) / 2, pressable: false },
    ];
    items.forEach((item, index): void => {
      nodes.push({
        id: `tab-${index}`,
        kind: "label",
        x: capsuleLeft + ROW_INSET + index * tabW,
        y,
        w: tabW,
        h: CIRCLE,
        r: 0,
        icon: item.icon,
        text: item.label,
        textSize: 13,
        color: index === selected ? ACCENT : INACTIVE,
      });
    });
    nodes.push({ id: "search", kind: "glass", x: searchX, y, w: CIRCLE, h: CIRCLE, r: CIRCLE / 2, icon: "search", textSize: 24 });
    const contentBottom = y - MARGIN;
    return {
      nodes,
      content: { x: box.x + MARGIN, y: box.y, width: box.width - 2 * MARGIN, height: contentBottom - box.y },
    };
  }

  if (sizeClass === "regular") {
    const y = box.y;
    const left = box.x + MARGIN;
    const right = box.x + box.width - MARGIN;
    const tabW = (right - left - 2 * ROW_INSET) / n;
    const nodes: TNode[] = [
      { id: "tabs", kind: "glass", x: left, y, w: right - left, h: BAR + 8, r: (BAR + 8) / 2 },
      { id: "selection", kind: "selection", x: left + ROW_INSET + selected * tabW, y: y + ROW_INSET, w: tabW, h: BAR, r: BAR / 2, pressable: false },
    ];
    items.forEach((item, index): void => {
      nodes.push({
        id: `tab-${index}`,
        kind: "label",
        x: left + ROW_INSET + index * tabW,
        y,
        w: tabW,
        h: BAR + 8,
        r: 0,
        icon: item.icon,
        text: item.label,
        textSize: 14,
        color: index === selected ? "#FFFFFF" : INACTIVE,
      });
    });
    const top = y + BAR + 8 + GAP * 2;
    return { nodes, content: { x: box.x + MARGIN, y: top, width: box.width - 2 * MARGIN, height: box.y + box.height - top } };
  }

  // expanded: a sidebar with one row per tab.
  const sidebarHeight = Math.max(box.height - MARGIN, 0);
  const y = box.y;
  const x = box.x + MARGIN;
  const nodes: TNode[] = [
    { id: "sidebar", kind: "glass", x, y, w: SIDEBAR_WIDTH, h: sidebarHeight, r: 28 },
    { id: "selection", kind: "selection", x: x + ROW_INSET, y: y + 16 + selected * ROW_HEIGHT, w: SIDEBAR_WIDTH - 2 * ROW_INSET, h: ROW_HEIGHT, r: ROW_HEIGHT / 2, pressable: false },
  ];
  items.forEach((item, index): void => {
    nodes.push({
      id: `tab-${index}`,
      kind: "label",
      x: x + ROW_INSET,
      y: y + 16 + index * ROW_HEIGHT,
      w: SIDEBAR_WIDTH - 2 * ROW_INSET,
      h: ROW_HEIGHT,
      r: 0,
      icon: item.icon,
      text: item.label,
      textSize: 17,
      color: index === selected ? "#FFFFFF" : INACTIVE,
    });
  });
  const contentLeft = x + SIDEBAR_WIDTH + MARGIN;
  return { nodes, content: { x: contentLeft, y, width: box.x + box.width - MARGIN - contentLeft, height: box.height - MARGIN } };
};

export type TGlassSizeChromeProps = {
  sizeClass: TSizeClass;
  box: TBox;
  insetBottom: number;
  items: readonly TTabItem[];
  selected: number;
  onSelect: (index: number) => void;
  onSearch?: () => void;
};

// Renders the chrome. The page places its content with adaptiveChrome(...).content.
const GlassSizeChrome = ({ sizeClass, box, insetBottom, items, selected, onSelect, onSearch }: TGlassSizeChromeProps): ReactElement => {
  const { nodes } = adaptiveChrome(sizeClass, box, insetBottom, items, selected);
  return (
    <SurfaceNodes
      nodes={nodes}
      onNodePress={(id): void => {
        if (id === "search") onSearch?.();
        else if (id.startsWith("tab-")) onSelect(Number(id.slice("tab-".length)));
      }}
    />
  );
};

export { GlassSizeChrome };
