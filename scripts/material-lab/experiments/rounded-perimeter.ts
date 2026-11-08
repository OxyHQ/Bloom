/** A cyclic start point changes dash phase without changing the rounded outline. */
export function roundedPerimeterPath(
  width: number,
  height: number,
  radius: number,
  start: number,
): string {
  'worklet';
  const r = Math.max(0, Math.min(radius, width / 2, height / 2));
  const arc = (Math.PI * r) / 2;
  // x0, y0, x1, y1, length, arc centre x/y, start angle (lines use NaN).
  const segments = [
    [r, 0, width - r, 0, width - 2 * r, 0, 0, NaN],
    [width - r, 0, width, r, arc, width - r, r, -Math.PI / 2],
    [width, r, width, height - r, height - 2 * r, 0, 0, NaN],
    [width, height - r, width - r, height, arc, width - r, height - r, 0],
    [width - r, height, r, height, width - 2 * r, 0, 0, NaN],
    [r, height, 0, height - r, arc, r, height - r, Math.PI / 2],
    [0, height - r, 0, r, height - 2 * r, 0, 0, NaN],
    [0, r, r, 0, arc, r, r, Math.PI],
  ];
  const perimeter = segments.reduce((sum, segment) => sum + segment[4]!, 0);
  if (perimeter <= 0) return '';
  let offset = ((start % perimeter) + perimeter) % perimeter;
  let first = 0;
  for (; first < segments.length - 1; first++) {
    if (segments[first]![4]! > 0 && offset < segments[first]![4]!) break;
    offset -= segments[first]![4]!;
  }
  const segment = segments[first]!;
  const fraction = segment[4]! > 0 ? offset / segment[4]! : 0;
  const isArc = Number.isFinite(segment[7]);
  const angle = segment[7]! + (fraction * Math.PI) / 2;
  const x = isArc
    ? segment[5]! + r * Math.cos(angle)
    : segment[0]! + (segment[2]! - segment[0]!) * fraction;
  const y = isArc
    ? segment[6]! + r * Math.sin(angle)
    : segment[1]! + (segment[3]! - segment[1]!) * fraction;
  let path = `M${x} ${y}`;
  for (let index = 0; index < segments.length; index++) {
    const current = segments[(first + index) % segments.length]!;
    if (current[4]! <= 0) continue;
    path += Number.isFinite(current[7])
      ? `A${r} ${r} 0 0 1 ${current[2]} ${current[3]}`
      : `L${current[2]} ${current[3]}`;
  }
  if (offset > 0) path += isArc ? `A${r} ${r} 0 0 1 ${x} ${y}` : `L${x} ${y}`;
  return `${path}Z`;
}

/** Android Path.addRoundRect(CW) starts at the lower left tangent, including radius 0. */
export function androidRoundedRectOrigin(width: number, height: number, radius: number): number {
  'worklet';
  const r = Math.max(0, Math.min(radius, width / 2, height / 2));
  return -(height - 2 * r) - (Math.PI * r) / 2;
}
