/** Independently authored semantic silhouettes in a neutral, upright coordinate frame.
 * Geometry is evaluated from primitives, polar curves and cubic Beziers; no source paths.
 */
const TAU = Math.PI * 2;
const polar = (radius, count = 128) =>
  Array.from({ length: count }, (_, i) => {
    const angle = (TAU * i) / count;
    const r = radius(angle);
    return [r * Math.cos(angle), r * Math.sin(angle)];
  });
const polygon = (sides, inner = 1) =>
  Array.from({ length: sides * (inner === 1 ? 1 : 2) }, (_, i) => {
    const angle = Math.PI / 2 + (TAU * i) / (sides * (inner === 1 ? 1 : 2));
    const radius = i % 2 && inner !== 1 ? inner : 1;
    return [radius * Math.cos(angle), radius * Math.sin(angle)];
  });
function soften(points, iterations = 2) {
  for (let pass = 0; pass < iterations; pass++)
    points = points.flatMap((a, i) => {
      const b = points[(i + 1) % points.length];
      return [
        [a[0] * 0.85 + b[0] * 0.15, a[1] * 0.85 + b[1] * 0.15],
        [a[0] * 0.15 + b[0] * 0.85, a[1] * 0.15 + b[1] * 0.85],
      ];
    });
  return points;
}
function roundedBox(width, height, radius) {
  const result = [];
  for (let corner = 0; corner < 4; corner++) {
    const angle = (corner * Math.PI) / 2;
    const cx = (corner === 0 || corner === 3 ? 1 : -1) * (width / 2 - radius);
    const cy = (corner < 2 ? 1 : -1) * (height / 2 - radius);
    for (let i = 0; i < 16; i++) {
      const a = angle + (i * Math.PI) / 30;
      result.push([cx + radius * Math.cos(a), cy + radius * Math.sin(a)]);
    }
  }
  return result;
}
function curves(start, segments) {
  const points = [];
  let from = start;
  for (const [a, b, end] of segments) {
    for (let i = 0; i < 24; i++) {
      const t = i / 24,
        u = 1 - t;
      points.push(
        [0, 1].map(
          (axis) =>
            u ** 3 * from[axis] +
            3 * u ** 2 * t * a[axis] +
            3 * u * t ** 2 * b[axis] +
            t ** 3 * end[axis],
        ),
      );
    }
    from = end;
  }
  return points;
}
function normalized(points) {
  const min = [0, 1].map((axis) => Math.min(...points.map((p) => p[axis])));
  const max = [0, 1].map((axis) => Math.max(...points.map((p) => p[axis])));
  const scale = 2 / Math.max(max[0] - min[0], max[1] - min[1]);
  return points.map((p) => [
    (p[0] - (min[0] + max[0]) / 2) * scale,
    (p[1] - (min[1] + max[1]) / 2) * scale + 0.12,
  ]);
}
export function proceduralShapes() {
  const shapes = {
    blob: polar(() => 1),
    star: soften(polygon(6, 0.64)),
    hex: polygon(6),
    heart: curves(
      [0, -0.95],
      [
        [
          [-0.25, -0.65],
          [-1, -0.1],
          [-1, 0.45],
        ],
        [
          [-1, 1.05],
          [-0.3, 1.2],
          [0, 0.65],
        ],
        [
          [0.3, 1.2],
          [1, 1.05],
          [1, 0.45],
        ],
        [
          [1, -0.1],
          [0.25, -0.65],
          [0, -0.95],
        ],
      ],
    ),
    square: roundedBox(2, 2, 0.24),
    tablet: roundedBox(2, 1.35, 0.38),
    sparkle: polar((a) => 0.48 + 0.52 * Math.abs(Math.cos(2 * a)) ** 5),
    flower: polar((a) => 0.86 + 0.14 * Math.cos(6 * (a - Math.PI / 2))),
    wedge: curves(
      [-0.95, -0.7],
      [
        [
          [-1.1, -0.7],
          [-1.05, -0.5],
          [-0.94, -0.35],
        ],
        [
          [-0.5, 0.2],
          [0.05, 0.8],
          [0.7, 1],
        ],
        [
          [0.88, 1.05],
          [1, 0.95],
          [1, 0.72],
        ],
        [
          [1, 0.2],
          [1, -0.2],
          [0.9, -0.6],
        ],
        [
          [0.85, -0.75],
          [0.65, -0.7],
          [-0.95, -0.7],
        ],
      ],
    ),
    clover: polar((a) => 0.82 + 0.18 * Math.cos(4 * (a - Math.PI / 4))),
    teardrop: curves(
      [0, 1.15],
      [
        [
          [-0.1, 0.8],
          [-0.9, 0.1],
          [-0.85, -0.45],
        ],
        [
          [-0.8, -1.2],
          [0.8, -1.2],
          [0.85, -0.45],
        ],
        [
          [0.9, 0.1],
          [0.1, 0.8],
          [0, 1.15],
        ],
      ],
    ),
    pebble: polar((a) => 1 + 0.07 * Math.sin(3 * a) + 0.04 * Math.cos(2 * a)).map(([x, y]) => [
      x,
      y * 0.82,
    ]),
    cloud: curves(
      [-1, -0.25],
      [
        [
          [-1.2, 0.2],
          [-0.85, 0.65],
          [-0.48, 0.5],
        ],
        [
          [-0.4, 1],
          [0.42, 1],
          [0.5, 0.48],
        ],
        [
          [0.9, 0.6],
          [1.2, 0.2],
          [1, -0.25],
        ],
        [
          [0.9, -0.55],
          [-0.9, -0.55],
          [-1, -0.25],
        ],
      ],
    ),
  };
  return Object.entries(shapes).map(([name, points]) => ({
    name,
    body: normalized(points),
    eyes: { width: 0.19, height: 0.44, separation: 0.55 },
  }));
}
