// Bottom toolbar with a central pill (the WWDC25 pattern): a circular filter button at the left, the central glass
// pill with a text, and a circular search button at the right. Geometry here; the material and motion are SurfaceNodes.
import type { ReactElement } from "react";

import { SurfaceNodes } from "./surface-nodes";
import { CHROME_METRICS, type TBox, type TNode } from "./surface-layer";

const CIRCLE = CHROME_METRICS.circle;

export type TGlassToolbarProps = {
  box: TBox;
  insetBottom: number;
  // Text of the central pill.
  title: string;
  onFilter: () => void;
  onPress: () => void;
  onSearch: () => void;
};

// The toolbar nodes for a box (exported so the layout can be checked without a render).
export const toolbarNodes = (box: TBox, insetBottom: number, title: string): TNode[] => {
  const margin = CHROME_METRICS.margin;
  const gap = CHROME_METRICS.gap;
  const y = box.y + box.height - insetBottom - margin - CIRCLE;
  const pillLeft = box.x + margin + CIRCLE + gap;
  const pillRight = box.x + box.width - margin - CIRCLE - gap;
  return [
    { id: "filter", kind: "glass", x: box.x + margin, y, w: CIRCLE, h: CIRCLE, r: CIRCLE / 2, icon: "options", textSize: 22 },
    { id: "pill", kind: "glass", x: pillLeft, y, w: pillRight - pillLeft, h: CIRCLE, r: CIRCLE / 2, text: title, textSize: 17 },
    { id: "search", kind: "glass", x: box.x + box.width - margin - CIRCLE, y, w: CIRCLE, h: CIRCLE, r: CIRCLE / 2, icon: "search", textSize: 24 },
  ];
};

const GlassToolbar = ({ box, insetBottom, title, onFilter, onPress, onSearch }: TGlassToolbarProps): ReactElement => (
  <SurfaceNodes
    nodes={toolbarNodes(box, insetBottom, title)}
    onNodePress={(id): void => {
      if (id === "filter") onFilter();
      else if (id === "pill") onPress();
      else if (id === "search") onSearch();
    }}
  />
);

export { GlassToolbar };
