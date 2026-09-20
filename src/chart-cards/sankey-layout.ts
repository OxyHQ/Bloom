/**
 * recharts 3.10's `Sankey` layout (`chart/Sankey.js#computeData` + the link
 * and node props it builds), as pure TypeScript with no d3 — so
 * `SankeyChartCard` lands on the same pixels recharts draws.
 *
 *   depth       longest path from a source; with `align: 'justify'` every
 *               sink moves to the last column; x = depth × (width − nodeWidth) / maxDepth
 *   height      one `yRatio` for every column: the tightest
 *               (height − (n − 1) × nodePadding) / Σvalue
 *   y           `verticalAlign: 'justify'`: seeded with the node's index in its
 *               column, pushed apart (`resolveCollisions`), then `iterations`
 *               relaxation passes right→left and left→right with α ×= 0.99
 *   links       stacked on each node in the order of the node at the other end
 *               (`updateYOfLinks`), drawn as a cubic from the source's right
 *               edge to the target's left edge with control x at
 *               `linkCurvature` / `1 − linkCurvature` of the way
 */

export interface SankeyLayoutLink {
  source: number;
  target: number;
  value: number;
}

export interface SankeyLayoutOptions {
  width: number;
  height: number;
  /** recharts `margin` — the layout runs inside it. */
  margin?: { top?: number; right?: number; bottom?: number; left?: number };
  nodeWidth?: number;
  nodePadding?: number;
  linkCurvature?: number;
  iterations?: number;
  /** Re-sort each column by y while resolving collisions (recharts `sort`, default `true`). */
  sort?: boolean;
  align?: 'justify' | 'left';
  verticalAlign?: 'justify' | 'top';
}

/** A laid-out node, in surface pixels (margin included). */
export interface SankeyNodeBox {
  index: number;
  x: number;
  y: number;
  width: number;
  height: number;
  depth: number;
  value: number;
}

/** A laid-out link: a cubic from (sourceX, sourceY) to (targetX, targetY), `width` thick. */
export interface SankeyLinkPath {
  index: number;
  source: number;
  target: number;
  value: number;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  sourceControlX: number;
  targetControlX: number;
  width: number;
}

export interface SankeyLayout {
  nodes: SankeyNodeBox[];
  links: SankeyLinkPath[];
}

interface TreeNode {
  index: number;
  sourceNodes: number[];
  sourceLinks: number[];
  targetNodes: number[];
  targetLinks: number[];
  value: number;
  depth: number;
  x: number;
  dx: number;
  y: number;
  dy: number;
}

interface WorkLink extends SankeyLayoutLink {
  dy: number;
  sy: number;
  ty: number;
}

const valueOf = (link: { value: number } | undefined) => (link && link.value) || 0;
const centerY = (node: TreeNode) => node.y + node.dy / 2;
const sumOf = (links: readonly { value: number }[], ids: readonly number[]) =>
  ids.reduce((sum, id) => sum + valueOf(links[id]), 0);

function cubicValue(start: number, c1: number, c2: number, end: number, t: number): number {
  const u = 1 - t;
  return u ** 3 * start + 3 * u ** 2 * t * c1 + 3 * u * t ** 2 * c2 + t ** 3 * end;
}

function buildTree(
  nodeCount: number,
  links: readonly SankeyLayoutLink[],
  width: number,
  nodeWidth: number,
  align: 'justify' | 'left',
): TreeNode[] {
  const tree: TreeNode[] = Array.from({ length: nodeCount }, (_, index) => {
    const sourceNodes: number[] = [];
    const sourceLinks: number[] = [];
    const targetNodes: number[] = [];
    const targetLinks: number[] = [];
    links.forEach((link, i) => {
      if (link.source === index) {
        targetNodes.push(link.target);
        targetLinks.push(i);
      }
      if (link.target === index) {
        sourceNodes.push(link.source);
        sourceLinks.push(i);
      }
    });
    return {
      index,
      sourceNodes,
      sourceLinks,
      targetNodes,
      targetLinks,
      value: Math.max(sumOf(links, sourceLinks), sumOf(links, targetLinks)),
      depth: 0,
      x: 0,
      dx: 0,
      y: 0,
      dy: 0,
    };
  });

  const deepen = (node: TreeNode, guard: number) => {
    if (guard > nodeCount) return; // a cycle — recharts would recurse forever
    for (const t of node.targetNodes) {
      const target = tree[t];
      if (target && node.depth + 1 > target.depth) {
        target.depth = node.depth + 1;
        deepen(target, guard + 1);
      }
    }
  };
  for (const node of tree) if (!node.sourceNodes.length) deepen(node, 0);

  const maxDepth = tree.reduce((max, n) => Math.max(max, n.depth), 0);
  if (maxDepth >= 1) {
    const childWidth = (width - nodeWidth) / maxDepth;
    for (const node of tree) {
      if (!node.targetNodes.length && align === 'justify') node.depth = maxDepth;
      node.x = node.depth * childWidth;
      node.dx = nodeWidth;
    }
  }
  return tree;
}

function resolveCollisions(columns: TreeNode[][], height: number, padding: number, sort: boolean) {
  for (const nodes of columns) {
    if (!nodes) continue;
    if (sort) nodes.sort((a, b) => a.y - b.y);
    let y0 = 0;
    for (const node of nodes) {
      const dy = y0 - node.y;
      if (dy > 0) node.y += dy;
      y0 = node.y + node.dy + padding;
    }
    y0 = height + padding;
    for (let j = nodes.length - 1; j >= 0; j--) {
      const node = nodes[j]!;
      const dy = node.y + node.dy + padding - y0;
      if (dy > 0) {
        node.y -= dy;
        y0 = node.y;
      } else {
        break;
      }
    }
  }
}

function relax(tree: TreeNode[], columns: TreeNode[][], links: WorkLink[], alpha: number, rightToLeft: boolean) {
  const order = rightToLeft ? [...columns].reverse() : columns;
  for (const nodes of order) {
    if (!nodes) continue;
    for (const node of nodes) {
      const ids = rightToLeft ? node.targetLinks : node.sourceLinks;
      if (!ids.length) continue;
      const sum = sumOf(links, ids);
      const weighted = ids.reduce((acc, id) => {
        const link = links[id];
        const other = link ? tree[rightToLeft ? link.target : link.source] : undefined;
        return other ? acc + centerY(other) * valueOf(link) : acc;
      }, 0);
      const y = sum === 0 ? centerY(node) : weighted / sum;
      node.y += (y - centerY(node)) * alpha;
    }
  }
}

function stackLinks(tree: TreeNode[], links: WorkLink[]) {
  for (const node of tree) {
    node.targetLinks.sort((a, b) => (tree[links[a]!.target]?.y ?? 0) - (tree[links[b]!.target]?.y ?? 0));
    node.sourceLinks.sort((a, b) => (tree[links[a]!.source]?.y ?? 0) - (tree[links[b]!.source]?.y ?? 0));
    let sy = 0;
    for (const id of node.targetLinks) {
      const link = links[id]!;
      link.sy = sy;
      sy += link.dy;
    }
    let ty = 0;
    for (const id of node.sourceLinks) {
      const link = links[id]!;
      link.ty = ty;
      ty += link.dy;
    }
  }
}

/** recharts `resolveNodeLinkCollisions`: keeps a node off a link that skips its column. */
function resolveNodeLinkCollisions(tree: TreeNode[], columns: TreeNode[][], links: WorkLink[], height: number, padding: number) {
  const depthOf = new Map<TreeNode, number>();
  columns.forEach((nodes, depth) => nodes?.forEach((n) => depthOf.set(n, depth)));
  for (let depth = 0; depth < columns.length; depth++) {
    const nodes = columns[depth];
    if (!nodes || nodes.length === 0) continue;
    const depthX = nodes[0]!.x + nodes[0]!.dx / 2;
    const obstacles = links.flatMap((link) => {
      const s = tree[link.source];
      const t = tree[link.target];
      if (!s || !t) return [];
      const sd = depthOf.get(s);
      const td = depthOf.get(t);
      if (sd === undefined || td === undefined) return [];
      if (depth <= Math.min(sd, td) || depth >= Math.max(sd, td)) return [];
      const sourceX = s.x + s.dx;
      const targetX = t.x;
      const progress = targetX === sourceX ? 0 : (depthX - sourceX) / (targetX - sourceX);
      const p = Math.min(Math.max(progress, 0), 1);
      const y0 = s.y + link.sy + link.dy / 2;
      const y1 = t.y + link.ty + link.dy / 2;
      return [{ y: cubicValue(y0, y0, y1, y1, p) - link.dy / 2, dy: link.dy }];
    });
    const contained = obstacles.filter((o) => nodes.some((n) => n.y >= o.y && n.y + n.dy <= o.y + o.dy));
    if (contained.length === 0) continue;
    type Item = { fixed: true; y: number; dy: number } | { fixed: false; node: TreeNode };
    const itemY = (i: Item) => (i.fixed ? i.y : i.node.y);
    let items: Item[] = [
      ...nodes.map((node) => ({ fixed: false as const, node })),
      ...contained.map((o) => ({ fixed: true as const, ...o })),
    ].sort((a, b) => itemY(a) - itemY(b));
    let nextY = 0;
    for (const item of items) {
      if (item.fixed) {
        nextY = Math.max(nextY, item.y + item.dy + padding);
        continue;
      }
      if (item.node.y < nextY) item.node.y = nextY;
      nextY = item.node.y + item.node.dy + padding;
    }
    items = items.sort((a, b) => itemY(a) - itemY(b));
    let previousY = height + padding;
    for (let i = items.length - 1; i >= 0; i--) {
      const item = items[i]!;
      if (item.fixed) {
        previousY = Math.min(previousY, item.y - padding);
        continue;
      }
      const dy = item.node.y + item.node.dy + padding - previousY;
      if (dy > 0) item.node.y -= dy;
      previousY = item.node.y;
    }
  }
}

/**
 * Lay out a sankey exactly as recharts does. Defaults are recharts' own
 * (`nodeWidth` 10, `nodePadding` 10, `linkCurvature` 0.5, 32 iterations,
 * margin 5); `SankeyChartCard` passes its own values.
 */
export function layoutSankey(
  nodeCount: number,
  links: readonly SankeyLayoutLink[],
  {
    width,
    height,
    margin = { top: 5, right: 5, bottom: 5, left: 5 },
    nodeWidth = 10,
    nodePadding = 10,
    linkCurvature = 0.5,
    iterations = 32,
    sort = true,
    align = 'justify',
    verticalAlign = 'justify',
  }: SankeyLayoutOptions,
): SankeyLayout {
  const top = margin.top ?? 0;
  const left = margin.left ?? 0;
  const contentWidth = width - left - (margin.right ?? 0);
  const contentHeight = height - top - (margin.bottom ?? 0);
  if (nodeCount === 0 || width <= 0 || height <= 0) return { nodes: [], links: [] };

  // Links that name a node outside the list are dropped, as recharts' guards do.
  const valid = links.filter((l) => l.source >= 0 && l.source < nodeCount && l.target >= 0 && l.target < nodeCount);
  const tree = buildTree(nodeCount, valid, contentWidth, nodeWidth, align);
  const columns: TreeNode[][] = [];
  for (const node of tree) (columns[node.depth] ??= []).push(node);

  let yRatio = Math.min(
    ...columns.map((nodes) => {
      const value = (nodes ?? []).reduce((s, n) => s + n.value, 0);
      return value === 0 ? Infinity : (contentHeight - ((nodes?.length ?? 0) - 1) * nodePadding) / value;
    }),
  );
  if (yRatio === Infinity) yRatio = 0;
  for (const nodes of columns) {
    if (!nodes) continue;
    let currentY = 0;
    nodes.forEach((node, i) => {
      node.dy = node.value * yRatio;
      if (verticalAlign === 'top') {
        node.y = currentY;
        currentY += node.dy + nodePadding;
      } else {
        node.y = i;
      }
    });
  }
  const work: WorkLink[] = valid.map((l) => ({ ...l, dy: valueOf(l) * yRatio, sy: 0, ty: 0 }));

  resolveCollisions(columns, contentHeight, nodePadding, sort);
  if (verticalAlign === 'justify') {
    let alpha = 1;
    for (let i = 1; i <= iterations; i++) {
      relax(tree, columns, work, (alpha *= 0.99), true);
      resolveCollisions(columns, contentHeight, nodePadding, sort);
      relax(tree, columns, work, alpha, false);
      resolveCollisions(columns, contentHeight, nodePadding, sort);
    }
  }
  stackLinks(tree, work);
  resolveNodeLinkCollisions(tree, columns, work, contentHeight, nodePadding);
  stackLinks(tree, work);

  const nodes: SankeyNodeBox[] = tree.map((n) => ({
    index: n.index,
    x: n.x + left,
    y: n.y + top,
    width: n.dx,
    height: n.dy,
    depth: n.depth,
    value: n.value,
  }));
  const paths: SankeyLinkPath[] = work.map((link, index) => {
    const s = tree[link.source]!;
    const t = tree[link.target]!;
    const sourceX = s.x + s.dx + left;
    const targetX = t.x + left;
    return {
      index,
      source: link.source,
      target: link.target,
      value: link.value,
      sourceX,
      targetX,
      sourceY: s.y + link.sy + link.dy / 2 + top,
      targetY: t.y + link.ty + link.dy / 2 + top,
      sourceControlX: sourceX + (targetX - sourceX) * linkCurvature,
      targetControlX: sourceX + (targetX - sourceX) * (1 - linkCurvature),
      width: link.dy,
    };
  });
  return { nodes, links: paths };
}

/** The ribbon's centre line as an SVG path. */
export function sankeyLinkPath(link: SankeyLinkPath): string {
  return `M${link.sourceX},${link.sourceY} C${link.sourceControlX},${link.sourceY} ${link.targetControlX},${link.targetY} ${link.targetX},${link.targetY}`;
}

/** A closed band: unlike a thick stroke it cannot bulge past the node edges. */
export function sankeyRibbonPath(link: SankeyLinkPath): string {
  const half = Math.max(1, link.width) / 2;
  return `M${link.sourceX},${link.sourceY - half} C${link.sourceControlX},${link.sourceY - half} ${link.targetControlX},${link.targetY - half} ${link.targetX},${link.targetY - half} L${link.targetX},${link.targetY + half} C${link.targetControlX},${link.targetY + half} ${link.sourceControlX},${link.sourceY + half} ${link.sourceX},${link.sourceY + half} Z`;
}

/**
 * The node outline: rounded (radius ≤ 5) only on its outward side, so a
 * ribbon meets a square edge. Sources round on the left, sinks on the right.
 */
export function sankeyNodePath(x: number, y: number, w: number, h: number, roundLeft: boolean, roundRight: boolean): string {
  const r = Math.min(5, w, h / 2);
  const rl = roundLeft ? r : 0;
  const rr = roundRight ? r : 0;
  return [
    `M${x + rl},${y}`,
    `H${x + w - rr}`,
    rr ? `A${rr},${rr} 0 0 1 ${x + w},${y + rr}` : '',
    `V${y + h - rr}`,
    rr ? `A${rr},${rr} 0 0 1 ${x + w - rr},${y + h}` : '',
    `H${x + rl}`,
    rl ? `A${rl},${rl} 0 0 1 ${x},${y + h - rl}` : '',
    `V${y + rl}`,
    rl ? `A${rl},${rl} 0 0 1 ${x + rl},${y}` : '',
    'Z',
  ].join(' ');
}

/**
 * What the pointer is over: a node (drawn on top) first, then the topmost
 * link whose filled ribbon contains the point. Its two cubic edges are vertical
 * translations of the centre line, so test the vertical half-width, not the
 * perpendicular stroke width (which incorrectly includes steep-curve bulges).
 */
export function hitTestSankey(
  layout: SankeyLayout,
  px: number,
  py: number,
  bandWidthOf: (link: SankeyLinkPath) => number = (l) => Math.max(1, l.width),
): { type: 'node' | 'link'; index: number } | null {
  for (let i = layout.nodes.length - 1; i >= 0; i--) {
    const n = layout.nodes[i]!;
    if (px >= n.x && px <= n.x + n.width && py >= n.y && py <= n.y + n.height) return { type: 'node', index: n.index };
  }
  for (let i = layout.links.length - 1; i >= 0; i--) {
    const l = layout.links[i]!;
    if (px < l.sourceX || px > l.targetX || l.targetX === l.sourceX) continue;
    // x(t) is monotonic (both control points sit between the ends): bisect for t.
    let lo = 0;
    let hi = 1;
    for (let k = 0; k < 24; k++) {
      const mid = (lo + hi) / 2;
      if (cubicValue(l.sourceX, l.sourceControlX, l.targetControlX, l.targetX, mid) < px) lo = mid;
      else hi = mid;
    }
    const t = (lo + hi) / 2;
    const y = cubicValue(l.sourceY, l.sourceY, l.targetY, l.targetY, t);
    if (Math.abs(py - y) <= bandWidthOf(l) / 2) return { type: 'link', index: l.index };
  }
  return null;
}

/** Pack one column's full labels around node centres without overlap. */
export function placeSankeyLabels(
  labels: readonly { index: number; center: number; height: number }[],
  height: number,
  gap = 8,
): Record<number, number> {
  const ordered = [...labels].sort((a, b) => a.center - b.center);
  const tops: Record<number, number> = {};
  let next = 0;
  for (const label of ordered) {
    tops[label.index] = Math.max(next, label.center - label.height / 2);
    next = tops[label.index]! + label.height + gap;
  }
  let bottom = height;
  for (let index = ordered.length - 1; index >= 0; index--) {
    const label = ordered[index]!;
    tops[label.index] = Math.min(tops[label.index]!, bottom - label.height);
    bottom = tops[label.index]! - gap;
  }
  return tops;
}
