// Platform-neutral geometry of the chrome compositor (docs/design-system-ios.md, section b).
// Pure functions only: no React, no Skia, no DOM. Tested with `node --experimental-strip-types`.
//
// Coordinates are window dp (the chrome container is the whole window). A shape is an axis-aligned
// rounded rectangle; a circle is a rectangle with radius = half its side.

export type TShape = {
  id: string;
  // Explicit group: shapes with the same group always share one canvas.
  group: string;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  radius: number;
};

// Radius of fusion (dp). Two shapes of different groups whose gap is <= this join one canvas.
export const MERGE_RADIUS = 12;

// Smooth-min blend width used by the shader (dp). Equal to MERGE_RADIUS so that a gap of 0 fuses fully
// and a gap above it does not bridge.
export const SMOOTH_BLEND = MERGE_RADIUS;

// Axis-aligned distance between two shapes (0 when they overlap or touch).
export const shapeGap = (a: TShape, b: TShape): number => {
  const dx = Math.max(a.x0 - b.x1, b.x0 - a.x1, 0);
  const dy = Math.max(a.y0 - b.y1, b.y0 - a.y1, 0);
  return Math.hypot(dx, dy);
};

// Union-find grouping: shapes join when they share an explicit group, or when their gap is within
// `mergeRadius`. Returns the member indices of every component, in input order.
export const groupShapes = (shapes: readonly TShape[], mergeRadius: number = MERGE_RADIUS): number[][] => {
  const parent = shapes.map((_, index): number => index);
  const find = (index: number): number => {
    let root = index;
    while (parent[root] !== root) root = parent[root];
    parent[index] = root;
    return root;
  };
  const join = (a: number, b: number): void => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent[Math.max(ra, rb)] = Math.min(ra, rb);
  };
  for (let i = 0; i < shapes.length; i++) {
    for (let j = i + 1; j < shapes.length; j++) {
      const sameGroup = shapes[i].group === shapes[j].group;
      if (sameGroup || shapeGap(shapes[i], shapes[j]) <= mergeRadius) join(i, j);
    }
  }
  const components = new Map<number, number[]>();
  shapes.forEach((_, index): void => {
    const root = find(index);
    const list = components.get(root) ?? [];
    list.push(index);
    components.set(root, list);
  });
  return [...components.values()];
};

// Reference smooth-min (polynomial), the same formula as the shader. Used by the tests.
export const smoothMin = (a: number, b: number, k: number): number => {
  if (k <= 0) return Math.min(a, b);
  const h = Math.min(Math.max(0.5 + (0.5 * (b - a)) / k, 0), 1);
  return b * (1 - h) + a * h - k * h * (1 - h);
};

// Signed distance to a rounded rectangle (negative inside). Reference for the tests.
export const sdRoundRect = (px: number, py: number, s: TShape): number => {
  const cx = (s.x0 + s.x1) / 2;
  const cy = (s.y0 + s.y1) / 2;
  const hx = (s.x1 - s.x0) / 2 - s.radius;
  const hy = (s.y1 - s.y0) / 2 - s.radius;
  const qx = Math.abs(px - cx) - hx;
  const qy = Math.abs(py - cy) - hy;
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - s.radius;
};

// ---------------------------------------------------------------------------------------------
// Tab bar layout (compact class). Lengths in dp.
// ---------------------------------------------------------------------------------------------

export const TAB_BAR = {
  height: 64,
  // Gap between the tab capsule and the search circle at rest.
  restGap: 16,
  // Compact width: window minus 2 * 16 margin, at most 360.
  sideMargin: 16,
  maxWidth: 360,
  // Bottom offset from the window bottom (above the safe area).
  bottom: 24,
  // Create (FAB) circle, separate from the bar.
  fabSize: 56,
  fabGap: 16,
} as const;

export const tabBarWidth = (windowWidth: number): number =>
  Math.min(windowWidth - 2 * TAB_BAR.sideMargin, TAB_BAR.maxWidth);

// Search morph progress p in [0, 1] (0 = rest, 1 = search open).
//   capsule right edge grows by restGap, so the gap to the search circle goes to 0 (fusion);
//   the FAB shrinks away with p.
export const tabBarShapes = (windowWidth: number, windowHeight: number, bottomInset: number, p: number): TShape[] => {
  const width = tabBarWidth(windowWidth);
  const left = (windowWidth - width) / 2;
  const top = windowHeight - bottomInset - TAB_BAR.bottom - TAB_BAR.height;
  const h = TAB_BAR.height;
  const radius = h / 2;
  const capsuleRight = left + (width - h - TAB_BAR.restGap) + TAB_BAR.restGap * p;
  const circleLeft = left + width - h;
  const fabScale = Math.max(0, 1 - p);
  const fabRadius = (TAB_BAR.fabSize / 2) * fabScale;
  const fabCx = left + width - TAB_BAR.fabSize / 2;
  const fabCy = top - TAB_BAR.fabGap - TAB_BAR.fabSize / 2;
  return [
    { id: "tabs", group: "bar", x0: left, y0: top, x1: capsuleRight, y1: top + h, radius },
    { id: "search", group: "bar", x0: circleLeft, y0: top, x1: left + width, y1: top + h, radius },
    {
      id: "fab",
      group: "fab",
      x0: fabCx - fabRadius,
      y0: fabCy - fabRadius,
      x1: fabCx + fabRadius,
      y1: fabCy + fabRadius,
      radius: fabRadius,
    },
  ];
};

// Bounding box of a set of shapes.
export const boundsOf = (shapes: readonly TShape[]): { x: number; y: number; width: number; height: number } => {
  const x0 = Math.min(...shapes.map((s): number => s.x0));
  const y0 = Math.min(...shapes.map((s): number => s.y0));
  const x1 = Math.max(...shapes.map((s): number => s.x1));
  const y1 = Math.max(...shapes.map((s): number => s.y1));
  return { x: x0, y: y0, width: x1 - x0, height: y1 - y0 };
};

// Max shapes per canvas: the shader has a fixed uniform array.
export const MAX_SHADER_SHAPES = 8;

// Packs the shapes of one canvas into the uniform layout of the shader, relative to the canvas origin.
// boxes: x0, y0, x1, y1 per shape. radii: radius per shape (4-float stride for std140-style alignment).
export const packShapes = (
  shapes: readonly TShape[],
  origin: { x: number; y: number },
): { boxes: number[]; radii: number[]; count: number } => {
  if (shapes.length > MAX_SHADER_SHAPES) {
    throw new Error(`packShapes: ${shapes.length} shapes exceed ${MAX_SHADER_SHAPES}`);
  }
  const boxes = new Array<number>(MAX_SHADER_SHAPES * 4).fill(0);
  const radii = new Array<number>(MAX_SHADER_SHAPES * 4).fill(0);
  shapes.forEach((s, i): void => {
    boxes[i * 4] = s.x0 - origin.x;
    boxes[i * 4 + 1] = s.y0 - origin.y;
    boxes[i * 4 + 2] = s.x1 - origin.x;
    boxes[i * 4 + 3] = s.y1 - origin.y;
    radii[i * 4] = s.radius;
  });
  return { boxes, radii, count: shapes.length };
};
