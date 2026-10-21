import { useContext, useId } from 'react';
import type { ViewStyle } from 'react-native';
import type { SurfaceStyle } from '../shapes/corner-types';
import { IS_WEB } from '../styles/platform';
import type { WebCssStyle } from '../styles/web-view-style';
import { getNativeVariableHook } from '../theme/color-scope/style-builder';
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
  allowClassRadius = radius === undefined,
  webClasses = false,
}: {
  radius?: ConcentricRadius;
  style?: ViewStyle;
  reset?: boolean;
  allowClassRadius?: boolean;
  webClasses?: boolean;
}) {
  const inherited = useContext(ConcentricContext);
  const parent = reset ? null : inherited;
  const base = parent ?? EMPTY_GEOMETRY;
  const id = `bloom-cx-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const rtl = useIsRtl();
  const useNativeVariable = getNativeVariableHook();
  // One compiled marker combines four independent corner utilities. It is not a class parser.
  const marker = Number(useNativeVariable(`--bloom-cx-${rtl ? 'r' : ''}auto-mask`)) || 0;
  const autoCorners = {
    topLeft: Boolean(marker & 1),
    topRight: Boolean(marker & 2),
    bottomRight: Boolean(marker & 4),
    bottomLeft: Boolean(marker & 8),
  };
  const hasClassRadius =
    allowClassRadius && (IS_WEB ? webClasses : Object.values(autoCorners).some(Boolean));
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
  if (hasClassRadius)
    for (const corner of CORNERS) if (autoCorners[corner]) corners[corner] = computed[corner];
  const gap = Object.fromEntries(
    SIDES.map((side) => [
      side,
      (explicit ? 0 : incoming[side]) + (padding[side] ?? 0) + (border[side] ?? 0),
    ]),
  ) as unknown as ConcentricEdges;
  const available = resolveConcentricCorners(corners, gap);
  const nativeVariables: Record<string, string | number> = Object.fromEntries(
    CORNERS.map((corner) => [`--bloom-concentric-${corner}`, px(available[corner])]),
  );
  nativeVariables['--bloom-cx-auto-mask'] = 0;
  nativeVariables['--bloom-cx-rauto-mask'] = 0;
  // A matched class marker belongs to this owner only, never its descendants.
  for (const corner of CORNERS) {
    nativeVariables[`--bloom-cx-auto-${corner}`] = 0;
    nativeVariables[`--bloom-cx-rauto-${corner}`] = 0;
  }
  for (const [key, physical] of Object.entries({
    ss: rtl ? 'topRight' : 'topLeft',
    se: rtl ? 'topLeft' : 'topRight',
    es: rtl ? 'bottomRight' : 'bottomLeft',
    ee: rtl ? 'bottomLeft' : 'bottomRight',
  }))
    nativeVariables[`--bloom-concentric-${key}`] =
      nativeVariables[`--bloom-concentric-${physical}`]!;
  if (!IS_WEB)
    return {
      context: { id, corners, gap },
      variables: {} as WebCssStyle,
      nativeVariables,
      radiusStyle: cornersStyle(hasClassRadius ? corners : computed),
      radii: logicalCorners(hasClassRadius ? corners : computed, rtl),
      hasClassRadius,
    };
  const variables: Record<string, string> = {};
  const ownSide = (kind: string, side: (typeof SIDES)[number], inline: number | undefined) =>
    inline === undefined
      ? `var(--bloom-cx-${rtl && (side === 'left' || side === 'right') ? 'r' : ''}${kind}-${side}, 0px)`
      : px(inline);
  const parentValue = (kind: string, key: string) =>
    parent ? `var(--${parent.id}-${kind}-${key}, 0px)` : '0px';
  const sideGap = (side: (typeof SIDES)[number]) =>
    `calc(${parentValue('gap', side)} + ${ownSide('margin', side, margin[side])})`;
  const selfRadius = (corner: (typeof CORNERS)[number]) => {
    const [a, b] = CORNER_SIDES[corner];
    if (base.corners[corner] >= 9999) return parentValue('radius', corner);
    return `max(0px, calc(${parentValue('radius', corner)} - min(${sideGap(a)}, ${sideGap(b)})))`;
  };
  for (const side of SIDES) {
    const inheritedGap = explicit ? '0px' : `var(--bloom-cx-publisher, ${sideGap(side)})`;
    variables[`--${id}-gap-${side}`] =
      `calc(${inheritedGap} + ${ownSide('padding', side, padding[side])} + ${ownSide('border', side, border[side])})`;
  }
  for (const corner of CORNERS) {
    const [a, b] = CORNER_SIDES[corner];
    const own =
      radius === 'concentric'
        ? selfRadius(corner)
        : explicit
          ? hasClassRadius
            ? `var(--bloom-cx-${rtl ? 'r' : ''}radius-${corner}, ${px(corners[corner])})`
            : px(corners[corner])
          : `var(--bloom-cx-${rtl ? 'r' : ''}radius-${corner}, ${parentValue('radius', corner)})`;
    variables[`--${id}-radius-${corner}`] = own;
    variables[`--bloom-cx-self-${corner}`] = selfRadius(corner);
    variables[`--bloom-concentric-${corner}`] =
      corners[corner] >= 9999 && explicit
        ? px(corners[corner])
        : `max(0px, calc(var(--${id}-radius-${corner}) - min(var(--${id}-gap-${a}), var(--${id}-gap-${b}))))`;
    nativeVariables[`--bloom-concentric-${corner}`] = px(available[corner]);
  }
  for (const [key, physical] of Object.entries({
    ss: rtl ? 'topRight' : 'topLeft',
    se: rtl ? 'topLeft' : 'topRight',
    es: rtl ? 'bottomRight' : 'bottomLeft',
    ee: rtl ? 'bottomLeft' : 'bottomRight',
  })) {
    variables[`--bloom-cx-self-${key}`] = variables[`--bloom-cx-self-${physical}`]!;
    variables[`--bloom-concentric-${key}`] = variables[`--bloom-concentric-${physical}`]!;
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
    nativeVariables,
    radiusStyle,
    radii: logicalCorners(computed, rtl),
    hasClassRadius,
  };
}
