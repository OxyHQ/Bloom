import type { ClusterBubble } from './cluster-layout';

/** The compact chat identity: diagonal pair, triangle, then four faces in a square. */
export function computeConversationLayout(
  count: number,
  size: number,
  ring: number,
): ClusterBubble[] {
  if (count <= 0) return [];
  if (count === 1) return [{ cx: 0.5, cy: 0.5, d: 1 }];
  const positions =
    count === 2
      ? [
          [0, 0],
          [1, 1],
        ]
      : count === 3
        ? [
            [0.5, 0],
            [0, 1],
            [1, 1],
          ]
        : [
            [0, 0],
            [1, 0],
            [0, 1],
            [1, 1],
          ];
  const ratio = count === 2 ? 0.62 : count === 3 ? 0.55 : 0.48;
  const diameter = Math.min(size, Math.round(size * ratio) + ring * 2);
  const free = Math.max(0, size - diameter);
  return positions.map(([x = 0, y = 0]) => ({
    cx: (Math.round(free * x) + diameter / 2) / size,
    cy: (Math.round(free * y) + diameter / 2) / size,
    d: diameter / size,
  }));
}
