import { memo } from 'react';
import Svg, { Path } from 'react-native-svg';
import { legacyContours } from '../agent-avatar/legacy-contours';
import { radialContour } from '../agent-avatar/legacy-recipe';
import type { AvatarConfig } from '../agent-avatar/model';
import { CHARACTER_COLORS } from './constants';

const silhouettes = new Map<string, { path: string; viewBox: string }>();

function silhouette(config: AvatarConfig) {
  const key = JSON.stringify([
    config.family,
    config.shape,
    config.foldShape,
    config.foldDirection,
    config.foldDepth,
    config.alienShape,
  ]);
  const cached = silhouettes.get(key);
  if (cached) return cached;
  const points = radialContour(legacyContours({ ...config, grain: 0, material: 'solid' }), 128).map(
    ([x, y]) => [x, -y] as const,
  );
  const xs = points.map(([x]) => x),
    ys = points.map(([, y]) => y);
  const left = Math.min(...xs),
    top = Math.min(...ys),
    width = Math.max(...xs) - left,
    height = Math.max(...ys) - top;
  // Original catalog PNGs use a flat pink silhouette with a small clear edge.
  const padding = Math.max(width, height) * 0.025;
  const result = {
    path:
      points.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(4)} ${y.toFixed(4)}`).join(' ') + 'Z',
    viewBox: `${left - padding} ${top - padding} ${width + padding * 2} ${height + padding * 2}`,
  };
  if (silhouettes.size >= 64) silhouettes.delete(silhouettes.keys().next().value!);
  silhouettes.set(key, result);
  return result;
}

/** Shape-only selector artwork: no avatar, animation loop, or runtime request. */
export const ShapeSilhouette = memo(function ShapeSilhouette({ config }: { config: AvatarConfig }) {
  const { path, viewBox } = silhouette(config);
  return (
    <Svg
      width={56}
      height={56}
      viewBox={viewBox}
      preserveAspectRatio="xMidYMid meet"
      accessible={false}
      pointerEvents="none"
    >
      <Path d={path} fill={CHARACTER_COLORS.pink} />
    </Svg>
  );
});
