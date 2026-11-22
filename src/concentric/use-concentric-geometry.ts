import { useContext, useId } from 'react';
import type { ViewStyle } from 'react-native';
import type { SurfaceStyle } from '../shapes/corner-types';
import { IS_WEB } from '../styles/platform';
import type { WebCssStyle } from '../styles/web-view-style';
import { useIsRtl } from '../hooks/use-is-rtl';
import { ConcentricContext } from './context';
import {
  CORNERS,
  CORNER_SIDES,
  SIDES,
  EMPTY_GEOMETRY,
  cornerValues,
  cornersStyle,
  edgeValues,
  logicalCorners,
  resolveConcentricCorners,
  styledCorners,
} from './geometry';
import type { ConcentricEdges, ConcentricRadius } from './types';

const px = (value: number) => `${value}px`;
const title = (value: string) => value[0]!.toUpperCase() + value.slice(1);
/** CSS length expressions cross RN's numeric radius boundary only on web. */
const cssRadius = (value: string) => value as ViewStyle['borderRadius'];
export function useConcentricGeometry({
  radius,
  style,
  reset = false,
}: {
  radius?: ConcentricRadius;
  style?: ViewStyle;
  reset?: boolean;
}) {
  const inherited = useContext(ConcentricContext);
  const parent = reset ? null : inherited;
  const base = parent ?? EMPTY_GEOMETRY;
  const id = `bloom-cx-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const rtl = useIsRtl();
  const padding = edgeValues(style, 'padding', rtl);
  const border = edgeValues(style, 'border', rtl);
  const margin = edgeValues(style, 'margin', rtl);
  const incoming = Object.fromEntries(
    SIDES.map((side) => [side, base.gap[side] + (margin[side] ?? 0)]),
  ) as unknown as ConcentricEdges;
  const computed = resolveConcentricCorners(base.corners, incoming);
  const explicit =
    radius === 'concentric'
      ? computed
      : radius === undefined
        ? styledCorners(style, rtl)
        : cornerValues(radius);
  if (
    radius !== undefined &&
    radius !== 'concentric' &&
    typeof radius !== 'number' &&
    rtl &&
    explicit
  ) {
    [explicit.topLeft, explicit.topRight] = [explicit.topRight, explicit.topLeft];
    [explicit.bottomLeft, explicit.bottomRight] = [explicit.bottomRight, explicit.bottomLeft];
  }
  const corners = { ...(explicit ?? base.corners) };
  const gap = Object.fromEntries(
    SIDES.map((side) => [
      side,
      (explicit ? 0 : incoming[side]) + (padding[side] ?? 0) + (border[side] ?? 0),
    ]),
  ) as unknown as ConcentricEdges;
  if (!IS_WEB)
    return {
      context: { id, corners, gap },
      variables: {} as WebCssStyle,
      radiusStyle: cornersStyle(computed),
      radii: logicalCorners(computed, rtl),
    };
  const variables: Record<string, string> = {};
  const ownSide = (inline: number | undefined) => px(inline ?? 0);
  const parentValue = (kind: string, key: string) =>
    parent ? `var(--${parent.id}-${kind}-${key}, 0px)` : '0px';
  const sideGap = (side: (typeof SIDES)[number]) =>
    `calc(${parentValue('gap', side)} + ${ownSide(margin[side])})`;
  const selfRadius = (corner: (typeof CORNERS)[number]) => {
    const [a, b] = CORNER_SIDES[corner];
    if (base.corners[corner] >= 9999) return parentValue('radius', corner);
    return `max(0px, calc(${parentValue('radius', corner)} - min(${sideGap(a)}, ${sideGap(b)})))`;
  };
  for (const side of SIDES) {
    const inheritedGap = explicit ? '0px' : sideGap(side);
    variables[`--${id}-gap-${side}`] =
      `calc(${inheritedGap} + ${ownSide(padding[side])} + ${ownSide(border[side])})`;
  }
  for (const corner of CORNERS) {
    const [a, b] = CORNER_SIDES[corner];
    const own =
      radius === 'concentric'
        ? selfRadius(corner)
        : explicit
          ? px(corners[corner])
          : parentValue('radius', corner);
    variables[`--${id}-radius-${corner}`] = own;
  }
  const radiusStyle: SurfaceStyle = IS_WEB
    ? Object.fromEntries(
        CORNERS.map((corner) => [
          `border${title(corner)}Radius`,
          cssRadius(`var(--${id}-radius-${corner})`),
        ]),
      )
    : cornersStyle(computed);
  return {
    context: { id, corners, gap },
    variables: (IS_WEB ? variables : {}) as WebCssStyle,
    radiusStyle,
    radii: logicalCorners(computed, rtl),
  };
}
